# Domain Pitfalls

**Domain:** BMS Dashboard — Front-End Reverse Engineering + Rebrand
**Researched:** 2026-06-27

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Rebranding Before Functional Parity

**What goes wrong:** Developer starts changing colors, fonts, and layout while still implementing features from the original. The clone ends up as a hybrid — neither matching the original nor having a coherent new identity.

**Why it happens:** Rebranding is more fun than cloning. Adding a new color palette or glassmorphism cards feels like progress, while replicating someone else's design feels like tedious work. Psychological bias toward creative work over replication.

**Consequences:**
- VAL-01 (A/B testing) becomes impossible — can't compare a styled clone to the original
- Bugs in the clone are indistinguishable from intentional visual changes
- If the clone drifts from the original behavior, there's no baseline to revert to
- Stakeholder: "This doesn't look like the original AND it doesn't look like the new design either"

**Prevention:** Enforce a hard phase boundary. No CSS color changes, no new fonts, no layout modifications until ALL REPL-* requirements pass verification. Use ESLint rules to prevent importing brand-specific constants in clone phase files. Use git branches: `phase/clone` and `phase/brand` with strict no-cross-contamination policy.

**Detection:** If any file in `src/` imports `BRAND_COLORS` or references "emerald", "orange", "Poppins", "glassmorphism" before Phase 5 begins, stop and revert.

### Pitfall 2: Using React Context for Real-Time State

**What goes wrong:** Developer uses `React.createContext` + `useReducer` for the global sensor/alarm state. Every sensor update (every 1-2 seconds) triggers a full re-render of every component in the Context tree — 20+ components re-rendering 30-60 times per minute.

**Why it happens:** Context is the built-in React solution for prop drilling. Developers reach for it first because it doesn't require an external library. Tutorials and AI assistants often recommend Context for "global state."

**Consequences:**
- Dashboard becomes sluggish; KPI cards flicker, charts jitter
- Browser tab consumes 100% CPU — fans spin up, battery drains
- User interactions (toggles, sliders) feel laggy because main thread is saturated with re-renders
- On mobile: app becomes completely unusable within 5 minutes

**Prevention:** Use Zustand from day one. Configure Zustand's `devtools` middleware so Redux DevTools can show exactly which components re-render on which state changes. Enforce via lint rule: `no-restricted-imports` banning `createContext` for state management (allow it for theme/config contexts only).

**Detection:** Open React DevTools profiler. If the flame graph shows widespread re-renders on every tick, Context is being misused for real-time state. Also: Chrome Performance tab showing >30% scripting time during idle dashboard viewing.

### Pitfall 3: Reverse Engineering Without Systematic Documentation

**What goes wrong:** Developer explores the original site in DevTools, mentally notes findings, and starts coding. Three days later, they can't remember the exact data structure for alarm objects, or the precise interval for temperature updates. They re-extract data but get slightly different values — the clone drifts.

**Why it happens:** DevTools exploration feels like "doing work." Writing down findings feels like overhead. The brain's working memory convinces us "I'll remember this" — but details fade within hours.

**Consequences:**
- Clone behavior doesn't match original (different intervals, different random ranges, different alarm thresholds)
- VAL-01 (A/B testing) fails — the systems behave differently
- Time wasted re-extracting data that was already discovered
- No artifact for other developers (or future self) to reference

**Prevention:** Create a `RECON.md` document DURING extraction (not after). Screenshot every DevTools panel. Copy-paste every JSON blob from localStorage. Record every `setInterval` timing. Document every `Math.random()` coefficient. This document BECOMES the specification for the clone phase. Make it detailed enough that another developer could build the clone without ever seeing the original.

**Detection:** During RECON review — if `RECON.md` has fewer than 500 lines of structured data, the extraction was likely incomplete. If data structures are described in prose ("it looks like it uses an array of objects") rather than TypeScript interfaces, it's not precise enough.

### Pitfall 4: Assuming the Original Uses a Specific Framework Before Verification

**What goes wrong:** Developer assumes the SPA uses React (because "most SPAs do"), scaffolds a React project, writes 2,000 lines of code, then discovers the original uses Vue. All code must be rewritten.

