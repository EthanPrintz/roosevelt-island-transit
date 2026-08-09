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

let currentStopLabel = $derived(
	selectedStop === 'north_island'
		? 'Octagon / Coler Stop'
		: selectedStop === 'south_island'
			? 'Southtown / Tech Stop'
			: 'Subway Plaza Stop',
);

let activeNorthSubtitle = $derived(
	selectedStop === 'north_island'
		? `${northboundSubtitle} @ Octagon / Coler`
		: selectedStop === 'south_island'
			? `${northboundSubtitle} @ Southtown / Tech`
			: `${northboundSubtitle} @ Subway Plaza`,
);

let activeSouthSubtitle = $derived(
	selectedStop === 'north_island'
		? `${southboundSubtitle} @ Coler Terminal`
		: selectedStop === 'south_island'
			? `${southboundSubtitle} @ Southtown Loop`
			: `${southboundSubtitle} @ Subway Plaza`,
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
				const veh = b.vehicleId ? `Bus #${b.vehicleId}` : 'Bus';
				const prox = b.nextStopName ? ` • ${b.nextStopName}` : '';
				return `${veh}${prox} • 📍 ${currentStopLabel}`;
			}}
			badgeTextFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName ? `${b.nextStopName}` : currentStopLabel;
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
				const veh = b.vehicleId ? `Bus #${b.vehicleId}` : 'Bus';
				const prox = b.nextStopName ? ` • ${b.nextStopName}` : '';
				return `${veh}${prox} • 📍 ${currentStopLabel}`;
			}}
			badgeTextFn={(dep) => {
				const b = dep as BusDeparture;
				return b.nextStopName ? `${b.nextStopName}` : currentStopLabel;
			}}
		/>
	</div>
</div>
