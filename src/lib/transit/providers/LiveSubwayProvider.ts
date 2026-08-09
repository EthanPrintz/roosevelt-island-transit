import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, SubwayDeparture, TransitAlert, TransitMode } from '../domain/types';

export const MTA_BDFM_FEED_URL =
	'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm';
export const MTA_STATIC_GTFS_URL =
	'https://web.mta.info/developers/data/nyct/subway/google_transit.zip';

/**
 * LiveSubwayProvider
 *
 * Hybrid GTFS engine that combines static MTA Subway schedules (stop ID B06)
 * with live real-time GTFS-RT Protobuf updates from MTA BDFM feed.
 */
export class LiveSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway Live (F/M Lines)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<SubwayDeparture>> {
		try {
			const now = new Date();

			// 1. Attempt static GTFS schedule lookup for Roosevelt Island Station (B06)
			let staticDepartures: ScheduledDeparture[] = [];
			try {
				await gtfsStaticStore.loadDataset('subway', MTA_STATIC_GTFS_URL);
				staticDepartures = gtfsStaticStore.getScheduledDepartures('subway', 'B06', now, 120);
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
				{ time: string; delay: number; track: string; stopId: string }
			>();

			if (res.ok) {
				const arrayBuffer = await res.arrayBuffer();
				const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

				for (const entity of feed.entity) {
					if (!entity.tripUpdate?.stopTimeUpdate) continue;
					const tripId = entity.tripUpdate.trip.tripId;

					for (const update of entity.tripUpdate.stopTimeUpdate) {
						const stopId = String(update.stopId || '').replace(/"/g, '');
						if (stopId.startsWith('B06')) {
							const timeVal = update.departure?.time || update.arrival?.time;
							if (!timeVal) continue;
							const isoTime = new Date(timeVal * 1000).toISOString();
							const delaySec = update.departure?.delay || update.arrival?.delay || 0;
							const track = stopId.endsWith('N') ? 'Uptown' : 'Downtown';

							if (tripId) {
								liveUpdates.set(tripId, { time: isoTime, delay: delaySec, track, stopId });
							}
						}
					}
				}
			}

			const departures: SubwayDeparture[] = [];
			const processedTripIds = new Set<string>();

			// 3. Process static departures & overlay live updates
			for (const stat of staticDepartures) {
				processedTripIds.add(stat.tripId);

				const rt = liveUpdates.get(stat.tripId);
				const isRealtime = Boolean(rt);
				const predictedTime = rt ? rt.time : stat.scheduledTime;
				const delaySec = rt ? rt.delay : 0;
				const isNorthbound = stat.stopId.endsWith('N') || (rt ? rt.track === 'Uptown' : false);

				departures.push({
					id: `subway-live-${stat.tripId}-${stat.stopId}`,
					mode: 'subway',
					routeId: (stat.routeId as 'F' | 'M') || 'F',
					routeName: stat.routeId === 'M' ? 'M Train' : 'F Train',
					tripId: stat.tripId,
					headsign: isNorthbound ? 'Queens / Jamaica 179 St' : 'Manhattan / Coney Island',
					destinationName: isNorthbound ? 'Queens' : 'Manhattan',
					direction: isNorthbound ? 'queens_bound' : 'manhattan_bound',
					scheduledTime: stat.scheduledTime,
					predictedTime,
					isRealtime,
					delaySeconds: delaySec,
					status: delaySec > 180 ? 'delays' : 'normal',
					stopName: 'Roosevelt Island Station',
					stopId: stat.stopId,
					track: isNorthbound ? 'Uptown' : 'Downtown',
					isShuttle: false,
				});
			}

			// 4. Include any real-time unscheduled/added trips not in static schedule
			for (const [tripId, rt] of liveUpdates.entries()) {
				if (processedTripIds.has(tripId)) continue;
				const isNorthbound = rt.track === 'Uptown';

				departures.push({
					id: `subway-live-${tripId}-${rt.stopId}`,
					mode: 'subway',
					routeId: 'F',
					routeName: 'F Train',
					tripId,
					headsign: isNorthbound ? 'Queens / Jamaica 179 St' : 'Manhattan / Coney Island',
					destinationName: isNorthbound ? 'Queens' : 'Manhattan',
					direction: isNorthbound ? 'queens_bound' : 'manhattan_bound',
					scheduledTime: rt.time,
					predictedTime: rt.time,
					isRealtime: true,
					delaySeconds: rt.delay,
					status: 'normal',
					stopName: 'Roosevelt Island Station',
					stopId: rt.stopId,
					track: rt.track as 'Uptown' | 'Downtown',
					isShuttle: false,
				});
			}

			return {
				data: departures.sort(
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
