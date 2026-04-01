/**
 * HarvestArea — Erntegebiet & Ressourcendichte pro Golem-Pool
 *
 * Jeder Golem-Pool hat einen eigenen Suchkreis (harvest_radius).
 * resource_density [0..1] = wie voll das aktuelle Gebiet noch ist.
 *
 * Dynamik:
 *   - Golems ernten → density sinkt
 *   - density < EXPANSION_THRESHOLD → Radius wächst, frische Fläche hebt density
 *   - density ≥ GROWTH_SHRINK_THRESHOLD (nach Expansion erholt) → Radius schrumpft wieder
 *   - WorldMana kritisch → Radius kollabiert (Golems zu erschöpft für weite Wege)
 *
 * Ertrag:
 *   yield = count × sqrt(prime) × resource_density × manaFactor × qualityFactor × PRODUCTION_SCALE
 *   (resource_density ersetzt den √prime-Faktor NICHT, sondern skaliert ihn)
 *
 * Growth rate pro Ressource:
 *   growth_rate = BASE_GROWTH_RATE / sqrt(prime)
 *   → earth regeneriert am schnellsten, stone am langsamsten
 *
 * Details → specs/AREA_SPEC.md
 */

import { ticker } from '../core/Ticker.js';
import { resourceManager } from '../resources/ResourceManager.js';
import { worldMana } from '../resources/WorldMana.js';
import { GolemClass } from '../golems/GolemFactory.js';

// Primzahl-Wurzeln für Ernte-Ressourcen — analog zu ResourceManager
// Yield-Faktor UND Grundlage der growth_rate-Berechnung
const HARVEST_PRIME_SQRT: Record<string, number> = {
    earth: Math.sqrt(2),   // ≈ 1.414 — schnell, häufig
    water: Math.sqrt(3),   // ≈ 1.732
    wood:  Math.sqrt(5),   // ≈ 2.236 — langsam, unter Druck durch breath-of-life
    stone: Math.sqrt(23),  // ≈ 4.796 — sehr langsam
};

// Basis-Regenerationsrate pro Sekunde — wird durch sqrt(prime) geteilt
// → höherer Prime = seltener/wertvoller = langsamer Nachwuchs
const BASE_GROWTH_RATE = 0.02;

const AREA_CONSTANTS = {
    START_RADIUS:             10,
    INITIAL_DENSITY:          1.0,
    MAX_DENSITY:              1.0,

    EXPANSION_THRESHOLD:      0.1,   // < 10% Restdichte → Radius wächst
    EXPANSION_RATE:           0.5,

    GROWTH_SHRINK_THRESHOLD:  0.2,   // > 20% Dichte (nach Erholung) → Radius schrumpft
    SHRINK_RATE:              0.1,

    BASE_BREATH:              0.05,  // Atemzüge/s — Minimum ohne Pflanzen
    BREATH_FACTOR:            0.2,   // Atemzüge/s pro Einheit wood_density

    PRODUCTION_SCALE:         0.1,   // Balance-Faktor — analog zu ResourceManager
};

interface HarvestAreaState {
    poolClass: GolemClass;
    resourceId: string;
    count: number;
    harvest_radius: number;
    resource_density: number;
    growth_rate: number;    // abgeleitet: BASE_GROWTH_RATE / sqrt(prime)
    prime_sqrt: number;     // sqrt(prime) der Ressource — für Ertrag
}

class HarvestAreaManagerImpl {
    private areas: Map<GolemClass, HarvestAreaState> = new Map();

    constructor() {
        ticker.register(this.tick.bind(this));
    }

    /**
     * registerPool — registriert oder aktualisiert ein Erntegebiet für den Pool.
     * Wird von GolemManager.assignPool aufgerufen wenn ein HARVEST-Auftrag vergeben wird.
     */
    registerPool(poolClass: GolemClass, resourceId: string, count: number): void {
        const primeSqrt = HARVEST_PRIME_SQRT[resourceId] ?? Math.sqrt(2);
        const growthRate = BASE_GROWTH_RATE / primeSqrt;

        const existing = this.areas.get(poolClass);
        if (existing) {
            existing.resourceId = resourceId;
            existing.count = count;
            existing.prime_sqrt = primeSqrt;
            existing.growth_rate = growthRate;
        } else {
            this.areas.set(poolClass, {
                poolClass,
                resourceId,
                count,
                harvest_radius:   AREA_CONSTANTS.START_RADIUS,
                resource_density: AREA_CONSTANTS.INITIAL_DENSITY,
                growth_rate:      growthRate,
                prime_sqrt:       primeSqrt,
            });
        }
    }

    /**
     * removePool — entfernt das Erntegebiet wenn ein Pool keinen HARVEST-Auftrag mehr hat.
     */
    removePool(poolClass: GolemClass): void {
        this.areas.delete(poolClass);
    }

    /**
     * updateCount — Golem-Anzahl im Pool aktualisieren (z.B. bei addToPool).
     */
    updateCount(poolClass: GolemClass, count: number): void {
        const area = this.areas.get(poolClass);
        if (area) area.count = count;
    }

    /**
     * getAreas — gibt alle aktiven Erntegebiete zurück (für UI).
     */
    getAreas(): HarvestAreaState[] {
        return Array.from(this.areas.values());
    }

