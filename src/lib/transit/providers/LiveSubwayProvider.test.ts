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

		// Verify every departure adheres to SubwayDeparture schema
		for (const dep of result.data) {
			expect(dep.mode).toBe('subway');
			expect(dep.stopName).toBe('Roosevelt Island Station');
			expect(['Uptown', 'Downtown']).toContain(dep.track);
			expect(['queens_bound', 'manhattan_bound']).toContain(dep.direction);
			expect(typeof dep.isRealtime).toBe('boolean');
			expect(dep.scheduledTime).toBeDefined();

			if (dep.scheduleRelationship) {
				expect(['SCHEDULED', 'ADDED', 'UNSCHEDULED', 'CANCELED', 'SKIPPED']).toContain(
					dep.scheduleRelationship,
				);
			}
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveSubwayProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
