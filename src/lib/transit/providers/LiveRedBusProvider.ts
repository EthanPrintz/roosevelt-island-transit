import { env } from '$env/dynamic/private';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type {
	BusDeparture,
	LiveVehiclePosition,
	ProviderResult,
	TransitAlert,
	TransitMode,
} from '../domain/types';

const DEFAULT_UMOIQ_URL = 'https://webservices.umoiq.com/service/publicJSONFeed';
const DEFAULT_AGENCY_TAG = 'roosevelt';

// Exact Route Travel Sequence from Umoiq routeConfig (Northbound: 1..10, Southbound: 101..110)
const RED_BUS_NORTHBOUND_SEQUENCE: Record<string, number> = {
	southpnt: 1,
	cornell: 2,
	tramwest_n: 3,
	subway_n: 4,
	'504main': 5,
	'545main': 6,
	capfield: 7,
	post: 8,
	'40river_n': 9,
	colerh: 10,
};

const RED_BUS_SOUTHBOUND_SEQUENCE: Record<string, number> = {
	octagon: 101,
	comfstat: 102,
	'40river_s': 103,
	'10river': 104,
	'570main': 105,
	'543main': 106,
	riverwalk: 107,
	trameast: 108,
	ferrystat: 109,
	sportpark: 110,
};

const SHUTTLE_STOP_TAGS = [
	...Object.keys(RED_BUS_NORTHBOUND_SEQUENCE),
	...Object.keys(RED_BUS_SOUTHBOUND_SEQUENCE),
];
const EXPRESS_STOP_TAGS = ['octagon', 'riverwalk', 'trameast', 'tramwest_n', 'subway_n'];

interface RawUmoiqVehicle {
	id?: string;
	routeTag?: string;
	dirTag?: string;
	lat?: string | number;
	lon?: string | number;
	lng?: string | number;
	secsSinceReport?: number;
	predictable?: boolean;
	heading?: number | string;
	speedKmHr?: number | string;
}

interface RawUmoiqPredictionItem {
	epochTime?: string | number;
	seconds?: string | number;
	minutes?: string | number;
	isDeparture?: string | boolean;
	dirTag?: string;
	vehicle?: string;
}

interface RawUmoiqDirection {
	title?: string;
	prediction?: RawUmoiqPredictionItem | RawUmoiqPredictionItem[];
}

interface RawUmoiqPredictionBlock {
	agencyTitle?: string;
	routeTitle?: string;
	routeTag?: string;
	stopTitle?: string;
	stopTag?: string;
	direction?: RawUmoiqDirection | RawUmoiqDirection[];
}

interface UmoiqFeedPayload {
	vehicleLocations?: { vehicle?: RawUmoiqVehicle | RawUmoiqVehicle[] } | RawUmoiqVehicle[];
	vehicle?: RawUmoiqVehicle | RawUmoiqVehicle[];
	predictions?: RawUmoiqPredictionBlock | RawUmoiqPredictionBlock[];
	error?: string;
}

function normalizeStopName(stopTag?: string, stopTitle?: string): string {
	if (stopTitle?.trim()) {
		return stopTitle
			.replace(/R\.I\.\s*/i, '')
			.replace(/Chapel\/PSD/i, 'Good Shepherd Plaza (Chapel/PSD)')
			.replace(/Subway Station/i, 'Subway Plaza (Subway Station)')
			.trim();
	}
	const tag = (stopTag || '').toLowerCase();
	if (tag.includes('coler')) return 'Coler Hospital';
	if (tag.includes('octagon')) return 'Octagon';
	if (tag.includes('504') || tag.includes('545') || tag.includes('543'))
		return 'Good Shepherd Plaza';
	if (tag.includes('subway') || tag.includes('tram')) return 'Subway Plaza';
	return stopTag || 'Roosevelt Island Bus Stop';
}

function normalizeDirection(dirTag?: string): 'northbound' | 'southbound' | 'loop' {
	const dir = (dirTag || '').toLowerCase();
	if (dir.includes('north') || dir === 'n' || dir.includes('inbound')) return 'northbound';
	if (dir.includes('south') || dir === 's' || dir.includes('outbound')) return 'southbound';
	return 'loop';
}

