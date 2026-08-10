/**
 * Unit Test Suite: Map Adapter GeoJSON Converters
 *
 * Verifies domain model conversions into GeoJSON FeatureCollections for MapLibre GL JS,
 * including coordinate ordering [lng, lat], mode properties, bike availability ratios,
 * and robust handling of missing/malformed telemetry.
 */

import { describe, expect, it } from 'vitest';
import type { BikeStation, LiveVehiclePosition } from '$lib/transit/domain/types';
import {
	bikeStationsToGeoJSON,
	getFixedTransitStopsGeoJSON,
	getTransitRoutesGeoJSON,
	vehiclesToGeoJSON,
} from '$lib/transit/map/map-adapter';

describe('map-adapter.ts', () => {
	describe('vehiclesToGeoJSON', () => {
		it('returns an empty FeatureCollection when vehicle list is empty', () => {
			const result = vehiclesToGeoJSON([]);
			expect(result.type).toBe('FeatureCollection');
			expect(result.features).toHaveLength(0);
		});

		it('converts LiveVehiclePosition array to GeoJSON Point features with correct coordinates and properties', () => {
			const mockVehicles: LiveVehiclePosition[] = [
				{
					id: 'bus-101',
					vehicleId: '101',
					mode: 'red_bus',
					routeId: 'RED_LOOP',
					direction: 'northbound',
					lat: 40.7615,
					lng: -73.9496,
					bearing: 45,
					speedMps: 5.2,
					nextStopName: 'Octagon',
					destinationName: 'North Loop',
					occupancy: 'few_seats_available',
					updatedAt: '2026-08-10T12:00:00Z',
				},
				{
					id: 'ferry-3',
					vehicleId: 'ASTORIA-03',
					mode: 'ferry',
					routeId: 'ASTORIA',
					direction: 'southbound',
					lat: 40.757,
					lng: -73.951,
					bearing: 180,
					updatedAt: '2026-08-10T12:00:00Z',
				},
			];

			const result = vehiclesToGeoJSON(mockVehicles);
			expect(result.type).toBe('FeatureCollection');
			expect(result.features).toHaveLength(2);

			const busFeature = result.features[0];
			expect(busFeature.geometry.type).toBe('Point');
			// Note: GeoJSON uses [longitude, latitude]
			expect(busFeature.geometry.coordinates).toEqual([-73.9496, 40.7615]);
			expect(busFeature.properties?.id).toBe('bus-101');
			expect(busFeature.properties?.mode).toBe('red_bus');
			expect(busFeature.properties?.routeLabel).toBe('Bus');
			expect(busFeature.properties?.bearing).toBe(45);
			expect(busFeature.properties?.color).toBeDefined();

			const ferryFeature = result.features[1];
			expect(ferryFeature.geometry.coordinates).toEqual([-73.951, 40.757]);
			expect(ferryFeature.properties?.mode).toBe('ferry');
			expect(ferryFeature.properties?.routeLabel).toBe('Ferry');
			expect(ferryFeature.properties?.bearing).toBe(180);
		});

		it('filters out or safely handles malformed vehicles with invalid coordinates', () => {
			const malformedVehicles: LiveVehiclePosition[] = [
				{
					id: 'bad-1',
					vehicleId: 'bad-1',
					mode: 'q102_bus',
					routeId: 'Q102',
					direction: 'northbound',
					lat: Number.NaN,
					lng: -73.94,
					updatedAt: '2026-08-10T12:00:00Z',
				},
				{
					id: 'valid-1',
					vehicleId: 'valid-1',
					mode: 'q102_bus',
					routeId: 'Q102',
					direction: 'southbound',
					lat: 40.76,
					lng: -73.95,
					updatedAt: '2026-08-10T12:00:00Z',
				},
			];

			const result = vehiclesToGeoJSON(malformedVehicles);
			expect(result.features).toHaveLength(1);
			expect(result.features[0].properties?.id).toBe('valid-1');
		});
	});

	describe('bikeStationsToGeoJSON', () => {
		it('converts BikeStation array to GeoJSON Point features with status metrics', () => {
			const mockStations: BikeStation[] = [
				{
					id: 'citibike-1',
					name: 'Roosevelt Island Tramway Station',
					mode: 'citibike',
					location: { lat: 40.7601, lng: -73.9525 },
					capacity: 30,
					bikesAvailable: { classic: 10, ebike: 5, total: 15 },
					docksAvailable: 15,
					isRenting: true,
					isReturning: true,
					status: 'normal',
					lastReported: '2026-08-10T12:00:00Z',
				},
				{
					id: 'citibike-2',
					name: 'Motorgate Garage',
					mode: 'citibike',
					location: { lat: 40.7645, lng: -73.9482 },
					capacity: 20,
					bikesAvailable: { classic: 0, ebike: 0, total: 0 },
					docksAvailable: 20,
					isRenting: true,
					isReturning: true,
					status: 'delays',
					lastReported: '2026-08-10T12:00:00Z',
				},
			];

			const result = bikeStationsToGeoJSON(mockStations);
			expect(result.type).toBe('FeatureCollection');
			expect(result.features).toHaveLength(2);

			const station1 = result.features[0];
			expect(station1.geometry.coordinates).toEqual([-73.9525, 40.7601]);
			expect(station1.properties?.bikesAvailable).toBe(15);
			expect(station1.properties?.docksAvailable).toBe(15);
			expect(station1.properties?.statusColor).toBeDefined();

			const station2 = result.features[1];
			expect(station2.properties?.bikesAvailable).toBe(0);
			expect(station2.properties?.statusColor).toBe('#ef4444'); // Empty station gets red status color
		});
	});

	describe('getFixedTransitStopsGeoJSON', () => {
		it('returns static GeoJSON points for Roosevelt Island major transit hubs', () => {
			const result = getFixedTransitStopsGeoJSON();
			expect(result.type).toBe('FeatureCollection');
			expect(result.features.length).toBeGreaterThanOrEqual(4);

			const subwayStop = result.features.find((f) => f.properties?.id === 'stop-subway-ri');
			expect(subwayStop).toBeDefined();
			expect(subwayStop?.properties?.title).toBe('Roosevelt Island Subway Station');
			expect(subwayStop?.properties?.mode).toBe('subway');

			const ferryStop = result.features.find((f) => f.properties?.id === 'stop-ferry-ri');
			expect(ferryStop).toBeDefined();
			expect(ferryStop?.properties?.mode).toBe('ferry');
		});
	});

	describe('getTransitRoutesGeoJSON', () => {
		it('returns static GeoJSON LineStrings for Roosevelt Island transit corridors', () => {
			const result = getTransitRoutesGeoJSON();
			expect(result.type).toBe('FeatureCollection');
			expect(result.features.length).toBeGreaterThanOrEqual(2);

			const tramLine = result.features.find((f) => f.properties?.id === 'route-tram');
			expect(tramLine).toBeDefined();
			expect(tramLine?.geometry.type).toBe('LineString');
			expect(tramLine?.properties?.color).toBeDefined();

			const redBusLoop = result.features.find((f) => f.properties?.id === 'route-redbus');
			expect(redBusLoop).toBeDefined();
			expect(redBusLoop?.geometry.type).toBe('MultiLineString');
		});
	});
});
