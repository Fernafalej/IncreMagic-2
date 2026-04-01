/**
 * ScribeGolem — Automatischer Schreiber-Golem (v0.3)
 *
 * Pro Tick arbeiten alle Scribe-Golems gemeinsam am vordersten Eintrag der
 * globalen OrderQueue.
 *
 * WRITE-Orders (Golem-Produktion):
 *   - Werden automatisch via autoEnqueueOrders() erzeugt (ScribeList-Abgleich)
 *   - Benötigen: paper >= 1 UND fired-golem >= 1
 *   - Bei Abschluss: paper -1, fired-golem -1, golemManager.addToPool(target, '', 1)
 *   - Werden per orderQueue.remove(id) beendet — KEIN complete() (kein falscher Dispatch)
 *
 * Andere Orders:
 *   - Bisherige Logik: writeProgress akkumulieren, bei >= 1.0 → orderQueue.complete()
 *
 * Formeln (MASTER §6.4 / §2.2):
 *   writeProgress += scribePool.count * writeSpeed * worldManaFactor() * delta
 *   writeSpeed = 0.05  (Fortschritt/s pro einzelnem Scribe)
 */

import { ticker } from '../core/Ticker.js';
import { resourceManager } from '../resources/ResourceManager.js';
import { worldMana } from '../resources/WorldMana.js';
import { golemManager } from './GolemManager.js';
import { orderQueue, createOrderRequest } from './OrderSystem.js';
import { scribeList } from './ScribeList.js';

/** Wie viele Fortschritts-Punkte ein einzelner Scribe-Golem pro Sekunde beiträgt. */
const WRITE_SPEED = 0.05;

/** Papier-Ressource-ID */
const PAPER_ID = 'paper';

/** fired-golem-Ressource-ID */
const FIRED_GOLEM_ID = 'fired-golem';

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

        // Automatisch WRITE-Orders aus ScribeList generieren
        this.autoEnqueueOrders();

        // Queue leer → idle
        const current = orderQueue.peek();
        if (current === null) return;

        // WRITE-Order: eigene Behandlung
        if (current.type === 'WRITE') {
            this.processWriteOrder(current, scribeCount, delta);
            return;
        }

        // Nicht-WRITE: Papier prüfen und Fortschritt akkumulieren
        const paperAmount = resourceManager.getAmount(PAPER_ID);
        if (paperAmount < 1) return;

        const manaFactor = worldMana.getWorldManaFactor();
        this.writeProgress += scribeCount * WRITE_SPEED * manaFactor * delta;

        // Solange writeProgress >= 1.0: Auftrag fertigstellen (1 Papier pro Abschluss)
        while (this.writeProgress >= 1.0) {
            const paper = resourceManager.getAmount(PAPER_ID);
            if (paper < 1) {
                break;
            }

            resourceManager.addAmount(PAPER_ID, -1);
            this.writeProgress -= 1.0;

            const req = orderQueue.peek();
            if (req !== null && req.type !== 'WRITE') {
                console.log(`[ScribeGolem] Auftrag abgeschlossen: ${req.type}/${req.target} (id=${req.id})`);
                orderQueue.complete(req.id);
            } else {
                break;
            }
        }
    }

    /**
     * autoEnqueueOrders — prüft die ScribeList und fügt fehlende WRITE-Orders ein.
     *
     * Für jede ScribeList-Entry:
     *   gap = target - currentPoolCount - pendingWRITEOrdersForClass
     *   Wenn gap > 0 und noch kein pending WRITE für diese Klasse: 1 WRITE-Order einreihen.
     */
    private autoEnqueueOrders(): void {
        const entries = scribeList.getTargets();
        if (entries.length === 0) return;

        const allPools = golemManager.getPool();
        const pendingWrites = orderQueue.getAll().filter((r) => r.type === 'WRITE');

        for (const entry of entries) {
            if (entry.target <= 0) continue;

            // Aktuellen Pool-Count für diese Klasse ermitteln
            const currentCount = allPools
                .filter((p) => p.class === entry.cls)
                .reduce((sum, p) => sum + p.count, 0);

            // Wie viele WRITE-Orders für diese Klasse sind bereits in der Queue?
            const pendingCount = pendingWrites.filter((r) => r.target === entry.cls).length;

            const gap = entry.target - currentCount - pendingCount;

            if (gap > 0 && pendingCount === 0) {
                // Eine WRITE-Order für diese Klasse einreihen
                const req = createOrderRequest('WRITE', entry.cls, 1, 5, false);
                orderQueue.enqueue(req);
                console.log(`[ScribeGolem] autoEnqueue WRITE für ${entry.cls} (gap=${gap})`);
            }
        }
    }

    /**
     * processWriteOrder — verarbeitet eine WRITE-Order.
     *
     * Benötigt: paper >= 1 UND fired-golem >= 1.
     * Bei Abschluss (writeProgress >= 1.0):
     *   paper -1, fired-golem -1, addToPool(target, '', 1), orderQueue.remove(id)
     */
    private processWriteOrder(
        req: ReturnType<typeof orderQueue.peek> & {},
        scribeCount: number,
        delta: number,
    ): void {
        const paper = resourceManager.getAmount(PAPER_ID);
        const firedGolem = resourceManager.getAmount(FIRED_GOLEM_ID);

        // Materialien fehlen → warten
        if (paper < 1 || firedGolem < 1) return;

        const manaFactor = worldMana.getWorldManaFactor();
        this.writeProgress += scribeCount * WRITE_SPEED * manaFactor * delta;

        if (this.writeProgress >= 1.0) {
            // Nochmal prüfen (könnte nach progress-Schritten fehlen)
            const p2 = resourceManager.getAmount(PAPER_ID);
            const fg2 = resourceManager.getAmount(FIRED_GOLEM_ID);
            if (p2 < 1 || fg2 < 1) return;

            resourceManager.addAmount(PAPER_ID, -1);
            resourceManager.addAmount(FIRED_GOLEM_ID, -1);
            this.writeProgress -= 1.0;

            // Golem dem Pool hinzufügen
            golemManager.addToPool(req.target as any, '', 1);
            console.log(`[ScribeGolem] WRITE abgeschlossen: +1 ${req.target} (id=${req.id})`);

            // Order per remove() beenden — KEIN complete() (würde falschen Dispatch auslösen)
            orderQueue.remove(req.id);
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
