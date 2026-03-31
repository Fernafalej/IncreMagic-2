import { craftingManager } from '../../resources/CraftingManager.js';

export class GatherPanel {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.build();
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-section';

        const title = document.createElement('div');
        title.className = 'golem-section-title';
        title.textContent = '⛏ SAMMELN';
        this.container.appendChild(title);

        const btnRow = document.createElement('div');
        btnRow.className = 'gather-buttons';

        const gatherDefs: Array<{ resourceId: string; label: string; symbol: string }> = [
            { resourceId: 'earth', label: 'Erde',   symbol: '🟤' },
            { resourceId: 'water', label: 'Wasser', symbol: '💧' },
            { resourceId: 'wood',  label: 'Holz',   symbol: '🪵' },
        ];

        for (const def of gatherDefs) {
            const btn = document.createElement('button');
            btn.className = 'gather-btn';
            btn.textContent = `${def.symbol} ${def.label}`;
            btn.title = `${def.label} sammeln (+1)`;
            btn.addEventListener('click', () => {
                craftingManager.gather(def.resourceId);
            });
            btnRow.appendChild(btn);
        }

        // Feuer-Button (Holz verbrennen)
        const burnBtn = document.createElement('button');
        burnBtn.className = 'gather-btn gather-btn--fire';
        burnBtn.textContent = '🔥 Verbrennen';
        burnBtn.title = 'Holz verbrennen (Holz → Feuer)';
        burnBtn.addEventListener('click', () => {
            craftingManager.burn(1);
        });
        btnRow.appendChild(burnBtn);

        this.container.appendChild(btnRow);
    }
}