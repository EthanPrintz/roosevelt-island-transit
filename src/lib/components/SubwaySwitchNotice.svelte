<script lang="ts">
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import type { TransitAlert } from '$lib/transit/domain/types';

let { alert }: { alert?: TransitAlert } = $props();
</script>

{#if alert}
	<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-2xs">
		<div class="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
			<HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={2} />
		</div>
		<div class="flex-1 space-y-1">
			<div class="flex items-center gap-2">
				<span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
					63rd St Service Switch
				</span>
				<h4 class="text-sm font-bold text-text-main">{alert.title}</h4>
			</div>
			<p class="text-xs text-text-muted leading-relaxed">{alert.description}</p>
		</div>
	</div>
{/if}
