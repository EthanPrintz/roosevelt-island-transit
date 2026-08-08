import { describe, expect, it } from 'vitest';
import { LiveFerryProvider } from './LiveFerryProvider';

describe('LiveFerryProvider', () => {
	it('conforms to TransitProvider contract for ferry mode', async () => {
		const provider = new LiveFerryProvider();
		expect(provider.mode).toBe('ferry');
		expect(provider.capabilities.has('departures')).toBe(true);

		const result = await provider.getDepartures();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
	});
});
