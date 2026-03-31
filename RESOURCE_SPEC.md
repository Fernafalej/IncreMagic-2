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
| `fire` | 🔥 | fire-tender Golem |
| `clay` | 🧱 | clay-mixer Golem |
| `fired-golem` | 🔶 | golem-baker Golem |
| `paper` | 📄 | paper-maker Golem |
| `idle-golem` | 🗿 | Scribe-Gebäude (ohne Auftrag) |
| `ink` | 🖋 | Spätspiel, Scribe-Verbrauch |

### Mittelspiel
| ID | Symbol | respawnRatePerArea |
|---|---|---|
| `stone` | ⛏ | √7 ≈ 2.645 |
| `mana` | ✦ | √11 ≈ 3.316 |

---

## 2. Produktions-Formel

```
// Ernte-Golems:
respawnRatePerArea: earth→√2, water→√3, wood→√5, stone→√7, mana→√11

// Alle Entitäten verbrauchen WorldMana:
worldManaConsumption = entityCount * consumptionRate * delta
```

---

## 3. WorldMana

**Nie direkt anzeigen.** Spieler merkt es an Verlangsamung.

### WorldManaFactor (beeinflusst alle Entitäten)

```
// Früh: Sigmoid — Einbruch kommt überraschend
sigmoidFactor(x) = 1 / (1 + e^(-k * (x - threshold_slow)))

// Nach WorldMana-Forschung: wird linearer
// Nach Taint-Forschung: vollständig linear + bewusst steuerbar
linearFactor(x) = clamp(x / capacity, 0.1, 1.0)

// Übergang sigmoid→linear durch Forschung gesteuert (blend-Parameter 0.0→1.0)
worldManaFactor = lerp(sigmoidFactor, linearFactor, researchBlend)
```

### Verbrauch
```
// Jede Entität verbraucht WorldMana pro Tick:
Ernte-Golem:       pool.count * distanzFaktor * delta
Produktions-Golem: pool.count * aktivitätsFaktor * delta
Scribe-Gebäude:    scribeCount * outputRate * delta
Gebäude (später):  gebäudeGröße * delta

// Regeneration: langsamer als Verbrauch bei aktivem Betrieb
regeneration = regenRate * delta
```

### Schwellenwerte
```
threshold_slow  = 0.5 * capacity  // unter 50% → Sigmoid-Knick sichtbar
threshold_taint = 0.2 * capacity  // unter 20% → Taint steigt
```

---

## 4. Blackbox-Interface

**ResourceManager gibt nach außen:**
- `getAmount(resourceId): number`
- `getProductionRate(resourceId): number`
- `consume(resourceId, amount): boolean`
- `produce(resourceId, amount): void`

**WorldMana gibt nach außen:**
- `getSpeedFactor(): number` (0.1–1.0, sigmoid oder linear je Forschungsstand)
- `getTaintDelta(): number`
- `consume(amount): void`

---

*Version: 0.2.0*
