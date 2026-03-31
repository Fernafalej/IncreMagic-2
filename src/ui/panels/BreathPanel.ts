import { golemFactory, GolemClass } from '../../golems/GolemFactory.js';
import { golemManager } from '../../golems/GolemManager.js';
import { createOrder } from '../../golems/OrderSystem.js';
import { resourceManager } from '../../resources/ResourceManager.js';

export class BreathPanel {
    private container: HTMLElement;
    private breathBtn: HTMLButtonElement | null = null;
    private breathTypeSelect: HTMLSelectElement | null = null;
    private assignCheckbox: HTMLInputElement | null = null;
    private onBreathComplete?: () => void;

    constructor(container: HTMLElement, onBreathComplete?: () => void) {
        this.container = container;
        this.onBreathComplete = onBreathComplete;
        this.build();
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-section';

        const title = document.createElement('div');
        title.className = 'golem-section-title';
        title.textContent = '💨 HAUCH DES LEBENS';
        this.container.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'breath-desc';
        desc.textContent = 'Gebrannten Golem beleben (1× 🔶 → gewählter Golem-Typ, optional als leerer Golem zwischenspeichern)';
        this.container.appendChild(desc);

        this.breathTypeSelect = document.createElement('select');
        this.breathTypeSelect.className = 'order-queue-add-select';
        this.breathTypeSelect.title = 'Wähle Golem-Klasse für Belebung';
        this.breathTypeSelect.innerHTML = `
            <option value="earth-gatherer">Erdsammler</option>
            <option value="water-gatherer">Wassersammler</option>
            <option value="wood-gatherer">Holzsammler</option>
            <option value="scribe">Scribe</option>
        `;
        this.container.appendChild(this.breathTypeSelect);

        const assignRow = document.createElement('div');
        assignRow.style.margin = '0.4rem 0';
        assignRow.style.display = 'flex';
        assignRow.style.alignItems = 'center';

        this.assignCheckbox = document.createElement('input');
        this.assignCheckbox.type = 'checkbox';
        this.assignCheckbox.id = 'breath-assign-checkbox';
        this.assignCheckbox.checked = true;

        const assignLabel = document.createElement('label');
        assignLabel.htmlFor = 'breath-assign-checkbox';
        assignLabel.style.marginLeft = '0.3rem';
        assignLabel.textContent = 'Automatisch Auftragsvergabe (frühere Logik)';

        assignRow.appendChild(this.assignCheckbox);
        assignRow.appendChild(assignLabel);
        this.container.appendChild(assignRow);

        const btn = document.createElement('button');
        btn.className = 'breath-btn';
        btn.textContent = '💨 Leben einhauchen';
        btn.title = '1× fired-golem verbrauchen → Erdsammler-Golem im Pool';
        btn.addEventListener('click', () => this.onBreathClick());
        this.breathBtn = btn;
        this.container.appendChild(btn);

        this.updateButton();
    }

    private onBreathClick(): void {
        const firedCount = Math.floor(resourceManager.getAmount('fired-golem'));

        if (firedCount <= 0) {
            this.showFeedback('✗ Kein gebrannter Golem verfügbar!', 'error');
            return;
        }

        const created = golemFactory.createFromFiredGolem(1, 1);

        if (created <= 0) {
            this.showFeedback('✗ Erschaffung fehlgeschlagen.', 'error');
            return;
        }

        const golemClass = (this.breathTypeSelect?.value as GolemClass) ?? 'earth-gatherer';
        golemManager.addToPool(golemClass, '', created);

        const assign = this.assignCheckbox?.checked ?? true;
        if (assign) {
            if (golemClass === 'earth-gatherer') {
                golemManager.assignPool('earth-gatherer', createOrder('HARVEST', 'earth', 0, 5));
            } else if (golemClass === 'water-gatherer') {
                golemManager.assignPool('water-gatherer', createOrder('HARVEST', 'water', 0, 5));
            } else if (golemClass === 'wood-gatherer') {
                golemManager.assignPool('wood-gatherer', createOrder('HARVEST', 'wood', 0, 5));
            }
        }

        this.updateButton();
        this.showFeedback(
            `✦ ${created}× ${golemClass} erschaffen${assign ? ' und mit Aufträgen versehen' : ' (leerer Golem).'}!`,
            'success',
        );
        this.onBreathComplete?.();
    }

    private showFeedback(message: string, type: 'success' | 'error'): void {
        // For simplicity, use alert or console, since feedback is local to ritual panel
        // In original, it was shared, but for now, alert
        if (type === 'error') {
            alert(message);
        } else {
            console.log(message);
        }
    }

    updateButton(): void {
        if (!this.breathBtn) return;
        const firedCount = Math.floor(resourceManager.getAmount('fired-golem'));
        const can = firedCount > 0;
        this.breathBtn.disabled = !can;
        this.breathBtn.style.opacity = can ? '1' : '0.5';
        this.breathBtn.style.cursor = can ? 'pointer' : 'not-allowed';
        this.breathBtn.title = can
            ? `${firedCount}× fired-golem verfügbar — klicken zum Beleben`
            : 'Kein gebrannter Golem vorhanden';
    }
}