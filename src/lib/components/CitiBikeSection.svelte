<script lang="ts">
import { Bicycle01Icon, FlashIcon, SquareIcon, Wrench01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';
import type { BikeStation, TransitAlert } from '$lib/transit/domain/types';
import BikeStationCard from './BikeStationCard.svelte';
import ModeSectionHeader from './ModeSectionHeader.svelte';

interface Props {
	stations: BikeStation[];
	alerts?: TransitAlert[];
}

let { stations, alerts = [] }: Props = $props();

let totalEbikes = $derived(stations.reduce((sum, s) => sum + (s.bikesAvailable.ebike || 0), 0));
let totalClassicBikes = $derived(
	stations.reduce((sum, s) => sum + (s.bikesAvailable.classic || 0), 0),
);
let totalOpenDocks = $derived(stations.reduce((sum, s) => sum + (s.docksAvailable || 0), 0));
let totalBrokenBikes = $derived(stations.reduce((sum, s) => sum + (s.disabledBikes || 0), 0));
</script>

<div class="space-y-2.5">
	<ModeSectionHeader
		title="Citi Bike"
		icon={Bicycle01Icon}
		iconBgClass="bg-blue-600/10 text-blue-600 dark:text-blue-400"
		{alerts}
	>
		<!-- Legend Bar -->
		<div class="flex flex-wrap items-center gap-3 text-[10px] font-medium text-text-muted bg-bg-surface px-3 py-1 rounded-xl border border-border-default shadow-2xs">
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
					<HugeiconsIcon icon={FlashIcon} size={8} />
				</span>
				<span>E-Bike ({totalEbikes})</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded bg-text-main text-bg-base flex items-center justify-center shadow-2xs">
					<HugeiconsIcon icon={Bicycle01Icon} size={8} />
				</span>
				<span>Classic ({totalClassicBikes})</span>
			</div>
			{#if totalBrokenBikes > 0}
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
						<HugeiconsIcon icon={Wrench01Icon} size={8} />
					</span>
					<span>Broken ({totalBrokenBikes})</span>
				</div>
			{/if}
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded bg-bg-elevated/60 border border-border-default flex items-center justify-center text-text-muted">
					<HugeiconsIcon icon={SquareIcon} size={8} />
				</span>
				<span>Open Dock ({totalOpenDocks})</span>
			</div>
		</div>
	</ModeSectionHeader>

	{#if stations.length === 0}
		<div class="p-6 rounded-xl bg-bg-surface/50 border border-border-default/50 text-center text-xs text-text-muted">
			{transitSettings.isLoading ? 'Loading live station availability...' : 'No live Citi Bike station status available.'}
		</div>
	{:else}
		<div class="space-y-3">
			{#each stations as station (station.id)}
				<BikeStationCard {station} />
			{/each}
		</div>
	{/if}
</div>
