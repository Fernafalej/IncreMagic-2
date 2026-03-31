# INCREMAGIC — Projektstatus
_Zuletzt aktualisiert: 2026-03-31_
_Aktueller Meilenstein: v0.2 — Kern läuft_

---

## Fertig

- [x] Core Foundation — GameState, Ticker, EventBus, OfflineCalc (2026-03-30)
- [x] ResourceManager + WorldMana v0.1 (2026-03-30)
- [x] UI — ResourceCircleView + HUD v0.1 (2026-03-30)
- [x] CraftingManager + Frühspiel-Ressourcen, Aufgabe A (2026-03-30)
- [x] GolemSystem Pool-Redesign, Aufgabe B (2026-03-30)
- [x] UI-Umbau Aufgabe C — Sammel/Crafting/Pool-Anzeige (2026-03-30)
- [x] GolemView Panel-Refactoring (2026-03-31)
- [x] WorldMana aktivieren — Drain + Regen (2026-03-30)
- [x] ScribeGolem + OrderQueue (2026-03-30)
- [x] StartGolems 1 pro Ressource, Aufgabe H (2026-03-31)
- [x] Balance Produktionsraten /10, Aufgabe I (2026-03-31)
- [x] OrderQueue-UI, Aufgabe D (2026-03-31)

---

## v0.2 — Noch offen

- [x] **E** — ResearchTree + RuneSystem Stub (`src/research/ResearchTree.ts`, `RuneSystem.ts`) — research-dev
- [ ] **F** — UI-Cleanup: Ritual-Panel entfernen, Tick-Anzeige fixen (`src/ui/GolemView.ts`, `index.html`) — ui-dev
- [ ] **G** — ResourceCircleView konzentrisch + kompakter (`src/ui/ResourceCircleView.ts`) — ui-dev
- [ ] **J** — SaveManager localStorage (`src/saves/SaveManager.ts`, `src/main.ts`) — core-dev
- [ ] **K** — Forschungs-UI Panel (`src/ui/ResearchView.ts`, `index.html`) — ui-dev _(nach E)_
- [ ] **v0.2-1** — WorldMana Sigmoid-Kurve — resource-dev
- [ ] **v0.2-2** — Scribe-Gebäude + Anteil-System — building-dev
- [ ] **v0.2-3** — idle-golem Ressource — golem-dev
- [ ] **v0.2-4** — Anteil-UI — ui-dev

---

## Bekannte Probleme
_(keine offenen Blocker)_

## Offene Architektur-Entscheidungen
- Qualitätsstufen der Golems numerisch (v0.2)
- Papier-Produktionsrate (Playtesting)
