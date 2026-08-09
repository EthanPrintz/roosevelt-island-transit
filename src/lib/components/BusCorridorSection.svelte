<script lang="ts">
import { Clock01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type {
	BusDeparture,
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
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
		badgeDefault: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
	},
	rose: {
		heroContainer:
			'bg-linear-to-br from-rose-500/10 via-bg-surface to-bg-surface border-rose-500/30',
		timeText: 'text-rose-600 dark:text-rose-400',
		iconColor: 'text-rose-500',
		badgeDefault: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
	},
};

let styles = $derived(accentStyles[accentColor] || accentStyles.blue);

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

let southtownDepartures = $derived(
	filterStop(southboundDepartures, ['southtown', 'cornell', 'tech', '10 river', 'motorgate'], true),
);

let octagonDepartures = $derived(
	filterStop(southboundDepartures, ['octagon', 'coler', 'east rd', '546 main'], true),
);
</script>

{#snippet stopNode(nodeTitle: string, nodeSubtitle: string, departures: TransitDeparture[], emptyMsg: string)}
	{@const nextDep = departures[0] as BusDeparture | undefined}
	{@const followUps = departures.slice(1, 5)}

	<div class="space-y-2.5">
		<div class="px-0.5">
			<h4 class="text-xs font-extrabold text-text-main">{nodeTitle}</h4>
			{#if nodeSubtitle}
				<p class="text-[11px] font-mono text-text-muted">{nodeSubtitle}</p>
			{/if}
		</div>

		{#if departures.length === 0}
			<div class="text-center text-xs text-text-muted italic py-5 border border-dashed border-border-default/60 rounded-xl">
				{emptyMsg}
			</div>
		{:else}
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

			<!-- Follow-Up Timetable List -->
			{#if followUps.length > 0}
				<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
					{#each followUps as dep (dep.id)}
						{@const t = dep.predictedTime || dep.scheduledTime}
						{@const b = dep as BusDeparture}
						<div class="p-2.5 flex items-center justify-between text-xs gap-2 hover:bg-bg-surface/50 transition-colors">
							<div class="flex items-center gap-2 min-w-0 flex-1">
								{#if b.vehicleId}
									<span class="px-1.5 py-0.5 rounded-full bg-bg-surface border border-border-default/80 font-mono text-[9px] text-text-muted shrink-0 font-bold">
										Bus #{b.vehicleId}
									</span>
								{/if}
								<span class="font-medium text-text-main truncate text-xs">{b.headsign}</span>
							</div>

							<div class="flex items-center gap-2.5 font-mono shrink-0">
								<span class="text-text-muted text-[10px]">{formatRelativeTime(t)}</span>
								<span class="font-bold text-text-main text-[11px]">{formatClockTime(t)}</span>
								{#if b.isRealtime}
									<HugeiconsIcon icon={FlashIcon} size={10} class={styles.iconColor} />
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

	<!-- 1. Top Double-Wide Card: Subway Plaza (2 Columns for Both Directions) -->
	<div class="panel-card p-4 space-y-3">
		<div class="border-b border-border-default/40 pb-2">
			<h3 class="text-sm font-black tracking-tight text-text-main">Subway Plaza</h3>
			<p class="text-xs text-text-muted font-medium">Main Roosevelt Island Transit Hub</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{@render stopNode(
				northboundTitle,
				northboundSubtitle,
				subwayPlazaNorth,
				emptyMessageNorth,
			)}
			{@render stopNode(
				southboundTitle,
				southboundSubtitle,
				subwayPlazaSouth,
				emptyMessageSouth,
			)}
		</div>
	</div>

	<!-- 2. Bottom 2 Single-Wide Cards: Southtown/Tech & Octagon/Coler -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Southtown / Tech Card -->
		<div class="panel-card p-4 space-y-3">
			<div class="border-b border-border-default/40 pb-2">
				<h3 class="text-sm font-black tracking-tight text-text-main">Southtown / Tech</h3>
				<p class="text-xs text-text-muted font-medium">South Roosevelt Island Loop</p>
			</div>
			{@render stopNode(
				'Coler Hospital & Loop-Bound',
				'Southbound via Main St',
				southtownDepartures,
				'No upcoming Southtown / Tech departures.',
			)}
		</div>

		<!-- Octagon / Coler Card -->
		<div class="panel-card p-4 space-y-3">
			<div class="border-b border-border-default/40 pb-2">
				<h3 class="text-sm font-black tracking-tight text-text-main">Octagon / Coler</h3>
				<p class="text-xs text-text-muted font-medium">North Roosevelt Island Loop</p>
			</div>
			{@render stopNode(
				'Coler Hospital & Loop-Bound',
				'Northbound via Main St',
				octagonDepartures,
				'No upcoming Octagon / Coler departures.',
			)}
		</div>
	</div>
</div>
