<script lang="ts">
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
		{@const liveHeroIndex = departures.findIndex((d) => d.isRealtime)}
		{@const heroIndex = liveHeroIndex !== -1 && liveHeroIndex <= 2 ? liveHeroIndex : 0}
		{@const heroDep = departures[heroIndex]}
		{@const remainingDeps = departures.filter((_, idx) => idx !== heroIndex)}
		{@const timetableDeps = maxTimetableItems ? remainingDeps.slice(0, maxTimetableItems) : remainingDeps}
		<HeroDepartureCard
			departure={heroDep}
			{accentColor}
			statusText={statusTextFn ? statusTextFn(heroDep) : undefined}
			statusIcon={statusIconFn ? statusIconFn(heroDep) : undefined}
			statusClass={statusClassFn ? statusClassFn(heroDep) : undefined}
			subDetails={subDetailsFn ? subDetailsFn(heroDep) : undefined}
		/>

		{#if timetableDeps.length > 0}
			<TimetableList
				departures={timetableDeps}
				{accentColor}
				{badgeTextFn}
			/>
		{/if}
	{/if}
</div>


