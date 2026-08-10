/**
 * Formats a given ISO 8601 timestamp into a clean relative time string.
 * Formats departures >= 60 minutes in hours and minutes (e.g. "In 1 hr 15 mins").
 */
export function formatRelativeTime(
	isoString: string,
	nowMs: number = Date.now(),
	omitIn: boolean = false,
): string {
	const diffMs = new Date(isoString).getTime() - nowMs;
	const mins = Math.round(diffMs / 60000);
	const prefix = omitIn ? '' : 'In ';

	if (mins < -2) return 'Departed';
	if (mins <= 0) return omitIn ? 'Arriving' : 'Arriving Now';
	if (mins === 1) return `${prefix}1 min`;
	if (mins < 60) return `${prefix}${mins} mins`;

	const hrs = Math.floor(mins / 60);
	const remMins = mins % 60;
	const hrLabel = hrs === 1 ? '1 hr' : `${hrs} hrs`;

	if (remMins === 0) {
		return `${prefix}${hrLabel}`;
	}

	const minLabel = remMins === 1 ? '1 min' : `${remMins} mins`;
	return `${prefix}${hrLabel} ${minLabel}`;
}

export function formatClockTime(isoString: string): string {
	try {
		return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} catch {
		return '--:--';
	}
}
