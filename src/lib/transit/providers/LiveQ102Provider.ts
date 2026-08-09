import { env } from '$env/dynamic/private';
import { gtfsStaticStore, type ScheduledDeparture } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type {
	BusDeparture,
	LiveVehiclePosition,
	ProviderResult,
	TransitAlert,
	TransitMode,
	VehicleOccupancy,
} from '../domain/types';
import { suppressGhostSchedules } from '../utils/suppression';

export const MTA_BUS_SIRI_VM_URL =
	'https://bustime-classic.mta.info/api/siri/vehicle-monitoring.json';
export const MTA_QUEENS_BUS_STATIC_URL = 'http://rrgtfsfeeds.s3.amazonaws.com/gtfs_busco.zip';

/**
 * LiveQ102Provider
 *
 * Hybrid transit provider for MTA Q102 Bus serving Roosevelt Island & Astoria.
 * Combines live SIRI VehicleMonitoring API queries with GTFS static Queens Bus schedules.
 * Features Dynamic Active Horizon Suppression to eliminate ghost timetable entries.
 */
export class LiveQ102Provider implements TransitProvider {
	readonly mode: TransitMode = 'q102_bus';
	readonly name = 'MTA Q102 Bus';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(options?: DepartureOptions): Promise<ProviderResult<BusDeparture>> {
		try {
			const now = new Date();
			const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
			const defaultWindow = Math.max(240, Math.ceil((endOfDay.getTime() - now.getTime()) / 60000));
			const windowMinutes = options?.windowMinutes ?? defaultWindow;
			const apiKey = env.MTA_BUS_TIME_API_KEY || '3fff4736-ddbb-443a-baab-c66a72bdc4c1';

			// 1. Attempt static GTFS schedule lookup for Roosevelt Island Q102 stops (450151 & 450142)
			const staticDepartures: Array<
				ScheduledDeparture & { stopName: string; isOffIsland?: boolean }
			> = [];
			try {
				await gtfsStaticStore.loadDataset('q102_bus', MTA_QUEENS_BUS_STATIC_URL);

				const stopDefs = [
					// Coler Hospital-Bound (Direction 0)
					{ id: '450151', name: 'Subway Plaza', isOff: false },
					{ id: '450152', name: 'Octagon / Coler', isOff: false },
					{ id: '450150', name: 'Octagon / Coler', isOff: false },
					{ id: '450141', name: 'Southtown / Tech', isOff: false },

					// Astoria-Bound (Direction 1)
					{ id: '450142', name: 'Subway Plaza', isOff: false },
					{ id: '450069', name: 'Southtown / Tech', isOff: false },
					{ id: '450074', name: 'Octagon / Coler', isOff: false },
				];

				for (const def of stopDefs) {
					const deps = gtfsStaticStore.getScheduledDepartures(
						'q102_bus',
						def.id,
						now,
						windowMinutes,
					);
					for (const d of deps) {
						staticDepartures.push({ ...d, stopName: def.name, isOffIsland: def.isOff });
					}
				}
			} catch (staticErr) {
				console.warn(
					'GTFS static store unavailable for Q102, relying on SIRI live feed',
					staticErr,
				);
			}

			// 2. Fetch live SIRI VehicleMonitoring data
			const siriUrl = `${MTA_BUS_SIRI_VM_URL}?key=${encodeURIComponent(apiKey)}&version=2&LineRef=Q102`;
			const res = await fetch(siriUrl).catch(() => null);

			const departures: BusDeparture[] = [];

			if (res?.ok) {
				try {
					const json = await res.json();
					const activities =
						json?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0]?.VehicleActivity || [];

					for (const act of activities) {
						const journey = act?.MonitoredVehicleJourney;
						if (!journey) continue;

						const dirRef = journey.DirectionRef || '0';
						const isAstoriaBound =
							dirRef === '1' ||
							String(journey.DestinationName?.[0] || '')
								.toLowerCase()
								.includes('astoria');
						const direction = isAstoriaBound ? 'queens_bound' : 'northbound';
						const headsign = isAstoriaBound
							? 'Astoria - 27 Ave via RI Bridge'
							: 'Roosevelt Island - Coler Hospital';

						const call = journey.MonitoredCall;
						const expectedTime =
							call?.ExpectedArrivalTime ||
							call?.AimedArrivalTime ||
							new Date(now.getTime() + 10 * 60000).toISOString();
						const vehicleId = journey.VehicleRef
							? String(journey.VehicleRef).replace('MTABC_', '')
							: undefined;

						let occupancy: VehicleOccupancy | undefined;
						const rawOcc = String(journey.Occupancy || '').toLowerCase();
						if (rawOcc.includes('many') || rawOcc.includes('seatsavailable')) {
							occupancy = 'many_seats_available';
						} else if (rawOcc.includes('few')) {
							occupancy = 'few_seats_available';
						} else if (rawOcc.includes('standing')) {
							occupancy = 'standing_room_only';
						} else if (rawOcc.includes('full')) {
							occupancy = 'full';
						}

						const proximityText =
							call?.ArrivalProximityText ||
							(call?.NumberOfStopsAway !== undefined
								? `${call.NumberOfStopsAway} stops away`
								: undefined);

						const liveStopName = call?.StopPointName?.[0] || 'Subway Plaza';

						departures.push({
							id: `q102-live-${vehicleId || Math.random().toString(36).substring(2, 8)}`,
							mode: 'q102_bus',
							routeId: 'Q102',
							routeName: 'MTA Q102 Bus',
							tripId: journey.FramedVehicleJourneyRef?.DatedVehicleJourneyRef,
							headsign,
							destinationName: isAstoriaBound ? 'Astoria' : 'Coler Hospital',
							direction,
							scheduledTime: expectedTime,
							predictedTime: expectedTime,
							isRealtime: true,
							status: 'normal',
							stopName: liveStopName,
							vehicleId,
							occupancy,
							nextStopName: proximityText,
							vehicleLocation:
								journey.VehicleLocation?.Latitude && journey.VehicleLocation?.Longitude
									? {
											lat: journey.VehicleLocation.Latitude,
											lng: journey.VehicleLocation.Longitude,
											bearing: journey.Bearing,
											updatedAt: act.RecordedAtTime || now.toISOString(),
										}
									: undefined,
						});
					}
				} catch (siriErr) {
					console.warn('Failed to parse SIRI response for Q102 Bus', siriErr);
				}
			}

			// 3. Process static departures
			for (const stat of staticDepartures) {
				const isAstoria = stat.directionId === 1 || stat.headsign.toLowerCase().includes('astoria');
				departures.push({
					id: `q102-static-${stat.tripId}-${stat.stopId}`,
					mode: 'q102_bus',
					routeId: 'Q102',
					routeName: 'MTA Q102 Bus',
					tripId: stat.tripId,
					headsign: isAstoria
						? 'Astoria - 27 Ave via RI Bridge'
						: 'Roosevelt Island - Coler Hospital',
					destinationName: isAstoria ? 'Astoria' : 'Coler Hospital',
					direction: isAstoria ? 'queens_bound' : 'northbound',
					scheduledTime: stat.scheduledTime,
					isRealtime: false,
					status: 'normal',
					stopName: stat.stopName || 'Subway Plaza',
					stopId: stat.stopId,
					isOffIsland: stat.isOffIsland,
				});
			}

			// 4. Apply Dynamic Active Horizon Suppression
			const filtered = suppressGhostSchedules(departures);

			return {
				data: filtered.sort(
					(a, b) =>
						new Date(a.predictedTime || a.scheduledTime).getTime() -
						new Date(b.predictedTime || b.scheduledTime).getTime(),
				),
				fetchedAt: new Date().toISOString(),
				isCached: false,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: String(err),
			};
		}
	}

	async getVehicles(): Promise<ProviderResult<LiveVehiclePosition>> {
		try {
			const apiKey = env.MTA_BUS_TIME_API_KEY || '3fff4736-ddbb-443a-baab-c66a72bdc4c1';
			const siriUrl = `${MTA_BUS_SIRI_VM_URL}?key=${encodeURIComponent(apiKey)}&version=2&LineRef=Q102`;
			const res = await fetch(siriUrl).catch(() => null);

			const vehicles: LiveVehiclePosition[] = [];

			if (res?.ok) {
				const json = await res.json();
				const activities =
					json?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0]?.VehicleActivity || [];

				for (const act of activities) {
					const journey = act?.MonitoredVehicleJourney;
					if (!journey) continue;

					const dirRef = journey.DirectionRef || '0';
					const isAstoriaBound =
						dirRef === '1' ||
						String(journey.DestinationName?.[0] || '')
							.toLowerCase()
							.includes('astoria');

					const vehicleId = journey.VehicleRef
						? String(journey.VehicleRef).replace('MTABC_', '')
						: '7400';

					const call = journey.MonitoredCall;
					const nextStopName =
						call?.ArrivalProximityText ||
						(call?.NumberOfStopsAway !== undefined
							? `${call.NumberOfStopsAway} stops away`
							: undefined);

					vehicles.push({
						id: `q102-veh-${vehicleId}`,
						vehicleId,
						mode: 'q102_bus',
						routeId: 'Q102',
						direction: isAstoriaBound ? 'queens_bound' : 'northbound',
						lat: journey.VehicleLocation?.Latitude || 40.76,
						lng: journey.VehicleLocation?.Longitude || -73.95,
						bearing: journey.Bearing,
						nextStopName,
						destinationName: isAstoriaBound ? 'Astoria' : 'Coler Hospital',
						updatedAt: act.RecordedAtTime || new Date().toISOString(),
					});
				}
			}

			return {
				data: vehicles,
				fetchedAt: new Date().toISOString(),
				isCached: false,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: String(err),
			};
		}
	}

	async getAlerts(): Promise<ProviderResult<TransitAlert>> {
		return {
			data: [],
			fetchedAt: new Date().toISOString(),
			isCached: false,
		};
	}
}
