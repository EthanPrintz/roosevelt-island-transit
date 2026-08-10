/**
 * Unit Test Suite: Map Settings State Module
 *
 * Verifies Svelte 5 state runes, layer visibility toggles, view mode switching,
 * entity selection tracking, and OpenFreeMap style calculation.
 */

import { describe, expect, it } from 'vitest';
import { mapSettings } from './map-settings.svelte';

describe('map-settings.svelte.ts', () => {
	it('provides default initial state values', () => {
		expect(mapSettings.viewMode).toBe('split');
		expect(mapSettings.sheetSnap).toBe('half');
		expect(mapSettings.showSubway).toBe(true);
		expect(mapSettings.showTram).toBe(true);
		expect(mapSettings.showFerry).toBe(true);
		expect(mapSettings.showBuses).toBe(true);
		expect(mapSettings.showCitiBike).toBe(true);
		expect(mapSettings.selectedEntityId).toBeNull();
	});

	it('toggles individual transit layer visibility', () => {
		mapSettings.toggleLayer('citibike');
		expect(mapSettings.showCitiBike).toBe(false);

		mapSettings.toggleLayer('citibike');
		expect(mapSettings.showCitiBike).toBe(true);
	});

	it('updates view mode cleanly', () => {
		mapSettings.setViewMode('map');
		expect(mapSettings.viewMode).toBe('map');

		mapSettings.setViewMode('cards');
		expect(mapSettings.viewMode).toBe('cards');

		mapSettings.setViewMode('split');
		expect(mapSettings.viewMode).toBe('split');
	});

	it('tracks entity selection and allows clearing selection', () => {
		mapSettings.selectEntity('bus-101', [40.7615, -73.9496]);
		expect(mapSettings.selectedEntityId).toBe('bus-101');
		expect(mapSettings.selectedCoords).toEqual([40.7615, -73.9496]);

		mapSettings.clearSelection();
		expect(mapSettings.selectedEntityId).toBeNull();
		expect(mapSettings.selectedCoords).toBeNull();
	});

	it('calculates OpenFreeMap style endpoint based on style name or theme', () => {
		mapSettings.setStyle('dark');
		expect(mapSettings.styleUrl).toBe('https://tiles.openfreemap.org/styles/dark');

		mapSettings.setStyle('liberty');
		expect(mapSettings.styleUrl).toBe('https://tiles.openfreemap.org/styles/liberty');
	});
});
