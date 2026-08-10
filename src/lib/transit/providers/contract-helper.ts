/**
 * TDD Contract Verification Helper for TransitProvider implementations.
 *
 * Ensures all live and mock provider modules declare capabilities accurately
 * and fulfill the TransitProvider interface contract without throwing unhandled exceptions.
 */

import { expect } from 'vitest';
import type { TransitProvider } from '../domain/provider';

export async function assertTransitProviderContract(provider: TransitProvider) {
	expect(provider.mode).toBeDefined();
	expect(typeof provider.name).toBe('string');
	expect(provider.capabilities).toBeInstanceOf(Set);

	if (provider.capabilities.has('departures')) {
		expect(typeof provider.getDepartures).toBe('function');
		const result = await provider.getDepartures?.({ windowMinutes: 60 });
		expect(result).toHaveProperty('data');
		expect(result).toHaveProperty('fetchedAt');
		expect(Array.isArray(result?.data)).toBe(true);
	}

	if (provider.capabilities.has('alerts')) {
		expect(typeof provider.getAlerts).toBe('function');
		const result = await provider.getAlerts?.();
		expect(result).toHaveProperty('data');
		expect(result).toHaveProperty('fetchedAt');
		expect(Array.isArray(result?.data)).toBe(true);
	}

	if (provider.capabilities.has('bike_stations')) {
		expect(typeof provider.getBikeStations).toBe('function');
		const result = await provider.getBikeStations?.();
		expect(result).toHaveProperty('data');
		expect(result).toHaveProperty('fetchedAt');
		expect(Array.isArray(result?.data)).toBe(true);
	}

	if (provider.capabilities.has('vehicle_tracking')) {
		expect(typeof provider.getVehicles).toBe('function');
		const result = await provider.getVehicles?.();
		expect(result).toHaveProperty('data');
		expect(result).toHaveProperty('fetchedAt');
		expect(Array.isArray(result?.data)).toBe(true);
	}
}
