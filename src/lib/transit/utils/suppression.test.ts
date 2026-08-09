import { describe, expect, it } from 'vitest';
import type { SubwayDeparture } from '../domain/types';
import { suppressGhostSchedules } from './suppression';

describe('suppressGhostSchedules', () => {
	it('suppresses static timetable departures occurring prior to the furthest live departure in that direction', () => {
		const now = new Date();
		const tPlus10 = new Date(now.getTime() + 10 * 60000).toISOString();
		const tPlus20 = new Date(now.getTime() + 20 * 60000).toISOString();
		const tPlus30 = new Date(now.getTime() + 30 * 60000).toISOString();
		const tPlus50 = new Date(now.getTime() + 50 * 60000).toISOString();

		const mockDepartures: SubwayDeparture[] = [
			{
				id: 'live-1',
				mode: 'subway',
				routeId: 'F',
				routeName: 'MTA Subway',
				headsign: 'Manhattan',
				destinationName: 'Manhattan',
				direction: 'manhattan_bound',
				scheduledTime: tPlus10,
				predictedTime: tPlus10,
				isRealtime: true,
				status: 'normal',
				stopName: 'Roosevelt Island Station',
				track: 'Downtown',
				isShuttle: false,
			},
			{
				id: 'live-2',
				mode: 'subway',
				routeId: 'F',
				routeName: 'MTA Subway',
				headsign: 'Manhattan',
				destinationName: 'Manhattan',
				direction: 'manhattan_bound',
				scheduledTime: tPlus30,
				predictedTime: tPlus30,
				isRealtime: true,
				status: 'normal',
				stopName: 'Roosevelt Island Station',
				track: 'Downtown',
				isShuttle: false,
			},
			// Static entry at t+20 (prior to live-2 at t+30) -> Should be SUPPRESSED!
			{
				id: 'static-ghost',
				mode: 'subway',
				routeId: 'F',
				routeName: 'MTA Subway',
				headsign: 'Manhattan',
				destinationName: 'Manhattan',
				direction: 'manhattan_bound',
				scheduledTime: tPlus20,
				isRealtime: false,
				status: 'normal',
				stopName: 'Roosevelt Island Station',
				track: 'Downtown',
				isShuttle: false,
			},
			// Static entry at t+50 (after live-2 at t+30) -> Should be RETAINED!
			{
				id: 'static-future',
				mode: 'subway',
				routeId: 'F',
				routeName: 'MTA Subway',
				headsign: 'Manhattan',
				destinationName: 'Manhattan',
				direction: 'manhattan_bound',
				scheduledTime: tPlus50,
				isRealtime: false,
				status: 'normal',
				stopName: 'Roosevelt Island Station',
				track: 'Downtown',
				isShuttle: false,
			},
		];

		const result = suppressGhostSchedules(mockDepartures);
		const ids = result.map((d) => d.id);

		expect(ids).toContain('live-1');
		expect(ids).toContain('live-2');
		expect(ids).toContain('static-future');
		expect(ids).not.toContain('static-ghost');
	});
});
