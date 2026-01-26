import { App, PluginSettingTab, Setting, TextComponent, setIcon } from "obsidian";
import FavoritesNotesPlugin from "./main";
import { NoteSuggester } from "./suggester";
import { CURRENT_LOCALE } from "./locale";

export const DEFAULT_SETTINGS = {
    favoriteNotes: [],
    splitOnCtrlEnter: true
}
export default class FavoritesNotesSettingTab extends PluginSettingTab {
    plugin: FavoritesNotesPlugin;
    dragIndex: number | null = null;

    constructor(app: App, plugin: FavoritesNotesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.favoritesNotesTitle)
            .setHeading();

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.splitOnCtrlEnter)
            .setDesc(CURRENT_LOCALE.splitOnCtrlEnterDesc)
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.splitOnCtrlEnter)
                    .onChange(async value => {
                        this.plugin.settings.splitOnCtrlEnter = value;
                        void this.plugin.saveSettings();
                    });
            });

        const favoriteNotes = this.plugin.settings?.favoriteNotes || [];

        favoriteNotes.forEach((note: FavoriteNote, index: number) => {
            this.renderNoteRow(containerEl, note, index);
        });

        this.renderAddButton(containerEl);
    }

    renderNoteRow(containerEl: HTMLElement, note: FavoriteNote, index: number) {
        const setting = new Setting(containerEl);
        const rowEl = setting.settingEl;
        rowEl.addClass("favorites-notes-settings-row");
        rowEl.setAttr("draggable", "true");
        this.attachDragAndDrop(rowEl, index);

        setting.addExtraButton(btn => {
            btn.setIcon("grip-vertical");
            btn.setTooltip(CURRENT_LOCALE.dragHandleTooltip);
        });

        // Path input
        setting.addText((text: TextComponent) => {
            text.setPlaceholder(CURRENT_LOCALE.pathPlaceholder)
                .setValue(note.path || "")
                .onChange(async value => {
                    note.path = value;
                    void this.plugin.saveSettings();
                });

            text.inputEl.addEventListener("click", () => {
                this.openFileSuggester(note, text); // ✅ теперь тип TextComponent
            });
        });

        // Title input
        setting.addText((text: TextComponent) => {
            text.setPlaceholder(CURRENT_LOCALE.titlePlaceholder)
                .setValue(note.title || "")
                .onChange(async value => {
                    note.title = value;
                    void this.plugin.saveSettings();
                });
        });

        setting.addExtraButton(btn => {
            btn.setIcon("trash");
            btn.setTooltip(CURRENT_LOCALE.deleteNoteButton);
            btn.onClick(async () => {
                this.plugin.settings.favoriteNotes.splice(index, 1);
                void this.plugin.saveSettings();
                this.display();
            });
        });
    }

    openFileSuggester(note: FavoriteNote, text: TextComponent) {
        const files = this.app.vault.getFiles();
        new NoteSuggester(this.app, files, (file) => {
            note.path = file.path;
            text.setValue(file.path);
            if (!note.title) note.title = file.basename;
            this.plugin.saveSettings();
            this.display();
        }).open();
    }

    attachDragAndDrop(rowEl: HTMLElement, index: number) {
        rowEl.addEventListener("dragstart", () => {
            this.dragIndex = index;
            rowEl.addClass("is-dragging");
        });
        rowEl.addEventListener("dragend", () => {
            rowEl.removeClass("is-dragging");
        });
        rowEl.addEventListener("dragover", e => {
            e.preventDefault();
            rowEl.addClass("is-drag-over");
        });
        rowEl.addEventListener("dragleave", () => {
            rowEl.removeClass("is-drag-over");
        });
        rowEl.addEventListener("drop", () => {
            rowEl.removeClass("is-drag-over");
            if (this.dragIndex === null || this.dragIndex === index) return;
            const items = this.plugin.settings.favoriteNotes;
            const moved = items.splice(this.dragIndex, 1)[0];
            items.splice(index, 0, moved);
            this.dragIndex = null;
            void this.plugin.saveSettings();
            this.display();
        });
    }

    renderAddButton(containerEl: HTMLElement) {
        const wrapper = containerEl.createDiv({ cls: "favorites-notes-add-wrapper" });
        const btn = wrapper.createDiv({ cls: "favorites-notes-add-button" });

        setIcon(btn as HTMLElement, "plus");

        btn.onclick = async () => {
            this.plugin.settings.favoriteNotes.push({ path: "", title: "" });
            await this.plugin.saveSettings();
            this.display();
        };
    }
}