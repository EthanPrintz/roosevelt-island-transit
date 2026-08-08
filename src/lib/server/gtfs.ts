import transit_realtime from 'gtfs-realtime-bindings';

export interface DecodedGtfsFeed {
	header: {
		gtfsRealtimeVersion: string;
		timestamp: number;
	};
	entity: Array<{
		id: string;
		tripUpdate?: {
			trip: {
				tripId?: string;
				routeId?: string;
				startDate?: string;
				startTime?: string;
			};
			stopTimeUpdate?: Array<{
				stopSequence?: number;
				stopId?: string;
				arrival?: { time?: number; delay?: number };
				departure?: { time?: number; delay?: number };
			}>;
		};
		alert?: {
			activePeriod?: Array<{ start?: number; end?: number }>;
			informedEntity?: Array<{ agencyId?: string; routeId?: string; stopId?: string }>;
			headerText?: { translation?: Array<{ text?: string }> };
			descriptionText?: { translation?: Array<{ text?: string }> };
		};
	}>;
}

/**
 * Decodes binary GTFS-Realtime Protocol Buffer payload into typed FeedMessage.
 */
export function decodeGtfsRealtimeBuffer(buffer: ArrayBuffer | Uint8Array): DecodedGtfsFeed {
	const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	const feed = transit_realtime.transit_realtime.FeedMessage.decode(uint8);
	return transit_realtime.transit_realtime.FeedMessage.toObject(feed, {
		defaults: true,
		enums: String,
		longs: Number,
	}) as unknown as DecodedGtfsFeed;
}
