<script lang="ts">
import { Location01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';

export type IslandStopNode = 'subway_plaza' | 'north_island' | 'south_island';

interface Props {
	selectedStop: IslandStopNode;
	onSelectStop: (stop: IslandStopNode) => void;
}

let { selectedStop, onSelectStop }: Props = $props();

const stops: { id: IslandStopNode; label: string; sub: string }[] = [
	{ id: 'subway_plaza', label: 'Subway Plaza', sub: 'Main Hub' },
	{ id: 'north_island', label: 'North Island', sub: 'Octagon / Coler' },
	{ id: 'south_island', label: 'South Island', sub: 'Southtown / Tech' },
];
</script>

<div class="flex flex-wrap items-center gap-1.5 p-1 bg-bg-surface rounded-xl border border-border-default shadow-2xs">
	{#each stops as stop (stop.id)}
		{@const isSelected = selectedStop === stop.id}
		<button
			type="button"
			onclick={() => onSelectStop(stop.id)}
			class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer {isSelected
				? 'bg-primary text-white shadow-2xs font-semibold'
				: 'text-text-muted hover:text-text-main hover:bg-bg-elevated/50'}"
		>
			<HugeiconsIcon icon={Location01Icon} size={11} />
			<span>{stop.label}</span>
		</button>
	{/each}
</div>