**Why it happens:** Confirmation bias. React developers see React patterns everywhere. Vue developers see Vue patterns. Without Wappalyzer/DevTools verification, the assumption goes unchallenged.

**Consequences:**
- 2-4 weeks of wasted development time (complete rewrite)
- Loss of momentum and motivation
- Bundle size comparison (VAL-04) becomes meaningless — comparing React bundle to Vue bundle

**Prevention:** Phase 1 (RECON) MUST confirm the framework before a single line of clone code is written. Use Wappalyzer first (quick check). Then open DevTools → Elements → search for React/Vue-specific DOM attributes (`data-reactroot`, `__vue_app__`, `_reactRootContainer`). Then Sources → search bundles for framework-specific imports. Only proceed with the confirmed framework.

**Detection:** RECON Phase exit criteria: framework identity confirmed with ≥2 independent detection methods. If only one method or assumptions are used, RECON is incomplete.

### Pitfall 5: Ignoring localStorage Structures

**What goes wrong:** Developer focuses on UI replication but ignores the persistence layer. The clone saves state with different keys, different structures, or misses persisted data entirely. When the app reloads, state is lost or corrupted.

**Why it happens:** localStorage is invisible during normal interaction. It's easy to forget that the original persists user preferences, last-viewed page, filter states, etc. Network tab shows API calls; localStorage requires explicitly opening Application tab.

**Consequences:**
- App "forgets" user preferences on reload (theme, language, sidebar state)
- VAL-02 (storage test) fails — different structures compared to original
- If the original loads persisted state on startup and transforms it, the clone's initial render will be wrong

**Prevention:** Open DevTools → Application → Storage → localStorage BEFORE any other work. Document every key-value pair. Note data types (string, JSON, base64). Note when values change (on every sensor update? Only on explicit save?). Build the clone's persistence layer from this documentation.

**Detection:** Override `localStorage.setItem` and `localStorage.getItem` with wrappers that log all operations during a session with the original. Compare key list and value schemas with the clone.

## Moderate Pitfalls

### Pitfall 6: Chart Library Mismatch

**What goes wrong:** The original uses ECharts (canvas-based, declarative option objects), but the clone uses Recharts (SVG-based, React components). The charts look similar but behave differently — tooltip positioning, animation curves, responsive behavior, zoom/pan.

**Why it happens:** "Recharts is better for React" — true for greenfield, but false for reverse engineering. The clone must match the original's EXACT chart behavior.

**Consequences:** Charts look "almost right" but fail side-by-side comparison (VAL-01). Subtle differences in tooltip formatting, axis label rotation, legend interaction, or data point markers accumulate.

**Prevention:** RECON must identify the chart library. If it's ECharts, use ECharts (even with React — `echarts-for-react` wrapper exists). If it's Chart.js, use Chart.js + `react-chartjs-2`. Matching the library matters more than React-idiomatic patterns. The STACK.md decision matrix handles this.

**Detection:** During A/B testing, overlay screenshots at 50% opacity — chart mismatches are immediately visible.

### Pitfall 7: Ignoring CSS Details

**What goes wrong:** Developer uses Tailwind utility classes that approximate but don't exactly match the original's CSS. Padding is 4px off. Border radius is 2px different. Shadows don't match. These accumulate across 50+ components.

**Why it happens:** "Close enough" mentality. Tailwind's spacing scale (4px increments) may not match the original's pixel values. Extracting exact CSS from DevTools is tedious.

**Consequences:** Clone looks "wrong" even if functionally correct. Side-by-side comparison reveals dozens of minor visual discrepancies. The brand phase adds its own changes on top of already-incorrect base styling.

**Prevention:** Use DevTools → Elements → Computed Styles to extract exact values. Use Tailwind's arbitrary values: `p-[13px]`, `rounded-[7px]`. Override Tailwind's default spacing scale if needed to match the original. The goal is pixel-perfect replication, not Tailwind-convenient replication.

**Detection:** Pixel-by-pixel screenshot overlay comparison (VAL-01). Every 1px difference is a bug.

### Pitfall 8: Not Capturing Network Timing

**What goes wrong:** Developer sees mock data, assumes instant generation, and doesn't replicate network latency. The clone shows data instantly; the original showed a 500ms "loading" spinner when switching between sections.

