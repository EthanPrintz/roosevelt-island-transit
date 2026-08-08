import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const NYC_FERRY_TRIP_UPDATE_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate';

/**
 * LiveFerryProvider
 *
 * Fetches real-time GTFS-RT Protobuf feeds directly from NYC Ferry (Connexionz engine).
 * 100% Pure API driven. Prefers arrival.time over departure.time to avoid live clock creeping while docked.
 */
export class LiveFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry Live (Astoria Line)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<FerryDeparture>> {
		try {
			const res = await fetch(NYC_FERRY_TRIP_UPDATE_URL);
			if (!res.ok) {
				throw new Error(`NYC Ferry API returned status ${res.status}`);
			}

			const arrayBuffer = await res.arrayBuffer();
			const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

			const departures: FerryDeparture[] = [];
			const nowMs = Date.now();

			for (const entity of feed.entity) {
				if (!entity.tripUpdate?.stopTimeUpdate) continue;

				const trip = entity.tripUpdate.trip;
				const vehicleLabel = entity.tripUpdate.vehicle?.label;

				for (const update of entity.tripUpdate.stopTimeUpdate) {
					const stopId = String(update.stopId || '').replace(/"/g, '');

					// Stop ID 25 is Roosevelt Island Ferry Landing
					if (stopId !== '25') continue;

					// Prefer arrival.time over departure.time to avoid live clock creeping while docked
					const timeVal = update.arrival?.time || update.departure?.time;
					if (!timeVal) continue;

					const depMs = timeVal * 1000;
					// Filter out arrivals that occurred more than 2 minutes ago
					if (depMs < nowMs - 120000) continue;

					const isoTime = new Date(depMs).toISOString();
					const seq = update.stopSequence || 0;
					const isSouthbound = seq <= 3;

					departures.push({
						id: `ferry-live-${trip.tripId || Math.random()}-${stopId}`,
						mode: 'ferry',
						routeId: 'AST',
						routeName: 'NYC Ferry - Astoria Line',
						tripId: trip.tripId,
						headsign: isSouthbound
							? 'Wall St / Pier 11 via LIC & E 34th St'
							: 'East 90th St / Upper East Side',
						destinationName: isSouthbound ? 'Wall St / Pier 11' : 'E 90th St',
						direction: isSouthbound ? 'southbound' : 'northbound',
						scheduledTime: isoTime,
						predictedTime: isoTime,
						isRealtime: true,
						delaySeconds: update.arrival?.delay || update.departure?.delay || 0,
						status: 'normal',
						stopName: 'Roosevelt Island Ferry Landing',
						stopId: '25',
						vesselName: vehicleLabel || undefined,
						pierName: 'Roosevelt Island Dock',
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
