/**
 * EventBus — Kommunikation zwischen Modulen
 * Kein direktes Importieren von anderen Modulen nötig — alles läuft über Events.
 */

export type GameEvent =
    | { type: 'MANA_LOW'; level: number }
    | { type: 'TAINT_RISING'; amount: number }
    | { type: 'GOLEM_CORRUPTED'; golemId: string }
    | { type: 'RESEARCH_UNLOCKED'; nodeId: string }
    | { type: 'DIMENSION_READY' }
    | { type: 'MANUAL_ACTION'; actionType: string }
    | { type: 'LORE_UNLOCK'; entryId: string };

type EventType = GameEvent['type'];
type HandlerFor<T extends EventType> = (event: Extract<GameEvent, { type: T }>) => void;
type AnyHandler = (event: GameEvent) => void;

class EventBusImpl {
    private handlers: Map<EventType, Set<AnyHandler>> = new Map();

    on<T extends EventType>(type: T, handler: HandlerFor<T>): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler as AnyHandler);
    }

    off<T extends EventType>(type: T, handler: HandlerFor<T>): void {
        this.handlers.get(type)?.delete(handler as AnyHandler);
    }

    emit(event: GameEvent): void {
        const listeners = this.handlers.get(event.type);
        if (listeners) {
            for (const handler of listeners) {
                handler(event);
            }
        }
    }
}

// Singleton-Export
export const eventBus = new EventBusImpl();
