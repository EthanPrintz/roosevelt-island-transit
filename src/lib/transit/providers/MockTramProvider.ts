import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, TramDeparture, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/tram.json';

export class MockTramProvider implements TransitProvider {
	readonly mode: TransitMode = 'tram';
	readonly name = 'Roosevelt Island Tramway';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<TramDeparture>> {
		return {
			data: fixtureData.departures as TramDeparture[],
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
