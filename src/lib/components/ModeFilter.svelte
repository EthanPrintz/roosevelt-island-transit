<script lang="ts">
import {
	BicycleIcon,
	BoatIcon,
	Bus01Icon,
	FlashIcon,
	Layers01Icon,
	TrainIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitMode } from '$lib/transit/domain/types';

let {
	selectedMode = $bindable('all'),
}: {
	selectedMode: TransitMode | 'all';
} = $props();

const filters: { id: TransitMode | 'all'; label: string; icon: any }[] = [
	{ id: 'all', label: 'All Modes', icon: Layers01Icon },
	{ id: 'tram', label: 'Tramway', icon: FlashIcon },
	{ id: 'subway', label: 'Subway F/M', icon: TrainIcon },
	{ id: 'red_bus', label: 'Red Bus', icon: Bus01Icon },
	{ id: 'q102_bus', label: 'Q102 Bus', icon: Bus01Icon },
	{ id: 'ferry', label: 'NYC Ferry', icon: BoatIcon },
	{ id: 'citibike', label: 'Citi Bike', icon: BicycleIcon },
];
</script>

<div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
	{#each filters as { id, label, icon }}
		<button
			type="button"
			onclick={() => (selectedMode = id)}
			class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border {selectedMode === id ? 'bg-primary text-primary-fg border-primary shadow-xs' : 'bg-bg-surface text-text-muted border-border-default hover:border-border-hover hover:text-text-main hover:bg-bg-elevated'}"
		>
			<HugeiconsIcon icon={icon} size={15} strokeWidth={2} />
			<span>{label}</span>
		</button>
	{/each}
</div>
