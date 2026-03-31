AUFGABE: UI: ResourceCircleView - Kreise skalieren, Position rechts unten, Legende togglebar
SPEZIALIST: ui-dev
LIES: src/ui/ResourceCircleView.ts, index.html, src/main.ts, STATUS.md, INCREMAGIC_MASTER.md
SCHREIBT IN: src/ui/ResourceCircleView.ts, index.html (CSS), ggf. src/ui/GolemView.ts
ZIEL: 
- ResourceCircle-Kreisdarstellung ist maßstabsgetreu und nicht überlappend
- Kreis-Visualisierung verschoben in den unteren rechten Bereich (neben Legende)
- Legende/Toggle-Panel rechts unten (nicht mehr links unten)
- Beschriftung zeigt klare Einheit / Verhältnis (z.B. 1px = X Distanzanteile)
INTERFACES: 
- Input: resourceManager.getProducerRate(id), worldMana.getWorldManaFactor()
- Output: Canvas-Zeichenbefehle, DOM-Positionierung
ABNAHME:
- UI zeigt 3 Kreise äquidistant oder übersichtlich gestaffelt
- Panel erscheint rechts unten und ist Toggle-fähig
- Skalensystem ist dokumentiert im Kommentarbereich in ResourceCircleView
- responsive Größe bei Fensteränderung
OFFEN: 
- endgültiges Distanzmodell (linear / sqrt / exponentiell) nach Review
- optional: zusätzliche helper-Funktion in ResourceManager

---
DOKUMENTATION:
- Kommentar und Parameter in ResourceCircleView.ts aktualisieren
- README/CHANGELOG notieren mit 'UI: ResourceCircleView repositioned; legend moved'
- STATUS.md erledigt im 'v0.2 — Noch offen' Abschnitt und bei Abschluss in 'Fertig'

QA-Kriterien:
1. Dreadnought-Bildschirm 1920x1080 funktioniert
2. Mobile View (kleiner 760px) mindestens 640x480 mit nicht-blockierenden Kreisen
3. Legende ist direkt rechts unten und kann ein- / ausgeblendet werden
4. Veraltete "Skala: 1px ≈" Meldung ersetzt durch konkrete Einheit
