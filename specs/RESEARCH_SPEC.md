# RESEARCH_SPEC — Forschungs-System
> Detail-Dokument für `research-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Forschungs-Übersicht

Forschung schaltet Mechaniken frei: Runen (v0.1), Golems (v0.1), Nekromantie (v0.2+), Rituale (v0.2+), Chimären (v0.3+), Dschinn (v0.4+), Götter (v0.5+).

**v0.2: Erste Forschung**
- Manuelle Aktion: Spieler klickt N-mal auf "Forschung"-Button
- Schaltet Scribe-Automatisierung frei (Scribe-Gebäude kann gebaut werden)
- Einfach: kein Ressourcen-Verbrauch, kein komplexes Puzzle

**Später: Runen-Puzzle**
- Gather: Ressourcen sammeln für Rune
- Refine: Rune kombinieren/verfeinern
- Build: Rune in Gebäude einbauen

---

## 2. ResearchTree Singleton

```typescript
export interface ResearchNode {
    id: string;
    name: string;
    description: string;
    cost: ResourceMap;  // Ressourcen-Kosten pro advance()
    unlocks: string[];  // IDs der freigeschalteten Mechaniken/Golems/etc.
    maxProgress: number; // N für manuelle Aktionen
    unlocked: boolean;
}

class ResearchTreeImpl {
    private researches: Map<string, Research> = new Map();
    private progress: Map<string, number> = new Map();

    constructor() {
        // Erste Forschung definieren
        this.addResearch({
            id: 'scribe-automation',
            name: 'Scribe-Automatisierung',
            description: 'Schaltet Scribe-Gebäude frei — Golems schreiben selbst Aufträge.',
            maxProgress: 10,
        });
    }

    addResearch(research: Research): void {
        this.researches.set(research.id, research);
        this.progress.set(research.id, 0);
    }

    getProgress(id: string): number {
        return this.progress.get(id) ?? 0;
    }

    advance(id: string): boolean {
        const research = this.researches.get(id);
        if (!research || research.unlocked) return false;

        const current = this.progress.get(id) ?? 0;
        const newProgress = current + 1;
        this.progress.set(id, newProgress);

        if (newProgress >= research.maxProgress) {
            research.unlocked = true;
            eventBus.emit('RESEARCH_UNLOCKED', { id });
            return true;
        }
        return false;
    }

    isUnlocked(id: string): boolean {
        return this.researches.get(id)?.unlocked ?? false;
    }

    save(): string {
        return JSON.stringify({
            progress: Object.fromEntries(this.progress),
            unlocked: Array.from(this.researches.values()).filter(r => r.unlocked).map(r => r.id),
        });
    }

    load(data: string): void {
        const parsed = JSON.parse(data);
        this.progress = new Map(Object.entries(parsed.progress || {}));
        for (const id of parsed.unlocked || []) {
            const research = this.researches.get(id);
            if (research) research.unlocked = true;
        }
    }
}

export const researchTree = new ResearchTreeImpl();
```

---

## 3. Integration

- `src/main.ts`: `import { researchTree } from './research/ResearchTree.js';` + save/load mit localStorage
- EventBus: 'RESEARCH_UNLOCKED' → UI kann reagieren (z.B. Scribe-Gebäude freischalten)
- UI: Button für advance() — z.B. in neuem Research-Panel

---

## 4. Erweiterungen (v0.3+)

- Ressourcen-Verbrauch pro advance()
- Abhängigkeiten: Forschung A muss fertig sein für B
- Rune-System: Gather/Refine/Build-Phasen</content>
<parameter name="filePath">c:\Users\Dennis\IncreMagic\specs\RESEARCH_SPEC.md