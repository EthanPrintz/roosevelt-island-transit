/**
 * TDD Test Suite: SvelteKit Server API Endpoint (/api/transit)
 *
 * Verifies request parameter parsing, server-side caching integration,
 * response JSON payload structure, and Cache-Control headers.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { serverCache } from '$lib/server/cache';
import { GET } from './+server';

describe('GET /api/transit (server.ts)', () => {
	beforeEach(() => {
		serverCache.clear();
	});

	it('returns structured transit data with default mode="all" and window=120', async () => {
		const requestUrl = new URL('http://localhost/api/transit');
		const mockEvent = {
			url: requestUrl,
		} as Parameters<typeof GET>[0];

		const response = await GET(mockEvent);
		expect(response.status).toBe(200);

		const headers = response.headers;
		expect(headers.get('Cache-Control')).toBe('public, max-age=15, s-maxage=15');

		const body = await response.json();
		expect(body).toHaveProperty('departures');
		expect(body).toHaveProperty('alerts');
		expect(body).toHaveProperty('stations');
		expect(body).toHaveProperty('vehicles');
		expect(body).toHaveProperty('fetchedAt');
		expect(body.isCached).toBe(false);
	});

	it('serves cached responses on subsequent requests within cache TTL', async () => {
		const requestUrl = new URL('http://localhost/api/transit?mode=subway&window=60');
		const mockEvent = {
			url: requestUrl,
		} as Parameters<typeof GET>[0];

		const res1 = await GET(mockEvent);
		const body1 = await res1.json();
		expect(body1.isCached).toBe(false);

		const res2 = await GET(mockEvent);
		const body2 = await res2.json();
		expect(body2.isCached).toBe(true);
		expect(body2.fetchedAt).toBe(body1.fetchedAt);
	});

	it('handles invalid window parameter gracefully by falling back to 120', async () => {
		const requestUrl = new URL('http://localhost/api/transit?window=invalid');
		const mockEvent = {
			url: requestUrl,
		} as Parameters<typeof GET>[0];

		const response = await GET(mockEvent);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toHaveProperty('departures');
		expect(Array.isArray(body.departures)).toBe(true);
	});
});
