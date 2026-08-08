/**
 * Supported Roosevelt Island Public Transit Modes
 */
export type TransitMode = 'tram' | 'subway' | 'red_bus' | 'q102_bus' | 'ferry' | 'citibike';

/**
 * Directionality tailored to Roosevelt Island geometry
 */
export type TransitDirection =
	| 'manhattan_bound'
	| 'queens_bound'
	| 'northbound'
	| 'southbound'
	| 'loop';

/**
 * Service Operational Status
 */
export type ServiceStatus = 'normal' | 'delays' | 'rerouted' | 'suspended' | 'shuttle_service';

/**
 * Realtime Vehicle Occupancy (GTFS-RT standard)
 */
export type VehicleOccupancy =
	| 'empty'
	| 'many_seats_available'
	| 'few_seats_available'
	| 'standing_room_only'
	| 'full';

/**
 * Base Transit Departure Record
 */
export interface BaseDeparture {
	id: string;
	mode: TransitMode;
	routeId: string;
	routeName: string;
	headsign: string;
	destinationName: string;
	direction: TransitDirection;
	scheduledTime: string; // ISO 8601
	predictedTime?: string; // ISO 8601 if real-time
	isRealtime: boolean;
	delaySeconds?: number;
	status: ServiceStatus;
	stopName: string;
	stopId?: string;
	alertId?: string;
}

/**
 * Subway-Specific Departure (F/M Trains)
 */
export interface SubwayDeparture extends BaseDeparture {
	mode: 'subway';
	routeId: 'F' | 'M' | 'F_SHUTTLE';
	trainLength?: number;
	track: 'Uptown' | 'Downtown';
	isShuttle: boolean;
}

/**
 * Tramway-Specific Departure
 */
export interface TramDeparture extends BaseDeparture {
	mode: 'tram';
	cabin: 'North Cabin' | 'South Cabin';
	isBoarding: boolean;
}

/**
 * Bus Departure (Red Bus / Q102)
 */
export interface BusDeparture extends BaseDeparture {
	mode: 'red_bus' | 'q102_bus';
	vehicleId?: string;
	occupancy?: VehicleOccupancy;
	nextStopName?: string;
}

/**
 * NYC Ferry Departure
 */
export interface FerryDeparture extends BaseDeparture {
	mode: 'ferry';
	vesselName?: string;
	pierName: string;
}

/**
 * Discriminated Union for all Departures
 */
export type TransitDeparture = SubwayDeparture | TramDeparture | BusDeparture | FerryDeparture;

/**
 * Bike Station Record (Citi Bike GBFS)
 */
export interface BikeStation {
	id: string;
	name: string;
	mode: 'citibike';
	location: {
		lat: number;
		lng: number;
	};
	capacity: number;
	bikesAvailable: {
		classic: number;
		ebike: number;
		total: number;
	};
	docksAvailable: number;
	isRenting: boolean;
	isReturning: boolean;
	status: ServiceStatus;
	lastReported: string; // ISO 8601
}

/**
 * Disruption & Service Alert Entity
 */
export interface TransitAlert {
	id: string;
	mode: TransitMode;
	affectedRoutes: string[];
	title: string;
	description: string;
	severity: 'info' | 'warning' | 'critical';
	effect: 'NO_SERVICE' | 'MODIFIED_SERVICE' | 'DELAYS' | 'DETOUR' | 'OTHER';
	activeFrom?: string;
	activeTo?: string;
}

/**
 * Standardized Provider Result Wrapper with Metadata
 */
export interface ProviderResult<T> {
	data: T[];
	fetchedAt: string;
	isCached: boolean;
	error?: string;
}
