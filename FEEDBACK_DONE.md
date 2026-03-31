
## Abgearbeitet: 2026-03-31

- Golem ritual etc. nimmt platz weg, braucht es nicht mehr → Aufgabe F: ui-dev entfernt Ritual-Panel
- tick anzeige unten links versperrt sicht auf unterstes → Aufgabe F: ui-dev fixt Tick-Anzeige
- suchradien der Golems sollten nicht so viel platz wegnehmen und konzentrisch sein → Aufgabe G: ui-dev macht Kreise konzentrisch/kompakter
- kann worldmana nicht testen, da es evtl noch keine rolle spielt → ERLEDIGT: WorldMana bereits in v0.2 aktiviert (DONE 2026-03-30)
- es sollte auf einer Webseite einfach lokal laufen, mit Cookies werden saves gespeichert → Aufgabe J: core-dev implementiert SaveManager mit localStorage
- spiel sollte mit einem Golem pro resource starten → Aufgabe H: golem-dev ändert Startvorgabe auf 1 Golem pro Ressource
- resourcen pro sekunde mindestens durch 10 teilen → Aufgabe I: resource-dev teilt Produktionsraten durch 10
- es braucht ein window für Forschung mit Buttons zum öffnen und schließen → Aufgabe K: ui-dev baut Forschungs-Panel mit Toggle-Button

## Abgearbeitet: 2026-03-31

- spiel sollte mit einem Golem pro resource starten → DONE: main.ts startet mit earth-gatherer(1), water-gatherer(1), wood-gatherer(1)
- resourcen pro sekunde mindestens durch 10 teilen → DONE: PRODUCTION_SCALE=0.1 in ResourceManager, DRAIN_PER_PRODUCER_RATE 4→0.4 in WorldMana
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
  src/ui/panels/GolemPoolPanel.ts      (Golem-Liste + AuftrÃ¤ge)

ZIEL:
  - GolemView.ts ist nur noch Koordinator: importiert Panels, baut Container, initialisiert
  - Jedes Panel ist eine eigene Klasse/Funktion in eigener Datei
  - Verhalten bleibt identisch â€” kein neues Feature
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen â€” rein strukturelle Ã„nderung

ABNAHME:
  - GolemView.ts unter 100 Zeilen
  - Jedes Panel unter 150 Zeilen
  - FunktionalitÃ¤t identisch mit vorher
  - npx tsc --noEmit: 0 Fehler

OFFEN: Panel-Kommunikation (Events vs. Callbacks) â€” ui-dev entscheidet
```
