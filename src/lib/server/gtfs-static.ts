import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ScheduledDeparture {
	tripId: string;
	routeId: string;
	serviceId: string;
	headsign: string;
	directionId: number; // 0 or 1
	stopId: string;
	stopSequence: number;
	scheduledTime: string; // ISO 8601 timestamp for target date
}

export interface GtfsDataset {
	trips: Map<string, { routeId: string; serviceId: string; headsign: string; directionId: number }>;
	stopTimes: Map<
		string,
		Array<{
			tripId: string;
			stopId: string;
			arrivalTime: string;
			departureTime: string;
			stopSequence: number;
		}>
	>;
	calendar: Map<string, { days: number[]; startDate: string; endDate: string }>;
	calendarDates: Map<string, Array<{ date: string; exceptionType: number }>>;
}

const CACHE_DIR = path.resolve(process.cwd(), '.cache/gtfs');

function ensureCacheDir() {
	if (!fs.existsSync(CACHE_DIR)) {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
	}
}

function parseCsv(content: string): string[][] {
	const lines = content.split('\n');
	const results: string[][] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const row: string[] = [];
		let inQuotes = false;
		let field = '';
		for (let j = 0; j < line.length; j++) {
			const char = line[j];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				row.push(field.trim());
				field = '';
			} else {
				field += char;
			}
		}
		row.push(field.trim());
		results.push(row);
	}
	return results;
}

/**
 * Extracts local date components in the NYC timezone (America/New_York)
 * to prevent UTC date rollover bugs during evening hours.
 */
export function getLocalDateComponents(date: Date, timezone = 'America/New_York') {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short',
	});

	const parts = formatter.formatToParts(date);
	let year = '';
	let month = '';
	let day = '';
	let weekdayStr = '';

	for (const part of parts) {
		if (part.type === 'year') year = part.value;
		if (part.type === 'month') month = part.value;
		if (part.type === 'day') day = part.value;
		if (part.type === 'weekday') weekdayStr = part.value;
	}

	const dateStr = `${year}${month}${day}`;

	const dayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};
	const dayOfWeek = dayMap[weekdayStr] ?? date.getDay();

	return { dateStr, dayOfWeek, year: Number(year), month: Number(month) - 1, day: Number(day) };
}

export class GtfsStaticStore {
	private datasets = new Map<string, GtfsDataset>();

