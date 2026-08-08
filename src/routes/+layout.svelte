<script lang="ts">
import type { Snippet } from 'svelte';
import '../app.css';
import { CodeIcon, FlashIcon, Layers01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';

let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen flex flex-col bg-bg-base text-text-main font-sans selection:bg-primary selection:text-primary-fg">
	<!-- Top Navigation Bar -->
	<header class="sticky top-0 z-50 backdrop-blur-md bg-bg-surface/80 border-b border-border-subtle transition-colors">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
			<!-- Logo / Brand -->
			<a href="/" class="flex items-center gap-2.5 font-bold text-lg tracking-tight text-text-main hover:opacity-90 transition-opacity">
				<div class="p-2 rounded-xl bg-primary text-primary-fg shadow-xs flex items-center justify-center">
					<HugeiconsIcon icon={FlashIcon} size={20} strokeWidth={2.5} />
				</div>
				<span>Svelte 5 Base</span>
				<span class="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold rounded-full bg-bg-elevated text-text-muted border border-border-subtle">
					v1.0
				</span>
			</a>

			<!-- Quick Links & Theme Toggle -->
			<div class="flex items-center gap-3">
				<a
					href="https://svelte.dev/docs"
					target="_blank"
					rel="noreferrer"
					class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
				>
					<HugeiconsIcon icon={CodeIcon} size={15} strokeWidth={2} />
					<span>Docs</span>
				</a>
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
				<HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
				<span>Bun 1.3 + SvelteKit 2 + Svelte 5 + Tailwind v4 + Hugeicons</span>
			</div>
			<div>
				Fully declarative OKLCH design system base.
			</div>
		</div>
	</footer>
</div>
