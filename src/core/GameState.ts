/**
 * GameState — zentraler Spielzustand
 * Einzige Quelle der Wahrheit für alle Module.
 */
export class GameState {
    tick: number = 0;
    dimension: number = 1;
    resources: Map<string, number> = new Map([
        ['mana', 100],
        ['stone', 0],
        ['energy', 0],
        ['knowledge', 0],
        ['souls', 0],
        ['taint', 0],
        // Frühspiel-Ressourcen (v0.1)
        ['earth', 0],
        ['water', 0],
        ['wood', 0],
        ['fire', 0],
        ['clay', 0],
        ['raw-golem', 0],
        ['fired-golem', 0],
        ['paper', 0],
    ]);
    taint: number = 0;
    worldMana: number = 1000;

    serialize(): string {
        return JSON.stringify({
            tick: this.tick,
            dimension: this.dimension,
            resources: Object.fromEntries(this.resources),
            taint: this.taint,
            worldMana: this.worldMana,
        });
    }

    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        this.tick = parsed.tick ?? 0;
        this.dimension = parsed.dimension ?? 1;
        this.taint = parsed.taint ?? 0;
        this.worldMana = parsed.worldMana ?? 1000;
        if (parsed.resources) {
            this.resources = new Map(Object.entries(parsed.resources));
        }
    }
}

// Singleton-Instanz
export const gameState = new GameState();
