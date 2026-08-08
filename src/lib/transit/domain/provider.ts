import type {
	BikeStation,
	ProviderResult,
	TransitAlert,
	TransitDeparture,
	TransitMode,
} from './types';

export type ProviderCapability = 'departures' | 'alerts' | 'bike_stations';

export interface TransitProvider {
	readonly mode: TransitMode;
	readonly name: string;
	readonly capabilities: Set<ProviderCapability>;

	getDepartures?(): Promise<ProviderResult<TransitDeparture>>;
	getAlerts?(): Promise<ProviderResult<TransitAlert>>;
	getBikeStations?(): Promise<ProviderResult<BikeStation>>;
}
