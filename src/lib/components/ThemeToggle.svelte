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

<div class="flex items-center gap-0.5">
	{#each modes as { mode, label, icon }}
		<button
			type="button"
			onclick={() => themeState.setMode(mode)}
			class="w-7 h-7 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center {themeState.currentMode === mode ? 'bg-primary text-primary-fg shadow-2xs' : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/60'}"
			aria-label="{label} theme"
			title="{label} theme"
		>
			{#key icon}
				<HugeiconsIcon icon={icon} size={14} strokeWidth={2} />
			{/key}
		</button>
	{/each}
</div>
