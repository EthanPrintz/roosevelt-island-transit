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

<div class="inline-flex items-center p-0.5 rounded-xl bg-bg-elevated/70 border border-border-default/80">
	{#each modes as { mode, label, icon }}
		<button
			type="button"
			onclick={() => themeState.setMode(mode)}
			class="p-1.5 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center {themeState.currentMode === mode ? 'bg-primary text-primary-fg shadow-xs' : 'text-text-muted hover:text-text-main hover:bg-bg-surface/50'}"
			aria-label="{label} theme"
			title="{label} theme"
		>
			<HugeiconsIcon icon={icon} size={14} strokeWidth={2} />
		</button>
	{/each}
</div>
