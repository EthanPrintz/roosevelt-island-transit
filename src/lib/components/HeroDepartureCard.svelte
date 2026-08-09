<script lang="ts">
import { AlertCircleIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';
import { resolveHeroStatusPill } from '$lib/transit/utils/status-pill';
import { formatRelativeTime } from '$lib/utils/time-format';

interface Props {
	departure: TransitDeparture;
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue';
	statusText?: string;
	statusIcon?: any;
	statusClass?: string;
	lineBadgeText?: string;
	lineBadgeClass?: string;
	subDetails?: string;
}

let {
	departure,
	accentColor,
	statusText,
	statusIcon,
	statusClass,
	lineBadgeText,
	lineBadgeClass,
	subDetails,
}: Props = $props();

const accentStyles = {
	orange: {
		container:
			'bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border-orange-500/30',
		timeText: 'text-orange-600 dark:text-orange-400',
		iconColor: 'text-orange-500',
	},
	rose: {
		container: 'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
	},
	cyan: {
		container: 'bg-linear-to-br from-cyan-500/10 via-bg-surface to-bg-surface border-cyan-500/30',
		timeText: 'text-cyan-600 dark:text-cyan-400',
		iconColor: 'text-cyan-500',
	},
	blue: {
		container: 'bg-linear-to-br from-blue-500/10 via-bg-surface to-bg-surface border-blue-500/30',
		timeText: 'text-blue-600 dark:text-blue-400',
		iconColor: 'text-blue-500',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.orange);
let statusPill = $derived(resolveHeroStatusPill(departure, accentColor));
let resolvedText = $derived(statusText || statusPill.label);
let resolvedIcon = $derived(statusIcon || statusPill.icon);
let resolvedClass = $derived(statusClass || statusPill.pillClass);

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

<div class="p-3 rounded-xl border space-y-2 relative overflow-hidden shadow-xs {styles.container}">
	<!-- Top Row: Standardized Status Pill (Left) & Relative Countdown (Right) -->
	<div class="flex items-center justify-between text-xs">
		<div class="flex items-center gap-1.5 flex-wrap">
			<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {resolvedClass}">
				<HugeiconsIcon icon={resolvedIcon} size={10} />
				<span>{resolvedText}</span>
			</span>

			{#if departure.scheduleRelationship === 'ADDED'}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[9px] uppercase font-bold border border-purple-500/30">
					<HugeiconsIcon icon={SparklesIcon} size={10} />
					<span>Extra</span>
				</span>
			{:else if departure.scheduleRelationship === 'CANCELED'}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-300 font-mono text-[9px] uppercase font-bold border border-red-500/30">
					<HugeiconsIcon icon={AlertCircleIcon} size={10} />
					<span>Canceled</span>
				</span>
			{/if}
		</div>

		<span class="font-mono text-xs font-bold {styles.timeText}">
			{relativeLabel}
		</span>
	</div>

	<!-- Middle Row: Clean Destination Title & Large Clock Time -->
	<div class="flex items-baseline justify-between gap-2 pt-0.5">
		<div class="text-sm font-extrabold text-text-main leading-tight truncate min-w-0 flex-1">
			<span class="truncate">{departure.headsign}</span>
		</div>

		<div class="font-mono text-lg font-black text-text-main leading-none shrink-0">
			{timeString}
		</div>
	</div>

	<!-- Bottom Row: Mono Sub-Details Line (Left) & Optional Muted Scheduled Fallback (Right) -->
	<div class="flex items-center justify-between text-[10px] font-mono text-text-muted pt-0.5">
		<div class="truncate min-w-0 flex-1">
			{#if subDetails}
				{@const cleanSubDetails = subDetails.replace(/\s*•?\s*\((?:approaching|at stop|at_stop)\)/gi, '')}
				{#if cleanSubDetails}
					<span>{cleanSubDetails}</span>
				{/if}
			{/if}
		</div>

		{#if !departure.isRealtime}
			<span class="shrink-0 ml-2">Scheduled</span>
		{/if}
	</div>
</div>
