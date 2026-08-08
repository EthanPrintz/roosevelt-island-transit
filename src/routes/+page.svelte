<script lang="ts">
import { BicycleIcon, Compass01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import CitiBikeWidget from '$lib/components/CitiBikeWidget.svelte';
import ModeFilter from '$lib/components/ModeFilter.svelte';
import SubwaySwitchNotice from '$lib/components/SubwaySwitchNotice.svelte';
import TransitDepartureCard from '$lib/components/TransitDepartureCard.svelte';
import { TransitAggregator } from '$lib/transit/aggregator/TransitAggregator';
import type {
	BikeStation,
	TransitAlert,
	TransitDeparture,
	TransitMode,
} from '$lib/transit/domain/types';
import { MockCitiBikeProvider } from '$lib/transit/providers/MockCitiBikeProvider';
import { MockFerryProvider } from '$lib/transit/providers/MockFerryProvider';
import { MockQ102Provider } from '$lib/transit/providers/MockQ102Provider';
import { MockRedBusProvider } from '$lib/transit/providers/MockRedBusProvider';
import { MockSubwayProvider } from '$lib/transit/providers/MockSubwayProvider';
import { MockTramProvider } from '$lib/transit/providers/MockTramProvider';

// Register all 6 Roosevelt Island transit channel mock providers
const aggregator = new TransitAggregator();
aggregator.registerProvider(new MockTramProvider());
aggregator.registerProvider(new MockSubwayProvider());
aggregator.registerProvider(new MockRedBusProvider());
aggregator.registerProvider(new MockQ102Provider());
aggregator.registerProvider(new MockFerryProvider());
aggregator.registerProvider(new MockCitiBikeProvider());

// Svelte 5 Runes state
let selectedMode = $state<TransitMode | 'all'>('all');
let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);

$effect(() => {
	loadData(selectedMode);
});

async function loadData(mode: TransitMode | 'all') {
	departures = await aggregator.getAllDepartures(mode);
	alerts = await aggregator.getAllAlerts(mode);
	stations = await aggregator.getBikeStations(mode);
}

let subwaySwitchAlert = $derived(alerts.find((a) => a.id.includes('fm-switch')));
</script>

<svelte:head>
	<title>Roosevelt Island Multi-Modal Transit Tracker</title>
	<meta name="description" content="Live multi-pronged transit tracker for Roosevelt Island: Tram, F/M Subway, Red Bus, Q102 Bus, NYC Ferry, and Citi Bike." />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
	<!-- Hero / Title Section -->
	<div class="space-y-4">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
			<HugeiconsIcon icon={FlashIcon} size={14} />
			<span>Roosevelt Island Public Transit Network</span>
		</div>

		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div>
				<h1 class="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight leading-tight">
					Live Transit Dashboard
				</h1>
				<p class="text-xs sm:text-sm text-text-muted mt-1">
					Consolidated departures for Tramway, F/M Subway, Red Bus, Q102, NYC Ferry, and Citi Bike.
				</p>
			</div>
		</div>
	</div>

	<!-- Mode Filter Tabs -->
	<div class="space-y-3">
		<span class="text-xs font-semibold uppercase tracking-wider text-text-muted block">Filter Transit Mode</span>
		<ModeFilter bind:selectedMode />
	</div>

	<!-- Subway F/M Switch Service Alert Notice -->
	{#if subwaySwitchAlert && (selectedMode === 'all' || selectedMode === 'subway')}
		<SubwaySwitchNotice alert={subwaySwitchAlert} />
	{/if}

	<!-- Next Departures Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
				<HugeiconsIcon icon={Compass01Icon} size={20} class="text-primary" />
				Upcoming Departures
			</h2>
			<span class="text-xs text-text-muted font-mono">{departures.length} departures found</span>
		</div>

		{#if departures.length === 0 && selectedMode !== 'citibike'}
			<div class="p-12 rounded-2xl bg-bg-surface border border-border-default text-center space-y-2">
				<p class="text-sm font-semibold text-text-main">No upcoming departures for selected mode</p>
				<p class="text-xs text-text-muted">Select another transit filter or switch back to All Modes.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each departures as departure (departure.id)}
					<TransitDepartureCard {departure} />
				{/each}
			</div>
		{/if}
	</div>

	<!-- Citi Bike Station Status Section (Shown when selectedMode is 'all' or 'citibike') -->
	{#if (selectedMode === 'all' || selectedMode === 'citibike') && stations.length > 0}
		<div class="space-y-4 pt-4 border-t border-border-subtle">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
					<HugeiconsIcon icon={BicycleIcon} size={20} class="text-primary" />
					Citi Bike Docks & Availability
				</h2>
				<span class="text-xs text-text-muted font-mono">{stations.length} stations active</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each stations as station (station.id)}
					<CitiBikeWidget {station} />
				{/each}
			</div>
		</div>
	{/if}
</div>
