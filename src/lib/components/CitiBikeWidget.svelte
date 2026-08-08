<script lang="ts">
import { BicycleIcon, FlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { BikeStation } from '$lib/transit/domain/types';

let { station }: { station: BikeStation } = $props();

let fillPercentage = $derived(
	station.capacity > 0 ? Math.round((station.bikesAvailable.total / station.capacity) * 100) : 50,
);
</script>

<div class="p-5 rounded-2xl bg-bg-surface border border-border-default shadow-xs space-y-4">
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
				<HugeiconsIcon icon={BicycleIcon} size={18} strokeWidth={2} />
			</div>
			<div>
				<h4 class="text-sm font-bold text-text-main leading-tight">{station.name}</h4>
				<span class="text-[11px] text-text-muted">Citi Bike Station</span>
			</div>
		</div>
		<span class="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-bg-elevated text-text-main border border-border-subtle">
			{fillPercentage}% full
		</span>
	</div>

	<!-- Capacity Fill Meter Bar -->
	<div class="w-full h-2 rounded-full bg-bg-elevated overflow-hidden border border-border-subtle">
		<div
			class="h-full bg-primary transition-all duration-300 rounded-full"
			style="width: {fillPercentage}%"
		></div>
	</div>

	<!-- Breakdown Stats -->
	<div class="grid grid-cols-3 gap-2 pt-1 text-center">
		<div class="p-2 rounded-xl bg-bg-base border border-border-subtle space-y-0.5">
			<span class="text-[10px] font-semibold text-text-muted uppercase block">Classic</span>
			<span class="font-mono font-bold text-sm text-text-main">{station.bikesAvailable.classic}</span>
		</div>
		<div class="p-2 rounded-xl bg-bg-base border border-border-subtle space-y-0.5">
			<span class="text-[10px] font-semibold text-text-muted uppercase flex items-center justify-center gap-0.5">
				<HugeiconsIcon icon={FlashIcon} size={11} class="text-amber-500" />
				E-Bikes
			</span>
			<span class="font-mono font-bold text-sm text-primary">{station.bikesAvailable.ebike}</span>
		</div>
		<div class="p-2 rounded-xl bg-bg-base border border-border-subtle space-y-0.5">
			<span class="text-[10px] font-semibold text-text-muted uppercase block">Open Docks</span>
			<span class="font-mono font-bold text-sm text-text-main">{station.docksAvailable}</span>
		</div>
	</div>
</div>
