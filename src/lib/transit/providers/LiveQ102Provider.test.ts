import { describe, expect, it } from 'vitest';
import { LiveQ102Provider } from './LiveQ102Provider';

describe('LiveQ102Provider', () => {
	it('conforms to TransitProvider contract for q102_bus mode', async () => {
		const provider = new LiveQ102Provider();
		expect(provider.mode).toBe('q102_bus');
		expect(provider.capabilities.has('departures')).toBe(true);

		const result = await provider.getDepartures();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);

		for (const dep of result.data) {
			expect(dep.mode).toBe('q102_bus');
			expect(dep.routeId).toBe('Q102');
			expect(['queens_bound', 'northbound']).toContain(dep.direction);
			expect(typeof dep.isRealtime).toBe('boolean');
			expect(dep.scheduledTime).toBeDefined();
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveQ102Provider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
