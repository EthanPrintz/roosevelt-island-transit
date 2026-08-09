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
	RefreshIcon,
	SparklesIcon,
	SquareIcon,
	Train01Icon,
	Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { BikeStation, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let isCached = $state<boolean>(false);
let fetchedAt = $state<string>('');
let isLoading = $state<boolean>(true);
let autoRefreshSeconds = $state<number>(15);
let selectedWindow = $state<number>(240); // Default 4 hours lookahead
let subwayRouteFilter = $state<'ALL' | 'F' | 'M'>('ALL');

$effect(() => {
	loadLiveData();

	// Auto-refresh every 15 seconds (matching server cache TTL)
	const interval = setInterval(() => {
		loadLiveData();
	}, 15000);

	// Countdown tick timer for UI feedback
	const tick = setInterval(() => {
		autoRefreshSeconds = autoRefreshSeconds <= 1 ? 15 : autoRefreshSeconds - 1;
	}, 1000);

	return () => {
		clearInterval(interval);
		clearInterval(tick);
	};
});

async function loadLiveData() {
	try {
		isLoading = true;
		const res = await fetch(`/api/transit?window=${selectedWindow}`);
		if (res.ok) {
			const json = await res.json();
			departures = json.departures || [];
			alerts = json.alerts || [];
			stations = json.stations || [];
			isCached = json.isCached || false;
			fetchedAt = json.fetchedAt || '';
			autoRefreshSeconds = 15;
		}
	} catch (_err) {
		// Catch network error
	} finally {
		isLoading = false;
	}
}

function changeWindow(newWindow: number) {
	selectedWindow = newWindow;
	loadLiveData();
}

function getRelativeTimeLabel(isoString: string): string {
	const diffMs = new Date(isoString).getTime() - Date.now();
	const mins = Math.round(diffMs / 60000);
	if (mins <= 0) return 'Arriving Now';
	if (mins === 1) return 'In 1 min';
	return `In ${mins} mins`;
}

type DockSlotType = 'ebike' | 'classic' | 'empty' | 'disabled';

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

	const disabledDocks = station.disabledDocks || 0;
	for (let i = 0; i < disabledDocks; i++) {
		slots.push('disabled');
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
</script>

<svelte:head>
	<title>Roosevelt Island Live Transit Core</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
	<!-- Unified Header Card -->
	<header class="p-5 sm:p-6 rounded-2xl bg-bg-surface border border-border-default shadow-xs space-y-4">
		<!-- Top Bar: Title & Primary Controls -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1">
				<div>
					<h1 class="text-xl sm:text-2xl font-black text-text-main tracking-tight">Roosevelt Island Transit Core</h1>
				</div>
				<p class="text-xs text-text-muted">Real-time GTFS-RT subway, NYC Ferry & GBFS bikeshare streams with live telemetry.</p>
			</div>

			<div class="flex flex-wrap items-center gap-2.5 shrink-0">
				<!-- Lookahead Window Selector -->
				<div class="flex items-center rounded-xl bg-bg-elevated/60 border border-border-default/80 p-1 text-xs">
					<span class="px-2 text-[10px] font-bold text-text-muted uppercase">Window:</span>
					{#each [120, 240, 360, 480] as win}
						<button
							onclick={() => changeWindow(win)}
							class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {selectedWindow === win
								? 'bg-primary text-primary-fg shadow-xs'
								: 'text-text-muted hover:text-text-main'}"
						>
							{win / 60}h
						</button>
					{/each}
				</div>

				<button
					onclick={loadLiveData}
					disabled={isLoading}
					class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-fg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs cursor-pointer"
				>
					<HugeiconsIcon icon={RefreshIcon} size={13} class={isLoading ? 'animate-spin' : ''} />
					<span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
				</button>
			</div>
		</div>

		<!-- Bottom Bar: Live Network Status & Metadata Sync Bar -->
		<div class="pt-3.5 border-t border-border-subtle/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-text-muted">
			<!-- Live Transit Feed Health Badges -->
			<div class="flex flex-wrap items-center gap-2 font-medium">
				<span class="text-[10px] uppercase font-bold tracking-wider text-text-subtle">Feed Health:</span>
				<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-bold text-[10px] border border-orange-500/20">
					<HugeiconsIcon icon={Train01Icon} size={12} />
					<span>Subway GTFS-RT ({subwayDepartures.length})</span>
				</div>
				<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-bold text-[10px] border border-sky-500/20">
					<HugeiconsIcon icon={FerryBoatIcon} size={12} />
					<span>Ferry GTFS-RT ({ferryDepartures.length})</span>
				</div>
				<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/20">
					<HugeiconsIcon icon={Bicycle01Icon} size={12} />
					<span>Citi Bike GBFS ({stations.length})</span>
				</div>
			</div>

			{#if fetchedAt}
				<div class="font-mono text-[10px] text-right shrink-0">
					Synced: <strong class="text-text-main">{new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong> {isCached ? '(Cached 15s)' : '(Live Stream)'}
				</div>
			{/if}
		</div>
	</header>

	<!-- Active System Alerts -->
	{#if alerts.length > 0}
		<div class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
				<HugeiconsIcon icon={Alert02Icon} size={15} class="text-amber-500" />
				<span>Live Service Alerts ({alerts.length})</span>
			</h2>
			<div class="space-y-2">
				{#each alerts as alert (alert.id)}
					<div class="p-3.5 rounded-xl bg-bg-surface border border-border-default text-xs space-y-1">
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

	<!-- Dedicated Section: MTA Subway (F/M Trains) Split by Direction -->
	<div class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<HugeiconsIcon icon={Train01Icon} size={16} class="text-orange-500" />
				<span>MTA Subway (F/M Trains) — {subwayDepartures.length} Total Departures ({selectedWindow / 60}h Window)</span>
			</h2>

			<!-- Route Filter Toggle -->
			<div class="flex items-center rounded-xl bg-bg-surface border border-border-default p-1 text-xs shrink-0">
				<span class="px-2 text-[10px] font-bold text-text-muted uppercase">Line:</span>
				<button
					onclick={() => (subwayRouteFilter = 'ALL')}
					class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {subwayRouteFilter === 'ALL'
						? 'bg-primary text-primary-fg shadow-xs'
						: 'text-text-muted hover:text-text-main'}"
				>
					All
				</button>
				<button
					onclick={() => (subwayRouteFilter = 'F')}
					class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 {subwayRouteFilter === 'F'
						? 'bg-orange-500 text-white shadow-xs'
						: 'text-text-muted hover:text-text-main'}"
				>
					<span class="w-3.5 h-3.5 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center">F</span>
					<span>F Train</span>
				</button>
				<button
					onclick={() => (subwayRouteFilter = 'M')}
					class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 {subwayRouteFilter === 'M'
						? 'bg-orange-500 text-white shadow-xs'
						: 'text-text-muted hover:text-text-main'}"
				>
					<span class="w-3.5 h-3.5 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center">M</span>
					<span>M Train</span>
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Manhattan-Bound Column -->
			<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1">
							<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">F</span>
							<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">M</span>
						</div>
						<h3 class="text-sm font-bold text-text-main">Downtown / Manhattan-Bound</h3>
					</div>
					<span class="text-[11px] font-mono text-text-muted">Track B06S</span>
				</div>

				{#if manhattanSubways.length === 0}
					<div class="p-4 text-center text-xs text-text-muted">
						{isLoading ? 'Loading Manhattan trains...' : 'No upcoming Manhattan-bound trains in feed.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Manhattan-Bound Train -->
					{@const nextTrain = manhattanSubways[0]}
					<div class="p-4 rounded-xl bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border border-orange-500/30 space-y-2 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
									NEXT TRAIN
								</span>
								<!-- NYC Subway Circular Bullet -->
								<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">
									{nextTrain.routeId}
								</span>
								{#if nextTrain.scheduleRelationship === 'ADDED'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono font-bold text-[10px] uppercase border border-purple-500/30">
										<HugeiconsIcon icon={SparklesIcon} size={11} />
										<span>MTA Extra Train</span>
									</span>
								{:else if nextTrain.scheduleRelationship === 'CANCELED'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 font-mono font-bold text-[10px] uppercase border border-red-500/30">
										<HugeiconsIcon icon={AlertCircleIcon} size={11} />
										<span>Canceled</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight flex items-center gap-2">
									<span>{nextTrain.headsign}</span>
								</div>
								<div class="text-[11px] text-text-muted mt-0.5">
									Roosevelt Island Station • {nextTrain.routeName}
									{#if nextTrain.originStartTime}
										• Dispatched: <span class="font-mono">{nextTrain.originStartTime}</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={11} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[10px] text-text-muted">Scheduled Timetable</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT TRAINS -->
					{#if manhattanSubways.length > 1}
						<div class="space-y-1.5 pt-1">
							<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Following Trains</div>
							<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
								{#each manhattanSubways.slice(1) as train (train.id)}
									<div class="p-2.5 flex items-center justify-between text-xs">
										<div class="flex items-center gap-2">
											<span class="w-4 h-4 rounded-full bg-orange-500 text-white font-black text-[10px] flex items-center justify-center shadow-2xs shrink-0">
												{train.routeId}
											</span>
											<span class="font-medium text-text-main">{train.headsign}</span>
											{#if train.scheduleRelationship === 'ADDED'}
												<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px]">
													<HugeiconsIcon icon={SparklesIcon} size={10} />
													<span>Extra</span>
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if train.isRealtime}
												<span title="Live GTFS-RT">
													<HugeiconsIcon icon={FlashIcon} size={11} class="text-emerald-500" />
												</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Queens-Bound Column -->
			<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1">
							<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">F</span>
							<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">M</span>
						</div>
						<h3 class="text-sm font-bold text-text-main">Uptown / Queens-Bound</h3>
					</div>
					<span class="text-[11px] font-mono text-text-muted">Track B06N</span>
				</div>

				{#if queensSubways.length === 0}
					<div class="p-4 text-center text-xs text-text-muted">
						{isLoading ? 'Loading Queens trains...' : 'No upcoming Queens-bound trains in feed.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Queens-Bound Train -->
					{@const nextTrain = queensSubways[0]}
					<div class="p-4 rounded-xl bg-linear-to-br from-orange-500/10 via-bg-surface to-bg-surface border border-orange-500/30 space-y-2 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
									NEXT TRAIN
								</span>
								<!-- NYC Subway Circular Bullet -->
								<span class="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">
									{nextTrain.routeId}
								</span>
								{#if nextTrain.scheduleRelationship === 'ADDED'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono font-bold text-[10px] uppercase border border-purple-500/30">
										<HugeiconsIcon icon={SparklesIcon} size={11} />
										<span>MTA Extra Train</span>
									</span>
								{:else if nextTrain.scheduleRelationship === 'CANCELED'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 font-mono font-bold text-[10px] uppercase border border-red-500/30">
										<HugeiconsIcon icon={AlertCircleIcon} size={11} />
										<span>Canceled</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight flex items-center gap-2">
									<span>{nextTrain.headsign}</span>
								</div>
								<div class="text-[11px] text-text-muted mt-0.5">
									Roosevelt Island Station • {nextTrain.routeName}
									{#if nextTrain.originStartTime}
										• Dispatched: <span class="font-mono">{nextTrain.originStartTime}</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={11} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[10px] text-text-muted">Scheduled Timetable</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT TRAINS -->
					{#if queensSubways.length > 1}
						<div class="space-y-1.5 pt-1">
							<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Following Trains</div>
							<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
								{#each queensSubways.slice(1) as train (train.id)}
									<div class="p-2.5 flex items-center justify-between text-xs">
										<div class="flex items-center gap-2">
											<span class="w-4 h-4 rounded-full bg-orange-500 text-white font-black text-[10px] flex items-center justify-center shadow-2xs shrink-0">
												{train.routeId}
											</span>
											<span class="font-medium text-text-main">{train.headsign}</span>
											{#if train.scheduleRelationship === 'ADDED'}
												<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-[9px]">
													<HugeiconsIcon icon={SparklesIcon} size={10} />
													<span>Extra</span>
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if train.isRealtime}
												<span title="Live GTFS-RT">
													<HugeiconsIcon icon={FlashIcon} size={11} class="text-emerald-500" />
												</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Dedicated Section: NYC Ferry (Astoria Line) Split by Direction -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<HugeiconsIcon icon={FerryBoatIcon} size={16} class="text-sky-500" />
				<span>NYC Ferry (Astoria Line) — {ferryDepartures.length} Total Departures ({selectedWindow / 60}h Window)</span>
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Southbound Column -->
			<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-black text-xs border border-sky-500/20">
							FERRY
						</span>
						<h3 class="text-sm font-bold text-text-main">Southbound / Wall St Pier 11</h3>
					</div>
					<span class="text-[11px] font-mono text-text-muted">Dock 25</span>
				</div>

				{#if southboundFerries.length === 0}
					<div class="p-4 text-center text-xs text-text-muted">
						{isLoading ? 'Loading Southbound ferries...' : 'No upcoming Southbound ferries in feed.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Southbound Ferry -->
					{@const nextFerry = southboundFerries[0]}
					<div class="p-4 rounded-xl bg-linear-to-br from-sky-500/10 via-bg-surface to-bg-surface border border-sky-500/30 space-y-2 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 rounded-full bg-sky-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
									NEXT FERRY
								</span>
								{#if nextFerry.vesselStatus === 'STOPPED_AT'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30">
										<HugeiconsIcon icon={AnchorIcon} size={11} />
										<span>Docked</span>
									</span>
								{:else if nextFerry.vesselStatus === 'INCOMING_AT'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] uppercase border border-amber-500/30">
										<HugeiconsIcon icon={Navigation01Icon} size={11} />
										<span>Approaching</span>
									</span>
								{:else if nextFerry.vesselStatus === 'IN_TRANSIT_TO'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-bold text-[10px] uppercase border border-sky-500/30">
										<HugeiconsIcon icon={BoatIcon} size={11} />
										<span>En Route</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
									<span>Roosevelt Island Dock</span>
									{#if nextFerry.vesselName}
										• Vessel: <strong class="text-text-main font-mono">{nextFerry.vesselName}</strong>
									{/if}
									{#if nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0}
										• Speed: <span class="font-mono text-sky-600 dark:text-sky-400 font-bold">{nextFerry.speedKnots} kts</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={11} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[10px] text-text-muted">Scheduled Timetable</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT FERRIES -->
					{#if southboundFerries.length > 1}
						<div class="space-y-1.5 pt-1">
							<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Following Ferries</div>
							<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
								{#each southboundFerries.slice(1) as ferry (ferry.id)}
									<div class="p-2.5 flex items-center justify-between text-xs">
										<div class="flex items-center gap-2">
											<span class="font-medium text-text-main">{ferry.headsign}</span>
											{#if ferry.vesselName}
												<span class="text-[10px] font-mono text-text-muted">({ferry.vesselName})</span>
											{/if}
										</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if ferry.isRealtime}
												<span title="Live GTFS-RT">
													<HugeiconsIcon icon={FlashIcon} size={11} class="text-emerald-500" />
												</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Northbound Column -->
			<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-black text-xs border border-sky-500/20">
							FERRY
						</span>
						<h3 class="text-sm font-bold text-text-main">Northbound / East 90th St</h3>
					</div>
					<span class="text-[11px] font-mono text-text-muted">Dock 25</span>
				</div>

				{#if northboundFerries.length === 0}
					<div class="p-4 text-center text-xs text-text-muted">
						{isLoading ? 'Loading Northbound ferries...' : 'No upcoming Northbound ferries in feed.'}
					</div>
				{:else}
					<!-- HERO CARD: Next Northbound Ferry -->
					{@const nextFerry = northboundFerries[0]}
					<div class="p-4 rounded-xl bg-linear-to-br from-sky-500/10 via-bg-surface to-bg-surface border border-sky-500/30 space-y-2 relative overflow-hidden shadow-xs">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 rounded-full bg-sky-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
									NEXT FERRY
								</span>
								{#if nextFerry.vesselStatus === 'STOPPED_AT'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30">
										<HugeiconsIcon icon={AnchorIcon} size={11} />
										<span>Docked</span>
									</span>
								{:else if nextFerry.vesselStatus === 'INCOMING_AT'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] uppercase border border-amber-500/30">
										<HugeiconsIcon icon={Navigation01Icon} size={11} />
										<span>Approaching</span>
									</span>
								{:else if nextFerry.vesselStatus === 'IN_TRANSIT_TO'}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-bold text-[10px] uppercase border border-sky-500/30">
										<HugeiconsIcon icon={BoatIcon} size={11} />
										<span>En Route</span>
									</span>
								{/if}
							</div>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
									<span>Roosevelt Island Dock</span>
									{#if nextFerry.vesselName}
										• Vessel: <strong class="text-text-main font-mono">{nextFerry.vesselName}</strong>
									{/if}
									{#if nextFerry.speedKnots !== undefined && nextFerry.speedKnots > 0}
										• Speed: <span class="font-mono text-sky-600 dark:text-sky-400 font-bold">{nextFerry.speedKnots} kts</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<HugeiconsIcon icon={FlashIcon} size={11} class="animate-pulse" />
										<span>Live GTFS-RT</span>
									</span>
								{:else}
									<span class="text-[10px] text-text-muted">Scheduled Timetable</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- SUBSEQUENT FERRIES -->
					{#if northboundFerries.length > 1}
						<div class="space-y-1.5 pt-1">
							<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Following Ferries</div>
							<div class="divide-y divide-border-subtle rounded-xl bg-bg-elevated/40 border border-border-default/60 overflow-hidden">
								{#each northboundFerries.slice(1) as ferry (ferry.id)}
									<div class="p-2.5 flex items-center justify-between text-xs">
										<div class="flex items-center gap-2">
											<span class="font-medium text-text-main">{ferry.headsign}</span>
											{#if ferry.vesselName}
												<span class="text-[10px] font-mono text-text-muted">({ferry.vesselName})</span>
											{/if}
										</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if ferry.isRealtime}
												<span title="Live GTFS-RT">
													<HugeiconsIcon icon={FlashIcon} size={11} class="text-emerald-500" />
												</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Dedicated Section: Citi Bike Visual Dock-Grid Matrix -->
	<div class="space-y-3">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<HugeiconsIcon icon={Bicycle01Icon} size={16} class="text-emerald-500" />
				<span>Citi Bike Docks — Visual Matrix ({stations.length} Active Stations)</span>
			</h2>

			<!-- Legend Bar -->
			<div class="flex flex-wrap items-center gap-3 text-[10px] font-medium text-text-muted bg-bg-surface px-3 py-1.5 rounded-xl border border-border-default shadow-2xs">
				<div class="flex items-center gap-1.5">
					<span class="w-3.5 h-3.5 rounded bg-sky-500 flex items-center justify-center text-white shadow-2xs">
						<HugeiconsIcon icon={FlashIcon} size={9} />
					</span>
					<span>E-Bike ({totalEbikes})</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-3.5 h-3.5 rounded bg-primary flex items-center justify-center text-primary-fg shadow-2xs">
						<HugeiconsIcon icon={Bicycle01Icon} size={9} />
					</span>
					<span>Classic Bike ({totalClassicBikes})</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-3.5 h-3.5 rounded bg-bg-elevated/60 border border-border-default flex items-center justify-center text-text-muted">
						<HugeiconsIcon icon={SquareIcon} size={9} />
					</span>
					<span>Open Dock ({totalOpenDocks})</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
						<HugeiconsIcon icon={Wrench01Icon} size={9} />
					</span>
					<span>Disabled Dock</span>
				</div>
			</div>
		</div>

		{#if stations.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{isLoading ? 'Loading GBFS stations...' : 'No Citi Bike station status available.'}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each stations as station (station.id)}
					{@const slots = generateDockSlots(station)}
					<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3 flex flex-col justify-between">
						<div>
							<div class="flex items-start justify-between gap-2">
								<div>
									<h3 class="font-bold text-sm text-text-main leading-tight">{station.name}</h3>
									<div class="text-[11px] text-text-muted mt-0.5">
										<strong class="text-text-main font-mono">{station.bikesAvailable.total}</strong> bikes / <strong class="text-text-main font-mono">{station.docksAvailable}</strong> open docks
									</div>
								</div>
								<span class="px-2 py-0.5 rounded-md bg-bg-elevated font-mono font-bold text-[10px] shrink-0">
									{Math.round((station.bikesAvailable.total / station.capacity) * 100)}% Full
								</span>
							</div>

							<!-- Visual Dock Slot Grid -->
							<div class="mt-3.5 pt-3 border-t border-border-subtle/80">
								<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
									Dock Slot State Matrix ({slots.length} Slots)
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each slots as slot, i}
										{#if slot === 'ebike'}
											<div
												class="w-4 h-4 rounded bg-sky-500 flex items-center justify-center text-white shadow-2xs"
												title="Slot #{i + 1}: E-Bike Available"
											>
												<HugeiconsIcon icon={FlashIcon} size={10} />
											</div>
										{:else if slot === 'classic'}
											<div
												class="w-4 h-4 rounded bg-primary flex items-center justify-center text-primary-fg shadow-2xs"
												title="Slot #{i + 1}: Classic Bike Available"
											>
												<HugeiconsIcon icon={Bicycle01Icon} size={10} />
											</div>
										{:else if slot === 'disabled'}
											<div
												class="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500"
												title="Slot #{i + 1}: Disabled Hardware Slot"
											>
												<HugeiconsIcon icon={Wrench01Icon} size={9} />
											</div>
										{:else}
											<div
												class="w-4 h-4 rounded bg-bg-elevated/60 border border-border-default/80 flex items-center justify-center text-text-muted/40"
												title="Slot #{i + 1}: Open Dock Slot"
											>
												<HugeiconsIcon icon={SquareIcon} size={8} />
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>

						{#if station.disabledBikes || station.disabledDocks}
							<div class="inline-flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
								<HugeiconsIcon icon={Wrench01Icon} size={11} />
								<span>Maintenance: {station.disabledBikes || 0} bad bikes, {station.disabledDocks || 0} bad docks</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
