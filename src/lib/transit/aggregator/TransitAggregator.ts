import type { TransitProvider } from '../domain/provider';
import type { BikeStation, TransitAlert, TransitDeparture, TransitMode } from '../domain/types';

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
			(p) =>
				(!filterMode || filterMode === 'all' || p.mode === filterMode) &&
				p.capabilities.has('departures') &&
				p.getDepartures,
		);

		const results = await Promise.allSettled(
			activeProviders.map(async (p) =>
				p.getDepartures ? p.getDepartures() : { data: [], fetchedAt: '', isCached: false },
			),
		);

		const departures: TransitDeparture[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value?.data) {
				departures.push(...result.value.data);
			}
		}

		return departures.sort((a, b) => {
			const timeA = new Date(a.predictedTime || a.scheduledTime).getTime();
			const timeB = new Date(b.predictedTime || b.scheduledTime).getTime();
			return timeA - timeB;
		});
	}

	async getAllAlerts(filterMode?: TransitMode | 'all'): Promise<TransitAlert[]> {
		const activeProviders = Array.from(this.providers.values()).filter(
			(p) =>
				(!filterMode || filterMode === 'all' || p.mode === filterMode) &&
				p.capabilities.has('alerts') &&
				p.getAlerts,
		);

		const results = await Promise.allSettled(
			activeProviders.map(async (p) =>
				p.getAlerts ? p.getAlerts() : { data: [], fetchedAt: '', isCached: false },
			),
		);

		const alerts: TransitAlert[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value?.data) {
				alerts.push(...result.value.data);
			}
		}

		return alerts;
	}

	async getBikeStations(filterMode?: TransitMode | 'all'): Promise<BikeStation[]> {
		const activeProviders = Array.from(this.providers.values()).filter(
			(p) =>
				(!filterMode || filterMode === 'all' || p.mode === filterMode) &&
				p.capabilities.has('bike_stations') &&
				p.getBikeStations,
		);

		const results = await Promise.allSettled(
			activeProviders.map(async (p) =>
				p.getBikeStations ? p.getBikeStations() : { data: [], fetchedAt: '', isCached: false },
			),
		);

		const stations: BikeStation[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value?.data) {
				stations.push(...result.value.data);
			}
		}

		return stations;
	}
}
