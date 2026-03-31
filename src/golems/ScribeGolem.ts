/**
 * ScribeGolem — Automatischer Schreiber-Golem (v0.2)
 *
 * Pro Tick arbeiten alle Scribe-Golems gemeinsam am vordersten Eintrag der
 * globalen OrderQueue. Sobald writeProgress >= 1.0 erreicht ist, wird ein
 * Papier verbraucht und der Auftrag per orderQueue.complete() abgeschlossen.
 *
 * Formeln (MASTER §6.4 / §2.2):
 *   writeProgress += scribePool.count * writeSpeed * worldManaFactor() * delta
 *   writeSpeed = 0.05  (Golems/s pro einzelnem Scribe)
 *
 * Bedingungen:
 *   - Kein Papier vorhanden → writeProgress akkumuliert NICHT
 *   - Queue leer → Scribe ist idle
 */

import { ticker } from '../core/Ticker.js';
import { resourceManager } from '../resources/ResourceManager.js';
import { worldMana } from '../resources/WorldMana.js';
import { golemManager } from './GolemManager.js';
import { orderQueue } from './OrderSystem.js';

/** Wie viele Fortschritts-Punkte ein einzelner Scribe-Golem pro Sekunde beiträgt. */
const WRITE_SPEED = 0.05;

/** Papier-Ressource-ID */
const PAPER_ID = 'paper';

class ScribeGolemImpl {
    /** Fraktionaler Schreibfortschritt (0.0 – ∞, wird auf 1.0-Schritte abgebaut) */
    private writeProgress: number = 0;

    constructor() {
        ticker.register(this.tick.bind(this));
    }

    /**
     * tick — wird jede Sekunde vom Ticker aufgerufen.
     */
    private tick(delta: number): void {
        // Wie viele Scribe-Golems sind aktiv?
        const scribePool = golemManager.getPool().find((p) => p.class === 'scribe');
        const scribeCount = scribePool?.count ?? 0;

        // Kein Scribe → nichts zu tun
        if (scribeCount <= 0) return;

        // Queue leer → idle
        const current = orderQueue.peek();
        if (current === null) return;

        // Papier prüfen: kein Papier → writeProgress einfrieren
        const paperAmount = resourceManager.getAmount(PAPER_ID);
        if (paperAmount < 1) return;

        // Fortschritt akkumulieren
        const manaFactor = worldMana.getWorldManaFactor();
        this.writeProgress += scribeCount * WRITE_SPEED * manaFactor * delta;

        // Solange writeProgress >= 1.0: Auftrag fertigstellen (1 Papier pro Abschluss)
        while (this.writeProgress >= 1.0) {
            // Papier nochmal prüfen (könnte nach erstem Durchlauf fehlen)
            const paper = resourceManager.getAmount(PAPER_ID);
            if (paper < 1) {
                // Kein Papier mehr — Fortschritt anhalten (nicht weiter abbauen)
                break;
            }

            // 1 Papier verbrauchen
            resourceManager.addAmount(PAPER_ID, -1);
            this.writeProgress -= 1.0;

            // Vordersten Auftrag abschließen (dispatcht + repeat-Logik)
            const req = orderQueue.peek();
            if (req !== null) {
                console.log(`[ScribeGolem] Auftrag abgeschlossen: ${req.type}/${req.target} (id=${req.id})`);
                orderQueue.complete(req.id);
            } else {
                // Queue wurde leer während wir abbauten
                break;
            }
        }
    }

    /**
     * getWriteProgress — gibt den aktuellen Schreibfortschritt zurück (0.0–1.0+ fraktional).
     * Wird von der UI für den Fortschrittsbalken genutzt.
     */
    getWriteProgress(): number {
        return this.writeProgress;
    }
}

// Singleton — registriert sich automatisch beim Ticker sobald importiert
export const scribeGolem = new ScribeGolemImpl();
