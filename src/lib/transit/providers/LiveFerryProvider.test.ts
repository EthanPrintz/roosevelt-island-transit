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

		// Verify every departure adheres to FerryDeparture schema
		for (const dep of result.data) {
			expect(dep.mode).toBe('ferry');
			expect(dep.routeId).toBe('AST');
			expect(dep.stopName).toBe('Roosevelt Island Ferry Landing');
			expect(dep.stopId).toBe('25');
			expect(['northbound', 'southbound']).toContain(dep.direction);
			expect(typeof dep.isRealtime).toBe('boolean');
			expect(dep.scheduledTime).toBeDefined();

			if (dep.vesselStatus) {
				expect(['IN_TRANSIT_TO', 'INCOMING_AT', 'STOPPED_AT']).toContain(dep.vesselStatus);
			}
			if (dep.speedKnots !== undefined) {
				expect(typeof dep.speedKnots).toBe('number');
			}
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveFerryProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
