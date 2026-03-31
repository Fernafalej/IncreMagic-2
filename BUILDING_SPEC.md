# BUILDING_SPEC — Gebäude-System
> Detail-Dokument für `building-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Scribe-Gebäude

Das erste und wichtigste Gebäude. Automatisiert Golem-Produktion.

**Input pro Sekunde:**
- `fired-golem` × rate
- `paper` × rate
- `ink` × rate *(Spätspiel, nach Forschung)*

**Output pro Sekunde:**
- Jede bekannte Golem-Klasse gemäß Anteil-Einstellung
- Nicht zugewiesene Golems → `idle-golem` Ressource

**Skalierung:**
- Mehr Scribes = höhere Gesamtrate
- WorldMana-Faktor verlangsamt Scribes wie alle anderen Entitäten

---

## 2. Anteil-System (Spieler-UI)

Spieler gibt absolute Anteile ein — keine Prozente:

```
earth-gatherer  [10]
water-gatherer  [ 3]
clay-mixer      [ 2]
scribe          [ 1]
─────────────────────
Gesamt: 16 Anteile

→ earth-gatherer: 10/16 × ScribeRate/s
→ water-gatherer:  3/16 × ScribeRate/s
→ clay-mixer:      2/16 × ScribeRate/s
→ scribe:          1/16 × ScribeRate/s
```

**Regeln:**
- Neue Golem-Art erforscht → taucht automatisch in der Liste auf (Standard: 0)
- Anteil 0 = diese Klasse wird nicht produziert
- Durch Primzahl-Wurzel-Produktionsraten gibt es kein perfektes Verhältnis

---

## 3. Gebäude allgemein

**Nur magische Wesen als Baumaterial** — keine normalen Gebäude.

| Stufe | Baumaterial | Verfügbarkeit |
|---|---|---|
| Basis | Lehm / Stein | Frühspiel |
| Mittel | Golems (eingemauert) | Nach Forschung |
| Hoch | Chimären, Dschinn | Spätspiel, TBD |

**Eingebaute Golems:**
- Permanent geopfert — kein Rückgängig
- Aus Pool entfernt, werden Teil des Gebäudes
- Höhere Golem-Qualität → besseres Gebäude
- Narrativ: eingemauert für die Ewigkeit

Alle Gebäude:
- Verbrauchen WorldMana (skaliert mit Größe/Aktivität)
- Werden durch Forschung freigeschaltet

---

## 4. Blackbox-Interface

**ScribeBuilding gibt nach außen:**
- `getOutputRate(golemClass): number`
- `setShare(golemClass, amount): void`
- `getShares(): Map<GolemClass, number>`
- `getScribeCount(): number`

**ScribeBuilding braucht von außen:**
- `ResourceManager.consume(resourceId, amount): boolean`
- `GolemManager.assignToPool(class, count): void`
- `WorldMana.getSpeedFactor(): number`
- `WorldMana.consume(amount): void`
- `ResearchTree.getUnlockedGolemClasses(): GolemClass[]`

---

*Version: 0.1.0*
