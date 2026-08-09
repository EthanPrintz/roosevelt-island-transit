import {
	AnchorIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	FlashIcon,
	Navigation01Icon,
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
 * Enforces standardized operational states:
 * - AT DOCK: AnchorIcon
 * - BOARDING: CheckmarkCircle01Icon
 * - APPROACHING: Navigation01Icon
 * - EN ROUTE: FlashIcon
 * - SCHEDULED: Clock01Icon
 */
export function resolveHeroStatusPill(
	departure: TransitDeparture,
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue' = 'orange',
): StatusPillConfig {
	const defaultClass = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.orange;

	// 1. Tramway Boarding State
	if (departure.mode === 'tram' && (departure as TramDeparture).isBoarding) {
		return {
			label: 'Boarding',
			icon: CheckmarkCircle01Icon,
			pillClass: defaultClass,
		};
	}

	// 2. Ferry Specific Operational States
	if (departure.mode === 'ferry') {
		const f = departure as FerryDeparture;
		if (f.speedKnots !== undefined) {
			if (f.speedKnots < 1) {
				return {
					label: 'At Dock',
					icon: AnchorIcon,
					pillClass: defaultClass,
				};
			}
			if (f.speedKnots > 10) {
				return {
					label: 'En Route',
					icon: FlashIcon,
					pillClass: defaultClass,
				};
			}
			return {
				label: 'Approaching',
				icon: Navigation01Icon,
				pillClass: defaultClass,
			};
		}
	}

	// 3. General Realtime vs Scheduled
	if (departure.isRealtime) {
		const targetTime = new Date(departure.predictedTime || departure.scheduledTime).getTime();
		const diffMins = (targetTime - Date.now()) / 60000;

		if (diffMins > 0 && diffMins <= 2) {
			return {
				label: 'Approaching',
				icon: Navigation01Icon,
				pillClass: defaultClass,
			};
		}

		return {
			label: 'En Route',
			icon: FlashIcon,
			pillClass: defaultClass,
		};
	}

	// 4. Static Schedule Fallback
	return {
		label: 'Scheduled',
		icon: Clock01Icon,
		pillClass: defaultClass,
	};
}
