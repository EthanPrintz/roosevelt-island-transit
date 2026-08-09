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
		? 'border-blue-500/30 text-blue-500 bg-blue-500/10'
		: 'border-rose-500/30 text-rose-500 bg-rose-500/10',
);
</script>

<div class="panel-card space-y-3 p-3.5">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 rounded-full {bgAccent} animate-pulse"></div>
			<h4 class="text-xs font-bold tracking-tight text-text-main">Live Corridor Radar</h4>
		</div>
		<span class="text-[10px] font-mono text-text-muted">
			{vehicles.length} {vehicles.length === 1 ? 'Bus' : 'Buses'} Active
		</span>
	</div>

	<!-- 1D Corridor Line -->
	<div class="relative py-2 px-1">
		<!-- Track Line -->
		<div class="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden flex items-center relative">
			<div class="h-full w-full bg-linear-to-r from-cyan-500/20 via-primary/30 to-purple-500/20"></div>
		</div>

		<!-- Stop Anchor Points -->
		<div class="flex justify-between items-center text-[10px] font-mono text-text-muted mt-2">
			<span class="flex items-center gap-1">
				<span class="w-1.5 h-1.5 rounded-full bg-text-muted/40"></span>
				Southtown / Tech
			</span>
			<span class="flex items-center gap-1 font-semibold text-text-main">
				<span class="w-2 h-2 rounded-full bg-primary shadow-2xs"></span>
				Subway Plaza
			</span>
			<span class="flex items-center gap-1">
				Octagon / Coler
				<span class="w-1.5 h-1.5 rounded-full bg-text-muted/40"></span>
			</span>
		</div>

		<!-- Active Vehicle Badges -->
		{#if vehicles.length > 0}
			<div class="mt-3 flex flex-wrap gap-2">
				{#each vehicles as v (v.id)}
					<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border {borderAccent}">
						<HugeiconsIcon icon={FlashIcon} size={11} />
						<span class="font-bold">Bus #{v.vehicleId}</span>
						<span class="text-[10px] text-text-muted">
							• {v.direction === 'northbound' ? '↑ North' : '↓ South'}
						</span>
						{#if v.nextStopName}
							<span class="text-[10px] text-text-muted italic truncate max-w-32.5">
								({v.nextStopName})
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="mt-2 text-center text-[11px] text-text-muted italic">
				No active bus positions currently reported.
			</div>
		{/if}
	</div>
</div>
