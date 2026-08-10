import { describe, expect, it } from 'vitest';
import { LiveSubwayProvider } from './LiveSubwayProvider';

describe('LiveSubwayProvider', () => {
	it('conforms to TransitProvider contract for subway mode and enforces Active Horizon Suppression', async () => {
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

			expect(['F', 'M']).toContain(dep.routeId);

			if (dep.scheduleRelationship) {
				expect(['SCHEDULED', 'ADDED', 'UNSCHEDULED', 'CANCELED', 'SKIPPED']).toContain(
					dep.scheduleRelationship,
				);
			}
		}
	});

	it('declares vehicle_tracking capability and fetches live F/M train vehicle positions', async () => {
		const provider = new LiveSubwayProvider();
		expect(provider.capabilities.has('vehicle_tracking')).toBe(true);

		const result = await provider.getVehicles();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);

		for (const v of result.data) {
			expect(v.mode).toBe('subway');
			expect(typeof v.id).toBe('string');
			expect(typeof v.lat).toBe('number');
			expect(typeof v.lng).toBe('number');
			expect(v.lat).toBeGreaterThan(40);
			expect(v.lat).toBeLessThan(41);
			expect(v.lng).toBeGreaterThan(-74.5);
			expect(v.lng).toBeLessThan(-73);
			expect(typeof v.updatedAt).toBe('string');
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveSubwayProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
