import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/redbus.json';

export class MockRedBusProvider implements TransitProvider {
	readonly mode: TransitMode = 'red_bus';
	readonly name = 'RIOC Red Bus Shuttle';

	async getDepartures(): Promise<TransitDeparture[]> {
		return fixtureData.departures as TransitDeparture[];
	}

	async getAlerts(): Promise<TransitAlert[]> {
		return fixtureData.alerts as TransitAlert[];
	}
}
