<script lang="ts">
import { Clock01Icon, FlashIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';
import { formatClockTime, formatRelativeTime } from '$lib/utils/time-format';

interface Props {
	departures: TransitDeparture[];
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue';
	badgeTextFn?: (dep: TransitDeparture) => string | undefined;
}

let { departures, accentColor, badgeTextFn }: Props = $props();

const iconColors = {
	orange: 'text-orange-500',
	rose: 'text-rose-500',
	cyan: 'text-cyan-500',
	blue: 'text-blue-500',
};

let activeIconColor = $derived(iconColors[accentColor] || iconColors.orange);

// Detect if all departures in this list share the same headsign
let firstHeadsign = $derived(departures[0]?.headsign);
let isUniformHeadsign = $derived(
	departures.length > 0 && departures.every((d) => d.headsign === firstHeadsign),
);
</script>

<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
	{#each departures as dep (dep.id)}
		{@const relTime = formatRelativeTime(dep.predictedTime || dep.scheduledTime, undefined, true)}
		{@const absTime = formatClockTime(dep.predictedTime || dep.scheduledTime)}
		{@const customBadge = badgeTextFn ? badgeTextFn(dep) : undefined}

		<div class="px-2 py-1.5 flex items-center text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
			<!-- Left Side: Route Badge / Bullet -->
			{#if customBadge && customBadge !== 'ASTORIA' && customBadge !== 'NORTH' && customBadge !== 'SOUTH'}
				<span class="px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-default/80 font-mono text-[9px] text-text-muted shrink-0 font-bold">
					{customBadge}
				</span>
			{:else if dep.mode === 'subway'}
				<span class="bullet-subway text-[9px] shrink-0">
					{dep.routeId}
				</span>
			{/if}

			{#if !isUniformHeadsign}
				<span class="font-medium text-text-main truncate text-xs min-w-0 flex-1">{dep.headsign}</span>
			{/if}

			{#if dep.scheduleRelationship === 'ADDED'}
				<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px] shrink-0">
					<HugeiconsIcon icon={SparklesIcon} size={9} />
					<span>Extra</span>
				</span>
			{/if}

			<!-- Relative Countdown (Positioned naturally after bullet/badge) -->
			<span class="font-mono text-xs font-semibold text-text-main shrink-0 {isUniformHeadsign ? 'ml-1' : 'ml-auto'}">
				{relTime}
			</span>

			<!-- Right Side: Clock Time + Live Indicator / Scheduled Icon -->
			<div class="flex items-center gap-1.5 font-mono shrink-0 ml-auto">
				<span class="text-text-muted text-[11px]">{absTime}</span>
				{#if dep.isRealtime}
					<HugeiconsIcon icon={FlashIcon} size={10} class={activeIconColor} />
				{:else}
					<HugeiconsIcon icon={Clock01Icon} size={10} class="text-text-muted opacity-60" />
				{/if}
			</div>
		</div>
	{/each}
</div>
