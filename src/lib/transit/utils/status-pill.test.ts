import {
	AnchorIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	FlashIcon,
} from '@hugeicons/core-free-icons';
import { describe, expect, it } from 'vitest';
import type { FerryDeparture, TramDeparture, TransitDeparture } from '../domain/types';
import { resolveHeroStatusPill } from './status-pill';

describe('resolveHeroStatusPill', () => {
	it('resolves Boarding state for Tramway when isBoarding is true', () => {
		const tram: TramDeparture = {
			id: 'tram-1',
			mode: 'tram',
			routeId: 'TRAM',
			routeName: 'Roosevelt Island Tramway',
			headsign: 'Manhattan',
			destinationName: 'Manhattan',
			direction: 'manhattan_bound',
			scheduledTime: new Date().toISOString(),
			isRealtime: false,
			status: 'normal',
			stopName: 'Roosevelt Island',
			cabin: 'NORTH',
			isBoarding: true,
		};

		const result = resolveHeroStatusPill(tram, 'rose');
		expect(result.label).toBe('Boarding');
		expect(result.icon).toBe(CheckmarkCircle01Icon);
		expect(result.pillClass).toContain('bg-rose-500/15');
	});

	it('resolves At Dock state for Ferry when speedKnots < 1', () => {
		const ferry: FerryDeparture = {
			id: 'ferry-1',
			mode: 'ferry',
			routeId: 'FERRY',
			routeName: 'NYC Ferry',
			headsign: 'Wall St',
			destinationName: 'Wall St',
			direction: 'southbound',
			scheduledTime: new Date().toISOString(),
			isRealtime: true,
			status: 'normal',
			stopName: 'Roosevelt Island',
			pierName: 'Roosevelt Island',
			speedKnots: 0.5,
			vesselName: 'Gov. Frank Keating',
		};

		const result = resolveHeroStatusPill(ferry, 'cyan');
		expect(result.label).toBe('At Dock');
		expect(result.icon).toBe(AnchorIcon);
		expect(result.pillClass).toContain('bg-cyan-500/15');
	});

	it('resolves En Route state for general realtime departures', () => {
		const bus: TransitDeparture = {
			id: 'bus-1',
			mode: 'q102_bus',
			routeId: 'Q102',
			routeName: 'MTA Q102 Bus',
			headsign: 'Astoria',
			destinationName: 'Astoria',
			direction: 'queens_bound',
			scheduledTime: new Date(Date.now() + 10 * 60000).toISOString(),
			isRealtime: true,
			status: 'normal',
			stopName: 'Subway Plaza',
		};

		const result = resolveHeroStatusPill(bus, 'blue');
		expect(result.label).toBe('Live');
		expect(result.icon).toBe(FlashIcon);
		expect(result.pillClass).toContain('bg-blue-500/15');
	});

	it('resolves Scheduled state for non-realtime fallback departures', () => {
		const bus: TransitDeparture = {
			id: 'bus-static-1',
			mode: 'q102_bus',
			routeId: 'Q102',
			routeName: 'MTA Q102 Bus',
			headsign: 'Astoria',
			destinationName: 'Astoria',
			direction: 'queens_bound',
			scheduledTime: new Date(Date.now() + 30 * 60000).toISOString(),
			isRealtime: false,
			status: 'normal',
			stopName: 'Subway Plaza',
		};

		const result = resolveHeroStatusPill(bus, 'orange');
		expect(result.label).toBe('Scheduled');
		expect(result.icon).toBe(Clock01Icon);
		expect(result.pillClass).toContain('bg-orange-500/15');
	});
});
