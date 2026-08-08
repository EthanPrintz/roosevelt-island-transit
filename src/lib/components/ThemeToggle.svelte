<script lang="ts">
import { ComputerIcon, Moon01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/svelte';
import { type ThemeMode, themeState } from '$lib/state/theme.svelte';

const modes: { mode: ThemeMode; label: string; icon: any }[] = [
	{ mode: 'light', label: 'Light', icon: Sun01Icon },
	{ mode: 'dark', label: 'Dark', icon: Moon01Icon },
	{ mode: 'system', label: 'System', icon: ComputerIcon },
];
</script>

<div class="inline-flex items-center p-1 rounded-xl bg-bg-surface border border-border-default shadow-xs transition-colors">
	{#each modes as { mode, label, icon }}
		<button
			type="button"
			onclick={() => themeState.setMode(mode)}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer {themeState.currentMode === mode ? 'bg-primary text-primary-fg shadow-xs font-semibold' : 'text-text-muted hover:text-text-main hover:bg-bg-elevated'}"
			aria-label="{label} theme"
		>
			<HugeiconsIcon icon={icon} size={15} strokeWidth={2} />
			<span>{label}</span>
		</button>
	{/each}
</div>
