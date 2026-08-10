export type ThemeMode = 'system' | 'light' | 'dark';

class ThemeState {
	currentMode = $state<ThemeMode>('system');

	constructor() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
			if (stored && ['system', 'light', 'dark'].includes(stored)) {
				this.currentMode = stored;
			}
			this.applyTheme();
		}
	}

	setMode(mode: ThemeMode) {
		this.currentMode = mode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme-mode', mode);
			this.applyTheme();
		}
	}

	get isDark(): boolean {
		if (typeof window === 'undefined') return false;
		if (this.currentMode === 'dark') return true;
		if (this.currentMode === 'light') return false;
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	private applyTheme() {
		if (typeof window === 'undefined') return;

		if (this.currentMode === 'system') {
			delete document.documentElement.dataset.theme;
		} else {
			document.documentElement.dataset.theme = this.currentMode;
		}
	}
}

export const themeState = new ThemeState();
