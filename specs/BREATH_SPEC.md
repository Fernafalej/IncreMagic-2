# BREATH_SPEC — Atem des Lebens & Golem-Belebung
> Detail-Dokument für `resource-dev` + `golem-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Kernidee

Der Magier haucht selbst Leben in seine Golems — anfangs buchstäblich.
Mit der Zeit wird das zu wenig. Er lernt seinen Atem durch Magie zu ersetzen,
dann zu automatisieren. Aber die Quelle des Atems hängt an der Welt selbst:
je mehr Pflanzen im Erntegebiet, desto mehr Lebensatem in der Luft.

---

## 2. Produktionskette (vollständig)

```
STUFE 1 — Spieler atmet manuell:
  Klick-Feld "Atmen" → breath-of-life (+1)
  Kein Ressourcen-Overhead, direkt
  Wird ausgeblendet sobald Membran-Automatisierung aktiv

STUFE 2 — Membran:
  Herstellung:  Papier-Stapel (viel) + Spieler-Magie → Membran
                ~20-30% des Papiers nimmt Magie an, Rest zerfällt
                Membran ist verbrauchbar
  Verwendung:   Golem benutzt Membran im Erntegebiet
                → breath-of-life (effizienter als Klicken, ~1/3 bis 1/5 Aufwand)
                → Membran wird dabei verbraucht
  Bedingung:    wood_density im Holzsammler-Radius bestimmt Ausbeute
                (ambient_breath aus AREA_SPEC.md §6)

STUFE 3 — Lagerung:
  breath-of-life → in Krug füllen
  Ohne Krug: verflüchtigt sich schnell (überlinear bei Überfüllung)
  Mit Krug: langsame Verlustrate, praktisch nutzbar

STUFE 4 — CPR-Golem:
  CPR-Golem nimmt breath-of-life aus Krug
  → animiert fired-golem → neuer Golem im Pool
  Ersetzt den manuellen "Hauch des Lebens"-Button

STUFE ~20 — Pulmo Vitarum (Gebäude):
  Ersetzt nur die Membran
  Voraussetzung: Membranen durch Forschung so weit optimiert dass
                 das Gebäude sie dauerhaft und massenhaft nutzen kann
  Automatisiert: ambient_breath → breath-of-life ohne Membran-Verbrauch
```

---

## 3. Membran

### Herstellung
```
INPUT:  paper × MEMBRANE_PAPER_COST   (viel — schlechte Ausbeute bewusst)
INPUT:  Spieler-Magie (Klick, kein Ressourcen-Wert)
OUTPUT: membrane × 1
ABFALL: paper × (MEMBRANE_PAPER_COST × (1 - SUCCESS_RATE)) zerfällt
```

Konstanten:
```
MEMBRANE_PAPER_COST = 20–50   (Balance ausstehend)
SUCCESS_RATE        = 0.2–0.3 (20-30% des Papiers wird zur Membran)
```

### Spätere Forschung
- "Magisches Schilf": bestimmtes Schilf hat höhere magische Empfänglichkeit
  → bessere Ausbeute bei Membran-Herstellung
- Weitere Membran-Qualitätsstufen → höhere Effizienz, längere Lebensdauer

### Verwendung durch Golem
```
// Pro Atemzug:
breath_gained = ambient_breath × MEMBRANE_EFFICIENCY
membrane.durability -= 1
wenn membrane.durability <= 0 → Membran verbraucht, neue nötig
```

---

## 4. CPR-Golem

| Eigenschaft | Wert |
|---|---|
| Klasse | `cpr-golem` |
| OrderType | `ANIMATE` |
| Input | `breath-of-life` (aus Krug) + `fired-golem` |
| Output | neuer Golem im Pool |
| WorldMana-Verbrauch | mittel |

Der CPR-Golem ersetzt den manuellen "Hauch des Lebens"-Button vollständig.
Button wird ausgeblendet sobald mindestens 1 CPR-Golem aktiv.

---

## 5. Pulmo Vitarum

- **Typ:** Gebäude (nicht Golem)
- **Freischaltung:** Forschungsbaum, Stufe ~20 — spät
- **Funktion:** Ersetzt Membran-Golems. Destilliert ambient_breath direkt
  zu breath-of-life ohne Membran-Verbrauch.
- **Voraussetzung:** Membran-Forschung weit genug fortgeschritten
- Membran-Golem-Klasse bleibt erhalten — Pulmo ist eine Aufwertung, kein Ersatz

---

## 6. Offene Fragen

- [ ] Wie heißt der Golem der Membranen benutzt? (Lateinisch?)
- [ ] Membran-Durability: feste Anzahl Atemzüge oder zeitbasiert?
- [ ] CPR-Golem: animiert er nur earth-gatherer oder alle Golem-Klassen?

---

## 7. Abhängigkeiten

```
BreathSystem liest:   HarvestArea (wood_pool.resource_density → ambient_breath)
BreathSystem liest:   ResourceManager (paper, membrane, fired-golem, breath-of-life)
BreathSystem liest:   StorageSystem (Krug-Kapazität)
BreathSystem schreibt: ResourceManager (breath-of-life produzieren/verbrauchen)
BreathSystem schreibt: GolemManager (neuer Golem nach Animation)
```
