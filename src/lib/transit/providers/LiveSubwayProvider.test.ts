import { describe, expect, it } from 'vitest';
import { LiveSubwayProvider, SUBWAY_ACTIVE_HORIZON_MINUTES } from './LiveSubwayProvider';

describe('LiveSubwayProvider', () => {
	it('conforms to TransitProvider contract for subway mode and enforces Active Horizon Suppression', async () => {
		const provider = new LiveSubwayProvider();
		expect(provider.mode).toBe('subway');
		expect(provider.capabilities.has('departures')).toBe(true);

		const result = await provider.getDepartures();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);

		const now = Date.now();

		// Verify every departure adheres to SubwayDeparture schema & active horizon rules
		for (const dep of result.data) {
			expect(dep.mode).toBe('subway');
			expect(dep.stopName).toBe('Roosevelt Island Station');
			expect(['Uptown', 'Downtown']).toContain(dep.track);
			expect(['queens_bound', 'manhattan_bound']).toContain(dep.direction);
			expect(typeof dep.isRealtime).toBe('boolean');
			expect(dep.scheduledTime).toBeDefined();

			expect(['F', 'M']).toContain(dep.routeId);
			expect(['F Train', 'M Train', 'F Shuttle']).toContain(dep.routeName);

			// Active Horizon Suppression assertion:
			// If a departure is within SUBWAY_ACTIVE_HORIZON_MINUTES (30m), it MUST be real-time tracked (isRealtime === true)
			const arrivalMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
			const diffMins = (arrivalMs - now) / 60000;
			if (diffMins > 0 && diffMins <= SUBWAY_ACTIVE_HORIZON_MINUTES) {
				expect(dep.isRealtime).toBe(true);
			}

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
