# UI_SPEC — Views, HUD, Ästhetik
> Detail-Dokument für `ui-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Ästhetik

- **Farben:** Erdtöne (Ocker `#C8A96E`, Lehm `#A0785A`, Dunkelbraun `#3D2B1F`) + Runen-Glühen (Türkis `#4ECDC4`, Amber `#FFB347`)
- **Fonts:** Handgeschrieben-artig für Lore (z.B. Cinzel, IM Fell English), klar für Zahlen (z.B. JetBrains Mono)
- **Keine harten Warnungen** — alles subtil, Spieler soll selbst merken
- **Taint:** Visuelle Korruption (schwarze Partikel, verzerrte Symbole) — erst spät

---

## 2. ResourceCircleView

- Canvas oder SVG (ui-dev entscheidet)
- Pro Ressource ein Kreis
- Radius wächst mit `√(distance(r))` — spiegelt Erntefläche wider
- Kreise sind leicht transparent (`opacity: 0.4–0.6`), Überlappung erlaubt
- Farbe je Ressource (Erdton-Palette)
- Wachstum fließend animiert — kein Springen
- Bei `worldManaFactor < 0.5`: Kreise pulsieren leicht (subtil!)

---

## 3. HUD

- Ressourcen-Werte + Rate: `Stein: 42.3 (+1.41/s)`
- Golem-Pool-Counts: `Erdsammler: 2.7 (+0.1/s)`
- Kein Weltmana-Wert anzeigen — nur indirekte Hinweise
- Zahlen immer mit 1–2 Dezimalstellen

---

## 4. Journal (Grundgerüst)

- Sepia-Pergament-Optik
- Neue Einträge blenden ein (fade-in)
- Lore-Text in handgeschriebener Schrift
- Zahlen/Formeln in klarer Schrift

---

## 5. Blackbox-Interface (für andere Module)

**UI braucht von außen:**
- `GameState` (read-only, für alle Werte)
- `EventBus.on()` für reaktive Updates (MANA_LOW, TAINT_RISING, etc.)
- `Ticker.onTick()` für render-Updates

**UI gibt nach außen:**
- User-Actions via `EventBus.emit({ type: 'MANUAL_ACTION', ... })`

---

*Version: 0.1.0*
