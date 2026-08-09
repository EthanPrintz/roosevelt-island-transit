import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type {
	ProviderResult,
	ScheduleRelationship,
	SubwayDeparture,
	TransitAlert,
	TransitMode,
} from '../domain/types';

export const MTA_BDFM_FEED_URL =
	'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm';
export const MTA_STATIC_GTFS_URL =
	'https://web.mta.info/developers/data/nyct/subway/google_transit.zip';
export const SUBWAY_ACTIVE_HORIZON_MINUTES = 30;

/**
 * LiveSubwayProvider
 *
 * Hybrid GTFS engine that combines static MTA Subway schedules (stop ID B06)
 * with live real-time GTFS-RT Protobuf updates from MTA BDFM feed.
 * Features Smart Active Horizon Suppression (30m) to eliminate ghost timetable entries.
 */
export class LiveSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway Live (F/M Lines)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

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

			// 2. Fetch live GTFS-RT feed
			const res = await fetch(MTA_BDFM_FEED_URL);
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

			if (res.ok) {
				const arrayBuffer = await res.arrayBuffer();
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
					if (staticTripId.endsWith(rtTripId) || staticTripId.includes(rtTripId)) {
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
					track: rt.track as 'Uptown' | 'Downtown',
					isShuttle: false,
					originStartTime: rt.originStartTime,
				});
			}

			// 5. Dynamic Active Horizon & Proximity Shift Suppression Engine & Stale Trip Filtering
			let maxRealtimeMsQueensBound = 0;
			let maxRealtimeMsManhattanBound = 0;

			for (const dep of departures) {
				if (!dep.isRealtime) continue;
				const timeMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
				if (dep.direction === 'queens_bound') {
					if (timeMs > maxRealtimeMsQueensBound) maxRealtimeMsQueensBound = timeMs;
				} else {
					if (timeMs > maxRealtimeMsManhattanBound) maxRealtimeMsManhattanBound = timeMs;
				}
			}

			const filteredDepartures = departures.filter((dep) => {
				const arrivalMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
				const diffMins = (arrivalMs - now.getTime()) / 60000;

				// Discard any past departures that left more than 2 minutes ago
				if (diffMins < -2) return false;

				if (dep.isRealtime) return true; // Always keep live tracked departures

				const maxLiveMs =
					dep.direction === 'queens_bound' ? maxRealtimeMsQueensBound : maxRealtimeMsManhattanBound;

				// Dynamic Active Horizon Suppression: Suppress any static timetable entry
				// scheduled earlier than or at the furthest live tracked departure in that direction
				if (maxLiveMs > 0 && arrivalMs <= maxLiveMs) {
					return false;
				}

				// Fallback horizon suppression: suppress static entries within 30 minutes if live updates exist
				if (liveUpdates.size > 0 && diffMins <= SUBWAY_ACTIVE_HORIZON_MINUTES) {
					return false;
				}

				// Proximity suppression: suppress static entry if a live RT trip exists within ±7 mins on the same track
				if (liveUpdates.size > 0) {
					for (const rtTrip of liveUpdates.values()) {
						const rtTimeMs = new Date(rtTrip.time).getTime();
						const timeDiffMins = Math.abs(arrivalMs - rtTimeMs) / 60000;
						const sameTrack =
							(dep.track === 'Uptown' && rtTrip.track === 'Uptown') ||
							(dep.track === 'Downtown' && rtTrip.track === 'Downtown');
						if (sameTrack && timeDiffMins <= 7) {
							return false;
						}
					}
				}

				return true;
			});

			return {
				data: filteredDepartures.sort(
					(a, b) =>
						new Date(a.predictedTime || a.scheduledTime).getTime() -
						new Date(b.predictedTime || b.scheduledTime).getTime(),
				),
				fetchedAt: new Date().toISOString(),
				isCached: false,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: err instanceof Error ? err.message : String(err),
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
}
