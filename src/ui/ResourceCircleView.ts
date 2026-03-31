/**
 * ResourceCircleView — Canvas-basierte Ressourcen-Kreise Visualisierung
 *
 * Zwei wachsende Kreise für v0.1:
 *   - Stein (Ocker #c8960c) — logarithmisch wachsend
 *   - Mana  (Türkis #4ecdc4 / Amber-Glühen) — pulsiert bei MANA_LOW
 *
 * Läuft per Ticker (1 tick/Sekunde) — Animation via requestAnimationFrame
 * für fließende Interpolation zwischen Ticks.
 */
import { gameState } from '../core/GameState.js';
import { ticker } from '../core/Ticker.js';
import { eventBus } from '../core/EventBus.js';

// Farb-Konstanten (MASTER §8)
const COLOR_STONE_FILL   = 'rgba(200, 150, 12, 0.35)';   // Ocker, transparent
const COLOR_STONE_STROKE = '#c8960c';
const COLOR_MANA_FILL    = 'rgba(78, 205, 196, 0.35)';   // Türkis, transparent
const COLOR_MANA_STROKE  = '#4ecdc4';
const COLOR_MANA_PULSE   = 'rgba(240, 165, 0, 0.35)';    // Amber-Glühen bei MANA_LOW
const COLOR_MANA_PULSE_STROKE = '#f0a500';

// Layout
const BASE_RADIUS   = 30;   // Startradius in px
const LOG_SCALE     = 18;   // Skalierungsfaktor für logarithmisches Wachstum
const STONE_CENTER  = { x: 0.38, y: 0.50 }; // relative Position (% der Canvas-Breite/-Höhe)
const MANA_CENTER   = { x: 0.62, y: 0.50 };

// Puls-Animation Zustand
interface PulseState {
    active: boolean;
    phase: number;   // 0..2π
    speed: number;   // Bogenmaß pro Sekunde
}

class ResourceCircleViewImpl {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    // Gecachte Radius-Werte (werden per Tick aktualisiert)
    private stoneRadius: number = BASE_RADIUS;
    private manaRadius:  number = BASE_RADIUS;

    // Smooth-Interpolation: Zielwerte vs. aktuell gerenderte Werte
    private stoneRadiusCurrent: number = BASE_RADIUS;
    private manaRadiusCurrent:  number = BASE_RADIUS;

    private pulse: PulseState = { active: false, phase: 0, speed: 2.0 };

    private boundTick: (delta: number) => void;
    private rafId: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('ResourceCircleView: Canvas 2D-Kontext nicht verfügbar.');
        this.ctx = ctx;

        this.boundTick = this.onTick.bind(this);
        ticker.register(this.boundTick);

