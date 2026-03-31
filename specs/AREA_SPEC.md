# AREA_SPEC — Erntegebiet & Ressourcendichte
> Detail-Dokument für `world-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Kernkonzept

Jeder Golem-Pool hat ein eigenes Erntegebiet — einen Kreis mit Radius `harvest_radius`.
Die Golems ernten innerhalb dieses Kreises. Wenn die Ressourcendichte zu gering wird,
wächst der Radius automatisch (Golems wandern weiter). Wenn WorldMana zu niedrig wird,
schrumpft der Radius (Golems sind zu erschöpft für weite Wege).

Jede Ressource hat eine natürliche Wachstumsrate pro Fläche. Der Einbruch kommt wenn
der Radius schneller wächst als die Natur nachwachsen kann.

**Metanarrative:** Der Verwüstungskreis wächst zwangsläufig nach außen. Irgendwann hat
der Spieler die ganze Dimension kahl gefressen — ohne es gemerkt zu haben.

---

## 2. Datenstruktur pro Golem-Pool

```typescript
interface HarvestArea {
    poolClass: GolemClass;       // Zugehöriger Pool
    harvest_radius: number;      // Aktueller Radius (kontinuierlich)
    resource_density: number;    // Dichte der Zielressource (Einheit/Fläche)
    growth_rate: number;         // Natürliche Regeneration pro Fläche/s
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

## 4. Radius-Dynamik (kontinuierlich)

```
// Wächst wenn Ressource knapp wird
wenn resource_density < EXPANSION_THRESHOLD:
    deficit = EXPANSION_THRESHOLD - resource_density
    harvest_radius += EXPANSION_RATE × deficit × delta
    // Neu erschlossene Fläche bekommt volle Ausgangsdichte
    new_area = π × (harvest_radius_neu² - harvest_radius_alt²)
    resource_density += (new_area × INITIAL_DENSITY) / effective_area_neu

// Schrumpft wenn WorldMana kritisch wird
wenn worldManaFactor < COLLAPSE_THRESHOLD:
    collapse_force = COLLAPSE_THRESHOLD - worldManaFactor
    harvest_radius -= COLLAPSE_RATE × collapse_force × delta

// Untergrenze
harvest_radius = max(harvest_radius, START_RADIUS)
```

**Spielgefühl:** Expansion bringt kurz frische Dichte → kurzer Ertrags-Boom →
dann wieder Erschöpfung → nächste Expansion. Das ist der natürliche Puls des Spiels.

---

## 5. Ressourcen-Regeneration

```
// Pro Tick, pro Pool
resource_density += growth_rate × delta
resource_density = min(resource_density, MAX_DENSITY)
```

Jede Ressource hat eine eigene `growth_rate`. Erde wächst langsam nach,
Wasser füllt sich schneller, Holz am langsamsten.

---

## 6. Breath of Life (Sonderfall)

Kein eigenes "plants"-System. Pflanzen **sind** `wood_density` des Holzsammler-Pools.

```
breath_per_second = BASE_BREATH + (wood_pool.resource_density × BREATH_FACTOR)
```

- `BASE_BREATH` — fix, klein, reicht für langsamen Golem-Takt (auch ohne Pflanzen)
- `BREATH_FACTOR` — Multiplikator für Pflanzendichte

**Kausalität:** Holzsammler ernten → `wood_density` sinkt → `breath_per_second` sinkt →
Golem-Erschaffung verlangsamt sich → Holzsammler-Pool wächst langsamer → Radius wächst →
neue Fläche → kurze Erholung. Das ist der Herzschlag des Spiels.

`breath-of-life` akkumuliert als Ressource und wird beim Golem-Animieren verbraucht
(1 Atemzug pro Golem-Erschaffung).

---

## 7. Konstanten (Startwerte — Balance ausstehend)

```typescript
const AREA_CONSTANTS = {
    START_RADIUS:          10,
    INITIAL_DENSITY:       1.0,   // Volle Dichte in unberührtem Gebiet
    MAX_DENSITY:           1.0,

    EXPANSION_THRESHOLD:   0.3,   // 30% Restdichte → Expansion beginnt
    EXPANSION_RATE:        0.5,
    COLLAPSE_THRESHOLD:    0.2,   // WorldManaFactor < 20% → Schrumpfung
    COLLAPSE_RATE:         0.3,

    // growth_rate pro Ressource (Einheit/Fläche/s)
    GROWTH_RATES: {
        earth: 0.01,
        water: 0.03,
        wood:  0.005,   // Holz wächst am langsamsten → Breath of Life unter Druck
        stone: 0.001,
    },

    BASE_BREATH:    0.05,   // Atemzüge/s aus der Ferne (Minimum)
    BREATH_FACTOR:  0.2,    // Atemzüge/s pro Einheit wood_density
};
```

---

## 8. Spätere Erweiterungen (nicht jetzt)

- `water_density` + `earth_density` beeinflussen `wood growth_rate`
- Forschung: "Selektive Ernte" — erhöht `EXPANSION_THRESHOLD`, Golems lassen mehr stehen
- Forschung: "Pflanzenzucht" — erhöht `growth_rate` für wood
- Forschung: "Kartographie" — macht `harvest_radius` in der UI sichtbar
- Gebiete als benannte Entitäten (für Dimensionswechsel und Ruinen)

---

## 9. Abhängigkeiten

```
HarvestArea liest:   GolemManager (pool.count, pool.class)
HarvestArea liest:   WorldMana (worldManaFactor)
HarvestArea schreibt: ResourceManager (yield als Producer registrieren)
HarvestArea schreibt: ResourceManager ('breath-of-life' Producer)
```

`HarvestArea` ersetzt die direkte `addProducer`-Logik in `GolemManager`.
Golems produzieren nicht mehr direkt — sie definieren einen Pool,
`HarvestArea` berechnet den tatsächlichen Ertrag.
