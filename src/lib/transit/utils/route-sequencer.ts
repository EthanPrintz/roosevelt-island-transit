/**
 * Route Sequencer & Upcoming Stops Utility
 *
 * Computes ordered upcoming remaining stop sequences for live vehicles across all
 * Roosevelt Island transit modes (Red Bus, Q102 Bus, NYC Ferry, Tramway, MTA F Train).
 * Calculates physical Haversine distance-based estimated arrival times (ETA seconds,
 * clock time, relative countdowns) based on vehicle speed and mode dwell times.
 */

import type { LiveVehiclePosition, TransitMode } from '$lib/transit/domain/types';

export interface UpcomingStopItem {
	id: string;
	title: string;
	subtitle?: string;
	lat?: number;
	lng?: number;
	etaSeconds?: number;
	formattedTime?: string;
	countdownText?: string;
}

interface RouteStopDefinition {
	id: string;
	title: string;
	lat: number;
	lng: number;
}

// ---------------------------------------------------------------------------
// Red Bus Official Continuous Loop Sequences (Northbound + Southbound)
// ---------------------------------------------------------------------------

const RED_BUS_FULL_LOOP: RouteStopDefinition[] = [
	// Northbound Segment (Index 0..8)
	{ id: 'cornell', title: 'Graduate Hotel / Cornell Tech', lat: 40.7565451, lng: -73.9558944 },
	{ id: 'tramwest_n', title: 'Tram Bus Stop (Northbound)', lat: 40.7575689, lng: -73.954253 },
	{ id: 'subway_n', title: 'Subway Station (Northbound)', lat: 40.7591377, lng: -73.9534642 },
	{ id: '504main', title: 'Youth Center / Library', lat: 40.760975, lng: -73.9506879 },
	{ id: '545main', title: 'Public Safety (545 Main St)', lat: 40.7616856, lng: -73.9497772 },
	{ id: 'capfield', title: 'Capobianco Field / PS IS 217', lat: 40.7639548, lng: -73.9478313 },
	{ id: 'post', title: 'Supermarket / Post Office', lat: 40.7648881, lng: -73.9469218 },
	{ id: '40river_n', title: 'Bus Garage / 40 River Rd (North)', lat: 40.7657848, lng: -73.9461261 },
	{ id: 'colerh', title: 'Coler Hospital', lat: 40.7705558, lng: -73.9428722 },

	// Southbound Segment (Index 9..19)
	{ id: 'octagon', title: 'Octagon', lat: 40.7688463, lng: -73.9431741 },
	{ id: 'comfstat', title: 'McManus Field', lat: 40.7668776, lng: -73.9449412 },
	{ id: '40river_s', title: '40 River Road (Southbound)', lat: 40.7660204, lng: -73.9460596 },
	{ id: '10river', title: '10 River Road (Motorgate South)', lat: 40.7645472, lng: -73.9473908 },
	{ id: '570main', title: '570 Main St (Deli)', lat: 40.7627606, lng: -73.9493494 },
	{ id: '543main', title: 'Good Shepherd Plaza (543 Main St)', lat: 40.7616497, lng: -73.9499702 },
	{ id: 'riverwalk', title: "Riverwalk (Granny Annie's)", lat: 40.7585788, lng: -73.9525611 },
	{ id: 'trameast', title: 'R.I. Tram Station (East Entrance)', lat: 40.75743, lng: -73.95384 },
	{ id: 'ferrystat', title: 'Ferry Station Dock Stop', lat: 40.756811, lng: -73.952482 },
	{ id: 'sportpark', title: 'Sportspark East Entrance', lat: 40.75606, lng: -73.9538509 },
	{ id: 'southpnt', title: 'Southpoint Park Terminus', lat: 40.7533378, lng: -73.9583568 },
];

const Q102_ASTORIA_STOPS: RouteStopDefinition[] = [
	{ id: 'q102-ri-br', title: '36 Ave / Vernon Blvd (RI Bridge)', lat: 40.761856, lng: -73.942267 },
	{ id: 'q102-tram', title: 'Main St / Tramway Plaza', lat: 40.758467, lng: -73.952743 },
	{ id: 'q102-subway', title: 'West Rd / Subway Station', lat: 40.759133, lng: -73.953438 },
	{ id: 'q102-gs', title: 'Main St / Good Shepherd Plaza', lat: 40.761763, lng: -73.949995 },
	{ id: 'q102-motor', title: 'Main St / 10 River Rd (Motorgate)', lat: 40.765055, lng: -73.947006 },
	{ id: 'q102-post', title: 'Main St / Post Office', lat: 40.76504, lng: -73.946799 },
	{ id: 'q102-octagon', title: 'Main St / East Rd (Octagon)', lat: 40.768818, lng: -73.942729 },
	{ id: 'q102-coler', title: 'West Rd / Coler Hospital', lat: 40.770688, lng: -73.942689 },
	{ id: 'q102-astoria-27', title: 'Astoria - 27 Ave (Terminus)', lat: 40.7735, lng: -73.929 },
];

