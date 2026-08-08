import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/tram.json';

export class MockTramProvider implements TransitProvider {
	readonly mode: TransitMode = 'tram';
	readonly name = 'Roosevelt Island Tramway';

	async getDepartures(): Promise<TransitDeparture[]> {
		return fixtureData.departures as TransitDeparture[];
	}

	async getAlerts(): Promise<TransitAlert[]> {
		return fixtureData.alerts as TransitAlert[];
	}
}