export class LiveRedBusProvider implements TransitProvider {
	readonly mode: TransitMode = 'red_bus';
	readonly name = 'RIOC Red Bus Shuttle';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts', 'vehicle_tracking']);

	private feedCache: { payload: UmoiqFeedPayload; expiresAt: number } | null = null;
	private pendingFeedPromise: Promise<UmoiqFeedPayload> | null = null;

	private async fetchUmoiqFeed(): Promise<UmoiqFeedPayload> {
		const now = Date.now();
		if (this.feedCache && this.feedCache.expiresAt > now) {
			return this.feedCache.payload;
		}
		if (this.pendingFeedPromise) {
			return this.pendingFeedPromise;
		}

		const baseUrl = env.RIOC_REDBUS_API_URL || DEFAULT_UMOIQ_URL;
		const agencyTag = env.RIOC_AGENCY_TAG || DEFAULT_AGENCY_TAG;

		this.pendingFeedPromise = (async () => {
			const vehicleUrl = `${baseUrl}?command=vehicleLocations&a=${encodeURIComponent(agencyTag)}&t=0`;
			const stopPairs = [
				...SHUTTLE_STOP_TAGS.map((s) => `shuttle|${s}`),
				...EXPRESS_STOP_TAGS.map((s) => `express|${s}`),
			];
			const predictUrl = `${baseUrl}?command=predictionsForMultiStops&a=${encodeURIComponent(agencyTag)}&${stopPairs.map((s) => `stops=${s}`).join('&')}`;

			let fetchError: string | undefined;
			const [vehRes, predRes] = await Promise.all([
				fetch(vehicleUrl).catch((err) => {
					fetchError = String(err);
					return null;
				}),
				fetch(predictUrl).catch((err) => {
					fetchError = String(err);
					return null;
				}),
			]);

			let vehicleLocationsData: unknown = null;
			let predictionsData: unknown = null;

			if (vehRes?.ok) {
				vehicleLocationsData = await vehRes.json().catch(() => null);
			}
			if (predRes?.ok) {
				predictionsData = await predRes.json().catch(() => null);
			}

			const payload: UmoiqFeedPayload = {};
			if (!vehRes?.ok && !predRes?.ok && fetchError) {
				payload.error = fetchError;
			}

			if (vehicleLocationsData && typeof vehicleLocationsData === 'object') {
				const vObj = vehicleLocationsData as UmoiqFeedPayload;
				payload.vehicleLocations = vObj.vehicleLocations || vObj.vehicle ? vObj : undefined;
				if (Array.isArray(vehicleLocationsData)) {
					payload.vehicle = vehicleLocationsData;
				}
			}

			if (predictionsData && typeof predictionsData === 'object') {
				const pObj = predictionsData as UmoiqFeedPayload;
				payload.predictions =
					pObj.predictions ||
					(Array.isArray(predictionsData)
						? (predictionsData as RawUmoiqPredictionBlock[])
						: undefined);
			}

			this.feedCache = { payload, expiresAt: Date.now() + 15000 };
			return payload;
		})();

		try {
			return await this.pendingFeedPromise;
		} finally {
			this.pendingFeedPromise = null;
		}
	}

