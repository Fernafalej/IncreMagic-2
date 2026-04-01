/**
 * ScribeListPanel — UI: Ziel-Konfiguration für automatische Golem-Produktion
 *
 * Zeigt pro GolemClass:
 *   Name | aktueller Pool-Count | Ziel-Input | +/- Buttons
 *
 * Warnt wenn kein Scribe-Pool aktiv ist (count > 0).
 * Aktualisiert via Ticker 1x/s.
 *
 * Container: #scribe-list-container
 */

import { ticker } from '../../core/Ticker.js';
import { golemManager } from '../../golems/GolemManager.js';
import { scribeList } from '../../golems/ScribeList.js';

// Bekannte GolemClasses mit angezeigtem Label
const SCRIBE_CLASSES: Array<{ cls: string; label: string }> = [
    { cls: 'earth-gatherer', label: 'Erd-Sammler' },
    { cls: 'water-gatherer', label: 'Wasser-Sammler' },
    { cls: 'wood-gatherer',  label: 'Holz-Sammler' },
    { cls: 'scribe',         label: 'Schreiber' },
    { cls: 'idle-golem',     label: 'Ruhender Golem' },
];

export class ScribeListPanel {
    private container: HTMLElement;
    private tickAccum: number = 0;
    private readonly UPDATE_INTERVAL = 1.0; // Sekunden

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        ticker.register(this.onTick.bind(this));
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    private render(): void {
        this.container.innerHTML = `
            <div class="scribe-list-panel">
                <div class="scribe-list-title">Schreiber-Ziele</div>
                <div class="scribe-list-warning" style="display:none">
                    ⚠ Kein Scribe aktiv
                </div>
                <div class="scribe-list-rows"></div>
            </div>
        `;

        this.rebuildRows();
        this.updateValues();
    }

    /** Zeilen für jede GolemClass aufbauen */
    private rebuildRows(): void {
        const rowsEl = this.container.querySelector('.scribe-list-rows') as HTMLElement | null;
        if (!rowsEl) return;

        rowsEl.innerHTML = '';

        for (const entry of SCRIBE_CLASSES) {
            const row = document.createElement('div');
            row.className = 'scribe-list-row';
            row.dataset['cls'] = entry.cls;

            row.innerHTML = `
                <span class="scribe-list-name">${entry.label}</span>
                <span class="scribe-list-count" data-count>0</span>
                <button class="scribe-list-btn scribe-list-btn--minus" title="Ziel verringern">−</button>
                <input
                    class="scribe-list-input"
                    type="number"
                    min="0"
                    max="999"
                    value="${scribeList.getTarget(entry.cls)}"
                    data-input
                />
                <button class="scribe-list-btn scribe-list-btn--plus" title="Ziel erhöhen">+</button>
            `;

            // Buttons
            const minusBtn = row.querySelector('.scribe-list-btn--minus') as HTMLButtonElement;
            const plusBtn  = row.querySelector('.scribe-list-btn--plus')  as HTMLButtonElement;
            const input    = row.querySelector('[data-input]')             as HTMLInputElement;

            minusBtn.addEventListener('click', () => {
                const cur = scribeList.getTarget(entry.cls);
                scribeList.setTarget(entry.cls, cur - 1);
                input.value = String(scribeList.getTarget(entry.cls));
            });

            plusBtn.addEventListener('click', () => {
                const cur = scribeList.getTarget(entry.cls);
                scribeList.setTarget(entry.cls, cur + 1);
                input.value = String(scribeList.getTarget(entry.cls));
            });

            input.addEventListener('change', () => {
                const parsed = parseInt(input.value, 10);
                scribeList.setTarget(entry.cls, isNaN(parsed) ? 0 : parsed);
                input.value = String(scribeList.getTarget(entry.cls));
            });

            rowsEl.appendChild(row);
        }
    }

    /** Nur die dynamischen Werte aktualisieren (kein full rebuild) */
    private updateValues(): void {
        const pools = golemManager.getPool();

        // Scribe-Warnung
        const scribeCount = pools.filter((p) => p.class === 'scribe').reduce((s, p) => s + p.count, 0);
        const warningEl = this.container.querySelector('.scribe-list-warning') as HTMLElement | null;
        if (warningEl) {
            warningEl.style.display = scribeCount > 0 ? 'none' : 'block';
        }

        // Pool-Counts pro Klasse
        for (const entry of SCRIBE_CLASSES) {
            const countEl = this.container.querySelector(
                `.scribe-list-row[data-cls="${entry.cls}"] [data-count]`,
            ) as HTMLElement | null;
            if (!countEl) continue;

            const count = pools
                .filter((p) => p.class === entry.cls)
                .reduce((s, p) => s + p.count, 0);
            countEl.textContent = String(count);
        }
    }

    // -----------------------------------------------------------------------
    // Ticker
    // -----------------------------------------------------------------------

    private onTick(delta: number): void {
        this.tickAccum += delta;
        if (this.tickAccum >= this.UPDATE_INTERVAL) {
            this.tickAccum = 0;
            this.updateValues();
        }
    }
}
