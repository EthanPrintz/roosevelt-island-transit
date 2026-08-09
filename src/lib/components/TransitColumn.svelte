<script lang="ts">
import { Clock01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { transitSettings } from '$lib/state/transit-settings.svelte';
import type { TransitDeparture } from '$lib/transit/domain/types';
import DirectionHeader from './DirectionHeader.svelte';
import HeroDepartureCard from './HeroDepartureCard.svelte';
import TimetableList from './TimetableList.svelte';

interface Props {
	title: string;
	subtitle?: string;
	departures: TransitDeparture[];
	accentColor: 'orange' | 'rose' | 'cyan' | 'blue';
	emptyMessage: string;
	statusTextFn?: (dep: TransitDeparture) => string;
	statusIconFn?: (dep: TransitDeparture) => any;
	statusClassFn?: (dep: TransitDeparture) => string | undefined;
	lineBadgeTextFn?: (dep: TransitDeparture) => string | undefined;
	lineBadgeClassFn?: (dep: TransitDeparture) => string | undefined;
	subDetailsFn?: (dep: TransitDeparture) => string | undefined;
	badgeTextFn?: (dep: TransitDeparture) => string | undefined;
	maxTimetableItems?: number;
}

let {
	title,
	subtitle,
	departures,
	accentColor,
	emptyMessage,
	statusTextFn,
	statusIconFn,
	statusClassFn,
	lineBadgeTextFn,
	lineBadgeClassFn,
	subDetailsFn,
	badgeTextFn,
	maxTimetableItems,
}: Props = $props();
</script>

<div class="panel-card space-y-3">
	<DirectionHeader {title} {subtitle} />

	{#if departures.length === 0}
		<div class="p-4 text-center text-xs text-text-muted bg-bg-surface/50 rounded-xl border border-border-default/50">
			{transitSettings.isLoading ? 'Loading live departures...' : emptyMessage}
		</div>
	{:else}
		{@const heroDep = departures[0]}
		<HeroDepartureCard
			departure={heroDep}
			{accentColor}
			statusText={statusTextFn ? statusTextFn(heroDep) : (heroDep.isRealtime ? 'En Route' : 'Scheduled')}
			statusIcon={statusIconFn ? statusIconFn(heroDep) : (heroDep.isRealtime ? FlashIcon : Clock01Icon)}
			statusClass={statusClassFn ? statusClassFn(heroDep) : undefined}
			subDetails={subDetailsFn ? subDetailsFn(heroDep) : undefined}
		/>

		{#if departures.length > 1}
			<TimetableList
				departures={maxTimetableItems ? departures.slice(1, maxTimetableItems + 1) : departures.slice(1)}
				{accentColor}
				{badgeTextFn}
			/>
		{/if}
	{/if}
</div>
