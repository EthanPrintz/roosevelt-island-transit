<script lang="ts">
import {
	Alert02Icon,
	AlertCircleIcon,
	AnchorIcon,
	Bicycle01Icon,
	BoatIcon,
	FerryBoatIcon,
	FlashIcon,
	Navigation01Icon,
	SparklesIcon,
	SquareIcon,
	Train01Icon,
	Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';
import type { BikeStation, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let subwayRouteFilter = $state<'ALL' | 'F' | 'M'>('ALL');

$effect(() => {
	// Reactively reload whenever selectedWindow changes or triggerRefresh is incremented
	const _win = transitSettings.selectedWindow;
	const _trig = transitSettings.refreshTrigger;
	loadLiveData();
});

$effect(() => {
	// Auto-refresh every 15 seconds (matching server cache TTL)
	const interval = setInterval(() => {
		loadLiveData();
	}, 15000);

	return () => {
		clearInterval(interval);
	};
});

async function loadLiveData() {
	try {
		transitSettings.isLoading = true;
		const res = await fetch(`/api/transit?window=${transitSettings.selectedWindow}`);
		if (res.ok) {
			const json = await res.json();
			departures = json.departures || [];
			alerts = json.alerts || [];
			stations = json.stations || [];
			transitSettings.fetchedAt = json.fetchedAt || '';
		}
	} catch (_err) {
		// Catch network error
	} finally {
		transitSettings.isLoading = false;
	}
}

function getRelativeTimeLabel(isoString: string): string {
	const diffMs = new Date(isoString).getTime() - Date.now();
	const mins = Math.round(diffMs / 60000);
	if (mins <= 0) return 'Arriving Now';
	if (mins === 1) return 'In 1 min';
	return `In ${mins} mins`;
}

type DockSlotType = 'ebike' | 'classic' | 'broken_bike' | 'disabled_dock' | 'empty';

function generateDockSlots(station: BikeStation): DockSlotType[] {
	const slots: DockSlotType[] = [];

	const ebikeCount = station.bikesAvailable.ebike || 0;
	for (let i = 0; i < ebikeCount; i++) {
		slots.push('ebike');
	}

	const classicCount = station.bikesAvailable.classic || 0;
	for (let i = 0; i < classicCount; i++) {
		slots.push('classic');
	}

	const brokenBikes = station.disabledBikes || 0;
	for (let i = 0; i < brokenBikes; i++) {
		slots.push('broken_bike');
	}

	const disabledDocks = station.disabledDocks || 0;
	for (let i = 0; i < disabledDocks; i++) {
		slots.push('disabled_dock');
	}

	const totalCapacity = Math.max(station.capacity, slots.length);
	const remaining = Math.max(0, totalCapacity - slots.length);
	for (let i = 0; i < remaining; i++) {
		slots.push('empty');
	}

	return slots;
}

let subwayDepartures = $derived(
	departures
		.filter((d) => d.mode === 'subway')
		.filter((d) => (subwayRouteFilter === 'ALL' ? true : d.routeId === subwayRouteFilter)),
);
let manhattanSubways = $derived(subwayDepartures.filter((d) => d.direction === 'manhattan_bound'));
let queensSubways = $derived(subwayDepartures.filter((d) => d.direction === 'queens_bound'));

let ferryDepartures = $derived(departures.filter((d) => d.mode === 'ferry'));
let southboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'southbound'));
let northboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'northbound'));

let totalEbikes = $derived(stations.reduce((sum, s) => sum + (s.bikesAvailable.ebike || 0), 0));
let totalClassicBikes = $derived(
	stations.reduce((sum, s) => sum + (s.bikesAvailable.classic || 0), 0),
);
let totalOpenDocks = $derived(stations.reduce((sum, s) => sum + (s.docksAvailable || 0), 0));
let totalBrokenBikes = $derived(stations.reduce((sum, s) => sum + (s.disabledBikes || 0), 0));
</script>

