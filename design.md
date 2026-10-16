# Design — IELTS Writing Hub

A locked design system for IELTS Writing Hub. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre
editorial · Warm academic atelier & personal writing coach desk.

## Macrostructure family
- App pages (Drill & Studio): `05 · Workbench` (diptych writing desk: prompt + input left, coach feedback & comparative models right).
- Content pages (Curriculum & Lessons): `14 · Narrative Workflow` (academic syllabus with DAG progression milestones).
- Dashboard / Home: `15 · Split Studio` (3-stage guided mission desk + practice workstation benches + coach marginalia).

## Theme
- `--color-paper`:       oklch(97.2% 0.012 75) /* Warm parchment */
- `--color-paper-2`:     oklch(95.6% 0.015 75)
- `--color-paper-3`:     oklch(93.8% 0.018 75)
- `--color-surface`:     oklch(98.8% 0.008 75)
- `--color-surface-elev`:oklch(100% 0.004 75)
- `--color-ink`:         oklch(21% 0.016 50)   /* Deep charcoal ink */
- `--color-ink-muted`:   oklch(46% 0.020 50)   /* Muted body text */
- `--color-ink-faint`:   oklch(64% 0.014 50)
- `--color-rule`:        oklch(88% 0.012 75)   /* Tactile hairline divider */
- `--color-border`:      oklch(88% 0.012 75)
- `--color-border-strong`:oklch(76% 0.022 75)
- `--color-accent`:      oklch(56% 0.17 44)    /* Tuscan Terracotta, < 3% viewport */
- `--color-accent-soft`: oklch(94.5% 0.035 44)
- `--color-accent-ink`:  oklch(98% 0.005 75)
- `--color-focus`:       oklch(56% 0.17 44)    /* Instant high-contrast focus ring */
- `--color-moss`:        oklch(52% 0.13 145)   /* Accurate syntax & mastery */
- `--color-brick`:       oklch(52% 0.18 28)    /* Grammar traps & L1 errors */
- `--color-amber`:       oklch(64% 0.14 70)    /* Ongoing review & suggestions */

## Dark Mode Theme
- `--color-paper`:       oklch(16% 0.014 55)   /* Deep cedar night study */
- `--color-surface`:     oklch(19% 0.015 55)
- `--color-ink`:         oklch(93% 0.010 75)   /* Warm ivory ink */
- `--color-accent`:      oklch(68% 0.15 44)    /* Soft terracotta glow */

## Typography
- Display: Lexend, weights 600 & 700, style normal (roman only; no italic headers per Gate 38a)
- Body: Be Vietnam Pro, weights 400, 500, 600
- Monospace: IBM Plex Mono, weights 500 & 600
- Display tracking: -0.02em
- Type scale anchor: clamp(1.85rem, 3.5vw, 2.45rem)
- Measure: 45–68ch for prose

## Spacing
4-point strict named scale. Tokens in `tokens.css`:
`--space-3xs`: 2px, `--space-2xs`: 4px, `--space-xs`: 8px, `--space-sm`: 12px,
`--space-md`: 16px, `--space-lg`: 24px, `--space-xl`: 32px, `--space-2xl`: 48px, `--space-3xl`: 64px.

## Motion
- Easings: `cubic-bezier(0.16, 1, 0.3, 1)` named `--ease-out`
- Reveal pattern: quiet opacity cross-fade (120–200ms)
- Reduced-motion fallback: opacity-only, <= 150ms

## Microinteractions Stance
- Silent success: no intrusive popups or celebratory confetti.
- Focus rings: instant appearance (transition: none), 2px outline with 1px offset.
- Clickable text: white-space: nowrap on buttons and tabs (never two-line wraps).
- Tooltips: 800ms hover delay, 0ms focus delay.

## CTA Voice
- Primary CTA: Solid terracotta fill (`var(--color-accent)`), light warm ink (`var(--color-accent-ink)`), concise verb-first copy ("Check Translation", "Start Session").
- Secondary CTA: Paper background, 1px tactile border (`var(--color-border-strong)`), ink text ("Reset Chunks", "Browse Syllabus").

## Language Policy
- English as Primary Language: All navigation, actions, headings, instructions, grammar terminology, mode toggles, status pills, model answer tags, and feedback headers.
- Pedagogical Vietnamese Exclusively For:
  1. Original Vietnamese prompts to be translated.
  2. Contrastive grammar notes explaining L1 Vietnamese interference (articles, prepositions, tense distinctions, word order).
  3. Vocabulary meaningVi definitions for A2–B1 clarity.

---

## Exports

### tokens.css
```css
:root {
  --color-paper: oklch(97.2% 0.012 75);
  --color-paper-2: oklch(95.6% 0.015 75);
  --color-paper-3: oklch(93.8% 0.018 75);
  --color-surface: oklch(98.8% 0.008 75);
  --color-surface-elev: oklch(100% 0.004 75);
  --color-ink: oklch(21% 0.016 50);
  --color-ink-muted: oklch(46% 0.020 50);
  --color-rule: oklch(88% 0.012 75);
  --color-border: oklch(88% 0.012 75);
  --color-accent: oklch(56% 0.17 44);
  --color-accent-ink: oklch(98% 0.005 75);
  --color-focus: oklch(56% 0.17 44);
  --color-moss: oklch(52% 0.13 145);
  --color-brick: oklch(52% 0.18 28);
  --color-amber: oklch(64% 0.14 70);

  --font-display: 'Lexend', 'Be Vietnam Pro', sans-serif;
  --font-body: 'Be Vietnam Pro', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.35rem;
  --text-display: clamp(1.85rem, 3.5vw, 2.45rem);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
```

### Tailwind v4 `@theme`
```css
@theme {
  --color-paper: oklch(97.2% 0.012 75);
  --color-ink: oklch(21% 0.016 50);
  --color-accent: oklch(56% 0.17 44);
  --font-display: 'Lexend', sans-serif;
  --font-body: 'Be Vietnam Pro', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  --spacing-md: 1rem;
  --text-base: 1rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`
```json
{
  "color": {
    "paper": { "$value": "oklch(97.2% 0.012 75)", "$type": "color" },
    "ink": { "$value": "oklch(21% 0.016 50)", "$type": "color" },
    "accent": { "$value": "oklch(56% 0.17 44)", "$type": "color" },
    "moss": { "$value": "oklch(52% 0.13 145)", "$type": "color" },
    "brick": { "$value": "oklch(52% 0.18 28)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Lexend", "$type": "fontFamily" },
    "body": { "$value": "Be Vietnam Pro", "$type": "fontFamily" },
    "mono": { "$value": "IBM Plex Mono", "$type": "fontFamily" }
  }
}
```

### shadcn/ui CSS variables
```css
:root {
  --background: 97.2% 0.012 75;
  --foreground: 21% 0.016 50;
  --primary: 56% 0.17 44;
  --primary-foreground: 98% 0.005 75;
  --muted: 95.6% 0.015 75;
  --muted-foreground: 46% 0.020 50;
  --border: 88% 0.012 75;
  --input: 88% 0.012 75;
  --ring: 56% 0.17 44;
  --radius: 10px;
}
```
