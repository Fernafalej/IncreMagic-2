/**
 * SavePanel — UI für Save/Export/Import/Reset
 *
 * 3 Buttons: Export JSON, Import JSON, Reset
 * Import nutzt versteckten input[type=file] der per Click getriggert wird.
 * Kurzer Status-Text: Gespeichert / Importiert / Fehler: ...
 */

import { saveManager } from '../../saves/SaveManager.js';

export class SavePanel {
    private container: HTMLElement;
    private statusEl: HTMLElement | null = null;
    private fileInput: HTMLInputElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="save-panel">
                <div class="save-panel-title">Spielstand</div>
                <div class="save-panel-buttons">
                    <button class="save-btn save-btn--export" title="Spielstand als JSON-Datei herunterladen">Export JSON</button>
                    <button class="save-btn save-btn--import" title="Spielstand aus JSON-Datei laden">Import JSON</button>
                    <button class="save-btn save-btn--reset" title="Spielstand unwiderruflich löschen">Reset</button>
                </div>
                <div class="save-panel-status"></div>
                <input type="file" accept=".json" style="display:none" class="save-file-input" />
            </div>
        `;

        this.statusEl = this.container.querySelector('.save-panel-status');
        this.fileInput = this.container.querySelector('.save-file-input');

        const exportBtn = this.container.querySelector('.save-btn--export') as HTMLButtonElement;
        const importBtn = this.container.querySelector('.save-btn--import') as HTMLButtonElement;
        const resetBtn  = this.container.querySelector('.save-btn--reset')  as HTMLButtonElement;

        exportBtn.addEventListener('click', () => this.onExport());
        importBtn.addEventListener('click', () => this.fileInput?.click());
        resetBtn.addEventListener('click',  () => this.onReset());

        this.fileInput?.addEventListener('change', (e) => this.onFileSelected(e));
    }

    private onExport(): void {
        try {
            saveManager.exportJSON();
            this.setStatus('Exportiert.', 'ok');
        } catch (e: any) {
            this.setStatus(`Fehler: ${e?.message ?? e}`, 'error');
        }
    }

    private onReset(): void {
        const confirmed = window.confirm(
            'Spielstand wirklich unwiderruflich löschen?\nDies kann nicht rückgängig gemacht werden.',
        );
        if (!confirmed) return;
        saveManager.reset();
        // reset() löst location.reload() aus — ab hier läuft kein Code mehr
    }

    private onFileSelected(e: Event): void {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const json = ev.target?.result as string;
            try {
                saveManager.importJSON(json);
                this.setStatus('Importiert.', 'ok');
                // importJSON löst location.reload() aus
            } catch (err: any) {
                this.setStatus(`Fehler: ${err?.message ?? err}`, 'error');
            }
        };
        reader.onerror = () => {
            this.setStatus('Fehler: Datei konnte nicht gelesen werden.', 'error');
        };
        reader.readAsText(file);

        // Input zurücksetzen damit dieselbe Datei erneut gewählt werden kann
        input.value = '';
    }

    private setStatus(msg: string, type: 'ok' | 'error'): void {
        if (!this.statusEl) return;
        this.statusEl.textContent = msg;
        this.statusEl.className = `save-panel-status save-panel-status--${type}`;

        // Status nach 4 Sekunden ausblenden
        setTimeout(() => {
            if (this.statusEl) {
                this.statusEl.textContent = '';
                this.statusEl.className = 'save-panel-status';
            }
        }, 4000);
    }
}
