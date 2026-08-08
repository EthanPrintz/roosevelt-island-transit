import { describe, expect, it } from 'vitest';
import { MockSubwayProvider } from './MockSubwayProvider';

describe('MockSubwayProvider', () => {
	it('returns F and M train departures for Roosevelt Island station', async () => {
		const provider = new MockSubwayProvider();
		expect(provider.mode).toBe('subway');

		const result = await provider.getDepartures();
		expect(result.data.length).toBeGreaterThan(0);
		const routes = result.data.map((d) => d.routeId);
		expect(routes).toContain('F');
		expect(routes).toContain('M');
	});

	it('detects 63rd St service switches correctly', () => {
		const provider = new MockSubwayProvider();
		expect(provider.hasServiceSwitch()).toBe(true);
	});
});
