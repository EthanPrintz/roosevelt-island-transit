<script lang="ts">
import type { BikeStation, TransitAlert, TransitDeparture } from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let isCached = $state<boolean>(false);
let fetchedAt = $state<string>('');
let isLoading = $state<boolean>(true);

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
		// Fallback handle
	} finally {
		isLoading = false;
	}
}
</script>

<svelte:head>
	<title>Roosevelt Island Public Transit Tracker</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-text-main">Roosevelt Island Transit Core</h1>
			<p class="text-xs text-text-muted mt-1">Live data ingestion stream & GTFS-RT / GBFS API integration.</p>
		</div>

		<div class="text-right">
			<button
				onclick={loadLiveData}
				disabled={isLoading}
				class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
			>
				{isLoading ? 'Fetching...' : 'Refresh Feed'}
			</button>
			{#if fetchedAt}
				<span class="block text-[10px] text-text-muted mt-1 font-mono">
					Updated: {new Date(fetchedAt).toLocaleTimeString()} {isCached ? '(Cached 15s)' : '(Live)'}
				</span>
			{/if}
		</div>
	</div>

	<!-- System Alerts -->
	{#if alerts.length > 0}
		<div class="space-y-2">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Alerts ({alerts.length})</h2>
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

	<!-- Departures Stream -->
	<div class="space-y-2">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Live Departures Stream ({departures.length})</h2>
		<div class="divide-y divide-border-subtle rounded-xl bg-bg-surface border border-border-default overflow-hidden">
			{#each departures as departure (departure.id)}
				<div class="p-3.5 flex items-center justify-between text-xs gap-3">
					<div class="flex items-center gap-2.5">
						<span class="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono font-bold text-[10px] uppercase">
							{departure.routeId}
						</span>
						<div>
							<div class="font-semibold text-text-main">{departure.headsign}</div>
							<div class="text-[11px] text-text-muted">{departure.stopName}</div>
						</div>
					</div>
					<div class="font-mono text-xs font-bold text-text-main">
						{new Date(departure.predictedTime || departure.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Bike Station Status -->
	<div class="space-y-2">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Citi Bike Docks ({stations.length})</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			{#each stations as station (station.id)}
				<div class="p-3 rounded-xl bg-bg-surface border border-border-default text-xs space-y-1">
					<div class="font-bold text-text-main">{station.name}</div>
					<div class="text-text-muted text-[11px]">
						Bikes: <span class="font-mono text-primary font-bold">{station.bikesAvailable.total}</span> ({station.bikesAvailable.ebike} e-bikes) | Docks: <span class="font-mono text-text-main font-bold">{station.docksAvailable}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
