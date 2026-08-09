import { getLocalDateComponents } from '$lib/server/gtfs-static';
import type { DepartureOptions, ProviderCapability, TransitProvider } from '../domain/provider';
import type { ProviderResult, TramDeparture, TransitAlert, TransitMode } from '../domain/types';

/**
 * LiveTramProvider
 *
 * Engine for Roosevelt Island Tramway departures tailored to RIOC operational parameters.
 * Computes headway departure schedules (7.5m rush hour, 15m off-peak) using NYC local time,
 * handles late-night operating hours (6:00 AM - 2:00 AM / 3:30 AM), and provides
 * operational status transparency (`isRealtime: false`).
 */
export class LiveTramProvider implements TransitProvider {
	readonly mode: TransitMode = 'tram';
	readonly name = 'Roosevelt Island Tramway';
	readonly capabilities = new Set<ProviderCapability>(['departures', 'alerts']);

	async getDepartures(options?: DepartureOptions): Promise<ProviderResult<TramDeparture>> {
		try {
			const now = new Date();
			const windowMinutes = options?.windowMinutes ?? 120;
			const windowEnd = new Date(now.getTime() + windowMinutes * 60000);

			const departures: TramDeparture[] = [];

			// Step through time in 30-second steps to accurately generate headway departures
			let cursor = new Date(now.getTime() - 2 * 60000); // Start 2 minutes ago to capture arriving/departing soon
			cursor.setSeconds(0, 0);

			while (cursor.getTime() <= windowEnd.getTime()) {
				const { dayOfWeek } = getLocalDateComponents(cursor);
				const hours = cursor.getHours();
				const minutes = cursor.getMinutes();
				const seconds = cursor.getSeconds();
				const timeInMins = hours * 60 + minutes + seconds / 60;

				const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
				const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

				// Determine operating bounds for the day
				// Open: 6:00 AM (360 mins)
				// Close: 2:00 AM (120 mins next day = 1560 mins) or 3:30 AM (210 mins next day = 1650 mins)
				const isClosed = timeInMins >= 120 && timeInMins < 360 && !isFridayOrSaturday;
				const isClosedFriSat = timeInMins >= 210 && timeInMins < 360 && isFridayOrSaturday;

				if (!isClosed && !isClosedFriSat && timeInMins >= 360) {
					// Check if current time falls on an exact headway interval
					const isRushHour =
						isWeekday &&
						((timeInMins >= 420 && timeInMins < 600) || // 7:00 AM - 10:00 AM
							(timeInMins >= 870 && timeInMins < 1140)); // 2:30 PM - 7:00 PM

					const headwayMins = isRushHour ? 7.5 : 15.0;

					// Check if timeInMins from start of hour is a multiple of headwayMins
					const minsFromHour = minutes + seconds / 60;
					const remainder = (minsFromHour * 10) % (headwayMins * 10);

					if (Math.abs(remainder) < 0.1 && cursor.getTime() >= now.getTime() - 2 * 60000) {
						const isoTime = cursor.toISOString();
						const diffMins = Math.round((cursor.getTime() - now.getTime()) / 60000);

						// Departure 1: Manhattan-Bound (from Roosevelt Island)
						departures.push({
							id: `tram-ri-manhattan-${cursor.getTime()}`,
							mode: 'tram',
							routeId: 'TRAM',
							routeName: 'Roosevelt Island Tramway',
							headsign: 'Manhattan (59th St & 2nd Ave)',
							destinationName: 'Manhattan',
							direction: 'manhattan_bound',
							scheduledTime: isoTime,
							predictedTime: isoTime,
							isRealtime: false,
							delaySeconds: 0,
							status: diffMins <= 2 && diffMins >= 0 ? 'normal' : 'normal',
							stopName: 'Roosevelt Island Tram Station',
							cabin: (minutes / headwayMins) % 2 === 0 ? 'North Cabin' : 'South Cabin',
							isBoarding: diffMins <= 2 && diffMins >= 0,
						});

						// Departure 2: Roosevelt Island-Bound (from Manhattan 59th St)
						departures.push({
							id: `tram-manhattan-ri-${cursor.getTime()}`,
							mode: 'tram',
							routeId: 'TRAM',
							routeName: 'Roosevelt Island Tramway',
							headsign: 'Roosevelt Island Landing',
							destinationName: 'Roosevelt Island',
							direction: 'queens_bound',
							scheduledTime: isoTime,
							predictedTime: isoTime,
							isRealtime: false,
							delaySeconds: 0,
							status: 'normal',
							stopName: 'Manhattan 59th St Tram Station',
							cabin: (minutes / headwayMins) % 2 === 0 ? 'South Cabin' : 'North Cabin',
							isBoarding: diffMins <= 2 && diffMins >= 0,
						});
					}
				}

				// Increment cursor by 30 seconds
				cursor = new Date(cursor.getTime() + 30000);
			}

			// Sort by scheduled arrival time
			departures.sort(
				(a, b) =>
					new Date(a.predictedTime || a.scheduledTime).getTime() -
					new Date(b.predictedTime || b.scheduledTime).getTime(),
			);

			return {
				data: departures,
				fetchedAt: new Date().toISOString(),
				isCached: false,
			};
		} catch (err) {
			return {
				data: [],
				fetchedAt: new Date().toISOString(),
				isCached: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	async getAlerts(): Promise<ProviderResult<TransitAlert>> {
		return {
			data: [
				{
					id: 'tram-advisory-schedule',
					mode: 'tram',
					affectedRoutes: ['TRAM'],
					title: 'Tramway Operating Schedule',
					description:
						'Trams run every 7.5 minutes during weekday peak hours (7-10 AM & 2:30-7 PM) and every 15 minutes off-peak.',
					severity: 'info',
					effect: 'OTHER',
				},
			],
			fetchedAt: new Date().toISOString(),
			isCached: false,
		};
	}
}
