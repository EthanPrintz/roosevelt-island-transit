<script lang="ts">
import { Clock01Icon, FlashIcon, Globe02Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { BusDeparture, TransitDeparture } from '$lib/transit/domain/types';
import { formatClockTime, formatRelativeTime } from '$lib/utils/time-format';

interface Props {
	title: string;
	subtitle: string;
	departures: TransitDeparture[];
	accentColor: 'blue' | 'rose';
	emptyMessage: string;
}

let { title, subtitle, departures = [], accentColor, emptyMessage }: Props = $props();

const bgHeader = $derived(
	accentColor === 'blue'
		? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
		: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
);

// Group departures by stop location
let groupedStops = $derived.by(() => {
	const map = new Map<string, { name: string; isOffIsland: boolean; departures: BusDeparture[] }>();

	for (const dep of departures) {
		const b = dep as BusDeparture;
		const name = b.stopName || 'Subway Plaza';
		const isOff = Boolean(
			b.isOffIsland ||
				name.toLowerCase().includes('vernon') ||
				name.toLowerCase().includes('astoria'),
		);

		if (!map.has(name)) {
			map.set(name, { name, isOffIsland: isOff, departures: [] });
		}
		map.get(name)!.departures.push(b);
	}

	return Array.from(map.values());
});
</script>

<div class="panel-card space-y-3 p-4">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-sm font-extrabold tracking-tight text-text-main">{title}</h3>
			<p class="text-xs text-text-muted font-medium">{subtitle}</p>
		</div>
	</div>

	{#if departures.length === 0}
		<div class="text-center text-xs text-text-muted italic py-6 border border-dashed border-border-default/60 rounded-xl">
			{emptyMessage}
		</div>
	{:else}
		<div class="space-y-3">
			{#each groupedStops as group (group.name)}
				{@const nextDep = group.departures[0]}
				{@const remainingCount = group.departures.length - 1}
				
				<div class="p-3 rounded-xl border transition-all bg-bg-surface/80 border-border-default/70 hover:border-border-default space-y-2">
					<!-- Stop Header with On-Island vs Off-Island Badge -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if group.isOffIsland}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
									<HugeiconsIcon icon={Globe02Icon} size={11} />
									Queens / Off-Island
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border {bgHeader}">
									<HugeiconsIcon icon={Location01Icon} size={11} />
									Roosevelt Island
								</span>
							{/if}
							<span class="text-xs font-bold text-text-main">{group.name}</span>
						</div>
						
						{#if nextDep}
							{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
							<span class="text-xs font-mono font-extrabold text-primary">
								{formatRelativeTime(targetTime)}
							</span>
						{/if}
					</div>

{#snippet statusBadge(isRealtime: boolean)}
	{#if isRealtime}
		<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
			<HugeiconsIcon icon={FlashIcon} size={9} />
			LIVE
		</span>
	{:else}
		<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-bg-elevated text-text-muted border border-border-default shrink-0">
			<HugeiconsIcon icon={Clock01Icon} size={9} />
			SCHED
		</span>
	{/if}
{/snippet}

<!-- Hero Prediction for this Stop Node -->
{#if nextDep}
	{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
	<div class="flex items-center justify-between text-xs font-mono pt-1 border-t border-border-default/40">
		<div class="flex items-center gap-1.5 text-text-muted text-[11px] truncate">
			{@render statusBadge(nextDep.isRealtime)}
			<span class="truncate">{nextDep.vehicleId ? `Bus #${nextDep.vehicleId}` : nextDep.headsign}</span>
			{#if nextDep.nextStopName}
				<span class="italic text-[10px] truncate">({nextDep.nextStopName})</span>
			{/if}
		</div>
		<span class="font-bold text-text-main shrink-0">{formatClockTime(targetTime)}</span>
	</div>
{/if}

<!-- Follow-up Timetable List for this Stop Node -->
{#if remainingCount > 0}
	<div class="pt-1.5 space-y-1 border-t border-border-default/30">
		{#each group.departures.slice(1, 5) as dep (dep.id)}
			{@const t = dep.predictedTime || dep.scheduledTime}
			<div class="flex items-center justify-between py-1 px-2 rounded-lg bg-bg-elevated/40 hover:bg-bg-elevated/70 text-xs font-mono transition-colors">
				<div class="flex items-center gap-1.5 truncate">
					{@render statusBadge(dep.isRealtime)}
					<span class="text-text-main truncate text-[11px]">
						{dep.headsign}
					</span>
				</div>

				<div class="flex items-center gap-3 shrink-0 text-text-muted">
					<span class="text-[11px] font-semibold text-text-muted">
						{formatRelativeTime(t)}
					</span>
					<span class="font-bold text-text-main text-[11px]">
						{formatClockTime(t)}
					</span>
				</div>
			</div>
		{/each}
	</div>
{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
