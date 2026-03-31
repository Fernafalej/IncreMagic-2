/**
 * GolemManager — Verwaltung aller aktiven Golems
 *
 * - Golems werden registriert und per Ticker getickt
 * - Bei HARVEST-Auftrag: resourceManager.addProducer aufrufen
 * - Bei Auftrag-Ende / Entfernung: resourceManager.removeProducer aufrufen
 *
 * Pool-System (v0.1+):
 * - Golems werden nach Klasse+Variante gruppiert: GolemPool
 * - addToPool(class, variant, count) — fügt Golems als Gruppe hinzu
 * - assignPool(class, order) — weist allen Golems einer Klasse einen Auftrag zu
 * - getPool() — gibt alle Pool-Gruppen zurück
 */

import { Golem, GolemClass } from './GolemFactory.js';
import { Order, OrderType } from './OrderSystem.js';
import { resourceManager } from '../resources/ResourceManager.js';
import { eventBus } from '../core/EventBus.js';
import { ticker } from '../core/Ticker.js';

/** GolemPool — repräsentiert eine Gruppe gleichartiger Golems */
export interface GolemPool {
    class: GolemClass;
    variant: string;       // z.B. '' für Standard, 'steam' für Dampfgolem
    count: number;
    order: Order | null;
}

// Schlüssel für den Pool-Map: "class::variant"
function poolKey(golemClass: GolemClass, variant: string): string {
    return `${golemClass}::${variant}`;
}

class GolemManagerImpl {
    private golems: Map<string, Golem> = new Map();

    // Pool-System: Klasse+Variante → GolemPool
    private pools: Map<string, GolemPool> = new Map();

    constructor() {
        ticker.register(this.tick.bind(this));
    }

    /**
     * add — registriert einen neu erschaffenen Golem im Manager.
     */
    add(golem: Golem): void {
        this.golems.set(golem.id, golem);
        console.log(`[GolemManager] Golem hinzugefügt: ${golem.id}`);
    }

    /**
     * assign — weist einem Golem einen Auftrag zu.
     * Entfernt vorherigen Producer falls Golem bereits arbeitete.
     */
    assign(golemId: string, order: Order): void {
        const golem = this.golems.get(golemId);
        if (!golem) {
            console.warn(`[GolemManager] assign: Golem ${golemId} nicht gefunden.`);
            return;
        }

        // Alten Producer entfernen wenn Golem vorher HARVEST hatte
        if (golem.order !== null) {
            this.stopProduction(golem);
        }

        golem.order = order;
        this.startProduction(golem);

        console.log(
            `[GolemManager] Golem ${golemId} → Auftrag ${order.type} auf '${order.target}'`,
        );
    }

    /**
     * unassign — Auftrag eines Golems beenden und Producer stoppen.
     */
    unassign(golemId: string): void {
        const golem = this.golems.get(golemId);
        if (!golem) {
            console.warn(`[GolemManager] unassign: Golem ${golemId} nicht gefunden.`);
            return;
        }
        if (golem.order !== null) {
            this.stopProduction(golem);
            golem.order = null;
        }
    }

    /**
     * getAll — gibt alle registrierten Golems zurück.
     */
    getAll(): Golem[] {
        return Array.from(this.golems.values());
    }

    // -----------------------------------------------------------------------
    // Pool-System
    // -----------------------------------------------------------------------

    /**
     * addToPool — fügt `count` Golems der Klasse `golemClass` (Variante `variant`) zum Pool hinzu.
     * Existiert der Pool bereits, wird count aufaddiert.
     *
     * Kein Auftrag wird automatisch vergeben — assignPool separat aufrufen.
     */
    addToPool(golemClass: GolemClass, variant: string, count: number): void {
        if (count <= 0) return;
        const key = poolKey(golemClass, variant);
        const existing = this.pools.get(key);
        if (existing) {
            existing.count += count;
            console.log(`[GolemManager] Pool ${key}: +${count} → ${existing.count} gesamt.`);
        } else {
            const pool: GolemPool = { class: golemClass, variant, count, order: null };
            this.pools.set(key, pool);
            console.log(`[GolemManager] Neuer Pool ${key}: ${count} Golem(s).`);
        }
    }

