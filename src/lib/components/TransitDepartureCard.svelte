<script lang="ts">
import {
	AlertCircleIcon,
	BoatIcon,
	Bus01Icon,
	Clock01Icon,
	FlashIcon,
	TrainIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';

let { departure }: { departure: TransitDeparture } = $props();

function getModeIcon(mode: string) {
	switch (mode) {
		case 'tram':
			return FlashIcon;
		case 'subway':
			return TrainIcon;
		case 'red_bus':
		case 'q102_bus':
			return Bus01Icon;
		case 'ferry':
			return BoatIcon;
		default:
			return Clock01Icon;
	}
}

let minutesAway = $derived.by(() => {
	const targetTime = new Date(departure.predictedTime || departure.scheduledTime).getTime();
	const now = new Date().getTime();
	const diffMinutes = Math.max(0, Math.round((targetTime - now) / 60000));
	return diffMinutes;
});
</script>

<div class="p-5 rounded-2xl bg-bg-surface border border-border-default shadow-xs hover:border-border-hover transition-all duration-200 flex flex-col justify-between gap-4">
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-xl bg-bg-elevated text-primary border border-border-subtle flex items-center justify-center">
				<HugeiconsIcon icon={getModeIcon(departure.mode)} size={20} strokeWidth={2} />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded-md bg-primary/10 text-primary border border-primary/20">
						{departure.routeId}
					</span>
					<span class="text-xs font-semibold text-text-muted">{departure.routeName}</span>
				</div>
				<h4 class="text-base font-bold text-text-main mt-1 leading-tight">{departure.headsign}</h4>
			</div>
		</div>

		<!-- Minutes Away Badge -->
		<div class="text-right">
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-base border border-border-default">
				<HugeiconsIcon icon={Clock01Icon} size={14} class="text-primary" />
				<span class="font-mono font-extrabold text-base text-text-main">{minutesAway}</span>
				<span class="text-[11px] font-medium text-text-muted">min</span>
			</div>
		</div>
	</div>

	<div class="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
		<span class="text-text-muted font-medium flex items-center gap-1">
			📍 {departure.stopName}
		</span>

		{#if departure.status === 'rerouted'}
			<span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1 border border-amber-500/20">
				<HugeiconsIcon icon={AlertCircleIcon} size={13} />
				Rerouted
			</span>
		{:else if departure.status === 'delays'}
			<span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-[11px] flex items-center gap-1 border border-rose-500/20">
				<HugeiconsIcon icon={AlertCircleIcon} size={13} />
				Delayed
			</span>
		{/if}
	</div>
</div>
