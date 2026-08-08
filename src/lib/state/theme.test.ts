import { describe, expect, it } from 'vitest';
import { themeState } from './theme.svelte';

describe('ThemeState', () => {
	it('has default system mode', () => {
		expect(themeState.currentMode).toBe('system');
	});

	it('updates mode on setMode', () => {
		themeState.setMode('dark');
		expect(themeState.currentMode).toBe('dark');
		themeState.setMode('light');
		expect(themeState.currentMode).toBe('light');
		themeState.setMode('system');
		expect(themeState.currentMode).toBe('system');
	});
});
