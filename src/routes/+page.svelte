<script lang="ts">
import type { BikeStation, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let isCached = $state<boolean>(false);
let fetchedAt = $state<string>('');
let isLoading = $state<boolean>(true);
let liveOnly = $state<boolean>(false);

$effect(() => {
	loadLiveData();
});

async function loadLiveData() {
	try {
		isLoading = true;
		const res = await fetch('/api/transit');
		if (res.ok) {
			const json = await res.json();
			departures = json.departures || [];
			alerts = json.alerts || [];
			stations = json.stations || [];
			isCached = json.isCached || false;
			fetchedAt = json.fetchedAt || '';
		}
	} catch (_err) {
		// Catch network error
	} finally {
		isLoading = false;
	}
}

let subwayDepartures = $derived(
	departures.filter((d) => d.mode === 'subway').filter((d) => !liveOnly || d.isRealtime),
);

let ferryDepartures = $derived(
	departures.filter((d) => d.mode === 'ferry').filter((d) => !liveOnly || d.isRealtime),
);
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
					LIVE STREAMS
				</span>
			</div>
			<h1 class="text-2xl font-bold text-text-main mt-1">Roosevelt Island Live Transit Feed</h1>
			<p class="text-xs text-text-muted mt-0.5">Real-time GTFS-RT subway, ferry & GBFS bikeshare streams.</p>
		</div>

		<div class="flex items-center gap-3">
			<!-- Filter Toggle: Live Tracked Only vs Scheduled -->
			<button
				onclick={() => (liveOnly = !liveOnly)}
				class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer {liveOnly
					? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
					: 'bg-bg-surface text-text-muted border-border-default hover:border-border-hover'}"
			>
				{liveOnly ? '✓ Live Vessels Only' : 'Show Timetables + Live'}
			</button>

			<button
				onclick={loadLiveData}
				disabled={isLoading}
				class="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs cursor-pointer"
			>
				{isLoading ? 'Refreshing...' : 'Refresh'}
			</button>
		</div>
	</div>

	{#if fetchedAt}
		<div class="text-right -mt-4 text-[10px] text-text-muted font-mono">
			Fetched: {new Date(fetchedAt).toLocaleTimeString()} {isCached ? '(Cached 15s)' : '(Live API)'}
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

	<!-- Dedicated Section: 🚇 MTA Subway (F/M Trains) -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<span>🚇</span>
				MTA Subway (F/M Trains) — {subwayDepartures.length} Departures
			</h2>
		</div>

		{#if subwayDepartures.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{isLoading ? 'Loading live train feeds...' : 'No active train departures returned from MTA GTFS-RT feed.'}
			</div>
		{:else}
			<div class="divide-y divide-border-subtle rounded-xl bg-bg-surface border border-border-default overflow-hidden">
				{#each subwayDepartures as departure (departure.id)}
					<div class="p-3.5 flex items-center justify-between text-xs gap-3">
						<div class="flex items-center gap-2.5">
							<span class="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-extrabold text-[11px] uppercase border border-orange-500/20">
								{departure.routeId}
							</span>
							<div>
								<div class="font-bold text-text-main">{departure.headsign}</div>
								<div class="text-[11px] text-text-muted">
									{departure.stopName}
									{#if departure.mode === 'subway'}
										({departure.track})
									{/if}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-sm font-extrabold text-text-main">
								{new Date(departure.predictedTime || departure.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>
							{#if departure.status === 'rerouted'}
								<span class="text-[10px] font-bold text-amber-500">Rerouted</span>
							{:else if departure.isRealtime}
								<span class="text-[10px] font-bold text-emerald-500">Live GPS</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Dedicated Section: ⛴️ NYC Ferry (Astoria Line) -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
				<span>⛴️</span>
				NYC Ferry (Astoria Line) — {ferryDepartures.length} Departures
			</h2>
		</div>

		{#if ferryDepartures.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{isLoading ? 'Loading NYC Ferry feeds...' : 'No ferry departures matching current filter.'}
			</div>
		{:else}
			<div class="divide-y divide-border-subtle rounded-xl bg-bg-surface border border-border-default overflow-hidden">
				{#each ferryDepartures as departure (departure.id)}
					<div class="p-3.5 flex items-center justify-between text-xs gap-3">
						<div class="flex items-center gap-2.5">
							<span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-extrabold text-[11px] uppercase border border-sky-500/20">
								FERRY
							</span>
							<div>
								<div class="font-bold text-text-main">{departure.headsign}</div>
								<div class="text-[11px] text-text-muted">
									{departure.stopName}
									{#if departure.mode === 'ferry' && departure.vesselName}
										• Vessel: <strong class="text-text-main font-mono">{departure.vesselName}</strong>
									{/if}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-sm font-extrabold text-text-main">
								{new Date(departure.predictedTime || departure.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>
							{#if departure.isRealtime}
								<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
									<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
									Live Vessel
								</span>
							{:else}
								<span class="text-[10px] text-text-muted">Scheduled Timetable</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
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
