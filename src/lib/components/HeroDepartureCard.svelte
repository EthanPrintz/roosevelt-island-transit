<script lang="ts">
import { AlertCircleIcon, FlashIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';
import { formatRelativeTime } from '$lib/utils/time-format';

interface Props {
	departure: TransitDeparture;
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue';
	statusText: string;
	statusIcon?: any;
	statusClass?: string;
	lineBadgeText?: string;
	lineBadgeClass?: string;
	secondaryDetails?: string;
}

let {
	departure,
	accentColor,
	statusText,
	statusIcon,
	statusClass,
	lineBadgeText,
	lineBadgeClass,
	secondaryDetails,
}: Props = $props();

const accentStyles = {
	orange: {
		container:
			'bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border-orange-500/30',
		timeText: 'text-orange-600 dark:text-orange-400',
		iconColor: 'text-orange-500',
		badgeDefault:
			'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20',
	},
	rose: {
		container: 'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
		badgeDefault: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
	},
	cyan: {
		container: 'bg-linear-to-br from-cyan-500/10 via-bg-surface to-bg-surface border-cyan-500/30',
		timeText: 'text-cyan-600 dark:text-cyan-400',
		iconColor: 'text-cyan-500',
		badgeDefault: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
	},
	blue: {
		container: 'bg-linear-to-br from-blue-500/10 via-bg-surface to-bg-surface border-blue-500/30',
		timeText: 'text-blue-600 dark:text-blue-400',
		iconColor: 'text-blue-500',
		badgeDefault: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.orange);

let timeString = $derived(
	new Date(departure.predictedTime || departure.scheduledTime).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	}),
);
let relativeLabel = $derived(
	formatRelativeTime(departure.predictedTime || departure.scheduledTime),
);
</script>

<div class="p-3 rounded-xl border space-y-1.5 relative overflow-hidden shadow-xs {styles.container}">
	<!-- Top Bar: Standardized Status Pill (Top-Left) + Relative Countdown (Top-Right) -->
	<div class="flex items-center justify-between text-xs">
		<div class="flex items-center gap-1.5 flex-wrap">
			<span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold uppercase {statusClass || styles.badgeDefault}">
				{#if statusIcon}
					<HugeiconsIcon icon={statusIcon} size={10} />
				{/if}
				<span>{statusText}</span>
			</span>

			{#if departure.scheduleRelationship === 'ADDED'}
				<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-[9px] uppercase font-bold">
					<HugeiconsIcon icon={SparklesIcon} size={10} />
					<span>Extra</span>
				</span>
			{:else if departure.scheduleRelationship === 'CANCELED'}
				<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-300 font-mono text-[9px] uppercase font-bold">
					<HugeiconsIcon icon={AlertCircleIcon} size={10} />
					<span>Canceled</span>
				</span>
			{/if}
		</div>

		<span class="font-mono text-xs font-bold {styles.timeText}">
			{relativeLabel}
		</span>
	</div>

	<!-- Bottom Section: Line Badge + Destination Title + Secondary Details | Clock Time -->
	<div class="flex items-baseline justify-between pt-0.5 gap-2">
		<div class="min-w-0 flex-1">
			<div class="text-sm font-extrabold text-text-main leading-tight truncate flex items-center gap-1.5">
				{#if lineBadgeText}
					<span class={lineBadgeClass || 'bullet-subway text-[9px] shrink-0'}>
						{lineBadgeText}
					</span>
				{/if}
				<span class="truncate">{departure.headsign}</span>
			</div>
			{#if secondaryDetails}
				<div class="text-[10px] text-text-muted mt-0.5 font-mono truncate">
					{secondaryDetails}
				</div>
			{/if}
		</div>

		<div class="text-right shrink-0">
			<div class="font-mono text-lg font-black text-text-main leading-none">
				{timeString}
			</div>
			{#if !departure.isRealtime}
				<div class="mt-1">
					<span class="text-[9px] text-text-muted font-mono">Scheduled</span>
				</div>
			{/if}
		</div>
	</div>
</div>
