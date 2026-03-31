import { craftingManager, Recipe } from '../../resources/CraftingManager.js';
import { resourceManager } from '../../resources/ResourceManager.js';

export class CraftingPanel {
    private container: HTMLElement;
    private craftingRowEls: Map<string, { btn: HTMLButtonElement; statusEl: HTMLElement }> = new Map();

    constructor(container: HTMLElement) {
        this.container = container;
        this.build();
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-section';

        const title = document.createElement('div');
        title.className = 'golem-section-title';
        title.textContent = '⚗ CRAFTING';
        this.container.appendChild(title);

        const recipes = craftingManager.getRecipes();

        for (const recipe of recipes) {
            const row = document.createElement('div');
            row.className = 'crafting-row';

            const displayName = this.getRecipeDisplayName(recipe);

            // Rezept-Info: Zutaten → Ergebnis
            const infoEl = document.createElement('div');
            infoEl.className = 'crafting-info';
            infoEl.title = this.buildRecipeTooltip(recipe);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'crafting-name';
            nameSpan.textContent = displayName;

            const ingredientsEl = document.createElement('span');
            ingredientsEl.className = 'crafting-ingredients';
            ingredientsEl.textContent = recipe.inputs
                .map(i => `${i.amount}× ${i.resourceId}`)
                .join(' + ');

            infoEl.appendChild(nameSpan);
            infoEl.appendChild(ingredientsEl);

            // Status-Anzeige (verfügbare Ressourcen)
            const statusEl = document.createElement('span');
            statusEl.className = 'crafting-status';

            // Craft-Button
            const btn = document.createElement('button');
            btn.className = 'crafting-btn';
            btn.textContent = 'Herstellen';
            btn.addEventListener('click', () => {
                const success = craftingManager.craft(recipe.id);
                if (!success) {
                    // Kurzes visuelles Feedback wenn nicht möglich
                    btn.classList.add('crafting-btn--fail');
                    setTimeout(() => btn.classList.remove('crafting-btn--fail'), 400);
                }
                this.updateButtons();
            });

            this.craftingRowEls.set(recipe.id, { btn, statusEl });

            row.appendChild(infoEl);
            row.appendChild(statusEl);
            row.appendChild(btn);
            this.container.appendChild(row);
        }

        this.updateButtons();
    }

    private getRecipeDisplayName(recipe: Recipe): string {
        const labels: Record<string, { name: string; symbol: string }> = {
            'clay':        { name: 'Lehm formen',        symbol: '🧱' },
            'raw-golem':   { name: 'Roh-Golem formen',   symbol: '🗿' },
            'fired-golem': { name: 'Golem brennen',       symbol: '🔶' },
            'paper':       { name: 'Papier herstellen',   symbol: '📄' },
        };

        const labelDef = labels[recipe.id];
        return labelDef ? `${labelDef.symbol} ${labelDef.name}` : recipe.id;
    }

    private buildRecipeTooltip(recipe: Recipe): string {
        const inputs = recipe.inputs
            .map(i => `${i.amount}× ${i.resourceId}`)
            .join(' + ');
        return `${inputs} → ${recipe.output.amount}× ${recipe.output.resourceId}`;
    }

    updateButtons(): void {
        const recipes = craftingManager.getRecipes();

        for (const recipe of recipes) {
            const els = this.craftingRowEls.get(recipe.id);
            if (!els) continue;

            const can = craftingManager.canCraft(recipe.id);
            els.btn.disabled = !can;
            els.btn.style.opacity = can ? '1' : '0.5';
            els.btn.style.cursor = can ? 'pointer' : 'not-allowed';

            // Status: aktuell verfügbare Zutaten
            const parts = recipe.inputs.map(ing => {
                const have = Math.floor(resourceManager.getAmount(ing.resourceId));
                return `${have}/${ing.amount}`;
            });
            els.statusEl.textContent = parts.join(' ');
            els.statusEl.style.color = can ? '#4ecdc4' : '#5a4020';
        }
    }
}