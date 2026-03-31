/**
 * ResearchTree — Forschungs-System
 *
 * Singleton für Forschungen. v0.2: Einfache manuelle Aktionen.
 * Später: Runen-Puzzle (Gather/Refine/Build).
 */

import { eventBus } from '../core/EventBus.js';

export type ResourceMap = Map<string, number>;

export interface ResearchNode {
    id: string;
    name: string;
    description: string;
    cost: ResourceMap;  // Ressourcen-Kosten pro complete()
    unlocks: string[];  // IDs der freigeschalteten Mechaniken
    maxProgress: number; // N für manuelle Aktionen
    unlocked: boolean;
}

class ResearchTreeImpl {
    private researches: Map<string, ResearchNode> = new Map();
    private progress: Map<string, number> = new Map();

    constructor() {
        // Erste Forschung definieren
        this.addResearch({
            id: 'scribe-automation',
            name: 'Scribe-Automatisierung',
            description: 'Schaltet Scribe-Gebäude frei — Golems schreiben selbst Aufträge.',
            cost: new Map([['paper', 1]]),  // 1 Papier pro complete()
            unlocks: ['scribe-building'],
            maxProgress: 10,
            unlocked: false,
        });
    }

    addResearch(research: ResearchNode): void {
        this.researches.set(research.id, research);
        this.progress.set(research.id, 0);
    }

    getAll(): ResearchNode[] {
        return Array.from(this.researches.values());
    }

    getProgress(id: string): number {
        return this.progress.get(id) ?? 0;
    }

    complete(id: string): boolean {
        const research = this.researches.get(id);
        if (!research || research.unlocked) return false;

        const current = this.progress.get(id) ?? 0;
        const newProgress = current + 1;
        this.progress.set(id, newProgress);

        if (newProgress >= research.maxProgress) {
            research.unlocked = true;
            eventBus.emit({ type: 'RESEARCH_UNLOCKED', nodeId: id });
            console.log(`[ResearchTree] Forschung '${research.name}' freigeschaltet!`);
            return true;
        }
        return false;
    }

    isUnlocked(id: string): boolean {
        return this.researches.get(id)?.unlocked ?? false;
    }

    getUnlockedGolemClasses(): string[] {
        const unlocked: string[] = [];
        for (const research of this.researches.values()) {
            if (research.unlocked) {
                unlocked.push(...research.unlocks.filter(u => u.includes('golem')));
            }
        }
        return unlocked;
    }

    getBlendFactor(): number {
        // Placeholder: 0.0 = Sigmoid, 1.0 = Linear
        // Später basierend auf Forschung
        return 0.0;
    }

    incrementManual(actionType: string): void {
        // Placeholder für manuelle Aktionen
        console.log(`[ResearchTree] Manual action: ${actionType}`);
    }

    save(): string {
        return JSON.stringify({
            progress: Object.fromEntries(this.progress),
            unlocked: Array.from(this.researches.values()).filter(r => r.unlocked).map(r => r.id),
        });
    }

    load(data: string): void {
        try {
            const parsed = JSON.parse(data);
            this.progress = new Map(Object.entries(parsed.progress || {}));
            for (const id of parsed.unlocked || []) {
                const research = this.researches.get(id);
                if (research) research.unlocked = true;
            }
        } catch (err) {
            console.warn('[ResearchTree] Fehler beim Laden:', err);
        }
    }
}

// Singleton
export const researchTree = new ResearchTreeImpl();