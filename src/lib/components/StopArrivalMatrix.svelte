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

const accentStyles = {
	blue: {
		heroContainer:
			'bg-linear-to-br from-blue-500/10 via-bg-surface to-bg-surface border-blue-500/30',
		timeText: 'text-blue-600 dark:text-blue-400',
		iconColor: 'text-blue-500',
		badgeDefault: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
		stopBadge: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
	},
	rose: {
		heroContainer:
			'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
		badgeDefault: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
		stopBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.blue);

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

<div class="space-y-3">
	<div class="px-1">
		<h3 class="text-sm font-extrabold tracking-tight text-text-main">{title}</h3>
		<p class="text-xs text-text-muted font-medium">{subtitle}</p>
	</div>

	{#if departures.length === 0}
		<div class="panel-card text-center text-xs text-text-muted italic py-6 border border-dashed border-border-default/60 rounded-xl">
			{emptyMessage}
		</div>
	{:else}
		<div class="space-y-4">
			{#each groupedStops as group (group.name)}
				{@const nextDep = group.departures[0]}
				{@const followUps = group.departures.slice(1, 5)}
				
				<div class="panel-card space-y-3 p-4">
					<!-- Stop Card Header -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if group.isOffIsland}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
									<HugeiconsIcon icon={Globe02Icon} size={11} />
									Queens / Off-Island
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border {styles.stopBadge}">
									<HugeiconsIcon icon={Location01Icon} size={11} />
									Roosevelt Island
								</span>
							{/if}
							<span class="text-xs font-extrabold text-text-main">{group.name}</span>
						</div>
					</div>

					<!-- Hero Departure Card matching standard HeroDepartureCard.svelte design -->
					{#if nextDep}
						{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
						{@const statusLabel = nextDep.isRealtime ? 'En Route' : 'Scheduled'}
						{@const statusIcon = nextDep.isRealtime ? FlashIcon : Clock01Icon}
						{@const subDetails = nextDep.vehicleId ? `Bus #${nextDep.vehicleId}${nextDep.nextStopName ? ` • (${nextDep.nextStopName})` : ''}` : undefined}

						<div class="p-3.5 rounded-xl border space-y-2 relative overflow-hidden shadow-2xs {styles.heroContainer}">
							<!-- Top Row: Status Pill & Relative Countdown -->
							<div class="flex items-center justify-between text-xs">
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {styles.badgeDefault}">
									<HugeiconsIcon icon={statusIcon} size={10} />
									<span>{statusLabel}</span>
								</span>

								<span class="font-mono text-xs font-bold {styles.timeText}">
									{formatRelativeTime(targetTime)}
								</span>
							</div>

							<!-- Middle Row: Destination Title & Large Clock Time -->
							<div class="flex items-baseline justify-between gap-2 pt-0.5">
								<div class="text-sm font-extrabold text-text-main leading-tight truncate min-w-0 flex-1">
									<span class="truncate">{nextDep.headsign}</span>
								</div>

								<div class="font-mono text-lg font-black text-text-main leading-none shrink-0">
									{formatClockTime(targetTime)}
								</div>
							</div>

							<!-- Bottom Row: Sub details -->
							{#if subDetails || !nextDep.isRealtime}
								<div class="flex items-center justify-between text-[10px] font-mono text-text-muted pt-0.5">
									<div class="truncate min-w-0 flex-1">
										{#if subDetails}
											<span>{subDetails}</span>
										{/if}
									</div>

									{#if !nextDep.isRealtime}
										<span class="shrink-0 ml-2">Scheduled</span>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Follow-Up Timetable List matching standard TimetableList.svelte design -->
					{#if followUps.length > 0}
						<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
							{#each followUps as dep (dep.id)}
								{@const t = dep.predictedTime || dep.scheduledTime}
								<div class="p-2.5 flex items-center justify-between text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
									<div class="flex items-center gap-2 min-w-0 flex-1">
										{#if dep.vehicleId}
											<span class="px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-default/80 font-mono text-[9px] text-text-muted shrink-0 font-bold">
												Bus #{dep.vehicleId}
											</span>
										{/if}
										<span class="font-medium text-text-main truncate text-xs">{dep.headsign}</span>
									</div>

									<div class="flex items-center gap-2.5 font-mono shrink-0">
										<span class="text-text-muted text-[10px]">{formatRelativeTime(t)}</span>
										<span class="font-bold text-text-main text-[11px]">{formatClockTime(t)}</span>
										{#if dep.isRealtime}
											<HugeiconsIcon icon={FlashIcon} size={10} class={styles.iconColor} />
										{/if}
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
