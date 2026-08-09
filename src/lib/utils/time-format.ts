/**
 * Formats a given ISO 8601 timestamp into a clean relative time string.
 * Formats departures >= 60 minutes in hours and minutes (e.g. "In 1 hr 15 mins").
 */
export function formatRelativeTime(isoString: string, nowMs: number = Date.now()): string {
	const diffMs = new Date(isoString).getTime() - nowMs;
	const mins = Math.round(diffMs / 60000);

	if (mins < -2) return 'Departed';
	if (mins <= 0) return 'Arriving Now';
	if (mins === 1) return 'In 1 min';
	if (mins < 60) return `In ${mins} mins`;

	const hrs = Math.floor(mins / 60);
	const remMins = mins % 60;
	const hrLabel = hrs === 1 ? '1 hr' : `${hrs} hrs`;

	if (remMins === 0) {
		return `In ${hrLabel}`;
	}

	const minLabel = remMins === 1 ? '1 min' : `${remMins} mins`;
	return `In ${hrLabel} ${minLabel}`;
}
