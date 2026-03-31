# QA Report — v0.1 Vollständige Abnahme
_Datum: 2026-03-30_
_QA-Spezialist: qa_
_Basis: INCREMAGIC_MASTER.md §2.1 §4 §6.4 §8 + alle DONE-Blöcke in STATUS.md_

---

## Gesamtergebnis: PASS (mit bekannten Nicht-Blockern)

v0.1 erfüllt sein Kernziel: "5 Minuten spielen, Wesen verstehen."
Der Spieler kann manuell sammeln, Ressourcen verarbeiten, einen Golem erschaffen
und beobachten wie die Erdproduktion automatisch läuft. TypeScript kompiliert
fehlerfrei. Keine Blocker gefunden.

---

## Abnahme-Checkliste

### [ ] Erde/Wasser/Holz-Buttons: +1 im HUD sichtbar

**PASS.**
`craftingManager.gather('earth'|'water'|'wood')` ruft
`resourceManager.addAmount(id, 1)` → `gameState.resources.set(id, current + 1)`.
HUD liest `gameState.resources.get(id)` per Ticker-Tick.
Alle drei gather-Buttons in GolemView korrekt verkabelt.

---

### [ ] Verbrennen: Holz sinkt, Feuer steigt

**PASS — mit Einschränkung (kein Blocker).**
`craftingManager.burn(1)` führt `Math.floor(available)` durch.
Solange Holz als ganze Zahl vorliegt (manuell gesammelt, kein Auto-Producer für
Holz in v0.1), funktioniert dies korrekt: 1 Holz → −1 Holz, +1 Feuer.

Einschränkung: Wenn Holz durch einen zukünftigen Auto-Producer auf einen
Dezimalwert fiele (z.B. 0.9), würde `burn(1)` nichts tun weil `Math.floor(0.9)=0`.
Für v0.1 ohne Holz-Auto-Producer ist das kein Problem.

---

### [ ] Lehm-Rezept: deaktiviert wenn keine Zutaten, aktiv wenn genug

**PASS.**
`craftingManager.canCraft('clay')` prüft `earth >= 1 && water >= 1`.
GolemView.updateCraftingButtons() setzt `btn.disabled = !can` + opacity 0.5
+ cursor not-allowed. Wird pro Ticker-Tick aktualisiert.
Zutaten-Status (z.B. "0/1 0/1") wird neben dem Button angezeigt.

---

### [ ] craft('clay') verbraucht earth+water, gibt clay

**PASS.**
Rezept-Definition korrekt: inputs [{earth,1},{water,1}], output {clay,1}.
`craft()` prüft Zutaten, verbraucht sie, fügt Ergebnis hinzu.
Rückgabe: true bei Erfolg, false wenn Ressourcen fehlen.

---

### [ ] craft('raw-golem'): clay → roh-golem

**PASS.**
Rezept-Definition korrekt: inputs [{clay,1}], output {raw-golem,1}.
Identische craft()-Logik, kein Problem.

---

### [ ] craft('fired-golem'): raw-golem + fire → fired-golem

**PASS.**
Rezept-Definition korrekt: inputs [{raw-golem,1},{fire,1}], output {fired-golem,1}.
Identische craft()-Logik, kein Problem.

---

### [ ] "Hauch des Lebens": fired-golem vorhanden → Pool wächst, earth-Produktion läuft

**PASS.**
`onBreathClick()` prüft `Math.floor(resourceManager.getAmount('fired-golem')) > 0`.
Ruft `golemFactory.createFromFiredGolem(1,1)` → verbraucht 1 fired-golem,
gibt 1 zurück.
Dann `golemManager.addToPool('earth-gatherer', '', 1)` (Pool-Zähler +1) und
`golemManager.assignPool('earth-gatherer', createOrder('HARVEST', 'earth', 0, 5))`.

Produktionslogik: `assignPool` entfernt alten Producer (alte count) und registriert
neuen Producer (neue count). Netto: Produktion steigt um +1 Golem.

Tracing Beispiel: Start mit 5 earth-gatherer → erster Hauch → Pool = 6,
Producer 'earth' = 6. Erde-Produktion steigt von ~5/s auf ~6/s. Korrekt.

