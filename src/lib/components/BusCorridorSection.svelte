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
	northboundBadgeText?: string;
	southboundBadgeText?: string;
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
	northboundBadgeText = 'Northbound',
	southboundBadgeText = 'Southbound',
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

{#snippet stopNode(departures: TransitDeparture[], emptyMsg: string)}
	{@const liveHeroIndex = departures.findIndex((d) => d.isRealtime)}
	{@const heroIndex = liveHeroIndex !== -1 && liveHeroIndex <= 2 ? liveHeroIndex : 0}
	{@const nextDep = departures[heroIndex] as BusDeparture | undefined}
	{@const followUps = departures.filter((_, idx) => idx !== heroIndex)}

	{#if departures.length === 0}
		<div class="text-center text-xs text-text-muted italic py-5 border border-dashed border-border-default/60 rounded-xl">
			{emptyMsg}
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
			<!-- LEFT COLUMN: Hero Departure Card -->
			{#if nextDep}
				{@const targetTime = nextDep.predictedTime || nextDep.scheduledTime}
				{@const pill = resolveHeroStatusPill(nextDep, accentColor)}
				{@const cleanNextStop = nextDep.nextStopName && !/approaching|at stop|at_stop/i.test(nextDep.nextStopName) ? ` (${nextDep.nextStopName})` : ''}
				{@const subDetails = nextDep.vehicleId ? `Bus #${nextDep.vehicleId}${cleanNextStop}` : undefined}

				<div class="p-3.5 rounded-xl border space-y-2 relative overflow-hidden shadow-2xs flex flex-col justify-between self-start {styles.heroContainer}">
					<!-- Top Row: Status Pill -->
					<div class="flex items-center justify-between text-xs">
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {pill.pillClass}">
							{#key pill.icon}
								<HugeiconsIcon icon={pill.icon} size={10} />
							{/key}
							<span>{pill.label}</span>
						</span>
					</div>

					<!-- Middle Row: Clean Destination Title -->
					<div class="pt-0.5">
						<h4 class="text-sm font-extrabold text-text-main leading-tight truncate">
							{nextDep.headsign}
						</h4>
					</div>

					<!-- Large Clock Time & Countdown -->
					<div>
						<div class="font-mono text-xl font-black text-text-main leading-none pt-0.5">
							{formatClockTime(targetTime)}
						</div>
						<div class="font-mono text-xs font-bold mt-1 {styles.timeText}">
							{formatRelativeTime(targetTime)}
						</div>
					</div>

					<!-- Sub Details -->
					<div class="text-[10px] font-mono text-text-muted pt-0.5 truncate">
						{#if subDetails}
							{@const cleanSubDetails = subDetails.replace(/\s*\((?:approaching|at stop|at_stop)\)/gi, '')}
							{#if cleanSubDetails}
								<span>{cleanSubDetails}</span>
							{/if}
						{:else if !nextDep.isRealtime}
							<span>Scheduled</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- RIGHT COLUMN: Timetable List (Subway/Ferry/Tram style divide-y list) -->
			<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden self-start shadow-2xs">
				{#if followUps.length > 0}
					{#each followUps as dep (dep.id)}
						{@const b = dep as BusDeparture}
						{@const t = b.predictedTime || b.scheduledTime}
						{@const relTime = formatRelativeTime(t, undefined, true)}
						{@const absTime = formatClockTime(t)}

						<div class="px-3 py-2 flex items-center justify-between text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
							<div class="flex items-center gap-2 font-mono">
								<!-- Relative Countdown (6 mins) FIRST with fixed min-width for vertical column alignment -->
								<span class="font-mono text-xs font-semibold text-text-main shrink-0 min-w-17">
									{relTime}
								</span>

								<!-- Optional Vehicle ID SECOND (Aligned in clean vertical column) -->
								{#if b.vehicleId}
									<span class="font-mono text-[10px] text-text-muted shrink-0 font-medium">
										#{b.vehicleId}
									</span>
								{/if}
							</div>

							<!-- Far Right Side: Clock Time (04:00 PM) + Icon -->
							<div class="flex items-center gap-1.5 font-mono shrink-0 ml-auto">
								<span class="text-text-muted text-[11px]">{absTime}</span>
								{#if b.isRealtime}
									<HugeiconsIcon icon={FlashIcon} size={10} class={styles.iconColor} />
								{:else}
									<HugeiconsIcon icon={Clock01Icon} size={10} class="text-text-muted opacity-60" />
								{/if}
							</div>
						</div>
					{/each}
				{:else}
					<div class="text-xs text-text-muted italic p-3 text-center bg-bg-elevated/40">
						No subsequent departures
					</div>
				{/if}
			</div>
		</div>
	{/if}
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
							{northboundBadgeText}
						</span>
					</div>
					<div class="w-full">
						{@render stopNode(group.departures, emptyMessageNorth)}
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
							{southboundBadgeText}
						</span>
					</div>
					<div class="w-full">
						{@render stopNode(group.departures, emptyMessageSouth)}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
