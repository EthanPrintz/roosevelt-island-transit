import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';
import { suppressGhostSchedules } from '../utils/suppression';

export const NYC_FERRY_TRIP_UPDATE_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate';
export const NYC_FERRY_VEHICLE_POS_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/vehicleposition';
export const NYC_FERRY_STATIC_GTFS_URL =
	'https://nycferry.connexionz.net/rtt/public/resource/gtfs.zip';

interface VesselTelemetry {
	vesselLabel?: string;
	vesselId?: string;
	speedKnots?: number;
	vesselStatus?: 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT';
	coordinates?: { lat: number; lng: number };
	bearing?: number;
}

export class LiveFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry Live (Astoria Line)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	private tripUpdateCache: { buf: ArrayBuffer; expiresAt: number } | null = null;
	private pendingTripPromise: Promise<ArrayBuffer | null> | null = null;

	private vehiclePosCache: { buf: ArrayBuffer; expiresAt: number } | null = null;
	private pendingVehiclePromise: Promise<ArrayBuffer | null> | null = null;

	private async fetchTripUpdatesBuf(): Promise<ArrayBuffer | null> {
		const now = Date.now();
		if (this.tripUpdateCache && this.tripUpdateCache.expiresAt > now) {
			return this.tripUpdateCache.buf;
		}
		if (this.pendingTripPromise) return this.pendingTripPromise;

		this.pendingTripPromise = (async () => {
			const res = await fetch(NYC_FERRY_TRIP_UPDATE_URL).catch(() => null);
			if (res?.ok) {
				const buf = await res.arrayBuffer().catch(() => null);
				if (buf) this.tripUpdateCache = { buf, expiresAt: Date.now() + 10000 };
				return buf;
			}
			return null;
		})();

		try {
			return await this.pendingTripPromise;
		} finally {
			this.pendingTripPromise = null;
		}
	}

	private async fetchVehiclePosBuf(): Promise<ArrayBuffer | null> {
		const now = Date.now();
		if (this.vehiclePosCache && this.vehiclePosCache.expiresAt > now) {
			return this.vehiclePosCache.buf;
		}
		if (this.pendingVehiclePromise) return this.pendingVehiclePromise;

		this.pendingVehiclePromise = (async () => {
			const res = await fetch(NYC_FERRY_VEHICLE_POS_URL).catch(() => null);
			if (res?.ok) {
				const buf = await res.arrayBuffer().catch(() => null);
				if (buf) this.vehiclePosCache = { buf, expiresAt: Date.now() + 10000 };
				return buf;
			}
			return null;
		})();

		try {
			return await this.pendingVehiclePromise;
		} finally {
			this.pendingVehiclePromise = null;
		}
	}

	async getDepartures(_options?: DepartureOptions): Promise<ProviderResult<FerryDeparture>> {
		try {
			const now = new Date();
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			const windowMinutes = Math.max(60, Math.ceil((endOfDay.getTime() - now.getTime()) / 60000));

			// 1. Static GTFS schedule lookup
			let staticDepartures: ScheduledDeparture[] = [];
			try {
				await gtfsStaticStore.loadDataset('ferry', NYC_FERRY_STATIC_GTFS_URL);
				staticDepartures = gtfsStaticStore.getScheduledDepartures(
					'ferry',
					'25',
					now,
					windowMinutes,
				);
			} catch (staticErr) {
				console.warn('GTFS static store unavailable for ferry, falling back to RT-only', staticErr);
			}

			// 2. Fetch live GTFS-RT trip updates AND live vehicle telemetry (Deduplicated)
			const [tripBuf, vehicleBuf] = await Promise.all([
				this.fetchTripUpdatesBuf(),
				this.fetchVehiclePosBuf(),
			]);

			const liveUpdates = new Map<
				string,
				{ time: string; delay: number; vessel?: string; seq: number }
			>();
			const vehicleTelemetryMap = new Map<string, VesselTelemetry>();

			if (vehicleBuf) {
				try {
					const vehicleFeed = decodeGtfsRealtimeBuffer(vehicleBuf);
					for (const entity of vehicleFeed.entity) {
						if (!entity.vehicle) continue;
						const v = entity.vehicle;
						const tripId = v.trip?.tripId;
						const label = v.vehicle?.label;
						const rawSpeedMps = v.position?.speed || 0;
						const speedKnots = Math.round(rawSpeedMps * 1.94384);

						let status: 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT' = 'IN_TRANSIT_TO';
						const rawStatus = v.currentStatus as unknown;
						if (
							rawStatus === 'STOPPED_AT' ||
							rawStatus === 2 ||
							rawStatus === '2' ||
							speedKnots <= 1
						) {
							status = 'STOPPED_AT';
						} else if (rawStatus === 'INCOMING_AT' || rawStatus === 1 || rawStatus === '1') {
							status = 'INCOMING_AT';
						}

						const telemetry: VesselTelemetry = {
							vesselLabel: label,
							vesselId: v.vehicle?.id,
							speedKnots,
							vesselStatus: status,
							coordinates:
								v.position?.latitude && v.position?.longitude
									? { lat: v.position.latitude, lng: v.position.longitude }
									: undefined,
							bearing: v.position?.bearing,
						};

						if (tripId) vehicleTelemetryMap.set(`trip-${tripId}`, telemetry);
						if (label) vehicleTelemetryMap.set(`label-${label}`, telemetry);
					}
				} catch (vehErr) {
					console.warn('Failed to parse NYC Ferry vehicle position feed', vehErr);
				}
			}

			if (tripBuf) {
				try {
					const tripFeed = decodeGtfsRealtimeBuffer(tripBuf);
					for (const entity of tripFeed.entity) {
						if (!entity.tripUpdate?.stopTimeUpdate) continue;
						const tripId = entity.tripUpdate.trip.tripId;

						for (const update of entity.tripUpdate.stopTimeUpdate) {
							const stopId = String(update.stopId || '').replace(/"/g, '');
							if (stopId === '25') {
								const timeVal = update.departure?.time || update.arrival?.time;
								if (!timeVal) continue;

								const isoTime = new Date(timeVal * 1000).toISOString();
								const delaySec = update.departure?.delay || update.arrival?.delay || 0;
								const seq = update.stopSequence || 0;

								if (tripId) {
									liveUpdates.set(tripId, {
										time: isoTime,
										delay: delaySec,
										seq,
									});
								}
							}
						}
					}
				} catch (tripErr) {
					console.warn('Failed to parse NYC Ferry trip update feed', tripErr);
				}
			}

			const departures: FerryDeparture[] = [];
			const processedRtTripIds = new Set<string>();

			// 3. Process static departures
			for (const stat of staticDepartures) {
				const rt = liveUpdates.get(stat.tripId);
				const isRealtime = Boolean(rt);
				if (isRealtime) processedRtTripIds.add(stat.tripId);

				const telem =
					vehicleTelemetryMap.get(`trip-${stat.tripId}`) ||
					(rt?.vessel ? vehicleTelemetryMap.get(`label-${rt.vessel}`) : undefined);

				const predictedTime = rt ? rt.time : stat.scheduledTime;
				const delaySec = rt ? rt.delay : 0;
				const headLower = (stat.headsign || '').toLowerCase();
				const isSouthbound =
					stat.directionId === 0 || headLower.includes('wall st') || headLower.includes('pier 11');

				departures.push({
					id: `ferry-live-${stat.tripId}-${stat.stopId}`,
					mode: 'ferry',
					routeId: stat.routeId === 'AS' ? 'AST' : stat.routeId || 'AST',
					routeName: 'NYC Ferry (Astoria Line)',
					tripId: stat.tripId,
					headsign: stat.headsign || (isSouthbound ? 'Wall St / Pier 11' : 'East 90th St'),
					destinationName: isSouthbound ? 'Wall St / Pier 11' : 'East 90th St',
					direction: isSouthbound ? 'southbound' : 'northbound',
					scheduledTime: stat.scheduledTime,
					predictedTime,
					isRealtime,
					delaySeconds: delaySec,
					status: 'normal',
					stopName: 'Roosevelt Island Ferry Landing',
					stopId: stat.stopId,
					vesselName: rt?.vessel || telem?.vesselLabel,
					pierName: 'Roosevelt Island Dock',
					vesselStatus: telem?.vesselStatus,
					speedKnots: telem?.speedKnots,
					coordinates: telem?.coordinates,
					bearing: telem?.bearing,
				});
			}

			// 4. Include RT-only departures not in static GTFS
			for (const [tripId, rt] of liveUpdates.entries()) {
				if (processedRtTripIds.has(tripId)) continue;
				const telem =
					vehicleTelemetryMap.get(`trip-${tripId}`) ||
					(rt.vessel ? vehicleTelemetryMap.get(`label-${rt.vessel}`) : undefined);

				const isSouthbound = rt.seq <= 3;

				departures.push({
					id: `ferry-live-${tripId}-25`,
					mode: 'ferry',
					routeId: 'AST',
					routeName: 'NYC Ferry (Astoria Line)',
					tripId,
					headsign: isSouthbound ? 'Wall St / Pier 11' : 'East 90th St',
					destinationName: isSouthbound ? 'Wall St / Pier 11' : 'East 90th St',
					direction: isSouthbound ? 'southbound' : 'northbound',
					scheduledTime: rt.time,
					predictedTime: rt.time,
					isRealtime: true,
					delaySeconds: rt.delay,
					status: 'normal',
					stopName: 'Roosevelt Island Ferry Landing',
					stopId: '25',
					vesselName: rt.vessel || telem?.vesselLabel,
					pierName: 'Roosevelt Island Dock',
					vesselStatus: telem?.vesselStatus,
					speedKnots: telem?.speedKnots,
					coordinates: telem?.coordinates,
					bearing: telem?.bearing,
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
				isCached: Boolean(this.tripUpdateCache || this.vehiclePosCache),
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
