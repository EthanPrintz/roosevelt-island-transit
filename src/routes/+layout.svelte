<script lang="ts">
import type { Snippet } from 'svelte';
import '../app.css';
import { BoatIcon, Train01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';

let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen flex flex-col bg-bg-base text-text-main font-sans selection:bg-primary selection:text-primary-fg">
	<!-- Top Application Navigation Bar -->
	<header class="sticky top-0 z-50 backdrop-blur-md bg-bg-surface/80 border-b border-border-subtle transition-colors">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
			<!-- Logo / Brand -->
			<a href="/" class="flex items-center gap-2.5 font-bold text-lg tracking-tight text-text-main hover:opacity-90 transition-opacity">
				<div class="p-2 rounded-xl bg-primary text-primary-fg shadow-xs flex items-center justify-center">
					<HugeiconsIcon icon={Train01Icon} size={20} strokeWidth={2.5} />
				</div>
				<div class="flex items-center gap-2">
					<span class="font-extrabold tracking-tight">Roosevelt Island Transit</span>
					<span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-bg-elevated text-text-muted border border-border-subtle hidden sm:inline-block">
						NYC • Live Core
					</span>
				</div>
			</a>

			<!-- Theme Toggle -->
			<div class="flex items-center gap-3">
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border-subtle bg-bg-surface/50 py-8 transition-colors mt-12">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
			<div class="flex items-center gap-2">
				<HugeiconsIcon icon={BoatIcon} size={15} strokeWidth={2} />
				<span>Roosevelt Island Live Public Transit Tracker</span>
			</div>
			<div class="font-mono text-[11px]">
				MTA Subway (F/M) • NYC Ferry (Astoria Line) • Citi Bike GBFS
			</div>
		</div>
	</footer>
</div>
