import type { ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, SubwayDeparture, TransitAlert, TransitMode } from '../domain/types';
import fixtureData from '../fixtures/subway.json';

export class MockSubwayProvider implements TransitProvider {
	readonly mode: TransitMode = 'subway';
	readonly name = 'MTA Subway (F/M Trains)';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(): Promise<ProviderResult<SubwayDeparture>> {
		return {
			data: fixtureData.departures as SubwayDeparture[],
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

	hasServiceSwitch(): boolean {
		const alerts = fixtureData.alerts as TransitAlert[];
		return alerts.some((a) => a.id.includes('fm-switch'));
	}
}
