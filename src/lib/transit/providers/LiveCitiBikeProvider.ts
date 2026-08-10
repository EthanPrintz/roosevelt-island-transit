import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BikeStation, ProviderResult, TransitAlert, TransitMode } from '../domain/types';

export const CITIBIKE_STATUS_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';
export const CITIBIKE_INFO_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';

const KNOWN_RI_STATION_IDS = new Set([
	'b47e5ffd-4215-4476-a89b-ebe52111f763', // Roosevelt Island Tramway
	'ad17bd9a-735b-4a11-8ad3-dc7800e342af', // Southpoint Park / Cornell Tech
	'88bf1344-354f-4699-bdbd-1c2584fc41ee', // Motorgate
]);

const ROOSEVELT_ISLAND_STATION_KEYWORDS = [
	'roosevelt island',
	'southpoint',
	'motorgate',
	'cornell tech',
	'octagon',
	'coler',
];

const RI_POLYGON: [number, number][] = [
	[-73.961, 40.75],
	[-73.9585, 40.757],
	[-73.9555, 40.762],
	[-73.951, 40.768],
	[-73.943, 40.7765],
	[-73.9405, 40.7745],
	[-73.9435, 40.768],
	[-73.946, 40.762],
	[-73.951, 40.756],
	[-73.9565, 40.75],
];

function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
	const x = point[0];
	const y = point[1];
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i][0];
		const yi = polygon[i][1];
		const xj = polygon[j][0];
		const yj = polygon[j][1];
		const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

interface GbfsStatusItem {
	station_id: string;
	num_bikes_available: number;
	num_ebikes_available?: number;
	num_bikes_disabled?: number;
	num_docks_available: number;
	num_docks_disabled?: number;
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
				const isKnown = KNOWN_RI_STATION_IDS.has(info.station_id);
				const isGeoMatch = isPointInPolygon([info.lon, info.lat], RI_POLYGON);
				const lowerName = info.name.toLowerCase();
				const isKeywordMatch = ROOSEVELT_ISLAND_STATION_KEYWORDS.some((kw) =>
					lowerName.includes(kw),
				);

				if (isKnown || (isGeoMatch && isKeywordMatch)) {
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

				const lastReportedMs = status.last_reported ? status.last_reported * 1000 : Date.now();
				const ageMins = Math.max(0, Math.floor((Date.now() - lastReportedMs) / 60000));

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
					disabledBikes: status.num_bikes_disabled || 0,
					disabledDocks: status.num_docks_disabled || 0,
					isRenting: status.is_renting === 1,
					isReturning: status.is_returning === 1,
					status: isOperational ? 'normal' : 'delays',
					lastReported: new Date(lastReportedMs).toISOString(),
					lastReportedAgeMins: ageMins,
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
