import { describe, expect, it } from 'vitest';
import { LiveCitiBikeProvider } from './LiveCitiBikeProvider';

describe('LiveCitiBikeProvider', () => {
	it('conforms to TransitProvider contract for citibike mode', async () => {
		const provider = new LiveCitiBikeProvider();
		expect(provider.mode).toBe('citibike');
		expect(provider.capabilities.has('bike_stations')).toBe(true);

		const result = await provider.getBikeStations();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);

		for (const station of result.data) {
			expect(station.mode).toBe('citibike');
			expect(typeof station.capacity).toBe('number');
			expect(station.bikesAvailable.total).toBeGreaterThanOrEqual(0);
			expect(station.docksAvailable).toBeGreaterThanOrEqual(0);
			expect(station.disabledBikes).toBeGreaterThanOrEqual(0);
			expect(station.disabledDocks).toBeGreaterThanOrEqual(0);
			expect(typeof station.lastReportedAgeMins).toBe('number');
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveCitiBikeProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
