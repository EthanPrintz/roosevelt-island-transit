import { describe, expect, it } from 'vitest';
import { MockFerryProvider } from './MockFerryProvider';

describe('MockFerryProvider', () => {
	it('returns NYC Ferry Astoria route departures', async () => {
		const provider = new MockFerryProvider();
		expect(provider.mode).toBe('ferry');

		const departures = await provider.getDepartures();
		expect(departures.length).toBeGreaterThan(0);
		expect(departures[0].routeId).toBe('AST');
	});
});
