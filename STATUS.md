# INCREMAGIC — Projektstatus
_Zuletzt aktualisiert: 2026-03-30_
_Aktueller Meilenstein: v0.1 — Proof of Concept_

---

## Fertig

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

Schnittstellen-Änderungen: nein — exakt wie MASTER §7 definiert

Nächster Agent braucht:
- `resource-dev`: Lies `INCREMAGIC_MASTER.md` §4, §6.4 + diese STATUS.md
- Importiere `gameState` aus `src/core/GameState.ts` und `ticker` aus `src/core/Ticker.ts`
- Registriere eigene Tick-Handler via `ticker.register(fn)`
- Feuere `eventBus.emit({ type: 'MANA_LOW', level })` wenn WorldMana unter Schwelle fällt
- GameState.resources ist eine `Map<string, number>` — Schlüssel: 'mana', 'stone', 'energy', 'knowledge', 'souls', 'taint'

---

## DONE: ResourceManager + WorldMana (v0.1)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] `src/resources/WorldMana.ts` — WorldManaImpl Singleton: current (privat), capacity=10000, threshold_slow=3000, threshold_taint=1000, regenerate, drain, getWorldManaFactor, getTaintLevel
- [x] `src/resources/ResourceManager.ts` — ResourceManagerImpl Singleton: addProducer, removeProducer, getAmount, tick mit Produktionsformel (n * √prime(r) * 1.0 * worldManaFactor)
- [x] `src/main.ts` — Imports ergänzt, 2 simulierte Producer (stone rate=1, mana rate=1), Debug-UI zeigt MF-Wert
- [x] Produktionsformel exakt nach MASTER §6.4 implementiert (qualityMultiplier=1.0 für v0.1)
- [x] MANA_LOW Event feuert einmalig wenn WorldMana unter threshold_slow fällt
- [x] TAINT_RISING Event feuert einmalig wenn WorldMana unter threshold_taint fällt
- [x] `npm run dev` bestätigt — läuft (Node v24.14.1)

Schnittstellen-Änderungen: nein — MASTER §7 Events unverändert genutzt

Nächster Agent braucht:
- `golem-dev`: Importiere `resourceManager` aus `src/resources/ResourceManager.ts`
  - `resourceManager.addProducer(resourceId, rate)` — wenn Golem Auftrag annimmt
  - `resourceManager.removeProducer(resourceId, rate)` — wenn Golem Auftrag beendet/stoppt
  - resourceId-Schlüssel: 'stone', 'mana', 'energy', 'knowledge', 'souls', 'taint'
  - rate ist die Golem-Anzahl (oder gewichtete Rate) — Formel rechnet intern √prime * qualityMult * worldManaFactor
- `ui-dev`: Importiere `resourceManager` aus `src/resources/ResourceManager.ts`
  - `resourceManager.getAmount(resourceId)` — für Ressourcen-Anzeige
  - `worldMana.getWorldManaFactor()` aus `src/resources/WorldMana.ts` — für Mana-Balken-Proxy
  - KEIN Getter für echten WorldMana-Wert — bewusst versteckt

---

## DONE: UI — ResourceCircleView + HUD (v0.1)
_Abgeschlossen: 2026-03-30 — ui-dev_

- [x] `src/ui/ResourceCircleView.ts` — Canvas-basiert, 2 Kreise (Stein ocker, Mana türkis), logarithmisches Wachstum, LERP-Interpolation für ruckelfreie Animation, MANA_LOW-Puls (subtil amber, ±4px, Farbe)
- [x] `src/ui/HUD.ts` — DOM-basiert, Symbol + Wert (1 Dez.) + Rate (+X.XX/s) pro Ressource, per Ticker, Rate = Tick-Differenz
- [x] `index.html` — Canvas (fullscreen, absolute), HUD-Container (oben links, halbtransparent), Debug (klein, Ecke rechts unten), Erdton-Farbschema #2a1f0e
- [x] `src/main.ts` — ResourceCircleView + HUD importiert und initialisiert, Debug-div minimiert
- [x] TypeScript-Prüfung ausführbar — Node v24.14.1 verfügbar

Schnittstellen-Änderungen: nein — liest nur `gameState.resources`, `resourceManager.getAmount` nicht direkt genutzt (GameState direkt), EventBus MANA_LOW konsumiert

