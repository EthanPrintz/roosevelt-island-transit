import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import umoiqFixture from '../fixtures/umoiq_redbus.json';
import { LiveRedBusProvider } from './LiveRedBusProvider';

describe('LiveRedBusProvider', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('conforms to TransitProvider contract for red_bus mode', async () => {
		const provider = new LiveRedBusProvider();
		expect(provider.mode).toBe('red_bus');
		expect(provider.capabilities.has('departures')).toBe(true);
		expect(provider.capabilities.has('alerts')).toBe(true);
		expect(provider.capabilities.has('vehicle_tracking')).toBe(true);
	});

	it('parses live vehicle positions from Umoiq JSON feed', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			const urlStr = String(url);
			if (urlStr.includes('vehicleLocations')) {
				return new Response(JSON.stringify(umoiqFixture.vehicleLocations), { status: 200 });
			}
			if (urlStr.includes('predictions')) {
				return new Response(JSON.stringify({ predictions: umoiqFixture.predictions }), {
					status: 200,
				});
			}
			return new Response(JSON.stringify({}), { status: 200 });
		});

		const provider = new LiveRedBusProvider();
		const result = await provider.getVehicles();

		expect(result.data).toHaveLength(2);

		const bus101 = result.data.find((v) => v.vehicleId === '101');
		expect(bus101).toBeDefined();
		expect(bus101?.mode).toBe('red_bus');
		expect(bus101?.direction).toBe('northbound');
		expect(bus101?.lat).toBe(40.7608);
		expect(bus101?.lng).toBe(-73.9515);
		expect(bus101?.speedMps).toBeCloseTo(5.555, 2); // 20 km/h -> ~5.55 m/s
		expect(bus101?.bearing).toBe(45);

		const bus102 = result.data.find((v) => v.vehicleId === '102');
		expect(bus102).toBeDefined();
		expect(bus102?.direction).toBe('southbound');
	});

	it('parses live arrival predictions from Umoiq multi-stop predictions', async () => {
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			const urlStr = String(url);
			if (urlStr.includes('predictions') || urlStr.includes('vehicleLocations')) {
				return new Response(
					JSON.stringify({
						predictions: umoiqFixture.predictions,
						vehicleLocations: umoiqFixture.vehicleLocations,
					}),
					{ status: 200 },
				);
			}
			return new Response(JSON.stringify({}), { status: 200 });
		});

		const provider = new LiveRedBusProvider();
		const result = await provider.getDepartures();

		expect(result.data.length).toBeGreaterThan(0);
		for (const dep of result.data) {
			expect(dep.mode).toBe('red_bus');
			expect(dep.routeId).toBe('RED_BUS');
			expect(['northbound', 'southbound', 'loop']).toContain(dep.direction);
			expect(typeof dep.isRealtime).toBe('boolean');
			expect(dep.stopName).toBeDefined();
		}
	});

	it('coalesces duplicate requests and uses 15s in-memory caching', async () => {
		let fetchCount = 0;
		vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
			fetchCount++;
			return new Response(
				JSON.stringify({
					predictions: umoiqFixture.predictions,
					vehicle: umoiqFixture.vehicleLocations.vehicle,
				}),
				{ status: 200 },
			);
		});

		const provider = new LiveRedBusProvider();

		// Simultaneous calls
		await Promise.all([provider.getVehicles(), provider.getDepartures()]);

		// Should only have triggered single network request cycle
		expect(fetchCount).toBeLessThanOrEqual(2);

		// Subsequent immediate call uses cache
		const secondRes = await provider.getVehicles();
		expect(secondRes.isCached).toBe(true);
	});

	it('handles network failure gracefully without throwing exceptions', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));

		const provider = new LiveRedBusProvider();
		const vehicleRes = await provider.getVehicles();
		expect(vehicleRes.data).toEqual([]);
		expect(vehicleRes.error).toBeDefined();

		const departureRes = await provider.getDepartures();
		expect(departureRes.data).toBeDefined();
		expect(Array.isArray(departureRes.data)).toBe(true);
	});

	it('returns empty alerts by default', async () => {
		const provider = new LiveRedBusProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
