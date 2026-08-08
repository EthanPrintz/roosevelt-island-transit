import type { TransitAlert, TransitDeparture, TransitMode, TransitStation } from './types';

export interface TransitProvider {
	readonly mode: TransitMode;
	readonly name: string;
	getDepartures(): Promise<TransitDeparture[]>;
	getAlerts?(): Promise<TransitAlert[]>;
	getStations?(): Promise<TransitStation[]>;
}
