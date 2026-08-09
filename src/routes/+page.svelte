<script lang="ts">
import {
	CableCarIcon,
	CheckmarkCircle01Icon,
	FerryBoatIcon,
	FlashIcon,
	Navigation01Icon,
	Train01Icon,
} from '@hugeicons/core-free-icons';
import BusCorridorSection from '$lib/components/BusCorridorSection.svelte';
import CitiBikeSection from '$lib/components/CitiBikeSection.svelte';
import ModeSectionHeader from '$lib/components/ModeSectionHeader.svelte';
import SegmentedControl from '$lib/components/SegmentedControl.svelte';
import type { SegmentOption } from '$lib/components/segmented-control.types';
import TransitColumn from '$lib/components/TransitColumn.svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';
import type {
	BikeStation,
	FerryDeparture,
	LiveVehiclePosition,
	SubwayDeparture,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';

let departures = $state<TransitDeparture[]>([]);
let alerts = $state<TransitAlert[]>([]);
let stations = $state<BikeStation[]>([]);
let vehicles = $state<LiveVehiclePosition[]>([]);

const windowOptions: SegmentOption<number>[] = [
	{ value: 120, label: '2h' },
	{ value: 240, label: '4h' },
	{ value: 360, label: '6h' },
	{ value: 480, label: '8h' },
];

$effect(() => {
	const _win = transitSettings.selectedWindow;
	const _trig = transitSettings.refreshTrigger;
	loadLiveData();
});

$effect(() => {
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
			vehicles = json.vehicles || [];
			transitSettings.fetchedAt = json.fetchedAt || '';
		}
	} catch (_err) {
		// Catch transient network error
	} finally {
		transitSettings.isLoading = false;
	}
}

function getFerryBadge(ferry: FerryDeparture) {
	const isStopped =
		ferry.vesselStatus === 'STOPPED_AT' ||
		(ferry.vesselStatus as unknown) === 2 ||
		(ferry.vesselStatus as unknown) === '2' ||
		(ferry.speedKnots !== undefined && ferry.speedKnots <= 1);

	const isApproaching =
		ferry.vesselStatus === 'INCOMING_AT' ||
		(ferry.vesselStatus as unknown) === 1 ||
		(ferry.vesselStatus as unknown) === '1';

	if (isStopped) {
		return { label: 'Docked', icon: undefined, class: undefined };
	}
	if (isApproaching) {
		return { label: 'Approaching', icon: Navigation01Icon, class: undefined };
	}
	return { label: 'En Route', icon: undefined, class: undefined };
}

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

let q102Vehicles = $derived(vehicles.filter((v) => v.mode === 'q102_bus'));
let redBusVehicles = $derived(vehicles.filter((v) => v.mode === 'red_bus'));

let subwayAlerts = $derived(alerts.filter((a) => a.mode === 'subway'));
let tramAlerts = $derived(alerts.filter((a) => a.mode === 'tram'));
let ferryAlerts = $derived(alerts.filter((a) => a.mode === 'ferry'));
let q102Alerts = $derived(alerts.filter((a) => a.mode === 'q102_bus'));
let redBusAlerts = $derived(alerts.filter((a) => a.mode === 'red_bus'));
let citibikeAlerts = $derived(alerts.filter((a) => a.mode === 'citibike'));
</script>

