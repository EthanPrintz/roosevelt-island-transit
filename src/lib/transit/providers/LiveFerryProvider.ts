import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const NYC_FERRY_TRIP_UPDATE_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate';
export const NYC_FERRY_VEHICLE_POS_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/vehicleposition';
export const NYC_FERRY_STATIC_GTFS_URL =
	'http://nycferry.connexionz.net/rtt/public/resource/gtfs.zip';
export const FERRY_ACTIVE_HORIZON_MINUTES = 20;

interface VesselTelemetry {
	vesselLabel?: string;
	vesselId?: string;
	speedKnots?: number;
	vesselStatus?: 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT';
	coordinates?: { lat: number; lng: number };
	bearing?: number;
}

/**
 * LiveFerryProvider
 *
 * Hybrid GTFS engine that combines static NYC Ferry schedules (stop ID 25)
 * with live real-time GTFS-RT Protobuf trip updates and vehicle telemetry from Connexionz.
 * Features Smart Active Horizon Suppression (20m) to eliminate ghost ferry entries.
 */
export class LiveFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry Live (Astoria Line)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(_options?: DepartureOptions): Promise<ProviderResult<FerryDeparture>> {
		try {
			const now = new Date();
			// Ferry shows all remaining trips for today (from now until end of day)
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			const windowMinutes = Math.max(60, Math.ceil((endOfDay.getTime() - now.getTime()) / 60000));

			// 1. Attempt static GTFS schedule lookup for Roosevelt Island Landing (25)
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

			// 2. Fetch live GTFS-RT trip updates AND live vehicle telemetry concurrently
			const [tripRes, vehicleRes] = await Promise.all([
				fetch(NYC_FERRY_TRIP_UPDATE_URL).catch(() => null),
				fetch(NYC_FERRY_VEHICLE_POS_URL).catch(() => null),
			]);

			const liveUpdates = new Map<
				string,
				{ time: string; delay: number; vessel?: string; seq: number }
			>();
			const vehicleTelemetryMap = new Map<string, VesselTelemetry>(); // Keyed by tripId and vesselLabel

			if (vehicleRes?.ok) {
				try {
					const vehicleBuf = await vehicleRes.arrayBuffer();
					const vehicleFeed = decodeGtfsRealtimeBuffer(vehicleBuf);

					for (const entity of vehicleFeed.entity) {
						if (!entity.vehicle) continue;
						const v = entity.vehicle;
						const tripId = v.trip?.tripId;
						const label = v.vehicle?.label;
						const rawSpeedMps = v.position?.speed || 0;
						const speedKnots = Math.round(rawSpeedMps * 1.94384); // m/s to knots

						let status: 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT' = 'IN_TRANSIT_TO';
						if (v.currentStatus === 'STOPPED_AT') status = 'STOPPED_AT';
						else if (v.currentStatus === 'INCOMING_AT') status = 'INCOMING_AT';

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

			if (tripRes?.ok) {
				try {
					const arrayBuffer = await tripRes.arrayBuffer();
					const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

					for (const entity of feed.entity) {
						if (!entity.tripUpdate?.stopTimeUpdate) continue;
						const tripId = entity.tripUpdate.trip.tripId;
						const vehicleLabel = entity.tripUpdate.vehicle?.label;

						for (const update of entity.tripUpdate.stopTimeUpdate) {
							const stopId = String(update.stopId || '').replace(/"/g, '');
							if (stopId === '25') {
								const timeVal = update.arrival?.time || update.departure?.time;
								if (!timeVal) continue;
								const isoTime = new Date(timeVal * 1000).toISOString();
								const delaySec = update.arrival?.delay || update.departure?.delay || 0;
								const seq = update.stopSequence || 0;

								if (tripId) {
									liveUpdates.set(tripId, {
										time: isoTime,
										delay: delaySec,
										vessel: vehicleLabel,
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
			const processedTripIds = new Set<string>();

			// 3. Process static departures & overlay live updates + vehicle telemetry
			for (const stat of staticDepartures) {
				processedTripIds.add(stat.tripId);

				const rt = liveUpdates.get(stat.tripId);
				const vesselLabel = rt?.vessel;
				const telem =
					vehicleTelemetryMap.get(`trip-${stat.tripId}`) ||
					(vesselLabel ? vehicleTelemetryMap.get(`label-${vesselLabel}`) : undefined);
				const isRealtime = Boolean(rt || telem);
				const predictedTime = rt ? rt.time : stat.scheduledTime;
				const delaySec = rt ? rt.delay : 0;
				const isSouthbound = stat.directionId === 0 || stat.headsign.toLowerCase().includes('wall');

				departures.push({
					id: `ferry-live-${stat.tripId}-${stat.stopId}`,
					mode: 'ferry',
					routeId: 'AST',
					routeName: 'NYC Ferry - Astoria Line',
					tripId: stat.tripId,
					headsign: isSouthbound
						? 'Wall St / Pier 11 via LIC & E 34th St'
						: 'East 90th St / Upper East Side',
					destinationName: isSouthbound ? 'Wall St / Pier 11' : 'E 90th St',
					direction: isSouthbound ? 'southbound' : 'northbound',
					scheduledTime: stat.scheduledTime,
					predictedTime,
					isRealtime,
					delaySeconds: delaySec,
					status: delaySec > 180 ? 'delays' : 'normal',
					stopName: 'Roosevelt Island Ferry Landing',
					stopId: stat.stopId,
					vesselName: vesselLabel || telem?.vesselLabel,
					pierName: 'Roosevelt Island Dock',
					vesselStatus: telem?.vesselStatus,
					speedKnots: telem?.speedKnots,
					coordinates: telem?.coordinates,
					bearing: telem?.bearing,
				});
			}

			// 4. Include any real-time unscheduled/added trips not in static schedule
			for (const [tripId, rt] of liveUpdates.entries()) {
				if (processedTripIds.has(tripId)) continue;
				const isSouthbound = rt.seq <= 3;
				const telem =
					vehicleTelemetryMap.get(`trip-${tripId}`) ||
					(rt.vessel ? vehicleTelemetryMap.get(`label-${rt.vessel}`) : undefined);

				departures.push({
					id: `ferry-live-${tripId}-25`,
					mode: 'ferry',
					routeId: 'AST',
					routeName: 'NYC Ferry - Astoria Line',
					tripId,
					headsign: isSouthbound
						? 'Wall St / Pier 11 via LIC & E 34th St'
						: 'East 90th St / Upper East Side',
					destinationName: isSouthbound ? 'Wall St / Pier 11' : 'E 90th St',
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

			// 5. Smart Active Horizon Suppression Engine & Stale Trip Filtering
			const filteredDepartures = departures.filter((dep) => {
				const arrivalMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
				const diffMins = (arrivalMs - now.getTime()) / 60000;

				// Discard any past departures that left more than 2 minutes ago
				if (diffMins < -2) return false;

				if (dep.isRealtime) return true;

				if (liveUpdates.size > 0) {
					// Suppress un-tracked static entries arriving within active 20-minute horizon
					if (diffMins <= FERRY_ACTIVE_HORIZON_MINUTES) {
						return false;
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
