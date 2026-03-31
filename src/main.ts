/**
 * main.ts — Bootstrap
 * Startet den Ticker, registriert EventBus-Handler, initialisiert UI.
 */
import { gameState } from './core/GameState.js';
import { ticker } from './core/Ticker.js';
import { eventBus } from './core/EventBus.js';
import { calculateOffline } from './core/OfflineCalc.js';
import { worldMana } from './resources/WorldMana.js';
import { ResourceCircleView } from './ui/ResourceCircleView.js';
import { HUD } from './ui/HUD.js';
import { GolemView } from './ui/GolemView.js';
import { OrderQueueView } from './ui/OrderQueueView.js';
import { golemManager } from './golems/GolemManager.js';
import { createOrder } from './golems/OrderSystem.js';
import { researchTree } from './research/index.js';
import './golems/ScribeGolem.js'; // Singleton initialisieren — läuft dann via Ticker

// --- Offline-Zeit prüfen ---
const SAVE_KEY = 'incremagic_last_seen';
const lastSeen = localStorage.getItem(SAVE_KEY);
if (lastSeen) {
    const secondsOffline = Math.floor((Date.now() - parseInt(lastSeen, 10)) / 1000);
    calculateOffline(gameState, secondsOffline);
}

// --- Forschung laden ---
const RESEARCH_SAVE_KEY = 'incremagic_research';
const researchData = localStorage.getItem(RESEARCH_SAVE_KEY);
if (researchData) {
    researchTree.load(researchData);
}

// Letzten Zeitstempel merken (alle 5 Sekunden aktualisieren)
setInterval(() => {
    localStorage.setItem(SAVE_KEY, String(Date.now()));
    localStorage.setItem(RESEARCH_SAVE_KEY, researchTree.save());
}, 5000);
localStorage.setItem(SAVE_KEY, String(Date.now()));
localStorage.setItem(RESEARCH_SAVE_KEY, researchTree.save());

// --- Start-Setup: 1 Golem pro Ressource (kein Ritual nötig) ---
// MASTER §2.1: "Spieler beginnt mit ~5 Golems (vorgegeben, kein leerer Start)"
// Je 1 Sammler-Golem für Erde, Wasser und Holz
golemManager.addToPool('earth-gatherer', '', 1);
golemManager.assignPool('earth-gatherer', createOrder('HARVEST', 'earth', 0, 5));

golemManager.addToPool('water-gatherer', '', 1);
golemManager.assignPool('water-gatherer', createOrder('HARVEST', 'water', 0, 5));

golemManager.addToPool('wood-gatherer', '', 1);
golemManager.assignPool('wood-gatherer', createOrder('HARVEST', 'wood', 0, 5));

// --- EventBus: MANA_LOW Handler ---
eventBus.on('MANA_LOW', (event) => {
    console.log(`[EventBus] MANA_LOW empfangen — Level: ${event.level}`);
});

eventBus.on('TAINT_RISING', (event) => {
    console.log(`[EventBus] TAINT_RISING — Amount: ${event.amount}`);
});

eventBus.on('RESEARCH_UNLOCKED', (event) => {
    console.log(`[EventBus] RESEARCH_UNLOCKED empfangen — ID: ${event.nodeId}`);
});

// --- UI initialisieren ---

// 1. ResourceCircleView auf dem Canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (canvas) {
    new ResourceCircleView(canvas);
} else {
    console.error('[IncreMagic] Canvas #game-canvas nicht gefunden.');
}

// 2. HUD im Container
const hudContainer = document.getElementById('hud-container') as HTMLElement | null;
if (hudContainer) {
    new HUD(hudContainer);
} else {
    console.error('[IncreMagic] HUD-Container #hud-container nicht gefunden.');
}

// 3. GolemView im Container
const golemContainer = document.getElementById('golem-container') as HTMLElement | null;
if (golemContainer) {
    new GolemView(golemContainer);
} else {
    console.error('[IncreMagic] GolemView-Container #golem-container nicht gefunden.');
}

// 4. OrderQueueView im Container
const orderQueueContainer = document.getElementById('order-queue-container') as HTMLElement | null;
if (orderQueueContainer) {
    new OrderQueueView(orderQueueContainer);
} else {
    console.error('[IncreMagic] OrderQueueView-Container #order-queue-container nicht gefunden.');
}

// --- Debug-UI (klein, Ecke) ---
const debugEl = document.getElementById('debug');

function updateDebugUI(): void {
    if (!debugEl) return;
    debugEl.innerHTML = `
        <span class="label">Tick: </span><span class="value">${gameState.tick}</span>
        <span class="label"> | Dim: </span><span class="value">${gameState.dimension}</span><br>
        <span class="label">MF: </span><span class="value">${worldMana.getWorldManaFactor().toFixed(2)}</span>
        <span class="label"> | Taint: </span><span class="value">${gameState.taint.toFixed(3)}</span>
    `;
}

ticker.register((_delta) => {
    updateDebugUI();
});

// --- Start ---
updateDebugUI();
ticker.start();

console.log('[IncreMagic] Core gestartet. Ticker läuft. UI aktiv.');
