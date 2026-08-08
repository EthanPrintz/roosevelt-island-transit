import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BikeStation, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const CITIBIKE_STATUS_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';
export const CITIBIKE_INFO_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';

const ROOSEVELT_ISLAND_STATION_KEYWORDS = [
	'roosevelt island',
	'southpoint park',
	'motorgate',
	'octagon',
];

interface GbfsStatusItem {
	station_id: string;
	num_bikes_available: number;
	num_ebikes_available?: number;
	num_docks_available: number;
	is_renting: number;
	is_returning: number;
	last_reported: number;
}

interface GbfsInfoItem {
	station_id: string;
	name: string;
	lat: number;
	lon: number;
	capacity: number;
}

/**
 * LiveCitiBikeProvider
 *
 * Fetches real-time Citi Bike station status via public GBFS v3.0 JSON endpoints.
 * Filters for Roosevelt Island docking stations.
 */
export class LiveCitiBikeProvider implements TransitProvider {
	readonly mode: TransitMode = 'citibike';
	readonly name = 'Citi Bike Live GBFS Feed';
	readonly capabilities = new Set<ProviderCapability>(['bike_stations', 'alerts']);

	async getBikeStations(): Promise<ProviderResult<BikeStation>> {
		try {
			const [statusRes, infoRes] = await Promise.all([
				fetch(CITIBIKE_STATUS_URL),
				fetch(CITIBIKE_INFO_URL),
			]);

			if (!statusRes.ok || !infoRes.ok) {
				throw new Error('Failed to fetch GBFS endpoints');
			}

			const statusJson = (await statusRes.json()) as {
				data: { stations: GbfsStatusItem[] };
			};
			const infoJson = (await infoRes.json()) as {
				data: { stations: GbfsInfoItem[] };
			};

			const infoMap = new Map<string, GbfsInfoItem>();
			for (const info of infoJson.data.stations) {
				const lowerName = info.name.toLowerCase();

				const isRiStation = ROOSEVELT_ISLAND_STATION_KEYWORDS.some((kw) => lowerName.includes(kw));

				if (isRiStation) {
					infoMap.set(info.station_id, info);
				}
			}

			const stations: BikeStation[] = [];

			for (const status of statusJson.data.stations) {
				const info = infoMap.get(status.station_id);
				if (!info) continue;

				const ebikes = status.num_ebikes_available || 0;
				const totalBikes = status.num_bikes_available;
				const classic = Math.max(0, totalBikes - ebikes);

				stations.push({
					id: `citibike-live-${status.station_id}`,
					name: info.name,
					mode: 'citibike',
					location: {
						lat: info.lat,
						lng: info.lon,
					},
					capacity: info.capacity,
					bikesAvailable: {
						classic,
						ebike: ebikes,
						total: totalBikes,
					},
					docksAvailable: status.num_docks_available,
					isRenting: Boolean(status.is_renting),
					isReturning: Boolean(status.is_returning),
					status: 'normal',
					lastReported: new Date(status.last_reported * 1000).toISOString(),
				});
			}

			return {
				data: stations,
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
