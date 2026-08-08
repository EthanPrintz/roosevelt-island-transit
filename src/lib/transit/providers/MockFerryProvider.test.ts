import { describe, expect, it } from 'vitest';
import { MockFerryProvider } from './MockFerryProvider';

describe('MockFerryProvider', () => {
	it('returns NYC Ferry Astoria route departures', async () => {
		const provider = new MockFerryProvider();
		expect(provider.mode).toBe('ferry');

		const result = await provider.getDepartures();
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data[0].routeId).toBe('AST');
	});
});
