import { describe, expect, it } from 'vitest';
import { ServerTtlCache } from './cache';

describe('ServerTtlCache Single-Flight & TTL', () => {
	it('should serve cached data within TTL', async () => {
		const cache = new ServerTtlCache();
		let callCount = 0;
		const fetcher = async () => {
			callCount++;
			return { value: 42 };
		};

		const res1 = await cache.getOrFetch('test-key', 1000, fetcher);
		expect(res1.data).toEqual({ value: 42 });
		expect(res1.isCached).toBe(false);
		expect(callCount).toBe(1);

		const res2 = await cache.getOrFetch('test-key', 1000, fetcher);
		expect(res2.data).toEqual({ value: 42 });
		expect(res2.isCached).toBe(true);
		expect(callCount).toBe(1);
	});

	it('should deduplicate concurrent requests via single-flight locking', async () => {
		const cache = new ServerTtlCache();
		let callCount = 0;
		const slowFetcher = async () => {
			callCount++;
			await new Promise((resolve) => setTimeout(resolve, 50));
			return { result: 'ok' };
		};

		// Execute 5 concurrent requests during cache miss
		const promises = Array.from({ length: 5 }).map(() =>
			cache.getOrFetch('concurrent-key', 1000, slowFetcher),
		);

		const results = await Promise.all(promises);

		expect(callCount).toBe(1); // Fetcher executed strictly ONCE
		expect(results[0].isCached).toBe(false);
		for (let i = 1; i < results.length; i++) {
			expect(results[i].data).toEqual({ result: 'ok' });
			expect(results[i].isCached).toBe(true);
		}
	});

	it('should re-fetch after TTL expires', async () => {
		const cache = new ServerTtlCache();
		let callCount = 0;
		const fetcher = async () => {
			callCount++;
			return { timestamp: Date.now() };
		};

		await cache.getOrFetch('ttl-key', 50, fetcher);
		expect(callCount).toBe(1);

		await new Promise((resolve) => setTimeout(resolve, 60));

		const res2 = await cache.getOrFetch('ttl-key', 50, fetcher);
		expect(res2.isCached).toBe(false);
		expect(callCount).toBe(2);
	});
});