	async getVehicles(): Promise<ProviderResult<LiveVehiclePosition>> {
		const fetchedAt = new Date().toISOString();
		try {
			const feed = await this.fetchUmoiqFeed();

			let rawVehicles: RawUmoiqVehicle[] = [];
			if (Array.isArray(feed.vehicle)) {
				rawVehicles = feed.vehicle;
			} else if (feed.vehicleLocations) {
				if (Array.isArray(feed.vehicleLocations)) {
					rawVehicles = feed.vehicleLocations;
				} else if (feed.vehicleLocations.vehicle) {
					rawVehicles = Array.isArray(feed.vehicleLocations.vehicle)
						? feed.vehicleLocations.vehicle
						: [feed.vehicleLocations.vehicle];
				}
			}

			const vehicles: LiveVehiclePosition[] = [];
			const nowMs = Date.now();

			for (const v of rawVehicles) {
				if (!v.id) continue;
				const lat = Number(v.lat);
				const lng = Number(v.lon ?? v.lng);
				if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

				const direction = normalizeDirection(v.dirTag);
				const speedKm = Number(v.speedKmHr || 0);
				const speedMps = !Number.isNaN(speedKm) ? (speedKm * 1000) / 3600 : undefined;
				const bearing = v.heading !== undefined ? Number(v.heading) : undefined;
				const secsAgo = Number(v.secsSinceReport || 0);
				const updatedAt = new Date(nowMs - secsAgo * 1000).toISOString();

				vehicles.push({
					id: `redbus-${v.id}`,
					vehicleId: String(v.id),
					mode: 'red_bus',
					routeId: v.routeTag === 'express' ? 'RED_BUS_EXPRESS' : 'RED_BUS',
					direction,
					lat,
					lng,
					bearing: !Number.isNaN(bearing) ? bearing : undefined,
					speedMps,
					destinationName: direction === 'northbound' ? 'Octagon' : 'Cornell Tech',
					updatedAt,
				});
			}

			return {
				data: vehicles,
				fetchedAt,
				isCached: Boolean(this.feedCache && this.feedCache.expiresAt > Date.now()),
				error: feed.error,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt,
				isCached: false,
				error: String(err),
			};
		}
	}

	async getDepartures(_options?: DepartureOptions): Promise<ProviderResult<BusDeparture>> {
		const fetchedAt = new Date().toISOString();
		try {
			const feed = await this.fetchUmoiqFeed();

			let rawBlocks: RawUmoiqPredictionBlock[] = [];
			if (feed.predictions) {
				rawBlocks = Array.isArray(feed.predictions) ? feed.predictions : [feed.predictions];
			}

			const departures: BusDeparture[] = [];

			for (const block of rawBlocks) {
				const stopName = normalizeStopName(block.stopTag, block.stopTitle);
				const stopTagLower = (block.stopTag || '').toLowerCase();

				const dirs = block.direction
					? Array.isArray(block.direction)
						? block.direction
						: [block.direction]
					: [];

				for (const d of dirs) {
					const preds = d.prediction
						? Array.isArray(d.prediction)
							? d.prediction
							: [d.prediction]
						: [];

					for (const p of preds) {
						if (!p.epochTime) continue;
						const timeMs = Number(p.epochTime);
						if (Number.isNaN(timeMs)) continue;

						const dir = normalizeDirection(p.dirTag || d.title);
						const isoTime = new Date(timeMs).toISOString();

						const stopSequence =
							dir === 'northbound'
								? (RED_BUS_NORTHBOUND_SEQUENCE[stopTagLower] ?? 50)
								: (RED_BUS_SOUTHBOUND_SEQUENCE[stopTagLower] ?? 150);

						departures.push({
							id: `redbus-${block.stopTag || 'stop'}-${p.vehicle || 'v'}-${timeMs}`,
							mode: 'red_bus',
							routeId: block.routeTag === 'express' ? 'RED_BUS_EXPRESS' : 'RED_BUS',
							routeName: block.routeTag === 'express' ? 'RIOC Red Bus Express' : 'RIOC Red Bus',
							headsign:
								d.title ||
								(dir === 'northbound' ? 'Octagon via Main St' : 'Southtown & Cornell Tech'),
							destinationName: dir === 'northbound' ? 'Octagon' : 'Cornell Tech',
							direction: dir,
							scheduledTime: isoTime,
							predictedTime: isoTime,
							isRealtime: true,
							delaySeconds: 0,
							status: 'normal',
							stopName,
							stopSequence,
							vehicleId: p.vehicle ? String(p.vehicle) : undefined,
							nextStopName: block.stopTitle || stopName,
						});
					}
				}
			}

			departures.sort(
				(a, b) =>
					new Date(a.predictedTime || a.scheduledTime).getTime() -
					new Date(b.predictedTime || b.scheduledTime).getTime(),
			);

			return {
				data: departures,
				fetchedAt,
				isCached: Boolean(this.feedCache && this.feedCache.expiresAt > Date.now()),
				error: feed.error,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt,
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
