import type { TransitProvider } from '../domain/provider';
import type { BikeStation, TransitAlert, TransitDeparture, TransitMode } from '../domain/types';

/**
 * TransitAggregator
 *
 * Central orchestrator for Roosevelt Island multi-modal transit providers.
 * Executes registered transit mode providers concurrently using Promise.allSettled
 * to ensure high fault tolerance (if one upstream API fails, remaining modes return intact).
 */
export class TransitAggregator {
	private providers: Map<TransitMode, TransitProvider> = new Map();

	/**
	 * Registers a new TransitProvider implementation.
	 * Overwrites any existing provider registered for the same mode.
	 */
	registerProvider(provider: TransitProvider): void {
		this.providers.set(provider.mode, provider);
	}

	/**
	 * Returns list of registered transit modes currently loaded in the aggregator.
	 */
	getRegisteredModes(): TransitMode[] {
		return Array.from(this.providers.keys());
	}

	/**
	 * Fetches upcoming departures across all active registered providers.
	 * Sorts results chronologically based on predicted/scheduled departure time.
	 *
	 * @param filterMode Optional transit mode filter (e.g. 'subway', 'tram', or 'all')
	 */
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

	/**
	 * Fetches active service disruptions and alerts across registered providers.
	 *
	 * @param filterMode Optional transit mode filter
	 */
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

	/**
	 * Fetches bikeshare station occupancy and dock availability.
	 *
	 * @param filterMode Optional mode filter (defaults to 'citibike' or 'all')
	 */
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
