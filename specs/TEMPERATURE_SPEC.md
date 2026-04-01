# TEMPERATURE_SPEC — Temperatur, Öfen & Brennmaterial
> Detail-Dokument für `building-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Kernkonzept

Temperatur ist kein globaler Wert — jedes Gebäude hat seine eigene Temperatur.
Brennmaterial und Gebäude haben je eine `max_temp`. Die erreichbare Temperatur
ist das Minimum beider Werte. Besseres Brennmaterial hilft nichts wenn der Ofen
es nicht aushält — und umgekehrt.

---

## 2. Temperatur pro Gebäude

```typescript
interface HeatedBuilding {
    current_temp: number;     // aktuell
    max_temp: number;         // Konstruktionsgrenze des Gebäudes
    fuel_max_temp: number;    // max_temp des eingelegten Brennmaterials
    cooling_rate: number;     // Abkühlung pro Sekunde ohne Brennmaterial
}

// Erreichbare Betriebstemperatur:
operating_temp = min(current_temp, building.max_temp, fuel_max_temp)
```

---

## 3. Gebäude-Progression

| Gebäude | max_temp | Freigeschaltet durch |
|---|---|---|
| Lagerfeuer | ~400°C | Start |
| Lehmofen | ~600°C | Früh (manuell bauen) |
| Steinofen | ~900°C | Forschung |
| Brennofen | ~1200°C | Forschung (Mittels spiel) |
| Hochofen | ~1500°C | Forschung (Spätspiel) |
| Magischer Ofen | ~2000°C+ | Magie-Forschung |

---

## 4. Brennmaterial-Progression

| Material | max_temp | Herkunft |
|---|---|---|
| `firewood` | ~600°C | wood → Klick/Golem aufbereiten |
| `charcoal` | ~900°C | firewood in Ofen → Holzkohle |
| `coal` | ~1100°C | Ernte-Golem (Mittelspiel) |
| `oil` | ~1300°C | Spätspiel |
| Magische Varianten | ~2000°C+ | Magie-Forschung |

**Mischung:** Wird Holz in einen Kohleofen eingelegt, sinkt `fuel_max_temp`
auf das niedrigere Material. Man mischt nicht — das ist eine bewusste Entscheidung.

---

## 5. Golem-Brennen (Übergang von aktuellem System)

Aktuell: `fired-golem` entsteht durch Rezept `raw-golem + fire`.
Zukünftig: `fired-golem` braucht einen Ofen mit Mindesttemperatur.

```
fired-golem Anforderung: operating_temp >= 500°C
// Lehmofen + Feuerholz reicht
```

Höhere Temperaturen → später für andere Materialien nötig (Metall, Kristalle etc.)

---

## 6. Offene Fragen

- [ ] Muss der Spieler aktiv nachheizen (Aktivmechanik) oder
      ist Temperatur passiv durch Brennmaterial definiert?
      → Lagerfeuer am Anfang könnte Nachheizen erfordern, Öfen später nicht mehr
- [ ] Feuer als Ressource: ersetzt durch `firewood`? Oder bleibt `fire` als
      Zwischenstufe (firewood verbrennen → fire → Ofen heizt)?
- [ ] Abkühlzeit: wie schnell kühlt ein Lehmofen ab wenn man aufhört zu heizen?

---

## 7. Abhängigkeiten

```
HeatedBuilding liest:   ResourceManager (Brennmaterial-Vorrat)
HeatedBuilding liest:   GolemManager (Bau-Golems für Gebäude-Errichtung)
HeatedBuilding schreibt: ResourceManager (Brennmaterial verbrauchen, Produkt ausgeben)
HeatedBuilding schreibt: WorldMana (consume pro Tick)
```

---

*Version: 0.1.0 | Zuletzt aktualisiert: 2026-03-31*