<svelte:head>
	<title>Roosevelt Island Transit</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-6 space-y-6">

	<!-- Section 1: Subway -->
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
			<TransitColumn
				title="Manhattan-Bound"
				subtitle="via 63rd St & 6th Ave"
				departures={manhattanSubways}
				accentColor="orange"
				emptyMessage="No upcoming Manhattan-bound Subway trains."
				statusTextFn={(dep) => (dep.isRealtime ? 'Live' : 'Scheduled')}
				statusIconFn={(dep) => (dep.isRealtime ? FlashIcon : undefined)}
				lineBadgeTextFn={(dep) => (dep as SubwayDeparture).routeId}
				subDetailsFn={(dep) =>
					(dep as SubwayDeparture).originStartTime
						? `Dispatched: ${(dep as SubwayDeparture).originStartTime}`
						: undefined}
			/>

			<TransitColumn
				title="Queens-Bound"
				subtitle="via Jamaica & Forest Hills"
				departures={queensSubways}
				accentColor="orange"
				emptyMessage="No upcoming Queens-bound Subway trains."
				statusTextFn={(dep) => (dep.isRealtime ? 'Live' : 'Scheduled')}
				statusIconFn={(dep) => (dep.isRealtime ? FlashIcon : undefined)}
				lineBadgeTextFn={(dep) => (dep as SubwayDeparture).routeId}
				subDetailsFn={(dep) =>
					(dep as SubwayDeparture).originStartTime
						? `Dispatched: ${(dep as SubwayDeparture).originStartTime}`
						: undefined}
			/>
		</div>
	</div>

	<!-- Section 2: Tramway -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Tramway"
			icon={CableCarIcon}
			iconBgClass="bg-rose-500/10 text-rose-500"
			alerts={tramAlerts}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<TransitColumn
				title="Manhattan-Bound"
				subtitle="59th St & 2nd Ave"
				departures={manhattanTrams}
				accentColor="rose"
				emptyMessage="No upcoming Manhattan-bound Tram departures."
				statusTextFn={(dep) => ((dep as any).isBoarding ? 'Boarding' : 'In Transit')}
				statusIconFn={(dep) =>
					(dep as any).isBoarding ? CheckmarkCircle01Icon : Navigation01Icon}
				subDetailsFn={(dep) => {
					const c = (dep as any).cabin;
					if (!c) return 'Tram Cabin';
					return c.toLowerCase().includes('north') ? 'North Cabin' : 'South Cabin';
				}}
				badgeTextFn={(dep) => (dep as any).cabin || 'NORTH'}
				maxTimetableItems={4}
			/>

			<TransitColumn
				title="Island-Bound"
				subtitle="Roosevelt Island Station"
				departures={islandTrams}
				accentColor="rose"
				emptyMessage="No upcoming Island-bound Tram departures."
				statusTextFn={(dep) => ((dep as any).isBoarding ? 'Boarding' : 'In Transit')}
				statusIconFn={(dep) =>
					(dep as any).isBoarding ? CheckmarkCircle01Icon : Navigation01Icon}
				subDetailsFn={(dep) => {
					const c = (dep as any).cabin;
					if (!c) return 'Tram Cabin';
					return c.toLowerCase().includes('north') ? 'North Cabin' : 'South Cabin';
				}}
				badgeTextFn={(dep) => (dep as any).cabin || 'NORTH'}
				maxTimetableItems={4}
			/>
		</div>
	</div>

	<!-- Section 3: Ferry -->
	<div class="space-y-2.5">
		<ModeSectionHeader
			title="Ferry"
			icon={FerryBoatIcon}
			iconBgClass="bg-cyan-500/10 text-cyan-500"
			alerts={ferryAlerts}
		/>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<TransitColumn
				title="Southbound"
				subtitle="Wall St / Pier 11"
				departures={southboundFerries}
				accentColor="cyan"
				emptyMessage="No upcoming Southbound Ferries."
				statusTextFn={(dep) => getFerryBadge(dep as FerryDeparture).label}
				statusIconFn={(dep) => getFerryBadge(dep as FerryDeparture).icon}
				statusClassFn={(dep) => getFerryBadge(dep as FerryDeparture).class}
				subDetailsFn={(dep) => {
					const f = dep as FerryDeparture;
					return f.vesselName
						? f.speedKnots
							? `${f.vesselName} • ${f.speedKnots} kts`
							: f.vesselName
						: 'Astoria Line';
				}}
				badgeTextFn={() => 'ASTORIA'}
			/>

			<TransitColumn
				title="Northbound"
				subtitle="East 90th St / UES"
				departures={northboundFerries}
				accentColor="cyan"
				emptyMessage="No upcoming Northbound Ferries."
				statusTextFn={(dep) => getFerryBadge(dep as FerryDeparture).label}
				statusIconFn={(dep) => getFerryBadge(dep as FerryDeparture).icon}
				statusClassFn={(dep) => getFerryBadge(dep as FerryDeparture).class}
				subDetailsFn={(dep) => {
					const f = dep as FerryDeparture;
					return f.vesselName
						? f.speedKnots
							? `${f.vesselName} • ${f.speedKnots} kts`
							: f.vesselName
						: 'Astoria Line';
				}}
				badgeTextFn={() => 'ASTORIA'}
			/>
		</div>
	</div>

	<!-- Section 4: City Bus -->
	<BusCorridorSection
		title="City Bus"
		icon={Train01Icon}
		iconBgClass="bg-blue-500/10 text-blue-500"
		accentColor="blue"
		showRadar={false}
		northboundDepartures={astoriaQ102}
		southboundDepartures={colerQ102}
		vehicles={q102Vehicles}
		alerts={q102Alerts}
		northboundTitle="Astoria-Bound"
		northboundSubtitle="27 Ave via RI Bridge"
		southboundTitle="Coler Hospital-Bound"
		southboundSubtitle="Southtown & North Loop"
		emptyMessageNorth="No upcoming Astoria-bound City Buses (Q102)."
		emptyMessageSouth="No upcoming Coler-bound City Buses (Q102)."
	/>

	<!-- Section 5: Red Bus -->
	<BusCorridorSection
		title="Red Bus"
		icon={Train01Icon}
		iconBgClass="bg-rose-600/10 text-rose-600 dark:text-rose-400"
		accentColor="rose"
		northboundDepartures={northboundRedBus}
		southboundDepartures={southboundRedBus}
		vehicles={redBusVehicles}
		alerts={redBusAlerts}
		northboundTitle="Northbound"
		northboundSubtitle="Octagon via Main St"
		southboundTitle="Southbound"
		southboundSubtitle="Southtown & Cornell Tech"
		emptyMessageNorth="No live Red Bus tracking data available."
		emptyMessageSouth="No live Red Bus tracking data available."
	/>

	<!-- Section 6: Citi Bike -->
	<CitiBikeSection {stations} alerts={citibikeAlerts} />
</div>
