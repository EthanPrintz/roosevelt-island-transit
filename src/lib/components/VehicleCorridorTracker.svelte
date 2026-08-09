<script lang="ts">
import { FlashIcon } from '@hugeicons/core-free-icons';
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
		? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
		: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
);

function calculateVehiclePosition(v: LiveVehiclePosition): number {
	const text = (v.nextStopName || '').toLowerCase();
	const isNorth = v.direction === 'northbound' || v.direction === 'queens_bound';

	if (text.includes('southtown') || text.includes('cornell')) {
		return isNorth ? 15 : 10;
	}
	if (text.includes('octagon') || text.includes('coler') || text.includes('27 ave')) {
		return isNorth ? 90 : 85;
	}
	if (text.includes('subway') || text.includes('tram') || text.includes('at stop')) {
		return isNorth ? 46 : 54;
	}
	return isNorth ? 35 : 65;
}
</script>

<div class="panel-card space-y-3 p-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 rounded-full {bgAccent} animate-pulse"></div>
			<h4 class="text-xs font-extrabold tracking-tight text-text-main">Live Corridor Radar</h4>
		</div>
		<span class="text-[11px] font-mono font-semibold text-text-muted">
			{vehicles.length} {vehicles.length === 1 ? 'Bus' : 'Buses'} Active
		</span>
	</div>

	<!-- 1D Visual Corridor Track -->
	<div class="relative pt-6 pb-2 px-4">
		<!-- Track Background Bar -->
		<div class="h-2 w-full bg-bg-elevated rounded-full overflow-hidden relative border border-border-default/40">
			<div class="h-full w-full bg-linear-to-r from-blue-500/20 via-primary/30 to-purple-500/20"></div>
		</div>

		<!-- Stop Anchor Dots & Labels -->
		<div class="flex justify-between items-center text-[10px] font-mono text-text-muted mt-2">
			<span class="flex items-center gap-1.5">
				<span class="w-2 h-2 rounded-full bg-border-default"></span>
				Southtown / Tech
			</span>
			<span class="flex items-center gap-1.5 font-bold text-text-main">
				<span class="w-2.5 h-2.5 rounded-full bg-primary shadow-xs"></span>
				Subway Plaza
			</span>
			<span class="flex items-center gap-1.5">
				Octagon / Coler
				<span class="w-2 h-2 rounded-full bg-border-default"></span>
			</span>
		</div>

		<!-- Vehicles Positioned Directly ON the Track -->
		{#if vehicles.length > 0}
			<div class="absolute inset-x-4 top-4 h-6 pointer-events-none">
				{#each vehicles as v (v.id)}
					{@const pos = calculateVehiclePosition(v)}
					<div
						class="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer pointer-events-auto transition-all duration-500"
						style="left: {pos}%;"
					>
						<!-- Radar Bus Marker Badge -->
						<div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs {borderAccent} backdrop-blur-md">
							<HugeiconsIcon icon={FlashIcon} size={10} />
							<span>#{v.vehicleId}</span>
							<span class="text-[9px] opacity-80">{v.direction === 'northbound' || v.direction === 'queens_bound' ? '↑' : '↓'}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Vehicle Sub-Status Cards -->
	{#if vehicles.length > 0}
		<div class="flex flex-wrap gap-2 pt-1">
			{#each vehicles as v (v.id)}
				<div class="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-mono border bg-bg-surface border-border-default/60 shadow-2xs">
					<span class="font-bold text-text-main">Bus #{v.vehicleId}</span>
					<span class="text-text-muted">
						{v.direction === 'northbound' || v.direction === 'queens_bound' ? 'Northbound' : 'Southbound'}
					</span>
					{#if v.nextStopName}
						<span class="text-text-muted font-normal italic">
							• {v.nextStopName}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center text-[11px] text-text-muted italic py-1">
			No live bus positions currently reported on the island corridor.
		</div>
	{/if}
</div>
