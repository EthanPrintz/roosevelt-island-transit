<script lang="ts">
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { Snippet } from 'svelte';

let {
	title,
	icon,
	subtitle,
	children,
}: {
	title?: string;
	icon?: any;
	subtitle?: string;
	children: Snippet;
} = $props();
</script>

<div class="flex flex-col p-6 rounded-2xl bg-bg-surface border border-border-default shadow-xs hover:border-border-hover transition-all duration-200">
	{#if title || icon}
		<div class="flex items-center gap-3 mb-3">
			{#if icon}
				<div class="p-2.5 rounded-xl bg-bg-elevated text-primary border border-border-subtle flex items-center justify-center">
					<HugeiconsIcon icon={icon} size={20} strokeWidth={2} />
				</div>
			{/if}
			{#if title}
				<div>
					<h3 class="text-base font-semibold text-text-main leading-tight">{title}</h3>
					{#if subtitle}
						<p class="text-xs text-text-muted mt-0.5">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	<div class="text-sm text-text-muted flex-1 leading-relaxed">
		{@render children()}
	</div>
</div>
