<script lang="ts">
import { Clock01Icon, LiveStreaming02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type {
	BusDeparture,
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import { resolveHeroStatusPill } from '$lib/transit/utils/status-pill';
import { formatClockTime, formatRelativeTime } from '$lib/utils/time-format';
import ModeSectionHeader from './ModeSectionHeader.svelte';
import VehicleCorridorTracker from './VehicleCorridorTracker.svelte';

interface Props {
	title: string;
	icon: any;
	iconBgClass: string;
	accentColor: 'blue' | 'rose';
	northboundDepartures: TransitDeparture[];
	southboundDepartures: TransitDeparture[];
	vehicles?: LiveVehiclePosition[];
	alerts?: TransitAlert[];
	showRadar?: boolean;
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
	vehicles = [],
	alerts = [],
	showRadar = true,
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
	},
	rose: {
		heroContainer:
			'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.blue);

function cleanHeadsign(headsign: string): string {
	if (!headsign) return 'Roosevelt Island';
	return headsign
		.replace(/ via RI Bridge/i, '')
		.replace(/Roosevelt Island - /i, '')
		.replace(/ Express/i, '')
		.trim();
}

function filterStop(
	deps: TransitDeparture[],
	keywords: string[],
	fallbackAll = false,
): TransitDeparture[] {
	const filtered = deps.filter((d) => {
		const b = d as BusDeparture;
		const name = (b.stopName || '').toLowerCase();
		return keywords.some((k) => name.includes(k));
	});
	return filtered.length > 0 ? filtered : fallbackAll ? deps : [];
}

let subwayPlazaNorth = $derived(
	filterStop(
		northboundDepartures,
		['subway', 'main st/roosevelt', 'west rd/roosevelt', 'plaza'],
		true,
	),
);

let subwayPlazaSouth = $derived(
	filterStop(
		southboundDepartures,
		['subway', 'main st/roosevelt', 'west rd/roosevelt', 'plaza'],
		true,
	),
);

let southtownNorth = $derived(
	filterStop(
		northboundDepartures,
		['southtown', 'cornell', 'tech', '10 river', 'motorgate', 'school'],
		false,
	),
);

let southtownSouth = $derived(
	filterStop(
		southboundDepartures,
		['southtown', 'cornell', 'tech', '10 river', 'motorgate', 'school'],
		false,
	),
);

let octagonNorth = $derived(
	filterStop(northboundDepartures, ['octagon', 'coler', 'east rd', '546 main'], false),
);

let octagonSouth = $derived(
	filterStop(southboundDepartures, ['octagon', 'coler', 'east rd', '546 main'], false),
);
</script>

{#snippet stopNode(nodeTitle: string, departures: TransitDeparture[], emptyMsg: string)}
	{@const nextDep = departures[0] as BusDeparture | undefined}
	{@const followUps = departures.slice(1, 5)}

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
				{@const cleanNextStop = nextDep.nextStopName && !/approaching|at stop|at_stop/i.test(nextDep.nextStopName) ? ` • ${nextDep.nextStopName}` : ''}
				{@const subDetails = nextDep.vehicleId ? `Bus #${nextDep.vehicleId}${cleanNextStop}` : undefined}

				<div class="p-3.5 rounded-xl border space-y-2 relative overflow-hidden shadow-2xs {styles.heroContainer}">
					<!-- Top Row: Standardized Status Pill (Left) & Relative Countdown (Right) -->
					<div class="flex items-center justify-between text-xs">
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider {pill.pillClass}">
							<HugeiconsIcon icon={pill.icon} size={10} />
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
								<span>{subDetails}</span>
							{:else}
								<span>{nextDep.routeName || 'Bus Departure'}</span>
							{/if}
						</div>

						{#if !nextDep.isRealtime}
							<span class="shrink-0 ml-2">Scheduled</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Follow-Up Timetable List matching standard TimetableList.svelte structure -->
			{#if followUps.length > 0}
				<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
					{#each followUps as dep (dep.id)}
						{@const t = dep.predictedTime || dep.scheduledTime}
						{@const b = dep as BusDeparture}
						{@const shortHeadsign = cleanHeadsign(b.headsign)}
						<div class="p-2.5 flex items-center justify-between text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
							<!-- Left Side: Route Pill + Destination Headsign -->
							<div class="flex items-center gap-2 min-w-0 flex-1">
								<span class="px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-default/80 font-mono text-[9px] text-text-muted shrink-0 font-bold">
									{b.vehicleId ? `Bus #${b.vehicleId}` : b.routeId === 'RED_BUS' ? 'Red Bus' : 'Q102'}
								</span>
								<span class="font-medium text-text-main truncate text-xs">{shortHeadsign}</span>
							</div>

							<!-- Right Side: Relative Countdown + Clock Time + Live Flash / Sched Icon -->
							<div class="flex items-center gap-2.5 font-mono shrink-0">
								<span class="text-text-muted text-[10px]">{formatRelativeTime(t)}</span>
								<span class="font-bold text-text-main text-[11px]">{formatClockTime(t)}</span>
								{#if b.isRealtime}
									<HugeiconsIcon icon={LiveStreaming02Icon} size={10} class={styles.iconColor} />
								{:else}
									<HugeiconsIcon icon={Clock01Icon} size={10} class="text-text-muted opacity-60" />
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

<div class="space-y-4">
	<ModeSectionHeader {title} {icon} {iconBgClass} {alerts} />

	<!-- Live Corridor Radar Track (Conditional) -->
	{#if showRadar}
		<VehicleCorridorTracker {vehicles} {accentColor} />
	{/if}

	<!-- 1. Subway Plaza -->
	<div class="panel-card p-4 space-y-3">
		<div class="border-b border-border-default/40 pb-2">
			<h3 class="text-sm font-black tracking-tight text-text-main">Subway Plaza</h3>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{@render stopNode(northboundTitle, subwayPlazaNorth, emptyMessageNorth)}
			{@render stopNode(southboundTitle, subwayPlazaSouth, emptyMessageSouth)}
		</div>
	</div>

	<!-- 2. Southtown / Chapel -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-black tracking-tight text-text-main">Southtown / Chapel</h3>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{@render stopNode(northboundTitle, southtownNorth, emptyMessageNorth)}
			{@render stopNode(southboundTitle, southtownSouth, emptyMessageSouth)}
		</div>
	</div>

	<!-- 3. Octagon / Coler -->
	<div class="panel-card p-4 space-y-3">
		<div class="border-b border-border-default/40 pb-2">
			<h3 class="text-sm font-black tracking-tight text-text-main">Octagon / Coler</h3>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{@render stopNode(northboundTitle, octagonNorth, emptyMessageNorth)}
			{@render stopNode(southboundTitle, octagonSouth, emptyMessageSouth)}
		</div>
	</div>
</div>
