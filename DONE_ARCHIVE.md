# INCREMAGIC — Done Archive
> Abgeschlossene Aufgaben. Wird nie vollständig gelesen — nur blind appended.

---

## DONE: Core Foundation (GameState + Ticker + EventBus + OfflineCalc)
_Abgeschlossen: 2026-03-30 — core-dev_

- [x] `package.json` mit Vite + TypeScript
- [x] `tsconfig.json` (strict mode, ESNext, bundler resolution)
- [x] `index.html` mit Debug-Anzeige (Erdton-Ästhetik)
- [x] `src/core/GameState.ts` — Singleton, tick/dimension/resources/taint/worldMana, serialize/deserialize
- [x] `src/core/EventBus.ts` — Singleton, typsichere on/off/emit, alle 7 Event-Typen aus MASTER §7
- [x] `src/core/Ticker.ts` — requestAnimationFrame Loop, 1 tick/Sekunde, alle 5 ticks console.log, register/unregister/start/stop
- [x] `src/core/OfflineCalc.ts` — Stub, loggt Offline-Zeit, max 48h, gibt State unverändert zurück
- [x] `src/main.ts` — Bootstrap: Offline-Check, EventBus-Handler, Ticker-Start, Debug-UI mit tick-Counter
- [x] `npm run dev` getestet — Node v24.14.1, Vite v5.4.21, läuft auf http://localhost:5173

---

## DONE: ResourceManager + WorldMana (v0.1)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] `src/resources/WorldMana.ts` — WorldManaImpl Singleton: current (privat), capacity=10000, threshold_slow=3000, threshold_taint=1000, regenerate, drain, getWorldManaFactor, getTaintLevel
- [x] `src/resources/ResourceManager.ts` — ResourceManagerImpl Singleton: addProducer, removeProducer, getAmount, tick mit Produktionsformel (n * √prime(r) * 1.0 * worldManaFactor)
- [x] `src/main.ts` — Imports ergänzt, 2 simulierte Producer (stone rate=1, mana rate=1), Debug-UI zeigt MF-Wert
- [x] Produktionsformel exakt nach MASTER §6.4 implementiert (qualityMultiplier=1.0 für v0.1)
- [x] MANA_LOW Event feuert einmalig wenn WorldMana unter threshold_slow fällt
- [x] TAINT_RISING Event feuert einmalig wenn WorldMana unter threshold_taint fällt

---

## DONE: UI — ResourceCircleView + HUD (v0.1)
_Abgeschlossen: 2026-03-30 — ui-dev_

- [x] `src/ui/ResourceCircleView.ts` — Canvas-basiert, 2 Kreise (Stein ocker, Mana türkis), logarithmisches Wachstum, LERP-Interpolation, MANA_LOW-Puls (subtil amber, ±4px, Farbe)
- [x] `src/ui/HUD.ts` — DOM-basiert, Symbol + Wert (1 Dez.) + Rate (+X.XX/s) pro Ressource, per Ticker
- [x] `index.html` — Canvas (fullscreen, absolute), HUD-Container (oben links, halbtransparent), Erdton-Farbschema #2a1f0e
- [x] `src/main.ts` — ResourceCircleView + HUD importiert und initialisiert

---

## DONE: GolemView Refactoring (Panel-Komponenten)
_Abgeschlossen: 2026-03-31 — ui-dev_

- [x] `src/ui/GolemView.ts` — Koordinator: importiert Panels, baut Container, initialisiert (68 Zeilen)
- [x] `src/ui/panels/GatherPanel.ts` — Sammeln: Erde, Wasser, Holz + Verbrennen
- [x] `src/ui/panels/CraftingPanel.ts` — Rezepte mit canCraft-Check, craft()-Buttons
- [x] `src/ui/panels/RitualPanel.ts` — 4-Elemente-Sequenz (Erde → Wasser → Feuer → Luft)
- [x] `src/ui/panels/BreathPanel.ts` — Hauch des Lebens: fired-golem → Golem im Pool
- [x] `src/ui/panels/GolemPoolPanel.ts` — Golem-Liste + Aufträge
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: Frühspiel-Ressourcen + CraftingManager (Aufgabe A)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] Neue Ressourcen-IDs in `GameState.ts`: 'earth', 'water', 'wood', 'fire', 'clay', 'raw-golem', 'fired-golem', 'paper'
- [x] `ResourceManager.ts` — `addAmount(resourceId, amount)` als neue public API
- [x] `src/resources/CraftingManager.ts` (neu) — Singleton: getRecipes(), canCraft(), craft(), gather(), burn()
- [x] `npx tsc --noEmit` — keine Fehler
Schnittstellen-Änderungen: `ResourceManager.addAmount(resourceId, amount): void` neu

