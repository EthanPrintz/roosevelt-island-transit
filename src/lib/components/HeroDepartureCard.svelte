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

function formatHeroHeadsign(raw: string): string {
	if (!raw) return '';
	let s = raw
		.replace(/\s*(?:Station|Terminal|Landing|Pier|Dock)$/i, '')
		.replace(/Wall St\.\s*\/\s*Pier 11/i, 'Wall St / Pier 11')
		.replace(/East 90th St\s*\/\s*UES/i, 'East 90th St')
		.trim();
	if (s.includes(' - ')) {
		s = s.split(' - ')[0].trim();
	}
	return s;
}

let cleanHeadsign = $derived(formatHeroHeadsign(departure.headsign));
</script>

<div class="p-3 rounded-xl border space-y-1.5 relative overflow-hidden shadow-xs {styles.container}">
	<!-- Row 1: Top Bar (Status Pill Only) -->
	<div class="flex items-center justify-between text-xs gap-2">
		<div class="flex items-center gap-1.5 flex-wrap">
			<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {resolvedClass}">
				{#key resolvedIcon}
					<HugeiconsIcon icon={resolvedIcon} size={10} />
				{/key}
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
	</div>

	<!-- Row 2: Destination Title (Full Width so it NEVER truncates) -->
	<div class="pt-0.5">
		<h4 class="text-sm font-extrabold text-text-main leading-snug tracking-tight">
			{cleanHeadsign}
		</h4>
	</div>

	<!-- Row 3: Large Clock Time -->
	<div class="font-mono text-xl font-black text-text-main leading-none pt-0.5">
		{timeString}
	</div>

	<!-- Row 4: Relative Countdown (Under Clock Time) -->
	<div class="font-mono text-xs font-bold {styles.timeText}">
		{relativeLabel}
	</div>

	<!-- Row 5: Dedicated Sub-Details Line (Dispatched / Cabin / Vessel / Scheduled) -->
	{#if subDetails || !departure.isRealtime}
		{@const cleanSubDetails = subDetails ? subDetails.replace(/\s*\((?:approaching|at stop|at_stop)\)/gi, '') : ''}
		{#if cleanSubDetails || !departure.isRealtime}
			<div class="text-[10px] font-mono text-text-muted pt-0.5 truncate">
				{cleanSubDetails || 'Scheduled'}
			</div>
		{/if}
	{/if}
</div>