Nächster Agent braucht:
- `golem-dev`: UI ist bereit. Wenn Golems Producer registrieren, wachsen die Kreise automatisch.
  - `resourceManager.addProducer(resourceId, rate)` und `removeProducer` wie bisher
  - UI liest `gameState.resources` direkt per Ticker
  - MANA_LOW aus EventBus löst Puls-Animation auf Mana-Kreis aus — kein weiterer UI-Code nötig
  - HUD-Erweiterung für neue Ressourcen: `src/ui/HUD.ts` Zeile 48ff — `resourceDefs`-Array erweitern

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
- [x] Funktionalität identisch mit vorher

Schnittstellen-Änderungen: nein — rein strukturelle Änderung

Nächster Agent braucht:
- UI ist vollständig modularisiert, Panels können unabhängig erweitert werden
- Kommunikation via Callbacks (onRitualComplete, onBreathComplete) für Pool-Updates

- [x] `src/golems/OrderSystem.ts` — Order-Interface, OrderType 'HARVEST', createOrder()-Fabrik-Funktion
- [x] `src/golems/GolemFactory.ts` — GolemFactoryImpl Singleton, create(elements[]) → Golem | null, 4-Elemente-Ritual-Validierung (earth→water→fire→air), Kurzformen für clay/terracotta akzeptiert, Golem-Interface nach MASTER §6.2, v0.1: qualityMultiplier=1.0, Mana-Kosten=0
- [x] `src/golems/GolemManager.ts` — GolemManagerImpl Singleton, add(golem), assign(golemId, order), unassign(golemId), getAll(), ticker.register für Taint-/Korruptions-Check, addProducer bei HARVEST-Auftrag, removeProducer bei Auftrag-Ende
- [x] `src/main.ts` — hardcodierte Demo-Producer (stone, mana) entfernt, GolemFactory/GolemManager/OrderSystem importiert, Demo: 1 Golem via Ritual erschaffen, Auftrag HARVEST 'stone' vergeben
- [x] TypeScript strict mode — kein any, keine unused vars, `npx tsc --noEmit` ohne Fehler

Schnittstellen-Änderungen: nein — MASTER §7 Events unverändert (GOLEM_CORRUPTED bereits definiert), ResourceManager-Interface unverändert

Nächster Agent braucht:
- `qa`: Testet ob HUD steigenden Stein-Wert zeigt und kein hardcodierter Producer mehr in main.ts vorhanden ist
- `golem-dev` (Iteration 2) oder `world-dev`: GolemManager.assign() und GolemFactory.create() sind die stabilen Einstiegspunkte
  - `golemManager.add(golem)` — nach golemFactory.create() aufrufen
  - `golemManager.assign(golemId, order)` — Order via createOrder() erzeugen
  - `golemManager.getAll()` → Golem[] — für UI-Anzeige
  - Golem-Interface: { id, class, quality, order, taintLevel, isCorrupted }
  - Order-Interface: { type: OrderType, target: string, quantity: number, priority: number }

---

## DONE: UI — GolemView (Ritual-Panel + Golem-Liste) v0.1
_Abgeschlossen: 2026-03-30 — ui-dev_

- [x] `src/ui/GolemView.ts` — neu, DOM-basiert, kein Canvas
  - Ritual-Panel: 4 Buttons (Erde/Wasser/Feuer/Luft), Fortschritts-Anzeige mit done/pending Styling
  - Falsches Element → Sequenz-Reset + rote Fehlermeldung (1,8s)
  - Vollständige Sequenz → golemFactory.create() + golemManager.add() + grünes Feedback
  - Golem-Liste: zeigt alle golemManager.getAll() Golems, ID (erste 8 Zeichen), Auftrag-Status
  - Pro Golem-Zeile: "⛏ Stein"-Button (createOrder HARVEST stone → golemManager.assign) oder "✕ Stopp"-Button wenn Auftrag aktiv
  - Aktualisiert sich jede Sekunde per ticker.register()
  - Korrumpierte Golems: ausgegraut, kein Button
