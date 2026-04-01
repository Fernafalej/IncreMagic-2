/**
 * ResourceCircleView — Canvas-basierte Ressourcen-Kreise Visualisierung
 *
 * Konzentrische Kreise für alle Ressourcen um einen Mittelpunkt.
 * Radius wächst mit √(amount) — spiegelt Erntefläche wider.
 * Kreise leicht transparent, Overlap erlaubt.
 * Bei worldManaFactor < 0.5: subtile Pulsation.
 */
import { ticker } from '../core/Ticker.js';
import { worldMana } from '../resources/WorldMana.js';
import { harvestAreaManager } from '../world/HarvestArea.js';

// Nur harvestbare Ressourcen (gesammelt von Ernte-Golems, Pfade für Laufdistanz-Darstellung)
const RESOURCE_DEFS = [
    { id: 'earth', symbol: '🟤', color: 'rgba(200, 150, 110, 0.5)', stroke: '#c8966e' },
    { id: 'water', symbol: '💧', color: 'rgba(100, 150, 200, 0.5)', stroke: '#6496c8' },
    { id: 'wood',  symbol: '🪵', color: 'rgba(150, 120, 80, 0.5)',  stroke: '#967850' },
];

// Layout
const MIN_DISTANCE_RADIUS = 14;  // sehr nah (viele Golems)
const MAX_DISTANCE_RADIUS = 170; // weit entfernte Suchen (wenige Golems)
const MIN_DISPLAY_RADIUS = 18;
const MAX_DISPLAY_RADIUS = 88;
const PULSE_AMPLITUDE = 3; // ±3px Pulsation
const PULSE_SPEED = 2.0; // Bogenmaß pro Sekunde

const RESOURCE_OFFSETS: Record<string, { x: number; y: number }> = {
    // Konzentrisch: alle um Mittelpunkt, keine Offsets
    earth: { x: 0, y: 0 },
    water: { x: 0, y: 0 },
    wood:  { x: 0, y: 0 },
};

interface ResourceCircle {
    id: string;
    symbol: string;
    color: string;
    stroke: string;
    targetRadius: number;
    currentRadius: number;
    label?: string;
    labelColor?: string;
}

/**
 * ResourceCircleCalculator
 *
 * Beinhaltet reine Mathe zur Radius-Berechnung basierend auf Rate.
 * Sauber getestet und sitzt von UI-getrennt.
 */
class ResourceCircleCalculator {
    calcDistanceRadius(productionRate: number): number {
        const effectiveRate = Math.max(0, productionRate);
        const normalized = 1 / (1 + effectiveRate);
        return MIN_DISTANCE_RADIUS + (MAX_DISTANCE_RADIUS - MIN_DISTANCE_RADIUS) * normalized;
    }
}

class ResourceCircleViewImpl {
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private circles: ResourceCircle[] = [];
    private visibleResources: Map<string, boolean> = new Map();
    private pulsePhase: number = 0;
    private boundTick: (delta: number) => void;
    private rafId: number = 0;

    constructor() {
        // Canvas wird in createControlPanel erstellt
        this.boundTick = this.onTick.bind(this);
        ticker.register(this.boundTick);

        // Initialisiere Kreise und Sichtbarkeit
        for (const def of RESOURCE_DEFS) {
            this.circles.push({
                id: def.id,
                symbol: def.symbol,
                color: def.color,
                stroke: def.stroke,
                targetRadius: 0,
                currentRadius: 0,
            });
            this.visibleResources.set(def.id, true);
        }

        this.createControlPanel();
        this.startRenderLoop();
    }

    private resizeCanvas(): void {
        this.canvas.width  = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /** Radius = √(amount) * BASE_SCALE */
    private calculator = new ResourceCircleCalculator();

    private onTick(_delta: number): void {
        for (const circle of this.circles) {
            // Anzahl Golems, die diese Ressource harvesten
            const harvestingGolems = harvestAreaManager.getAreas()
                .filter(area => area.resourceId === circle.id)
                .reduce((sum, area) => sum + area.count, 0);
            circle.targetRadius = this.calculator.calcDistanceRadius(harvestingGolems);
        }
    }

    private startRenderLoop(): void {
        let lastTime = performance.now();

        const frame = (now: number): void => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            this.update(dt);
            this.render();

            this.rafId = requestAnimationFrame(frame);
        };

        this.rafId = requestAnimationFrame(frame);
    }

    private update(dt: number): void {
        const LERP_SPEED = 2.0;
        const manaFactor = worldMana.getWorldManaFactor();

        for (const circle of this.circles) {
            circle.currentRadius += (circle.targetRadius - circle.currentRadius) * Math.min(1, LERP_SPEED * dt);
        }

        // Pulsation bei niedrigem Mana
        if (manaFactor < 0.5) {
            this.pulsePhase += PULSE_SPEED * dt;
        } else {
            this.pulsePhase = 0;
        }
    }

    private render(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w === 0 || h === 0) return;

        this.ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        const manaFactor = worldMana.getWorldManaFactor();
        const pulseOffset = (manaFactor < 0.5) ? Math.sin(this.pulsePhase) * PULSE_AMPLITUDE : 0;

