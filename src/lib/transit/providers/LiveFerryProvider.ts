import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const NYC_FERRY_TRIP_UPDATE_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate';
export const NYC_FERRY_STATIC_GTFS_URL =
	'http://nycferry.connexionz.net/rtt/public/resource/gtfs.zip';

/**
 * LiveFerryProvider
 *
 * Hybrid GTFS engine that combines static NYC Ferry schedules (stop ID 25)
 * with live real-time GTFS-RT Protobuf telemetry from Connexionz.
 */
export class LiveFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry Live (Astoria Line)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<FerryDeparture>> {
		try {
			const now = new Date();

			// 1. Attempt static GTFS schedule lookup for Roosevelt Island Landing (25)
			let staticDepartures: ScheduledDeparture[] = [];
			try {
				await gtfsStaticStore.loadDataset('ferry', NYC_FERRY_STATIC_GTFS_URL);
				staticDepartures = gtfsStaticStore.getScheduledDepartures('ferry', '25', now, 120);
			} catch (staticErr) {
				console.warn('GTFS static store unavailable for ferry, falling back to RT-only', staticErr);
			}

			// 2. Fetch live GTFS-RT feed
			const res = await fetch(NYC_FERRY_TRIP_UPDATE_URL);
			const liveUpdates = new Map<
				string,
				{ time: string; delay: number; vessel?: string; seq: number }
			>();

			if (res.ok) {
				const arrayBuffer = await res.arrayBuffer();
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
			}

			const departures: FerryDeparture[] = [];
			const processedTripIds = new Set<string>();

			// 3. Process static departures & overlay live updates
			for (const stat of staticDepartures) {
				processedTripIds.add(stat.tripId);

				const rt = liveUpdates.get(stat.tripId);
				const isRealtime = Boolean(rt);
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
					vesselName: rt?.vessel || undefined,
					pierName: 'Roosevelt Island Dock',
				});
			}

			// 4. Include any real-time unscheduled/added trips not in static schedule
			for (const [tripId, rt] of liveUpdates.entries()) {
				if (processedTripIds.has(tripId)) continue;
				const isSouthbound = rt.seq <= 3;

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
					vesselName: rt.vessel || undefined,
					pierName: 'Roosevelt Island Dock',
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
