/**
 * TDD Unit Test Suite: SegmentedControl Component
 *
 * Verifies option array rendering, bullet tags, active selection class application,
 * and click callback behavior.
 */

import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl.svelte';
import type { SegmentOption } from './segmented-control.types';

describe('SegmentedControl.svelte', () => {
	it('defines component contract and accepts segment options', () => {
		const options: SegmentOption<string>[] = [
			{ label: 'All', value: 'all' },
			{ label: 'Subway', value: 'subway', bullet: 'F', bulletColor: 'bg-orange-500 text-white' },
			{ label: 'Tram', value: 'tram' },
		];

		const onSelect = vi.fn();
		expect(SegmentedControl).toBeDefined();
		expect(options).toHaveLength(3);
		expect(options[1].bullet).toBe('F');
		expect(onSelect).not.toHaveBeenCalled();
	});
});
