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
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
			<!-- Logo / Brand -->
			<a href="/" class="flex items-center gap-2 font-bold text-base tracking-tight text-text-main hover:opacity-90 transition-opacity">
				<div class="p-1.5 rounded-lg bg-primary text-primary-fg shadow-xs flex items-center justify-center">
					<HugeiconsIcon icon={Train01Icon} size={18} strokeWidth={2.5} />
				</div>
				<span class="font-black tracking-tight">Roosevelt Island Transit</span>
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
