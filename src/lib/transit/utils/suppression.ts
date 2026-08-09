import type { TransitDeparture } from '../domain/types';

/**
 * suppressGhostSchedules
 *
 * Evaluates live real-time departures against static scheduled departures.
 * Calculates the maximum real-time prediction timestamp (T_max_live) for each direction.
 * Automatically suppresses any static scheduled entry (isRealtime === false)
 * whose scheduled departure time is earlier than or equal to T_max_live in that direction.
 *
 * @param departures Array of mixed live & static transit departures
 * @returns Filtered array with ghost scheduled entries removed
 */
export function suppressGhostSchedules<T extends TransitDeparture>(departures: T[]): T[] {
	const nowMs = Date.now();
	const maxLiveMsByDirection = new Map<string, number>();

	// 1. Identify maximum live real-time prediction timestamp per direction
	for (const dep of departures) {
		if (!dep.isRealtime) continue;
		const timeMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
		const currentMax = maxLiveMsByDirection.get(dep.direction) || 0;
		if (timeMs > currentMax) {
			maxLiveMsByDirection.set(dep.direction, timeMs);
		}
	}

	// 2. Filter out past trips and ghost scheduled trips prior to T_max_live
	return departures.filter((dep) => {
		const arrivalMs = new Date(dep.predictedTime || dep.scheduledTime).getTime();
		const diffMins = (arrivalMs - nowMs) / 60000;

		// Discard departures that left more than 2 minutes ago
		if (diffMins < -2) return false;

		// Always retain live tracked departures
		if (dep.isRealtime) return true;

		const maxLiveMs = maxLiveMsByDirection.get(dep.direction) || 0;

		// Suppress static timetable entry if a live departure exists at or after this time
		if (maxLiveMs > 0 && arrivalMs <= maxLiveMs) {
			return false;
		}

		return true;
	});
}
