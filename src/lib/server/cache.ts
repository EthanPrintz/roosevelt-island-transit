interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

/**
 * Server-side TTL Cache to prevent exceeding upstream API rate limits.
 */
export class ServerTtlCache {
	private cache = new Map<string, CacheEntry<unknown>>();

	/**
	 * Retrieves cached item or executes fetcher if expired/missing.
	 *
	 * @param key Unique cache key
	 * @param ttlMs Time to live in milliseconds
	 * @param fetcher Async supplier function to call when cache misses
	 */
	async getOrFetch<T>(
		key: string,
		ttlMs: number,
		fetcher: () => Promise<T>,
	): Promise<{ data: T; isCached: boolean }> {
		const now = Date.now();
		const existing = this.cache.get(key) as CacheEntry<T> | undefined;

		if (existing && existing.expiresAt > now) {
			return { data: existing.data, isCached: true };
		}

		const data = await fetcher();
		this.cache.set(key, {
			data,
			expiresAt: now + ttlMs,
		});

		return { data, isCached: false };
	}

	/**
	 * Manually invalidates a cache key.
	 */
	invalidate(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Clears all cached items.
	 */
	clear(): void {
		this.cache.clear();
	}
}

export const serverCache = new ServerTtlCache();
