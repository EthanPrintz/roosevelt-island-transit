<script lang="ts">
import type {
	BusDeparture,
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import ModeSectionHeader from './ModeSectionHeader.svelte';
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
</script>

<div class="space-y-2.5">
	<ModeSectionHeader {title} {icon} {iconBgClass} {alerts} />

	<!-- Live Corridor Radar Track -->
	<VehicleCorridorTracker {vehicles} {accentColor} />

	<!-- Directional Columns -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<TransitColumn
			title={northboundTitle}
			subtitle={northboundSubtitle}
			departures={northboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageNorth}
			subDetailsFn={(dep) => {
				const b = dep as BusDeparture;
				const veh = b.vehicleId ? `Bus #${b.vehicleId}` : 'Bus';
				const prox = b.nextStopName ? ` • ${b.nextStopName}` : '';
				return `${veh}${prox}`;
			}}
		/>

		<TransitColumn
			title={southboundTitle}
			subtitle={southboundSubtitle}
			departures={southboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageSouth}
			subDetailsFn={(dep) => {
				const b = dep as BusDeparture;
				const veh = b.vehicleId ? `Bus #${b.vehicleId}` : 'Bus';
				const prox = b.nextStopName ? ` • ${b.nextStopName}` : '';
				return `${veh}${prox}`;
			}}
		/>
	</div>
</div>