**Why it happens:** Mock data feels like it should be instant. But the original may have intentionally simulated network delays for realism.

**Consequences:** The clone feels "too fast" — suspiciously responsive compared to the original. Any loading state UI in the original is never rendered, so those components are never tested.

**Prevention:** During RECON, record every `setTimeout` and `setInterval` value. If the original has `fetch()` calls to local mock endpoints with simulated 300ms delays, replicate those delays in the clone. Use `await new Promise(r => setTimeout(r, 300))` before Zustand state updates.

## Minor Pitfalls

### Pitfall 9: Portuguese Encoding Issues

**What goes wrong:** Special characters (ã, õ, ç, ê, á) render as � or mojibake. Dayjs `pt-br` locale not loaded, dates display in English.

**Why it happens:** Missing locale imports, wrong charset meta tag, or incorrect string escaping in TypeScript.

**Prevention:** Add `<meta charset="UTF-8">` to `index.html`. Import `dayjs/locale/pt-br` and call `dayjs.locale('pt-br')` once at app startup. All UI strings in Portuguese — no English fallbacks.

### Pitfall 10: Over-Animating the Rebrand

**What goes wrong:** Developer discovers framer-motion and adds animations everywhere — every card flies in, every chart pulses, every page transition has a 500ms spring animation. The app becomes a motion sickness simulator.

**Why it happens:** New tool enthusiasm. framer-motion makes it easy to add animations; restraint is harder than excess.

**Prevention:** Define animation constraints before Phase 5:
- Enter animations: max 300ms
- Hover effects: max 200ms
- Chart transitions: Recharts defaults (400ms) are sufficient
- No scroll-triggered animations (performance killer)
- Respect `prefers-reduced-motion` media query — disable all animations for accessibility

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| RECON — Framework detection | Assuming React/Vue without verification (Pitfall 4) | Use ≥2 detection methods; document evidence in RECON.md |
| RECON — Data extraction | Memory-based documentation (Pitfall 3) | Write RECON.md during extraction; screenshot everything; copy-paste every JSON blob |
| RECON — State persistence | Ignoring localStorage (Pitfall 5) | Open Application tab before anything else; log all storage operations |
| CLONE — State management | Using React Context (Pitfall 2) | Enforce Zustand via lint rules; configure Redux DevTools from day one |
| CLONE — Charting | Wrong chart library (Pitfall 6) | Confirm library during RECON; use the wrapper that matches the detected library |
| CLONE — Styling | Approximate CSS values (Pitfall 7) | Extract exact pixel values from DevTools Computed Styles; use Tailwind arbitrary values |
| CLONE — Data flow | Module-level intervals (Anti-pattern 2) | All data generators inside `useEffect` with cleanup or Zustand lifecycle actions |
| BRAND — Visual scope creep | Rebranding before functional parity (Pitfall 1) | Hard phase boundary; no brand code in clone phase; git branch separation |
| BRAND — Animations | Over-animation (Pitfall 10) | Define animation constraints upfront; respect `prefers-reduced-motion` |
| VALIDATION — Bundle size | React + Recharts larger than original's vanilla JS bundle (Pitfall: comparing bundles across different frameworks) | VAL-04 baseline is the ORIGINAL's bundle — if the original is lighter (vanilla JS), the constraint "bundle ≤ 20% larger" may be impossible with React. Document this risk now and prepare to justify the tradeoff |

## Sources

- [React Context performance] — React docs on context re-renders: "All consumers that are descendants of a Provider will re-render whenever the Provider's value prop changes" — HIGH confidence
- [Zustand vs Context] — Zustand official docs comparison — HIGH confidence
- [Recharts vs D3] — Recharts README — HIGH confidence
- [TanStack Table docs] — tanstack.com/table — HIGH confidence
- [framer-motion best practices] — motion.dev docs — HIGH confidence
- [Chrome DevTools documentation] — developer.chrome.com/docs/devtools — HIGH confidence
- [Reverse engineering best practices] — General software forensics methodology — MEDIUM confidence (domain-general knowledge, not BMS-specific)
- [PROJECT.md constraints] — .planning/PROJECT.md — HIGH confidence (project's own constraints and decisions)
