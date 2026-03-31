import { golemManager, GolemPool } from '../../golems/GolemManager.js';

// Golem-Klassen-Labels für Pool-Anzeige
const POOL_CLASS_LABELS: Readonly<Record<string, string>> = {
    'HARVEST':        'Ernte-Golem',
    'BUILD':          'Bau-Golem',
    'SCRIBE':         'Schreiber-Golem',
    'RESEARCH':       'Forschungs-Golem',
    'earth-gatherer': 'Erdsammler-Golem',
    'water-gatherer': 'Wassersammler-Golem',
    'wood-gatherer':  'Holzsammler-Golem',
};

export class GolemPoolPanel {
    private container: HTMLElement;
    private golemListEl: HTMLElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.build();
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-section';

        const listTitle = document.createElement('div');
        listTitle.className = 'golem-section-title';
        listTitle.textContent = '☿ GOLEM-POOLS';
        this.container.appendChild(listTitle);

        const golemListEl = document.createElement('div');
        golemListEl.className = 'golem-list';
        this.golemListEl = golemListEl;
        this.container.appendChild(golemListEl);

        this.renderList();
    }

    renderList(): void {
        if (!this.golemListEl) return;

        const pools: GolemPool[] = golemManager.getPool();

        if (pools.length === 0) {
            this.golemListEl.innerHTML =
                '<div class="golem-empty">Keine Golems im Pool.</div>';
            return;
        }

        this.golemListEl.innerHTML = '';

        for (const pool of pools) {
            const row = document.createElement('div');
            row.className = 'golem-row';

            // Anzahl + Klassen-Label
            const classLabel = POOL_CLASS_LABELS[pool.class] ?? pool.class;
            const variantSuffix = pool.variant ? ` (${pool.variant})` : '';

            const countEl = document.createElement('span');
            countEl.className = 'golem-pool-count';
            countEl.textContent = `${pool.count}×`;

            const nameEl = document.createElement('span');
            nameEl.className = 'golem-pool-name';
            nameEl.textContent = `${classLabel}${variantSuffix}`;

            // Auftrag
            const orderEl = document.createElement('span');
            orderEl.className = 'golem-order';
            if (pool.order !== null) {
                orderEl.textContent = `→ ${pool.order.target}`;
                orderEl.classList.add('golem-order--active');
            } else {
                orderEl.textContent = 'Kein Auftrag';
            }

            row.appendChild(countEl);
            row.appendChild(nameEl);
            row.appendChild(orderEl);
            this.golemListEl.appendChild(row);
        }
    }
}