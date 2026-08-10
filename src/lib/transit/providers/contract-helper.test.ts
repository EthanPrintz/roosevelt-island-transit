/**
 * TDD Uniform Provider Contract Suite
 *
 * Runs contract checks against all mock transit providers.
 */

import { describe, it } from 'vitest';
import type { TransitProvider } from '../domain/provider';
import { assertTransitProviderContract } from './contract-helper';
import { MockCitiBikeProvider } from './MockCitiBikeProvider';
import { MockFerryProvider } from './MockFerryProvider';
import { MockQ102Provider } from './MockQ102Provider';
import { MockRedBusProvider } from './MockRedBusProvider';
import { MockSubwayProvider } from './MockSubwayProvider';
import { MockTramProvider } from './MockTramProvider';

describe('TransitProvider Uniform Contract Suite', () => {
	const providers: Array<{ name: string; instance: TransitProvider }> = [
		{ name: 'MockSubwayProvider', instance: new MockSubwayProvider() },
		{ name: 'MockTramProvider', instance: new MockTramProvider() },
		{ name: 'MockFerryProvider', instance: new MockFerryProvider() },
		{ name: 'MockQ102Provider', instance: new MockQ102Provider() },
		{ name: 'MockRedBusProvider', instance: new MockRedBusProvider() },
		{ name: 'MockCitiBikeProvider', instance: new MockCitiBikeProvider() },
	];

	for (const { name, instance } of providers) {
		it(`${name} strictly fulfills the TransitProvider contract`, async () => {
			await assertTransitProviderContract(instance);
		});
	}
});
