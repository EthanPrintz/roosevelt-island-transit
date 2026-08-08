import { decodeGtfsRealtimeBuffer } from '$lib/server/gtfs';
import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const NYC_FERRY_TRIP_UPDATE_URL =
	'https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate';

// Static timetable for Roosevelt Island Landing (GTFS Stop ID 25)
const ROOSEVELT_ISLAND_SCHEDULE = [
	{
		tripId: '1134',
		headsign: 'East 90th St',
		direction: 'northbound' as const,
		departureTimeStr: '17:11:00',
	},
	{
		tripId: '1022',
		headsign: 'Wall St / Pier 11',
		direction: 'southbound' as const,
		departureTimeStr: '17:25:00',
	},
	{
		tripId: '1002',
		headsign: 'East 90th St',
		direction: 'northbound' as const,
		departureTimeStr: '17:33:00',
	},
	{
		tripId: '1149',
		headsign: 'Wall St / Pier 11',
		direction: 'southbound' as const,
		departureTimeStr: '17:44:00',
	},
	{
		tripId: '1135',
		headsign: 'East 90th St',
		direction: 'northbound' as const,
		departureTimeStr: '17:52:00',
	},
	{
		tripId: '1023',
		headsign: 'Wall St / Pier 11',
		direction: 'southbound' as const,
		departureTimeStr: '18:05:00',
	},
	{
		tripId: '1003',
		headsign: 'East 90th St',
		direction: 'northbound' as const,
		departureTimeStr: '18:12:00',
	},
	{
		tripId: '1150',
		headsign: 'Wall St / Pier 11',
		direction: 'southbound' as const,
		departureTimeStr: '18:25:00',
	},
	{
		tripId: '1136',
		headsign: 'East 90th St',
		direction: 'northbound' as const,
		departureTimeStr: '18:33:00',
	},
	{
		tripId: '1024',
		headsign: 'Wall St / Pier 11',
		direction: 'southbound' as const,
		departureTimeStr: '18:44:00',
	},
];

/**
 * LiveFerryProvider
 *
 * Combines NYC Ferry GTFS schedule timetable for Roosevelt Island Landing (Stop 25)
 * with real-time vessel position & delay updates from Connexionz's GTFS-RT feed.
 */
export class LiveFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry Live (Astoria Line)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<FerryDeparture>> {
		try {
			const res = await fetch(NYC_FERRY_TRIP_UPDATE_URL);
			const liveDelays = new Map<string, { delay: number; vessel: string }>();

			if (res.ok) {
				const arrayBuffer = await res.arrayBuffer();
				const feed = decodeGtfsRealtimeBuffer(arrayBuffer);

				for (const entity of feed.entity) {
					const tripId = entity.tripUpdate?.trip?.tripId;
					const vehicle = entity.tripUpdate?.vehicle?.label;
					const delay = entity.tripUpdate?.delay || 0;
					if (tripId) {
						liveDelays.set(tripId, { delay, vessel: vehicle || 'NYC Ferry Vessel' });
					}
				}
			}

			const now = new Date();
			const departures: FerryDeparture[] = [];

			for (const item of ROOSEVELT_ISLAND_SCHEDULE) {
				const [h, m, s] = item.departureTimeStr.split(':').map(Number);
				const scheduledDate = new Date(now);
				scheduledDate.setHours(h, m, s, 0);

				const rtData = liveDelays.get(item.tripId);
				const delaySec = rtData?.delay || 0;
				const predictedDate = new Date(scheduledDate.getTime() + delaySec * 1000);

				// Include departures that are upcoming or within last 5 minutes
				if (predictedDate.getTime() >= now.getTime() - 300000) {
					departures.push({
						id: `ferry-live-${item.tripId}-${item.departureTimeStr}`,
						mode: 'ferry',
						routeId: 'AST',
						routeName: 'NYC Ferry - Astoria Line',
						tripId: item.tripId,
						headsign: item.headsign,
						destinationName: item.headsign.includes('Wall') ? 'Wall St / Pier 11' : 'E 90th St',
						direction: item.direction,
						scheduledTime: scheduledDate.toISOString(),
						predictedTime: predictedDate.toISOString(),
						isRealtime: liveDelays.has(item.tripId),
						delaySeconds: delaySec,
						status: delaySec > 180 ? 'delays' : 'normal',
						stopName: 'Roosevelt Island Ferry Landing',
						stopId: '25',
						vesselName: rtData?.vessel || 'M/V Sunset Park',
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
