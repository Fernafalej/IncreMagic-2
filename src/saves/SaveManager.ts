/**
 * SaveManager — Spielstand speichern, laden, exportieren, importieren, zurücksetzen.
 *
 * Speichert den vollständigen Spielzustand in localStorage unter 'incremagic_save'.
 * Alle Module liefern serialize()/deserialize()/reset()-Methoden.
 */

import { gameState } from '../core/GameState.js';
import { golemManager } from '../golems/GolemManager.js';
import { orderQueue } from '../golems/OrderSystem.js';
import { harvestAreaManager } from '../world/HarvestArea.js';
import { researchTree } from '../research/index.js';
import { scribeList } from '../golems/ScribeList.js';

const SAVE_KEY = 'incremagic_save';
const SAVE_VERSION = '0.2.1';

export interface SaveData {
    version: string;
    timestamp: number;
    gameState: any;
    golemPools: any;
    orderQueue: any;
    harvestAreas: any;
    research: string;
    scribeTargets?: any;
}

class SaveManagerImpl {
    /**
     * save — schreibt den vollständigen Spielzustand in localStorage.
     */
    save(): void {
        const data: SaveData = {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            gameState: JSON.parse(gameState.serialize()),
            golemPools: golemManager.serialize(),
            orderQueue: orderQueue.serialize(),
            harvestAreas: harvestAreaManager.serialize(),
            research: researchTree.save(),
            scribeTargets: scribeList.serialize(),
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[SaveManager] Fehler beim Speichern:', e);
        }
    }

    /**
     * load — lädt den Spielstand aus localStorage.
     * Gibt true zurück wenn ein Save gefunden und geladen wurde, sonst false.
     *
     * Reihenfolge: harvestAreas VOR golemPools (Pool-Registrierung braucht Areas).
     */
    load(): boolean {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;

        try {
            const data: SaveData = JSON.parse(raw);

            // Versions-Kompatibilität — bei Mismatch warnen aber versuchen
            if (data.version !== SAVE_VERSION) {
                console.warn(`[SaveManager] Version mismatch: save=${data.version} current=${SAVE_VERSION}`);
            }

            // GameState
            if (data.gameState) {
                gameState.deserialize(JSON.stringify(data.gameState));
            }

            // HarvestAreas VOR GolemPools laden
            if (data.harvestAreas) {
                harvestAreaManager.deserialize(data.harvestAreas);
            }

            // GolemPools
            if (data.golemPools) {
                golemManager.deserialize(data.golemPools);
            }

            // OrderQueue
            if (data.orderQueue) {
                orderQueue.deserialize(data.orderQueue);
            }

            // Forschung
            if (data.research) {
                researchTree.load(data.research);
            }

            // ScribeList
            scribeList.deserialize(data.scribeTargets ?? {});

            console.log(`[SaveManager] Geladen. Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
            return true;
        } catch (e) {
            console.error('[SaveManager] Fehler beim Laden:', e);
            return false;
        }
    }

    /**
     * exportJSON — triggert Browser-Download als incremagic_save.json
     */
    exportJSON(): void {
        // Zuerst aktuellen Stand speichern damit Export immer aktuell ist
        this.save();
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.warn('[SaveManager] Kein Save zum Exportieren vorhanden.');
            return;
        }

        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'incremagic_save.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[SaveManager] Export abgeschlossen.');
    }

    /**
     * importJSON — parst JSON-String, lädt alle Module, löst Seiten-Reload aus.
     */
    importJSON(json: string): void {
        try {
            // Validierung: JSON muss parsebar und version enthalten
            const data: SaveData = JSON.parse(json);
            if (!data.version) {
                throw new Error('Kein version-Feld im Save gefunden.');
            }

            localStorage.setItem(SAVE_KEY, json);
            console.log('[SaveManager] Import erfolgreich. Seite wird neu geladen...');
            location.reload();
        } catch (e) {
            console.error('[SaveManager] Import fehlgeschlagen:', e);
            throw e; // SavePanel zeigt Fehler an
        }
    }

    /**
     * reset — löscht localStorage komplett und lädt Seite neu.
     */
    reset(): void {
        scribeList.reset();
        localStorage.clear();
        console.log('[SaveManager] Hard Reset. Seite wird neu geladen...');
        location.reload();
    }
}

// Singleton
export const saveManager = new SaveManagerImpl();
