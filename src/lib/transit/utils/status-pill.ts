import {
	AnchorIcon,
	ArrowRightToLineIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	FlashIcon,
} from '@hugeicons/core-free-icons';
import type { FerryDeparture, TramDeparture, TransitDeparture } from '../domain/types';

export interface StatusPillConfig {
	label: string;
	// biome-ignore lint/suspicious/noExplicitAny: Hugeicons Icon SVG prop type
	icon: any;
	pillClass: string;
}

const ACCENT_CLASSES: Record<'orange' | 'rose' | 'cyan' | 'blue', string> = {
	orange: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
	rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
	cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
	blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
};

/**
 * Pure, centralized resolver for Hero Card Status Pills across all transit modes.
 * Enforces 100% synchronized status labels & domain-perfect Hugeicons:
 * 1. BOARDING: CheckmarkCircle01Icon & "Boarding"
 * 2. AT DOCK: AnchorIcon & "At Dock"
 * 3. APPROACHING (<= 2 mins arrival): ArrowRightToLineIcon & "Approaching"
 * 4. LIVE (> 2 mins away): FlashIcon & "Live"
 * 5. SCHEDULED: Clock01Icon & "Scheduled"
 */
export function resolveHeroStatusPill(
	departure: TransitDeparture,
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue' = 'orange',
): StatusPillConfig {
	const defaultClass = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.orange;

	// 1. Station Boarding / Docked States
	if (departure.mode === 'tram' && (departure as TramDeparture).isBoarding) {
		return {
			label: 'Boarding',
			icon: CheckmarkCircle01Icon,
			pillClass: defaultClass,
		};
	}

	if (departure.mode === 'ferry') {
		const f = departure as FerryDeparture;
		if (f.speedKnots !== undefined && f.speedKnots < 1) {
			return {
				label: 'At Dock',
				icon: AnchorIcon,
				pillClass: defaultClass,
			};
		}
	}

	// 2. Approaching State (Within 2 minutes of arrival / Arriving Now)
	const targetTime = new Date(departure.predictedTime || departure.scheduledTime).getTime();
	const diffMins = (targetTime - Date.now()) / 60000;

	if (departure.isRealtime && diffMins >= 0 && diffMins <= 2) {
		return {
			label: 'Approaching',
			icon: ArrowRightToLineIcon,
			pillClass: defaultClass,
		};
	}

	// 3. Live Telemetry Tracking State (> 2 mins away)
	if (departure.isRealtime) {
		return {
			label: 'Live',
			icon: FlashIcon,
			pillClass: defaultClass,
		};
	}

	// 4. Static Timetable Schedule Fallback
	return {
		label: 'Scheduled',
		icon: Clock01Icon,
		pillClass: defaultClass,
	};
}
