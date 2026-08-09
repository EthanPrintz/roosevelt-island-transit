<script lang="ts">
import type {
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
} from '$lib/transit/domain/types';
import ModeSectionHeader from './ModeSectionHeader.svelte';
import StopArrivalMatrix from './StopArrivalMatrix.svelte';
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

	<!-- Directional Multi-Stop Matrices -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<StopArrivalMatrix
			title={northboundTitle}
			subtitle={northboundSubtitle}
			departures={northboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageNorth}
		/>

		<StopArrivalMatrix
			title={southboundTitle}
			subtitle={southboundSubtitle}
			departures={southboundDepartures}
			{accentColor}
			emptyMessage={emptyMessageSouth}
		/>
	</div>
</div>