---

## DONE: GolemSystem Pool-Redesign (Aufgabe B)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `GolemPool`-Interface: `{ class, variant, count, order|null }`
- [x] `golemManager.addToPool(class, variant, count)`, `assignPool(class, order)`, `getPool()`
- [x] `GolemClass` um 'earth-gatherer', 'water-gatherer', 'wood-gatherer' erweitert
- [x] `golemFactory.createFromFiredGolem(firedGolemCount, breathCount)` → number
- [x] `src/main.ts` — 5 earth-gatherer als Startvorgabe
- [x] `npx tsc --noEmit` — keine Fehler
Schnittstellen-Änderungen: GolemPool-Interface neu, golemManager +3 Methoden, golemFactory +1 Methode, GolemClass +3 Klassen

---

## DONE: UI-Umbau (Aufgabe C) — Sammel-UI + Crafting-Panel + Golem-Pool-Anzeige
_Abgeschlossen: 2026-03-30 — ui-dev_

- [x] `src/ui/HUD.ts` — resourceDefs auf 10 Ressourcen erweitert
- [x] `src/ui/GolemView.ts` — 5 Bereiche: Sammel-Panel, Crafting-Panel, Ritual-Panel, Hauch des Lebens, Golem-Pool-Anzeige
- [x] `index.html` — CSS-Blöcke für alle neuen UI-Elemente
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: Bugfix — Ritual-Golem → Pool (QA Bug #1)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `src/golems/GolemFactory.ts` — `create()` gibt `class: 'earth-gatherer'` zurück
- [x] `src/ui/GolemView.ts` — `completeRitual()` nutzt Pool-Pfad via addToPool + assignPool
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: WorldMana aktivieren (v0.2)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] `src/resources/WorldMana.ts` — REGEN_RATE 2→5, `drainForProducers(totalRate, delta)` neu
- [x] `src/resources/ResourceManager.ts` — summiert totalProducerRate, ruft drainForProducers auf; alten per-Unit-Drain entfernt
- [x] `npx tsc --noEmit` — 0 Fehler
Schnittstellen-Änderungen: `worldMana.drainForProducers(totalRate, delta): void` neu

---

## DONE: ScribeGolem + OrderQueue (v0.2)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `src/golems/OrderSystem.ts` — OrderQueue Singleton mit vollem Interface (enqueue, getAll, remove, setPriority, toggleRepeat, peek, complete)
- [x] `src/golems/ScribeGolem.ts` (neu) — Singleton, writeProgress fraktional, Papier-Verbrauch, Queue-Integration
- [x] `src/golems/GolemManager.ts` — `dispatchOrder(orderType, target, order)` neu
- [x] `src/golems/GolemFactory.ts` — GolemClass um 'scribe' erweitert
- [x] `src/main.ts` — ScribeGolem-Import ergänzt
- [x] `npx tsc --noEmit` — 0 Fehler
Schnittstellen-Änderungen: OrderRequest-Interface neu, orderQueue Singleton neu, createOrderRequest() neu, GolemClass+'scribe', golemManager.dispatchOrder() neu

---

## DONE: StartGolems 1 pro Ressource (Aufgabe H)
_Abgeschlossen: 2026-03-31 — golem-dev_

- [x] `src/main.ts` — 3 Pools à count=1: earth-gatherer, water-gatherer, wood-gatherer
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: Balance — Produktionsraten /10 (Aufgabe I)
_Abgeschlossen: 2026-03-31 — resource-dev_

- [x] `src/resources/ResourceManager.ts` — `PRODUCTION_SCALE = 0.1` eingeführt
- [x] `src/resources/WorldMana.ts` — `DRAIN_PER_PRODUCER_RATE` von 4 auf 0.4 reduziert
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: OrderQueue-UI (Aufgabe D)
_Abgeschlossen: 2026-03-31 — ui-dev_

- [x] `src/ui/OrderQueueView.ts` — neu, Queue-Liste, Aktionen (setPriority/toggleRepeat/remove), Hinzufügen-Formular, Fortschrittsbalken
- [x] `src/main.ts` — OrderQueueView importiert + initialisiert
- [x] `index.html` — #order-queue-container + CSS
- [x] `npx tsc --noEmit` — 0 Fehler

---
