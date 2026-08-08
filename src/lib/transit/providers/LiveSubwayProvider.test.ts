import { describe, expect, it } from 'vitest';
import { LiveSubwayProvider } from './LiveSubwayProvider';

describe('LiveSubwayProvider', () => {
	it('conforms to TransitProvider contract for subway mode', async () => {
		const provider = new LiveSubwayProvider();
		expect(provider.mode).toBe('subway');
		expect(provider.capabilities.has('departures')).toBe(true);

		const result = await provider.getDepartures();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
	});
});