- [x] `src/main.ts` — Demo-Golem-Block (golemFactory.create + golemManager.add + assign) entfernt, GolemView importiert + initialisiert (#golem-container)
- [x] `index.html` — `<div id="golem-container">` eingefügt (rechte Seite, scrollbar), CSS-Block für .golem-panel (halbtransparent, Erdton-Ästhetik nach MASTER §8: #2a1f0e BG, #c8a96e Text, #5a3e1b Border, #4ecdc4 aktiv/Erfolg, #c8960c Amber)
- [x] TypeScript strict mode — kein any, keine unused vars, `npx tsc --noEmit` ohne Fehler

Schnittstellen-Änderungen: nein — golemFactory, golemManager, createOrder, ticker alle als Singletons importiert ohne Interface-Änderungen

Nächster Agent braucht:
- `qa`: Teste manuelles Ritual (Erde→Wasser→Feuer→Luft), prüfe ob Golem in Liste erscheint, "Stein ernten"-Button steigert HUD-Stein-Wert
- `golem-dev` (Iteration 2): GolemView.renderGolemList() liest getAll() — neue Golem-Klassen (BUILD, SCRIBE etc.) würden automatisch erscheinen; für neue OrderTypes müsste GolemView um weitere Buttons erweitert werden
- `ui-dev` (Iteration 2): GolemView unterstützt destroy() für sauberes Aufräumen bei Dimensions-Wechsel

---

## DONE: Frühspiel-Ressourcen + CraftingManager (Aufgabe A)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] Neue Ressourcen-IDs in `GameState.ts`: 'earth', 'water', 'wood', 'fire', 'clay', 'raw-golem', 'fired-golem', 'paper' — alle mit 0 initialisiert
- [x] `ResourceManager.ts` — `addAmount(resourceId, amount)` als neue public API
- [x] `src/resources/CraftingManager.ts` (neu) — Singleton `craftingManager`:
  - `getRecipes()` → Recipe[] — 4 Rezepte: clay, raw-golem, fired-golem, paper
  - `canCraft(recipeId)` → boolean
  - `craft(recipeId)` → boolean — verbraucht Zutaten, gibt Ergebnis
  - `gather('earth'|'water'|'wood')` → void — +1 sofort
  - `burn(count)` → void — wood → fire 1:1
- [x] `npx tsc --noEmit` — keine Fehler

Schnittstellen-Änderungen: ja — `ResourceManager.addAmount(resourceId, amount): void` neu

Nächster Agent braucht:
- `golem-dev`: `fired-golem` ist jetzt Ressource via `craft('fired-golem')` — GolemFactory prüft fired-golem-Menge
- `ui-dev`: `craftingManager` aus `src/resources/CraftingManager.ts` für Sammel-Buttons + Crafting-Panel

---

## DONE: GolemSystem Pool-Redesign (Aufgabe B)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `GolemPool`-Interface: `{ class: GolemClass, variant: string, count: number, order: Order|null }`
- [x] `golemManager.addToPool(class, variant, count)` — Pool-Gruppen, addiert auf existierende
- [x] `golemManager.assignPool(class, order)` — weist Auftrag zu, ruft `addProducer(target, pool.count)` auf
- [x] `golemManager.getPool()` → GolemPool[]
- [x] `GolemClass` um 'earth-gatherer', 'water-gatherer', 'wood-gatherer' erweitert
- [x] `golemFactory.createFromFiredGolem(firedGolemCount, breathCount)` → number
- [x] `src/main.ts` — 5 earth-gatherer als Startvorgabe, produzieren 'earth' sofort
- [x] Alte Methoden (add/assign/unassign/getAll) erhalten
- [x] `npx tsc --noEmit` — keine Fehler

Schnittstellen-Änderungen: ja — GolemPool-Interface neu, golemManager +3 Methoden, golemFactory +1 Methode, GolemClass +3 Klassen

Nächster Agent braucht:
- `ui-dev`: `golemManager.getPool()` statt getAll(), GolemPool aus GolemManager.ts importieren
- `ui-dev`: "Hauch des Lebens"-Button → golemFactory.createFromFiredGolem(n,n) + addToPool + assignPool

---

## DONE: UI-Umbau (Aufgabe C) — Sammel-UI + Crafting-Panel + Golem-Pool-Anzeige
_Abgeschlossen: 2026-03-30 — ui-dev_

- [x] `src/ui/HUD.ts` — `resourceDefs`-Array auf 10 Ressourcen erweitert: Erde 🟤, Wasser 💧, Holz 🪵, Feuer 🔥, Lehm 🧱, Roh-Golem 🗿, Gebrannter Golem 🔶, Papier 📄, Stein ⛏, Mana ✦
- [x] `src/ui/GolemView.ts` — vollständig neu gebaut, 5 Bereiche:
  1. Sammel-Panel: 3 gather()-Buttons (Erde/Wasser/Holz) + burn()-Button (🔥 Verbrennen)
  2. Crafting-Panel: alle 4 Rezepte, canCraft-Check (Button disabled + opacity:0.5 + cursor:not-allowed wenn nicht möglich), craft()-Button, Zutaten-Status pro Rezept
  3. Ritual-Panel: 4-Elemente-Sequenz unverändert (golemFactory.create)
  4. "Hauch des Lebens"-Button: prüft fired-golem > 0, ruft createFromFiredGolem(1,1) + addToPool + assignPool auf
  5. Golem-Pool-Anzeige: getPool() → "N× Erdsammler-Golem" statt Einzelgolems
- [x] `index.html` — CSS-Blöcke für gather-btn, crafting-row/-info/-btn, breath-btn, golem-pool-count/-name
- [x] TypeScript strict — kein any, keine unused vars, `npx tsc --noEmit` ohne Fehler

Schnittstellen-Änderungen: nein — alle Aufrufe über bestehende Public APIs (craftingManager, golemFactory, golemManager, resourceManager, ticker)

Nächster Agent braucht:
- `qa`: Teste alle 3 gather()-Buttons (+1 HUD), alle 4 Rezepte im Crafting-Panel, "Hauch des Lebens" (fired-golem → Pool wächst), Golem-Pool-Anzeige zeigt "N× earth-gatherer"
- `world-dev` / `golem-dev`: GolemView.renderGolemList() liest getPool() — neue Pool-Klassen erscheinen automatisch wenn POOL_CLASS_LABELS in GolemView.ts ergänzt wird

---

## DONE: Bugfix — Ritual-Golem → Pool (QA Bug #1)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `src/golems/GolemFactory.ts` — `create()` gibt jetzt `class: 'earth-gatherer'` zurück statt `'HARVEST'`
- [x] `src/ui/GolemView.ts` — `completeRitual()` nutzt jetzt Pool-Pfad:
      `golemManager.addToPool(golem.class, '', 1)` + `golemManager.assignPool(golem.class, createOrder('HARVEST', 'earth', 0, 5))`
      statt des alten `golemManager.add(golem)` (Einzelgolem-Pfad)
- [x] Ritual-Golem landet im selben Pool-Eintrag wie die 5 Start-Golems und der "Hauch des Lebens"-Pfad (alle Variante `''`)
- [x] `npx tsc --noEmit` — 0 Fehler

Schnittstellen-Änderungen: nein — alle Methoden existierten bereits, keine neuen Signaturen

Nächster Agent braucht:
- `qa`: Testen — Erde→Wasser→Feuer→Luft → Pool-Anzeige zeigt +1 Erdsammler, earth-Produktion steigt

---

## DONE: WorldMana aktivieren (v0.2)
_Abgeschlossen: 2026-03-30 — resource-dev_

- [x] `src/resources/WorldMana.ts` — `REGEN_RATE_PER_SECOND` von 2 auf 5 erhöht
- [x] `src/resources/WorldMana.ts` — `drainForProducers(totalProducerRate, delta)` neu: Drain = totalRate * 4 * delta, unabhängig von worldManaFactor
- [x] `src/resources/ResourceManager.ts` — `tick()` summiert `totalProducerRate` über alle aktiven Producer, ruft `worldMana.drainForProducers()` am Ende auf
- [x] `src/resources/ResourceManager.ts` — alten per-Unit-Drain (`MANA_DRAIN_PER_UNIT`) entfernt
- [x] WorldMana.tick() bleibt per `ticker.register` (bereits in v0.1 verdrahtet) — kein Änderungsbedarf in `main.ts`
- [x] `worldManaFactor()` beeinflusst Produktion weiterhin via Formel in ResourceManager (unveränderter Pfad)
- [x] Echter WorldMana-Wert (`current`) bleibt `private` — kein HUD-Getter
- [x] `npx tsc --noEmit` — 0 Fehler

Schnittstellen-Änderungen: ja — `worldMana.drainForProducers(totalRate, delta): void` neu (für ResourceManager intern)

Verhalten bei 10 aktiven Golems (rate=10):
- Drain: 10 * 4 = 40/s, Regen: 5/s → netto −35/s
- Von 10000 auf threshold_slow (3000) in ~200s → MANA_LOW feuert, worldManaFactor() beginnt zu sinken
- Produktion fällt messbar (worldManaFactor = clamp(current/3000, 0.1, 1.0))
- Drain ist konstant (MF-unabhängig) → echter Ressourcendruck ohne Dämpfungseffekt

Nächster Agent braucht:
- `qa`: Teste mit 10+ Golems dass worldManaFactor() nach ~3–4 Minuten spürbar unter 1.0 fällt
  - Debug-UI zeigt MF-Wert in Echtzeit
  - MANA_LOW wird in Konsole geloggt
- `ui-dev`: Mana-Puls-Animation in ResourceCircleView reagiert bereits auf MANA_LOW (EventBus)
- `golem-dev`: Keine Interface-Änderungen nötig — GolemManager nutzt weiterhin `resourceManager.addProducer()`

## DONE: ScribeGolem + OrderQueue (v0.2)
_Abgeschlossen: 2026-03-30 — golem-dev_

- [x] `src/golems/OrderSystem.ts` — OrderQueue Singleton erweitert:
  - `OrderRequest`-Interface: `{ id, type, target, quantity, priority, repeat }`
  - `OrderType` auf 'HARVEST' | 'PROCESS' | 'CRAFT' | 'WRITE' | 'RESEARCH' | 'BUILD' erweitert
  - `createOrderRequest(type, target, quantity, priority, repeat)` Fabrik-Funktion neu
  - `orderQueue.enqueue(request)` — fügt ein und sortiert nach priority desc
  - `orderQueue.getAll()` — sortiert nach priority desc (Kopie)
  - `orderQueue.remove(id)` — entfernt anhand id
  - `orderQueue.setPriority(id, priority)` — ändert und sortiert neu
  - `orderQueue.toggleRepeat(id)` — schaltet repeat-Flag um
  - `orderQueue.peek()` — gibt vordersten Eintrag zurück (null wenn leer)
  - `orderQueue.complete(id)` — dispatcht via dynamischem GolemManager-Import, repeat-Logik: neue id, hinten wieder einreihen
- [x] `src/golems/GolemManager.ts`:
  - `OrderType` import ergänzt
  - `dispatchOrder(orderType, target, order)` neu — wird von OrderQueue.complete() (dynamisch) aufgerufen, mapped resourceId → GolemClass für HARVEST, direkt für andere Typen
- [x] `src/golems/GolemFactory.ts` — GolemClass um `'scribe'` ergänzt
- [x] `src/golems/ScribeGolem.ts` (neu) — Singleton `scribeGolem`:
  - `writeProgress` fraktional akkumuliert: `scribePool.count * 0.05 * worldManaFactor() * delta`
  - Kein Papier → writeProgress eingefroren
  - Queue leer → idle
  - `writeProgress >= 1.0`: 1 Papier verbrauchen, `orderQueue.complete(peek().id)`, `writeProgress -= 1.0`
  - `getWriteProgress()` für UI-Fortschrittsbalken
  - `ticker.register()` im Konstruktor
- [x] `src/main.ts` — `import './golems/ScribeGolem.js'` ergänzt (Singleton-Init)
- [x] `npx tsc --noEmit` — 0 Fehler

Schnittstellen-Änderungen: ja:
- `OrderType` erweitert (rückwärtskompatibel — 'HARVEST' bleibt)
- `OrderRequest`-Interface neu (zusätzlich zu `Order`)
- `orderQueue` Singleton mit vollem Interface neu
- `createOrderRequest()` Fabrik-Funktion neu
- `GolemClass` um `'scribe'` erweitert
- `golemManager.dispatchOrder(orderType, target, order)` neu

Nächster Agent braucht:
- `ui-dev`: OrderQueue-UI — `orderQueue.getAll()`, `enqueue(createOrderRequest(...))`, `remove(id)`, `setPriority(id, p)`, `toggleRepeat(id)`, Fortschrittsbalken via `scribeGolem.getWriteProgress()`
  - Importiere `orderQueue` aus `src/golems/OrderSystem.ts`
  - Importiere `createOrderRequest` aus `src/golems/OrderSystem.ts`
  - Importiere `scribeGolem` aus `src/golems/ScribeGolem.ts`
- `golem-dev`: Scribe-Pool via `golemManager.addToPool('scribe', '', count)` befüllen (z.B. in main.ts oder GolemView)
- `qa`: Teste repeat-Auftrag (paper-maker → paper WRITE-Auftrag mit repeat=true) + Scribe-Pool mit 1 Scribe: writeProgress steigt, nach ~20s (bei 0 paper) eingefroren; sobald paper vorhanden → Auftrag wird abgeschlossen und repeat eingereiht

## DONE: StartGolems 1 pro Ressource (Aufgabe H)
_Abgeschlossen: 2026-03-31 — golem-dev_

- [x] `src/main.ts` — Startvorgabe auf 3 Pools à count=1 geändert: earth-gatherer→earth, water-gatherer→water, wood-gatherer→wood
- [x] Kein earth-gatherer×5 mehr
- [x] `npx tsc --noEmit` — 0 Fehler

---

## DONE: Balance — Produktionsraten /10 (Aufgabe I)
_Abgeschlossen: 2026-03-31 — resource-dev_

- [x] `src/resources/ResourceManager.ts` — `PRODUCTION_SCALE = 0.1` eingeführt, in Produktionsformel multipliziert → ~0.14/s bei 1 earth-gatherer
- [x] `src/resources/WorldMana.ts` — `DRAIN_PER_PRODUCER_RATE` von 4 auf 0.4 reduziert (Verhältnis bleibt proportional)
- [x] `npx tsc --noEmit` — 0 Fehler

---

## In Arbeit
_(noch nichts)_

## Als nächstes

### v0.2 — noch offen (8 Pakete)

**Aufgaben-Paket D: OrderQueue-UI**

```
AUFGABE: OrderQueue-UI — Spieler-Kontrolle der Queue
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md §2.2 §8, STATUS.md,
      src/golems/OrderSystem.ts,
      src/golems/ScribeGolem.ts,
      src/ui/GolemView.ts,
      index.html

SCHREIBT IN: src/ui/ (neue Datei OrderQueueView.ts oder in GolemView.ts integrieren), index.html

ZIEL:
  - Queue-Panel: zeigt orderQueue.getAll() — Priorität, Typ, Ziel, repeat-Flag
  - Aktionen pro Eintrag: entfernen (remove), Priorität hoch/runter (setPriority), repeat an/aus (toggleRepeat)
  - "Neuer Auftrag"-Button: Spieler fügt via createOrderRequest() einen Eintrag ein (mind. HARVEST earth/water/wood)
  - Fortschrittsbalken für laufenden Eintrag: scribeGolem.getWriteProgress()
  - Aktualisiert sich per ticker.register()
  - Scribe-Pool-Anzeige: zeigt 'scribe'-Pool-Count + "kein Scribe → Queue läuft nicht"-Hinweis

INTERFACES:
  import { orderQueue, createOrderRequest } from '../golems/OrderSystem.js'
  import { scribeGolem } from '../golems/ScribeGolem.js'

ABNAHME:
  - Spieler kann repeat-Auftrag für HARVEST earth einreihen
  - Fortschrittsbalken zeigt scribeGolem.getWriteProgress()
  - Nach Auftrag-Abschluss: Queue-Eintrag wird bei repeat=true wieder angezeigt
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket E: Erste Forschung (v0.2)**

```
AUFGABE: Erste Forschung — manuelle Aktion → Scribe-Automatisierung
SPEZIALIST: research-dev
LIES: INCREMAGIC_MASTER.md §2.5 §3 §6.1, STATUS.md,
      src/core/GameState.ts,
      src/core/EventBus.ts,
      src/golems/OrderSystem.ts,
      src/golems/ScribeGolem.ts

SCHREIBT IN: src/research/ResearchTree.ts (neu), src/research/RuneSystem.ts (Stub)

ZIEL:
  - ResearchNode-Interface: { id, name, cost: ResourceMap, unlocks: string[], completed, requiredManualCount, currentManualCount }
  - 1 Forschungsknoten für v0.2: "Automatisches Schreiben"
    - Bedingung: Spieler hat 10× manuell Aufträge eingereiht (MANUAL_ACTION Event)
    - Kosten: 5 Papier
    - Freischaltet: Scribe-Automatisierung (ScribeGolem.setEnabled(true))
  - ResearchTree Singleton: getAll(), complete(id), getProgress(id)
  - EventBus MANUAL_ACTION zählen → currentManualCount erhöhen
  - RuneSystem.ts: Stub (leer, Interface vorbereitet)
  - RESEARCH_UNLOCKED Event feuern wenn abgeschlossen

ABNAHME:
  - Nach 10× manuellem Einreihen + 5 Papier: Forschung abschließbar
  - RESEARCH_UNLOCKED wird in Konsole geloggt
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket F: UI-Cleanup (Feedback)**

```
AUFGABE: UI-Cleanup — Ritual-Panel entfernen, Tick-Anzeige fixen
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md §8, STATUS.md,
      src/ui/GolemView.ts,
      index.html

SCHREIBT IN: src/ui/GolemView.ts, index.html

ZIEL:
  - Ritual-Panel (4-Elemente-Sequenz) komplett entfernen aus GolemView — Golem-Erschaffung läuft
    jetzt ausschließlich über den "Hauch des Lebens"-Pfad (fired-golem → Pool)
  - Debug-Tick-Anzeige (rechts unten) entfernen oder als togglebares Overlay hinter einem Key verstecken,
    damit sie nicht den unteren UI-Bereich verdeckt
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen — reine UI-Änderung

ABNAHME:
  - Ritual-Panel nicht mehr sichtbar
  - Unterer UI-Bereich vollständig lesbar
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket G: ResourceCircleView — konzentrisch + kleiner (Feedback)**

```
AUFGABE: ResourceCircleView — Kreise konzentrisch und kompakter
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md §6.4 §8, STATUS.md,
      src/ui/ResourceCircleView.ts,
      index.html

SCHREIBT IN: src/ui/ResourceCircleView.ts

ZIEL:
  - Alle Ressourcen-Kreise sind konzentrisch (gemeinsamer Mittelpunkt, z.B. Canvas-Mitte)
  - Maximaler Radius deutlich reduziert — Kreise nehmen maximal ~30% der Canvas-Breite ein
  - Kreise bleiben unterscheidbar (Farbe + evtl. Ring-Stil statt gefülltem Kreis)
  - Bestehende LERP-Animation und MANA_LOW-Puls bleiben erhalten
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen

ABNAHME:
  - Kreise überlagern nicht den Spieler-UI-Bereich
  - Visuell erkennbar: je mehr Ressource, desto größerer Kreis
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket H: StartGolems — 1 Golem pro Ressource (Feedback)**

```
AUFGABE: StartGolems auf 1 pro Ressource-Klasse setzen
SPEZIALIST: golem-dev
LIES: INCREMAGIC_MASTER.md §2.1, STATUS.md,
      src/main.ts,
      src/golems/GolemManager.ts,
      src/golems/OrderSystem.ts

SCHREIBT IN: src/main.ts

ZIEL:
  - Startvorgabe ändern: statt 5 earth-gatherer → je 1 Golem für jede Harvest-Klasse:
    earth-gatherer (earth), water-gatherer (water), wood-gatherer (wood)
  - Jeder Pool bekommt sofort via assignPool() den passenden HARVEST-Auftrag (repeat=false, priority=5)
  - Kein Scribe-Pool beim Start (bleibt manuell)
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen

ABNAHME:
  - Beim Start: 3 Pools à 1 Golem, alle mit aktivem HARVEST-Auftrag
  - HUD zeigt alle 3 Ressourcen mit steigenden Werten
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket I: Balance — Produktionsraten /10 (Feedback)**

```
AUFGABE: Produktionsraten durch 10 teilen
SPEZIALIST: resource-dev
LIES: INCREMAGIC_MASTER.md §6.4, STATUS.md,
      src/resources/ResourceManager.ts,
      src/resources/WorldMana.ts

SCHREIBT IN: src/resources/ResourceManager.ts

ZIEL:
  - Produktionsformel-Konstante (oder writeSpeed, harvestBatch) so anpassen, dass die
    sichtbare Ressourcen-Rate im HUD etwa 1/10 des bisherigen Wertes beträgt
  - Einfachste Lösung: `BASE_PRODUCTION_FACTOR = 0.1` (oder äquivalente Konstante) einführen
    und in die Produktionsformel multiplizieren
  - WorldMana-Drain und Regen-Rate entsprechend skalieren (Drain /10, Regen /10) damit
    das Gleichgewicht erhalten bleibt
  - npx tsc --noEmit: 0 Fehler

INTERFACES: keine neuen — reine Konstanten-Änderung

ABNAHME:
  - HUD zeigt z.B. "+0.14/s" statt "+1.4/s" für earth
  - WorldMana sinkt weiterhin spürbar bei aktiven Golems (aber langsamer)
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket J: SaveManager — Cookies / LocalStorage (Feedback)**

```
AUFGABE: SaveManager mit LocalStorage-Speicherung
SPEZIALIST: core-dev
LIES: INCREMAGIC_MASTER.md §6.1 §7, STATUS.md,
      src/core/GameState.ts,
      src/core/Ticker.ts

SCHREIBT IN: src/saves/SaveManager.ts (neu), src/main.ts

ZIEL:
  - SaveManager Singleton implementieren: save(), load(), hasSave(), clearSave()
  - Nutzt localStorage (kein echter Cookie-Header nötig — localStorage ist im Browser persistent)
  - Speichert GameState.serialize() unter Key 'incremagic_save'
  - Autosave: alle 30 Sekunden via ticker.register() (oder setInterval)
  - Beim Start: load() → falls Daten vorhanden, GameState.deserialize() aufrufen
  - save/load nutzt das SaveData-Interface aus MASTER §7
  - Manuelle Buttons (Speichern/Laden/Zurücksetzen) können in main.ts oder index.html ergänzt werden
  - npx tsc --noEmit: 0 Fehler

INTERFACES:
  saveManager.save(): void
  saveManager.load(): SaveData | null
  saveManager.hasSave(): boolean
  saveManager.clearSave(): void

ABNAHME:
  - Seite neu laden → GameState wiederhergestellt, Ressourcen-Werte korrekt
  - Autosave alle 30s (Konsolen-Log "Gespeichert")
  - npx tsc --noEmit: 0 Fehler
```

---

**Aufgaben-Paket K: Forschungs-UI — Panel mit Öffnen/Schließen (Feedback)**

```
AUFGABE: Forschungs-UI — Modal-Panel mit Toggle-Button
SPEZIALIST: ui-dev
LIES: INCREMAGIC_MASTER.md §3 §8, STATUS.md,
      src/research/ResearchTree.ts (nach Aufgabe E),
      index.html

SCHREIBT IN: src/ui/ResearchView.ts (neu), index.html

ZIEL:
  - Toggle-Button (z.B. "📜 Forschung") am oberen Rand — öffnet/schließt das Panel
  - Panel zeigt alle ResearchNode aus researchTree.getAll():
    - Name, Kosten, Fortschritt (currentManualCount / requiredManualCount)
    - "Erforschen"-Button (disabled wenn Bedingungen nicht erfüllt)
    - Abgeschlossene Nodes ausgegraut mit ✓
  - Panel schließt sich per Klick auf Button oder ESC
  - Erdton-Ästhetik nach MASTER §8 (Pergament-Optik)
  - npx tsc --noEmit: 0 Fehler
  HINWEIS: Aufgabe E (ResearchTree) muss zuerst abgeschlossen sein.

INTERFACES:
  import { researchTree } from '../research/ResearchTree.js'

ABNAHME:
  - Button öffnet/schließt Panel korrekt
  - Forschungsknoten sichtbar mit Fortschritt
  - npx tsc --noEmit: 0 Fehler
```

## Bekannte Probleme
_(keine offenen Blocker)_

## Offene Architektur-Entscheidungen
- Qualitätsstufen der Golems numerisch (v0.2)
- Papier-Produktionsrate (Playtesting)

---

## DONE-Format (für Agenten)

```
## DONE: [Aufgabe]
- [x] Ziel 1
- [x] Ziel 2
- [~] Ziel 3 — anders gelöst: [kurze Erklärung]
- [ ] Ziel 4 — noch nicht: [kurze Erklärung]

Schnittstellen-Änderungen: [ja/nein — wenn ja, was?]
Nächster Agent braucht: [was muss der nächste wissen?]
```
