import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BusDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/q102.json';

export class MockQ102Provider implements TransitProvider {
	readonly mode: TransitMode = 'q102_bus';
	readonly name = 'MTA Q102 Bus';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<BusDeparture>> {
		return {
			data: fixtureData.departures as BusDeparture[],
			fetchedAt: new Date().toISOString(),
			isCached: false,
		};
	}

	async getAlerts(): Promise<ProviderResult<TransitAlert>> {
		return {
			data: fixtureData.alerts as TransitAlert[],
			fetchedAt: new Date().toISOString(),
			isCached: false,
		};
	}
}
