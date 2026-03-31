# GOLEM_SPEC — Golem-System
> Detail-Dokument für `golem-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Golem-Typen

Golems werden in **Pools** gruppiert — ein Pool pro Klasse mit Dezimalwert (`count: number`).

| Klasse | Typ | Tätigkeit | WorldMana-Verbrauch |
|---|---|---|---|
| `earth-gatherer` | Ernte | Erde sammeln | ja |
| `water-gatherer` | Ernte | Wasser schöpfen | ja |
| `wood-gatherer` | Ernte | Holz sammeln | ja |
| `fire-tender` | Produktion | wood→fire | ja |
| `clay-mixer` | Produktion | earth+water→clay | ja |
| `golem-baker` | Produktion | clay+fire→fired-golem | ja |
| `paper-maker` | Produktion | wood+water→paper | ja |
| `researcher` | Produktion | paper+knowledge→research | ja |
| `builder` | Produktion | Gebäude errichten (v0.2+) | ja |

> Alle Golems verbrauchen WorldMana und werden durch `worldManaFactor` verlangsamt.

---

## 2. Ernte-Golems (distanzbasiert)

```
production(r) = pool.count * harvestBatch * worldManaFactor / harvestTime(r)
harvestTime(r) = 2 * distance(r) / (baseSpeed * worldManaFactor)

// distance wächst wenn harvest > respawn, schrumpft sonst
// respawn = respawnRatePerArea * π * distance²
```

---

## 3. Produktions-Golems

Verbrauchen Ressourcen → produzieren Ressourcen, skalieren mit `pool.count * worldManaFactor`.

---

## 4. Arbeitsloser Golem

Wenn Scribes Golems produzieren aber keine Aufträge in der Queue sind → stapeln sich als Ressource `idle-golem`. Spieler kann sie manuell Pools zuweisen.

---

## 5. Golem-Erschaffung (Frühspiel — manuell)

Ohne Scribe-Gebäude: Spieler klickt manuell Ressourcen zusammen:
```
earth + water → clay
clay + fire   → fired-golem
fired-golem + air (Klick) → Golem
```
Nach genug Wiederholungen → Forschung schaltet Scribe-Gebäude frei.

---

## 6. Blackbox-Interface

**GolemManager gibt nach außen:**
- `getPool(class): { count: number }`
- `getTotalProductionRate(resourceId): number`
- `assignToPool(class, count): void`

**GolemManager braucht von außen:**
- `ResourceManager.consume(resourceId, amount): boolean`
- `ResourceManager.produce(resourceId, amount): void`
- `WorldMana.getSpeedFactor(): number`
- `EventBus.emit()`

---

*Version: 0.2.0*
