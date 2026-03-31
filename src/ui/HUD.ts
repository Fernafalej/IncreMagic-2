/**
 * HUD — DOM-basiertes Ressourcen-Interface
 *
 * Zeigt pro Ressource: Symbol + Wert (1 Dezimalstelle) + Rate (+X.XX/s)
 * v0.1: Stein (⛏) und Mana (✦)
 *
 * Aktualisiert sich per Ticker (nicht per separatem rAF).
 * Rate = Differenz zwischen letztem und aktuellem Tick-Wert.
 */
import { gameState } from '../core/GameState.js';
import { ticker } from '../core/Ticker.js';

interface ResourceDisplay {
    id: string;
    symbol: string;
    label: string;
    rateEl: HTMLElement;
    valueEl: HTMLElement;
    lastAmount: number;
    rate: number;
}

class HUDImpl {
    private container: HTMLElement;
    private resources: ResourceDisplay[] = [];
    private tickCounterEl: HTMLElement | null = null;
    private boundTick: (delta: number) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.boundTick = this.onTick.bind(this);

        this.build();
        ticker.register(this.boundTick);
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'hud';

        // Titel
        const title = document.createElement('div');
        title.className = 'hud-title';
        title.textContent = '✦ RESSOURCEN';
        this.container.appendChild(title);

        // Ressourcen-Zeilen (Frühspiel v0.1 + neue Ressourcen)
        const resourceDefs = [
            { id: 'earth',       symbol: '🟤', label: 'Erde'           },
            { id: 'water',       symbol: '💧', label: 'Wasser'         },
            { id: 'wood',        symbol: '🪵', label: 'Holz'           },
            { id: 'fire',        symbol: '🔥', label: 'Feuer'          },
            { id: 'clay',        symbol: '🧱', label: 'Lehm'           },
            { id: 'raw-golem',   symbol: '🗿', label: 'Roh-Golem'      },
            { id: 'fired-golem', symbol: '🔶', label: 'Gebr. Golem'    },
            { id: 'paper',       symbol: '📄', label: 'Papier'         },
            { id: 'stone',       symbol: '⛏', label: 'Stein'          },
            { id: 'mana',        symbol: '✦', label: 'Mana'           },
        ];

        for (const def of resourceDefs) {
            const row = document.createElement('div');
            row.className = 'hud-row';

            const symbolEl = document.createElement('span');
            symbolEl.className = 'hud-symbol';
            symbolEl.textContent = def.symbol;

            const nameEl = document.createElement('span');
            nameEl.className = 'hud-name';
            nameEl.textContent = def.label;

            const valueEl = document.createElement('span');
            valueEl.className = 'hud-value';
            valueEl.textContent = '0.0';

            const rateEl = document.createElement('span');
            rateEl.className = 'hud-rate';
            rateEl.textContent = '+0.00/s';

            row.appendChild(symbolEl);
            row.appendChild(nameEl);
            row.appendChild(valueEl);
            row.appendChild(rateEl);
            this.container.appendChild(row);

            this.resources.push({
                id: def.id,
                symbol: def.symbol,
                label: def.label,
                rateEl,
                valueEl,
                lastAmount: gameState.resources.get(def.id) ?? 0,
                rate: 0,
            });
        }

        // Tick-Anzeige (dezent)
        this.tickCounterEl = document.createElement('div');
        this.tickCounterEl.className = 'hud-tick';
        this.tickCounterEl.textContent = 'Tick: 0';
        this.container.appendChild(this.tickCounterEl);
    }

    private onTick(_delta: number): void {
        for (const res of this.resources) {
            const current = gameState.resources.get(res.id) ?? 0;
            res.rate = current - res.lastAmount; // Differenz = Rate/s (delta=1s)
            res.lastAmount = current;

            res.valueEl.textContent = current.toFixed(1);

            const rateStr = res.rate >= 0
                ? `+${res.rate.toFixed(2)}/s`
                : `${res.rate.toFixed(2)}/s`;
            res.rateEl.textContent = rateStr;
        }

        if (this.tickCounterEl) {
            this.tickCounterEl.textContent = `Tick: ${gameState.tick}`;
        }
    }

    destroy(): void {
        ticker.unregister(this.boundTick);
    }
}

export { HUDImpl as HUD };
