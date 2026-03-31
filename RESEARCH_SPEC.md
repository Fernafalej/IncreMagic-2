# RESEARCH_SPEC — Runen & Forschung
> Detail-Dokument für `research-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Runen als durchgängige Ebene

Runen sind das Bindegewebe zwischen allen Magie-Ebenen. Sie werden erforscht und schalten neue Fähigkeiten, Boni und Brücken zu anderen Ebenen frei.

**Progression:**
- Früh: Manuelles Puzzle-Game (Magier studiert Runen aktiv)
- Mittel: Teilautomatisierung durch Forscher-Golems
- Spät: Vollautomatisch — Golems kennen die Runen so gut wie der Magier

---

## 2. Runen Puzzle-Game (manuell, Frühspiel)

Drei Phasen die zusammen einen Loop ergeben:

### Phase 1 — Gather (Essenzen sammeln)
- 4×4 Grid mit farbigen Zellen (grün, rot, blau + Joker)
- Spieler zieht Ketten von max. 3 Zellen
- Kette muss **ausbalanciert** sein: gleich viele grün/rot/blau
- Weiß = Joker (zählt für jede Farbe)
- Schwarz = Joker (zählt als 1 für alle)
- Erfolgreiche Kette → Essenzen der jeweiligen Farben

**Spawn-Wahrscheinlichkeiten (bewusst unausgewogen):**
```
grün:  35%  ← häufigste, sammelt sich an → Bett voll → Taint
blau:  30%
rot:   25%
weiß:  10%  (Joker)
```
Später durch Forschung: Spieler kann Raten anpassen.

**Spätere Farben (durch Forschung freigeschaltet):**
- Cyan (grün+blau), Magenta (rot+blau), Gelb (grün+rot)
- Zählen je 0.5 für beide Komponenten beim Ausbalancieren

### Phase 2 — Refine (Kristalle züchten)
- 5×5 Grid, Spieler platziert Kristalle
- 3+ gleiche Kristalle nebeneinander → Level-Up (Kaskaden möglich)
- Höhere Level-Kristalle = mächtigere Runen

**Kristall-Darstellung:** SVG pro Kristall-Typ, transparente Mitte, Stufe als Zahl darin:
```
    ╱‾‾╲
   ╱    ╲
  │  3   │  ← Stufe
   ╲    ╱
    ╲__╱
```
- Farbe des SVG = Kristall-Farbe
- Zahl in der Mitte = Level
- Transparenter Hintergrund damit das Grid durchscheint

### Phase 3 — Build (Runen schmieden)
- Rezepte aus Kristall-Kombinationen
- Fertige Rune → schaltet Forschungsknoten frei oder gibt Bonus

### Farbenblind-Modus
- Color-Picker für alle Farben (war im alten Prototyp vorhanden)
- Muss erhalten bleiben

---

## 3. Automatisierung

Nach genug manuellen Wiederholungen pro Phase → Forschung verfügbar:

| Phase | Forschung | Effekt |
|---|---|---|
| Gather | "Muster-Erkennung" | Forscher-Golems sammeln Essenzen automatisch |
| Refine | "Kristall-Zucht" | Golems platzieren Kristalle nach Priorität |
| Build | "Runen-Schrift" | Scribes schmieden Runen aus Queue |
| Gather | "Raten-Kontrolle" | Spieler kann Spawn-Wahrscheinlichkeiten anpassen |

---

## 4. WorldMana-Forschung

- Schaltet frei: `worldMana.setBlend()` — Sigmoid wird linearer
- Spieler versteht ab jetzt besser was mit der Welt passiert

## 5. Taint-Forschung

- Schaltet frei: Taint als Ressource erntbar
- Taint-Runs werden möglich (andere Spielweise)
- `worldMana.setBlend(1.0)` — vollständig linear

---

## 6. Forschungsbaum (Grundstruktur)

```typescript
interface ResearchNode {
    id: string;
    name: string;
    cost: ResourceMap;
    requiredManualCount: number;  // wie oft manuell gemacht bevor Forschung erscheint
    currentManualCount: number;
    unlocks: string[];            // andere Node-IDs
    completed: boolean;
}
```

---

## 7. Blackbox-Interface

**ResearchTree gibt nach außen:**
- `isUnlocked(nodeId): boolean`
- `getUnlockedGolemClasses(): GolemClass[]`
- `getBlendFactor(): number` (für WorldMana)
- `complete(nodeId): void`
- `incrementManual(actionType): void`

---

*Version: 0.2.0*
