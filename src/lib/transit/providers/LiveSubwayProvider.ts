import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, SubwayDeparture, TransitAlert, TransitMode } from '../domain/types';
import { MockSubwayProvider } from './MockSubwayProvider';

export const MTA_SUBWAY_BDFM_URL =
	'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm';

/**
 * LiveSubwayProvider
 *
 * Fetches real-time GTFS-RT Protobuf feed from MTA for F/M subway lines.
 * Filters for Roosevelt Island Station (Stop ID B29N / B29S).
 * Falls back to MockSubwayProvider on network error.
 */
export class LiveSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway Live (F/M Trains)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);
	private fallback = new MockSubwayProvider();

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

				// We care about F and M trains at Roosevelt Island (B29)
				if (routeId !== 'F' && routeId !== 'M') continue;

				for (const update of entity.tripUpdate.stopTimeUpdate) {
					const stopId = update.stopId || '';
					if (!stopId.startsWith('B29')) continue;

					const isUptown = stopId.endsWith('N');
					const timeVal = update.departure?.time || update.arrival?.time;
					if (!timeVal) continue;

					const isoTime = new Date(timeVal * 1000).toISOString();
					const isMShuttle = routeId === 'M' && isUptown;

					departures.push({
						id: `subway-live-${trip.tripId || Math.random()}-${stopId}`,
						mode: 'subway',
						routeId: routeId as 'F' | 'M',
						routeName: `${routeId} Train`,
						tripId: trip.tripId,
						headsign: isUptown
							? routeId === 'F'
								? 'Jamaica - 179 St'
								: 'Forest Hills - 71 Ave via 63rd St'
							: 'Coney Island - Stillwell Ave',
						destinationName: isUptown ? 'Queens' : 'Manhattan',
						direction: isUptown ? 'queens_bound' : 'manhattan_bound',
						scheduledTime: isoTime,
						predictedTime: isoTime,
						isRealtime: true,
						delaySeconds: update.departure?.delay || 0,
						status: isMShuttle ? 'rerouted' : 'normal',
						stopName: 'Roosevelt Island Station B29',
						stopId,
						track: isUptown ? 'Uptown' : 'Downtown',
						isShuttle: isMShuttle,
					});
				}
			}

			if (departures.length === 0) {
				return this.fallback.getDepartures();
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
		} catch (_err) {
			return this.fallback.getDepartures();
		}
	}

	async getAlerts(): Promise<ProviderResult<TransitAlert>> {
		return this.fallback.getAlerts();
	}
}
