import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/q102.json';

export class MockQ102Provider implements TransitProvider {
	readonly mode: TransitMode = 'q102_bus';
	readonly name = 'MTA Q102 Bus';

	async getDepartures(): Promise<TransitDeparture[]> {
		return fixtureData.departures as TransitDeparture[];
	}

	async getAlerts(): Promise<TransitAlert[]> {
		return fixtureData.alerts as TransitAlert[];
	}
}
