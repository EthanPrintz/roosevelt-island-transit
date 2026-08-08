export type TransitMode = 'tram' | 'subway' | 'red_bus' | 'q102_bus' | 'ferry' | 'citibike';

export type ServiceStatus = 'normal' | 'delays' | 'rerouted' | 'suspended';

export interface TransitDeparture {
	id: string;
	mode: TransitMode;
	routeId: string;
	routeName: string;
	headsign: string;
	destination: string;
	departureTime: string;
	minutesAway: number;
	status: ServiceStatus;
	trackOrPlatform?: string;
	alert?: string;
}

export interface TransitStation {
	id: string;
	mode: TransitMode;
	name: string;
	location: {
		lat: number;
		lng: number;
	};
	totalBikes?: number;
	ebikesAvailable?: number;
	classicBikesAvailable?: number;
	docksAvailable?: number;
	status: ServiceStatus;
}

export interface TransitAlert {
	id: string;
	mode: TransitMode;
	title: string;
	description: string;
	severity: 'info' | 'warning' | 'critical';
	activeFrom?: string;
	activeTo?: string;
}
