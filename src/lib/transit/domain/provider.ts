import type {
	BikeStation,
	LiveVehiclePosition,
	ProviderResult,
	TransitAlert,
	TransitDeparture,
	TransitMode,
} from './types';

export type ProviderCapability = 'departures' | 'alerts' | 'bike_stations' | 'vehicle_tracking';

export interface DepartureOptions {
	windowMinutes?: number;
}

export interface TransitProvider {
	readonly mode: TransitMode;
	readonly name: string;
	readonly capabilities: Set<ProviderCapability>;

	getDepartures?(options?: DepartureOptions): Promise<ProviderResult<TransitDeparture>>;
	getAlerts?(): Promise<ProviderResult<TransitAlert>>;
	getBikeStations?(): Promise<ProviderResult<BikeStation>>;
	getVehicles?(): Promise<ProviderResult<LiveVehiclePosition>>;
}