const Q102_COLER_STOPS: RouteStopDefinition[] = [
	{ id: 'q102-coler', title: 'West Rd / Coler Hospital', lat: 40.770688, lng: -73.942689 },
	{
		id: 'q102-octagon-s',
		title: 'Main St / East Rd (Octagon South)',
		lat: 40.76873,
		lng: -73.942988,
	},
	{ id: 'q102-post', title: 'Main St / Post Office', lat: 40.76504, lng: -73.946799 },
	{ id: 'q102-motor', title: 'Main St / 10 River Rd (Motorgate)', lat: 40.765055, lng: -73.947006 },
	{ id: 'q102-gs', title: 'Main St / Good Shepherd Plaza', lat: 40.761763, lng: -73.949995 },
	{ id: 'q102-subway', title: 'West Rd / Subway Station', lat: 40.759133, lng: -73.953438 },
	{ id: 'q102-tram', title: 'Main St / Tramway Plaza', lat: 40.758467, lng: -73.952743 },
	{ id: 'q102-ri-br', title: '36 Ave / Vernon Blvd (RI Bridge)', lat: 40.761856, lng: -73.942267 },
];

const FERRY_SOUTHBOUND_STOPS: UpcomingStopItem[] = [
	{
		id: 'ri-ferry',
		title: 'Roosevelt Island Pier',
		subtitle: 'Astoria Line Dock',
		lat: 40.7568,
		lng: -73.9525,
	},
	{
		id: 'lic',
		title: 'Long Island City (Hunters Point South)',
		subtitle: 'LIC Pier',
		lat: 40.7423,
		lng: -73.9602,
	},
	{
		id: 'e34',
		title: 'East 34th St',
		subtitle: 'Midtown East Landing',
		lat: 40.7441,
		lng: -73.971,
	},
	{
		id: 'navy-yard',
		title: 'Brooklyn Navy Yard',
		subtitle: 'Brooklyn Landing',
		lat: 40.7025,
		lng: -73.974,
	},
	{
		id: 'wallst',
		title: 'Wall St / Pier 11',
		subtitle: 'Financial District Terminal',
		lat: 40.7032,
		lng: -74.007,
	},
];

const FERRY_NORTHBOUND_STOPS: UpcomingStopItem[] = [
	{
		id: 'astoria-landing',
		title: 'Astoria Landing',
		subtitle: 'Queens Pier',
		lat: 40.7712,
		lng: -73.9365,
	},
	{
		id: 'e90',
		title: 'East 90th St',
		subtitle: 'Upper East Side Terminal',
		lat: 40.7778,
		lng: -73.9431,
	},
];

const SUBWAY_QUEENS_STOPS: UpcomingStopItem[] = [
	{
		id: 'subway-ri',
		title: 'Roosevelt Island Station',
		subtitle: '63rd St Line',
		lat: 40.7592,
		lng: -73.9534,
	},
	{
		id: 'lex63',
		title: 'Lexington Ave / 63rd St',
		subtitle: 'Manhattan',
		lat: 40.7645,
		lng: -73.9662,
	},
	{
		id: '57st',
		title: '57th St',
		subtitle: 'Manhattan',
		lat: 40.7639,
		lng: -73.9774,
	},
	{
		id: 'rockefeller',
		title: '47-50 Sts - Rockefeller Ctr',
		subtitle: 'Manhattan',
		lat: 40.7587,
		lng: -73.9787,
	},
	{
		id: '42st',
		title: '42st - Bryant Park',
		subtitle: 'Manhattan',
		lat: 40.7538,
		lng: -73.9837,
	},
	{
		id: 'heraldsq',
		title: '34st - Herald Sq',
		subtitle: 'Manhattan Terminal',
		lat: 40.7496,
		lng: -73.9878,
	},
];

