<script lang="ts">
import type { Snippet } from 'svelte';
import { mapSettings, type SheetSnapPosition } from '$lib/state/map-settings.svelte';

let { children } = $props<{ children: Snippet }>();

function setSnap(snap: SheetSnapPosition) {
	mapSettings.setSheetSnap(snap);
}

let snapClasses = $derived.by(() => {
	switch (mapSettings.sheetSnap) {
		case 'peek':
			return 'h-[120px]';
		case 'half':
			return 'h-[50vh] sm:h-[60vh]';
		case 'full':
			return 'h-[88vh]';
		default:
			return 'h-[50vh]';
	}
});
</script>

<div
	class="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-bg-surface/95 backdrop-blur-xl border-t border-border-default shadow-2xl transition-all duration-300 ease-out rounded-t-2xl lg:hidden {snapClasses}"
>
	<!-- Drag Handle / Grabber Bar -->
	<div
		class="w-full py-2.5 flex items-center justify-center cursor-pointer touch-none select-none"
		onclick={() => {
			if (mapSettings.sheetSnap === 'peek') setSnap('half');
			else if (mapSettings.sheetSnap === 'half') setSnap('full');
			else setSnap('peek');
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				if (mapSettings.sheetSnap === 'peek') setSnap('half');
				else if (mapSettings.sheetSnap === 'half') setSnap('full');
				else setSnap('peek');
			}
		}}
		role="button"
		tabindex="0"
		aria-label="Toggle drawer height"
	>
		<div class="w-12 h-1.5 rounded-full bg-border-hover hover:bg-text-muted transition-colors"></div>
	</div>

	<!-- Snap Quick Controls -->
	<div class="px-4 pb-2 flex items-center justify-between border-b border-border-subtle text-xs text-text-muted">
		<span class="font-bold text-text-main">Transit Live View</span>
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => setSnap('peek')}
				class="px-2 py-0.5 rounded-full text-xs font-bold border transition-colors {mapSettings.sheetSnap === 'peek'
					? 'bg-primary text-primary-fg border-transparent shadow-2xs'
					: 'border-border-subtle text-text-muted hover:text-text-main'}"
			>
				Peek
			</button>
			<button
				type="button"
				onclick={() => setSnap('half')}
				class="px-2 py-0.5 rounded-full text-xs font-bold border transition-colors {mapSettings.sheetSnap === 'half'
					? 'bg-primary text-primary-fg border-transparent shadow-2xs'
					: 'border-border-subtle text-text-muted hover:text-text-main'}"
			>
				Half
			</button>
			<button
				type="button"
				onclick={() => setSnap('full')}
				class="px-2 py-0.5 rounded-full text-xs font-bold border transition-colors {mapSettings.sheetSnap === 'full'
					? 'bg-primary text-primary-fg border-transparent shadow-2xs'
					: 'border-border-subtle text-text-muted hover:text-text-main'}"
			>
				Full
			</button>
		</div>
	</div>

	<!-- Drawer Content Container -->
	<div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
		{@render children()}
	</div>
</div>
