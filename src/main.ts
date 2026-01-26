import { Plugin } from "obsidian";
import FavoritesNotesModal from "./modal";
import FavoritesNotesSettingTab, { DEFAULT_SETTINGS } from "./settings";
import { CURRENT_LOCALE } from "./locale";

export default class FavoritesNotesPlugin extends Plugin {
	settings!: FavoritesNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("layout-grid", CURRENT_LOCALE.openFavoritesNotesModal, () => {
			this.openModal();
		});

		this.addCommand({
			id: "open-favorites-modal",
			name: CURRENT_LOCALE.openFavoritesNotesModal,
			callback: () => this.openModal()
		});

		this.addSettingTab(
			new FavoritesNotesSettingTab(this.app, this)
		);
	}

	openModal() {
		new FavoritesNotesModal(this.app, this).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		if (!this.settings.favoriteNotes) this.settings.favoriteNotes = [];
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}