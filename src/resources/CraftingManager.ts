/**
 * CraftingManager — Rezepte und manuelle Sammel-Aktionen
 *
 * Blackbox-Interface:
 *   craftingManager.craft(recipeId)          → boolean (Erfolg/Fehlschlag)
 *   craftingManager.canCraft(recipeId)        → boolean
 *   craftingManager.gather(resourceId)        → void  (earth, water, wood)
 *   craftingManager.burn(count)               → void  (wood → fire)
 *   craftingManager.getRecipes()              → Recipe[]
 */
import { resourceManager } from './ResourceManager.js';

/** Eine einzelne Zutat: Ressource + benötigte Menge */
export interface Ingredient {
    resourceId: string;
    amount: number;
}

/** Ein Rezept mit Eingaben und einem einzelnen Ergebnis */
export interface Recipe {
    id: string;
    inputs: Ingredient[];
    output: Ingredient;
}

/** Manuell sammelbare Ressourcen */
const GATHERABLE: ReadonlySet<string> = new Set(['earth', 'water', 'wood']);

/** Alle Frühspiel-Rezepte */
const RECIPES: ReadonlyArray<Recipe> = [
    {
        id: 'clay',
        inputs: [
            { resourceId: 'earth', amount: 1 },
            { resourceId: 'water', amount: 1 },
        ],
        output: { resourceId: 'clay', amount: 1 },
    },
    {
        id: 'raw-golem',
        inputs: [
            { resourceId: 'clay', amount: 1 },
        ],
        output: { resourceId: 'raw-golem', amount: 1 },
    },
    {
        id: 'fired-golem',
        inputs: [
            { resourceId: 'raw-golem', amount: 1 },
            { resourceId: 'fire', amount: 1 },
        ],
        output: { resourceId: 'fired-golem', amount: 1 },
    },
    {
        id: 'paper',
        inputs: [
            { resourceId: 'wood', amount: 1 },
            { resourceId: 'water', amount: 1 },
        ],
        output: { resourceId: 'paper', amount: 1 },
    },
];

class CraftingManagerImpl {
    /**
     * getRecipes — gibt alle bekannten Rezepte zurück
     */
    getRecipes(): Recipe[] {
        return [...RECIPES];
    }

    /**
     * canCraft — prüft ob ausreichend Ressourcen für ein Rezept vorhanden sind
     */
    canCraft(recipeId: string): boolean {
        const recipe = this.findRecipe(recipeId);
        if (recipe === null) return false;
        return this.hasIngredients(recipe);
    }

    /**
     * craft — führt ein Rezept aus (1× Ausführung)
     * Gibt true zurück wenn erfolgreich, false wenn Ressourcen fehlen oder Rezept unbekannt.
     */
    craft(recipeId: string): boolean {
        const recipe = this.findRecipe(recipeId);
        if (recipe === null) return false;
        if (!this.hasIngredients(recipe)) return false;

        // Zutaten verbrauchen
        for (const input of recipe.inputs) {
            resourceManager.addAmount(input.resourceId, -input.amount);
        }

        // Ergebnis hinzufügen
        resourceManager.addAmount(recipe.output.resourceId, recipe.output.amount);

        return true;
    }

    /**
     * gather — manuelles Sammeln: +1 sofort für earth, water oder wood
     * Wirft einen Fehler wenn die Ressource nicht sammelbar ist.
     */
    gather(resourceId: string): void {
        if (!GATHERABLE.has(resourceId)) {
            throw new Error(`gather: '${resourceId}' ist nicht manuell sammelbar. Erlaubt: ${[...GATHERABLE].join(', ')}`);
        }
        resourceManager.addAmount(resourceId, 1);
    }

    /**
     * burn — verbrennt 'wood' und erzeugt 'fire' (1:1)
     * Verbrennt maximal so viel Holz wie vorhanden.
     */
    burn(count: number): void {
        if (count <= 0) return;
        const available = resourceManager.getAmount('wood');
        const toBurn = Math.min(count, Math.floor(available));
        if (toBurn <= 0) return;
        resourceManager.addAmount('wood', -toBurn);
        resourceManager.addAmount('fire', toBurn);
    }

    // --- Private Hilfsmethoden ---

    private findRecipe(recipeId: string): Recipe | null {
        return RECIPES.find(r => r.id === recipeId) ?? null;
    }

    private hasIngredients(recipe: Recipe): boolean {
        for (const input of recipe.inputs) {
            if (resourceManager.getAmount(input.resourceId) < input.amount) {
                return false;
            }
        }
        return true;
    }
}

export const craftingManager = new CraftingManagerImpl();
