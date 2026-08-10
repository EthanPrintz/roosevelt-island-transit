<script lang="ts">
import {
	BikeIcon,
	Bus01Icon,
	CableCarIcon,
	FerryBoatIcon,
	Train01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import { mapSettings } from '$lib/state/map-settings.svelte';

const layerItems = [
	{
		key: 'subway' as const,
		label: 'Subway',
		icon: Train01Icon,
		activeColor: 'bg-orange-500 text-white',
	},
	{
		key: 'tram' as const,
		label: 'Tram',
		icon: CableCarIcon,
		activeColor: 'bg-rose-500 text-white',
	},
	{
		key: 'ferry' as const,
		label: 'Ferry',
		icon: FerryBoatIcon,
		activeColor: 'bg-cyan-500 text-white',
	},
	{ key: 'buses' as const, label: 'Buses', icon: Bus01Icon, activeColor: 'bg-rose-600 text-white' },
	{
		key: 'citibike' as const,
		label: 'Citi Bike',
		icon: BikeIcon,
		activeColor: 'bg-emerald-500 text-white',
	},
];
</script>

<div class="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-bg-surface/90 backdrop-blur-md border border-border-default shadow-2xs text-xs">
	{#each layerItems as item}
		{@const isActive =
			item.key === 'subway'
				? mapSettings.showSubway
				: item.key === 'tram'
					? mapSettings.showTram
					: item.key === 'ferry'
						? mapSettings.showFerry
						: item.key === 'buses'
							? mapSettings.showBuses
							: mapSettings.showCitiBike}
		<button
			type="button"
			onclick={() => mapSettings.toggleLayer(item.key)}
			class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all duration-150 border cursor-pointer {isActive
				? `${item.activeColor} border-transparent shadow-2xs scale-[1.02]`
				: 'bg-bg-elevated/70 text-text-muted border-border-subtle hover:text-text-main hover:bg-bg-elevated'}"
		>
			<HugeiconsIcon icon={item.icon} size={14} />
			<span>{item.label}</span>
		</button>
	{/each}
</div>
