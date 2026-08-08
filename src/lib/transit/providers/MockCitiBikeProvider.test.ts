import { describe, expect, it } from 'vitest';
import { MockCitiBikeProvider } from './MockCitiBikeProvider';

describe('MockCitiBikeProvider', () => {
	it('returns Citi Bike station information for Roosevelt Island', async () => {
		const provider = new MockCitiBikeProvider();
		expect(provider.mode).toBe('citibike');

		const stations = await provider.getStations?.();
		expect(stations).toBeDefined();
		expect(stations?.length).toBeGreaterThan(0);
		expect(stations?.[0].totalBikes).toBeGreaterThan(0);
	});
});