    /**
     * assignPool — weist allen Golems einer Klasse (beliebige Variante) einen Auftrag zu.
     * Entfernt vorherigen Producer falls die Klasse bereits einen Auftrag hatte.
     *
     * Alle Pools mit der angegebenen Klasse (unabhängig von variant) erhalten den Auftrag.
     */
    assignPool(golemClass: GolemClass, order: Order): void {
        let assigned = false;
        for (const pool of this.pools.values()) {
            if (pool.class === golemClass) {
                // Alten Producer entfernen
                if (pool.order !== null && pool.order.type === 'HARVEST') {
                    resourceManager.removeProducer(pool.order.target, pool.count);
                }

                pool.order = order;

                // Neuen Producer registrieren — count × 1 pro Golem
                if (order.type === 'HARVEST') {
                    resourceManager.addProducer(order.target, pool.count);
                }

                console.log(
                    `[GolemManager] Pool ${pool.class}/${pool.variant} (${pool.count}×) → Auftrag ${order.type} auf '${order.target}'`,
                );
                assigned = true;
            }
        }
        if (!assigned) {
            console.warn(`[GolemManager] assignPool: Kein Pool für Klasse '${golemClass}' gefunden.`);
        }
    }

    /**
     * dispatchOrder — dispatcht einen Auftrag basierend auf OrderType und Target.
     * Wird von OrderQueue.complete() über dynamischen Import aufgerufen.
     *
     * Für HARVEST-Aufträge: target = resourceId, GolemClass = passende Ernte-Klasse ermitteln
     * Für WRITE-Aufträge: target = GolemClass des Ziel-Pools
     * Andere OrderTypes: target = GolemClass direkt
     */
    dispatchOrder(orderType: OrderType, target: string, order: Order): void {
        // Mapping von resourceId → GolemClass für HARVEST
        const harvestMap: Record<string, GolemClass> = {
            'earth':  'earth-gatherer',
            'water':  'water-gatherer',
            'wood':   'wood-gatherer',
        };

        let golemClass: GolemClass | undefined;

        if (orderType === 'HARVEST') {
            golemClass = harvestMap[target];
        } else {
            // Bei WRITE, CRAFT, BUILD etc. ist target direkt der GolemClass-Bezeichner
            golemClass = target as GolemClass;
        }

        if (!golemClass) {
            console.warn(`[GolemManager] dispatchOrder: Kein GolemClass-Mapping für type='${orderType}' target='${target}'.`);
            return;
        }

        this.assignPool(golemClass, order);
    }

    /**
     * getPool — gibt alle GolemPool-Gruppen zurück.
     */
    getPool(): GolemPool[] {
        return Array.from(this.pools.values());
    }

    /**
     * tick — prüft korrumpierte Golems und feuert Events.
     * Produktions-Logik läuft im ResourceManager, nicht hier.
     */
    private tick(_delta: number): void {
        for (const golem of this.golems.values()) {
            if (golem.taintLevel > 0 && !golem.isCorrupted) {
                // Korruptions-Schwelle — für v0.1 großzügig
                if (golem.taintLevel >= 100) {
                    golem.isCorrupted = true;
                    if (golem.order !== null) {
                        this.stopProduction(golem);
                        golem.order = null;
                    }
                    eventBus.emit({ type: 'GOLEM_CORRUPTED', golemId: golem.id });
                    console.warn(`[GolemManager] Golem ${golem.id} korrumpiert!`);
                }
            }
        }
    }

    // --- Interne Hilfsfunktionen ---

    private startProduction(golem: Golem): void {
        if (golem.order === null) return;

        if (golem.order.type === 'HARVEST') {
            // rate = 1 Golem-Einheit; ResourceManager multipliziert mit √prime * qualityMult * MF
            resourceManager.addProducer(golem.order.target, 1);
        }
    }

    private stopProduction(golem: Golem): void {
        if (golem.order === null) return;

        if (golem.order.type === 'HARVEST') {
            resourceManager.removeProducer(golem.order.target, 1);
        }
    }
}

// Singleton
export const golemManager = new GolemManagerImpl();