const SUBWAY_MANHATTAN_STOPS: UpcomingStopItem[] = [
	{
		id: 'subway-ri',
		title: 'Roosevelt Island Station',
		subtitle: '63rd St Line',
		lat: 40.7592,
		lng: -73.9534,
	},
	{
		id: 'queensbridge',
		title: '21st St Queensbridge',
		subtitle: 'Queens',
		lat: 40.754,
		lng: -73.9427,
	},
	{
		id: 'queensplaza',
		title: 'Queens Plaza',
		subtitle: 'LIC Transfer',
		lat: 40.7489,
		lng: -73.9371,
	},
	{
		id: 'roosevelt',
		title: 'Jackson Hts - Roosevelt Ave',
		subtitle: 'Express Transfer',
		lat: 40.7468,
		lng: -73.8913,
	},
	{
		id: 'foresthills',
		title: 'Forest Hills - 71st Ave',
		subtitle: 'Queens',
		lat: 40.7217,
		lng: -73.8444,
	},
	{
		id: 'jamaica',
		title: 'Jamaica - 179th St',
		subtitle: 'Queens Terminal',
		lat: 40.7126,
		lng: -73.7844,
	},
];

const TRAM_MANHATTAN_STOPS: UpcomingStopItem[] = [
	{
		id: 'island-tram',
		title: 'Roosevelt Island Tram Station',
		subtitle: 'Main Terminal',
		lat: 40.75743,
		lng: -73.95384,
	},
	{
		id: 'manhattan-tram',
		title: 'Manhattan Tramway Station',
		subtitle: '59th St & 2nd Ave',
		lat: 40.7612,
		lng: -73.9642,
	},
];

const TRAM_ISLAND_STOPS: UpcomingStopItem[] = [
	{
		id: 'manhattan-tram',
		title: 'Manhattan Tramway Station',
		subtitle: '59th St & 2nd Ave',
		lat: 40.7612,
		lng: -73.9642,
	},
	{
		id: 'island-tram',
		title: 'Roosevelt Island Tram Station',
		subtitle: 'Main Terminal',
		lat: 40.75743,
		lng: -73.95384,
	},
];

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function getModeSpeedAndDwell(mode: TransitMode, vehicleSpeedMps?: number) {
	if (typeof vehicleSpeedMps === 'number' && vehicleSpeedMps > 1.0) {
		return { speedMps: Math.max(3.0, vehicleSpeedMps), dwellTime: 30 };
	}
	switch (mode) {
		case 'ferry':
			return { speedMps: 8.0, dwellTime: 60 }; // ~16 knots
		case 'subway':
			return { speedMps: 11.0, dwellTime: 30 }; // ~25 mph
		case 'tram':
			return { speedMps: 6.5, dwellTime: 45 }; // ~15 mph
		case 'red_bus':
		case 'q102_bus':
		default:
			return { speedMps: 5.0, dwellTime: 25 }; // ~11 mph
	}
}

/**
 * Compute list of upcoming remaining stops for a vehicle position (Next stop first on top)
 * with calculated estimated arrival times (ETA seconds, clock time, relative countdown).
 */
