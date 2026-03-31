/**
 * OfflineCalc — Offline-Zeit-Berechnung
 * Stub: gibt State unverändert zurück, loggt die Offline-Zeit.
 * Vollimplementierung folgt wenn ResourceManager + GolemManager stehen.
 */
import { GameState } from './GameState.js';

const MAX_OFFLINE_SECONDS = 48 * 60 * 60; // 48 Stunden

export function calculateOffline(state: GameState, secondsOffline: number): GameState {
    const capped = Math.min(secondsOffline, MAX_OFFLINE_SECONDS);

    if (capped <= 0) return state;

    const hours = Math.floor(capped / 3600);
    const minutes = Math.floor((capped % 3600) / 60);
    const seconds = Math.floor(capped % 60);

    console.log(
        `[OfflineCalc] Offline-Zeit: ${hours}h ${minutes}m ${seconds}s (${capped} Ticks). ` +
        `Stub: kein Fortschritt berechnet. Implementierung folgt mit ResourceManager.`
    );

    // TODO: simulateTicks(state, capped, { taintProtection: false }) wenn ResourceManager steht
    return state;
}
