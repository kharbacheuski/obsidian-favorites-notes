import { App, Modal, TFile, Setting, Notice, TAbstractFile } from "obsidian";
import FavoritesNotesPlugin from "./main";
import FilePopoverSuggest from "./suggester";
import { CURRENT_LOCALE } from "./locale";

export default class FavoritesNotesModal extends Modal {
    plugin: FavoritesNotesPlugin;
    favoriteNotes: FavoriteNote[];
    currentFocusIndex: number = 0;
    cards: HTMLElement[] = [];
    keydownHandler: (e: KeyboardEvent) => void;

    constructor(app: App, plugin: FavoritesNotesPlugin) {
        super(app);
        this.plugin = plugin;
        this.favoriteNotes = plugin.settings.favoriteNotes;
        this.keydownHandler = this.handleKeyNavigation.bind(this);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("favorites-notes-modal");

        const headerSetting = new Setting(contentEl)
            .setName(CURRENT_LOCALE.favoritesNotesHeader)
            .setDesc(CURRENT_LOCALE.favoritesNotesDesc);

        let searchInputEl: HTMLInputElement;

        headerSetting.addText(text => {
            text.setPlaceholder(CURRENT_LOCALE.searchPlaceholder);
            searchInputEl = text.inputEl;

            new FilePopoverSuggest(this.app, searchInputEl, (file: TFile) => {
                void this.app.workspace.getLeaf(true).openFile(file)
                this.close();
            });
        });

        const cardsContainer = contentEl.createDiv({ cls: "favorites-notes-modal-cards" });
        document.addEventListener('keydown', this.keydownHandler);
        this.renderCards(cardsContainer);
    }

    handleKeyNavigation(e: KeyboardEvent) {
        if (this.favoriteNotes.length === 0) return;

        if (e.key === 'ArrowUp') {
            const newIndex = this.currentFocusIndex > 0 ? this.currentFocusIndex - 1 : this.favoriteNotes.length - 1;
            this.focusCard(newIndex);
        } else if (e.key === 'ArrowDown') {
            const newIndex = this.currentFocusIndex < this.favoriteNotes.length - 1 ? this.currentFocusIndex + 1 : 0;
            this.focusCard(newIndex);
        } else if (e.key === 'Enter' && this.currentFocusIndex >= 0) {
            const isSplit = this.plugin.settings.splitOnCtrlEnter && e.ctrlKey;
            void this.openFocusedCard(isSplit ? "split" : "tab");
        }
    }

    focusCard(index: number) {
        if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.cards.length) {
            this.cards[this.currentFocusIndex].removeClass('focus');
        }
        this.currentFocusIndex = index;
        if (index >= 0 && index < this.cards.length) {
            this.cards[index].addClass('focus');
        }
    }

        async openFocusedCard(openIn: "tab" | "split" = "tab") {
            const favoriteNotes = this.favoriteNotes || [];
            if (this.currentFocusIndex < 0 || this.currentFocusIndex >= favoriteNotes.length) return;

            const note = favoriteNotes[this.currentFocusIndex];
            const file: TAbstractFile | null = this.app.vault.getAbstractFileByPath(note.path);

            if (!(file instanceof TFile)) {
                new Notice(CURRENT_LOCALE.fileNotFound);
                return;
            }

            await this.app.workspace.getLeaf(openIn).openFile(file);
            this.close();
        }

    renderCards(container: HTMLElement) {
        container.empty();

        const favoriteNotes = this.favoriteNotes || [];

        favoriteNotes.forEach(({ path, title }, index) => {
            const card = container.createDiv({ cls: "favorites-notes-card" });
            this.cards.push(card);

            if (index === this.currentFocusIndex) {
                card.addClass("focus");
            }

            // Верх: название
            const head = card.createDiv({ cls: "favorites-notes-card-head" });
            head.createDiv({ cls: "favorites-notes-card-title", text: title || path });

            // Хинт ctrl+enter
            head.createDiv({
                cls: "favorites-notes-card-hint",
                text: this.plugin.settings.splitOnCtrlEnter ? CURRENT_LOCALE.cardHintSplit : ""
            });

            // Теги файла
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                const tags = this.app.metadataCache.getFileCache(file)?.tags?.map(t => t.tag);
                if (tags?.length) {
                    const tagsEl = card.createDiv({ cls: "favorites-notes-card-info" });
                    tags.forEach(tag => {
                        const tagLink = tagsEl.createEl("a", { cls: "tag", text: tag });
                        tagLink.href = tag;
                    });
                }
            }

            // Клик по карточке
            card.onclick = async () => {
                if (!(file instanceof TFile)) {
                    new Notice(CURRENT_LOCALE.invalidFile);
                    return;
                }
                await this.app.workspace.getLeaf(true).openFile(file);
                this.close();
            };
        });
    }

    onClose() {
        document.removeEventListener('keydown', this.keydownHandler);
        this.cards = [];
        this.contentEl.empty();
        this.currentFocusIndex = 0;
    }
}