<script lang="ts">
import type { Snippet } from 'svelte';
import '../app.css';
import { CableCarIcon, Clock01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';

let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen flex flex-col bg-bg-base text-text-main font-sans selection:bg-primary selection:text-primary-fg">
	<!-- Top Application Navigation Bar -->
	<header class="sticky top-0 z-50 backdrop-blur-md bg-bg-surface/80 border-b border-border-subtle transition-colors">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
			<!-- Logo / Brand with Live Status Indicator -->
			<a href="/" class="flex items-center gap-2.5 font-bold text-sm tracking-tight text-text-main hover:opacity-90 transition-opacity shrink-0">
				<div class="p-1.5 rounded-xl bg-primary text-primary-fg shadow-xs flex items-center justify-center relative">
					<HugeiconsIcon icon={CableCarIcon} size={18} strokeWidth={2.5} />
				</div>
				<div class="flex items-center gap-2">
					<span class="font-extrabold tracking-tight">Roosevelt Island Transit</span>
				</div>
			</a>

			<!-- Top Header Action Toolbar -->
			<div class="h-9 px-2 rounded-full border border-border-default bg-bg-surface flex items-center gap-2 shadow-2xs">
				<!-- Sync Action Button -->
				<button
					onclick={() => transitSettings.triggerRefresh()}
					disabled={transitSettings.isLoading}
					class="h-7 px-2.5 rounded-lg text-xs font-bold text-text-main hover:bg-bg-elevated/60 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
					title="Refresh Live Data"
				>
					<HugeiconsIcon icon={RefreshIcon} size={13} class={transitSettings.isLoading ? 'animate-spin text-primary' : 'text-text-muted'} />
					<span class="text-[11px] font-medium">{transitSettings.isLoading ? 'Syncing' : 'Sync'}</span>
				</button>

				{#if transitSettings.fetchedAt}
					<div class="h-4 w-px bg-border-subtle hidden sm:block"></div>
					<div class="h-7 px-1.5 text-[10px] font-mono text-text-muted hidden sm:flex items-center gap-1">
						<HugeiconsIcon icon={Clock01Icon} size={11} />
						<span>{new Date(transitSettings.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
					</div>
				{/if}

				<div class="h-4 w-px bg-border-subtle"></div>

				<!-- Theme Selector Segment -->
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border-subtle bg-bg-surface/50 py-6 transition-colors mt-8">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
			<div class="flex items-center gap-2">
				<HugeiconsIcon icon={CableCarIcon} size={14} strokeWidth={2} />
				<span>Roosevelt Island Transit</span>
			</div>
			<div class="font-mono text-[11px]">
				Subway • Tram • Ferry • Citi Bike
			</div>
		</div>
	</footer>
</div>
