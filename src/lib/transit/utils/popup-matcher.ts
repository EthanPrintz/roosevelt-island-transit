/**
 * Map Popup Entity Matcher Utility
 *
 * Provides pure helper functions to filter departures, live vehicle telemetry, bike stations,
 * and service alerts for MapLibre GL JS map popups.
 */

import type {
	BikeStation,
	LiveVehiclePosition,
	TransitAlert,
	TransitDeparture,
	TransitMode,
} from '$lib/transit/domain/types';

/**
 * Filter departures matching a specific map stop feature ID
 */
export function getDeparturesForStop(
	stopId: string,
	departures: TransitDeparture[],
): TransitDeparture[] {
	if (!stopId || !Array.isArray(departures)) return [];

	if (stopId === 'stop-subway-ri') {
		return departures.filter((d) => d.mode === 'subway');
	}

	if (stopId === 'stop-tram-ri' || stopId === 'stop-tram-manhattan') {
		return departures.filter((d) => d.mode === 'tram');
	}

	if (stopId === 'stop-ferry-ri') {
		return departures.filter((d) => d.mode === 'ferry');
	}

	if (stopId.startsWith('stop-redbus-')) {
		const tag = stopId.replace('stop-redbus-', '').toLowerCase();
		return departures.filter((d) => {
			if (d.mode !== 'red_bus') return false;

			const depId = (d.id || '').toLowerCase();
			const depStopName = (d.stopName || '').toLowerCase();

			if (depId.includes(`-${tag}-`) || depId.includes(tag)) return true;

			switch (tag) {
				case 'octagon':
					return depStopName.includes('octagon');
				case 'comfstat':
					return depStopName.includes('mcmanus') || depStopName.includes('comfstat');
				case '40river_s':
				case '40river_n':
					return depStopName.includes('40 river');
				case '10river':
					return depStopName.includes('10 river') || depStopName.includes('motorgate');
				case '570main':
					return depStopName.includes('570 main');
				case '543main':
				case '545main':
				case '504main':
					return (
						depStopName.includes('543') ||
						depStopName.includes('545') ||
						depStopName.includes('504') ||
						depStopName.includes('good shepherd') ||
						depStopName.includes('chapel')
					);
				case 'riverwalk':
					return depStopName.includes('riverwalk');
				case 'trameast':
				case 'tramwest_n':
					return depStopName.includes('tram');
				case 'subway_n':
					return depStopName.includes('subway');
				case 'sportpark':
					return depStopName.includes('sportpark');
				case 'southpnt':
					return depStopName.includes('southpoint') || depStopName.includes('southpnt');
				case 'cornell':
					return depStopName.includes('cornell') || depStopName.includes('graduate');
				case 'capfield':
					return depStopName.includes('capobianco') || depStopName.includes('field');
				case 'post':
					return depStopName.includes('post') || depStopName.includes('supermarket');
				case 'colerh':
					return depStopName.includes('coler');
				default:
					return depStopName.includes(tag);
			}
		});
	}

	if (stopId.startsWith('stop-q102-')) {
		const rawMtaId = stopId.replace('stop-q102-', '');
		return departures.filter((d) => {
			if (d.mode !== 'q102_bus') return false;
			return (
				d.stopId === rawMtaId ||
				(d.id || '').includes(rawMtaId) ||
				(d.stopName || '').includes(rawMtaId)
			);
		});
	}

	return [];
}

/**
 * Retrieve live vehicle telemetry by vehicle ID
 */
export function getVehicleDetails(
	vehicleId: string,
	vehicles: LiveVehiclePosition[],
): LiveVehiclePosition | undefined {
	if (!vehicleId || !Array.isArray(vehicles)) return undefined;

	return vehicles.find(
		(v) =>
			v.id === vehicleId ||
			v.vehicleId === vehicleId ||
			`redbus-${v.vehicleId}` === vehicleId ||
			`q102-${v.vehicleId}` === vehicleId ||
			`ferry-${v.vehicleId}` === vehicleId ||
			`tram-${v.vehicleId}` === vehicleId,
	);
}

/**
 * Retrieve Citi Bike station details by station ID
 */
export function getBikeStationDetails(
	stationId: string,
	stations: BikeStation[],
): BikeStation | undefined {
	if (!stationId || !Array.isArray(stations)) return undefined;

	return stations.find(
		(s) =>
			s.id === stationId ||
			`citibike-station-${s.id}` === stationId ||
			`citibike-${s.id}` === stationId,
	);
}

/**
 * Retrieve service alerts relevant to a stop ID or mode
 */
export function getAlertsForStopOrMode(
	stopId: string,
	mode: TransitMode,
	alerts: TransitAlert[],
): TransitAlert[] {
	if (!Array.isArray(alerts)) return [];

	return alerts.filter((a) => {
		if (a.mode !== mode) return false;
		if (a.affectedStops && a.affectedStops.length > 0) {
			return a.affectedStops.some((s) => s === stopId || stopId.includes(s));
		}
		return true;
	});
}
