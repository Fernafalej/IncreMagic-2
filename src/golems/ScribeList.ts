/**
 * ScribeList — Singleton: Ziel-Konfiguration für automatische Golem-Produktion
 *
 * Speichert für jede GolemClass, wie viele Golems im Pool vorhanden sein sollen.
 * ScribeGolem liest diese Liste und erzeugt WRITE-Orders wenn der Pool kleiner ist.
 *
 * Keine Abhängigkeiten zu anderen golems/-Modulen (kein Zirkel).
 */

export interface ScribeTarget {
    cls: string;
    target: number;
}

class ScribeListImpl {
    private targets: Map<string, number> = new Map();

    /**
     * setTarget — setzt das Ziel für eine GolemClass.
     * target < 0 wird auf 0 geklemmt.
     */
    setTarget(cls: string, n: number): void {
        const clamped = Math.max(0, Math.floor(n));
        this.targets.set(cls, clamped);
    }

    /**
     * getTarget — gibt das Ziel für eine GolemClass zurück (0 wenn nicht gesetzt).
     */
    getTarget(cls: string): number {
        return this.targets.get(cls) ?? 0;
    }

    /**
     * getTargets — gibt alle konfigurierten Einträge zurück.
     */
    getTargets(): ScribeTarget[] {
        const result: ScribeTarget[] = [];
        for (const [cls, target] of this.targets.entries()) {
            result.push({ cls, target });
        }
        return result;
    }

    /**
     * serialize — exportiert die targets-Map als plain Object.
     */
    serialize(): object {
        const out: Record<string, number> = {};
        for (const [cls, target] of this.targets.entries()) {
            out[cls] = target;
        }
        return out;
    }

    /**
     * deserialize — stellt targets aus gespeichertem Objekt wieder her.
     */
    deserialize(data: object): void {
        this.targets.clear();
        if (!data || typeof data !== 'object') return;
        for (const [cls, target] of Object.entries(data)) {
            if (typeof target === 'number') {
                this.targets.set(cls, Math.max(0, Math.floor(target)));
            }
        }
    }

    /**
     * reset — leert alle Ziele.
     */
    reset(): void {
        this.targets.clear();
    }
}

// Singleton
export const scribeList = new ScribeListImpl();
