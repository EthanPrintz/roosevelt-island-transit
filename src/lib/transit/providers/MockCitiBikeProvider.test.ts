import { describe, expect, it } from 'vitest';
import { MockCitiBikeProvider } from './MockCitiBikeProvider';

describe('MockCitiBikeProvider', () => {
	it('returns Citi Bike station information for Roosevelt Island', async () => {
		const provider = new MockCitiBikeProvider();
		expect(provider.mode).toBe('citibike');
		expect(provider.capabilities.has('bike_stations')).toBe(true);

		const result = await provider.getBikeStations();
		expect(result.data).toBeDefined();
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data[0].bikesAvailable.total).toBeGreaterThan(0);
	});
});
