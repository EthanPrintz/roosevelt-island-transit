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

<div class="panel-card space-y-3.5">
	<!-- 1. Station Header -->
	<div class="border-b border-border-subtle/60 pb-2">
		<h3 class="font-extrabold text-base text-text-main leading-snug tracking-tight">{station.name}</h3>
	</div>

	<!-- 2. Primary Stat Hero Cards (3-Column Grid) -->
	<div class="grid grid-cols-3 gap-2.5">
		<!-- Classic Bikes -->
		<div class="p-2.5 rounded-xl bg-bg-surface border border-border-default flex flex-col justify-between space-y-1 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-text-muted">
				<span class="font-medium">Classic</span>
				<HugeiconsIcon icon={Bicycle01Icon} size={14} class="text-text-main" />
			</div>
			<div class="font-mono text-lg font-black text-text-main">
				{station.bikesAvailable.classic || 0}
			</div>
		</div>

		<!-- Electric E-Bikes -->
		<div class="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between space-y-1 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
				<span class="font-bold">E-Bikes</span>
				<HugeiconsIcon icon={FlashIcon} size={14} />
			</div>
			<div class="font-mono text-lg font-black text-blue-600 dark:text-blue-400">
				{station.bikesAvailable.ebike || 0}
			</div>
		</div>

		<!-- Open Docks -->
		<div class="p-2.5 rounded-xl bg-bg-elevated/70 border border-border-subtle/80 flex flex-col justify-between space-y-1 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-text-muted">
				<span class="font-medium">Open Docks</span>
				<HugeiconsIcon icon={SquareIcon} size={13} class="text-text-muted" />
			</div>
			<div class="font-mono text-lg font-black text-text-main">
				{station.docksAvailable}
			</div>
		</div>
	</div>

	<!-- 3. Visual Dock Matrix -->
	<div class="space-y-1.5 pt-0.5">
		<div class="text-[11px] font-mono text-text-muted">
			{station.capacity} Docking Slots
		</div>

		<div class="flex flex-wrap gap-1 max-w-full pt-0.5">
			{#each generateDockSlots(station) as slot, i (i)}
				{#if slot === 'ebike'}
					<div class="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs" title="E-Bike Available">
						<HugeiconsIcon icon={FlashIcon} size={10} />
					</div>
				{:else if slot === 'classic'}
					<div class="w-4 h-4 rounded bg-text-main text-bg-base flex items-center justify-center shrink-0 shadow-2xs" title="Classic Bike Available">
						<HugeiconsIcon icon={Bicycle01Icon} size={10} />
					</div>
				{:else if slot === 'broken_bike'}
					<div class="w-4 h-4 rounded bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center shrink-0" title="Broken Bike">
						<HugeiconsIcon icon={Wrench01Icon} size={9} />
					</div>
				{:else if slot === 'disabled_dock'}
					<div class="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0" title="Disabled Dock">
						<HugeiconsIcon icon={SquareIcon} size={9} />
					</div>
				{:else}
					<div class="w-4 h-4 rounded bg-border-default/40 border border-border-subtle shrink-0" title="Empty Dock"></div>
				{/if}
			{/each}
		</div>
	</div>
</div>
