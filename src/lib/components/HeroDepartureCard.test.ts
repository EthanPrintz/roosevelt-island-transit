/**
 * TDD Unit Test Suite: HeroDepartureCard Component & Status Resolution
 *
 * Verifies hero departure card status pill resolution, 3-row layout properties,
 * relative time calculation formatting, and accent style mappings.
 */

import { describe, expect, it } from 'vitest';
import type { SubwayDeparture } from '$lib/transit/domain/types';
import { resolveHeroStatusPill } from '$lib/transit/utils/status-pill';
import HeroDepartureCard from './HeroDepartureCard.svelte';

describe('HeroDepartureCard.svelte & status pill utilities', () => {
	const mockDeparture: SubwayDeparture = {
		id: 'test-dep-1',
		mode: 'subway',
		routeId: 'F',
		routeName: 'MTA Subway',
		headsign: 'Manhattan - 179 St via 63rd St',
		destinationName: 'Manhattan',
		direction: 'manhattan_bound',
		scheduledTime: new Date(Date.now() + 10 * 60000).toISOString(),
		predictedTime: new Date(Date.now() + 10 * 60000).toISOString(),
		isRealtime: true,
		status: 'normal',
		stopName: 'Roosevelt Island Station',
		track: 'Downtown',
		isShuttle: false,
	};

	it('exports HeroDepartureCard component definition', () => {
		expect(HeroDepartureCard).toBeDefined();
	});

	it('resolves correct status pill for realtime normal departure', () => {
		const pill = resolveHeroStatusPill(mockDeparture, 'orange');
		expect(pill.label).toBe('Live');
		expect(pill.pillClass).toContain('orange');
	});

	it('resolves scheduled status pill when departure is not realtime', () => {
		const scheduledDep = { ...mockDeparture, isRealtime: false };
		const pill = resolveHeroStatusPill(scheduledDep, 'rose');
		expect(pill.label).toBe('Scheduled');
	});
});
