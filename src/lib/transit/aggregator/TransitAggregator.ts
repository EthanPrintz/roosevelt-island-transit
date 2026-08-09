import type { DepartureOptions, TransitProvider } from '../domain/provider';
import type { BikeStation, TransitAlert, TransitDeparture, TransitMode } from '../domain/types';

export class TransitAggregator {
	private providers: Map<TransitMode, TransitProvider> = new Map();

	registerProvider(provider: TransitProvider): void {
		this.providers.set(provider.mode, provider);
	}

	getProvider(mode: TransitMode): TransitProvider | undefined {
		return this.providers.get(mode);
	}

	getRegisteredModes(): TransitMode[] {
		return Array.from(this.providers.keys());
	}

	async getAllDepartures(
		modeFilter: TransitMode | 'all' = 'all',
		options?: DepartureOptions,
	): Promise<TransitDeparture[]> {
		const targetProviders =
			modeFilter === 'all'
				? Array.from(this.providers.values())
				: [this.providers.get(modeFilter)].filter((p): p is TransitProvider => Boolean(p));

		const results = await Promise.all(
			targetProviders.map(async (provider) => {
				if (!provider.getDepartures || !provider.capabilities.has('departures')) return [];
				const res = await provider.getDepartures(options);
				return res.data;
			}),
		);

		const flattened = results.flat();
		return flattened.sort(
			(a, b) =>
				new Date(a.predictedTime || a.scheduledTime).getTime() -
				new Date(b.predictedTime || b.scheduledTime).getTime(),
		);
	}

	async getAllAlerts(modeFilter: TransitMode | 'all' = 'all'): Promise<TransitAlert[]> {
		const targetProviders =
			modeFilter === 'all'
				? Array.from(this.providers.values())
				: [this.providers.get(modeFilter)].filter((p): p is TransitProvider => Boolean(p));

		const results = await Promise.all(
			targetProviders.map(async (provider) => {
				if (!provider.getAlerts || !provider.capabilities.has('alerts')) return [];
				const res = await provider.getAlerts();
				return res.data;
			}),
		);

		return results.flat();
	}

	async getBikeStations(modeFilter: TransitMode | 'all' = 'all'): Promise<BikeStation[]> {
		const targetProviders =
			modeFilter === 'all'
				? Array.from(this.providers.values())
				: [this.providers.get(modeFilter)].filter((p): p is TransitProvider => Boolean(p));

		const results = await Promise.all(
			targetProviders.map(async (provider) => {
				if (!provider.getBikeStations || !provider.capabilities.has('bike_stations')) return [];
				const res = await provider.getBikeStations();
				return res.data;
			}),
		);

		return results.flat();
	}
}
