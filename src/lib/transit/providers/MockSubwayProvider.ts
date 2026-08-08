import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/subway.json';

export class MockSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway (F/M Trains)';

	async getDepartures(): Promise<TransitDeparture[]> {
		return fixtureData.departures as TransitDeparture[];
	}

	async getAlerts(): Promise<TransitAlert[]> {
		return fixtureData.alerts as TransitAlert[];
	}

	hasServiceSwitch(): boolean {
		const alerts = fixtureData.alerts as TransitAlert[];
		return alerts.some((a) => a.id.includes('fm-switch'));
	}
}
