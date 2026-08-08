import type { TransitProvider } from '../domain/provider';
import type { TransitAlert, TransitDeparture, TransitMode, TransitStation } from '../domain/types';

export class TransitAggregator {
	private providers: Map<TransitMode, TransitProvider> = new Map();

	registerProvider(provider: TransitProvider): void {
		this.providers.set(provider.mode, provider);
	}

	getRegisteredModes(): TransitMode[] {
		return Array.from(this.providers.keys());
	}

	async getAllDepartures(filterMode?: TransitMode | 'all'): Promise<TransitDeparture[]> {
		const activeProviders = Array.from(this.providers.values()).filter(
			(p) => !filterMode || filterMode === 'all' || p.mode === filterMode,
		);

		const results = await Promise.allSettled(activeProviders.map((p) => p.getDepartures()));

		const departures: TransitDeparture[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled') {
				departures.push(...result.value);
			}
		}

		return departures.sort((a, b) => a.minutesAway - b.minutesAway);
	}

	async getAllAlerts(filterMode?: TransitMode | 'all'): Promise<TransitAlert[]> {
		const activeProviders = Array.from(this.providers.values()).filter(
			(p) => (!filterMode || filterMode === 'all' || p.mode === filterMode) && p.getAlerts,
		);

		const results = await Promise.allSettled(
			activeProviders.map(async (p) => (p.getAlerts ? p.getAlerts() : [])),
		);

		const alerts: TransitAlert[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value) {
				alerts.push(...result.value);
			}
		}

		return alerts;
	}

	async getAllStations(filterMode?: TransitMode | 'all'): Promise<TransitStation[]> {
		const activeProviders = Array.from(this.providers.values()).filter(
			(p) => (!filterMode || filterMode === 'all' || p.mode === filterMode) && p.getStations,
		);

		const results = await Promise.allSettled(
			activeProviders.map(async (p) => (p.getStations ? p.getStations() : [])),
		);

		const stations: TransitStation[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value) {
				stations.push(...result.value);
			}
		}

		return stations;
	}
}
