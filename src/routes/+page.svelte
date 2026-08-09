<script lang="ts">
import {
	Alert02Icon,
	AlertCircleIcon,
	AnchorIcon,
	Bicycle01Icon,
	BoatIcon,
	CableCarIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	FerryBoatIcon,
	FlashIcon,
	Navigation01Icon,
	SparklesIcon,
	SquareIcon,
	Train01Icon,
	Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import BikeStationCard from '$lib/components/BikeStationCard.svelte';
import DirectionHeader from '$lib/components/DirectionHeader.svelte';
import HeroDepartureCard from '$lib/components/HeroDepartureCard.svelte';
import ModeSectionHeader from '$lib/components/ModeSectionHeader.svelte';
import SegmentedControl from '$lib/components/SegmentedControl.svelte';
import type { SegmentOption } from '$lib/components/segmented-control.types';
import TimetableList from '$lib/components/TimetableList.svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';
import type {
	BikeStation,
	BusDeparture,
	FerryDeparture,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import { formatRelativeTime } from '$lib/utils/time-format';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);

const windowOptions: SegmentOption<number>[] = [
	{ value: 120, label: '2h' },
	{ value: 240, label: '4h' },
	{ value: 360, label: '6h' },
	{ value: 480, label: '8h' },
];

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
	return formatRelativeTime(isoString);
}

function getFerryBadge(ferry: FerryDeparture) {
	const isStopped =
		ferry.vesselStatus === 'STOPPED_AT' ||
		(ferry.vesselStatus as unknown) === 2 ||
		(ferry.vesselStatus as unknown) === '2' ||
		(ferry.speedKnots !== undefined && ferry.speedKnots <= 1);

	const isIncoming =
		ferry.vesselStatus === 'INCOMING_AT' ||
		(ferry.vesselStatus as unknown) === 1 ||
		(ferry.vesselStatus as unknown) === '1';

	if (isStopped) {
		return {
			label: 'Docked',
			icon: AnchorIcon,
			class: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
		};
	}
	if (isIncoming) {
		return {
			label: 'Approaching',
			icon: Navigation01Icon,
			class: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
		};
	}
	return {
		label: 'En Route',
		icon: BoatIcon,
		class: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
	};
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

function getTramHeadwayStatus(now: Date = new Date()): {
	label: string;
	isPeak: boolean;
	isClosed: boolean;
} {
	const nyString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
	const nyDate = new Date(nyString);
	const dayOfWeek = nyDate.getDay();
	const timeInMins = nyDate.getHours() * 60 + nyDate.getMinutes();

	const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
	const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

	const isClosedOvernight = isFridayOrSaturday
		? timeInMins >= 210 && timeInMins < 360
		: timeInMins >= 120 && timeInMins < 360;

	if (isClosedOvernight) {
		return { label: 'Overnight Closed', isPeak: false, isClosed: true };
	}

	const isRushHour =
		isWeekday &&
		((timeInMins >= 420 && timeInMins < 600) || (timeInMins >= 870 && timeInMins < 1140));

	if (isRushHour) {
		return { label: 'Rush Hour (7.5m Frequency)', isPeak: true, isClosed: false };
	}

	return { label: 'Off-Peak (15m Frequency)', isPeak: false, isClosed: false };
}

let tramStatus = $derived(getTramHeadwayStatus(new Date()));

let subwayDepartures = $derived(departures.filter((d) => d.mode === 'subway'));
let manhattanSubways = $derived(subwayDepartures.filter((d) => d.direction === 'manhattan_bound'));
let queensSubways = $derived(subwayDepartures.filter((d) => d.direction === 'queens_bound'));

let ferryDepartures = $derived(departures.filter((d) => d.mode === 'ferry'));
let southboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'southbound'));
let northboundFerries = $derived(ferryDepartures.filter((d) => d.direction === 'northbound'));

let tramDepartures = $derived(departures.filter((d) => d.mode === 'tram'));
let manhattanTrams = $derived(tramDepartures.filter((d) => d.direction === 'manhattan_bound'));
let islandTrams = $derived(tramDepartures.filter((d) => d.direction === 'queens_bound'));

let q102Departures = $derived(departures.filter((d) => d.mode === 'q102_bus'));
let astoriaQ102 = $derived(q102Departures.filter((d) => d.direction === 'queens_bound'));
let colerQ102 = $derived(q102Departures.filter((d) => d.direction === 'northbound'));

