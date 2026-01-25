import { App, FuzzySuggestModal, AbstractInputSuggest, TFile } from "obsidian";

export class NoteSuggester extends FuzzySuggestModal<TFile> {
    notes: TFile[];
    onChoose: (note: TFile) => void;

    constructor(app: App, notes: TFile[], onChoose: (note: TFile) => void) {
        super(app);
        this.notes = notes;
        this.onChoose = onChoose;
    }

    getItems(): TFile[] {
        return this.notes;
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile): void {
        this.onChoose(item);
        this.close();
    }
}

export default class FilePopoverSuggest extends AbstractInputSuggest<TFile> {
    files: TFile[];
    private onPick: (file: TFile) => void;

    constructor(app: App, inputEl: HTMLInputElement, onPick: (file: TFile) => void) {
        super(app, inputEl);
        this.files = app.vault.getFiles();
        this.onPick = onPick;
    }

    getSuggestions(query: string): TFile[] {
        if (!query) return [];
        query = query.toLowerCase();
        return this.files.filter(file => file.path.toLowerCase().includes(query));
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.createDiv({ text: file.basename, cls: "suggestion-title" });
        el.createDiv({ text: file.path, cls: "suggestion-path" });
    }

    selectSuggestion(file: TFile, evt?: MouseEvent | KeyboardEvent): void {
        this.onPick(file);
    }
}
