/**
 * ResourceManager — Produktionsraten und Ressourcen-Wachstum
 *
 * Produktionsformel (MASTER §6.4):
 *   production(r, n, q) = n * √prime(r) * qualityMultiplier(q) * worldManaFactor()
 *
 * v0.1: qualityMultiplier = 1.0 (fest)
 * n = Summe aller registrierten Producer-Rates für die Ressource
 */
import { gameState } from '../core/GameState.js';
import { ticker } from '../core/Ticker.js';
import { worldMana } from './WorldMana.js';

// Globaler Produktions-Skalierungsfaktor (Balance v0.1)
// Teilt alle Ressourcen-Produktionsraten durch 10.
// Beispiel: 1 earth-gatherer → √2 * 0.1 ≈ 0.1414/s statt ≈ 1.4142/s
const PRODUCTION_SCALE = 0.1;

// Primzahl-Wurzeln je Ressource (MASTER §6.4)
const PRIME_SQRT: Record<string, number> = {
    // Frühspiel-Ressourcen
    earth:        Math.sqrt(2),  // ≈ 1.4142
    water:        Math.sqrt(3),  // ≈ 1.7320
    wood:         Math.sqrt(5),  // ≈ 2.2360
    fire:         Math.sqrt(7),  // ≈ 2.6457
    clay:         Math.sqrt(11), // ≈ 3.3166
    'raw-golem':  Math.sqrt(13), // ≈ 3.6055
    'fired-golem':Math.sqrt(17), // ≈ 4.1231
    paper:        Math.sqrt(19), // ≈ 4.3588
    // Spätspiel-Ressourcen
    stone:        Math.sqrt(23), // ≈ 4.7958
    mana:         Math.sqrt(29), // ≈ 5.3851
    energy:       Math.sqrt(31), // ≈ 5.5677
    knowledge:    Math.sqrt(37), // ≈ 6.0827
    souls:        Math.sqrt(41), // ≈ 6.4031
    taint:        Math.sqrt(43), // ≈ 6.5574
};

// Kein separater per-Unit-Drain mehr — Drain läuft jetzt über worldMana.drainForProducers()
// (proportional zur Golem-Rate, unabhängig von worldManaFactor → echter Ressourcendruck)

class ResourceManagerImpl {
    // resourceId → summierte Producer-Rate
    private producers: Map<string, number> = new Map();

    constructor() {
        ticker.register(this.tick.bind(this));
    }

    /**
     * addProducer — fügt eine Produktionsrate für eine Ressource hinzu
     * Kann mehrfach aufgerufen werden (z.B. ein Golem mit rate=1.0)
     */
    addProducer(resourceId: string, rate: number): void {
        const current = this.producers.get(resourceId) ?? 0;
        this.producers.set(resourceId, current + rate);
    }

    /**
     * removeProducer — entfernt eine Produktionsrate (z.B. wenn Golem inaktiv)
     */
    removeProducer(resourceId: string, rate: number): void {
        const current = this.producers.get(resourceId) ?? 0;
        const next = Math.max(0, current - rate);
        if (next === 0) {
            this.producers.delete(resourceId);
        } else {
            this.producers.set(resourceId, next);
        }
    }

    /**
     * getAmount — aktueller Ressourcen-Betrag aus GameState
     */
    getAmount(resourceId: string): number {
        return gameState.resources.get(resourceId) ?? 0;
    }

    /**
     * getProducerRate — Gibt die aktuell registrierte Producer-Rate für die Ressource zurück.
     */
    getProducerRate(resourceId: string): number {
        return this.producers.get(resourceId) ?? 0;
    }

    /**
     * getProductionDetails — Berechnet Produktionsformel-Komponenten, ohne Zustand zu verändern.
     */
    getProductionDetails(resourceId: string): {
        terms: { term: string; value: number; description: string }[];
        perSecond: number;
    } {
        const totalRate = this.getProducerRate(resourceId);
        const primeSqrt = PRIME_SQRT[resourceId] ?? 1;
        const qualityMultiplier = 1.0;
        const manaFactor = worldMana.getWorldManaFactor();
        const scale = PRODUCTION_SCALE;
        const perSecond = totalRate * primeSqrt * qualityMultiplier * manaFactor * scale;

        const terms = [
            { term: 'producer-rate', value: totalRate, description: 'Anzahl der aktiven Produzenten (z.B. Golems)' },
            { term: '√prime', value: primeSqrt, description: 'Primzahl-Wurzel für diese Ressource (Balance-Faktor)' },
            { term: 'quality', value: qualityMultiplier, description: 'Qualitäts-Multiplikator (derzeit 1.0)' },
            { term: 'manaFactor', value: manaFactor, description: 'WorldMana-Faktor (beeinflusst alle Produktionen)' },
            { term: 'scale', value: scale, description: 'Globaler Produktions-Skalierungsfaktor (Balance)' },
        ];

        return { terms, perSecond };
    }

    /**
     * addAmount — fügt direkt einen Betrag zu einer Ressource hinzu
     * Wird von CraftingManager für manuelle Aktionen und Crafting-Ergebnisse genutzt.
     */
    addAmount(resourceId: string, amount: number): void {
        const current = gameState.resources.get(resourceId) ?? 0;
        gameState.resources.set(resourceId, Math.max(0, current + amount));
    }

    /**
     * tick — Produktion berechnen und in GameState schreiben
     */
    tick(delta: number): void {
        const manaFactor = worldMana.getWorldManaFactor();
        let totalProducerRate = 0;

        for (const [resourceId, totalRate] of this.producers) {
            const primeSqrt = PRIME_SQRT[resourceId] ?? 1;
            const qualityMultiplier = 1.0; // v0.1: fest
            const produced = totalRate * primeSqrt * qualityMultiplier * manaFactor * PRODUCTION_SCALE * delta;

            const current = gameState.resources.get(resourceId) ?? 0;
            gameState.resources.set(resourceId, current + produced);

            totalProducerRate += totalRate;
        }

        // Taint-Wachstum wenn WorldMana sehr niedrig
        const taintLevel = worldMana.getTaintLevel();
        if (taintLevel > 0) {
            gameState.taint += taintLevel * delta;
            const currentTaint = gameState.resources.get('taint') ?? 0;
            gameState.resources.set('taint', currentTaint + taintLevel * delta);
        }

        // WorldMana durch aktive Golem-Producer drainieren (proportional zur Gesamtrate)
        // drainForProducers ist unabhängig von worldManaFactor → echter Ressourcendruck
        worldMana.drainForProducers(totalProducerRate, delta);
    }
}

export const resourceManager = new ResourceManagerImpl();
