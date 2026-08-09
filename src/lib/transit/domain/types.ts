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
 * GTFS-RT Standard Schedule Relationship
 */
export type ScheduleRelationship = 'SCHEDULED' | 'ADDED' | 'UNSCHEDULED' | 'CANCELED' | 'SKIPPED';

/**
 * GTFS-RT Standard Vehicle Occupancy
 */
export type VehicleOccupancy =
	| 'empty'
	| 'many_seats_available'
	| 'few_seats_available'
	| 'standing_room_only'
	| 'full';

/**
 * Live Geographic Location & Telemetry
 */
export interface VehicleLocation {
	lat: number;
	lng: number;
	bearing?: number; // 0-360 degrees
	speed?: number; // meters per second
	updatedAt: string; // ISO 8601
}

/**
 * Base Transit Departure Record (GTFS-RT / SIRI Aligned)
 */
export interface BaseDeparture {
	id: string;
	mode: TransitMode;
	routeId: string;
	routeName: string;
	tripId?: string;
	headsign: string;
	destinationName: string;
	direction: TransitDirection;
	scheduledTime: string; // ISO 8601
	predictedTime?: string; // ISO 8601 if real-time
	isRealtime: boolean;
	delaySeconds?: number;
	scheduleRelationship?: ScheduleRelationship;
	status: ServiceStatus;
	stopName: string;
	stopId?: string;
	stopSequence?: number;
	vehicleLocation?: VehicleLocation;
	alertId?: string;
}

/**
 * Subway-Specific Departure (F/M Trains & GTFS-RT NYCT Extensions)
 */
export interface SubwayDeparture extends BaseDeparture {
	mode: 'subway';
	routeId: 'F' | 'M' | 'F_SHUTTLE';
	trainLength?: number;
	track: 'Uptown' | 'Downtown';
	isShuttle: boolean;
	originStartTime?: string; // e.g. "10:12:30" origin terminal dispatch
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
	vesselStatus?: 'IN_TRANSIT_TO' | 'INCOMING_AT' | 'STOPPED_AT';
	speedKnots?: number;
	coordinates?: { lat: number; lng: number };
	bearing?: number;
}

/**
 * Discriminated Union for all Departures
 */
export type TransitDeparture = SubwayDeparture | TramDeparture | BusDeparture | FerryDeparture;

/**
 * Bike Station Record (GBFS v3.0 Standard)
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
	disabledBikes?: number;
	disabledDocks?: number;
	isRenting: boolean;
	isReturning: boolean;
	status: ServiceStatus;
	lastReported: string; // ISO 8601
	lastReportedAgeMins?: number;
}

/**
 * Disruption & Service Alert Entity (GTFS-RT Alert Standard)
 */
export interface TransitAlert {
	id: string;
	mode: TransitMode;
	affectedRoutes: string[];
	affectedStops?: string[];
	title: string;
	description: string;
	severity: 'info' | 'warning' | 'critical';
	cause?: 'MAINTENANCE' | 'TECHNICAL_PROBLEM' | 'WEATHER' | 'ACCIDENT' | 'OTHER';
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
