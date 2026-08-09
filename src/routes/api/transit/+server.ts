import { json, type RequestHandler } from '@sveltejs/kit';
import { serverCache } from '$lib/server/cache';
import {
	LiveCitiBikeProvider,
	LiveFerryProvider,
	LiveSubwayProvider,
	TransitAggregator,
} from '$lib/transit';
import type { TransitMode } from '$lib/transit/domain/types';

const aggregator = new TransitAggregator();
aggregator.registerProvider(new LiveSubwayProvider());
aggregator.registerProvider(new LiveFerryProvider());
aggregator.registerProvider(new LiveCitiBikeProvider());

export const GET: RequestHandler = async ({ url }) => {
	const modeParam = (url.searchParams.get('mode') as TransitMode | 'all') || 'all';
	const windowParam = Number.parseInt(url.searchParams.get('window') || '120', 10);
	const windowMinutes = Number.isNaN(windowParam) ? 120 : windowParam;

	const cacheKey = `live-transit-feed-${modeParam}-w${windowMinutes}`;
	const ttlMs = 15000; // 15 seconds server-side cache

	const { data, isCached } = await serverCache.getOrFetch(cacheKey, ttlMs, async () => {
		const [departures, alerts, stations] = await Promise.all([
			aggregator.getAllDepartures(modeParam, { windowMinutes }),
			aggregator.getAllAlerts(modeParam),
			aggregator.getBikeStations(modeParam),
		]);

		return {
			departures,
			alerts,
			stations,
			fetchedAt: new Date().toISOString(),
		};
	});

	return json(
		{
			...data,
			isCached,
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=15, s-maxage=15',
			},
		},
	);
};