export function getUpcomingStopsForVehicle(
	vehicle: LiveVehiclePosition,
	limit = 4,
	referenceTime?: string | number,
): UpcomingStopItem[] {
	if (!vehicle) return [];

	const { mode, direction, lat, nextStopName } = vehicle;

	let seq: UpcomingStopItem[] = [];

	if (mode === 'red_bus') {
		const isNorthbound = direction === 'northbound';
		const doubleLoop = [...RED_BUS_FULL_LOOP, ...RED_BUS_FULL_LOOP, ...RED_BUS_FULL_LOOP];

		let matchIdx = -1;
		if (nextStopName) {
			const target = nextStopName.toLowerCase().trim();
			const offset = isNorthbound ? 0 : 9;
			const sliceToSearch = RED_BUS_FULL_LOOP.slice(offset).concat(
				RED_BUS_FULL_LOOP.slice(0, offset),
			);
			const subMatch = sliceToSearch.findIndex((s) => {
				const title = s.title.toLowerCase();
				const cleanTitle = title.replace(/\s*\(.*\)/, '').trim();
				return title.includes(target) || target.includes(cleanTitle);
			});
			if (subMatch >= 0) {
				matchIdx = (offset + subMatch) % RED_BUS_FULL_LOOP.length;
			}
		}

		if (matchIdx === -1 && typeof lat === 'number') {
			const segmentStart = isNorthbound ? 0 : 9;
			const segmentEnd = isNorthbound ? 8 : 19;
			let minDistance = Infinity;
			for (let i = segmentStart; i <= segmentEnd; i++) {
				const s = RED_BUS_FULL_LOOP[i];
				const d = getDistanceMeters(lat, vehicle.lng ?? -73.95, s.lat, s.lng);
				if (d < minDistance) {
					minDistance = d;
					matchIdx = i;
				}
			}
		}

		if (matchIdx === -1) {
			matchIdx = isNorthbound ? 0 : 9;
		}

		const slicedLoop = doubleLoop.slice(matchIdx, matchIdx + limit);
		seq = slicedLoop.map((s) => ({ id: s.id, title: s.title, lat: s.lat, lng: s.lng }));
	} else if (mode === 'q102_bus') {
		const isAstoria = direction === 'queens_bound' || direction === 'northbound';
		const rawSeq = isAstoria ? Q102_ASTORIA_STOPS : Q102_COLER_STOPS;

		if (typeof lat === 'number') {
			const remaining = rawSeq.filter((stop) => {
				if (isAstoria) {
					return stop.lat > lat - 0.0003;
				}
				return stop.lat < lat + 0.0003;
			});
			seq = remaining.map((s) => ({ id: s.id, title: s.title, lat: s.lat, lng: s.lng }));
		} else {
			seq = rawSeq.map((s) => ({ id: s.id, title: s.title, lat: s.lat, lng: s.lng }));
		}
	} else if (mode === 'ferry') {
		const fullSeq = direction === 'southbound' ? FERRY_SOUTHBOUND_STOPS : FERRY_NORTHBOUND_STOPS;
		if (typeof lat === 'number') {
			if (direction === 'southbound') {
				if (lat <= 40.72) seq = fullSeq.filter((s) => s.id === 'wallst');
				else if (lat <= 40.742)
					seq = fullSeq.filter((s) => s.id === 'navy-yard' || s.id === 'wallst');
				else if (lat <= 40.748)
					seq = fullSeq.filter((s) => s.id === 'e34' || s.id === 'navy-yard' || s.id === 'wallst');
				else seq = fullSeq.filter((s) => s.id !== 'ri-ferry');
			} else {
				if (lat >= 40.774) seq = fullSeq.filter((s) => s.id === 'e90');
				else seq = fullSeq.filter((s) => s.id !== 'ri-ferry');
			}
		} else {
			seq = fullSeq;
		}
	} else if (mode === 'subway') {
		seq = direction === 'manhattan_bound' ? SUBWAY_MANHATTAN_STOPS : SUBWAY_QUEENS_STOPS;
	} else if (mode === 'tram') {
		seq = direction === 'manhattan_bound' ? TRAM_MANHATTAN_STOPS : TRAM_ISLAND_STOPS;
	}

	// Align non-Red Bus sequences so nextStopName (if reported by feed) is at index 0
	if (mode !== 'red_bus' && nextStopName && seq.length > 0) {
		const targetName = nextStopName.toLowerCase().trim();
		const matchIdx = seq.findIndex((s) => {
			const title = s.title.toLowerCase();
			const cleanTitle = title.replace(/\s*\(.*\)/, '').trim();
			return title.includes(targetName) || targetName.includes(cleanTitle);
		});

		if (matchIdx >= 0) {
			seq = seq.slice(matchIdx);
		}
	}

	// Calculate cumulative ETAs (etaSeconds, etaMinutes, formattedTime, countdownText)
	const now = referenceTime ? new Date(referenceTime).getTime() : Date.now();
	const { speedMps, dwellTime } = getModeSpeedAndDwell(mode, vehicle.speedMps);
	let accumulatedSeconds = 0;
	let currentLat = lat;
	let currentLng = vehicle.lng;

	return seq.slice(0, limit).map((stop, idx) => {
		let distMeters = 800;
		if (
			typeof stop.lat === 'number' &&
			typeof stop.lng === 'number' &&
			typeof currentLat === 'number' &&
			typeof currentLng === 'number'
		) {
			distMeters = getDistanceMeters(currentLat, currentLng, stop.lat, stop.lng);
			currentLat = stop.lat;
			currentLng = stop.lng;
		}

		const travelSecs = Math.max(30, Math.round(distMeters / speedMps));
		const dwellSecs = idx === 0 ? 0 : dwellTime;
		accumulatedSeconds += travelSecs + dwellSecs;

		const arrivalDate = new Date(now + accumulatedSeconds * 1000);
		const formattedTime = arrivalDate.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});

		const etaMinutes = Math.round(accumulatedSeconds / 60);
		let countdownText = `${etaMinutes} min`;
		if (accumulatedSeconds < 60) {
			countdownText = 'Due';
		} else if (etaMinutes === 1) {
			countdownText = '1 min';
		}

		return {
			...stop,
			etaSeconds: accumulatedSeconds,
			formattedTime,
			countdownText,
		};
	});
}
