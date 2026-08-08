import { describe, expect, it } from 'vitest';
import { MockQ102Provider } from './MockQ102Provider';

describe('MockQ102Provider', () => {
	it('returns MTA Q102 Bus departures', async () => {
		const provider = new MockQ102Provider();
		expect(provider.mode).toBe('q102_bus');

		const departures = await provider.getDepartures();
		expect(departures.length).toBeGreaterThan(0);
		expect(departures[0].routeId).toBe('Q102');
	});
});
