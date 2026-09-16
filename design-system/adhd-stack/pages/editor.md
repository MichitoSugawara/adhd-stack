# Editor Page Overrides

> **PROJECT:** ADHD Stack
> **Generated:** 2026-09-03
> **Page Type:** Chat / Codex Cloud workspace

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- Desktop: 228px rail + chat column. No IDE, no fake file tree.
- Mobile: full-width transcript + docked composer (safe-area).
- Provision strip sits under the header and stays visible while repo/env prepare.

### Spacing Overrides

- Composer and primary actions: min 44×44px, 8px gaps.
- Transcript cards: `--space-md` padding, `--space-sm` between cards.

### Typography Overrides

- Japanese body uses IBM Plex Sans + JP fallbacks.
- JetBrains Mono for repo names, env ids, commands, diffs.

### Color Overrides

- Editor uses Master dark tokens (`#0F172A` / `#1B2336` / `#22C55E`).
- Thinking/work/command/diff cards share one card surface; kind is a mono label, not color-only.

### Component Overrides

- Empty state heading: 「何を作りますか」.
- Status updates use one `role="status"` live region (do not announce every token).
- File / command rail items only appear when Codex produced those artifacts.

---

## Page-Specific Components

### Provision strip

- Show GitHub repo URL, Codex environment id, Pages/Convex URLs, and concrete errors.
- Never invent an environment id.

### Chat cards

- kinds: text, thinking, work, command, diff.
- Diffs show files + additions/deletions. Commands show the command string.

---

## Recommendations

- Stream by polling Codex Cloud and patching Convex rows so the thread updates in place.
- Respect `prefers-reduced-motion`. No typewriter if reduced motion is on.
