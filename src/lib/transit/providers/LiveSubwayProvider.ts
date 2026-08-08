import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, SubwayDeparture, TransitAlert, TransitMode } from '../domain/types';

export const MTA_SUBWAY_BDFM_URL =
	'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm';

/**
 * LiveSubwayProvider
 *
 * Fetches real-time GTFS-RT Protobuf feed from MTA for F/M subway lines.
 * Filters for Roosevelt Island Station (GTFS Stop ID B06N / B06S).
 */
export class LiveSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway Live (F/M Trains)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<SubwayDeparture>> {
		try {
			const res = await fetch(MTA_SUBWAY_BDFM_URL, {
				headers: { Accept: 'application/x-protobuf' },
			});

			if (!res.ok) {
				throw new Error(`MTA API returned status ${res.status}`);
			}

			const arrayBuffer = await res.arrayBuffer();
			const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

			const departures: SubwayDeparture[] = [];

			for (const entity of feed.entity) {
				if (!entity.tripUpdate?.stopTimeUpdate) continue;

				const trip = entity.tripUpdate.trip;
				const routeId = (trip.routeId || '').toUpperCase();

				for (const update of entity.tripUpdate.stopTimeUpdate) {
					const stopId = update.stopId || '';
					// Roosevelt Island GTFS Station ID is B06 (B06N = Uptown/Queens, B06S = Downtown/Manhattan)
					if (!stopId.startsWith('B06')) continue;

					const isUptown = stopId.endsWith('N');
					const timeVal = update.departure?.time || update.arrival?.time;
					if (!timeVal) continue;

					const isoTime = new Date(timeVal * 1000).toISOString();
					const isMShuttle = routeId === 'M' && isUptown;

					departures.push({
						id: `subway-live-${trip.tripId || Math.random()}-${stopId}`,
						mode: 'subway',
						routeId: routeId === 'M' ? 'M' : 'F',
						routeName: `${routeId || 'F'} Train`,
						tripId: trip.tripId,
						headsign: isUptown
							? routeId === 'F'
								? 'Queens / Jamaica 179 St'
								: 'Forest Hills - 71 Ave via 63rd St'
							: 'Manhattan / Coney Island',
						destinationName: isUptown ? 'Queens' : 'Manhattan',
						direction: isUptown ? 'queens_bound' : 'manhattan_bound',
						scheduledTime: isoTime,
						predictedTime: isoTime,
						isRealtime: true,
						delaySeconds: update.departure?.delay || 0,
						status: isMShuttle ? 'rerouted' : 'normal',
						stopName: 'Roosevelt Island Station',
						stopId,
						track: isUptown ? 'Uptown' : 'Downtown',
						isShuttle: isMShuttle,
					});
				}
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