<svelte:head>
	<title>Roosevelt Island Transit</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
	<!-- Active System Alerts -->
	{#if alerts.length > 0}
		<div class="space-y-2">
			<h2 class="section-title">
				<HugeiconsIcon icon={Alert02Icon} size={14} class="text-amber-500" />
				<span>Alerts ({alerts.length})</span>
			</h2>
			<div class="space-y-2">
				{#each alerts as alert (alert.id)}
					<div class="p-3 rounded-xl bg-bg-surface border border-border-default text-xs space-y-1">
						<div class="flex items-center gap-2">
							<span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold">
								{alert.mode}
							</span>
							<strong class="text-text-main">{alert.title}</strong>
						</div>
						<p class="text-text-muted">{alert.description}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Section: Subway -->
	<div class="space-y-2.5">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<h2 class="section-title">
				<HugeiconsIcon icon={Train01Icon} size={15} class="text-orange-500" />
				<span>Subway</span>
			</h2>

			<!-- Unified Subway Controls Cluster (Line Toggle + Hour Lookahead Selector) -->
			<div class="flex items-center gap-2 shrink-0">
				<!-- Route Filter Toggle -->
				<div class="flex items-center rounded-xl bg-bg-surface border border-border-default p-1 text-xs shrink-0 gap-0.5">
					<button
						onclick={() => (subwayRouteFilter = 'ALL')}
						class="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {subwayRouteFilter === 'ALL'
							? 'bg-primary text-primary-fg shadow-xs'
							: 'text-text-muted hover:text-text-main'}"
					>
						All
					</button>
					<button
						onclick={() => (subwayRouteFilter = 'F')}
						class="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 {subwayRouteFilter === 'F'
							? 'bg-orange-500 text-white shadow-xs'
							: 'text-text-muted hover:text-text-main'}"
					>
						<span class="bullet-subway text-[9px]">F</span>
					</button>
					<button
						onclick={() => (subwayRouteFilter = 'M')}
						class="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 {subwayRouteFilter === 'M'
							? 'bg-orange-500 text-white shadow-xs'
							: 'text-text-muted hover:text-text-main'}"
					>
						<span class="bullet-subway text-[9px]">M</span>
					</button>
				</div>

				<!-- Hour Lookahead Selector -->
				<div class="flex items-center rounded-xl bg-bg-surface border border-border-default p-1 text-xs shrink-0 gap-0.5">
					{#each [120, 240, 360, 480] as win}
						<button
							onclick={() => transitSettings.setWindow(win)}
							class="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {transitSettings.selectedWindow === win
								? 'bg-primary text-primary-fg shadow-xs'
								: 'text-text-muted hover:text-text-main'}"
						>
							{win / 60}h
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<!-- Manhattan-Bound Column -->
			<div class="panel-card">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1">
							<span class="bullet-subway text-[9px]">F</span>
							<span class="bullet-subway text-[9px]">M</span>
						</div>
						<h3 class="text-xs font-bold text-text-main uppercase tracking-wider">Manhattan-Bound</h3>
					</div>
				</div>

				{#if manhattanSubways.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Manhattan trains.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Manhattan-Bound Train -->
					{@const nextTrain = manhattanSubways[0]}
					<div class="p-3 rounded-xl bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border border-orange-500/30 space-y-1.5 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								<span class="bullet-subway text-[9px]">
									{nextTrain.routeId}
								</span>
								{#if nextTrain.scheduleRelationship === 'ADDED'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-[9px] uppercase">
										<HugeiconsIcon icon={SparklesIcon} size={10} />
										<span>Extra</span>
									</span>
								{:else if nextTrain.scheduleRelationship === 'CANCELED'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-300 font-mono text-[9px] uppercase">
										<HugeiconsIcon icon={AlertCircleIcon} size={10} />
										<span>Canceled</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-0.5">
							<div>
								<div class="text-sm font-extrabold text-text-main leading-tight flex items-center gap-2">
									<span>{nextTrain.headsign}</span>
								</div>
								{#if nextTrain.originStartTime}
									<div class="text-[10px] text-text-muted mt-0.5 font-mono">
										Dispatched: {nextTrain.originStartTime}
									</div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-mono text-lg font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={10} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[9px] text-text-muted">Scheduled</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT TRAINS -->
					{#if manhattanSubways.length > 1}
						<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
							{#each manhattanSubways.slice(1) as train (train.id)}
								<div class="p-2 flex items-center justify-between text-xs">
									<div class="flex items-center gap-2">
										<span class="bullet-subway text-[9px]">
											{train.routeId}
										</span>
										<span class="font-medium text-text-main">{train.headsign}</span>
										{#if train.scheduleRelationship === 'ADDED'}
											<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px]">
												<HugeiconsIcon icon={SparklesIcon} size={9} />
												<span>Extra</span>
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-2.5 font-mono">
										<span class="text-text-muted text-[10px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
										<span class="font-bold text-text-main text-[11px]">
											{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										{#if train.isRealtime}
											<span>
												<HugeiconsIcon icon={FlashIcon} size={10} class="text-emerald-500" />
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Queens-Bound Column -->
			<div class="panel-card">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1">
							<span class="bullet-subway text-[9px]">F</span>
							<span class="bullet-subway text-[9px]">M</span>
						</div>
						<h3 class="text-xs font-bold text-text-main uppercase tracking-wider">Queens-Bound</h3>
					</div>
				</div>

				{#if queensSubways.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Queens trains.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Queens-Bound Train -->
					{@const nextTrain = queensSubways[0]}
					<div class="p-3 rounded-xl bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border border-orange-500/30 space-y-1.5 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								<span class="bullet-subway text-[9px]">
									{nextTrain.routeId}
								</span>
								{#if nextTrain.scheduleRelationship === 'ADDED'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-[9px] uppercase">
										<HugeiconsIcon icon={SparklesIcon} size={10} />
										<span>Extra</span>
									</span>
								{:else if nextTrain.scheduleRelationship === 'CANCELED'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-300 font-mono text-[9px] uppercase">
										<HugeiconsIcon icon={AlertCircleIcon} size={10} />
										<span>Canceled</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-0.5">
							<div>
								<div class="text-sm font-extrabold text-text-main leading-tight flex items-center gap-2">
									<span>{nextTrain.headsign}</span>
								</div>
								{#if nextTrain.originStartTime}
									<div class="text-[10px] text-text-muted mt-0.5 font-mono">
										Dispatched: {nextTrain.originStartTime}
									</div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-mono text-lg font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={10} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[9px] text-text-muted">Scheduled</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT TRAINS -->
					{#if queensSubways.length > 1}
						<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
							{#each queensSubways.slice(1) as train (train.id)}
								<div class="p-2 flex items-center justify-between text-xs">
									<div class="flex items-center gap-2">
										<span class="bullet-subway text-[9px]">
											{train.routeId}
										</span>
										<span class="font-medium text-text-main">{train.headsign}</span>
										{#if train.scheduleRelationship === 'ADDED'}
											<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px]">
												<HugeiconsIcon icon={SparklesIcon} size={9} />
												<span>Extra</span>
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-2.5 font-mono">
										<span class="text-text-muted text-[10px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
										<span class="font-bold text-text-main text-[11px]">
											{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										{#if train.isRealtime}
											<span>
												<HugeiconsIcon icon={FlashIcon} size={10} class="text-emerald-500" />
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Ferry -->
	<div class="space-y-2.5">
		<div class="flex items-center justify-between">
			<h2 class="section-title">
				<HugeiconsIcon icon={FerryBoatIcon} size={15} class="text-sky-500" />
				<span>Ferry</span>
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<!-- Southbound Column -->
			<div class="panel-card">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold text-text-main uppercase tracking-wider">Southbound / Wall St</h3>
				</div>

				{#if southboundFerries.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Southbound ferries.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Southbound Ferry -->
					{@const nextFerry = southboundFerries[0]}
					<div class="p-3 rounded-xl bg-linear-to-br from-sky-500/10 via-bg-surface to-bg-surface border border-sky-500/30 space-y-1.5 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								{#if nextFerry.vesselStatus === 'STOPPED_AT'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={AnchorIcon} size={10} />
										<span>Docked</span>
									</span>
								{:else if nextFerry.vesselStatus === 'INCOMING_AT'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={Navigation01Icon} size={10} />
										<span>Approaching</span>
									</span>
								{:else if nextFerry.vesselStatus === 'IN_TRANSIT_TO'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={BoatIcon} size={10} />
										<span>En Route</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-0.5">
							<div>
								<div class="text-sm font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								{#if nextFerry.vesselName || (nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0)}
									<div class="text-[10px] text-text-muted mt-0.5 flex items-center gap-1.5 font-mono">
										{#if nextFerry.vesselName}
											<span>{nextFerry.vesselName}</span>
										{/if}
										{#if nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0}
											<span>• <strong class="text-sky-600 dark:text-sky-400">{nextFerry.speedKnots} kts</strong></span>
										{/if}
									</div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-mono text-lg font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={10} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[9px] text-text-muted">Scheduled</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT FERRIES -->
					{#if southboundFerries.length > 1}
						<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
							{#each southboundFerries.slice(1) as ferry (ferry.id)}
								<div class="p-2 flex items-center justify-between text-xs">
									<div class="flex items-center gap-2">
										<span class="font-medium text-text-main">{ferry.headsign}</span>
										{#if ferry.vesselName}
											<span class="text-[10px] font-mono text-text-muted">({ferry.vesselName})</span>
										{/if}
									</div>
									<div class="flex items-center gap-2.5 font-mono">
										<span class="text-text-muted text-[10px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
										<span class="font-bold text-text-main text-[11px]">
											{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										{#if ferry.isRealtime}
											<span>
												<HugeiconsIcon icon={FlashIcon} size={10} class="text-emerald-500" />
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Northbound Column -->
			<div class="panel-card">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold text-text-main uppercase tracking-wider">Northbound / E 90th St</h3>
				</div>

				{#if northboundFerries.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Northbound ferries.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Northbound Ferry -->
					{@const nextFerry = northboundFerries[0]}
					<div class="p-3 rounded-xl bg-linear-to-br from-sky-500/10 via-bg-surface to-bg-surface border border-sky-500/30 space-y-1.5 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5">
								{#if nextFerry.vesselStatus === 'STOPPED_AT'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={AnchorIcon} size={10} />
										<span>Docked</span>
									</span>
								{:else if nextFerry.vesselStatus === 'INCOMING_AT'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={Navigation01Icon} size={10} />
										<span>Approaching</span>
									</span>
								{:else if nextFerry.vesselStatus === 'IN_TRANSIT_TO'}
									<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono text-[9px] uppercase font-bold">
										<HugeiconsIcon icon={BoatIcon} size={10} />
										<span>En Route</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-0.5">
							<div>
								<div class="text-sm font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								{#if nextFerry.vesselName || (nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0)}
									<div class="text-[10px] text-text-muted mt-0.5 flex items-center gap-1.5 font-mono">
										{#if nextFerry.vesselName}
											<span>{nextFerry.vesselName}</span>
										{/if}
										{#if nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0}
											<span>• <strong class="text-sky-600 dark:text-sky-400">{nextFerry.speedKnots} kts</strong></span>
										{/if}
									</div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-mono text-lg font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={10} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[9px] text-text-muted">Scheduled</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT FERRIES -->
					{#if northboundFerries.length > 1}
						<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
							{#each northboundFerries.slice(1) as ferry (ferry.id)}
								<div class="p-2 flex items-center justify-between text-xs">
									<div class="flex items-center gap-2">
										<span class="font-medium text-text-main">{ferry.headsign}</span>
										{#if ferry.vesselName}
											<span class="text-[10px] font-mono text-text-muted">({ferry.vesselName})</span>
										{/if}
									</div>
									<div class="flex items-center gap-2.5 font-mono">
										<span class="text-text-muted text-[10px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
										<span class="font-bold text-text-main text-[11px]">
											{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										{#if ferry.isRealtime}
											<span>
												<HugeiconsIcon icon={FlashIcon} size={10} class="text-emerald-500" />
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Citi Bike -->
	<div class="space-y-2.5">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<h2 class="section-title">
				<HugeiconsIcon icon={Bicycle01Icon} size={15} class="text-emerald-500" />
				<span>Citi Bike</span>
			</h2>

			<!-- Legend Bar -->
			<div class="flex flex-wrap items-center gap-3 text-[10px] font-medium text-text-muted bg-bg-surface px-3 py-1 rounded-xl border border-border-default shadow-2xs">
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-sky-500 flex items-center justify-center text-white shadow-2xs">
						<HugeiconsIcon icon={FlashIcon} size={8} />
					</span>
					<span>E-Bike ({totalEbikes})</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-primary flex items-center justify-center text-primary-fg shadow-2xs">
						<HugeiconsIcon icon={Bicycle01Icon} size={8} />
					</span>
					<span>Classic ({totalClassicBikes})</span>
				</div>
				{#if totalBrokenBikes > 0}
					<div class="flex items-center gap-1.5">
						<span class="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
							<HugeiconsIcon icon={Wrench01Icon} size={8} />
						</span>
						<span>Broken ({totalBrokenBikes})</span>
					</div>
				{/if}
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-bg-elevated/60 border border-border-default flex items-center justify-center text-text-muted">
						<HugeiconsIcon icon={SquareIcon} size={8} />
					</span>
					<span>Open Dock ({totalOpenDocks})</span>
				</div>
			</div>
		</div>

		{#if stations.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{transitSettings.isLoading ? 'Loading...' : 'No Citi Bike status available.'}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				{#each stations as station (station.id)}
					{@const slots = generateDockSlots(station)}
					<div class="panel-card flex flex-col justify-between">
						<div>
							<div class="flex items-start justify-between gap-2">
								<div>
									<h3 class="font-bold text-xs text-text-main leading-tight">{station.name}</h3>
									<div class="text-[11px] text-text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
										<strong class="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{station.bikesAvailable.total} bikes</strong>
										<span class="inline-flex items-center gap-0.5 font-mono text-sky-600 dark:text-sky-400">
											<HugeiconsIcon icon={FlashIcon} size={11} />
											<span>{station.bikesAvailable.ebike}</span>
										</span>
										<span class="inline-flex items-center gap-0.5 font-mono text-text-main">
											<HugeiconsIcon icon={Bicycle01Icon} size={11} />
											<span>{station.bikesAvailable.classic}</span>
										</span>
										<span>•</span>
										<strong class="text-text-main font-mono">{station.docksAvailable} docks</strong>
									</div>
								</div>
							</div>

							<!-- Visual Dock Slot Grid -->
							<div class="mt-2.5 pt-2.5 border-t border-border-subtle/80">
								<div class="flex flex-wrap gap-1">
									{#each slots as slot, i}
										{#if slot === 'ebike'}
											<div
												class="w-3.5 h-3.5 rounded bg-sky-500 flex items-center justify-center text-white shadow-2xs"
												title="Slot #{i + 1}: E-Bike"
											>
												<HugeiconsIcon icon={FlashIcon} size={9} />
											</div>
										{:else if slot === 'classic'}
											<div
												class="w-3.5 h-3.5 rounded bg-primary flex items-center justify-center text-primary-fg shadow-2xs"
												title="Slot #{i + 1}: Classic Bike"
											>
												<HugeiconsIcon icon={Bicycle01Icon} size={9} />
											</div>
										{:else if slot === 'broken_bike'}
											<div
												class="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-2xs"
												title="Slot #{i + 1}: Broken Bike"
											>
												<HugeiconsIcon icon={Wrench01Icon} size={8} />
											</div>
										{:else if slot === 'disabled_dock'}
											<div
												class="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500"
												title="Slot #{i + 1}: Disabled Dock"
											>
												<HugeiconsIcon icon={AlertCircleIcon} size={8} />
											</div>
										{:else}
											<div
												class="w-3.5 h-3.5 rounded bg-bg-elevated/60 border border-border-default/80 flex items-center justify-center text-text-muted/40"
												title="Slot #{i + 1}: Open Dock"
											>
												<HugeiconsIcon icon={SquareIcon} size={7} />
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
