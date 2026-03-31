/**
 * WorldMana — Welt-Magie-System
 * Das aktuelle Level ist versteckt. Kein direkter Getter für `current`.
 * Feuert Events wenn Schwellenwerte unterschritten werden.
 */
import { ticker } from '../core/Ticker.js';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

// Regenerationsrate: langsam, aber messbar (v0.2: erhöht auf 5/s)
const REGEN_RATE_PER_SECOND = 5;

// Drain pro aktiver Golem-Rate-Einheit pro Sekunde.
// Bei 10 aktiven Golems (rate=10): 10 * 0.4 = 4 drain/s.
// Regen 5/s → netto +1/s (kein Drain-Überschuss bei 10 Golems).
// Skaliert proportional zu PRODUCTION_SCALE=0.1 in ResourceManager — Balance-Verhältnis bleibt.
// Bewusst unabhängig von worldManaFactor: erzeugt echten Ressourcendruck.
const DRAIN_PER_PRODUCER_RATE = 0.4;

class WorldManaImpl {
    private current: number = 10000;
    readonly capacity: number = 10000;
    readonly threshold_slow: number = 3000;  // 30% — darunter: Golems langsamer
    readonly threshold_taint: number = 1000; // 10% — darunter: Taint entsteht

    // Zustand für Event-Entprellung: nicht jeden Tick das gleiche Event feuern
    private wasBelowSlow: boolean = false;
    private wasBelowTaint: boolean = false;

    constructor() {
        ticker.register(this.tick.bind(this));
    }

    /**
     * tick — wird vom Ticker aufgerufen
     */
    private tick(delta: number): void {
        this.regenerate(delta);
        this.checkThresholds();
        // gameState.worldMana als Proxy-Wert (nicht der echte current)
        // Wir speichern den worldManaFactor (0.1–1.0) skaliert auf 0–10000
        gameState.worldMana = this.current;
    }

    /**
     * regenerate — WorldMana wächst stetig nach
     */
    regenerate(delta: number): void {
        this.current = Math.min(this.capacity, this.current + REGEN_RATE_PER_SECOND * delta);
    }

    /**
     * drain — direkte Entnahme (z.B. Einzelereignisse, Crafting)
     */
    drain(amount: number): void {
        this.current = Math.max(0, this.current - amount);
    }

    /**
     * drainForProducers — Haupt-Drain pro Tick.
     * Verbraucht WorldMana proportional zur Gesamtzahl aktiver Golem-Einheiten.
     * Drain ist UNABHÄNGIG von worldManaFactor → echter Ressourcendruck, kein Dämpfungseffekt.
     *
     * @param totalProducerRate Summe aller registrierten Producer-Rates (= aktive Golem-Einheiten)
     * @param delta             Tick-Delta (Sekunden)
     */
    drainForProducers(totalProducerRate: number, delta: number): void {
        if (totalProducerRate <= 0) return;
        const drain = totalProducerRate * DRAIN_PER_PRODUCER_RATE * delta;
        this.current = Math.max(0, this.current - drain);
    }

    /**
     * getWorldManaFactor — Produktions-Multiplikator
     * clamp(current / threshold_slow, 0.1, 1.0)
     */
    getWorldManaFactor(): number {
        const raw = this.current / this.threshold_slow;
        return Math.min(1.0, Math.max(0.1, raw));
    }

    /**
     * getTaintLevel — wie viel Taint pro Tick entsteht
     * Nur unterhalb threshold_taint positiv.
     */
    getTaintLevel(): number {
        if (this.current >= this.threshold_taint) return 0;
        // Linear: von 0 (bei threshold_taint) bis 0.5 (bei 0)
        const ratio = 1 - (this.current / this.threshold_taint);
        return ratio * 0.5;
    }

    /**
     * Schwellenwert-Events feuern (einmalig beim Unterschreiten)
     */
    private checkThresholds(): void {
        const belowSlow = this.current < this.threshold_slow;
        const belowTaint = this.current < this.threshold_taint;

        if (belowSlow && !this.wasBelowSlow) {
            eventBus.emit({ type: 'MANA_LOW', level: this.current });
        }
        this.wasBelowSlow = belowSlow;

        if (belowTaint && !this.wasBelowTaint) {
            eventBus.emit({ type: 'TAINT_RISING', amount: this.getTaintLevel() });
        }
        this.wasBelowTaint = belowTaint;
    }
}

export const worldMana = new WorldManaImpl();
