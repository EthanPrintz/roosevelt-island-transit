import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type {
	LiveVehiclePosition,
	ProviderResult,
	ScheduleRelationship,
	SubwayDeparture,
	TransitAlert,
	TransitMode,
} from '../domain/types';
import { suppressGhostSchedules } from '../utils/suppression';

export const MTA_BDFM_FEED_URL =
	'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm';
export const MTA_STATIC_GTFS_URL =
	'https://web.mta.info/developers/data/nyct/subway/google_transit.zip';

export class LiveSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway Live (F/M Lines)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts', 'vehicle_tracking']);

	private feedCache: { buf: ArrayBuffer; expiresAt: number } | null = null;
	private pendingFeedPromise: Promise<ArrayBuffer | null> | null = null;

	private async fetchBdfmFeedBuf(): Promise<ArrayBuffer | null> {
		const now = Date.now();
		if (this.feedCache && this.feedCache.expiresAt > now) {
			return this.feedCache.buf;
		}
		if (this.pendingFeedPromise) return this.pendingFeedPromise;

		this.pendingFeedPromise = (async () => {
			const res = await fetch(MTA_BDFM_FEED_URL).catch(() => null);
			if (res?.ok) {
				const buf = await res.arrayBuffer().catch(() => null);
				if (buf) this.feedCache = { buf, expiresAt: Date.now() + 10000 };
				return buf;
			}
			return null;
		})();

		try {
			return await this.pendingFeedPromise;
		} finally {
			this.pendingFeedPromise = null;
		}
	}

	async getDepartures(options?: DepartureOptions): Promise<ProviderResult<SubwayDeparture>> {
		try {
			const now = new Date();
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			const defaultWindow = Math.max(240, Math.ceil((endOfDay.getTime() - now.getTime()) / 60000));
			const windowMinutes = options?.windowMinutes ?? defaultWindow;

			// 1. Attempt static GTFS schedule lookup for Roosevelt Island Station (B06)
			let staticDepartures: ScheduledDeparture[] = [];
			try {
				await gtfsStaticStore.loadDataset('subway', MTA_STATIC_GTFS_URL);
				staticDepartures = gtfsStaticStore.getScheduledDepartures(
					'subway',
					'B06',
					now,
					windowMinutes,
				);
			} catch (staticErr) {
				console.warn(
					'GTFS static store unavailable for subway, falling back to RT-only',
					staticErr,
				);
			}

			// 2. Fetch live GTFS-RT feed (Deduplicated)
			const arrayBuffer = await this.fetchBdfmFeedBuf();
			const liveUpdates = new Map<
				string,
				{
					time: string;
					delay: number;
					track: string;
					stopId: string;
					scheduleRelationship: ScheduleRelationship;
					originStartTime?: string;
					routeId: 'F' | 'M';
				}
			>();

			if (arrayBuffer) {
				try {
					const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

					for (const entity of feed.entity) {
						if (!entity.tripUpdate?.stopTimeUpdate) continue;
						const trip = entity.tripUpdate.trip;
						const tripId = trip.tripId;

						let rel: ScheduleRelationship = 'SCHEDULED';
						if (trip.scheduleRelationship === 'ADDED') rel = 'ADDED';
						else if (trip.scheduleRelationship === 'CANCELED') rel = 'CANCELED';
						else if (trip.scheduleRelationship === 'UNSCHEDULED') rel = 'UNSCHEDULED';

						const originStartTime = trip.startTime || undefined;
						const rawRoute = (trip.routeId || 'F').toUpperCase();
						const routeId: 'F' | 'M' = rawRoute === 'M' ? 'M' : 'F';

						for (const update of entity.tripUpdate.stopTimeUpdate) {
							const stopId = String(update.stopId || '').replace(/"/g, '');
							if (stopId.startsWith('B06')) {
								const timeVal = update.departure?.time || update.arrival?.time;
								if (!timeVal) continue;
								const isoTime = new Date(timeVal * 1000).toISOString();
								const delaySec = update.departure?.delay || update.arrival?.delay || 0;
								const track = stopId.endsWith('N') ? 'Uptown' : 'Downtown';

								if (tripId) {
									liveUpdates.set(tripId, {
										time: isoTime,
										delay: delaySec,
										track,
										stopId,
										scheduleRelationship: rel,
										originStartTime,
										routeId,
									});
								}
							}
						}
					}
				} catch (subErr) {
					console.warn('Failed to decode GTFS realtime buffer for subway', subErr);
				}
			}

			const departures: SubwayDeparture[] = [];
			const processedRtTripIds = new Set<string>();

			// Helper to match live GTFS-RT trip IDs to static GTFS trip IDs
			const matchLiveUpdate = (staticTripId: string) => {
				const exactData = liveUpdates.get(staticTripId);
				if (exactData) {
					return { data: exactData, rtTripId: staticTripId };
				}
				for (const [rtTripId, data] of liveUpdates.entries()) {
					if (
						rtTripId.length >= 4 &&
						(staticTripId.endsWith(rtTripId) || rtTripId.endsWith(staticTripId))
					) {
						return { data, rtTripId };
					}
				}
				return null;
			};

			// 3. Process static departures & overlay live updates
			for (const stat of staticDepartures) {
				const match = matchLiveUpdate(stat.tripId);
				const isRealtime = Boolean(match);
				if (match) {
					processedRtTripIds.add(match.rtTripId);
				}

				const rt = match?.data;
				const predictedTime = rt ? rt.time : stat.scheduledTime;
				const delaySec = rt ? rt.delay : 0;
				const isNorthbound = stat.stopId.endsWith('N') || (rt ? rt.track === 'Uptown' : false);
				const rel = rt ? rt.scheduleRelationship : 'SCHEDULED';
				const routeId: 'F' | 'M' = (rt?.routeId || stat.routeId || 'F') === 'M' ? 'M' : 'F';
				const routeName = routeId === 'M' ? 'M Train' : 'F Train';

				departures.push({
					id: `subway-live-${stat.tripId}-${stat.stopId}`,
					mode: 'subway',
					routeId,
					routeName,
					tripId: stat.tripId,
					headsign: isNorthbound
						? routeId === 'M'
							? 'Forest Hills / 71 Av'
							: 'Queens / Jamaica 179 St'
						: routeId === 'M'
							? 'Middle Village / Metropolitan Av'
							: 'Manhattan / Coney Island',
					destinationName: isNorthbound ? 'Queens' : 'Manhattan',
					direction: isNorthbound ? 'queens_bound' : 'manhattan_bound',
					scheduledTime: stat.scheduledTime,
					predictedTime,
					isRealtime,
					delaySeconds: delaySec,
					scheduleRelationship: rel,
					status: delaySec > 180 ? 'delays' : rel === 'CANCELED' ? 'suspended' : 'normal',
					stopName: 'Roosevelt Island Station',
					stopId: stat.stopId,
					track: isNorthbound ? 'Uptown' : 'Downtown',
					isShuttle: false,
					originStartTime: rt?.originStartTime,
				});
			}

			// 4. Include any real-time unscheduled/added trips not in static schedule
			for (const [tripId, rt] of liveUpdates.entries()) {
				if (processedRtTripIds.has(tripId)) continue;
				const isNorthbound = rt.track === 'Uptown';
				const routeId: 'F' | 'M' = rt.routeId === 'M' ? 'M' : 'F';
				const routeName = routeId === 'M' ? 'M Train' : 'F Train';

				departures.push({
					id: `subway-live-${tripId}-${rt.stopId}`,
					mode: 'subway',
					routeId,
					routeName,
					tripId,
					headsign: isNorthbound
						? routeId === 'M'
							? 'Forest Hills / 71 Av'
							: 'Queens / Jamaica 179 St'
						: routeId === 'M'
							? 'Middle Village / Metropolitan Av'
							: 'Manhattan / Coney Island',
					destinationName: isNorthbound ? 'Queens' : 'Manhattan',
					direction: isNorthbound ? 'queens_bound' : 'manhattan_bound',
					scheduledTime: rt.time,
					predictedTime: rt.time,
					isRealtime: true,
					delaySeconds: rt.delay,
					scheduleRelationship: rt.scheduleRelationship,
					status: rt.scheduleRelationship === 'CANCELED' ? 'suspended' : 'normal',
					stopName: 'Roosevelt Island Station',
					stopId: rt.stopId,
					track: isNorthbound ? 'Uptown' : 'Downtown',
					isShuttle: false,
					originStartTime: rt.originStartTime,
				});
			}

			// 5. Dynamic Active Horizon Suppression
			const filteredDepartures = suppressGhostSchedules(departures);

			return {
				data: filteredDepartures.sort(
					(a, b) =>
						new Date(a.predictedTime || a.scheduledTime).getTime() -
						new Date(b.predictedTime || b.scheduledTime).getTime(),
				),
				fetchedAt: new Date().toISOString(),
				isCached: Boolean(this.feedCache),
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: String(err),
			};
		}
	}

	async getAlerts(): Promise<ProviderResult<TransitAlert>> {
		return {
			data: [],
			fetchedAt: new Date().toISOString(),
			isCached: false,
		};
	}

	async getVehicles(): Promise<ProviderResult<LiveVehiclePosition>> {
		try {
			const arrayBuffer = await this.fetchBdfmFeedBuf();
			const vehicles: LiveVehiclePosition[] = [];

			if (arrayBuffer) {
				const feed = decodeGtfsRealtimeBuffer(arrayBuffer);
				const now = Date.now();

				for (const entity of feed.entity) {
					if (!entity.tripUpdate?.stopTimeUpdate) continue;
					const trip = entity.tripUpdate.trip;
					const tripId = trip.tripId;
					if (!tripId) continue;

					const routeRaw = (trip.routeId || 'F').toUpperCase();
					if (routeRaw !== 'F' && routeRaw !== 'M') continue;
					const routeId: 'F' | 'M' = routeRaw === 'M' ? 'M' : 'F';

					let currentOrNextStopId = '';
					let nextStopName = '';
					let closestDiff = Infinity;
					let isNorthbound = false;

					for (const update of entity.tripUpdate.stopTimeUpdate) {
						const stopId = String(update.stopId || '').replace(/"/g, '');
						const baseStopId = stopId.replace(/[NS]$/, '');

						if (SUBWAY_STATION_COORDS[baseStopId]) {
							const timeVal = update.departure?.time || update.arrival?.time;
							if (!timeVal) continue;
							const diff = Math.abs(timeVal * 1000 - now);

							if (diff < closestDiff && diff < 15 * 60 * 1000) {
								closestDiff = diff;
								currentOrNextStopId = baseStopId;
								nextStopName = SUBWAY_STATION_NAMES[baseStopId] || 'Roosevelt Island';
								isNorthbound = stopId.endsWith('N');
							}
						}
					}

					if (currentOrNextStopId && SUBWAY_STATION_COORDS[currentOrNextStopId]) {
						const [lng, lat] = SUBWAY_STATION_COORDS[currentOrNextStopId];
						const bearing = getSubwayTrackBearing(currentOrNextStopId, isNorthbound);

						vehicles.push({
							id: `subway-vehicle-${routeId}-${tripId}`,
							mode: 'subway',
							routeId,
							vehicleId: tripId.slice(-4),
							lat,
							lng,
							bearing,
							direction: isNorthbound ? 'queens_bound' : 'manhattan_bound',
							nextStopName,
							updatedAt: new Date().toISOString(),
						});
					}
				}
			}

			return {
				data: vehicles,
				fetchedAt: new Date().toISOString(),
				isCached: Boolean(this.feedCache),
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: String(err),
			};
		}
	}
}

const SUBWAY_STATION_COORDS: Record<string, [number, number]> = {
	B06: [-73.953438, 40.759188],
	B04: [-73.9423, 40.7547],
	F11: [-73.9661, 40.7646],
	F12: [-73.9774, 40.7629],
	F14: [-73.9813, 40.7587],
	F15: [-73.9877, 40.7496],
	B08: [-73.9298, 40.7523],
};

const SUBWAY_STATION_NAMES: Record<string, string> = {
	B06: 'Roosevelt Island Station',
	B04: '21 St - Queensbridge',
	F11: 'Lexington Ave / 63rd St',
	F12: '57th St / 6th Ave',
	F14: '47-50th Sts Rockefeller Ctr',
	F15: '34th St Herald Sq',
	B08: '36th St (Queens)',
};

/**
 * Calculates forward azimuth bearing in degrees (0-360) between two coordinates
 */
export function calculateAzimuth(from: [number, number], to: [number, number]): number {
	const [lon1, lat1] = from.map((d) => (d * Math.PI) / 180);
	const [lon2, lat2] = to.map((d) => (d * Math.PI) / 180);

	const dLon = lon2 - lon1;
	const y = Math.sin(dLon) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

	const rad = Math.atan2(y, x);
	const deg = (rad * 180) / Math.PI;
	return Math.round((deg + 360) % 360);
}

// 63rd St Line Station Sequence from South to North (Manhattan -> Queens)
const SUBWAY_STATION_SEQUENCE = ['F15', 'F14', 'F12', 'F11', 'B06', 'B04', 'B08'];

function getSubwayTrackBearing(stopId: string, isNorthbound: boolean): number {
	const baseStopId = stopId.replace(/[NS]$/, '');
	const idx = SUBWAY_STATION_SEQUENCE.indexOf(baseStopId);

	if (idx !== -1) {
		const targetIdx = isNorthbound
			? Math.min(SUBWAY_STATION_SEQUENCE.length - 1, idx + 1)
			: Math.max(0, idx - 1);
		const fromStop = isNorthbound ? baseStopId : SUBWAY_STATION_SEQUENCE[targetIdx];
		const toStop = isNorthbound ? SUBWAY_STATION_SEQUENCE[targetIdx] : baseStopId;

		const fromCoords = SUBWAY_STATION_COORDS[fromStop];
		const toCoords = SUBWAY_STATION_COORDS[toStop];

		if (
			fromCoords &&
			toCoords &&
			(fromCoords[0] !== toCoords[0] || fromCoords[1] !== toCoords[1])
		) {
			let bearing = calculateAzimuth(fromCoords, toCoords);
			if (!isNorthbound) bearing = (bearing + 180) % 360;
			return bearing;
		}
	}

	return isNorthbound ? 45 : 225;
}
