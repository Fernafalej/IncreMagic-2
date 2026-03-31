import { golemFactory } from '../../golems/GolemFactory.js';
import { golemManager } from '../../golems/GolemManager.js';
import { createOrder } from '../../golems/OrderSystem.js';

// Ritual-Elemente in verbindlicher Reihenfolge
type RitualElement = 'earth' | 'water' | 'fire' | 'air';

interface ElementDef {
    key: RitualElement;
    label: string;
    symbol: string;
}

const RITUAL_ELEMENTS: readonly ElementDef[] = [
    { key: 'earth', label: 'Erde',  symbol: '⛰' },
    { key: 'water', label: 'Wasser', symbol: '💧' },
    { key: 'fire',  label: 'Feuer',  symbol: '🔥' },
    { key: 'air',   label: 'Luft',   symbol: '💨' },
];

// Anzeigedauer für Feedback-Nachrichten in ms
const FEEDBACK_DURATION_MS = 1800;

export class RitualPanel {
    private container: HTMLElement;
    private progressSteps: HTMLElement[] = [];
    private feedbackEl: HTMLElement | null = null;
    private currentSequence: RitualElement[] = [];
    private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
    private onRitualComplete?: () => void;

    constructor(container: HTMLElement, onRitualComplete?: () => void) {
        this.container = container;
        this.onRitualComplete = onRitualComplete;
        this.build();
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-section';

        const ritualTitle = document.createElement('div');
        ritualTitle.className = 'golem-section-title';
        ritualTitle.textContent = '⬟ GOLEM-RITUAL';
        this.container.appendChild(ritualTitle);

        // Fortschritts-Anzeige
        const progressEl = document.createElement('div');
        progressEl.className = 'ritual-progress';
        this.progressSteps = [];

        for (const def of RITUAL_ELEMENTS) {
            const step = document.createElement('span');
            step.className = 'ritual-step';
            step.dataset['element'] = def.key;
            step.textContent = `${def.symbol} ${def.label}`;
            progressEl.appendChild(step);
            this.progressSteps.push(step);

            if (def.key !== 'air') {
                const arrow = document.createElement('span');
                arrow.className = 'ritual-arrow';
                arrow.textContent = '→';
                progressEl.appendChild(arrow);
            }
        }
        this.container.appendChild(progressEl);

        // Element-Buttons
        const buttonRow = document.createElement('div');
        buttonRow.className = 'ritual-buttons';

        for (const def of RITUAL_ELEMENTS) {
            const btn = document.createElement('button');
            btn.className = 'ritual-btn';
            btn.dataset['element'] = def.key;
            btn.title = def.label;
            btn.textContent = `${def.symbol} ${def.label}`;
            btn.addEventListener('click', () => this.onElementClick(def.key));
            buttonRow.appendChild(btn);
        }
        this.container.appendChild(buttonRow);

        // Feedback-Bereich
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'ritual-feedback';
        feedbackEl.textContent = '';
        this.feedbackEl = feedbackEl;
        this.container.appendChild(feedbackEl);
    }

    private onElementClick(element: RitualElement): void {
        const expected = RITUAL_ELEMENTS[this.currentSequence.length];

        if (element !== expected.key) {
            this.currentSequence = [];
            this.updateProgressDisplay();
            this.showFeedback(
                `✗ Falsch! Beginne mit ${RITUAL_ELEMENTS[0].symbol} ${RITUAL_ELEMENTS[0].label}`,
                'error',
            );
            return;
        }

        this.currentSequence.push(element);
        this.updateProgressDisplay();

        if (this.currentSequence.length === RITUAL_ELEMENTS.length) {
            this.completeRitual();
        }
    }

    private completeRitual(): void {
        const golem = golemFactory.create([...this.currentSequence]);

        if (golem === null) {
            this.currentSequence = [];
            this.updateProgressDisplay();
            this.showFeedback('✗ Ritual fehlgeschlagen.', 'error');
            return;
        }

        // Ergebnis des Rituals landet im Pool-System (nicht im alten Einzelgolem-Pfad)
        golemManager.addToPool(golem.class, '', 1);
        golemManager.assignPool(golem.class, createOrder('HARVEST', 'earth', 0, 5));

        this.currentSequence = [];
        this.updateProgressDisplay();
        this.showFeedback('✦ Golem erschaffen! +1 Erdsammler im Pool.', 'success');
        this.onRitualComplete?.();
    }

    private updateProgressDisplay(): void {
        for (let i = 0; i < this.progressSteps.length; i++) {
            const step = this.progressSteps[i];
            if (i < this.currentSequence.length) {
                step.classList.add('done');
                step.classList.remove('pending');
            } else if (i === this.currentSequence.length) {
                step.classList.add('pending');
                step.classList.remove('done');
            } else {
                step.classList.remove('done', 'pending');
            }
        }
    }

    private showFeedback(message: string, type: 'success' | 'error'): void {
        if (!this.feedbackEl) return;

        if (this.feedbackTimer !== null) {
            clearTimeout(this.feedbackTimer);
            this.feedbackTimer = null;
        }

        this.feedbackEl.textContent = message;
        this.feedbackEl.className = `ritual-feedback ritual-feedback--${type}`;

        this.feedbackTimer = setTimeout(() => {
            if (this.feedbackEl) {
                this.feedbackEl.textContent = '';
                this.feedbackEl.className = 'ritual-feedback';
            }
            this.feedbackTimer = null;
        }, FEEDBACK_DURATION_MS);
    }

    destroy(): void {
        if (this.feedbackTimer !== null) {
            clearTimeout(this.feedbackTimer);
        }
    }
}