import { describe, expect, it } from 'vitest';
import { MockCitiBikeProvider } from '../providers/MockCitiBikeProvider';
import { MockFerryProvider } from '../providers/MockFerryProvider';
import { MockQ102Provider } from '../providers/MockQ102Provider';
import { MockRedBusProvider } from '../providers/MockRedBusProvider';
import { MockSubwayProvider } from '../providers/MockSubwayProvider';
import { MockTramProvider } from '../providers/MockTramProvider';
import { TransitAggregator } from './TransitAggregator';

describe('TransitAggregator', () => {
	it('registers all 6 transit providers', () => {
		const aggregator = new TransitAggregator();
		aggregator.registerProvider(new MockTramProvider());
		aggregator.registerProvider(new MockSubwayProvider());
		aggregator.registerProvider(new MockRedBusProvider());
		aggregator.registerProvider(new MockQ102Provider());
		aggregator.registerProvider(new MockFerryProvider());
		aggregator.registerProvider(new MockCitiBikeProvider());

		expect(aggregator.getRegisteredModes().length).toBe(6);
	});

	it('returns departures sorted chronologically by predicted/scheduled time', async () => {
		const aggregator = new TransitAggregator();
		aggregator.registerProvider(new MockTramProvider());
		aggregator.registerProvider(new MockSubwayProvider());
		aggregator.registerProvider(new MockRedBusProvider());

		const departures = await aggregator.getAllDepartures('all');
		expect(departures.length).toBeGreaterThan(0);
		for (let i = 0; i < departures.length - 1; i++) {
			const timeA = new Date(departures[i].predictedTime || departures[i].scheduledTime).getTime();
			const timeB = new Date(
				departures[i + 1].predictedTime || departures[i + 1].scheduledTime,
			).getTime();
			expect(timeA).toBeLessThanOrEqual(timeB);
		}
	});

	it('filters departures correctly by specific transit mode', async () => {
		const aggregator = new TransitAggregator();
		aggregator.registerProvider(new MockTramProvider());
		aggregator.registerProvider(new MockSubwayProvider());

		const subwayOnly = await aggregator.getAllDepartures('subway');
		expect(subwayOnly.every((d) => d.mode === 'subway')).toBe(true);
	});

	it('fetches Citi Bike stations via getBikeStations', async () => {
		const aggregator = new TransitAggregator();
		aggregator.registerProvider(new MockCitiBikeProvider());

		const stations = await aggregator.getBikeStations('citibike');
		expect(stations.length).toBeGreaterThan(0);
		expect(stations[0].bikesAvailable.total).toBeGreaterThan(0);
	});
});
