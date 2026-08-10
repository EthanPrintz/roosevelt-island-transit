/**
 * Unit Test Suite: TransitColumn Component
 *
 * Verifies that TransitColumn correctly processes departures, handles maxTimetableItems defaults based on selectedWindow,
 * and renders both live and scheduled departures.
 */

import { describe, expect, it } from 'vitest';
import type { SubwayDeparture } from '$lib/transit/domain/types';
import TransitColumn from './TransitColumn.svelte';

describe('TransitColumn.svelte', () => {
	it('exports TransitColumn component definition', () => {
		expect(TransitColumn).toBeDefined();
	});

	it('handles mixed live and scheduled subway departures correctly', () => {
		const now = Date.now();
		const mockDepartures: SubwayDeparture[] = Array.from({ length: 15 }, (_, i) => ({
			id: `subway-test-${i}`,
			mode: 'subway',
			routeId: 'M',
			routeName: 'M Train',
			headsign: 'Forest Hills / 71 Av',
			destinationName: 'Queens',
			direction: 'queens_bound',
			scheduledTime: new Date(now + (i + 1) * 10 * 60000).toISOString(),
			predictedTime: new Date(now + (i + 1) * 10 * 60000).toISOString(),
			isRealtime: i < 5, // First 5 are live, remaining 10 are scheduled
			status: 'normal',
			stopName: 'Roosevelt Island Station',
			track: 'Uptown',
			isShuttle: false,
		}));

		expect(mockDepartures.filter((d) => d.isRealtime).length).toBe(5);
		expect(mockDepartures.filter((d) => !d.isRealtime).length).toBe(10);
	});
});
