import { describe, expect, it } from 'vitest';
import { LiveTramProvider } from './LiveTramProvider';

describe('LiveTramProvider', () => {
	it('conforms to TransitProvider contract for tram mode', async () => {
		const provider = new LiveTramProvider();
		expect(provider.mode).toBe('tram');
		expect(provider.name).toBe('Roosevelt Island Tramway');
		expect(provider.capabilities.has('departures')).toBe(true);

		const result = await provider.getDepartures({ windowMinutes: 60 });
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data[0].mode).toBe('tram');
		expect(result.data[0].routeId).toBe('TRAM');
	});

	it('returns both Manhattan-bound and Island-bound departures', async () => {
		const provider = new LiveTramProvider();
		const result = await provider.getDepartures({ windowMinutes: 60 });

		const manhattanBound = result.data.filter((d) => d.direction === 'manhattan_bound');
		const islandBound = result.data.filter((d) => d.direction === 'queens_bound');

		expect(manhattanBound.length).toBeGreaterThan(0);
		expect(islandBound.length).toBeGreaterThan(0);
	});

	it('returns info alerts regarding tram schedule headways', async () => {
		const provider = new LiveTramProvider();
		const result = await provider.getAlerts();
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.data[0].mode).toBe('tram');
		expect(result.data[0].severity).toBe('info');
	});
});
