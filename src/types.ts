import "obsidian";

declare global {
	interface FavoriteNote {
		path: string;
		title: string;
	}

	interface FavoritesNotesSettings {
		favoriteNotes: FavoriteNote[];
		splitOnCtrlEnter: boolean;
	}
}
