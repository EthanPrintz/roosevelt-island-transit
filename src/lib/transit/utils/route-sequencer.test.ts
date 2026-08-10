/**
 * Unit Test Suite: Route Sequencer & Upcoming Stops Utility
 *
 * Verifies upcoming stop generation for live vehicles across all Roosevelt Island transit modes
 * (Red Bus, Q102 Bus, NYC Ferry, Tramway, MTA F Train).
 */

import { describe, expect, it } from 'vitest';
import type { LiveVehiclePosition } from '$lib/transit/domain/types';
import {
	getUpcomingStopsForVehicle,
	type UpcomingStopItem,
} from '$lib/transit/utils/route-sequencer';

describe('route-sequencer.ts', () => {
	it('returns upcoming stops for Northbound Red Bus based on vehicle position', () => {
		const bus: LiveVehiclePosition = {
			id: 'redbus-33',
			vehicleId: '33',
			mode: 'red_bus',
			routeId: 'RED_BUS',
			direction: 'northbound',
			lat: 40.7616, // Near Good Shepherd Plaza (543 Main St)
			lng: -73.9499,
			bearing: 15,
			destinationName: 'Octagon',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(bus, 4);
		expect(stops.length).toBe(4);
		const titles = stops.map((s: UpcomingStopItem) => s.title);
		expect(titles.some((t: string) => t.includes('Post Office'))).toBe(true);
		expect(titles.some((t: string) => t.includes('Capobianco'))).toBe(true);
	});

	it('returns upcoming stops for Southbound Red Bus', () => {
		const bus: LiveVehiclePosition = {
			id: 'redbus-12',
			vehicleId: '12',
			mode: 'red_bus',
			routeId: 'RED_BUS',
			direction: 'southbound',
			lat: 40.766, // Near 40 River Road (Southbound)
			lng: -73.946,
			bearing: 195,
			destinationName: 'Cornell Tech',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(bus, 4);
		expect(stops.length).toBe(4);
		const titles = stops.map((s: UpcomingStopItem) => s.title);
		expect(titles.some((t: string) => t.includes('Good Shepherd Plaza'))).toBe(true);
		expect(titles.some((t: string) => t.includes('Motorgate'))).toBe(true);
	});

	it('returns upcoming stops for NYC Ferry Northbound line with Astoria Landing FIRST', () => {
		const ferry: LiveVehiclePosition = {
			id: 'ferry-h110',
			vehicleId: 'H110',
			mode: 'ferry',
			routeId: 'ASTORIA',
			direction: 'northbound',
			lat: 40.7568,
			lng: -73.9525,
			bearing: 25,
			destinationName: 'East 90th St / Astoria',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(ferry);
		expect(stops.length).toBe(2);
		expect(stops[0].title).toBe('Astoria Landing');
		expect(stops[1].title).toBe('East 90th St');
	});

	it('returns upcoming stops for NYC Ferry Southbound line', () => {
		const ferry: LiveVehiclePosition = {
			id: 'ferry-curlew',
			vehicleId: 'Curlew',
			mode: 'ferry',
			routeId: 'ASTORIA',
			direction: 'southbound',
			lat: 40.7568,
			lng: -73.9525,
			bearing: 210,
			destinationName: 'Wall St / Pier 11',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(ferry);
		expect(stops.length).toBeGreaterThan(0);
		expect(stops[0].title).toBe('Long Island City (Hunters Point South)');
		expect(stops[stops.length - 1].title).toBe('Wall St / Pier 11');
	});

	it('returns upcoming stops for Subway F Train approaching Roosevelt Island Station', () => {
		const subway: LiveVehiclePosition = {
			id: 'subway-f',
			vehicleId: 'F-1234',
			mode: 'subway',
			routeId: 'F',
			direction: 'manhattan_bound',
			lat: 40.7592,
			lng: -73.9534,
			bearing: 250,
			nextStopName: 'Roosevelt Island',
			destinationName: 'Manhattan - 179 St',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(subway);
		expect(stops.length).toBeGreaterThan(0);
		expect(stops[0].title).toBe('Roosevelt Island Station');
		expect(stops[1].title).toBe('Lexington Ave / 63rd St');
	});

	it('attaches calculated ETA times (etaSeconds, countdownText, formattedTime) to each upcoming stop', () => {
		const ferry: LiveVehiclePosition = {
			id: 'ferry-h110',
			vehicleId: 'H110',
			mode: 'ferry',
			routeId: 'ASTORIA',
			direction: 'northbound',
			lat: 40.7568,
			lng: -73.9525,
			bearing: 25,
			destinationName: 'East 90th St / Astoria',
			updatedAt: new Date().toISOString(),
		};

		const stops = getUpcomingStopsForVehicle(ferry, 4, '2026-08-10T15:14:00Z');
		expect(stops.length).toBe(2);
		expect(stops[0].etaSeconds).toBeGreaterThan(0);
		expect(stops[0].countdownText).toBeDefined();
		expect(stops[0].formattedTime).toBeDefined();
		const firstEta = stops[0].etaSeconds ?? 0;
		const secondEta = stops[1].etaSeconds ?? 0;
		expect(secondEta).toBeGreaterThan(firstEta);
	});
});