        // Kreise zeichnen in separaten leicht versetzten Punkten -> Überlappung vermeiden
        const visibleCircles = [...this.circles].filter((c) => this.visibleResources.get(c.id));
        const sortedCircles = visibleCircles.sort((a, b) => a.currentRadius - b.currentRadius);

        for (const circle of sortedCircles) {
            if (circle.currentRadius > 0) {
                const rangeRatio = Math.min(1, Math.max(0, (circle.currentRadius - MIN_DISTANCE_RADIUS) / (MAX_DISTANCE_RADIUS - MIN_DISTANCE_RADIUS)));
                const visualRadius = MIN_DISPLAY_RADIUS + rangeRatio * (MAX_DISPLAY_RADIUS - MIN_DISPLAY_RADIUS) + pulseOffset;

                const offset = RESOURCE_OFFSETS[circle.id] || { x: 0, y: 0 };
                const circleX = cx + offset.x;
                const circleY = cy + offset.y;

                this.drawCircleOutline(circleX, circleY, visualRadius, circle.stroke, 2);

                const rate = harvestAreaManager.getAreas()
                    .filter(area => area.resourceId === circle.id)
                    .reduce((sum, area) => sum + area.count, 0);
                // rangeRatio: 0% = nahe (viele Golems), 100% = max. Suchentfernung (wenige Golems)
                const radiusPct = (rangeRatio * 100).toFixed(0);

                // Legenden-Eintrag nach unten sammeln (kein Überlappen im Kreis)
                circle.label = `${circle.symbol} ${circle.id} · ${rate.toFixed(0)} Golems · Radius ${radiusPct}% v.max`;
                circle.labelColor = circle.stroke;
            }
        }

        // Draw legend text lines at bottom
        let legendY = h - 20;
        this.ctx.textAlign = 'left';
        for (const circle of sortedCircles) {
            if (!circle.label || !circle.labelColor) continue;
            this.ctx.fillStyle = circle.labelColor;
            this.ctx.fillText(circle.label, 12, legendY);
            legendY -= 16;
        }

        // Hinweis: Mittelpunkt des Panels
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(120, 90, 40, 0.8)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#d8b47a';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    private drawCircleOutline(x: number, y: number, radius: number, strokeColor: string, lineWidth: number): void {
        if (radius <= 0) return;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    }


    private createControlPanel(): void {
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.right = '12px';
        panel.style.bottom = '12px';
        panel.style.padding = '0.35rem';
        panel.style.background = 'rgba(18, 14, 8, 0.82)';
        panel.style.border = '1px solid #5a401e';
        panel.style.borderRadius = '6px';
        panel.style.color = '#d8b47a';
        panel.style.font = '11px monospace';
        panel.style.zIndex = '20';
        panel.style.maxHeight = '300px';
        panel.style.maxWidth = '320px';
        panel.style.overflow = 'hidden'; // Für Collapsing

        // Header mit Titel und Close-Button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.25rem';
        header.style.fontWeight = 'bold';

        const title = document.createElement('span');
        title.textContent = 'Map: Resource Circles';
        header.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.title = 'Panel zuklappen';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#d8b47a';
        closeBtn.style.fontSize = '14px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0';
        closeBtn.addEventListener('click', () => {
            const content = panel.querySelector('.panel-content') as HTMLElement;
            if (content) {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                closeBtn.textContent = isCollapsed ? '×' : '▼';
                closeBtn.title = isCollapsed ? 'Panel zuklappen' : 'Panel aufklappen';
            }
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Content-Container
        const content = document.createElement('div');
        content.className = 'panel-content';
        content.style.display = 'block'; // Standardmäßig offen

        // Canvas für Kreise
        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 180;
        canvas.style.border = '1px solid #3a2a10';
        canvas.style.borderRadius = '4px';
        canvas.style.background = 'rgba(0, 0, 0, 0.1)';
        content.appendChild(canvas);

        // Toggles
        const togglesDiv = document.createElement('div');
        togglesDiv.style.marginTop = '0.3rem';
        togglesDiv.style.fontSize = '10px';

        for (const def of RESOURCE_DEFS) {
            const row = document.createElement('label');
            row.style.display = 'block';
            row.style.cursor = 'pointer';
            row.style.marginBottom = '0.08rem';

            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = true;
            chk.style.marginRight = '0.3rem';
            chk.addEventListener('change', () => {
                this.visibleResources.set(def.id, chk.checked);
            });

            row.appendChild(chk);
            row.appendChild(document.createTextNode(`${def.symbol} ${def.id}`));
            togglesDiv.appendChild(row);
        }
        content.appendChild(togglesDiv);

        panel.appendChild(content);

        // Canvas zuweisen
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('ResourceCircleView: Canvas 2D-Kontext nicht verfügbar.');
        this.ctx = ctx;

        document.body.appendChild(panel);
    }

    destroy(): void {
        ticker.unregister(this.boundTick);
        cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}

export { ResourceCircleViewImpl as ResourceCircleView };
