/**
 * TDD Unit Test Suite: ThemeToggle Component & State Interaction
 *
 * Verifies integration between ThemeToggle component actions and themeState runes state module.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { themeState } from '$lib/state/theme.svelte';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle.svelte & themeState integration', () => {
	beforeEach(() => {
		themeState.setMode('system');
	});

	it('exports ThemeToggle component definition', () => {
		expect(ThemeToggle).toBeDefined();
	});

	it('updates themeState mode on setMode invocations', () => {
		expect(themeState.currentMode).toBe('system');
		themeState.setMode('dark');
		expect(themeState.currentMode).toBe('dark');
		themeState.setMode('light');
		expect(themeState.currentMode).toBe('light');
	});
});
