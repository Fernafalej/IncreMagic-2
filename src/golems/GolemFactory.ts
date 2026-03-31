/**
 * GolemFactory — Golem-Erschaffung via 4-Elemente-Ritual
 *
 * Ritual-Schritte (MASTER §2.1):
 *   Erde + Wasser → Lehm
 *   Lehm + Feuer  → Ton
 *   Ton  + Luft   → Golem
 *
 * v0.1: Mana-Kosten = 0, qualityMultiplier = 1.0 (fest)
 */

import { Order } from './OrderSystem.js';
import { resourceManager } from '../resources/ResourceManager.js';

export type GolemClass =
    | 'HARVEST'
    | 'BUILD'
    | 'SCRIBE'
    | 'RESEARCH'
    | 'earth-gatherer'
    | 'water-gatherer'
    | 'wood-gatherer'
    | 'scribe';

export interface Golem {
    id: string;
    class: GolemClass;
    quality: number;         // 1.0 für v0.1
    order: Order | null;
    taintLevel: number;
    isCorrupted: boolean;
}

// Gültige Element-Sequenz für die Golem-Erschaffung
const VALID_RITUAL: readonly string[] = ['earth', 'water', 'fire', 'air'];

let nextGolemId = 1;

function generateGolemId(): string {
    return `golem_${nextGolemId++}`;
}

/**
 * Validiert ob die vier übergebenen Elemente in der richtigen Ritual-Reihenfolge stehen.
 *
 * Akzeptierte Eingabe-Formate:
 *   - Exakt 4 Elemente in Ritual-Reihenfolge: ['earth', 'water', 'fire', 'air']
 *   - Alternativ Zwischen-Stufen als Abkürzungen:
 *       ['clay', 'fire', 'air']   (Lehm bereits vorhanden)
 *       ['terracotta', 'air']      (Ton bereits vorhanden)
 */
function validateRitual(elements: string[]): boolean {
    const normalized = elements.map((e) => e.toLowerCase().trim());

    // Vollständiges 4-Elemente-Ritual
    if (normalized.length === 4) {
        return (
            normalized[0] === 'earth' &&
            normalized[1] === 'water' &&
            normalized[2] === 'fire' &&
            normalized[3] === 'air'
        );
    }

    // Kurzform: ab Lehm
    if (normalized.length === 3) {
        return (
            normalized[0] === 'clay' &&
            normalized[1] === 'fire' &&
            normalized[2] === 'air'
        );
    }

    // Kurzform: ab Ton
    if (normalized.length === 2) {
        return normalized[0] === 'terracotta' && normalized[1] === 'air';
    }

    return false;
}

class GolemFactoryImpl {
    /**
     * create — erschafft einen neuen Golem aus den übergebenen Elementen.
     * Gibt null zurück wenn die Elemente ungültig sind.
     *
     * v0.1: kein Mana-Gate, qualityMultiplier = 1.0
     */
    create(elements: string[]): Golem | null {
        if (!validateRitual(elements)) {
            console.warn(
                `[GolemFactory] Ungültiges Ritual: [${elements.join(', ')}]. ` +
                `Erwartet: earth, water, fire, air`,
            );
            return null;
        }

        const golemClasses: GolemClass[] = ['earth-gatherer', 'water-gatherer', 'wood-gatherer'];
        const selectedClass = golemClasses[nextGolemId % golemClasses.length];

        const golem: Golem = {
            id: generateGolemId(),
            class: selectedClass,
            quality: 1.0,
            order: null,
            taintLevel: 0,
            isCorrupted: false,
        };

        console.log(`[GolemFactory] Golem erschaffen: ${golem.id} (${golem.class}, Q${golem.quality})`);
        return golem;
    }

    /**
     * createFromFiredGolem — erschafft Golems aus gebrannten Golems + Atemzügen.
     *
     * Verbraucht firedGolemCount × 'fired-golem' aus dem GameState via ResourceManager.
     * breathCount muss gleich firedGolemCount sein (1 Hauch pro Golem).
     * Gibt die Anzahl der tatsächlich erschaffenen Golems zurück (limitiert durch verfügbare Ressourcen).
     *
     * @param firedGolemCount - Anzahl der zu belebenden gebrannten Golems
     * @param breathCount     - Anzahl der Atemzüge (muss ≥ firedGolemCount sein)
     * @returns Anzahl der erschaffenen Golems (0 wenn Ressourcen fehlen)
     */
    createFromFiredGolem(firedGolemCount: number, breathCount: number): number {
        if (firedGolemCount <= 0 || breathCount <= 0) return 0;

        const available = resourceManager.getAmount('fired-golem');
        const canCreate = Math.min(firedGolemCount, breathCount, Math.floor(available));

        if (canCreate <= 0) {
            console.warn('[GolemFactory] createFromFiredGolem: Nicht genug fired-golem oder Atemzüge.');
            return 0;
        }

        // fired-golem verbrauchen
        resourceManager.addAmount('fired-golem', -canCreate);

        console.log(`[GolemFactory] createFromFiredGolem: ${canCreate} Golem(s) aus fired-golem erschaffen.`);
        return canCreate;
    }
}

// Singleton
export const golemFactory = new GolemFactoryImpl();

// VALID_RITUAL wird exportiert damit Tests prüfen können
export { VALID_RITUAL };
