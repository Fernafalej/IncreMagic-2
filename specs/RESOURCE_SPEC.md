# RESOURCE_SPEC — ResourceManager & WorldMana
> Detail-Dokument für `resource-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Ressourcen (vollständig, v0.1)

### Frühspiel
| ID | Symbol | Typ | Primzahl |
|---|---|---|---|
| `earth` | 🟤 | raw | — (manuell) |
| `water` | 💧 | raw | — (manuell) |
| `wood` | 🪵 | raw | — (manuell) |
| `fire` | 🔥 | processed | — (aus wood) |
| `clay` | 🧱 | crafted | — (earth+water) |
| `raw-golem` | 🗿 | crafted | — (clay) |
| `fired-golem` | 🔶 | crafted | — (raw-golem+fire) |
| `paper` | 📄 | crafted | — (wood+water) |

### Mittelspiel
| ID | Symbol | respawnRatePerArea | Primzahl |
|---|---|---|---|
| `stone` | ⛏ | √7 ≈ 2.645 | 7 |
| `mana` | ✦ | √11 ≈ 3.316 | 11 |

---

## 2. Produktions-Formel (distanzbasiert)

```
// Golem-Geschwindigkeit:
golemSpeed = baseSpeed * worldManaFactor()

// Erntezeit = Hin- und Rückweg:
harvestTime(r) = 2 * distance(r) / golemSpeed

// Produktionsrate:
production(r) = golemPool(r).count * harvestBatch(r) / harvestTime(r)

// Ressource wächst nach:
respawn(r) = respawnRatePerArea(r) * π * distance(r)²

// Gleichgewicht: harvest == respawn → distance stabilisiert sich
// Δdistance pro Tick: wächst wenn harvest > respawn, schrumpft sonst

// respawnRatePerArea (Primzahl-Wurzeln):
earth  → √2  ≈ 1.414
water  → √3  ≈ 1.732
wood   → √5  ≈ 2.236
stone  → √7  ≈ 2.645
mana   → √11 ≈ 3.316
```

**Visualisierung:** Kreis-Radius wächst mit `√(distance(r))` → ResourceCircleView

---

## 3. WorldMana (versteckt)

```typescript
class WorldMana {
    private current: number;      // NIEMALS direkt anzeigen
    private capacity: number;
    readonly threshold_slow = 0.5;   // unter 50% → Golems langsamer
    readonly threshold_taint = 0.2;  // unter 20% → Taint steigt

    getSpeedFactor(): number {
        return clamp(this.current / (this.capacity * this.threshold_slow), 0.1, 1.0);
    }
    drain(amount: number): void { ... }
    regenerate(delta: number): void { ... }  // wächst nach, langsamer als Verbrauch
    getTaintDelta(): number { ... }          // positiv wenn unter threshold_taint
}
```

**Regel:** WorldMana ist nie direkt sichtbar. Spieler merkt es an Golem-Geschwindigkeit.

---

## 4. Blackbox-Interface (für andere Module)

**ResourceManager gibt nach außen:**
- `getAmount(resourceId): number`
- `getProductionRate(resourceId): number`
- `consume(resourceId, amount): boolean` → false wenn nicht genug
- `produce(resourceId, amount): void`

**WorldMana gibt nach außen:**
- `getSpeedFactor(): number` (0.1–1.0)
- `getTaintDelta(): number`

**ResourceManager braucht von außen:**
- `GolemManager.getTotalProductionRate(resourceId): number`
- `WorldMana.getSpeedFactor()`
- `EventBus.emit()` bei MANA_LOW, TAINT_RISING

---

*Version: 0.1.0*
