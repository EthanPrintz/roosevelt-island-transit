import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { FerryDeparture, ProviderResult, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/ferry.json';

export class MockFerryProvider implements TransitProvider {
	readonly mode: TransitMode = 'ferry';
	readonly name = 'NYC Ferry (Astoria Route)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<FerryDeparture>> {
		return {
			data: fixtureData.departures as FerryDeparture[],
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
