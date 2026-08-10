<script lang="ts">
import type { Snippet } from 'svelte';
import '../app.css';
import {
	CableCarIcon,
	Clock01Icon,
	LayoutGridIcon,
	MapsIcon,
	RefreshIcon,
	SidebarLeftIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import SegmentedControl from '$lib/components/SegmentedControl.svelte';
import type { SegmentOption } from '$lib/components/segmented-control.types';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { mapSettings } from '$lib/state/map-settings.svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';

let { children }: { children: Snippet } = $props();

const windowOptions: SegmentOption<number>[] = [
	{ value: 120, label: '2h' },
	{ value: 240, label: '4h' },
	{ value: 360, label: '6h' },
	{ value: 480, label: '8h' },
];
</script>

<div class="min-h-screen flex flex-col bg-bg-base text-text-main font-sans selection:bg-primary selection:text-primary-fg">
	<!-- Top Application Navigation Header -->
	<header class="sticky top-0 z-50 backdrop-blur-md bg-bg-surface/80 border-b border-border-subtle transition-colors">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
			<!-- Brand Logo / Title -->
			<a href="/" class="flex items-center gap-2.5 font-bold text-sm tracking-tight text-text-main hover:opacity-90 transition-opacity shrink-0">
				<div class="p-2 rounded-xl bg-primary text-primary-fg shadow-xs flex items-center justify-center relative">
					<HugeiconsIcon icon={CableCarIcon} size={18} strokeWidth={2.5} />
				</div>
				<div class="flex items-center gap-2">
					<span class="font-extrabold tracking-tight text-base">Roosevelt Island Transit</span>
				</div>
			</a>

			<!-- Right Header Controls: Horizon + Single Inset Action Pill -->
			<div class="flex items-center gap-2">
				<!-- Compact Horizon Control -->
				<div class="hidden md:flex items-center">
					<SegmentedControl
						options={windowOptions}
						value={transitSettings.selectedWindow}
						onSelect={(val) => transitSettings.setWindow(val)}
					/>
				</div>

				<!-- Single Unified Inset Action Pill (Sync + Time + Theme + View Mode Icons) -->
				<div class="h-9 px-1.5 rounded-full border border-border-default bg-bg-surface flex items-center gap-1.5 shadow-2xs">
					<!-- Sync Button -->
					<button
						onclick={() => transitSettings.triggerRefresh()}
						disabled={transitSettings.isLoading}
						class="h-7 px-2.5 rounded-full text-xs font-bold text-text-main hover:bg-bg-elevated/60 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
						title="Refresh Live Data"
					>
						<HugeiconsIcon icon={RefreshIcon} size={13} class={transitSettings.isLoading ? 'animate-spin text-primary' : 'text-text-muted'} />
						<span class="text-xs font-bold hidden sm:inline">{transitSettings.isLoading ? 'Syncing' : 'Sync'}</span>
					</button>

					{#if transitSettings.fetchedAt}
						<div class="h-4 w-px bg-border-subtle hidden lg:block"></div>
						<div class="h-7 px-1.5 text-[11px] font-mono text-text-muted hidden lg:flex items-center gap-1">
							<HugeiconsIcon icon={Clock01Icon} size={11} />
							<span>{new Date(transitSettings.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						</div>
					{/if}

					<div class="h-4 w-px bg-border-subtle"></div>

					<!-- Theme Toggle -->
					<ThemeToggle />

					<div class="h-4 w-px bg-border-subtle"></div>

					<!-- View Mode Icon Switcher (Right of Theme, inset in same pill) -->
					<div class="flex items-center gap-0.5">
						<button
							type="button"
							onclick={() => mapSettings.setViewMode('split')}
							class="w-7 h-7 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center {mapSettings.viewMode === 'split' ? 'bg-primary text-primary-fg shadow-2xs' : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/60'}"
							aria-label="Split View"
							title="Split View"
						>
							<HugeiconsIcon icon={SidebarLeftIcon} size={14} strokeWidth={2} />
						</button>
						<button
							type="button"
							onclick={() => mapSettings.setViewMode('cards')}
							class="w-7 h-7 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center {mapSettings.viewMode === 'cards' ? 'bg-primary text-primary-fg shadow-2xs' : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/60'}"
							aria-label="Cards View"
							title="Cards View"
						>
							<HugeiconsIcon icon={LayoutGridIcon} size={14} strokeWidth={2} />
						</button>
						<button
							type="button"
							onclick={() => mapSettings.setViewMode('map')}
							class="w-7 h-7 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center {mapSettings.viewMode === 'map' ? 'bg-primary text-primary-fg shadow-2xs' : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/60'}"
							aria-label="Map View"
							title="Map View"
						>
							<HugeiconsIcon icon={MapsIcon} size={14} strokeWidth={2} />
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border-subtle bg-bg-surface/50 py-6 transition-colors mt-8">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
			<div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={CableCarIcon} size={14} strokeWidth={2} class="text-primary" />
					<span class="font-bold text-text-main">Roosevelt Island Transit</span>
				</div>
				<div>
					Created by
					<a
						href="https://ethanprintz.com"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-text-main hover:text-primary underline decoration-border-default hover:decoration-primary underline-offset-2 transition-colors"
					>Ethan Printz</a>,
					Founder of
					<a
						href="https://rooseveltisland.studio"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-text-main hover:text-primary underline decoration-border-default hover:decoration-primary underline-offset-2 transition-colors"
					>Roosevelt Island Studio</a>
				</div>
			</div>

			<div class="font-mono text-[11px] text-text-muted">
				Subway / Tram / Ferry / Citi Bike
			</div>
		</div>
	</footer>
</div>
