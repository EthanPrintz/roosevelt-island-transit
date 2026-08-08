import { describe, expect, it } from 'vitest';
import { MockRedBusProvider } from './MockRedBusProvider';

describe('MockRedBusProvider', () => {
	it('returns RIOC Red Bus shuttle departures', async () => {
		const provider = new MockRedBusProvider();
		expect(provider.mode).toBe('red_bus');

		const departures = await provider.getDepartures();
		expect(departures.length).toBeGreaterThan(0);
		expect(departures[0].routeName).toContain('Red Bus');
	});
});
