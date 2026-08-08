import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { BikeStation, ProviderResult, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/citibike.json';

export class MockCitiBikeProvider implements TransitProvider {
	readonly mode: TransitMode = 'citibike';
	readonly name = 'Citi Bike (Roosevelt Island)';
	readonly capabilities = new Set<ProviderCapability>(['bike_stations', 'alerts']);

	async getBikeStations(): Promise<ProviderResult<BikeStation>> {
		return {
			data: fixtureData.stations as BikeStation[],
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