        // MANA_LOW → Puls aktivieren
        eventBus.on('MANA_LOW', (_event) => {
            this.pulse.active = true;
            this.pulse.phase  = 0;
        });

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.startRenderLoop();
    }

    private resizeCanvas(): void {
        this.canvas.width  = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /**
     * Logarithmisches Radius-Wachstum.
     * radius = BASE + LOG_SCALE * ln(1 + amount)
     * Für amount=0 → 30px, amount=1000 → ~186px, amount=1000000 → ~290px
     */
    private calcRadius(amount: number): number {
        return BASE_RADIUS + LOG_SCALE * Math.log1p(Math.max(0, amount));
    }

    /** Wird einmal pro Tick aufgerufen — aktualisiert Zielwerte */
    private onTick(_delta: number): void {
        const stone = gameState.resources.get('stone') ?? 0;
        const mana  = gameState.resources.get('mana')  ?? 0;
        this.stoneRadius = this.calcRadius(stone);
        this.manaRadius  = this.calcRadius(mana);
    }

    /** requestAnimationFrame-Loop — rendert mit Interpolation */
    private startRenderLoop(): void {
        let lastTime = performance.now();

        const frame = (now: number): void => {
            const dt = (now - lastTime) / 1000; // Sekunden
            lastTime = now;

            this.update(dt);
            this.render();

            this.rafId = requestAnimationFrame(frame);
        };

        this.rafId = requestAnimationFrame(frame);
    }

    /** Interpoliert aktuelle Radien sanft zu den Zielwerten */
    private update(dt: number): void {
        const LERP_SPEED = 3.0; // höher = schneller

        this.stoneRadiusCurrent += (this.stoneRadius - this.stoneRadiusCurrent) * Math.min(1, LERP_SPEED * dt);
        this.manaRadiusCurrent  += (this.manaRadius  - this.manaRadiusCurrent)  * Math.min(1, LERP_SPEED * dt);

        // Puls-Phase weiterschreiben
        if (this.pulse.active) {
            this.pulse.phase += this.pulse.speed * dt;
            // Puls läuft dauerhaft, solange MANA_LOW — kein Auto-Stop
        }
    }

    private render(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;

        if (w === 0 || h === 0) return;

        this.ctx.clearRect(0, 0, w, h);

        const sx = STONE_CENTER.x * w;
        const sy = STONE_CENTER.y * h;
        const mx = MANA_CENTER.x  * w;
        const my = MANA_CENTER.y  * h;

        // --- Stein-Kreis (hinter Mana) ---
        this.drawCircle(
            sx, sy,
            this.stoneRadiusCurrent,
            COLOR_STONE_FILL,
            COLOR_STONE_STROKE,
            1.5,
            0
        );

        // --- Mana-Kreis (mit optionalem Puls) ---
        let manaExtraRadius = 0;
        let manaFill   = COLOR_MANA_FILL;
        let manaStroke = COLOR_MANA_STROKE;

        if (this.pulse.active) {
            // Subtiles Pulsieren: ±4px, Farbe wechselt zum Amber-Glühen
            const pulse = Math.sin(this.pulse.phase);
            manaExtraRadius = pulse * 4;
            // Weiche Mischung: 0 = türkis, 1 = amber
            const t = (pulse + 1) / 2; // 0..1
            manaFill   = t > 0.5 ? COLOR_MANA_PULSE   : COLOR_MANA_FILL;
            manaStroke = t > 0.5 ? COLOR_MANA_PULSE_STROKE : COLOR_MANA_STROKE;
        }

        this.drawCircle(
            mx, my,
            this.manaRadiusCurrent + manaExtraRadius,
            manaFill,
            manaStroke,
            1.5,
            this.pulse.active ? Math.sin(this.pulse.phase * 0.5) * 0.15 : 0
        );

        // --- Labels ---
        this.drawLabel(sx, sy + this.stoneRadiusCurrent + 18, '⛏ Stein', '#c8960c');
        this.drawLabel(mx, my + this.manaRadiusCurrent + manaExtraRadius + 18, '✦ Mana', this.pulse.active ? COLOR_MANA_PULSE_STROKE : COLOR_MANA_STROKE);
    }

    /**
     * Zeichnet einen gefüllten Kreis mit Outline.
     * glowAlpha > 0 zeichnet zusätzlich einen weichen Glow-Ring.
     */
    private drawCircle(
        x: number, y: number, radius: number,
        fillColor: string, strokeColor: string,
        lineWidth: number,
        glowAlpha: number
    ): void {
        if (radius <= 0) return;

        // Optionaler Glow (Amber-Glühen bei Puls)
        if (glowAlpha > 0) {
            // strokeColor ist ein Hex-Wert (#rrggbb) — in rgba umwandeln
            const r = parseInt(strokeColor.slice(1, 3), 16);
            const g = parseInt(strokeColor.slice(3, 5), 16);
            const b = parseInt(strokeColor.slice(5, 7), 16);
            const innerColor = `rgba(${r},${g},${b},${glowAlpha.toFixed(2)})`;
            const grad = this.ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.4);
            grad.addColorStop(0, innerColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();
        }

        // Füllung
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();

        // Outline
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.stroke();
    }

    private drawLabel(x: number, y: number, text: string, color: string): void {
        this.ctx.font = '13px monospace';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }

    destroy(): void {
        ticker.unregister(this.boundTick);
        cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}

export { ResourceCircleViewImpl as ResourceCircleView };
