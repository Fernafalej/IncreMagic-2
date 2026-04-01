/**
 * OrderSystem — Auftrags-System für Golems
 *
 * Order-Interface nach MASTER §6.2
 * OrderType: 'HARVEST' für v0.1, weitere für v0.2+
 */

export type OrderType = 'HARVEST' | 'PROCESS' | 'CRAFT' | 'WRITE' | 'RESEARCH' | 'BUILD';

export interface Order {
    type: OrderType;
    target: string;       // resourceId oder BuildingType
    quantity: number;     // gewünschte Menge (0 = unbegrenzt / dauerhaft)
    priority: number;     // 1 = niedrig, 10 = hoch
}

/**
 * OrderRequest — ein Eintrag in der globalen OrderQueue
 * Identisch zu Order, aber mit id und repeat-Flag (MASTER §2.2)
 */
export interface OrderRequest {
    id: string;
    type: OrderType;
    target: string;       // resourceId, GolemClass oder BuildingType
    quantity: number;     // 0 = dauerhaft/repeat
    priority: number;     // 1–10, Queue sortiert danach
    repeat: boolean;
}

// Einfacher, abhängigkeitsfreier ID-Generator
let _idCounter = 0;
function generateId(): string {
    _idCounter += 1;
    return `req_${Date.now()}_${_idCounter}`;
}

/**
 * createOrder — Fabrik-Funktion für manuelle Aufträge (ohne id/repeat)
 */
export function createOrder(
    type: OrderType,
    target: string,
    quantity: number = 0,
    priority: number = 5,
): Order {
    return { type, target, quantity, priority };
}

/**
 * createOrderRequest — Fabrik-Funktion für Queue-Einträge
 */
export function createOrderRequest(
    type: OrderType,
    target: string,
    quantity: number = 0,
    priority: number = 5,
    repeat: boolean = false,
): OrderRequest {
    return { id: generateId(), type, target, quantity, priority, repeat };
}

// ---------------------------------------------------------------------------
// OrderQueue — globale Singleton-Warteschlange (MASTER §2.2)
// ---------------------------------------------------------------------------

class OrderQueueImpl {
    private queue: OrderRequest[] = [];

    /**
     * enqueue — fügt einen neuen Eintrag in die Queue ein.
     * Die Queue wird intern nach priority desc sortiert.
     */
    enqueue(request: OrderRequest): void {
        this.queue.push(request);
        this.sort();
        console.log(`[OrderQueue] Enqueue: ${request.type}/${request.target} (prio=${request.priority}, repeat=${request.repeat})`);
    }

    /**
     * getAll — gibt alle Einträge sortiert nach priority desc zurück.
     */
    getAll(): OrderRequest[] {
        return [...this.queue];
    }

    /**
     * remove — entfernt einen Eintrag anhand seiner id.
     */
    remove(id: string): void {
        const before = this.queue.length;
        this.queue = this.queue.filter((r) => r.id !== id);
        if (this.queue.length < before) {
            console.log(`[OrderQueue] Removed: ${id}`);
        }
    }

    /**
     * setPriority — ändert die Priorität eines Eintrags und sortiert neu.
     */
    setPriority(id: string, priority: number): void {
        const req = this.queue.find((r) => r.id === id);
        if (req) {
            req.priority = priority;
            this.sort();
        }
    }

    /**
     * toggleRepeat — schaltet das repeat-Flag eines Eintrags um.
     */
    toggleRepeat(id: string): void {
        const req = this.queue.find((r) => r.id === id);
        if (req) {
            req.repeat = !req.repeat;
            console.log(`[OrderQueue] ToggleRepeat ${id}: repeat=${req.repeat}`);
        }
    }

    /**
     * peek — gibt den ersten Eintrag (höchste Priorität) zurück, ohne ihn zu entfernen.
     * Gibt null zurück wenn die Queue leer ist.
     */
    peek(): OrderRequest | null {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    /**
     * complete — schließt den Eintrag ab:
     * - dispatcht via GolemManager den passenden Pool-Auftrag
     * - bei repeat=true: Eintrag hinten wieder einreihen (neue id, gleiche Werte)
     * - bei repeat=false: Eintrag entfernen
     */
    complete(id: string): void {
        const idx = this.queue.findIndex((r) => r.id === id);
        if (idx === -1) {
            console.warn(`[OrderQueue] complete: id '${id}' nicht gefunden.`);
            return;
        }

        const req = this.queue[idx];

        // Dispatch: Golem-Pool den Auftrag zuweisen (lazy import = kein Zirkel)
        this.dispatch(req);

        // repeat-Logik: hinten wieder einreihen oder entfernen
        this.queue.splice(idx, 1);
        if (req.repeat) {
            const repeated: OrderRequest = { ...req, id: generateId() };
            this.queue.push(repeated);
            this.sort();
            console.log(`[OrderQueue] Repeat: ${req.type}/${req.target} neu eingereiht.`);
        } else {
            console.log(`[OrderQueue] Complete: ${req.type}/${req.target} abgeschlossen.`);
        }
    }

    // -----------------------------------------------------------------------
    // Serialisierung / Deserialisierung / Reset (für SaveManager)
    // -----------------------------------------------------------------------

    /**
     * serialize — exportiert die Queue als plain Array.
     */
    serialize(): any {
        return { queue: [...this.queue] };
    }

    /**
     * deserialize — stellt die Queue wieder her. KEIN dispatch!
     * Aufträge werden nur im Speicher restauriert, nicht erneut an Golems vergeben.
     */
    deserialize(data: any): void {
        this.queue = [];
        if (!data?.queue) return;
        for (const r of data.queue) {
            this.queue.push({ ...r });
        }
        this.sort();
        console.log(`[OrderQueue] Deserialisiert: ${this.queue.length} Eintrag/-räge.`);
    }

    /**
     * reset — leert die Queue.
     */
    reset(): void {
        this.queue = [];
        console.log('[OrderQueue] Reset: Queue geleert.');
    }

    // --- Interne Hilfsfunktionen ---

    private sort(): void {
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * dispatch — weist dem passenden GolemPool den Auftrag zu.
     * Lazy-Import (dynamic import) vermeidet Zirkelabhängigkeit:
     * GolemManager importiert OrderSystem → OrderSystem darf GolemManager nicht direkt importieren.
     */
    private dispatch(req: OrderRequest): void {
        import('./GolemManager.js').then(({ golemManager }) => {
            const order = createOrder(req.type, req.target, req.quantity, req.priority);
            // target ist bei WRITE-Aufträgen der GolemClass-Bezeichner (z.B. 'earth-gatherer')
            golemManager.dispatchOrder(req.type, req.target, order);
        }).catch((err) => {
            console.error('[OrderQueue] dispatch: Fehler beim GolemManager-Import:', err);
        });
    }
}

// Singleton
export const orderQueue = new OrderQueueImpl();
