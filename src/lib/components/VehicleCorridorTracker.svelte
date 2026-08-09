<script lang="ts">
import { ArrowDown01Icon, ArrowUp01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { LiveVehiclePosition } from '$lib/transit/domain/types';

interface Props {
	vehicles: LiveVehiclePosition[];
	accentColor: 'blue' | 'rose';
}

let { vehicles = [], accentColor }: Props = $props();

const bgAccent = $derived(accentColor === 'blue' ? 'bg-blue-500' : 'bg-rose-500');
const borderAccent = $derived(
	accentColor === 'blue'
		? 'border-blue-500/50 text-blue-400 bg-blue-950/80 shadow-blue-500/20'
		: 'border-rose-500/50 text-rose-400 bg-rose-950/80 shadow-rose-500/20',
);

function calculateBasePosition(v: LiveVehiclePosition): number {
	const text = (v.nextStopName || '').toLowerCase();
	const isNorth = v.direction === 'northbound' || v.direction === 'queens_bound';

	if (text.includes('southtown') || text.includes('cornell')) {
		return isNorth ? 18 : 12;
	}
	if (text.includes('octagon') || text.includes('coler') || text.includes('27 ave')) {
		return isNorth ? 88 : 82;
	}
	if (text.includes('subway') || text.includes('tram') || text.includes('at stop')) {
		return isNorth ? 44 : 56;
	}
	return isNorth ? 36 : 64;
}

let vehiclePositions = $derived.by(() => {
	const posMap = new Map<string, number>();
	const used: number[] = [];

	for (const v of vehicles) {
		let pos = calculateBasePosition(v);
		// Avoid overlapping badges by staggering horizontally
		while (used.some((p) => Math.abs(p - pos) < 14)) {
			pos = Math.min(88, pos + 14);
		}
		used.push(pos);
		posMap.set(v.id, pos);
	}
	return posMap;
});
</script>

<div class="panel-card p-4 space-y-3">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 rounded-full {bgAccent} animate-pulse shadow-xs"></div>
			<h4 class="text-xs font-extrabold tracking-tight text-text-main">Live Corridor Radar</h4>
		</div>
		<span class="text-[11px] font-mono font-semibold text-text-muted">
			{vehicles.length} {vehicles.length === 1 ? 'Bus' : 'Buses'} Active
		</span>
	</div>

	<!-- 1D Visual Corridor Track -->
	<div class="relative pt-10 pb-3 px-6">
		<!-- Track Line -->
		<div class="h-2 w-full bg-bg-elevated rounded-full overflow-hidden relative border border-border-default/50 shadow-inner">
			<div class="h-full w-full bg-linear-to-r from-blue-500/25 via-primary/35 to-purple-500/25"></div>
		</div>

		<!-- Stop Anchor Points -->
		<div class="flex justify-between items-center text-[10px] font-mono text-text-muted mt-2.5">
			<span class="flex items-center gap-1.5">
				<span class="w-2 h-2 rounded-full bg-border-default"></span>
				Southtown / Tech
			</span>
			<span class="flex items-center gap-1.5 font-bold text-text-main">
				<span class="w-2.5 h-2.5 rounded-full bg-primary shadow-2xs"></span>
				Subway Plaza
			</span>
			<span class="flex items-center gap-1.5">
				Octagon / Coler
				<span class="w-2 h-2 rounded-full bg-border-default"></span>
			</span>
		</div>

		<!-- Vehicles Positioned Directly Above Track Line -->
		{#if vehicles.length > 0}
			<div class="absolute inset-x-6 top-0 bottom-6 pointer-events-none">
				{#each vehicles as v (v.id)}
					{@const pos = vehiclePositions.get(v.id) ?? 50}
					{@const isNorth = v.direction === 'northbound' || v.direction === 'queens_bound'}
					<div
						class="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-auto transition-all duration-500 z-10"
						style="left: {pos}%;"
					>
						<!-- Bus Badge Floating Above Track -->
						<div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-md {borderAccent} backdrop-blur-md">
							<HugeiconsIcon icon={FlashIcon} size={10} />
							<span>#{v.vehicleId}</span>
							<HugeiconsIcon icon={isNorth ? ArrowUp01Icon : ArrowDown01Icon} size={10} />
						</div>
						<!-- Pointer Dot on Track Line -->
						<div class="w-2 h-2 rounded-full bg-white border border-primary shadow-xs mt-1.5"></div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center text-[11px] text-text-muted italic pt-1">
				No live buses currently tracked on corridor.
			</div>
		{/if}
	</div>
</div>
