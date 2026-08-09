<script lang="ts">
import type { Snippet } from 'svelte';
import '../app.css';
import { BoatIcon, Clock01Icon, RefreshIcon, Train01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { transitSettings } from '$lib/state/transit-settings.svelte';

let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen flex flex-col bg-bg-base text-text-main font-sans selection:bg-primary selection:text-primary-fg">
	<!-- Top Application Navigation Bar with Integrated Unified Control Bar -->
	<header class="sticky top-0 z-50 backdrop-blur-md bg-bg-surface/80 border-b border-border-subtle transition-colors">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
			<!-- Logo / Brand with Live Status Indicator -->
			<a href="/" class="flex items-center gap-2.5 font-bold text-sm tracking-tight text-text-main hover:opacity-90 transition-opacity shrink-0">
				<div class="p-1.5 rounded-xl bg-primary text-primary-fg shadow-xs flex items-center justify-center relative">
					<HugeiconsIcon icon={Train01Icon} size={18} strokeWidth={2.5} />
				</div>
				<div class="flex items-center gap-2">
					<span class="font-extrabold tracking-tight">Roosevelt Island Transit</span>
					<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse hidden sm:inline-block"></span>
				</div>
			</a>

			<!-- Single Integrated Control Toolbar -->
			<div class="flex items-center gap-2 rounded-2xl bg-bg-surface border border-border-default/90 p-1 shadow-2xs">
				<!-- Window Selector Segment -->
				<div class="flex items-center rounded-xl bg-bg-elevated/60 p-0.5">
					{#each [120, 240, 360, 480] as win}
						<button
							onclick={() => transitSettings.setWindow(win)}
							class="px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer {transitSettings.selectedWindow === win
								? 'bg-primary text-primary-fg shadow-2xs'
								: 'text-text-muted hover:text-text-main'}"
						>
							{win / 60}h
						</button>
					{/each}
				</div>

				<div class="h-4 w-px bg-border-default/80"></div>

				<!-- Refresh Action Button -->
				<button
					onclick={() => transitSettings.triggerRefresh()}
					disabled={transitSettings.isLoading}
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-bg-elevated/60 hover:bg-bg-elevated text-text-main text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
					title="Refresh Live Data"
				>
					<HugeiconsIcon icon={RefreshIcon} size={13} class={transitSettings.isLoading ? 'animate-spin text-primary' : 'text-text-muted'} />
					<span class="hidden sm:inline-block text-[11px]">{transitSettings.isLoading ? 'Syncing...' : 'Sync'}</span>
				</button>

				{#if transitSettings.fetchedAt}
					<div class="h-4 w-px bg-border-default/80 hidden lg:block"></div>
					<div class="hidden lg:flex items-center gap-1 font-mono text-[10px] text-text-muted px-1">
						<HugeiconsIcon icon={Clock01Icon} size={11} />
						<span>{new Date(transitSettings.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
					</div>
				{/if}

				<div class="h-4 w-px bg-border-default/80"></div>

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
				<HugeiconsIcon icon={BoatIcon} size={14} strokeWidth={2} />
				<span>Roosevelt Island Transit</span>
			</div>
			<div class="font-mono text-[11px]">
				Subway • Ferry • Citi Bike
			</div>
		</div>
	</footer>
</div>
