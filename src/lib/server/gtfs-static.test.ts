import { describe, expect, it } from 'vitest';
import { type GtfsDataset, GtfsStaticStore, getLocalDateComponents } from './gtfs-static';

describe('GtfsStaticStore & Timezone Helpers', () => {
	it('extracts local NYC date components regardless of UTC date rollover', () => {
		// Sunday 9:00 PM EDT (UTC is Monday 1:00 AM)
		const sundayNightEdT = new Date('2026-08-09T21:00:00-04:00');
		const components = getLocalDateComponents(sundayNightEdT);

		expect(components.dateStr).toBe('20260809');
		expect(components.dayOfWeek).toBe(0); // Sunday
	});

	it('evaluates active service days according to calendar.txt', () => {
		const store = new GtfsStaticStore();

		const dataset: GtfsDataset = {
			trips: new Map([
				['trip-1', { routeId: 'F', serviceId: '1', headsign: 'Jamaica', directionId: 1 }],
				['trip-2', { routeId: 'F', serviceId: '2', headsign: 'Manhattan', directionId: 0 }],
			]),
			stopTimes: new Map([
				[
					'B06N',
					[
						{
							tripId: 'trip-1',
							stopId: 'B06N',
							arrivalTime: '12:30:00',
							departureTime: '12:30:00',
							stopSequence: 1,
						},
					],
				],
			]),
			calendar: new Map([
				['1', { days: [1, 2, 3, 4, 5], startDate: '20260101', endDate: '20261231' }], // Mon-Fri
				['2', { days: [0, 6], startDate: '20260101', endDate: '20261231' }], // Sat-Sun
			]),
			calendarDates: new Map(),
		};

		// 2026-08-08 is Saturday (day 6)
		const saturday = new Date('2026-08-08T12:00:00Z');
		expect(store.isServiceActive(dataset, '1', saturday)).toBe(false);
		expect(store.isServiceActive(dataset, '2', saturday)).toBe(true);

		// 2026-08-10 is Monday (day 1)
		const monday = new Date('2026-08-10T12:00:00Z');
		expect(store.isServiceActive(dataset, '1', monday)).toBe(true);
		expect(store.isServiceActive(dataset, '2', monday)).toBe(false);
	});

	it('respects calendar_dates.txt exception overrides', () => {
		const store = new GtfsStaticStore();

		const dataset: GtfsDataset = {
			trips: new Map(),
			stopTimes: new Map(),
			calendar: new Map([
				['1', { days: [1, 2, 3, 4, 5], startDate: '20260101', endDate: '20261231' }],
			]),
			calendarDates: new Map([
				['1', [{ date: '20260808', exceptionType: 1 }]], // Add service on Saturday
				['2', [{ date: '20260808', exceptionType: 2 }]], // Remove service on Saturday
			]),
		};

		const saturday = new Date('2026-08-08T12:00:00Z');
		expect(store.isServiceActive(dataset, '1', saturday)).toBe(true); // Exception 1 override
		expect(store.isServiceActive(dataset, '2', saturday)).toBe(false); // Exception 2 override
	});

	it('queries scheduled departures within the specified time window', () => {
		const store = new GtfsStaticStore();
		const dataset: GtfsDataset = {
			trips: new Map([
				['trip-1', { routeId: 'F', serviceId: '1', headsign: 'Jamaica', directionId: 1 }],
				['trip-2', { routeId: 'F', serviceId: '1', headsign: 'Manhattan', directionId: 0 }],
			]),
			stopTimes: new Map([
				[
					'B06N',
					[
						{
							tripId: 'trip-1',
							stopId: 'B06N',
							arrivalTime: '12:30:00',
							departureTime: '12:30:00',
							stopSequence: 1,
						},
					],
				],
				[
					'B06S',
					[
						{
							tripId: 'trip-2',
							stopId: 'B06S',
							arrivalTime: '12:45:00',
							departureTime: '12:45:00',
							stopSequence: 1,
						},
					],
				],
			]),
			calendar: new Map([['1', { days: [1], startDate: '20260101', endDate: '20261231' }]]),
			calendarDates: new Map(),
		};

		// @ts-expect-error accessing private property for unit testing
		store.datasets.set('test-subway', dataset);

		const mondayNoon = new Date('2026-08-10T12:00:00-04:00'); // Monday 12:00

		const departures = store.getScheduledDepartures('test-subway', 'B06', mondayNoon, 60);
		expect(departures.length).toBe(2);
		expect(departures[0].tripId).toBe('trip-1');
		expect(departures[1].tripId).toBe('trip-2');
	});
});
