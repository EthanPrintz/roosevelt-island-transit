import { describe, expect, it } from 'vitest';
import { MockTramProvider } from './MockTramProvider';

describe('MockTramProvider', () => {
	it('conforms to TransitProvider contract for tram mode', async () => {
		const provider = new MockTramProvider();
		expect(provider.mode).toBe('tram');
		expect(provider.name).toBe('Roosevelt Island Tramway');

		const departures = await provider.getDepartures();
		expect(departures.length).toBeGreaterThan(0);
		expect(departures[0].mode).toBe('tram');
		expect(departures[0].destination).toBe('Manhattan');
	});

	it('returns alerts for tram status', async () => {
		const provider = new MockTramProvider();
		const alerts = await provider.getAlerts?.();
		expect(alerts).toBeDefined();
		expect(alerts?.length).toBeGreaterThan(0);
	});
});
