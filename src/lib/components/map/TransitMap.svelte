<script lang="ts">
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { mapSettings } from '$lib/state/map-settings.svelte';
import { themeState } from '$lib/state/theme.svelte';
import type { BikeStation, LiveVehiclePosition } from '$lib/transit/domain/types';
import {
	bikeStationsToGeoJSON,
	getFixedTransitStopsGeoJSON,
	getModeAccentColor,
	getRouteLabel,
	getTransitRoutesGeoJSON,
} from '$lib/transit/map/map-adapter';

let {
	vehicles = [],
	stations = [],
	onSelectEntity,
} = $props<{
	vehicles?: LiveVehiclePosition[];
	stations?: BikeStation[];
	onSelectEntity?: (id: string) => void;
}>();

let mapContainer: HTMLDivElement;
let map: any = $state(null);
let isLoaded = $state(false);
let activeStyleUrl = '';

// Map to track active MapLibre HTML vehicle markers & single popup reference
let htmlMarkersMap = new Map<string, any>();
let maplibreglRef: any = null;
let activePopup: any = null;

function getModeSvgIcon(mode: string): string {
	switch (mode) {
		case 'subway':
			return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 15h.01M16 15h.01M7 21l2-4M17 21l-2-4"/></svg>`;
		case 'tram':
			return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l6 3 6-3M12 6v3M4 9h16a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a1 1 0 0 1 1-1z"/><path d="M4 14h16M8 19v2M16 19v2"/></svg>`;
		case 'ferry':
			return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16l-1.5 6H5.5L4 11z"/><path d="M6 11V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><path d="M9 5V3M15 5V3"/><path d="M2 20c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1"/></svg>`;
		case 'citibike':
			return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l1.5 5.5H12l-1.5-4.5L7.5 14M12 11.5L8.5 17.5"/></svg>`;
		default: // Bus (Red Bus / Q102)
			return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1M15 16v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/><path d="M3 11h18M7 14h.01M17 14h.01"/></svg>`;
	}
}

const CHEVRON_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>`;

function showSinglePopup(
	mapInstance: any,
	coords: [number, number],
	title: string,
	subtitle: string,
	color: string,
	modeIcon?: string,
) {
	if (activePopup) {
		activePopup.remove();
		activePopup = null;
	}

	if (!mapInstance || !maplibreglRef) return;

	const iconMarkup = modeIcon
		? `<span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: ${color};">${modeIcon}</span>`
		: '';

	const html = `
		<div style="font-family: inherit; padding: 2px 4px 2px 0;">
			<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
				${iconMarkup}
				<strong style="font-size: 13px; font-weight: 700; color: var(--text-main); letter-spacing: -0.01em;">${title}</strong>
			</div>
			<div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">${subtitle}</div>
		</div>
	`;

	activePopup = new maplibreglRef.Popup({
		offset: 14,
		closeButton: true,
		closeOnClick: true,
	})
		.setLngLat(coords)
		.setHTML(html)
		.addTo(mapInstance);

	activePopup.on('close', () => {
		activePopup = null;
	});
}

function updateVehicleHtmlMarkers(mapInstance: any) {
	if (!mapInstance || !maplibreglRef) return;

	// Clean up existing markers before updating DOM
	for (const marker of htmlMarkersMap.values()) {
		marker.remove();
	}
	htmlMarkersMap.clear();

	const showVehicles = mapSettings.showBuses || mapSettings.showTram || mapSettings.showFerry;

	if (showVehicles && Array.isArray(vehicles)) {
		for (const v of vehicles) {
			if (typeof v.lat !== 'number' || typeof v.lng !== 'number') continue;

			// Filter based on mode toggles
			if (v.mode === 'red_bus' || v.mode === 'q102_bus') {
				if (!mapSettings.showBuses) continue;
			} else if (v.mode === 'tram') {
				if (!mapSettings.showTram) continue;
			} else if (v.mode === 'ferry') {
				if (!mapSettings.showFerry) continue;
			}

			const color = getModeAccentColor(v.mode);
			const routeLabel = getRouteLabel(v.mode, v.routeId);
			const bearing = typeof v.bearing === 'number' ? v.bearing : 0;
			const svgIcon = getModeSvgIcon(v.mode);

			const el = document.createElement('div');
			// Explicit fixed dimensions (88px x 24px) prevent offsetWidth reflow jitters during map pan/zoom
			el.setAttribute(
				'style',
				`display: flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; width: auto !important; height: 24px !important; box-sizing: border-box !important; padding: 0 7px !important; border-radius: 9999px !important; color: #ffffff !important; background-color: ${color} !important; border: 1.5px solid rgba(255, 255, 255, 0.95) !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important; white-space: nowrap !important; pointer-events: auto !important; cursor: pointer !important; user-select: none !important;`,
			);

			el.innerHTML = `
				<span style="display: flex; align-items: center; justify-content: center; width: 13px; height: 13px; flex-shrink: 0;">${svgIcon}</span>
				<span style="display: flex; align-items: center; justify-content: center; width: 10px; height: 10px; flex-shrink: 0; transform: rotate(${bearing}deg);">${CHEVRON_SVG}</span>
			`;

			el.addEventListener('click', (e) => {
				e.stopPropagation();
				mapSettings.selectEntity(v.id, [v.lng, v.lat]);
				onSelectEntity?.(v.id);

				const title = v.vehicleId ? `#${v.vehicleId}` : routeLabel;
				const subtitle = v.nextStopName ? `Next stop: ${v.nextStopName}` : v.direction || v.mode;
				showSinglePopup(mapInstance, [v.lng, v.lat], title, subtitle, color, svgIcon);
			});

			const marker = new maplibreglRef.Marker({ element: el, anchor: 'center' })
				.setLngLat([v.lng, v.lat])
				.addTo(mapInstance);

			htmlMarkersMap.set(v.id, marker);
		}
	}
}

function setupMapSourcesAndLayers(mapInstance: any) {
	if (!mapInstance || !mapInstance.isStyleLoaded()) return;

	// 1. Transit Routes Layer (Corridor lines)
	if (!mapInstance.getSource('transit-routes')) {
		mapInstance.addSource('transit-routes', {
			type: 'geojson',
			data: getTransitRoutesGeoJSON(),
		});

		mapInstance.addLayer({
			id: 'transit-routes-line',
			type: 'line',
			source: 'transit-routes',
			paint: {
				'line-color': ['get', 'color'],
				'line-width': 3,
				'line-opacity': 0.35,
			},
		});
	}

	// 2. Fixed Transit Hubs & Bus Stops Component Layer (Minimalist Dots)
	if (!mapInstance.getSource('fixed-stops')) {
		mapInstance.addSource('fixed-stops', {
			type: 'geojson',
			data: getFixedTransitStopsGeoJSON(),
		});

		mapInstance.addLayer({
			id: 'fixed-stops-circle',
			type: 'circle',
			source: 'fixed-stops',
			paint: {
				'circle-color': ['get', 'color'],
				'circle-radius': 3.5,
				'circle-opacity': 0.85,
				'circle-stroke-width': 1,
				'circle-stroke-color': '#ffffff',
				'circle-stroke-opacity': 0.6,
			},
		});
	}

	// 3. Citi Bike Stations Component Layer (Minimalist Dots)
	if (!mapInstance.getSource('bike-stations')) {
		mapInstance.addSource('bike-stations', {
			type: 'geojson',
			data: bikeStationsToGeoJSON(stations),
		});

		mapInstance.addLayer({
			id: 'bike-stations-circle',
			type: 'circle',
			source: 'bike-stations',
			paint: {
				'circle-color': ['get', 'statusColor'],
				'circle-radius': 3.5,
				'circle-opacity': 0.85,
				'circle-stroke-width': 1,
				'circle-stroke-color': '#ffffff',
				'circle-stroke-opacity': 0.6,
			},
		});
	} else {
		mapInstance.getSource('bike-stations').setData(bikeStationsToGeoJSON(stations));
	}

	// Update HTML vehicle markers
	updateVehicleHtmlMarkers(mapInstance);

	// Update layer visibilities
	const setVis = (layerId: string, visible: boolean) => {
		if (mapInstance.getLayer(layerId)) {
			mapInstance.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
		}
	};

	const showStops =
		mapSettings.showSubway ||
		mapSettings.showTram ||
		mapSettings.showFerry ||
		mapSettings.showBuses;

	setVis('fixed-stops-circle', showStops);
	setVis('transit-routes-line', showStops);

	setVis('bike-stations-circle', mapSettings.showCitiBike);
}

onMount(() => {
	if (!browser) return;

	let mapInstance: any;
	let resizeObserver: ResizeObserver | null = null;

	async function initMap() {
		const mod = (await import('maplibre-gl')) as any;
		maplibreglRef = mod.default || mod;

		const targetStyle = themeState.isDark
			? 'https://tiles.openfreemap.org/styles/dark'
			: 'https://tiles.openfreemap.org/styles/liberty';

		activeStyleUrl = targetStyle;

		mapInstance = new maplibreglRef.Map({
			container: mapContainer,
			style: targetStyle,
			center: [-73.9496, 40.7615], // Roosevelt Island centroid
			zoom: 14.5,
			bearing: 0,
			pitch: 0,
			attributionControl: false,
			maxBounds: [
				[-73.975, 40.74],
				[-73.93, 40.785],
			],
		});

		// Listen to style.load to re-add custom layers whenever basemap style is loaded or changed
		mapInstance.on('style.load', () => {
			setupMapSourcesAndLayers(mapInstance);

			// Setup marker click handlers
			const setupClick = (layerId: string) => {
				mapInstance.on('click', layerId, (e: any) => {
					const feature = e.features?.[0];
					if (!feature) return;
					const id = feature.properties?.id;
					if (id) {
						mapSettings.selectEntity(id, feature.geometry.coordinates);
						onSelectEntity?.(id);

						const coords = feature.geometry.coordinates.slice();
						const title = feature.properties.title || feature.properties.name || id;
						const subtitle = feature.properties.subtitle || feature.properties.mode || '';
						const mode = feature.properties.mode || 'subway';
						const color =
							feature.properties.color ||
							feature.properties.statusColor ||
							getModeAccentColor(mode as any);
						const svgIcon = getModeSvgIcon(mode);

						showSinglePopup(mapInstance, coords, title, subtitle, color, svgIcon);
					}
				});

				mapInstance.on('mouseenter', layerId, () => {
					mapInstance.getCanvas().style.cursor = 'pointer';
				});
				mapInstance.on('mouseleave', layerId, () => {
					mapInstance.getCanvas().style.cursor = '';
				});
			};

			setupClick('bike-stations-circle');
			setupClick('fixed-stops-circle');
		});

		mapInstance.on('load', () => {
			map = mapInstance;
			isLoaded = true;
			setupMapSourcesAndLayers(mapInstance);
		});

		// Setup ResizeObserver to trigger map.resize() on layout shifts
		if (typeof ResizeObserver !== 'undefined' && mapContainer) {
			resizeObserver = new ResizeObserver(() => {
				if (mapInstance && typeof mapInstance.resize === 'function') {
					mapInstance.resize();
				}
			});
			resizeObserver.observe(mapContainer);
		}
	}

	initMap();

	return () => {
		if (activePopup) {
			activePopup.remove();
			activePopup = null;
		}
		for (const marker of htmlMarkersMap.values()) {
			marker.remove();
		}
		htmlMarkersMap.clear();

		if (resizeObserver) resizeObserver.disconnect();
		if (mapInstance && typeof mapInstance.remove === 'function') {
			mapInstance.remove();
		}
	};
});

// Reactive update for vehicle and station GeoJSON sources & layer visibilities
$effect(() => {
	if (map && isLoaded) {
		setupMapSourcesAndLayers(map);
	}
});

// Reactive flyTo when selectedCoords changes
$effect(() => {
	if (map && isLoaded && mapSettings.selectedCoords) {
		const [lng, lat] = mapSettings.selectedCoords;
		map.flyTo({
			center: [lng, lat],
			zoom: 16,
			duration: 1200,
		});
	}
});

// Dynamic theme sync (light/dark vector tiles)
$effect(() => {
	if (map && isLoaded) {
		const targetStyle = themeState.isDark
			? 'https://tiles.openfreemap.org/styles/dark'
			: 'https://tiles.openfreemap.org/styles/liberty';

		if (activeStyleUrl !== targetStyle) {
			activeStyleUrl = targetStyle;
			map.setStyle(targetStyle);
		}
	}
});

export function flyTo(lng: number, lat: number, zoom = 16) {
	if (map && isLoaded) {
		map.flyTo({ center: [lng, lat], zoom, duration: 1200 });
	}
}
</script>

<div class="relative w-full h-full min-h-75 rounded-2xl overflow-hidden border border-border-default shadow-2xs bg-bg-surface">
	<!-- Map Container Canvas -->
	<div bind:this={mapContainer} class="w-full h-full"></div>

	<!-- Map Watermark & Credit Badge -->
	<div class="absolute bottom-2 left-3 z-10 text-[10px] text-text-muted font-mono bg-bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-border-subtle pointer-events-none">
		OpenFreeMap • MapLibre GL
	</div>
</div>
