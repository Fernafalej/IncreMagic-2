/**
 * Ticker — Haupt-Game-Loop
 * 1 tick = 1 Sekunde Echtzeit.
 * Nutzt requestAnimationFrame für genaues Timing.
 */
import { gameState } from './GameState.js';

type TickHandler = (delta: number) => void;

class TickerImpl {
    private handlers: Set<TickHandler> = new Set();
    private running: boolean = false;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private rafId: number = 0;

    private readonly TICK_INTERVAL_MS = 1000;

    register(fn: TickHandler): void {
        this.handlers.add(fn);
    }

    unregister(fn: TickHandler): void {
        this.handlers.delete(fn);
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.loop(this.lastTime);
    }

    stop(): void {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    private loop = (now: number): void => {
        if (!this.running) return;

        const elapsed = now - this.lastTime;
        this.lastTime = now;
        this.accumulator += elapsed;

        while (this.accumulator >= this.TICK_INTERVAL_MS) {
            this.accumulator -= this.TICK_INTERVAL_MS;
            this.tick();
        }

        this.rafId = requestAnimationFrame(this.loop);
    };

    private tick(): void {
        gameState.tick += 1;
        const delta = 1; // 1 Sekunde

        for (const handler of this.handlers) {
            handler(delta);
        }

        if (gameState.tick % 5 === 0) {
            console.log(`[Tick ${gameState.tick}] dim=${gameState.dimension} worldMana=${gameState.worldMana.toFixed(1)} taint=${gameState.taint.toFixed(2)}`);
        }
    }
}

export const ticker = new TickerImpl();