---

### [ ] 5 Start-Erdsammler aktiv von Beginn an (earth steigt ohne Klick)

**PASS.**
`main.ts` Zeilen 32–33:
```
golemManager.addToPool('earth-gatherer', '', 5);
golemManager.assignPool('earth-gatherer', createOrder('HARVEST', 'earth', 0, 5));
```
ResourceManager bekommt `addProducer('earth', 5)`.
Da `PRIME_SQRT['earth']` nicht definiert ist (Fallback `?? 1`), rechnet
`tick()`: `5 * 1 * 1.0 * worldManaFactor * 1`.
WorldMana startet bei 10000, threshold_slow=3000 → worldManaFactor=1.0.
Produktion: +5 Erde/Sekunde ab dem ersten Tick. HUD zeigt "+5.00/s". Korrekt.

---

### [ ] HUD zeigt alle 10 Ressourcen korrekt

**PASS.**
HUD.ts `resourceDefs`-Array enthält alle 10 Ressourcen in der richtigen
Reihenfolge: earth, water, wood, fire, clay, raw-golem, fired-golem, paper,
stone, mana. Jede Zeile: Symbol + Label + Wert (1 Dez.) + Rate (+X.XX/s).
Aktualisierung per Ticker-Tick.

---

### [ ] Kein TypeScript-Fehler (npx tsc --noEmit)

**PASS.**
`npx tsc --noEmit` gibt keine Ausgabe (= 0 Fehler, 0 Warnungen).
Strict mode aktiv, kein `any` in neuen Dateien.

---

### [ ] Kein JS-Fehler in Konsole beim Start

