<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
	title: string;
	subtitle?: string;
	dotColorClass?: string;
	badges?: Array<{ text: string; bgClass?: string }>;
	children?: Snippet;
}

let { title, subtitle, dotColorClass, badges = [], children }: Props = $props();
</script>

<div class="flex items-center justify-between border-b border-border-subtle/80 pb-2.5 mb-3">
	<div class="flex items-center gap-2">
		{#if badges.length > 0}
			<div class="flex items-center gap-1">
				{#each badges as badge}
					<span class={badge.bgClass || 'bullet-subway text-[9px]'}>{badge.text}</span>
				{/each}
			</div>
		{:else if dotColorClass}
			<span class="w-2 h-2 rounded-full {dotColorClass} shrink-0"></span>
		{/if}

		<h3 class="text-xs font-bold text-text-main uppercase tracking-wider">
			{title}
		</h3>

		{#if children}
			{@render children()}
		{/if}
	</div>

	{#if subtitle}
		<span class="text-[10px] font-mono text-text-muted">
			{subtitle}
		</span>
	{/if}
</div>
