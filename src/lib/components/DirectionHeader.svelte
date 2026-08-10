<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
	title: string;
	subtitle?: string;
	children?: Snippet;
}

let { title, subtitle, children }: Props = $props();
</script>

<div class="border-b border-border-subtle/80 pb-2 mb-2.5 space-y-0.5">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-xs font-extrabold text-text-main uppercase tracking-wider">
			{title}
		</h3>

		{#if children}
			{@render children()}
		{/if}
	</div>

	{#if subtitle}
		<div class="text-[10px] font-mono text-text-muted truncate">
			{subtitle}
		</div>
	{/if}
</div>
