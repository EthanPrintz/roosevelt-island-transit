import { describe, expect, it } from 'vitest';
import { LiveCitiBikeProvider } from './LiveCitiBikeProvider';

describe('LiveCitiBikeProvider', () => {
	it('conforms to TransitProvider contract for citibike mode', async () => {
		const provider = new LiveCitiBikeProvider();
		expect(provider.mode).toBe('citibike');
		expect(provider.capabilities.has('bike_stations')).toBe(true);

		const result = await provider.getBikeStations();
		expect(result.data).toBeDefined();
		expect(result.data.length).toBeGreaterThan(0);
	});
});
