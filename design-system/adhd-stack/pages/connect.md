# Connect Page Overrides

> **PROJECT:** ADHD Stack
> **Generated:** 2026-09-03 07:02:32
> **Page Type:** Connect / device pairing

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px for the hero + device panel. Service nodes stay in the existing flow shell.
- **Layout:** Hero (centered) → ChatGPT device panel (only while pairing) → four service nodes → editor gate.
- The device panel is the source of truth. Do not hide the user code inside a node identity line.

### Spacing Overrides

- Device panel padding: `--space-lg` / `--space-xl`.
- Action buttons: min 44×44px, at least 8px apart.
- Code block: `--space-lg` vertical padding so the digits stay selectable.

### Typography Overrides

- Japanese headings use the body face (IBM Plex Sans + JP system fallbacks). JetBrains Mono is reserved for the device code, eyebrows, and counts.
- Device code: JetBrains Mono, `clamp(32px, 7vw, 56px)`, weight 600, letter-spacing `0.16em`, `user-select: all`.

### Color Overrides

- Connect-only surfaces use Master dark tokens (`#0F172A` background, `#1B2336` cards, `#22C55E` accent).
- On-accent text is `#0F172A` (not white) so the green CTA meets contrast.
- Do not restyle the editor with these overrides.

### Component Overrides

- Primary CTA: `#22C55E` / `#0F172A`, 44px min height, `cursor: pointer`.
- Secondary CTA: transparent, `#F8FAFC` text, `#475569` border.
- Copy control: Phosphor `Copy` / `Check`, accessible name, no emoji.
- Focus: visible 2px ring (`#FFFFFF` / accent), never `outline: none` without a replacement.

---

## Page-Specific Components

### ChatGPT device panel

- Show after ChatGPT connect starts, on desktop and mobile.
- Huge selectable monospace `user_code`.
- One-click copy (paste must remain possible; do not block selection).
- Primary: open ChatGPT. Secondary: reopen the same page.
- Copy: 「ログインしたらこのコードを入力」. Do not claim `?user_code=` will auto-fill. Login at `auth.openai.com/log-in` drops the query.
- Prefer not auto-opening a popup until this panel is on screen. A popup may open in addition, never instead.
- Keep polling in the background. Offer 「やめる」 so connecting is not a trap.

---

## Recommendations

- Effects: keep Master subtle motion (150–300ms). Skip translate/pulse when `prefers-reduced-motion: reduce`.
- Accessible authentication: the code must stay visible and copyable on this page even if OpenAI wipes the query.
- Touch: 44px targets, 8px gaps. Web focus rings stay visible above the mobile dock.
