<script lang="ts">
import {
	AlertCircleIcon,
	Bus01Icon,
	CableCarIcon,
	Clock01Icon,
	Compass01Icon,
	FerryBoatIcon,
	Navigation01Icon,
	SparklesIcon,
	Train01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type {
	BikeStation,
	BusDeparture,
	FerryDeparture,
	LiveVehiclePosition,
	SubwayDeparture,
	TramDeparture,
	TransitAlert,
	TransitDeparture,
	TransitMode,
} from '$lib/transit/domain/types';

import {
	getAlertsForStopOrMode,
	getBikeStationDetails,
	getDeparturesForStop,
	getVehicleDetails,
} from '$lib/transit/utils/popup-matcher';
import { getUpcomingStopsForVehicle } from '$lib/transit/utils/route-sequencer';
import { resolveHeroStatusPill } from '$lib/transit/utils/status-pill';
import { formatRelativeTime } from '$lib/utils/time-format';

interface Props {
	entityId: string;
	departures?: TransitDeparture[];
	vehicles?: LiveVehiclePosition[];
	stations?: BikeStation[];
	alerts?: TransitAlert[];
}

let { entityId, departures = [], vehicles = [], stations = [], alerts = [] }: Props = $props();

let vehicleMatch = $derived(getVehicleDetails(entityId, vehicles));
let stationMatch = $derived(getBikeStationDetails(entityId, stations));
let stopDepartures = $derived(getDeparturesForStop(entityId, departures));

let stopMode = $derived.by<TransitMode>(() => {
	if (entityId === 'stop-subway-ri') return 'subway';
	if (entityId.includes('tram')) return 'tram';
	if (entityId === 'stop-ferry-ri') return 'ferry';
	if (entityId.startsWith('stop-q102-')) return 'q102_bus';
	if (entityId.startsWith('stop-redbus-')) return 'red_bus';
	return 'subway';
});

let stopTitle = $derived.by(() => {
	if (entityId === 'stop-subway-ri') return 'Roosevelt Island Subway Station';
	if (entityId === 'stop-tram-ri') return 'Tramway Island Station';
	if (entityId === 'stop-tram-manhattan') return 'Tramway Manhattan Station';
	if (entityId === 'stop-ferry-ri') return 'Roosevelt Island Ferry Dock';
	if (stopDepartures.length > 0 && stopDepartures[0].stopName) {
		return stopDepartures[0].stopName;
	}
	const tag = entityId.replace(/^stop-(redbus|q102)-/, '').replace(/_/g, ' ');
	return tag.charAt(0).toUpperCase() + tag.slice(1);
});

let stopSubtitle = $derived.by(() => {
	if (entityId === 'stop-subway-ri') return 'MTA F Train - 63rd St Line';
	if (entityId.includes('tram')) return 'Aerial Cable Car Terminal';
	if (entityId === 'stop-ferry-ri') return 'NYC Ferry Astoria Line Pier';
	if (entityId.startsWith('stop-redbus-')) return 'RIOC Red Bus Shuttle Stop';
	if (entityId.startsWith('stop-q102-')) return 'MTA Q102 Bus Stop';
	return 'Transit Hub';
});

let activeAlerts = $derived(getAlertsForStopOrMode(entityId, stopMode, alerts));

function getModeColorClass(mode: TransitMode): string {
	switch (mode) {
		case 'subway':
			return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
		case 'tram':
			return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
		case 'ferry':
			return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
		case 'red_bus':
			return 'text-rose-600 dark:text-rose-400 bg-rose-600/10 border-rose-600/30';
		case 'q102_bus':
			return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
		case 'citibike':
			return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
		default:
			return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
	}
}

function getHeroAccentColor(mode: TransitMode): 'orange' | 'rose' | 'cyan' | 'blue' {
	switch (mode) {
		case 'subway':
			return 'orange';
		case 'tram':
		case 'red_bus':
			return 'rose';
		case 'ferry':
			return 'cyan';
		case 'q102_bus':
		default:
			return 'blue';
	}
}

function formatDepartureSubDetails(dep: TransitDeparture): string | undefined {
	if (dep.mode === 'subway') {
		const sub = dep as SubwayDeparture;
		return sub.originStartTime ? `Dispatched: ${sub.originStartTime}` : `Track ${sub.track}`;
	}
	if (dep.mode === 'tram') {
		const tram = dep as TramDeparture;
		return tram.cabin || 'Tram Cabin';
	}
	if (dep.mode === 'ferry') {
		const ferry = dep as FerryDeparture;
		return ferry.vesselName
			? ferry.speedKnots
				? `${ferry.vesselName} (${ferry.speedKnots} kts)`
				: ferry.vesselName
			: 'Astoria Line';
	}
	if (dep.mode === 'red_bus' || dep.mode === 'q102_bus') {
		const bus = dep as BusDeparture;
		return bus.vehicleId ? `Vehicle #${bus.vehicleId}` : undefined;
	}
	return undefined;
}

function getBearingName(deg?: number): string {
	if (deg === undefined || Number.isNaN(deg)) return 'N';
	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
	const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
	return directions[index];
}

function formatVehicleDirectionLabel(v: LiveVehiclePosition): string {
	if (v.mode === 'q102_bus') {
		if (v.direction === 'queens_bound' || v.direction === 'northbound') return 'Astoria-Bound';
		return 'Coler-Bound';
	}
	return v.direction.replace('_', ' ');
}
</script>

<div class="w-72 sm:w-80 max-w-full space-y-3 font-sans text-text-main p-1">
	{#if stationMatch}
		<!-- 1. Citi Bike Station Popup Card -->
		{@const s = stationMatch}
		<div class="space-y-2.5">
			<!-- Header Row -->
			<div class="flex items-start justify-between gap-2 pr-6">
				<div>
					<div class="flex items-center gap-1.5">
						<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l1.5 5.5H12l-1.5-4.5L7.5 14M12 11.5L8.5 17.5"/></svg>
						</span>
						<h3 class="text-sm font-extrabold text-text-main leading-tight">{s.name}</h3>
					</div>
					<p class="text-[11px] text-text-muted mt-0.5">Citi Bike Station</p>
				</div>
			</div>

			<!-- Main Stats Grid -->
			<div class="grid grid-cols-2 gap-2">
				<div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
					<div class="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
						{s.bikesAvailable.total}
					</div>
					<div class="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider">
						Bikes Available
					</div>
				</div>

				<div class="p-2 rounded-xl bg-bg-elevated border border-border-subtle text-center">
					<div class="font-mono text-xl font-black text-text-main leading-none">
						{s.docksAvailable}
					</div>
					<div class="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider">
						Open Docks
					</div>
				</div>
			</div>

			<!-- Breakdown Badges -->
			<div class="flex items-center justify-between text-[11px] font-mono bg-bg-elevated px-2.5 py-1.5 rounded-lg border border-border-subtle">
				<span class="text-text-muted">Classic: <strong class="text-text-main">{s.bikesAvailable.classic}</strong></span>
				<span class="text-text-muted">E-Bikes: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">{s.bikesAvailable.ebike}</strong></span>
				<span class="text-text-muted">Total: <strong class="text-text-main">{s.capacity}</strong></span>
			</div>
		</div>

	{:else if vehicleMatch}
		<!-- 2. Live Vehicle Telemetry Popup Card -->
		{@const v = vehicleMatch}
		{@const modeColor = getModeColorClass(v.mode)}
		{@const speedMph = v.speedMps ? Math.round(v.speedMps * 2.23694) : 0}
		{@const speedKnots = v.speedMps ? Math.round(v.speedMps * 1.94384) : 0}
		{@const isFerry = v.mode === 'ferry'}
		{@const speedDisplay = isFerry ? `${speedKnots} kts` : `${speedMph} mph`}
		{@const bearingText = getBearingName(v.bearing)}

		{@const upcomingStops = getUpcomingStopsForVehicle(v, 4)}

		<div class="space-y-2.5">
			<!-- Header Row -->
			<div class="flex items-start justify-between gap-2 pr-6">
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6 h-6 rounded-full border shrink-0 {modeColor}">
						{#if v.mode === 'subway'}
							<HugeiconsIcon icon={Train01Icon} size={14} />
						{:else if v.mode === 'tram'}
							<HugeiconsIcon icon={CableCarIcon} size={14} />
						{:else if v.mode === 'ferry'}
							<HugeiconsIcon icon={FerryBoatIcon} size={14} />
						{:else}
							<HugeiconsIcon icon={Bus01Icon} size={14} />
						{/if}
					</span>
					<div>
						<h3 class="text-sm font-extrabold text-text-main leading-tight">
							{v.vehicleId ? `#${v.vehicleId}` : v.routeId}
						</h3>
						<p class="text-[11px] text-text-muted capitalize">
							{v.mode.replace('_', ' ')} ({formatVehicleDirectionLabel(v)})
						</p>
					</div>
				</div>
			</div>

			<!-- Telemetry Stats -->
			<div class="grid grid-cols-2 gap-2 text-xs font-mono">
				<div class="p-2 rounded-xl bg-bg-elevated border border-border-subtle flex items-center gap-2">
					<HugeiconsIcon icon={Navigation01Icon} size={14} class="text-text-muted shrink-0" />
					<div>
						<div class="text-[10px] text-text-muted uppercase font-bold">Speed</div>
						<div class="font-black text-text-main">{speedDisplay}</div>
					</div>
				</div>

				<div class="p-2 rounded-xl bg-bg-elevated border border-border-subtle flex items-center gap-2">
					<HugeiconsIcon icon={Compass01Icon} size={14} class="text-text-muted shrink-0" />
					<div>
						<div class="text-[10px] text-text-muted uppercase font-bold">Heading</div>
						<div class="font-black text-text-main">{v.bearing ?? 0}° ({bearingText})</div>
					</div>
				</div>
			</div>

			<!-- Destination Bar -->
			{#if v.destinationName}
				<div class="p-2 rounded-xl bg-bg-surface border border-border-default flex items-center justify-between text-xs">
					<span class="text-text-muted text-[11px]">Bound for</span>
					<strong class="text-text-main font-extrabold text-xs">{v.destinationName}</strong>
				</div>
			{/if}

			<!-- Upcoming Stops Timeline -->
			{#if upcomingStops.length > 0}
				<div class="space-y-1 pt-0.5">
					<div class="text-[10px] font-bold uppercase tracking-wider text-text-muted px-0.5">
						Upcoming Stops
					</div>

					<div class="p-2.5 rounded-xl bg-bg-surface border border-border-default space-y-2">
						{#each upcomingStops as stop, idx (stop.id)}
							<div class="relative pl-4.5">
								<!-- Connecting Line -->
								{#if idx < upcomingStops.length - 1}
									<div class="absolute left-0.75 top-[12px] -bottom-2 w-[1.5px] bg-border-subtle"></div>
								{/if}
								<!-- Dot centered on line 1 of title -->
								<div class="absolute left-0 top-1 w-2 h-2 rounded-full {idx === 0 ? 'bg-primary' : 'bg-border-hover'}"></div>

								<!-- Title, Clock Time & Relative Countdown -->
								<div class="text-xs leading-snug">
									<div class="flex items-center justify-between gap-2">
										<span class="font-bold text-text-main text-[11.5px] truncate">{stop.title}</span>
										{#if stop.formattedTime && stop.countdownText}
											<span class="font-mono text-[10px] text-text-muted shrink-0 font-medium">
												{stop.formattedTime} ({stop.countdownText})
											</span>
										{/if}
									</div>
									{#if stop.subtitle}
										<div class="text-[9.5px] text-text-muted truncate">{stop.subtitle}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

	{:else}
		<!-- 3. Fixed Transit Stop Popup Card -->
		{@const modeColor = getModeColorClass(stopMode)}
		{@const accent = getHeroAccentColor(stopMode)}

		<div class="space-y-2.5">
			<!-- Header Row -->
			<div class="flex items-start justify-between gap-2 pr-6">
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center justify-center w-6.5 h-6.5 rounded-full border shrink-0 {modeColor}">
						{#if stopMode === 'subway'}
							<HugeiconsIcon icon={Train01Icon} size={14} />
						{:else if stopMode === 'tram'}
							<HugeiconsIcon icon={CableCarIcon} size={14} />
						{:else if stopMode === 'ferry'}
							<HugeiconsIcon icon={FerryBoatIcon} size={14} />
						{:else}
							<HugeiconsIcon icon={Bus01Icon} size={14} />
						{/if}
					</span>
					<div>
						<h3 class="text-xs font-extrabold text-text-main leading-tight">{stopTitle}</h3>
						<p class="text-[10px] text-text-muted mt-0.5">{stopSubtitle}</p>
					</div>
				</div>

				{#if activeAlerts.length > 0}
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
						<HugeiconsIcon icon={AlertCircleIcon} size={10} />
						<span>Alert</span>
					</span>
				{/if}
			</div>

			<!-- Upcoming Departures List -->
			{#if stopDepartures.length > 0}
				<div class="space-y-2 max-h-56 overflow-y-auto pr-0.5">
					{#each stopDepartures.slice(0, 3) as dep (dep.id)}
						{@const pill = resolveHeroStatusPill(dep, accent)}
						{@const relTime = formatRelativeTime(dep.predictedTime || dep.scheduledTime)}
						{@const clockTime = new Date(dep.predictedTime || dep.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						{@const sub = formatDepartureSubDetails(dep)}

						<div class="p-2.5 rounded-xl border border-border-default bg-bg-surface space-y-1 shadow-2xs">
							<!-- Row 1: Status Pill & Relative Countdown -->
							<div class="flex items-center justify-between text-xs">
								<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase {pill.pillClass}">
									<HugeiconsIcon icon={pill.icon} size={9} />
									<span>{pill.label}</span>
								</span>
								<span class="font-mono text-xs font-bold text-text-main">{relTime}</span>
							</div>

							<!-- Row 2: Destination & Clock Time -->
							<div class="flex items-center justify-between pt-0.5 gap-2">
								<h4 class="text-xs font-bold text-text-main truncate">{dep.headsign}</h4>
								<span class="font-mono text-xs text-text-muted shrink-0">{clockTime}</span>
							</div>

							<!-- Row 3: Sub-details -->
							{#if sub}
								<div class="text-[9.5px] font-mono text-text-muted pt-0.5 truncate">
									{sub}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-3 text-center rounded-xl bg-bg-elevated text-text-muted text-xs font-mono">
					No live departures scheduled at this stop.
				</div>
			{/if}
		</div>
	{/if}
</div>
