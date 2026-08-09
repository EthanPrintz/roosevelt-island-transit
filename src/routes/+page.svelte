<script lang="ts">
import type { BikeStation, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let isCached = $state<boolean>(false);
let fetchedAt = $state<string>('');
let isLoading = $state<boolean>(true);
let autoRefreshSeconds = $state<number>(15);
let selectedWindow = $state<number>(240); // Default 4 hours lookahead

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

let subwayDepartures = $derived(departures.filter((d) => d.mode === 'subway'));
let manhattanSubways = $derived(subwayDepartures.filter((d) => d.direction === 'manhattan_bound'));
let queensSubways = $derived(subwayDepartures.filter((d) => d.direction === 'queens_bound'));

let ferryDepartures = $derived(departures.filter((d) => d.mode === 'ferry'));
let southboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'southbound'));
let northboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'northbound'));
</script>

<svelte:head>
	<title>Roosevelt Island Live Transit Core</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
					AUTO-REFRESHING ({autoRefreshSeconds}s)
				</span>
			</div>
			<h1 class="text-2xl font-bold text-text-main mt-1">Roosevelt Island Live Transit Feed</h1>
			<p class="text-xs text-text-muted mt-0.5">Real-time GTFS-RT subway, NYC Ferry & GBFS bikeshare streams.</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<!-- Lookahead Window Selector -->
			<div class="flex items-center rounded-xl bg-bg-surface border border-border-default p-1 text-xs">
				<span class="px-2 text-[10px] font-bold text-text-muted uppercase">Window:</span>
				{#each [120, 240, 360, 480] as win}
					<button
						onclick={() => changeWindow(win)}
						class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {selectedWindow === win
							? 'bg-primary text-white shadow-xs'
							: 'text-text-muted hover:text-text-main'}"
					>
						{win / 60}h
					</button>
				{/each}
			</div>

			<button
				onclick={loadLiveData}
				disabled={isLoading}
				class="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs cursor-pointer"
			>
				{isLoading ? 'Refreshing...' : 'Refresh Now'}
			</button>
		</div>
	</div>

	{#if fetchedAt}
		<div class="text-right -mt-4 text-[10px] text-text-muted font-mono">
			Fetched: {new Date(fetchedAt).toLocaleTimeString()} {isCached ? '(Cached 15s)' : '(Live API)'} • {selectedWindow / 60}-Hour Lookahead Window
		</div>
	{/if}

	<!-- Active System Alerts -->
	{#if alerts.length > 0}
		<div class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">Live Service Alerts ({alerts.length})</h2>
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

	<!-- Dedicated Section: 🚇 MTA Subway (F/M Trains) Split by Direction -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<span>🚇</span>
				MTA Subway (F/M Trains) — {subwayDepartures.length} Total Departures ({selectedWindow / 60}h Window)
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Manhattan-Bound Column -->
			<div class="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-black text-xs border border-orange-500/20">
							F / M
						</span>
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
							<span class="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
								NEXT TRAIN
							</span>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextTrain.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5">Roosevelt Island Station</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
										Live GTFS-RT
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
										<div class="font-medium text-text-main">{train.headsign}</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if train.isRealtime}
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live GTFS-RT"></span>
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
						<span class="px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-black text-xs border border-orange-500/20">
							F / M
						</span>
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
							<span class="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
								NEXT TRAIN
							</span>
							<span class="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
								{getRelativeTimeLabel(nextTrain.predictedTime || nextTrain.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextTrain.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5">Roosevelt Island Station</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextTrain.predictedTime || nextTrain.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextTrain.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
										Live GTFS-RT
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
										<div class="font-medium text-text-main">{train.headsign}</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(train.predictedTime || train.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(train.predictedTime || train.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if train.isRealtime}
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live GTFS-RT"></span>
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

	<!-- Dedicated Section: ⛴️ NYC Ferry (Astoria Line) Split by Direction -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<span>⛴️</span>
				NYC Ferry (Astoria Line) — {ferryDepartures.length} Total Departures ({selectedWindow / 60}h Window)
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
							<span class="px-2 py-0.5 rounded-full bg-sky-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
								NEXT FERRY
							</span>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5">
									Roosevelt Island Dock
									{#if nextFerry.vesselName}
										• Vessel: <strong class="text-text-main font-mono">{nextFerry.vesselName}</strong>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
										Live GTFS-RT
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
										<div class="font-medium text-text-main">{ferry.headsign}</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if ferry.isRealtime}
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live GTFS-RT"></span>
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
							<span class="px-2 py-0.5 rounded-full bg-sky-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
								NEXT FERRY
							</span>
							<span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
								{getRelativeTimeLabel(nextFerry.predictedTime || nextFerry.scheduledTime)}
							</span>
						</div>
						<div class="flex items-baseline justify-between pt-1">
							<div>
								<div class="text-base font-extrabold text-text-main leading-tight">{nextFerry.headsign}</div>
								<div class="text-[11px] text-text-muted mt-0.5">
									Roosevelt Island Dock
									{#if nextFerry.vesselName}
										• Vessel: <strong class="text-text-main font-mono">{nextFerry.vesselName}</strong>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-mono text-xl font-black text-text-main">
									{new Date(nextFerry.predictedTime || nextFerry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								{#if nextFerry.isRealtime}
									<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
										Live GTFS-RT
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
										<div class="font-medium text-text-main">{ferry.headsign}</div>
										<div class="flex items-center gap-3 font-mono">
											<span class="text-text-muted text-[11px]">{getRelativeTimeLabel(ferry.predictedTime || ferry.scheduledTime)}</span>
											<span class="font-bold text-text-main">
												{new Date(ferry.predictedTime || ferry.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
											{#if ferry.isRealtime}
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live GTFS-RT"></span>
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

	<!-- Dedicated Section: 🚲 Citi Bike Docks -->
	<div class="space-y-2">
		<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
			<span>🚲</span>
			Citi Bike Docks — {stations.length} Active Stations
		</h2>

		{#if stations.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{isLoading ? 'Loading GBFS stations...' : 'No Citi Bike station status available.'}
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each stations as station (station.id)}
					<div class="p-3.5 rounded-xl bg-bg-surface border border-border-default text-xs space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-bold text-text-main">{station.name}</span>
							<span class="px-2 py-0.5 rounded-md bg-bg-elevated font-mono font-bold text-[10px]">
								{Math.round((station.bikesAvailable.total / station.capacity) * 100)}% Full
							</span>
						</div>
						<div class="flex items-center justify-between text-text-muted text-[11px]">
							<span>Bikes: <strong class="text-primary font-mono">{station.bikesAvailable.total}</strong> ({station.bikesAvailable.ebike} e-bikes)</span>
							<span>Docks: <strong class="text-text-main font-mono">{station.docksAvailable}</strong></span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