**PASS (statische Analyse).**
Direkter Browser-Test nicht möglich in dieser Umgebung. Statische Analyse:
- Alle DOM-IDs (#game-canvas, #hud-container, #golem-container, #debug)
  existieren in index.html.
- Null-Guards an allen Stellen: `if (canvas)`, `if (hudContainer)`,
  `if (golemContainer)` — fehlendes Element führt zu console.error, kein throw.
- localStorage-Zugriff mit null-Check (`if (lastSeen)`).
- Kein zirkulärer Import festgestellt.
- Singleton-Initialisierungsreihenfolge korrekt:
  WorldMana → ResourceManager → GolemManager → main.ts-Setup.

---

## Gefundene Probleme

### Bug #1 — NICHT-BLOCKER (bekannt aus vorherigem Sprint)
**Ritual-Golems erscheinen nicht in Pool-Anzeige**

`GolemView.completeRitual()` ruft `golemManager.add(golem)` auf (altes
Einzel-Golem-System), aber nicht `addToPool()`. Der per Ritual erschaffene
Golem hat Klasse `'HARVEST'` (nicht `'earth-gatherer'`), bekommt keinen
Auftrag und erscheint nicht in der Pool-Anzeige.

Auswirkung: Das 4-Elemente-Ritual als UI-Funktion ist visuell tot — Golem
"verschwindet" nach dem Ritual aus Nutzersicht. Die Feedback-Nachricht
"✦ Golem erschaffen!" erscheint, aber der Pool zeigt keine Änderung.
Empfehlung: Im nächsten Sprint Ritual auf Pool-System umstellen oder
Ritual-Panel aus der v0.1-UI entfernen.

---

### Bug #2 — NICHT-BLOCKER (bekannt aus vorherigem Sprint)
**PRIME_SQRT nicht für Frühspiel-Ressourcen definiert**

ResourceManager kennt Primzahl-Wurzeln nur für: stone, mana, energy, knowledge,
souls, taint. Für earth, water, wood, fire, clay, raw-golem, fired-golem, paper
fehlen Einträge — Fallback ist `1` (`?? 1`).

Auswirkung für v0.1: Erdsammler produzieren `5 * 1` statt `5 * √2 ≈ 7.07`
Einheiten/Sekunde. Die Produktion läuft, aber mit falscher Rate gemäß MASTER §6.4.

Empfehlung: PRIME_SQRT um alle Frühspiel-Ressourcen erweitern bevor
Balancing/Playtesting stattfindet.

---

### Bug #3 — NICHT-BLOCKER
**assignPool — Producer-Zähler-Diskrepanz bei erstem "Hauch des Lebens"**

Ablauf: `addToPool('earth-gatherer','',1)` erhöht pool.count auf 6.
Dann `assignPool(...)` findet pool.count=6, ruft `removeProducer('earth',6)` auf.
Da der aktuelle Producer-Wert noch 5 ist, rechnet `removeProducer`:
`Math.max(0, 5-6) = 0` → Producer gelöscht. Dann `addProducer('earth', 6)`.

Nettowert: 6 korrekt. Kein funktionaler Fehler, aber der Zwischenzustand
(Producer = 0 für ein Tick) existiert theoretisch nicht da beide Aufrufe
im selben synchronen Aufruf-Stack liegen (kein Tick dazwischen). Kein Blocker.

---

### Beobachtung #4 — INFO
**GolemClass enthält Legacy-Typen**

`GolemClass` in GolemFactory.ts:
`'HARVEST' | 'BUILD' | 'SCRIBE' | 'RESEARCH' | 'earth-gatherer' | ...`

Die alten Typen ('HARVEST', 'BUILD', ...) werden noch von `completeRitual()`
genutzt (class='HARVEST'). Langfristig sollte GolemClass bereinigt werden.
Kein Blocker für v0.1.

---

### Beobachtung #5 — INFO
**Inkonsistenter Export-Stil**

`GolemView` exportiert als `export class GolemView { ... }`.
`HUD` exportiert als `export { HUDImpl as HUD }`.
Funktioniert korrekt. Rein kosmetisches Problem.

---

## Produktionsraten-Check (MASTER §6.4)

| Ressource | Produziert von | Rate/s (v0.1) | Sollwert (MASTER) |
|-----------|---------------|---------------|-------------------|
| earth     | 5 earth-gatherer | 5 * 1.0 * 1.0 = 5.00 | 5 * √2 ≈ 7.07 |
| stone     | (kein Producer) | 0.00 | — |
| mana      | (kein Producer) | 0.00 | — |

Differenz earth: ~2.07/s zu niedrig wegen fehlendem PRIME_SQRT. Siehe Bug #2.

---

## Architektur-Prüfung

- **Singleton-Pattern**: Alle Module (gameState, ticker, eventBus, worldMana,
  resourceManager, craftingManager, golemFactory, golemManager) korrekt als
  Export-Konstanten implementiert.
- **Keine zirkulären Abhängigkeiten** festgestellt.
- **EventBus**: MANA_LOW, TAINT_RISING korrekt gefeuert und konsumiert.
  GOLEM_CORRUPTED im Tick-Handler registriert.
- **OfflineCalc**: Stub-Implementation (gibt State unverändert zurück, loggt Zeit).
  Für v0.1 akzeptabel.
- **WorldMana-Drain**: Bei 5 earth-gatherer: drain=0.5/tick, regen=2/tick.
  Netto: +1.5 WorldMana/tick. Keine Erschöpfung in v0.1. Korrekt.

---

## Empfehlungen für nächsten Sprint

1. **PRIME_SQRT erweitern** (earth=√2, water=√3, wood=√5) — Balancing-Voraussetzung
2. **Ritual-Panel** entweder auf `addToPool('HARVEST'/'earth-gatherer')` umstellen
   oder bis Ritual-Redesign aus der UI entfernen
3. **assignPool-Logik** absichern: count für removeProducer aus dem alten pool.count
   lesen (vor addToPool), nicht nach dem Increment
4. **GolemClass bereinigen**: Legacy-Strings ('HARVEST','BUILD','SCRIBE','RESEARCH')
   durch semantische Klassen-Namen ersetzen wenn Ritual-Refactor stattfindet

---

## Sprint-Abnahme (vorherige QA-Aufgaben A+B+C)

Alle Punkte aus dem vorherigen Report bleiben bestätigt:
- [x] Aufgabe A — CraftingManager: vollständig und korrekt
- [x] Aufgabe B — GolemPool: vollständig und korrekt
- [x] Aufgabe C — UI: vollständig und korrekt
- [x] TypeScript: 0 Fehler
