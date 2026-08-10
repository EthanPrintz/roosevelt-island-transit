<script lang="ts">
import { Clock01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { BusDeparture, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';
import { resolveHeroStatusPill } from '$lib/transit/utils/status-pill';
import { formatClockTime, formatRelativeTime } from '$lib/utils/time-format';
import ModeSectionHeader from './ModeSectionHeader.svelte';

interface Props {
	title: string;
	icon: any;
	iconBgClass: string;
	accentColor: 'blue' | 'rose';
	northboundDepartures: TransitDeparture[];
	southboundDepartures: TransitDeparture[];
	alerts?: TransitAlert[];
	northboundTitle: string;
	northboundSubtitle: string;
	southboundTitle: string;
	southboundSubtitle: string;
	emptyMessageNorth: string;
	emptyMessageSouth: string;
}

let {
	title,
	icon,
	iconBgClass,
	accentColor,
	northboundDepartures = [],
	southboundDepartures = [],
	alerts = [],
	northboundTitle,
	northboundSubtitle,
	southboundTitle,
	southboundSubtitle,
	emptyMessageNorth,
	emptyMessageSouth,
}: Props = $props();

const accentStyles = {
	blue: {
		heroContainer:
			'bg-linear-to-br from-blue-500/10 via-bg-surface to-bg-surface border-blue-500/30',
		timeText: 'text-blue-600 dark:text-blue-400',
		iconColor: 'text-blue-500',
		dotBg: 'bg-blue-500',
		badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
	},
	rose: {
		heroContainer:
			'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
		dotBg: 'bg-rose-500',
		badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.blue);

// Group Northbound stops in exact travel sequence order (South -> North: 1..10)
let northboundGroups = $derived.by(() => {
	const map = new Map<string, { departures: TransitDeparture[]; minSeq: number }>();
	for (const dep of northboundDepartures) {
		const name = dep.stopName || 'Unassigned';
		const seq = dep.stopSequence ?? 50;
		if (!map.has(name)) {
			map.set(name, { departures: [], minSeq: seq });
		}
		const item = map.get(name)!;
		item.departures.push(dep);
		if (seq < item.minSeq) item.minSeq = seq;
	}
	return Array.from(map.entries())
		.map(([stopName, data]) => ({
			stopName,
			departures: data.departures,
			stopSequence: data.minSeq,
		}))
		.sort((a, b) => a.stopSequence - b.stopSequence);
});

// Group Southbound stops in exact travel sequence order (North -> South: 101..110)
let southboundGroups = $derived.by(() => {
	const map = new Map<string, { departures: TransitDeparture[]; minSeq: number }>();
	for (const dep of southboundDepartures) {
		const name = dep.stopName || 'Unassigned';
		const seq = dep.stopSequence ?? 150;
		if (!map.has(name)) {
			map.set(name, { departures: [], minSeq: seq });
		}
		const item = map.get(name)!;
		item.departures.push(dep);
		if (seq < item.minSeq) item.minSeq = seq;
	}
	return Array.from(map.entries())
		.map(([stopName, data]) => ({
			stopName,
			departures: data.departures,
			stopSequence: data.minSeq,
		}))
		.sort((a, b) => a.stopSequence - b.stopSequence);
});
</script>

{#snippet stopNode(nodeTitle: string, departures: TransitDeparture[], emptyMsg: string)}
	{@const liveHeroIndex = departures.findIndex((d) => d.isRealtime)}
	{@const heroIndex = liveHeroIndex !== -1 && liveHeroIndex <= 2 ? liveHeroIndex : 0}
	{@const nextDep = departures[heroIndex] as BusDeparture | undefined}
	{@const followUps = departures.filter((_, idx) => idx !== heroIndex)}


	<div class="space-y-2.5">
		{#if nodeTitle}
			<div class="px-0.5">
				<h4 class="text-xs font-extrabold text-text-main">{nodeTitle}</h4>
			</div>
		{/if}

		{#if departures.length === 0}
			<div class="text-center text-xs text-text-muted italic py-5 border border-dashed border-border-default/60 rounded-xl">
				{emptyMsg}
			</div>
		{:else}
			{#if nextDep}
				{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
				{@const pill = resolveHeroStatusPill(nextDep, accentColor)}
				{@const cleanNextStop = nextDep.nextStopName && !/approaching|at stop|at_stop/i.test(nextDep.nextStopName) ? ` (${nextDep.nextStopName})` : ''}
				{@const subDetails = nextDep.vehicleId ? `Bus #${nextDep.vehicleId}${cleanNextStop}` : undefined}

				<div class="p-3.5 rounded-xl border space-y-2 relative overflow-hidden shadow-2xs {styles.heroContainer}">
					<!-- Top Row: Standardized Status Pill (Left) & Relative Countdown (Right) -->
					<div class="flex items-center justify-between text-xs">
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {pill.pillClass}">
							{#key pill.icon}
								<HugeiconsIcon icon={pill.icon} size={10} />
							{/key}
							<span>{pill.label}</span>
						</span>

						<span class="font-mono text-xs font-bold {styles.timeText}">
							{formatRelativeTime(targetTime)}
						</span>
					</div>

					<!-- Middle Row: Clean Destination Title (Left) & Large Clock Time (Right) -->
					<div class="flex items-baseline justify-between gap-2 pt-0.5">
						<div class="text-sm font-extrabold text-text-main leading-tight truncate min-w-0 flex-1">
							<span class="truncate">{nextDep.headsign}</span>
						</div>

						<div class="font-mono text-lg font-black text-text-main leading-none shrink-0">
							{formatClockTime(targetTime)}
						</div>
					</div>

					<!-- Bottom Row: Sub Details (Left) & Scheduled Fallback (Right) -->
					<div class="flex items-center justify-between text-[10px] font-mono text-text-muted pt-0.5">
						<div class="truncate min-w-0 flex-1">
							{#if subDetails}
								{@const cleanSubDetails = subDetails.replace(/\s*\((?:approaching|at stop|at_stop)\)/gi, '')}
								{#if cleanSubDetails}
									<span>{cleanSubDetails}</span>
								{/if}
							{/if}

						</div>

						{#if !nextDep.isRealtime}
							<div class="shrink-0 font-medium">Scheduled</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Follow-Up Departures: Compact Horizontal Arrival Chips -->
			{#if followUps.length > 0}
				<div class="flex flex-wrap items-center gap-1.5 pt-1">
					{#each followUps as dep (dep.id)}
						{@const b = dep as BusDeparture}
						{@const t = b.predictedTime || b.scheduledTime}
						{@const relTime = formatRelativeTime(t, undefined, true)}
						{@const absTime = formatClockTime(t)}

						<div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-elevated/60 border border-border-default/60 text-xs shadow-2xs hover:bg-bg-surface transition-colors">
							{#if b.isRealtime}
								<HugeiconsIcon icon={FlashIcon} size={10} class={styles.iconColor} />
							{:else}
								<HugeiconsIcon icon={Clock01Icon} size={10} class="text-text-muted opacity-60" />
							{/if}

							<span class="font-mono font-extrabold text-text-main text-[11px]">{absTime}</span>
							<span class="font-mono text-text-muted text-[10px]">({relTime})</span>

							{#if b.vehicleId}
								<span class="px-1 py-0.2 rounded bg-bg-surface text-[9px] font-mono font-bold text-text-muted border border-border-default/70 shrink-0">
									#{b.vehicleId}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

<div class="space-y-6">
	<ModeSectionHeader {title} {icon} {iconBgClass} {alerts} />

	<!-- 1. NORTHBOUND STOPS SECTION (In Travel Sequence Order: South -> North) -->
	<div class="space-y-3">
		<div class="flex items-center justify-between px-1 border-b border-border-default/50 pb-2">
			<div>
				<h3 class="text-sm font-black text-text-main">
					{northboundTitle}
				</h3>
				<p class="text-xs text-text-muted font-medium">{northboundSubtitle}</p>
			</div>
			<span class="px-2 py-0.5 rounded-md {styles.badge} font-mono text-[10px] font-bold uppercase tracking-wider border">
				{northboundGroups.length} Stops
			</span>
		</div>

		{#if northboundGroups.length === 0}
			<div class="text-center text-xs text-text-muted italic py-6 border border-dashed border-border-default/60 rounded-xl">
				{emptyMessageNorth}
			</div>
		{:else}
			{#each northboundGroups as group (group.stopName)}
				<div class="panel-card p-4 space-y-3">
					<div class="border-b border-border-default/40 pb-1.5 flex items-center justify-between">
						<h4 class="text-sm font-black tracking-tight text-text-main">{group.stopName}</h4>
						<span class="px-2 py-0.5 rounded-md {styles.badge} font-mono text-[9px] font-bold uppercase tracking-wider border">
							Northbound
						</span>
					</div>
					<div class="w-full">
						{@render stopNode('', group.departures, emptyMessageNorth)}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- 2. SOUTHBOUND STOPS SECTION (In Travel Sequence Order: North -> South) -->
	<div class="space-y-3 pt-2">
		<div class="flex items-center justify-between px-1 border-b border-border-default/50 pb-2">
			<div>
				<h3 class="text-sm font-black text-text-main">
					{southboundTitle}
				</h3>
				<p class="text-xs text-text-muted font-medium">{southboundSubtitle}</p>
			</div>
			<span class="px-2 py-0.5 rounded-md {styles.badge} font-mono text-[10px] font-bold uppercase tracking-wider border">
				{southboundGroups.length} Stops
			</span>
		</div>


		{#if southboundGroups.length === 0}
			<div class="text-center text-xs text-text-muted italic py-6 border border-dashed border-border-default/60 rounded-xl">
				{emptyMessageSouth}
			</div>
		{:else}
			{#each southboundGroups as group (group.stopName)}
				<div class="panel-card p-4 space-y-3">
					<div class="border-b border-border-default/40 pb-1.5 flex items-center justify-between">
						<h4 class="text-sm font-black tracking-tight text-text-main">{group.stopName}</h4>
						<span class="px-2 py-0.5 rounded-md {styles.badge} font-mono text-[9px] font-bold uppercase tracking-wider border">
							Southbound
						</span>
					</div>
					<div class="w-full">
						{@render stopNode('', group.departures, emptyMessageSouth)}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
