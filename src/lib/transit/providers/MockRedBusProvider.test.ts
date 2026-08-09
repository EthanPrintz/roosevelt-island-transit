import { describe, expect, it } from 'vitest';
import { MockRedBusProvider } from './MockRedBusProvider';

describe('MockRedBusProvider', () => {
	it('returns RIOC Red Bus shuttle departures', async () => {
		const provider = new MockRedBusProvider();
		expect(provider.mode).toBe('red_bus');

		const result = await provider.getDepartures();
		expect(result.data).toEqual([]);
	});
});
