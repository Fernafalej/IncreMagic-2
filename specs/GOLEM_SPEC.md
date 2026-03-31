# GOLEM_SPEC — Golem-System & Auftrags-System
> Detail-Dokument für `golem-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Golem-Erschaffung (4-Elemente-Ritual)

```
Erde + Wasser → Lehm
Lehm          → Roh-Golem (formen)
Roh-Golem + Feuer → Gebrannter Golem
Gebrannter Golem + Luft → Golem (Seele eingehaucht)
```

**Frühspiel (manuell):**
- Erde, Wasser, Holz: Klick → sammeln
- Holz → Feuer: Klick
- Luft (Seele einhauchen): Klick
- Nach genug Wiederholungen → Forschung schaltet Automatisierung frei

**Start:** Spieler beginnt mit ~5 vorgefertigten Golems — kein leerer Start.

---

## 2. Golem-Pools (fraktional)

- Golems werden **nach Klasse gruppiert** — Pool mit Dezimalwert
- `count: number` — z.B. `2.7` Erdsammler-Golems, nie aufgerundet
- Produktion skaliert linear mit `count`
- Später: Varianten pro Klasse (z.B. "Erdsammler-Dampfgolem")
- **Qualitätsstufen** I–V → beeinflusst `qualityFactor` (v0.1 = 1.0)

---

## 3. Golem-Klassen

| Klasse | OrderType | Ressource | Beschreibung |
|---|---|---|---|
| `earth-gatherer` | HARVEST | earth | Erde sammeln |
| `water-gatherer` | HARVEST | water | Wasser schöpfen |
| `wood-gatherer` | HARVEST | wood | Holz sammeln |
| `fire-tender` | PROCESS | wood→fire | Holz verbrennen |
| `clay-mixer` | CRAFT | earth+water→clay | Lehm mischen |
| `golem-shaper` | CRAFT | clay→raw-golem | Roh-Golem formen |
| `golem-baker` | CRAFT | raw-golem+fire→fired-golem | Golem brennen |
| `paper-maker` | CRAFT | wood+water→paper | Papier herstellen |
| `scribe` | WRITE | paper→order | Aufträge schreiben |
| `researcher` | RESEARCH | paper+knowledge→research | Forschen |
| `builder` | BUILD | — | Gebäude errichten (v0.2+) |

---

## 4. Auftrags-System (OrderSystem)

**Globale Queue:**
- Eine einzige geordnete Liste von `OrderRequest`
- Spieler fügt hinzu: `{ type, target, quantity, priority, repeat }`
- `repeat: true` → nach Ausführung automatisch wieder einreihen

**Scribe-Workflow:**
1. Alle Scribes teilen sich eine einzige globale Queue
2. Pro Tick: `writeProgress += scribePool.count * writeSpeedPerTick`
3. Kostet 1 Papier wenn fertig geschrieben
4. Fertig → Order wird dem passenden Golem-Pool dispatcht

**Fraktionale Golem-Produktion:**
- `pendingGolems += production * delta`
- Sobald `>= 1.0` → Golem wird Pool hinzugefügt, `pendingGolems -= 1.0`
- HUD zeigt Rate: `+0.1/s` neben Pool-Count

**Manuell vs. automatisch:**
- Frühspiel: Spieler schreibt manuell (Klick = sofort, kein Papier, kein Scribe)
- Nach genug Wiederholungen → Forschung schaltet Scribe-Automatisierung frei

---

## 5. Interfaces

```typescript
interface OrderRequest {
    id: string;
    type: OrderType;
    target: string;       // resourceId, GolemClass oder BuildingType
    quantity: number;     // 0 = dauerhaft/repeat
    priority: number;     // 1–10
    repeat: boolean;
}

// OrderQueue (Singleton):
orderQueue.enqueue(request): void
orderQueue.getAll(): OrderRequest[]       // sortiert nach priority desc
orderQueue.remove(id): void
orderQueue.setPriority(id, priority): void
orderQueue.toggleRepeat(id): void
orderQueue.peek(): OrderRequest | null    // für ScribeGolem
orderQueue.complete(id): void            // dispatcht + repeat-Logik
```

---

## 6. Blackbox-Interface (für andere Module)

**GolemManager gibt nach außen:**
- `getPool(class): { count: number, pendingCount: number }`
- `getTotalProductionRate(resourceId): number`

**GolemManager braucht von außen:**
- `ResourceManager.consume(resourceId, amount): boolean`
- `ResourceManager.produce(resourceId, amount): void`
- `WorldMana.getSpeedFactor(): number` (für Golem-Geschwindigkeit)
- `EventBus.emit(event)` bei Golem-Erschaffung

---

*Version: 0.1.0*
