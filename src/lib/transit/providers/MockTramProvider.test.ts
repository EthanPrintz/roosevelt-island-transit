import { describe, expect, it } from 'vitest';
import { MockTramProvider } from './MockTramProvider';

describe('MockTramProvider', () => {
	it('conforms to TransitProvider contract for tram mode', async () => {
		const provider = new MockTramProvider();
		expect(provider.mode).toBe('tram');
		expect(provider.name).toBe('Roosevelt Island Tramway');

		const result = await provider.getDepartures();
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data[0].mode).toBe('tram');
		expect(result.data[0].destinationName).toBe('Manhattan');
	});

	it('returns alerts for tram status', async () => {
		const provider = new MockTramProvider();
		const result = await provider.getAlerts();
		expect(result.data).toBeDefined();
		expect(result.data.length).toBeGreaterThan(0);
	});
});
