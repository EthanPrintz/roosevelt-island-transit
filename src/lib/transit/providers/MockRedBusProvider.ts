import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BusDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/redbus.json';

export class MockRedBusProvider implements TransitProvider {
	readonly mode: TransitMode = 'red_bus';
	readonly name = 'RIOC Red Bus Shuttle';
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
