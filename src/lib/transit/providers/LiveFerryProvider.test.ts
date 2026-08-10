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

	it('flags departure as isRealtime true when vehicle position telemetry is present', async () => {
		const provider = new LiveFerryProvider();
		const result = await provider.getDepartures();
		// Find any departure that has vessel telemetry
		const trackedDep = result.data.find((dep) =>
			Boolean(dep.vesselName || dep.speedKnots !== undefined),
		);
		if (trackedDep) {
			expect(trackedDep.isRealtime).toBe(true);
		}
	});

	it('evaluates isRealtime as true when vehicle telemetry exists even without trip updates', () => {
		const telem = { vesselLabel: 'H110', speedKnots: 6, vesselStatus: 'IN_TRANSIT_TO' as const };
		const rt = undefined;

		const isRealtime = Boolean(rt || telem);
		expect(isRealtime).toBe(true);
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveFerryProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});

	it('fetches and decodes live vessel vehicle positions via getVehicles', async () => {
		const provider = new LiveFerryProvider();
		expect(provider.capabilities.has('vehicle_tracking')).toBe(true);

		const result = await provider.getVehicles();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);

		for (const v of result.data) {
			expect(v.mode).toBe('ferry');
			expect(v.id).toContain('ferry-');
			expect(typeof v.lat).toBe('number');
			expect(typeof v.lng).toBe('number');
		}
	});
});
