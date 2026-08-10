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

	it('returns an empty array when given an empty list', () => {
		expect(suppressGhostSchedules([])).toEqual([]);
	});

	it('retains all static departures when no live departures exist', () => {
		const static1: SubwayDeparture = {
			id: 'static-1',
			mode: 'subway',
			routeId: 'F',
			routeName: 'MTA Subway',
			headsign: 'Queens',
			destinationName: 'Jamaica',
			direction: 'queens_bound',
			scheduledTime: new Date(Date.now() + 60000).toISOString(),
			isRealtime: false,
			status: 'normal',
			stopName: 'Roosevelt Island Station',
			track: 'Uptown',
			isShuttle: false,
		};
		const result = suppressGhostSchedules([static1]);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('static-1');
	});

	it('suppresses static departure when scheduledTime matches max live timestamp exactly', () => {
		const now = new Date();
		const tPlus20 = new Date(now.getTime() + 20 * 60000).toISOString();

		const liveDep: SubwayDeparture = {
			id: 'live-exact',
			mode: 'subway',
			routeId: 'F',
			routeName: 'MTA Subway',
			headsign: 'Manhattan',
			destinationName: 'Manhattan',
			direction: 'manhattan_bound',
			scheduledTime: tPlus20,
			predictedTime: tPlus20,
			isRealtime: true,
			status: 'normal',
			stopName: 'Roosevelt Island Station',
			track: 'Downtown',
			isShuttle: false,
		};

		const staticDep: SubwayDeparture = {
			id: 'static-exact',
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
		};

		const result = suppressGhostSchedules([liveDep, staticDep]);
		const ids = result.map((d) => d.id);
		expect(ids).toContain('live-exact');
		expect(ids).not.toContain('static-exact');
	});

	it('suppresses independently per direction', () => {
		const tPlus10 = new Date(Date.now() + 10 * 60000).toISOString();
		const tPlus20 = new Date(Date.now() + 20 * 60000).toISOString();

		const liveManhattan: SubwayDeparture = {
			id: 'live-m',
			mode: 'subway',
			routeId: 'F',
			routeName: 'MTA Subway',
			headsign: 'Manhattan',
			destinationName: 'Manhattan',
			direction: 'manhattan_bound',
			scheduledTime: tPlus20,
			isRealtime: true,
			status: 'normal',
			stopName: 'Roosevelt Island Station',
			track: 'Downtown',
			isShuttle: false,
		};

		const staticQueens: SubwayDeparture = {
			id: 'static-q',
			mode: 'subway',
			routeId: 'F',
			routeName: 'MTA Subway',
			headsign: 'Queens',
			destinationName: 'Jamaica',
			direction: 'queens_bound',
			scheduledTime: tPlus10,
			isRealtime: false,
			status: 'normal',
			stopName: 'Roosevelt Island Station',
			track: 'Uptown',
			isShuttle: false,
		};

		const result = suppressGhostSchedules([liveManhattan, staticQueens]);
		const ids = result.map((d) => d.id);
		// static-q should NOT be suppressed because live-m is in a different direction
		expect(ids).toContain('live-m');
		expect(ids).toContain('static-q');
	});
});
