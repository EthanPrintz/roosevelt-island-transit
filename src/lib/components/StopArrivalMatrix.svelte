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

function normalizeStopName(raw: string): { name: string; isOffIsland: boolean } {
	const text = (raw || '').toLowerCase();

	if (text.includes('vernon') || text.includes('36 ave')) {
		return { name: 'Vernon Blvd (LIC)', isOffIsland: true };
	}
	if (text.includes('27 ave') || text.includes('astoria') || text.includes('2nd st')) {
		return { name: 'Astoria 27 Ave Terminal', isOffIsland: true };
	}
	if (text.includes('octagon') || text.includes('coler')) {
		return { name: 'Octagon / Coler', isOffIsland: false };
	}
	if (text.includes('southtown') || text.includes('cornell') || text.includes('tech')) {
		return { name: 'Southtown / Tech', isOffIsland: false };
	}
	return { name: 'Subway Plaza', isOffIsland: false };
}

// Group departures by canonical stop location
let groupedStops = $derived.by(() => {
	const map = new Map<string, { name: string; isOffIsland: boolean; departures: BusDeparture[] }>();

	for (const dep of departures) {
		const b = dep as BusDeparture;
		const norm = normalizeStopName(b.stopName || 'Subway Plaza');
		const key = norm.name;

		if (!map.has(key)) {
			map.set(key, { name: norm.name, isOffIsland: norm.isOffIsland, departures: [] });
		}
		map.get(key)!.departures.push(b);
	}

	return Array.from(map.values());
});
</script>

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
				{@const followUps = group.departures.slice(1, 5)}
				
				<div class="p-3.5 rounded-xl border bg-bg-surface/90 border-border-default/80 space-y-3 shadow-2xs">
					<!-- Stop Card Header -->
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
							<span class="text-xs font-extrabold text-text-main">{group.name}</span>
						</div>
					</div>

					<!-- Hero Next Arrival Card -->
					{#if nextDep}
						{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
						<div class="p-3 rounded-lg bg-bg-elevated/60 border border-border-default/50 space-y-1.5">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-1.5 truncate">
									{@render statusBadge(nextDep.isRealtime)}
									<span class="text-xs font-bold text-text-main truncate">
										{nextDep.vehicleId ? `Bus #${nextDep.vehicleId}` : nextDep.headsign}
									</span>
								</div>
								<span class="text-xs font-mono font-extrabold text-primary shrink-0">
									{formatRelativeTime(targetTime)}
								</span>
							</div>

							<div class="flex items-center justify-between text-[11px] font-mono text-text-muted gap-2">
								<span class="truncate">
									{nextDep.headsign}
									{#if nextDep.nextStopName}
										<span class="italic opacity-80 truncate">({nextDep.nextStopName})</span>
									{/if}
								</span>
								<span class="font-bold text-text-main text-xs shrink-0">{formatClockTime(targetTime)}</span>
							</div>
						</div>
					{/if}

					<!-- Follow-up Departures Timetable -->
					{#if followUps.length > 0}
						<div class="space-y-1 pt-1 border-t border-border-default/40">
							<div class="text-[10px] font-mono font-bold text-text-muted px-1 uppercase tracking-wider">
								Upcoming Schedule
							</div>
							<div class="grid grid-cols-1 gap-1">
								{#each followUps as dep (dep.id)}
									{@const t = dep.predictedTime || dep.scheduledTime}
									<div class="flex items-center justify-between py-1 px-2 rounded-md bg-bg-elevated/30 text-xs font-mono">
										<div class="flex items-center gap-1.5 truncate">
											{@render statusBadge(dep.isRealtime)}
											<span class="text-text-muted text-[11px] truncate">{dep.headsign}</span>
										</div>
										<div class="flex items-center gap-2.5 shrink-0 text-[11px]">
											<span class="text-text-muted">{formatRelativeTime(t)}</span>
											<span class="font-bold text-text-main">{formatClockTime(t)}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
