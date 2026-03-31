# I18N_SPEC — Internationalisierung
> Detail-Dokument für `i18n-dev`. Lies zuerst `INCREMAGIC_MASTER.md`.

---

## 1. Prinzip

Alle sichtbaren Texte nur über `t('key')` — nie hardcoded Strings im UI-Code.

---

## 2. Struktur

```
src/i18n/
├── index.ts       — t() Funktion, Sprache laden/wechseln
├── de.json        — Deutsch (Standard)
└── en.json        — Englisch
```

---

## 3. Interface

```typescript
// Nutzung überall im UI:
import { t } from '../i18n/index.js';
t('golem.earth-gatherer')   // → "Erdsammler"
t('resource.clay')          // → "Lehm"
t('ui.harvest')             // → "Ernten"

// Sprache wechseln:
setLanguage('en');
```

---

## 4. JSON-Format

```json
{
  "golem.earth-gatherer": "Erdsammler",
  "resource.clay": "Lehm",
  "ui.harvest": "Ernten",
  "ui.scribe.shares": "Golem-Anteile",
  "research.pattern-recognition": "Muster-Erkennung"
}
```

**Schlüssel-Konvention:** `kategorie.name` — z.B. `golem.*`, `resource.*`, `ui.*`, `research.*`, `lore.*`

---

## 5. Fallback

Unbekannter Schlüssel → Schlüssel selbst zurückgeben (kein Crash, kein leerer Text).

---

## 6. Blackbox-Interface

**i18n gibt nach außen:**
- `t(key: string): string`
- `setLanguage(lang: string): void`
- `getAvailableLanguages(): string[]`

---

*Version: 0.1.0*
