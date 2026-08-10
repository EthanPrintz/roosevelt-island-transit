interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

/**
 * Server-side TTL Cache with Single-Flight Promise Locking
 * to prevent thundering-herd API stampedes and protect 3rd-party rate limits.
 */
export class ServerTtlCache {
	private cache = new Map<string, CacheEntry<unknown>>();
	private pendingPromises = new Map<string, Promise<unknown>>();

	/**
	 * Retrieves cached item or executes fetcher if expired/missing.
	 * Concurrent requests during a cache miss join the active in-flight Promise.
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

		// Single-Flight Pattern: If a fetch is already in flight for this key, join the active promise
		let pending = this.pendingPromises.get(key) as Promise<T> | undefined;
		if (pending) {
			const data = await pending;
			return { data, isCached: true };
		}

		pending = fetcher();
		this.pendingPromises.set(key, pending);

		try {
			const data = await pending;
			this.cache.set(key, {
				data,
				expiresAt: Date.now() + ttlMs,
			});
			return { data, isCached: false };
		} finally {
			this.pendingPromises.delete(key);
		}
	}

	/**
	 * Manually invalidates a cache key.
	 */
	invalidate(key: string): void {
		this.cache.delete(key);
		this.pendingPromises.delete(key);
	}

	/**
	 * Clears all cached items and pending flight locks.
	 */
	clear(): void {
		this.cache.clear();
		this.pendingPromises.clear();
	}
}

export const serverCache = new ServerTtlCache();
