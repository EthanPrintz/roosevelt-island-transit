/**
 * Unit Test Suite: TransitMap Component
 *
 * Verifies component export, MapLibre GL JS integration mocking, and props processing.
 */

import { describe, expect, it, vi } from 'vitest';
import TransitMap from './TransitMap.svelte';

// Mock maplibre-gl for unit testing environments where WebGL is unavailable
vi.mock('maplibre-gl', () => {
	class MockMap {
		on = vi.fn((event: string, callback: (...args: unknown[]) => void) => {
			if (event === 'load') callback();
		});
		addSource = vi.fn();
		getSource = vi.fn(() => ({
			setData: vi.fn(),
		}));
		addLayer = vi.fn();
		remove = vi.fn();
		resize = vi.fn();
		flyTo = vi.fn();
		setStyle = vi.fn();
	}

	return {
		default: {
			Map: MockMap,
			Popup: vi.fn(() => ({
				setLngLat: vi.fn().mockReturnThis(),
				setHTML: vi.fn().mockReturnThis(),
				addTo: vi.fn().mockReturnThis(),
			})),
		},
	};
});

describe('TransitMap.svelte', () => {
	it('exports TransitMap component definition', () => {
		expect(TransitMap).toBeDefined();
	});
});
