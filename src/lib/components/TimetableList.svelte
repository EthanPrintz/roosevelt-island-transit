<script lang="ts">
import { LiveStreaming02Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';
import { formatRelativeTime } from '$lib/utils/time-format';

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
</script>

<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
	{#each departures as dep (dep.id)}
		{@const relTime = formatRelativeTime(dep.predictedTime || dep.scheduledTime)}
		{@const absTime = new Date(dep.predictedTime || dep.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
		{@const customBadge = badgeTextFn ? badgeTextFn(dep) : undefined}

		<div class="p-2 flex items-center justify-between text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
			<!-- Left Side: Route Badge / Cabin / Vessel + Destination -->
			<div class="flex items-center gap-2 min-w-0 flex-1">
				{#if customBadge}
					<span class="px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-default/80 font-mono text-[9px] text-text-muted shrink-0 font-bold">
						{customBadge}
					</span>
				{:else if dep.mode === 'subway'}
					<span class="bullet-subway text-[9px] shrink-0">
						{dep.routeId}
					</span>
				{/if}

				<span class="font-medium text-text-main truncate">{dep.headsign}</span>

				{#if dep.scheduleRelationship === 'ADDED'}
					<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px] shrink-0">
						<HugeiconsIcon icon={SparklesIcon} size={9} />
						<span>Extra</span>
					</span>
				{/if}
			</div>

			<!-- Right Side: Relative Countdown + Clock Time + Live Indicator -->
			<div class="flex items-center gap-2.5 font-mono shrink-0">
				<span class="text-text-muted text-[10px]">{relTime}</span>
				<span class="font-bold text-text-main text-[11px]">{absTime}</span>
				{#if dep.isRealtime}
					<HugeiconsIcon icon={LiveStreaming02Icon} size={10} class={activeIconColor} />
				{/if}
			</div>
		</div>
	{/each}
</div>
