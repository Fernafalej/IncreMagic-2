# RESOURCE_SPEC — ResourceManager & WorldMana
> Detail-Dokument für `resource-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Ressourcen

### Frühspiel
| ID | Symbol | Herkunft |
|---|---|---|
| `earth` | 🟤 | Ernte-Golem |
| `water` | 💧 | Ernte-Golem |
| `wood` | 🪵 | Ernte-Golem |
| `reed` | 🌿 | Ernte-Golem (am Wasser) |
| `clay` | 🧱 | clay-mixer Golem (earth+water) |
| `paper` | 📄 | paper-maker Golem (reed+water früh, wood+water später) |
| `fired-golem` | 🔶 | golem-baker (Temperatur-abhängig → TEMPERATURE_SPEC.md) |
| `breath-of-life` | 💨 | Spieler-Klick / Membran / Pulmo Vitarum → BREATH_SPEC.md |
| `membrane` | 🔮 | Crafting: Papier-Stapel + Spieler-Magie |
| `idle-golem` | 🗿 | Scribe-Gebäude (ohne Auftrag) |

### Mittelspiel
| ID | Symbol | Herkunft |
|---|---|---|
| `stone` | ⛏ | Ernte-Golem |
| `mana` | ✦ | Ernte-Golem |
| `ink` | 🖋 | Spätspiel, Scribe-Verbrauch |

### Spätspiel
| ID | Symbol | Herkunft |
|---|---|---|
| `knowledge` | 📚 | Forschung |
| `souls` | 👻 | Nekromantie |
| `taint` | 🌑 | WorldMana-Erschöpfung |

---

## 2. Papier-Produktionskette

```
FRÜHSPIEL:
reed + water → paper   (manuell / paper-maker Golem)

NACH FORSCHUNG "Papyrus-Presse":
Papyrus-Presse (Gebäude) → automatisiert reed+water → paper

SPÄTER (Forschung "Holzpapier"):
wood + water → paper   (effizientere Methode, größere Mengen)
```

`reed` wächst am Wasser nach — `reed_density` im Erntegebiet abhängig von
`water_density` (Details → AREA_SPEC.md §7 GROWTH_RATES).

---

## 3. Flüchtigkeit & Lagerung

Bestimmte Ressourcen verflüchtigen sich wenn sie nicht gelagert werden.
Der Spieler entdeckt dies organisch — erst durch `breath-of-life`, dann durch `water`.

### Flüchtige Ressourcen
| Ressource | Verflüchtigung | Lager |
|---|---|---|
| `breath-of-life` | schnell ohne Krug | Krug (→ langsam) |
| `water` | langsam ohne Krug | Krug |
| (später weitere) | TBD | TBD |

### Flüchtigkeitsformel (überlinear)
```
// Ohne Lager:
loss_per_second = BASE_LOSS + OVERFLOW_FACTOR × max(0, amount - soft_cap)²

// Mit Krug (unter Kapazität):
loss_per_second = STORED_LOSS_RATE   // sehr klein, fast null

// Mit Krug (über Kapazität):
overflow = amount - krug_capacity
loss_per_second = STORED_LOSS_RATE + OVERFLOW_FACTOR × overflow²
```

**Spielgefühl:** Spieler merkt dass water nie richtig ansteigt → baut Krug →
plötzlicher Boost → zu viele Wassergolems → Rebalancing-Moment.
Das schaltet Forschung für weitere Lagerarten frei.

### Krüge
- Universelles Lager für flüchtige Ressourcen (water, breath-of-life, später Öl etc.)
- Kapazität pro Krug: `KRU_CAPACITY` (Balance ausstehend)
- Mehrere Krüge stapeln ihre Kapazität
- Herstellung: earth + fire (Töpfern) → Krug

---

## 4. Produktions-Formel

```
yield_per_second = pool.count × resource_density × worldManaFactor × qualityFactor
```

Ressourcen-Wachstum logistisch (Details → AREA_SPEC.md §4):
```
growth = growth_rate × density × (1 - density / MAX_DENSITY)
```

Primzahl-Wurzeln für respawnRatePerArea:
```
earth  → √2  ≈ 1.414
water  → √3  ≈ 1.732
wood   → √5  ≈ 2.236
reed   → √7  ≈ 2.645   (wächst schneller als Holz)
stone  → √11 ≈ 3.316
mana   → √13 ≈ 3.605
```

---

## 5. WorldMana

**Nie direkt anzeigen.** Spieler merkt es an Verlangsamung.

```typescript
// Regeneration logistisch:
mana_regen = BASE_REGEN × worldMana × (1 - worldMana / capacity)

// Schwellenwerte:
threshold_slow  = 0.5 × capacity   // Sigmoid-Knick sichtbar
threshold_taint = 0.2 × capacity   // Taint steigt
```

Übergang Sigmoid → Linear durch Forschung (blend-Parameter 0.0 → 1.0).

---

## 6. Offene Fragen

- [ ] Feuer/Temperatur: Nachheizen als Aktivmechanik oder passiv? → TEMPERATURE_SPEC.md
- [ ] Krug-Kapazität und Verlustrate: Balance ausstehend
- [ ] reed: eigener Ernte-Golem oder Teil des water-gatherer-Gebiets?

---

## 7. Blackbox-Interface

**ResourceManager gibt nach außen:**
- `getAmount(resourceId): number`
- `getProductionRate(resourceId): number`
- `consume(resourceId, amount): boolean`
- `produce(resourceId, amount): void`
- `getStorageCapacity(resourceId): number`
- `getLossRate(resourceId): number`

**WorldMana gibt nach außen:**
- `getSpeedFactor(): number` (0.1–1.0)
- `getTaintDelta(): number`
- `consume(amount): void`
- `setBlend(0.0–1.0): void`

---

*Version: 0.3.0 | Zuletzt aktualisiert: 2026-03-31*