	async loadDataset(key: string, url: string, maxAgeMs = 86400000): Promise<GtfsDataset> {
		ensureCacheDir();
		const targetDir = path.join(CACHE_DIR, key);
		const zipPath = path.join(CACHE_DIR, `${key}.zip`);
		const metaPath = path.join(CACHE_DIR, `${key}.meta.json`);

		let needDownload = true;

		if (fs.existsSync(metaPath) && fs.existsSync(targetDir)) {
			try {
				const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
				if (Date.now() - meta.downloadedAt < maxAgeMs) {
					needDownload = false;
				}
			} catch (_e) {
				needDownload = true;
			}
		}

		if (needDownload) {
			try {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP error ${res.status}`);
				const buf = await res.arrayBuffer();
				fs.writeFileSync(zipPath, Buffer.from(buf));
				if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
				execSync(`unzip -o "${zipPath}" -d "${targetDir}"`);
				fs.writeFileSync(metaPath, JSON.stringify({ downloadedAt: Date.now() }));
			} catch (err) {
				console.warn(`Failed to download GTFS zip for ${key}, checking fallback...`, err);
				if (!fs.existsSync(targetDir)) {
					throw new Error(`GTFS dataset ${key} is unavailable`);
				}
			}
		}

		const parsed = this.parseDirectory(targetDir);
		this.datasets.set(key, parsed);
		return parsed;
	}

	private parseDirectory(dir: string): GtfsDataset {
		const tripsFile = path.join(dir, 'trips.txt');
		const stopTimesFile = path.join(dir, 'stop_times.txt');
		const calendarFile = path.join(dir, 'calendar.txt');
		const calendarDatesFile = path.join(dir, 'calendar_dates.txt');

		const trips = new Map<
			string,
			{ routeId: string; serviceId: string; headsign: string; directionId: number }
		>();
		if (fs.existsSync(tripsFile)) {
			const rows = parseCsv(fs.readFileSync(tripsFile, 'utf8'));
			if (rows.length > 0) {
				const header = rows[0].map((h) => h.toLowerCase());
				const routeIdx = header.indexOf('route_id');
				const serviceIdx = header.indexOf('service_id');
				const tripIdx = header.indexOf('trip_id');
				const headsignIdx = header.indexOf('trip_headsign');
				const dirIdx = header.indexOf('direction_id');

				for (let i = 1; i < rows.length; i++) {
					const row = rows[i];
					const tripId = row[tripIdx];
					if (!tripId) continue;
					trips.set(tripId, {
						routeId: row[routeIdx] || '',
						serviceId: row[serviceIdx] || '',
						headsign: row[headsignIdx] || '',
						directionId: dirIdx !== -1 ? Number.parseInt(row[dirIdx] || '0', 10) : 0,
					});
				}
			}
		}

		const stopTimes = new Map<
			string,
			Array<{
				tripId: string;
				stopId: string;
				arrivalTime: string;
				departureTime: string;
				stopSequence: number;
			}>
		>();
		if (fs.existsSync(stopTimesFile)) {
			const rows = parseCsv(fs.readFileSync(stopTimesFile, 'utf8'));
			if (rows.length > 0) {
				const header = rows[0].map((h) => h.toLowerCase());
				const tripIdx = header.indexOf('trip_id');
				const arrIdx = header.indexOf('arrival_time');
				const depIdx = header.indexOf('departure_time');
				const stopIdx = header.indexOf('stop_id');
				const seqIdx = header.indexOf('stop_sequence');

				for (let i = 1; i < rows.length; i++) {
					const row = rows[i];
					const stopId = row[stopIdx];
					if (!stopId) continue;

					const entry = {
						tripId: row[tripIdx] || '',
						stopId,
						arrivalTime: row[arrIdx] || '',
						departureTime: row[depIdx] || '',
						stopSequence: Number.parseInt(row[seqIdx] || '0', 10),
					};

					let arr = stopTimes.get(stopId);
					if (!arr) {
						arr = [];
						stopTimes.set(stopId, arr);
					}
					arr.push(entry);
				}
			}
		}

		const calendar = new Map<string, { days: number[]; startDate: string; endDate: string }>();
		if (fs.existsSync(calendarFile)) {
			const rows = parseCsv(fs.readFileSync(calendarFile, 'utf8'));
			if (rows.length > 0) {
				const header = rows[0].map((h) => h.toLowerCase());
				const serviceIdx = header.indexOf('service_id');
				const monIdx = header.indexOf('monday');
				const tueIdx = header.indexOf('tuesday');
				const wedIdx = header.indexOf('wednesday');
				const thuIdx = header.indexOf('thursday');
				const friIdx = header.indexOf('friday');
				const satIdx = header.indexOf('saturday');
				const sunIdx = header.indexOf('sunday');
				const startIdx = header.indexOf('start_date');
				const endIdx = header.indexOf('end_date');

				for (let i = 1; i < rows.length; i++) {
					const row = rows[i];
					const serviceId = row[serviceIdx];
					if (!serviceId) continue;

					const days: number[] = [];
					if (row[sunIdx] === '1') days.push(0);
					if (row[monIdx] === '1') days.push(1);
					if (row[tueIdx] === '1') days.push(2);
					if (row[wedIdx] === '1') days.push(3);
					if (row[thuIdx] === '1') days.push(4);
					if (row[friIdx] === '1') days.push(5);
					if (row[satIdx] === '1') days.push(6);

					calendar.set(serviceId, {
						days,
						startDate: row[startIdx] || '',
						endDate: row[endIdx] || '',
					});
				}
			}
		}

		const calendarDates = new Map<string, Array<{ date: string; exceptionType: number }>>();
		if (fs.existsSync(calendarDatesFile)) {
			const rows = parseCsv(fs.readFileSync(calendarDatesFile, 'utf8'));
			if (rows.length > 0) {
				const header = rows[0].map((h) => h.toLowerCase());
				const serviceIdx = header.indexOf('service_id');
				const dateIdx = header.indexOf('date');
				const excIdx = header.indexOf('exception_type');

				for (let i = 1; i < rows.length; i++) {
					const row = rows[i];
					const serviceId = row[serviceIdx];
					if (!serviceId) continue;

					const entry = {
						date: row[dateIdx] || '',
						exceptionType: Number.parseInt(row[excIdx] || '1', 10),
					};

					let arr = calendarDates.get(serviceId);
					if (!arr) {
						arr = [];
						calendarDates.set(serviceId, arr);
					}
					arr.push(entry);
				}
			}
		}

		return { trips, stopTimes, calendar, calendarDates };
	}

	isServiceActive(dataset: GtfsDataset, serviceId: string, date: Date): boolean {
		const { dateStr, dayOfWeek } = getLocalDateComponents(date);

		// Check calendar_dates exception first
		const exceptions = dataset.calendarDates.get(serviceId);
		if (exceptions) {
			const match = exceptions.find((e) => e.date === dateStr);
			if (match) {
				return match.exceptionType === 1; // 1 = Service added, 2 = Service removed
			}
		}

		const cal = dataset.calendar.get(serviceId);
		if (!cal) return true; // Default fallback if no calendar entry

		if (cal.startDate && dateStr < cal.startDate) return false;
		if (cal.endDate && dateStr > cal.endDate) return false;

		return cal.days.includes(dayOfWeek);
	}

	getScheduledDepartures(
		datasetKey: string,
		stopPrefix: string,
		date: Date,
		windowMinutes = 120,
	): ScheduledDeparture[] {
		const dataset = this.datasets.get(datasetKey);
		if (!dataset) return [];

		const nowMs = date.getTime();
		const { year, month, day } = getLocalDateComponents(date);
		const startOfDay = new Date(year, month, day, 0, 0, 0, 0);

		const results: ScheduledDeparture[] = [];

		for (const [stopId, entries] of dataset.stopTimes.entries()) {
			if (!stopId.startsWith(stopPrefix)) continue;

			for (const entry of entries) {
				const trip = dataset.trips.get(entry.tripId);
				if (!trip) continue;

				if (!this.isServiceActive(dataset, trip.serviceId, date)) continue;

				const timeStr = entry.departureTime || entry.arrivalTime;
				if (!timeStr) continue;

				const [hStr, mStr, sStr] = timeStr.split(':');
				const h = Number.parseInt(hStr, 10);
				const m = Number.parseInt(mStr, 10);
				const s = Number.parseInt(sStr || '0', 10);

				const scheduledDate = new Date(startOfDay.getTime());
				scheduledDate.setHours(h, m, s, 0);

				const diffMs = scheduledDate.getTime() - nowMs;
				// Window: from -5 minutes ago up to windowMinutes ahead
				if (diffMs >= -300000 && diffMs <= windowMinutes * 60000) {
					results.push({
						tripId: entry.tripId,
						routeId: trip.routeId,
						serviceId: trip.serviceId,
						headsign: trip.headsign,
						directionId: trip.directionId,
						stopId,
						stopSequence: entry.stopSequence,
						scheduledTime: scheduledDate.toISOString(),
					});
				}
			}
		}

		return results.sort(
			(a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
		);
	}
}

export const gtfsStaticStore = new GtfsStaticStore();
