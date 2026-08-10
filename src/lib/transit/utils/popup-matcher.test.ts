/**
 * Unit Test Suite: Popup Matcher Utility
 *
 * Verifies filtering and matching logic for fixed transit stops, live vehicle positions,
 * bike stations, and service alerts in map popups.
 */

import { describe, expect, it } from 'vitest';
import type {
	BikeStation,
	BusDeparture,
	FerryDeparture,
	LiveVehiclePosition,
	SubwayDeparture,
	TramDeparture,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import {
	getAlertsForStopOrMode,
	getBikeStationDetails,
	getDeparturesForStop,
	getVehicleDetails,
} from './popup-matcher';

const mockDepartures: TransitDeparture[] = [
	{
		id: 'subway-1',
		mode: 'subway',
		routeId: 'F',
		routeName: 'F Train',
		headsign: 'Manhattan - 179 St',
		destinationName: 'Manhattan',
		direction: 'manhattan_bound',
		scheduledTime: '2026-08-10T15:00:00Z',
		predictedTime: '2026-08-10T15:02:00Z',
		isRealtime: true,
		status: 'normal',
		stopName: 'Roosevelt Island',
		stopId: 'B06N',
		track: 'Uptown',
		isShuttle: false,
	} as SubwayDeparture,
	{
		id: 'tram-1',
		mode: 'tram',
		routeId: 'TRAM',
		routeName: 'Tramway',
		headsign: 'Manhattan 59th St',
		destinationName: 'Manhattan',
		direction: 'manhattan_bound',
		scheduledTime: '2026-08-10T15:05:00Z',
		isRealtime: true,
		status: 'normal',
		stopName: 'Roosevelt Island Tram Station',
		cabin: 'NORTH',
		isBoarding: true,
	} as TramDeparture,
	{
		id: 'ferry-1',
		mode: 'ferry',
		routeId: 'ASTORIA',
		routeName: 'Astoria Line',
		headsign: 'Wall St / Pier 11',
		destinationName: 'Wall St',
		direction: 'southbound',
		scheduledTime: '2026-08-10T15:10:00Z',
		isRealtime: true,
		status: 'normal',
		stopName: 'Roosevelt Island',
		stopId: '25',
		vesselName: 'Curlew',
		pierName: 'Roosevelt Island Pier',
	} as FerryDeparture,
	{
		id: 'redbus-1',
		mode: 'red_bus',
		routeId: 'RED_BUS',
		routeName: 'Red Bus',
		headsign: 'Octagon via Main St',
		destinationName: 'Octagon',
		direction: 'northbound',
		scheduledTime: '2026-08-10T15:03:00Z',
		predictedTime: '2026-08-10T15:03:00Z',
		isRealtime: true,
		status: 'normal',
		stopName: 'Good Shepherd Plaza (543 Main St)',
		stopSequence: 106,
		vehicleId: '33',
	} as BusDeparture,
	{
		id: 'q102-1',
		mode: 'q102_bus',
		routeId: 'Q102',
		routeName: 'Q102 Bus',
		headsign: '27 Ave / Astoria',
		destinationName: 'Astoria',
		direction: 'queens_bound',
		scheduledTime: '2026-08-10T15:15:00Z',
		isRealtime: true,
		status: 'normal',
		stopName: 'Main St / 10 River Rd',
		stopId: '450141',
	} as BusDeparture,
];

const mockVehicles: LiveVehiclePosition[] = [
	{
		id: 'redbus-33',
		vehicleId: '33',
		mode: 'red_bus',
		routeId: 'RED_BUS',
		direction: 'northbound',
		lat: 40.7616,
		lng: -73.9499,
		bearing: 45,
		speedMps: 5.2,
		destinationName: 'Octagon',
		updatedAt: '2026-08-10T14:52:00Z',
	},
];

const mockStations: BikeStation[] = [
	{
		id: 'citibike-station-1',
		name: '541 Main St',
		mode: 'citibike',
		location: { lat: 40.7615, lng: -73.9498 },
		capacity: 25,
		bikesAvailable: { classic: 6, ebike: 4, total: 10 },
		docksAvailable: 15,
		isRenting: true,
		isReturning: true,
		status: 'normal',
		lastReported: '2026-08-10T14:50:00Z',
	},
];

const mockAlerts: TransitAlert[] = [
	{
		id: 'alert-1',
		mode: 'subway',
		affectedRoutes: ['F'],
		title: 'Subway Delays',
		description: 'Signal maintenance at 63rd St',
		severity: 'warning',
		effect: 'DELAYS',
	},
];

describe('popup-matcher.ts', () => {
	it('filters departures for Roosevelt Island Subway Station', () => {
		const res = getDeparturesForStop('stop-subway-ri', mockDepartures);
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('subway-1');
	});

	it('filters departures for Tramway Island Station', () => {
		const res = getDeparturesForStop('stop-tram-ri', mockDepartures);
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('tram-1');
	});

	it('filters departures for Ferry Dock', () => {
		const res = getDeparturesForStop('stop-ferry-ri', mockDepartures);
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('ferry-1');
	});

	it('filters departures for Red Bus stop by matching stop tag/name', () => {
		const res = getDeparturesForStop('stop-redbus-543main', mockDepartures);
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('redbus-1');
	});

	it('filters departures for Q102 stop by matching stopId', () => {
		const res = getDeparturesForStop('stop-q102-450141', mockDepartures);
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('q102-1');
	});

	it('retrieves live vehicle position by ID', () => {
		const v = getVehicleDetails('redbus-33', mockVehicles);
		expect(v).toBeDefined();
		expect(v?.vehicleId).toBe('33');
	});

	it('retrieves Citi Bike station details by ID', () => {
		const s = getBikeStationDetails('citibike-station-1', mockStations);
		expect(s).toBeDefined();
		expect(s?.bikesAvailable.total).toBe(10);
	});

	it('filters alerts by stop ID or transit mode', () => {
		const a = getAlertsForStopOrMode('stop-subway-ri', 'subway', mockAlerts);
		expect(a).toHaveLength(1);
		expect(a[0].title).toBe('Subway Delays');
	});
});
