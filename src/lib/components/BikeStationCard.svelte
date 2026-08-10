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
	<!-- 1. Station Name -->
	<div class="border-b border-border-subtle/60 pb-2">
		<h3 class="font-extrabold text-sm sm:text-base text-text-main leading-snug">{station.name}</h3>
	</div>

	<!-- 2. Primary Summary Metrics (Clean Multi-Line Rows) -->
	<div class="space-y-1.5 font-mono text-xs border-b border-border-subtle/40 pb-2.5">
		<div class="flex items-center justify-between">
			<span class="text-text-muted font-sans font-medium">Bikes Available</span>
			<span class="text-sm font-black text-blue-600 dark:text-blue-400">{station.bikesAvailable.total}</span>
		</div>

		<div class="flex items-center justify-between">
			<span class="text-text-muted font-sans font-medium">Open Docks</span>
			<span class="text-xs font-bold text-text-main">{station.docksAvailable}</span>
		</div>
	</div>

	<!-- 3. Bike Type Breakdown (Dedicated Full-Width Rows - No 2-Column Truncation) -->
	<div class="space-y-1.5">
		<div class="px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default flex items-center justify-between text-xs">
			<span class="text-text-muted flex items-center gap-1.5 font-medium">
				<HugeiconsIcon icon={Bicycle01Icon} size={14} class="shrink-0" />
				<span>Classic Bikes</span>
			</span>
			<span class="font-mono font-bold text-xs text-text-main">{station.bikesAvailable.classic || 0}</span>
		</div>

		<div class="px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default flex items-center justify-between text-xs">
			<span class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
				<HugeiconsIcon icon={FlashIcon} size={14} class="shrink-0" />
				<span>Electric E-Bikes</span>
			</span>
			<span class="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{station.bikesAvailable.ebike || 0}</span>
		</div>
	</div>

	<!-- 4. Visual Dock Grid Visualization -->
	<div class="pt-1">
		<div class="text-[10px] font-mono text-text-muted mb-1.5">
			Station Dock Status ({station.capacity} Total Docks)
		</div>
		<div class="flex flex-wrap gap-1 max-w-full">
			{#each generateDockSlots(station) as slot, i (i)}
				{#if slot === 'ebike'}
					<div class="w-3.5 h-3.5 rounded bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0" title="E-Bike Available">
						<HugeiconsIcon icon={FlashIcon} size={9} />
					</div>
				{:else if slot === 'classic'}
					<div class="w-3.5 h-3.5 rounded bg-text-main text-bg-base flex items-center justify-center shrink-0" title="Classic Bike Available">
						<HugeiconsIcon icon={Bicycle01Icon} size={9} />
					</div>
				{:else if slot === 'broken_bike'}
					<div class="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center shrink-0" title="Broken Bike">
						<HugeiconsIcon icon={Wrench01Icon} size={8} />
					</div>
				{:else if slot === 'disabled_dock'}
					<div class="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0" title="Disabled Dock">
						<HugeiconsIcon icon={SquareIcon} size={8} />
					</div>
				{:else}
					<div class="w-3.5 h-3.5 rounded bg-border-default/40 border border-border-subtle shrink-0" title="Empty Dock"></div>
				{/if}
			{/each}
		</div>
	</div>
</div>
