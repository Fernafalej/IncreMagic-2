# AREA_SPEC — Erntegebiet & Ressourcendichte
> Detail-Dokument für `world-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Kernkonzept

Jeder Golem-Pool hat ein eigenes Erntegebiet — einen Kreis mit Radius `harvest_radius`.
Die Golems ernten innerhalb dieses Kreises. Wenn die Ressourcendichte zu gering wird,
wächst der Radius automatisch (Golems wandern weiter). Wenn WorldMana zu niedrig wird,
schrumpft der Radius (Golems sind zu erschöpft für weite Wege).

**Metanarrative:** Der Verwüstungskreis wächst zwangsläufig nach außen. Irgendwann hat
der Spieler die ganze Dimension kahl gefressen — ohne es gemerkt zu haben.

---

## 2. Datenstruktur pro Golem-Pool

```typescript
interface HarvestArea {
    poolClass: GolemClass;
    harvest_radius: number;      // aktueller Radius (kontinuierlich)
    resource_density: number;    // Dichte der Zielressource (Einheit/Fläche)
    growth_rate: number;         // natürliche Regeneration pro Fläche/s
}
```

---

## 3. Formeln

```
effective_area      = π × harvest_radius²
resource_available  = resource_density × effective_area
yield_per_second    = pool.count × resource_density × worldManaFactor × qualityFactor
```

---

## 4. Logistisches Wachstum (Deckel)

Alle Ressourcen haben eine maximale Dichte — zu wenig hat nichts zum Ausbreiten,
zu viel konkurriert mit sich selbst.

```
// Pro Tick, pro HarvestArea:
growth = growth_rate × resource_density × (1 - resource_density / MAX_DENSITY)

// density ≈ 0       → kaum Wachstum (nichts da)
// density ≈ MAX/2   → maximales Wachstum
// density ≈ MAX     → Wachstum gegen null (Konkurrenz)
```

WorldMana regeneriert analog:
```
mana_regen = BASE_REGEN × worldMana × (1 - worldMana / capacity)
```

---

## 5. Radius-Dynamik (kontinuierlich)

```
// Wächst wenn Ressource knapp wird
wenn resource_density < EXPANSION_THRESHOLD:
    deficit = EXPANSION_THRESHOLD - resource_density
    radius_alt = harvest_radius
    harvest_radius += EXPANSION_RATE × deficit × delta

    // Neu erschlossene Fläche hat volle Ausgangsdichte → gemischter Durchschnitt
    new_area = π × (harvest_radius² - radius_alt²)
    resource_density = gewichteter Durchschnitt(alte Dichte, INITIAL_DENSITY, Flächenanteile)

// Schrumpft wenn WorldMana kritisch
wenn worldManaFactor < COLLAPSE_THRESHOLD:
    collapse_force = COLLAPSE_THRESHOLD - worldManaFactor
    harvest_radius -= COLLAPSE_RATE × collapse_force × delta

// Untergrenze
harvest_radius = max(harvest_radius, START_RADIUS)
```

---

## 6. Breath of Life (Sonderfall)

Kein eigenes "plants"-System. Pflanzen **sind** `wood_density` des Holzsammler-Pools.
Details zur Produktionskette → `BREATH_SPEC.md`.

```
ambient_breath = BASE_BREATH + (wood_pool.resource_density × BREATH_FACTOR)
```

---

## 7. Konstanten (Startwerte — Balance ausstehend)

```typescript
const AREA_CONSTANTS = {
    START_RADIUS:         10,
    INITIAL_DENSITY:      1.0,
    MAX_DENSITY:          1.0,

    EXPANSION_THRESHOLD:  0.3,
    EXPANSION_RATE:       0.5,
    COLLAPSE_THRESHOLD:   0.2,
    COLLAPSE_RATE:        0.3,

    GROWTH_RATES: {
        earth: 0.01,
        water: 0.03,
        wood:  0.005,   // langsamste Regeneration → Breath of Life unter Druck
        stone: 0.001,
        reed:  0.008,   // Schilf wächst am Wasser nach
    },

    BASE_BREATH:   0.05,
    BREATH_FACTOR: 0.2,
};
```

---

## 8. Spätere Erweiterungen (nicht jetzt)

- `water_density` + `earth_density` beeinflussen `wood growth_rate`
- Forschung: "Selektive Ernte" — erhöht `EXPANSION_THRESHOLD`
- Forschung: "Pflanzenzucht" — erhöht `growth_rate` für wood
- Gebiete als benannte Entitäten (für Dimensionswechsel und Ruinen)

---

## 9. Abhängigkeiten

```
HarvestArea liest:    GolemManager (pool.count, pool.class)
HarvestArea liest:    WorldMana (worldManaFactor)
HarvestArea schreibt: ResourceManager (yield als Producer)
HarvestArea schreibt: ResourceManager ('breath-of-life' ambient rate)
```
