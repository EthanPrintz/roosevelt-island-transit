<script lang="ts">
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { Snippet } from 'svelte';
import type { TransitAlert } from '$lib/transit/domain/types';

interface Props {
	title: string;
	icon: any;
	iconBgClass?: string;
	badgeText?: string;
	badgeClass?: string;
	alerts?: TransitAlert[];
	children?: Snippet;
}

let {
	title,
	icon,
	iconBgClass = 'bg-primary/10 text-primary',
	badgeText,
	badgeClass = 'bg-bg-surface text-text-muted border-border-default',
	alerts = [],
	children,
}: Props = $props();
</script>

<div class="space-y-2 mb-4">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl {iconBgClass} flex items-center justify-center shrink-0">
				<HugeiconsIcon {icon} size={18} strokeWidth={2.2} />
			</div>
			<div class="flex items-center gap-2 flex-wrap">
				<h2 class="text-base font-extrabold tracking-tight text-text-main">{title}</h2>
				{#if badgeText}
					<span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border {badgeClass}">
						{badgeText}
					</span>
				{/if}
			</div>
		</div>

		{#if children}
			<div class="shrink-0">
				{@render children()}
			</div>
		{/if}
	</div>

	<!-- In-Context Alert Banners -->
	{#if alerts.length > 0}
		<div class="space-y-1.5 pt-1">
			{#each alerts as alert (alert.id)}
				<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
					<div class="font-bold leading-tight">{alert.title}</div>
					{#if alert.description}
						<div class="text-[11px] opacity-90 mt-0.5 line-clamp-2">{alert.description}</div>
					{/if}
				</div>

			{/each}
		</div>
	{/if}
</div>
