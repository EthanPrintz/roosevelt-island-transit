<script lang="ts">
import { Bicycle01Icon, FlashIcon, SquareIcon, Wrench01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { BikeStation } from '$lib/transit/domain/types';

interface Props {
	station: BikeStation;
}

let { station }: Props = $props();

type DockSlotType = 'ebike' | 'classic' | 'broken_bike' | 'disabled_dock' | 'empty';

function generateDockSlots(st: BikeStation): DockSlotType[] {
	const slots: DockSlotType[] = [];

	const ebikeCount = st.bikesAvailable.ebike || 0;
	for (let i = 0; i < ebikeCount; i++) slots.push('ebike');

	const classicCount = st.bikesAvailable.classic || 0;
	for (let i = 0; i < classicCount; i++) slots.push('classic');

	const brokenBikes = st.disabledBikes || 0;
	for (let i = 0; i < brokenBikes; i++) slots.push('broken_bike');

	const disabledDocks = st.disabledDocks || 0;
	for (let i = 0; i < disabledDocks; i++) slots.push('disabled_dock');

	const totalCapacity = Math.max(st.capacity, slots.length);
	const emptyDocks = Math.max(0, totalCapacity - slots.length);
	for (let i = 0; i < emptyDocks; i++) slots.push('empty');

	return slots;
}
</script>

<div class="panel-card space-y-3">
	<div class="flex items-start justify-between gap-2">
		<div>
			<h3 class="font-bold text-sm text-text-main">{station.name}</h3>
			<div class="text-xs text-text-muted font-mono">Roosevelt Island Station</div>
		</div>

		<div class="text-right shrink-0">
			<div class="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
				{station.bikesAvailable.total} <span class="text-xs font-normal text-text-muted">bikes</span>
			</div>
			<div class="text-[10px] font-mono text-text-muted">
				{station.docksAvailable} docks open
			</div>
		</div>
	</div>

	<!-- E-Bike / Classic Availability Stats -->
	<div class="grid grid-cols-2 gap-2 text-xs">
		<div class="p-2 rounded-lg bg-bg-surface border border-border-default flex items-center justify-between">
			<span class="text-text-muted flex items-center gap-1">
				<HugeiconsIcon icon={Bicycle01Icon} size={14} />
				<span>Classic</span>
			</span>
			<span class="font-mono font-bold text-text-main">{station.bikesAvailable.classic || 0}</span>
		</div>
		<div class="p-2 rounded-lg bg-bg-surface border border-border-default flex items-center justify-between">
			<span class="text-text-muted flex items-center gap-1 text-blue-600 dark:text-blue-400">
				<HugeiconsIcon icon={FlashIcon} size={14} />
				<span>E-Bikes</span>
			</span>
			<span class="font-mono font-bold text-blue-600 dark:text-blue-400">{station.bikesAvailable.ebike || 0}</span>
		</div>
	</div>

	<!-- Visual Dock Grid Visualization -->
	<div class="pt-1">
		<div class="text-[10px] font-mono text-text-muted mb-1.5 flex items-center justify-between">
			<span>Station Dock Status ({station.capacity} Total Docks)</span>
		</div>
		<div class="flex flex-wrap gap-1">
			{#each generateDockSlots(station) as slot, i (i)}
				{#if slot === 'ebike'}
					<div class="w-3.5 h-3.5 rounded bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center" title="E-Bike Available">
						<HugeiconsIcon icon={FlashIcon} size={9} />
					</div>
				{:else if slot === 'classic'}
					<div class="w-3.5 h-3.5 rounded bg-text-main text-bg-base flex items-center justify-center" title="Classic Bike Available">
						<HugeiconsIcon icon={Bicycle01Icon} size={9} />
					</div>
				{:else if slot === 'broken_bike'}
					<div class="w-3.5 h-3.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center" title="Broken Bike">
						<HugeiconsIcon icon={Wrench01Icon} size={9} />
					</div>
				{:else if slot === 'disabled_dock'}
					<div class="w-3.5 h-3.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center" title="Disabled Dock">
						<HugeiconsIcon icon={SquareIcon} size={9} />
					</div>
				{:else}
					<div class="w-3.5 h-3.5 rounded bg-border-default/40 border border-border-subtle" title="Empty Dock"></div>
				{/if}
			{/each}
		</div>
	</div>
</div>
