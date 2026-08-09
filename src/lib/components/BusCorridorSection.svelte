<script lang="ts">
import type {
	BusDeparture,
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import ModeSectionHeader from './ModeSectionHeader.svelte';
import StopSelectorPills, { type IslandStopNode } from './StopSelectorPills.svelte';
import TransitColumn from './TransitColumn.svelte';
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
	northboundTitle,
	northboundSubtitle,
	southboundTitle,
	southboundSubtitle,
	emptyMessageNorth,
	emptyMessageSouth,
}: Props = $props();

let selectedStop = $state<IslandStopNode>('subway_plaza');

let activeNorthSubtitle = $derived(
	selectedStop === 'north_island'
		? `${northboundSubtitle} • North Stop`
		: selectedStop === 'south_island'
			? `${northboundSubtitle} • South Stop`
			: northboundSubtitle,
);

let activeSouthSubtitle = $derived(
	selectedStop === 'north_island'
		? `${southboundSubtitle} • Coler Terminal`
		: selectedStop === 'south_island'
			? `${southboundSubtitle} • Southtown Loop`
			: southboundSubtitle,
);
</script>

<div class="space-y-2.5">
	<ModeSectionHeader {title} {icon} {iconBgClass} {alerts}>
		<StopSelectorPills {selectedStop} onSelectStop={(st) => (selectedStop = st)} />
	</ModeSectionHeader>

	<!-- Live Corridor Radar Track -->
	<VehicleCorridorTracker {vehicles} {accentColor} />

	<!-- Directional Columns -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<TransitColumn
			title={northboundTitle}
			subtitle={activeNorthSubtitle}
			departures={northboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageNorth}
			subDetailsFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName
					? b.vehicleId
						? `Bus #${b.vehicleId} • ${b.nextStopName}`
						: b.nextStopName
					: b.vehicleId
						? `Bus #${b.vehicleId}`
						: 'Main St Corridor';
			}}
			badgeTextFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName || (b.vehicleId ? `Bus #${b.vehicleId}` : undefined);
			}}
		/>

		<TransitColumn
			title={southboundTitle}
			subtitle={activeSouthSubtitle}
			departures={southboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageSouth}
			subDetailsFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName
					? b.vehicleId
						? `Bus #${b.vehicleId} • ${b.nextStopName}`
						: b.nextStopName
					: b.vehicleId
						? `Bus #${b.vehicleId}`
						: 'Main St Corridor';
			}}
			badgeTextFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName || (b.vehicleId ? `Bus #${b.vehicleId}` : undefined);
			}}
		/>
	</div>
</div>
