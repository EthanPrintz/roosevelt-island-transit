<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
	title: string;
	subtitle?: string;
	children?: Snippet;
}

let { title, subtitle, children }: Props = $props();
</script>

<div class="flex items-center justify-between border-b border-border-subtle/80 pb-2.5 mb-3">
	<div class="flex items-center gap-2">
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
