import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode, TransitStation } from '../domain/types';
import fixtureData from '../fixtures/citibike.json';

export class MockCitiBikeProvider implements TransitProvider {
	readonly mode: TransitMode = 'citibike';
	readonly name = 'Citi Bike (Roosevelt Island)';

	async getDepartures(): Promise<TransitDeparture[]> {
		return [];
	}

	async getStations(): Promise<TransitStation[]> {
		return fixtureData.stations as TransitStation[];
	}

	async getAlerts(): Promise<TransitAlert[]> {
		return fixtureData.alerts as TransitAlert[];
	}
}
