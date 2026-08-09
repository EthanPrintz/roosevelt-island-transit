class TransitSettingsState {
	selectedWindow = $state<number>(120); // Default 2 hours
	isLoading = $state<boolean>(false);
	fetchedAt = $state<string>('');
	refreshTrigger = $state<number>(0);

	setWindow(windowMins: number) {
		this.selectedWindow = windowMins;
	}

	triggerRefresh() {
		this.refreshTrigger++;
	}
}

export const transitSettings = new TransitSettingsState();