let redBusDepartures = $derived(departures.filter((d) => d.mode === 'red_bus'));
let northboundRedBus = $derived(redBusDepartures.filter((d) => d.direction === 'northbound'));
let southboundRedBus = $derived(redBusDepartures.filter((d) => d.direction === 'southbound'));

let subwayAlerts = $derived(alerts.filter((a) => a.mode === 'subway'));
let tramAlerts = $derived(alerts.filter((a) => a.mode === 'tram'));
let ferryAlerts = $derived(alerts.filter((a) => a.mode === 'ferry'));
let q102Alerts = $derived(alerts.filter((a) => a.mode === 'q102_bus'));
let redBusAlerts = $derived(alerts.filter((a) => a.mode === 'red_bus'));
let citibikeAlerts = $derived(alerts.filter((a) => a.mode === 'citibike'));

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

	<!-- Section: Subway -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Subway"
			icon={Train01Icon}
			iconBgClass="bg-orange-500/10 text-orange-500"
			alerts={subwayAlerts}
		>
			<SegmentedControl
				options={windowOptions}
				value={transitSettings.selectedWindow}
				onSelect={(val) => transitSettings.setWindow(val)}
			/>
		</ModeSectionHeader>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<!-- Manhattan-Bound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Manhattan-Bound"
					subtitle="via 63rd St & 6th Ave"
				/>

				{#if manhattanSubways.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Manhattan trains.'}
					</div>
				{:else}
					<HeroDepartureCard
						departure={manhattanSubways[0]}
						accentColor="orange"
						statusText={manhattanSubways[0].isRealtime ? 'Live' : 'Scheduled'}
						statusIcon={manhattanSubways[0].isRealtime ? FlashIcon : undefined}
						lineBadgeText={manhattanSubways[0].routeId}
						subDetails={manhattanSubways[0].originStartTime ? `Dispatched: ${manhattanSubways[0].originStartTime}` : undefined}
					/>

					{#if manhattanSubways.length > 1}
						<TimetableList
							departures={manhattanSubways.slice(1)}
							accentColor="orange"
						/>
					{/if}
				{/if}
			</div>

			<!-- Queens-Bound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Queens-Bound"
					subtitle="via Jamaica & Forest Hills"
				/>

				{#if queensSubways.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Queens trains.'}
					</div>
				{:else}
					<HeroDepartureCard
						departure={queensSubways[0]}
						accentColor="orange"
						statusText={queensSubways[0].isRealtime ? 'Live' : 'Scheduled'}
						statusIcon={queensSubways[0].isRealtime ? FlashIcon : undefined}
						lineBadgeText={queensSubways[0].routeId}
						subDetails={queensSubways[0].originStartTime ? `Dispatched: ${queensSubways[0].originStartTime}` : undefined}
					/>

					{#if queensSubways.length > 1}
						<TimetableList
							departures={queensSubways.slice(1)}
							accentColor="orange"
						/>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Tramway -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Tramway"
			icon={CableCarIcon}
			iconBgClass="bg-rose-500/10 text-rose-500"
			alerts={tramAlerts}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<!-- Direction: Manhattan-Bound (59th St) -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Manhattan-Bound"
					subtitle="59th St & 2nd Ave"
				/>

				{#if manhattanTrams.length === 0}
					<p class="text-xs text-text-muted italic py-3 text-center">No upcoming tram departures scheduled.</p>
				{:else}
					<HeroDepartureCard
						departure={manhattanTrams[0]}
						accentColor="rose"
						statusText={(manhattanTrams[0] as any).isBoarding ? 'Boarding' : 'In Transit'}
						statusIcon={(manhattanTrams[0] as any).isBoarding ? CheckmarkCircle01Icon : Navigation01Icon}
						subDetails={(manhattanTrams[0] as any).cabin || 'Tram Cabin'}
					/>

					{#if manhattanTrams.length > 1}
						<TimetableList
							departures={manhattanTrams.slice(1, 5)}
							accentColor="rose"
							badgeTextFn={(dep) => (dep as any).cabin || 'Tram'}
						/>
					{/if}
				{/if}
			</div>

			<!-- Direction: Roosevelt Island Landing -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Island-Bound"
					subtitle="Roosevelt Island Station"
				/>

				{#if islandTrams.length === 0}
					<p class="text-xs text-text-muted italic py-3 text-center">No upcoming tram departures scheduled.</p>
				{:else}
					<HeroDepartureCard
						departure={islandTrams[0]}
						accentColor="rose"
						statusText={(islandTrams[0] as any).isBoarding ? 'Boarding' : 'In Transit'}
						statusIcon={(islandTrams[0] as any).isBoarding ? CheckmarkCircle01Icon : Navigation01Icon}
						subDetails={(islandTrams[0] as any).cabin || 'Tram Cabin'}
					/>

					{#if islandTrams.length > 1}
						<TimetableList
							departures={islandTrams.slice(1, 5)}
							accentColor="rose"
							badgeTextFn={(dep) => (dep as any).cabin || 'Tram'}
						/>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Ferry -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Ferry"
			icon={FerryBoatIcon}
			iconBgClass="bg-cyan-500/10 text-cyan-500"
			alerts={ferryAlerts}
		/>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<!-- Southbound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Southbound"
					subtitle="Wall St / Pier 11"
				/>

				{#if southboundFerries.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Southbound ferries.'}
					</div>
				{:else}
					{@const nextFerry = southboundFerries[0]}
					{@const ferryBadge = getFerryBadge(nextFerry)}

					<HeroDepartureCard
						departure={nextFerry}
						accentColor="cyan"
						statusText={ferryBadge.label}
						statusIcon={ferryBadge.icon}
						statusClass={ferryBadge.class}
						subDetails={nextFerry.vesselName ? (nextFerry.speedKnots ? `${nextFerry.vesselName} • ${nextFerry.speedKnots} kts` : nextFerry.vesselName) : 'Astoria Line'}
					/>

					{#if southboundFerries.length > 1}
						<TimetableList
							departures={southboundFerries.slice(1)}
							accentColor="cyan"
							badgeTextFn={(dep) => (dep as any).vesselName}
						/>
					{/if}
				{/if}
			</div>

			<!-- Northbound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Northbound"
					subtitle="East 90th St / UES"
				/>

				{#if northboundFerries.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Northbound ferries.'}
					</div>
				{:else}
					{@const nextFerry = northboundFerries[0]}
					{@const ferryBadge = getFerryBadge(nextFerry)}

					<HeroDepartureCard
						departure={nextFerry}
						accentColor="cyan"
						statusText={ferryBadge.label}
						statusIcon={ferryBadge.icon}
						statusClass={ferryBadge.class}
						subDetails={nextFerry.vesselName ? (nextFerry.speedKnots ? `${nextFerry.vesselName} • ${nextFerry.speedKnots} kts` : nextFerry.vesselName) : 'Astoria Line'}
					/>

					{#if northboundFerries.length > 1}
						<TimetableList
							departures={northboundFerries.slice(1)}
							accentColor="cyan"
							badgeTextFn={(dep) => (dep as any).vesselName}
						/>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: City Bus -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="City Bus"
			icon={Train01Icon}
			iconBgClass="bg-blue-500/10 text-blue-500"
			alerts={q102Alerts}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Astoria-Bound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Astoria-Bound"
					subtitle="27 Ave via RI Bridge"
				/>

				{#if astoriaQ102.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Astoria-bound Q102 buses.'}
					</div>
				{:else}
					{@const nextBus = astoriaQ102[0] as BusDeparture}

					<HeroDepartureCard
						departure={nextBus}
						accentColor="blue"
						statusText={nextBus.isRealtime ? 'En Route' : 'Scheduled'}
						statusIcon={nextBus.isRealtime ? FlashIcon : Clock01Icon}
						subDetails={nextBus.nextStopName ? (nextBus.vehicleId ? `Bus #${nextBus.vehicleId} • ${nextBus.nextStopName}` : nextBus.nextStopName) : (nextBus.vehicleId ? `Bus #${nextBus.vehicleId}` : 'Main St Stop')}
					/>

					{#if astoriaQ102.length > 1}
						<TimetableList
							departures={astoriaQ102.slice(1)}
							accentColor="blue"
							badgeTextFn={(dep) => (dep as BusDeparture).nextStopName || ((dep as BusDeparture).vehicleId ? `Bus #${(dep as BusDeparture).vehicleId}` : undefined)}
						/>
					{/if}
				{/if}
			</div>

			<!-- Coler Hospital Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Coler Hospital-Bound"
					subtitle="Southtown & North Loop"
				/>

				{#if colerQ102.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Coler-bound Q102 buses.'}
					</div>
				{:else}
					{@const nextBus = colerQ102[0] as BusDeparture}

					<HeroDepartureCard
						departure={nextBus}
						accentColor="blue"
						statusText={nextBus.isRealtime ? 'En Route' : 'Scheduled'}
						statusIcon={nextBus.isRealtime ? FlashIcon : Clock01Icon}
						subDetails={nextBus.nextStopName ? (nextBus.vehicleId ? `Bus #${nextBus.vehicleId} • ${nextBus.nextStopName}` : nextBus.nextStopName) : (nextBus.vehicleId ? `Bus #${nextBus.vehicleId}` : 'Main St Stop')}
					/>

					{#if colerQ102.length > 1}
						<TimetableList
							departures={colerQ102.slice(1)}
							accentColor="blue"
							badgeTextFn={(dep) => (dep as BusDeparture).nextStopName || ((dep as BusDeparture).vehicleId ? `Bus #${(dep as BusDeparture).vehicleId}` : undefined)}
						/>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Red Bus -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Red Bus"
			icon={Train01Icon}
			iconBgClass="bg-rose-600/10 text-rose-600 dark:text-rose-400"
			alerts={redBusAlerts}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Northbound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Northbound"
					subtitle="Octagon via Main St"
				/>

				{#if northboundRedBus.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Northbound Red Buses.'}
					</div>
				{:else}
					{@const nextBus = northboundRedBus[0] as BusDeparture}

					<HeroDepartureCard
						departure={nextBus}
						accentColor="rose"
						statusText={nextBus.isRealtime ? 'En Route' : 'Scheduled'}
						statusIcon={nextBus.isRealtime ? FlashIcon : Clock01Icon}
						subDetails={nextBus.stopName || 'Octagon Shuttle'}
					/>

					{#if northboundRedBus.length > 1}
						<TimetableList
							departures={northboundRedBus.slice(1)}
							accentColor="rose"
						/>
					{/if}
				{/if}
			</div>

			<!-- Southbound Column -->
			<div class="panel-card space-y-3">
				<DirectionHeader
					title="Southbound"
					subtitle="Southtown & Cornell Tech"
				/>

				{#if southboundRedBus.length === 0}
					<div class="p-3 text-center text-xs text-text-muted">
						{transitSettings.isLoading ? 'Loading...' : 'No upcoming Southbound Red Buses.'}
					</div>
				{:else}
					{@const nextBus = southboundRedBus[0] as BusDeparture}

					<HeroDepartureCard
						departure={nextBus}
						accentColor="rose"
						statusText={nextBus.isRealtime ? 'En Route' : 'Scheduled'}
						statusIcon={nextBus.isRealtime ? FlashIcon : Clock01Icon}
						subDetails={nextBus.stopName || 'Southtown Express'}
					/>

					{#if southboundRedBus.length > 1}
						<TimetableList
							departures={southboundRedBus.slice(1)}
							accentColor="rose"
						/>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- Section: Citi Bike -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Citi Bike"
			icon={Bicycle01Icon}
			iconBgClass="bg-blue-600/10 text-blue-600 dark:text-blue-400"
			alerts={citibikeAlerts}
		>
			<!-- Legend Bar -->
			<div class="flex flex-wrap items-center gap-3 text-[10px] font-medium text-text-muted bg-bg-surface px-3 py-1 rounded-xl border border-border-default shadow-2xs">
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
						<HugeiconsIcon icon={FlashIcon} size={8} />
					</span>
					<span>E-Bike ({totalEbikes})</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-text-main text-bg-base flex items-center justify-center shadow-2xs">
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
		</ModeSectionHeader>

		{#if stations.length === 0}
			<div class="p-6 rounded-xl bg-bg-surface border border-border-default text-center text-xs text-text-muted">
				{transitSettings.isLoading ? 'Loading...' : 'No Citi Bike status available.'}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				{#each stations as station (station.id)}
					<BikeStationCard {station} />
				{/each}
			</div>
		{/if}
	</div>
</div>
