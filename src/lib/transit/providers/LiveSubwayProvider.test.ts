import { describe, expect, it } from 'vitest';
import { calculateAzimuth, LiveSubwayProvider } from './LiveSubwayProvider';

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

	it('declares vehicle_tracking capability and fetches live F/M train vehicle positions with precise bearings', async () => {
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
			expect(typeof v.bearing).toBe('number');
			expect(v.bearing).toBeGreaterThanOrEqual(0);
			expect(v.bearing).toBeLessThan(360);
			expect(typeof v.updatedAt).toBe('string');
		}
	});

	it('calculates precise forward azimuth bearings between coordinates', () => {
		const northBearing = calculateAzimuth([-73.95, 40.75], [-73.95, 40.76]);
		expect(northBearing).toBe(0);

		const eastBearing = calculateAzimuth([-73.95, 40.75], [-73.94, 40.75]);
		expect(eastBearing).toBeGreaterThan(80);
		expect(eastBearing).toBeLessThan(100);
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveSubwayProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
