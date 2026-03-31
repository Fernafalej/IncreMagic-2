/**
 * OrderQueueView — UI für die globale OrderQueue
 *
 * Zeigt alle Einträge in der Queue an, mit Priorität, Typ/Ziel, repeat-Flag.
 * Aktionen: hinzufügen, entfernen, Priorität ändern, repeat umschalten.
 * Fortschrittsbalken für den vordersten Eintrag (Scribe-Fortschritt).
 */

import { ticker } from '../core/Ticker.js';
import { orderQueue, OrderRequest, OrderType, createOrderRequest } from '../golems/OrderSystem.js';
import { scribeGolem } from '../golems/ScribeGolem.js';

export class OrderQueueView {
    private container: HTMLElement;
    private queueListEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private addFormEl: HTMLElement | null = null;
    private boundTick: (delta: number) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.boundTick = this.onTick.bind(this);
        this.build();
        ticker.register(this.boundTick);
    }

    // --- Aufbau des DOM ---

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'order-queue-panel';

        const title = document.createElement('div');
        title.className = 'order-queue-title';
        title.textContent = '📜 AUfTRAGS-QUEUE';
        this.container.appendChild(title);

        // Fortschrittsbalken für Scribe
        this.progressEl = document.createElement('div');
        this.progressEl.className = 'order-queue-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'order-queue-progress-bar';
        this.progressEl.appendChild(progressBar);
        this.container.appendChild(this.progressEl);

        // Queue-Liste
        this.queueListEl = document.createElement('div');
        this.queueListEl.className = 'order-queue-list';
        this.container.appendChild(this.queueListEl);

        // Hinzufügen-Formular
        this.addFormEl = document.createElement('div');
        this.addFormEl.className = 'order-queue-add-form';
        this.container.appendChild(this.addFormEl);
        this.buildAddForm();

        // Initial rendern
        this.renderQueue();
        this.updateProgress();
    }

    private buildAddForm(): void {
        if (!this.addFormEl) return;

        // Typ-Auswahl
        const typeSelect = document.createElement('select');
        typeSelect.className = 'order-queue-add-select';
        const types: Array<{ value: OrderType; label: string }> = [
            { value: 'HARVEST', label: 'Ernten' },
            { value: 'CRAFT', label: 'Herstellen' },
            { value: 'WRITE', label: 'Schreiben' },
            { value: 'RESEARCH', label: 'Forschen' },
            { value: 'BUILD', label: 'Bauen' },
        ];
        for (const type of types) {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            typeSelect.appendChild(option);
        }

        // Ziel-Input
        const targetInput = document.createElement('input');
        targetInput.className = 'order-queue-add-input';
        targetInput.type = 'text';
        targetInput.placeholder = 'Ziel';

        // Hinzufügen-Button
        const addBtn = document.createElement('button');
        addBtn.className = 'order-queue-add-btn';
        addBtn.textContent = '+';
        addBtn.title = 'Auftrag hinzufügen';
        addBtn.addEventListener('click', () => {
            const type = typeSelect.value as OrderType;
            const target = targetInput.value.trim();
            if (target) {
                const request = createOrderRequest(type, target, 0, 5, false);
                orderQueue.enqueue(request);
                targetInput.value = '';
                this.renderQueue();
            }
        });

        this.addFormEl.appendChild(typeSelect);
        this.addFormEl.appendChild(targetInput);
        this.addFormEl.appendChild(addBtn);
    }

    // --- Rendering ---

    private renderQueue(): void {
        if (!this.queueListEl) return;

        this.queueListEl.innerHTML = '';

        const requests = orderQueue.getAll();
        if (requests.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'order-queue-empty';
            empty.textContent = 'Keine Aufträge in der Queue';
            this.queueListEl.appendChild(empty);
            return;
        }

        for (const req of requests) {
            const row = this.buildQueueRow(req);
            this.queueListEl.appendChild(row);
        }
    }

    private buildQueueRow(req: OrderRequest): HTMLElement {
        const row = document.createElement('div');
        row.className = 'order-queue-row';

        // Priorität
        const priorityEl = document.createElement('div');
        priorityEl.className = 'order-queue-priority';
        priorityEl.textContent = req.priority.toString();
        row.appendChild(priorityEl);

        // Info: Typ + Ziel
        const infoEl = document.createElement('div');
        infoEl.className = 'order-queue-info';
        infoEl.textContent = `${req.type} ${req.target}`;
        if (req.quantity > 0) {
            infoEl.textContent += ` (${req.quantity})`;
        }
        row.appendChild(infoEl);

        // Repeat-Flag
        const repeatEl = document.createElement('div');
        repeatEl.className = `order-queue-repeat ${req.repeat ? '' : '--off'}`;
        repeatEl.textContent = req.repeat ? '↻' : '—';
        repeatEl.title = req.repeat ? 'Wiederholt sich' : 'Einmalig';
        repeatEl.style.cursor = 'pointer';
        repeatEl.addEventListener('click', () => {
            orderQueue.toggleRepeat(req.id);
            this.renderQueue();
        });
        row.appendChild(repeatEl);

        // Aktionen
        const actionsEl = document.createElement('div');
        actionsEl.className = 'order-queue-actions';

        // Priorität erhöhen
        const upBtn = document.createElement('button');
        upBtn.className = 'order-queue-btn';
        upBtn.textContent = '↑';
        upBtn.title = 'Priorität erhöhen';
        upBtn.addEventListener('click', () => {
            const newPriority = Math.min(10, req.priority + 1);
            orderQueue.setPriority(req.id, newPriority);
            this.renderQueue();
        });
        actionsEl.appendChild(upBtn);

        // Priorität verringern
        const downBtn = document.createElement('button');
        downBtn.className = 'order-queue-btn';
        downBtn.textContent = '↓';
        downBtn.title = 'Priorität verringern';
        downBtn.addEventListener('click', () => {
            const newPriority = Math.max(1, req.priority - 1);
            orderQueue.setPriority(req.id, newPriority);
            this.renderQueue();
        });
        actionsEl.appendChild(downBtn);

        // Entfernen
        const removeBtn = document.createElement('button');
        removeBtn.className = 'order-queue-btn order-queue-btn--remove';
        removeBtn.textContent = '×';
        removeBtn.title = 'Auftrag entfernen';
        removeBtn.addEventListener('click', () => {
            orderQueue.remove(req.id);
            this.renderQueue();
        });
        actionsEl.appendChild(removeBtn);

        row.appendChild(actionsEl);

        return row;
    }

    private updateProgress(): void {
        if (!this.progressEl) return;

        const progress = scribeGolem.getWriteProgress();
        const percentage = Math.min(100, (progress % 1) * 100); // Fraktionaler Fortschritt

        const bar = this.progressEl.querySelector('.order-queue-progress-bar') as HTMLElement;
        if (bar) {
            bar.style.width = `${percentage}%`;
        }
    }

    // --- Ticker ---

    private onTick(_delta: number): void {
        this.updateProgress();
    }
}