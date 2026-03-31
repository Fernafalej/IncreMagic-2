# Aufgaben-Paket: GolemView Refactoring

```
AUFGABE: GolemView aufteilen in Panel-Komponenten
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md, src/ui/GolemView.ts, index.html

SCHREIBT IN:
  src/ui/GolemView.ts                  (nur Koordination, imports + init)
  src/ui/panels/GatherPanel.ts         (Sammeln: Erde, Wasser, Holz)
  src/ui/panels/CraftingPanel.ts       (Crafting-Rezepte)
  src/ui/panels/RitualPanel.ts         (4-Elemente-Ritual)
  src/ui/panels/BreathPanel.ts         (Seele einhauchen)
  src/ui/panels/GolemPoolPanel.ts      (Golem-Liste + Aufträge)

ZIEL:
  - GolemView.ts ist nur noch Koordinator: importiert Panels, baut Container, initialisiert
  - Jedes Panel ist eine eigene Klasse/Funktion in eigener Datei
  - Verhalten bleibt identisch — kein neues Feature
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen — rein strukturelle Änderung

ABNAHME:
  - GolemView.ts unter 100 Zeilen
  - Jedes Panel unter 150 Zeilen
  - Funktionalität identisch mit vorher
  - npx tsc --noEmit: 0 Fehler

OFFEN: Panel-Kommunikation (Events vs. Callbacks) — ui-dev entscheidet
```
