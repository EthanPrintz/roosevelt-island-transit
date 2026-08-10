<script lang="ts" generics="T">
import type { SegmentOption } from './segmented-control.types';

let {
	options,
	value,
	onSelect,
}: {
	options: SegmentOption<T>[];
	value: T;
	onSelect: (val: T) => void;
} = $props();
</script>

<div class="h-9 inline-flex items-center rounded-full bg-bg-surface border border-border-default p-1 gap-1 shadow-2xs">
	{#each options as opt}
		{@const isActive = opt.value === value}
		<button
			type="button"
			onclick={() => onSelect(opt.value)}
			class="h-7 px-3 rounded-full font-sans text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 {isActive
				? 'bg-primary text-primary-fg shadow-2xs'
				: 'text-text-muted hover:text-text-main hover:bg-bg-elevated/60'}"
		>
			{#if opt.bullet}
				<span
					class="w-3.5 h-3.5 rounded-full font-black text-[9px] flex items-center justify-center shadow-2xs shrink-0 {isActive
						? 'bg-primary-fg text-primary font-black'
						: (opt.bulletColor || 'bg-orange-500 text-white')}"
				>
					{opt.bullet}
				</span>
			{/if}
			<span>{opt.label}</span>
		</button>
	{/each}
</div>
