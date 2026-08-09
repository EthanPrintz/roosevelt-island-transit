import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './time-format';

describe('formatRelativeTime', () => {
	const now = new Date('2026-08-09T12:00:00.000Z').getTime();

	it('handles arriving now or past departures', () => {
		expect(formatRelativeTime('2026-08-09T12:00:00.000Z', now)).toBe('Arriving Now');
		expect(formatRelativeTime('2026-08-09T11:59:00.000Z', now)).toBe('Arriving Now');
		expect(formatRelativeTime('2026-08-09T11:50:00.000Z', now)).toBe('Departed');
	});

	it('handles single minute departure', () => {
		expect(formatRelativeTime('2026-08-09T12:01:00.000Z', now)).toBe('In 1 min');
	});

	it('handles departures under 60 minutes', () => {
		expect(formatRelativeTime('2026-08-09T12:15:00.000Z', now)).toBe('In 15 mins');
		expect(formatRelativeTime('2026-08-09T12:45:00.000Z', now)).toBe('In 45 mins');
		expect(formatRelativeTime('2026-08-09T12:59:00.000Z', now)).toBe('In 59 mins');
	});

	it('handles exact hour departures', () => {
		expect(formatRelativeTime('2026-08-09T13:00:00.000Z', now)).toBe('In 1 hr');
		expect(formatRelativeTime('2026-08-09T14:00:00.000Z', now)).toBe('In 2 hrs');
		expect(formatRelativeTime('2026-08-09T16:00:00.000Z', now)).toBe('In 4 hrs');
	});

	it('handles combined hours and minutes departures', () => {
		expect(formatRelativeTime('2026-08-09T13:15:00.000Z', now)).toBe('In 1 hr 15 mins');
		expect(formatRelativeTime('2026-08-09T13:01:00.000Z', now)).toBe('In 1 hr 1 min');
		expect(formatRelativeTime('2026-08-09T14:05:00.000Z', now)).toBe('In 2 hrs 5 mins');
		expect(formatRelativeTime('2026-08-09T15:25:00.000Z', now)).toBe('In 3 hrs 25 mins');
	});
});
