import type { TransitDeparture } from '../domain/types';

/**
 * suppressGhostSchedules
 *
 * Evaluates live real-time departures against static scheduled departures.
 * Calculates the maximum real-time prediction timestamp (T_max_live) for each stopName & direction.
 * Automatically suppresses any static scheduled entry (isRealtime === false)
 * whose scheduled departure time is earlier than or equal to T_max_live for that stop & direction.
 *
 * @param departures Array of mixed live & static transit departures
 * @returns Filtered array with ghost scheduled entries removed
 */
export function suppressGhostSchedules<T extends TransitDeparture>(departures: T[]): T[] {
	const nowMs = Date.now();
	const maxLiveMsByStopAndDirection = new Map<string, number>();

	// 1. Identify maximum live real-time prediction timestamp per stopName & direction
	for (const dep of departures) {
		if (!dep.isRealtime) continue;
		const timeMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
		const stopKey = `${dep.stopName || dep.stopId || 'all'}:${dep.direction}`;
		const currentMax = maxLiveMsByStopAndDirection.get(stopKey) || 0;
		if (timeMs > currentMax) {
			maxLiveMsByStopAndDirection.set(stopKey, timeMs);
		}
	}

	// 2. Filter out past trips and ghost scheduled trips prior to T_max_live per stop
	return departures.filter((dep) => {
		const arrivalMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
		const diffMins = (arrivalMs - nowMs) / 60000;

		// Discard static scheduled entries as soon as their departure time passes
		if (!dep.isRealtime && diffMins < 0) return false;

		// Discard live departures that left more than 2 minutes ago
		if (diffMins < -2) return false;

		// Always retain live tracked departures
		if (dep.isRealtime) return true;

		const stopKey = `${dep.stopName || dep.stopId || 'all'}:${dep.direction}`;
		const maxLiveMs = maxLiveMsByStopAndDirection.get(stopKey) || 0;

		// Suppress static timetable entry if a live departure exists at or after this time at this stop
		if (maxLiveMs > 0 && arrivalMs <= maxLiveMs) {
			return false;
		}

		return true;
	});
}
