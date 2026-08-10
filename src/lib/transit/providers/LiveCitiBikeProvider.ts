import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BikeStation, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const CITIBIKE_STATUS_URL = 'https://gbfs.lyft.com/gbfs/2.3/gbfs/en/station_status.json';
export const CITIBIKE_INFO_URL = 'https://gbfs.lyft.com/gbfs/2.3/gbfs/en/station_information.json';

const ROOSEVELT_ISLAND_STATION_KEYWORDS = [
	'roosevelt island',
	'cornell tech',
	'octagon',
	'main st',
	'tramway',
	'coler',
];

interface GbfsStatusItem {
	station_id: string;
	num_bikes_available: number;
	num_ebikes_available?: number;
	num_docks_available: number;
	is_installed: number;
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

export class LiveCitiBikeProvider implements TransitProvider {
	readonly mode: TransitMode = 'citibike';
	readonly name = 'Citi Bike Live GBFS Feed';
	readonly capabilities = new Set<ProviderCapability>(['bike_stations', 'alerts']);

	private gbfsCache: { data: BikeStation[]; expiresAt: number } | null = null;
	private pendingGbfsPromise: Promise<BikeStation[]> | null = null;

	private async fetchGbfsData(): Promise<BikeStation[]> {
		const now = Date.now();
		if (this.gbfsCache && this.gbfsCache.expiresAt > now) {
			return this.gbfsCache.data;
		}
		if (this.pendingGbfsPromise) return this.pendingGbfsPromise;

		this.pendingGbfsPromise = (async () => {
			const [statusRes, infoRes] = await Promise.all([
				fetch(CITIBIKE_STATUS_URL).catch(() => null),
				fetch(CITIBIKE_INFO_URL).catch(() => null),
			]);

			if (!statusRes?.ok || !infoRes?.ok) {
				return [];
			}

			const statusJson = (await statusRes.json().catch(() => null)) as {
				data: { stations: GbfsStatusItem[] };
			} | null;
			const infoJson = (await infoRes.json().catch(() => null)) as {
				data: { stations: GbfsInfoItem[] };
			} | null;

			if (!statusJson?.data?.stations || !infoJson?.data?.stations) {
				return [];
			}

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

				const classic = Math.max(
					0,
					status.num_bikes_available - (status.num_ebikes_available || 0),
				);
				const ebike = status.num_ebikes_available || 0;

				const isOperational =
					status.is_installed === 1 && status.is_renting === 1 && status.is_returning === 1;

				stations.push({
					id: `citibike-${info.station_id}`,
					name: info.name,
					mode: 'citibike',
					location: {
						lat: info.lat,
						lng: info.lon,
					},
					capacity: info.capacity || status.num_bikes_available + status.num_docks_available,
					bikesAvailable: {
						classic,
						ebike,
						total: status.num_bikes_available,
					},
					docksAvailable: status.num_docks_available,
					isRenting: status.is_renting === 1,
					isReturning: status.is_returning === 1,
					status: isOperational ? 'normal' : 'delays',
					lastReported: new Date(status.last_reported * 1000).toISOString(),
				});
			}

			if (stations.length > 0) {
				this.gbfsCache = { data: stations, expiresAt: Date.now() + 15000 };
			}
			return stations;
		})();

		try {
			return await this.pendingGbfsPromise;
		} finally {
			this.pendingGbfsPromise = null;
		}
	}

	async getBikeStations(): Promise<ProviderResult<BikeStation>> {
		try {
			const stations = await this.fetchGbfsData();
			return {
				data: stations,
				fetchedAt: new Date().toISOString(),
				isCached: Boolean(this.gbfsCache),
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: String(err),
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
