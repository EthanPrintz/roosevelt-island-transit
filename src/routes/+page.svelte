<script lang="ts">
import {
	CheckmarkCircle01Icon,
	CodeIcon,
	Copy01Icon,
	DatabaseIcon,
	FlashIcon,
	Layout01Icon,
	PaintBoardIcon,
	RocketIcon,
	SearchingIcon,
	Settings01Icon,
	SparklesIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import Card from '$lib/components/Card.svelte';

// Svelte 5 Runes demo state
let count = $state(0);
let multiplier = $state(2);
let copied = $state(false);

// Svelte 5 $derived rune
let result = $derived(count * multiplier);
let isEven = $derived(count % 2 === 0);

function increment() {
	count += 1;
}

function decrement() {
	if (count > 0) count -= 1;
}

function reset() {
	count = 0;
}

async function copySnippet() {
	await navigator.clipboard.writeText('bun create svelte@latest my-app');
	copied = true;
	setTimeout(() => (copied = false), 2000);
}

const techStack = [
	{ name: 'Bun v1.3', desc: 'Ultra-fast JS runtime & package manager', tag: 'Runtime' },
	{ name: 'Svelte v5.4+', desc: 'Next-gen reactivity engine with Runes', tag: 'Framework' },
	{
		name: 'SvelteKit v2.4+',
		desc: 'Full-stack framework with SSR & file routing',
		tag: 'Fullstack',
	},
	{ name: 'Tailwind CSS v4.1+', desc: 'CSS-first theme architecture with OKLCH', tag: 'Styling' },
	{ name: 'Hugeicons', desc: '4,000+ crisp vector icon library', tag: 'Icons' },
	{ name: 'Biome v2.3', desc: 'High performance formatting & linting', tag: 'Tooling' },
];

const sampleIcons = [
	{ name: 'Flash', icon: FlashIcon },
	{ name: 'Sparkles', icon: SparklesIcon },
	{ name: 'Rocket', icon: RocketIcon },
	{ name: 'Code', icon: CodeIcon },
	{ name: 'Database', icon: DatabaseIcon },
	{ name: 'Palette', icon: PaintBoardIcon },
	{ name: 'Layout', icon: Layout01Icon },
	{ name: 'Settings', icon: Settings01Icon },
	{ name: 'Search', icon: SearchingIcon },
];
</script>

<svelte:head>
	<title>Bun + Svelte 5 + Tailwind v4 Base</title>
	<meta name="description" content="Blank Bun + SvelteKit + Tailwind CSS v4 + Hugeicons base template with declarative OKLCH theme." />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
	<!-- Hero Section -->
	<section class="text-center space-y-6 max-w-3xl mx-auto">
		<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-surface border border-border-default shadow-2xs text-xs font-medium text-text-muted">
			<HugeiconsIcon icon={SparklesIcon} size={14} class="text-primary" />
			<span>Declarative Neutral Base Theme System</span>
		</div>

		<h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-main leading-tight">
			Bun + SvelteKit 2 + Svelte 5 + Tailwind v4
		</h1>

		<p class="text-base sm:text-lg text-text-muted leading-relaxed">
			Fully aligned with 2026 recommended best practices. Scaffolding built with Svelte 5 Runes, Tailwind CSS v4 CSS-first design system, and Hugeicons vector icons.
		</p>

		<!-- Command Bar -->
		<div class="inline-flex items-center gap-3 p-2 pl-4 rounded-xl bg-bg-surface border border-border-default shadow-xs text-xs font-mono text-text-main max-w-full overflow-x-auto">
			<span>$ bun run dev</span>
			<button
				type="button"
				onclick={copySnippet}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated text-text-muted hover:text-text-main hover:bg-border-subtle transition-all cursor-pointer font-sans text-xs font-medium"
			>
				<HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={14} />
				<span>{copied ? 'Copied' : 'Copy'}</span>
			</button>
		</div>
	</section>

	<!-- Tech Stack Grid -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold tracking-tight text-text-main">Architecture & Stack</h2>
			<span class="text-xs text-text-muted">Strict TypeScript & Biome setup</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each techStack as item}
				<Card title={item.name} subtitle={item.tag} icon={CheckmarkCircle01Icon}>
					{item.desc}
				</Card>
			{/each}
		</div>
	</section>

	<!-- Interactive Svelte 5 Runes Demo -->
	<section class="p-8 rounded-2xl bg-bg-surface border border-border-default shadow-xs space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
			<div>
				<h2 class="text-xl font-bold text-text-main flex items-center gap-2">
					<HugeiconsIcon icon={CodeIcon} size={20} class="text-primary" />
					Svelte 5 Runes Demo
				</h2>
				<p class="text-xs text-text-muted mt-1">
					Testing reactive state (<code class="text-primary font-mono">$state</code>) and derived computations (<code class="text-primary font-mono">$derived</code>).
				</p>
			</div>
			<div class="flex items-center gap-2">
				<span class="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-bg-elevated border border-border-subtle text-text-muted">
					Count Status: {isEven ? 'Even' : 'Odd'}
				</span>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
			<div class="space-y-2">
				<label for="count-counter" class="text-xs font-semibold uppercase tracking-wider text-text-muted block">Counter Value ($state)</label>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={decrement}
						class="w-10 h-10 rounded-xl bg-bg-elevated border border-border-default text-text-main hover:bg-border-subtle transition-colors flex items-center justify-center font-bold text-lg cursor-pointer"
					>
						-
					</button>
					<span id="count-counter" class="flex-1 text-center font-mono font-bold text-2xl text-text-main py-1.5 rounded-xl bg-bg-base border border-border-subtle">
						{count}
					</span>
					<button
						type="button"
						onclick={increment}
						class="w-10 h-10 rounded-xl bg-bg-elevated border border-border-default text-text-main hover:bg-border-subtle transition-colors flex items-center justify-center font-bold text-lg cursor-pointer"
					>
						+
					</button>
				</div>
			</div>

			<div class="space-y-2">
				<label for="multiplier-select" class="text-xs font-semibold uppercase tracking-wider text-text-muted block">Multiplier ($state)</label>
				<select
					id="multiplier-select"
					bind:value={multiplier}
					class="w-full h-10 px-3 rounded-xl bg-bg-base border border-border-default text-text-main text-sm font-medium focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
				>
					<option value={2}>2x Multiplier</option>
					<option value={5}>5x Multiplier</option>
					<option value={10}>10x Multiplier</option>
				</select>
			</div>

			<div class="space-y-2">
				<label for="result-display" class="text-xs font-semibold uppercase tracking-wider text-text-muted block">Derived Output ($derived)</label>
				<div id="result-display" class="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
					<span class="text-xs font-medium text-primary">count × multiplier</span>
					<span class="font-mono font-bold text-base text-primary">{result}</span>
				</div>
			</div>
		</div>

		<div class="flex justify-end pt-2">
			<button
				type="button"
				onclick={reset}
				class="text-xs font-medium text-text-muted hover:text-text-main underline underline-offset-4 cursor-pointer"
			>
				Reset Counter
			</button>
		</div>
	</section>

	<!-- Hugeicons Vector Component Showcase -->
	<section class="space-y-6">
		<div>
			<h2 class="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
				<HugeiconsIcon icon={RocketIcon} size={20} class="text-primary" />
				Hugeicons Integration Showcase
			</h2>
			<p class="text-xs text-text-muted mt-1">
				Using official <code class="font-mono text-primary">@hugeicons/svelte</code> with <code class="font-mono text-primary">@hugeicons/core-free-icons</code>.
			</p>
		</div>

		<div class="grid grid-cols-3 sm:grid-cols-9 gap-3">
			{#each sampleIcons as item}
				<div class="flex flex-col items-center justify-center p-4 rounded-xl bg-bg-surface border border-border-default hover:border-border-hover transition-all duration-150 group">
					<div class="text-text-muted group-hover:text-primary transition-colors">
						<HugeiconsIcon icon={item.icon} size={24} strokeWidth={1.75} />
					</div>
					<span class="text-[11px] font-medium text-text-muted mt-2 group-hover:text-text-main transition-colors">
						{item.name}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Declarative Color Tokens & Primitives Showcase -->
	<section class="p-8 rounded-2xl bg-bg-surface border border-border-default shadow-xs space-y-6">
		<div>
			<h2 class="text-xl font-bold text-text-main flex items-center gap-2">
				<HugeiconsIcon icon={PaintBoardIcon} size={20} class="text-primary" />
				Declarative OKLCH Theme Tokens
			</h2>
			<p class="text-xs text-text-muted mt-1">
				These UI element tokens update dynamically when toggling between light, dark, and OS system modes.
			</p>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div class="p-4 rounded-xl bg-bg-base border border-border-default space-y-1">
				<span class="text-xs font-semibold text-text-main block">Background Base</span>
				<span class="text-[11px] font-mono text-text-muted block">--color-bg-base</span>
			</div>
			<div class="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
				<span class="text-xs font-semibold text-text-main block">Surface Card</span>
				<span class="text-[11px] font-mono text-text-muted block">--color-bg-surface</span>
			</div>
			<div class="p-4 rounded-xl bg-bg-elevated border border-border-default space-y-1">
				<span class="text-xs font-semibold text-text-main block">Elevated Element</span>
				<span class="text-[11px] font-mono text-text-muted block">--color-bg-elevated</span>
			</div>
			<div class="p-4 rounded-xl bg-primary text-primary-fg space-y-1">
				<span class="text-xs font-semibold block">Primary Brand</span>
				<span class="text-[11px] font-mono opacity-90 block">--color-primary</span>
			</div>
		</div>
	</section>
</div>
