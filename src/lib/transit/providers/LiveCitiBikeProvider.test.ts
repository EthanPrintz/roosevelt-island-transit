import { describe, expect, it, vi } from 'vitest';
import {
	CITIBIKE_INFO_URL,
	CITIBIKE_STATUS_URL,
	LiveCitiBikeProvider,
} from './LiveCitiBikeProvider';

describe('LiveCitiBikeProvider', () => {
	it('uses valid GBFS endpoint URLs', () => {
		expect(CITIBIKE_STATUS_URL).toBe('https://gbfs.citibikenyc.com/gbfs/en/station_status.json');
		expect(CITIBIKE_INFO_URL).toBe('https://gbfs.citibikenyc.com/gbfs/en/station_information.json');
	});

	it('conforms to TransitProvider contract for citibike mode and fetches stations', async () => {
		const provider = new LiveCitiBikeProvider();
		expect(provider.mode).toBe('citibike');
		expect(provider.capabilities.has('bike_stations')).toBe(true);

		const result = await provider.getBikeStations();
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
		expect(result.data.length).toBeGreaterThan(0);

		for (const station of result.data) {
			expect(station.mode).toBe('citibike');
			expect(typeof station.capacity).toBe('number');
			expect(station.bikesAvailable.total).toBeGreaterThanOrEqual(0);
			expect(station.docksAvailable).toBeGreaterThanOrEqual(0);
			expect(station.disabledBikes).toBeGreaterThanOrEqual(0);
			expect(station.disabledDocks).toBeGreaterThanOrEqual(0);
			expect(typeof station.lastReportedAgeMins).toBe('number');
		}
	});

	it('correctly maps GBFS station status and info for Roosevelt Island stations', async () => {
		const provider = new LiveCitiBikeProvider();
		const mockInfo = {
			data: {
				stations: [
					{
						station_id: 'test-1',
						name: 'Roosevelt Island Tramway',
						lat: 40.757284,
						lon: -73.9536,
						capacity: 30,
					},
					{
						station_id: 'test-2',
						name: 'Motorgate',
						lat: 40.7639089,
						lon: -73.9477213,
						capacity: 36,
					},
					{
						station_id: 'test-3',
						name: 'Times Square',
						lat: 40.758,
						lon: -73.9855,
						capacity: 50,
					},
				],
			},
		};

		const nowSec = Math.floor(Date.now() / 1000) - 120; // 2 mins ago
		const mockStatus = {
			data: {
				stations: [
					{
						station_id: 'test-1',
						num_bikes_available: 15,
						num_ebikes_available: 5,
						num_bikes_disabled: 1,
						num_docks_available: 14,
						num_docks_disabled: 0,
						is_installed: 1,
						is_renting: 1,
						is_returning: 1,
						last_reported: nowSec,
					},
					{
						station_id: 'test-2',
						num_bikes_available: 20,
						num_ebikes_available: 10,
						num_bikes_disabled: 2,
						num_docks_available: 14,
						num_docks_disabled: 0,
						is_installed: 1,
						is_renting: 1,
						is_returning: 1,
						last_reported: nowSec,
					},
					{
						station_id: 'test-3',
						num_bikes_available: 40,
						num_ebikes_available: 10,
						num_bikes_disabled: 0,
						num_docks_available: 10,
						num_docks_disabled: 0,
						is_installed: 1,
						is_renting: 1,
						is_returning: 1,
						last_reported: nowSec,
					},
				],
			},
		};

		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			const str = String(url);
			if (str.includes('station_status')) {
				return new Response(JSON.stringify(mockStatus), { status: 200 });
			}
			if (str.includes('station_information')) {
				return new Response(JSON.stringify(mockInfo), { status: 200 });
			}
			return new Response(null, { status: 404 });
		});

		try {
			const result = await provider.getBikeStations();
			expect(result.data.length).toBe(2);
			const tram = result.data.find((s) => s.name === 'Roosevelt Island Tramway');
			expect(tram).toBeDefined();
			expect(tram?.bikesAvailable.classic).toBe(10);
			expect(tram?.bikesAvailable.ebike).toBe(5);
			expect(tram?.bikesAvailable.total).toBe(15);
			expect(tram?.disabledBikes).toBe(1);
			expect(tram?.lastReportedAgeMins).toBeGreaterThanOrEqual(1);
		} finally {
			fetchSpy.mockRestore();
		}
	});

	it('returns empty alerts array by default', async () => {
		const provider = new LiveCitiBikeProvider();
		const result = await provider.getAlerts();
		expect(result.data).toEqual([]);
	});
});
