# CORE_SPEC — GameState, Ticker, EventBus, OfflineCalc
> Detail-Dokument für `core-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. GameState

Zentraler Zustand. Wird von allen Modulen gelesen, nur vom jeweiligen Modul geschrieben.

```typescript
interface GameState {
    tick: number;
    dimension: number;
    resources: ResourceMap;       // { [resourceId]: { amount, productionRate } }
    golemPools: GolemPoolMap;     // { [class]: { count, pendingCount } }
    orderQueue: OrderRequest[];
    research: ResearchState;
    worldMana: number;            // intern, nie direkt anzeigen
    taint: number;
    prestigeCount: number;
    lastSaved: number;            // Unix timestamp
}
```

**Regeln:**
- `serialize(): string` → JSON für SaveManager
- `deserialize(data: string): GameState`
- Kein Modul hält eigenen Zustand — alles in GameState

---

## 2. Ticker

Haupt-Game-Loop. Ruft alle Module pro Tick auf.

```typescript
// 1 tick = 1 Sekunde (Echtzeit)
// Delta-Zeit für flüssige Animationen zwischen Ticks
ticker.onTick((delta: number) => {
    ResourceManager.tick(delta);
    GolemManager.tick(delta);
    WorldMana.tick(delta);
    ScribeGolem.tick(delta);
    // UI-Update via EventBus
});
```

---

## 3. EventBus

Kommunikation zwischen Modulen. Kein Modul importiert ein anderes direkt außer über EventBus.

```typescript
type GameEvent =
    | { type: 'MANA_LOW'; level: number }
    | { type: 'TAINT_RISING'; amount: number }
    | { type: 'GOLEM_CORRUPTED'; golemId: string }
    | { type: 'RESEARCH_UNLOCKED'; nodeId: string }
    | { type: 'DIMENSION_READY' }
    | { type: 'MANUAL_ACTION'; actionType: string; count: number }
    | { type: 'LORE_UNLOCK'; entryId: string }
    | { type: 'GOLEM_CREATED'; class: GolemClass; count: number }

eventBus.emit(event: GameEvent): void
eventBus.on(type: string, handler: (event) => void): void
eventBus.off(type: string, handler): void
```

---

## 4. OfflineCalc

```typescript
function calculateOffline(savedState: GameState, secondsOffline: number): GameState {
    const TICK_RATE = 1; // 1 tick = 1 Sekunde
    const MAX_OFFLINE = 172800; // 48 Stunden
    const ticks = Math.min(Math.floor(secondsOffline), MAX_OFFLINE);
    // Vereinfacht: keine UI-Updates, direkte Zustandsberechnung
    // Taint-Schutz deaktiviert während Offline
    return simulateTicks(savedState, ticks, { taintProtection: false });
}
```

---

## 5. SaveManager

```typescript
interface SaveData {
    version: string;
    timestamp: number;
    gameState: SerializedGameState;
    // Prestige-Persistenz (bleibt über Runs):
    research: ResearchState;
    artifacts: Artifact[];
    startingGoods: ResourceMap;
    prestigeCount: number;
}

saveManager.save(state: GameState): void     // → localStorage
saveManager.load(): GameState | null
saveManager.export(): string                 // JSON-String zum Download
saveManager.import(data: string): GameState
```

---

## 6. Blackbox-Interface (für andere Module)

**Core gibt nach außen:**
- `GameState` (read-only Referenz)
- `EventBus` (emit + subscribe)
- `Ticker.onTick(handler)`

**Core braucht von außen:** nichts — Core ist die Basis.

---

*Version: 0.1.0*
