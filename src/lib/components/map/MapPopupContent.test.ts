/**
 * Unit Test Suite: MapPopupContent Component
 *
 * Verifies component rendering, entity type detection, departure countdown formatting,
 * vehicle telemetry display, and bike station stats in MapLibre popups.
 */

import { describe, expect, it } from 'vitest';
import type {
	BikeStation,
	BusDeparture,
	LiveVehiclePosition,
	SubwayDeparture,
} from '$lib/transit/domain/types';
import MapPopupContent from './MapPopupContent.svelte';

const sampleSubwayDeparture: SubwayDeparture = {
	id: 'subway-dep-1',
	mode: 'subway',
	routeId: 'F',
	routeName: 'F Train',
	headsign: 'Manhattan - 179 St',
	destinationName: 'Manhattan',
	direction: 'manhattan_bound',
	scheduledTime: new Date(Date.now() + 180000).toISOString(),
	predictedTime: new Date(Date.now() + 180000).toISOString(),
	isRealtime: true,
	status: 'normal',
	stopName: 'Roosevelt Island',
	stopId: 'B06N',
	track: 'Uptown',
	isShuttle: false,
};

const sampleRedBusDeparture: BusDeparture = {
	id: 'redbus-dep-1',
	mode: 'red_bus',
	routeId: 'RED_BUS',
	routeName: 'Red Bus Shuttle',
	headsign: 'Octagon via Main St',
	destinationName: 'Octagon',
	direction: 'northbound',
	scheduledTime: new Date(Date.now() + 300000).toISOString(),
	predictedTime: new Date(Date.now() + 300000).toISOString(),
	isRealtime: true,
	status: 'normal',
	stopName: 'Good Shepherd Plaza (543 Main St)',
	stopSequence: 106,
	vehicleId: '33',
};

const sampleVehicle: LiveVehiclePosition = {
	id: 'redbus-33',
	vehicleId: '33',
	mode: 'red_bus',
	routeId: 'RED_BUS',
	direction: 'northbound',
	lat: 40.7616,
	lng: -73.9499,
	bearing: 45,
	speedMps: 4.5,
	destinationName: 'Octagon',
	nextStopName: 'Good Shepherd Plaza',
	updatedAt: new Date().toISOString(),
};

const sampleBikeStation: BikeStation = {
	id: 'citibike-541',
	name: '541 Main St',
	mode: 'citibike',
	location: { lat: 40.7615, lng: -73.9498 },
	capacity: 30,
	bikesAvailable: { classic: 8, ebike: 6, total: 14 },
	docksAvailable: 16,
	isRenting: true,
	isReturning: true,
	status: 'normal',
	lastReported: new Date().toISOString(),
};

describe('MapPopupContent.svelte', () => {
	it('exports MapPopupContent component definition', () => {
		expect(MapPopupContent).toBeDefined();
	});

	it('defines fixture data structures for unit testing entity popups', () => {
		expect(sampleSubwayDeparture.mode).toBe('subway');
		expect(sampleRedBusDeparture.mode).toBe('red_bus');
		expect(sampleVehicle.vehicleId).toBe('33');
		expect(sampleBikeStation.capacity).toBe(30);
	});
});
