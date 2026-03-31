# Aufgaben-Pakete — Design-Update v0.2

---

## Paket 1: WorldMana Sigmoid

```
AUFGABE: WorldMana Sigmoid-Kurve implementieren
SPEZIALIST: resource-dev
LIES: INCREMAGIC_MASTER.md, specs/RESOURCE_SPEC.md,
      src/resources/WorldMana.ts

SCHREIBT IN: src/resources/WorldMana.ts

ZIEL:
  - worldManaFactor() nutzt Sigmoid statt linearer Clamp
  - Blend-Parameter (0.0=Sigmoid, 1.0=Linear) für spätere Forschung
  - WorldMana.setBlend(value: number): void — für ResearchTree
  - Alle bestehenden Aufrufe von getSpeedFactor() bleiben kompatibel
  - npx tsc --noEmit: 0 Fehler

INTERFACES:
  worldMana.getSpeedFactor(): number    (unverändert)
  worldMana.consume(amount): void       (neu)
  worldMana.setBlend(0.0–1.0): void    (neu, für Forschung)

ABNAHME:
  - Bei vollem WorldMana: factor ≈ 1.0
  - Bei 50% WorldMana: factor spürbar aber nicht drastisch
  - Bei 20% WorldMana: factor stark reduziert, plötzlicher als linear
  - npx tsc --noEmit: 0 Fehler

OFFEN: Sigmoid-Parameter k und threshold (Playtesting)
```

---

## Paket 2: Scribe-Gebäude

```
AUFGABE: Scribe-Gebäude mit Anteil-System implementieren
SPEZIALIST: building-dev
LIES: INCREMAGIC_MASTER.md, specs/BUILDING_SPEC.md, specs/GOLEM_SPEC.md,
      src/golems/GolemManager.ts,
      src/resources/ResourceManager.ts,
      src/resources/WorldMana.ts

SCHREIBT IN:
  src/buildings/ScribeBuilding.ts   (neu)
  src/buildings/index.ts            (neu, exports)

ZIEL:
  - ScribeBuilding Singleton
  - Verbraucht fired-golem + paper pro Sekunde
  - Produziert Golems gemäß Anteil-Einstellung
  - setShare(golemClass, amount): void
  - Nicht zugewiesene Golems → ResourceManager.produce('idle-golem', n)
  - WorldMana.consume() pro Tick
  - npx tsc --noEmit: 0 Fehler

INTERFACES:
  scribeBuilding.setShare(class, amount): void
  scribeBuilding.getShares(): Map<GolemClass, number>
  scribeBuilding.getOutputRate(class): number
  scribeBuilding.setScribeCount(n): void

ABNAHME:
  - Mit 1 Scribe + Anteilen [earth:2, water:1]: earth-gatherer wächst doppelt so schnell
  - idle-golem steigt wenn kein Auftrag vorhanden
  - npx tsc --noEmit: 0 Fehler

OFFEN: Basis-Output-Rate pro Scribe (Playtesting)
```

---

## Paket 3: idle-golem Ressource

```
AUFGABE: idle-golem als Ressource + Zuweisung
SPEZIALIST: golem-dev
LIES: INCREMAGIC_MASTER.md, specs/GOLEM_SPEC.md,
      src/golems/GolemManager.ts,
      src/resources/ResourceManager.ts

SCHREIBT IN:
  src/core/GameState.ts        (idle-golem zu resources hinzufügen)
  src/golems/GolemManager.ts   (assignFromIdle Methode)

ZIEL:
  - 'idle-golem' als Ressource in GameState
  - golemManager.assignFromIdle(class, count): boolean
    → verbraucht idle-golem, erhöht pool.count der Klasse
  - npx tsc --noEmit: 0 Fehler

INTERFACES:
  golemManager.assignFromIdle(class, count): boolean

ABNAHME:
  - idle-golem steigt wenn Scribe produziert ohne Zuweisung
  - assignFromIdle() vermindert idle-golem + erhöht Pool
  - npx tsc --noEmit: 0 Fehler
```

---

## Paket 4: Anteil-UI

```
AUFGABE: Anteil-UI für Scribe-Gebäude
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md, specs/UI_SPEC.md, specs/BUILDING_SPEC.md,
      src/buildings/ScribeBuilding.ts,
      src/ui/panels/GolemPoolPanel.ts

SCHREIBT IN:
  src/ui/panels/ScribePanel.ts   (neu)
  src/ui/GolemView.ts            (ScribePanel einbinden)

ZIEL:
  - Panel zeigt alle bekannten Golem-Klassen mit Zahlenfeld
  - Spieler gibt absolute Anteile ein (kein Slider, kein %)
  - Unter der Liste: Gesamtsumme + berechnete Rate pro Klasse
  - Neue Golem-Klasse erforscht → erscheint automatisch
  - Erdton-Ästhetik
  - npx tsc --noEmit: 0 Fehler

INTERFACES:
  import { scribeBuilding } from '../buildings/ScribeBuilding.js'

ABNAHME:
  - Zahlen ändern → Rate-Anzeige aktualisiert sich sofort
  - npx tsc --noEmit: 0 Fehler

OFFEN: Layout (horizontal/vertikal, Spielraum des ui-dev)
```