    // -----------------------------------------------------------------------
    // Serialisierung / Deserialisierung / Reset (für SaveManager)
    // -----------------------------------------------------------------------

    /**
     * serialize — exportiert alle Areas als plain Array.
     * Speichert harvest_radius und resource_density damit Spielstand-Fortschritt erhalten bleibt.
     */
    serialize(): any {
        const areas = Array.from(this.areas.values()).map((a) => ({
            poolClass:        a.poolClass,
            resourceId:       a.resourceId,
            count:            a.count,
            harvest_radius:   a.harvest_radius,
            resource_density: a.resource_density,
        }));
        return { areas };
    }

    /**
     * deserialize — stellt Areas VOLLSTÄNDIG wieder her (Radius + Density).
     * Muss VOR golemManager.deserialize aufgerufen werden.
     */
    deserialize(data: any): void {
        this.areas.clear();
        if (!data?.areas) return;

        for (const a of data.areas) {
            const primeSqrt  = HARVEST_PRIME_SQRT[a.resourceId] ?? Math.sqrt(2);
            const growthRate = BASE_GROWTH_RATE / primeSqrt;

            this.areas.set(a.poolClass as GolemClass, {
                poolClass:        a.poolClass as GolemClass,
                resourceId:       a.resourceId,
                count:            a.count ?? 0,
                harvest_radius:   a.harvest_radius  ?? AREA_CONSTANTS.START_RADIUS,
                resource_density: a.resource_density ?? AREA_CONSTANTS.INITIAL_DENSITY,
                growth_rate:      growthRate,
                prime_sqrt:       primeSqrt,
            });
        }
        console.log(`[HarvestAreaManager] Deserialisiert: ${data.areas.length} Area(s).`);
    }

    /**
     * reset — leert alle Areas.
     */
    reset(): void {
        this.areas.clear();
        console.log('[HarvestAreaManager] Reset: alle Areas geleert.');
    }

    private tick(delta: number): void {
        const manaFactor = worldMana.getWorldManaFactor();
        let woodDensity = 0;
        let totalPoolCount = 0;

        for (const area of this.areas.values()) {
            if (area.count <= 0) continue;

            const oldRadius = area.harvest_radius;
            const oldArea = Math.PI * oldRadius * oldRadius;

            // 1. Radius-Dynamik: Expansion wenn Dichte zu niedrig
            if (area.resource_density < AREA_CONSTANTS.EXPANSION_THRESHOLD) {
                const deficit = AREA_CONSTANTS.EXPANSION_THRESHOLD - area.resource_density;
                const newRadius = oldRadius + AREA_CONSTANTS.EXPANSION_RATE * deficit * delta;
                const newArea = Math.PI * newRadius * newRadius;
                const addedArea = newArea - oldArea;

                if (addedArea > 0) {
                    // Neu erschlossene Fläche trägt volle Ausgangsdichte bei
                    area.resource_density =
                        (area.resource_density * oldArea + AREA_CONSTANTS.INITIAL_DENSITY * addedArea) / newArea;
                    area.resource_density = Math.min(AREA_CONSTANTS.MAX_DENSITY, area.resource_density);
                }
                area.harvest_radius = newRadius;

            // 2. Radius schrumpft wenn Dichte sich erholt hat (Golems wandern zurück)
            } else if (area.resource_density > AREA_CONSTANTS.GROWTH_SHRINK_THRESHOLD) {
                area.harvest_radius = Math.max(
                    AREA_CONSTANTS.START_RADIUS,
                    area.harvest_radius - AREA_CONSTANTS.SHRINK_RATE * delta,
                );
            }

            // 3. Ertrag: sqrt(prime) × resource_density × manaFactor
            //    resource_density skaliert den bekannten ResourceManager-Ertrag
            const yieldPerSecond =
                area.count * area.prime_sqrt * area.resource_density * manaFactor * AREA_CONSTANTS.PRODUCTION_SCALE;
            const produced = yieldPerSecond * delta;
            resourceManager.addAmount(area.resourceId, produced);

            // 4. Density-Drain: Ernte verteilt sich über die aktuelle Fläche
            const effectiveArea = Math.PI * area.harvest_radius * area.harvest_radius;
            area.resource_density = Math.max(0, area.resource_density - produced / effectiveArea);

            // 5. Natürliche Regeneration: BASE_GROWTH_RATE / sqrt(prime)
            //    Erde wächst schnell nach, Stein sehr langsam
            area.resource_density = Math.min(
                AREA_CONSTANTS.MAX_DENSITY,
                area.resource_density + area.growth_rate * delta,
            );

            totalPoolCount += area.count;

            if (area.resourceId === 'wood') {
                woodDensity = area.resource_density;
            }
        }

        // 6. Breath of Life — aus Pflanzendichte des Holzsammler-Pools
        //    Kausalität: Holzsammler → wood_density sinkt → breath sinkt → Golem-Erschaffung verlangsamt
        const breath = (AREA_CONSTANTS.BASE_BREATH + woodDensity * AREA_CONSTANTS.BREATH_FACTOR) * delta;
        resourceManager.addAmount('breath-of-life', breath);

        // 7. WorldMana durch aktive Ernte-Golems drainieren
        if (totalPoolCount > 0) {
            worldMana.drainForProducers(totalPoolCount, delta);
        }
    }
}

export const harvestAreaManager = new HarvestAreaManagerImpl();
export type { HarvestAreaState };
