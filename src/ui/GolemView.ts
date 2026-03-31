import { ticker } from '../core/Ticker.js';
import { GatherPanel } from './panels/GatherPanel.js';
import { CraftingPanel } from './panels/CraftingPanel.js';
import { BreathPanel } from './panels/BreathPanel.js';
import { GolemPoolPanel } from './panels/GolemPoolPanel.js';

export class GolemView {
    private container: HTMLElement;
    private craftingPanel!: CraftingPanel;
    private breathPanel!: BreathPanel;
    private poolPanel!: GolemPoolPanel;
    private boundTick: (delta: number) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.boundTick = this.onTick.bind(this);
        this.build();
        ticker.register(this.boundTick);
    }

    private build(): void {
        this.container.innerHTML = '';
        this.container.className = 'golem-panel';

        // Gather Panel
        const gatherContainer = document.createElement('div');
        new GatherPanel(gatherContainer);
        this.container.appendChild(gatherContainer);
        this.container.appendChild(this.buildDivider());

        // Crafting Panel
        const craftingContainer = document.createElement('div');
        this.craftingPanel = new CraftingPanel(craftingContainer);
        this.container.appendChild(craftingContainer);
        this.container.appendChild(this.buildDivider());

        // Breath Panel
        const breathContainer = document.createElement('div');
        this.breathPanel = new BreathPanel(breathContainer, () => this.onBreathComplete());
        this.container.appendChild(breathContainer);
        this.container.appendChild(this.buildDivider());

        // Pool Panel
        const poolContainer = document.createElement('div');
        this.poolPanel = new GolemPoolPanel(poolContainer);
        this.container.appendChild(poolContainer);
    }

    private buildDivider(): HTMLElement {
        const divider = document.createElement('div');
        divider.className = 'golem-divider';
        return divider;
    }

    private onBreathComplete(): void {
        this.poolPanel.renderList();
    }

    private onTick(_delta: number): void {
        this.craftingPanel.updateButtons();
        this.breathPanel.updateButton();
        this.poolPanel.renderList();
    }

    destroy(): void {
        ticker.unregister(this.boundTick);
    }
}
