import { describe, expect, it } from 'vitest';
import { GtfsStaticStore } from './gtfs-static';

describe('GtfsStaticStore', () => {
	it('instantiates cleanly and evaluates service active days correctly', () => {
		const store = new GtfsStaticStore();
		expect(store).toBeDefined();

		const dataset = {
			trips: new Map(),
			stopTimes: new Map(),
			calendar: new Map([
				['1', { days: [1, 2, 3, 4, 5], startDate: '20260101', endDate: '20261231' }], // Mon-Fri
				['2', { days: [0, 6], startDate: '20260101', endDate: '20261231' }], // Sat-Sun
			]),
			calendarDates: new Map(),
		};

		// 2026-08-08 is a Saturday (day 6)
		const saturday = new Date('2026-08-08T12:00:00Z');
		expect(store.isServiceActive(dataset, '1', saturday)).toBe(false);
		expect(store.isServiceActive(dataset, '2', saturday)).toBe(true);

		// 2026-08-10 is a Monday (day 1)
		const monday = new Date('2026-08-10T12:00:00Z');
		expect(store.isServiceActive(dataset, '1', monday)).toBe(true);
		expect(store.isServiceActive(dataset, '2', monday)).toBe(false);
	});
});
