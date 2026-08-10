/**
 * Map Settings & Viewport State Module
 *
 * Manages layer visibility toggles, responsive view modes ('split' | 'cards' | 'map'),
 * mobile bottom sheet snap positions, entity selection, and OpenFreeMap vector tile style endpoints.
 */

export type MapViewMode = 'split' | 'cards' | 'map';
export type SheetSnapPosition = 'peek' | 'half' | 'full';
export type MapStyleName = 'liberty' | 'bright' | 'positron' | 'dark';

export type LayerKey = 'subway' | 'tram' | 'ferry' | 'buses' | 'citibike';

class MapSettingsState {
	viewMode = $state<MapViewMode>('split');
	sheetSnap = $state<SheetSnapPosition>('half');

	showSubway = $state<boolean>(true);
	showTram = $state<boolean>(true);
	showFerry = $state<boolean>(true);
	showBuses = $state<boolean>(true);
	showCitiBike = $state<boolean>(true);

	selectedEntityId = $state<string | null>(null);
	selectedCoords = $state<[number, number] | null>(null);

	activeStyleName = $state<MapStyleName>('liberty');

	get styleUrl(): string {
		return `https://tiles.openfreemap.org/styles/${this.activeStyleName}`;
	}

	setViewMode(mode: MapViewMode) {
		this.viewMode = mode;
	}

	setSheetSnap(snap: SheetSnapPosition) {
		this.sheetSnap = snap;
	}

	toggleLayer(key: LayerKey) {
		switch (key) {
			case 'subway':
				this.showSubway = !this.showSubway;
				break;
			case 'tram':
				this.showTram = !this.showTram;
				break;
			case 'ferry':
				this.showFerry = !this.showFerry;
				break;
			case 'buses':
				this.showBuses = !this.showBuses;
				break;
			case 'citibike':
				this.showCitiBike = !this.showCitiBike;
				break;
		}
	}

	selectEntity(id: string, coords?: [number, number]) {
		this.selectedEntityId = id;
		this.selectedCoords = coords ?? null;
	}

	clearSelection() {
		this.selectedEntityId = null;
		this.selectedCoords = null;
	}

	setStyle(styleName: MapStyleName) {
		this.activeStyleName = styleName;
	}
}

export const mapSettings = new MapSettingsState();
