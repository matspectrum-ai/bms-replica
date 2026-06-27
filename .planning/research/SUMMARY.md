# Project Research Summary

**Project:** BMS Replica (Laboratório de BMs)
**Domain:** Brazilian Business Management SPA — vanilla JS, single-user, localStorage-backed, API-integrated
**Researched:** 2026-06-27
**Confidence:** MEDIUM (domain conflict between research files — see Gaps)

## Executive Summary

The target system at `laboratoriodebms.netlify.app` is a **vanilla JavaScript business management SPA** — NOT a Building Management System with sensors as originally assumed. Through actual reverse engineering (2135 lines of unminified source analyzed), the real system is a Brazilian business operations tool with: CNPJ company lookup via BrasilAPI, a 5-step SaaS site creation wizard deployed to Cloudflare Pages, virtual SMS number purchasing via SMS24h API, a PDF editor (pdf.js + pdf-lib), a company database with search/filter, a spreadsheet with CSV export, and settings panel. All state is persisted in `localStorage` (2 keys: `lab_bms_db_v1` and `lab_bms_settings_v1`). The UI uses Tailwind CSS CDN with a dark glassmorphism theme and custom 3D button/icon-cube design system.

**Critical finding:** STACK.md and ARCHITECTURE.md were researched against the incorrect "Building Management System with sensors" description and recommend React 19 + Zustand + Recharts and architectures built around sensor telemetry, equipment control, and alarm systems. These recommendations are **invalid for the actual project**. The original uses vanilla JS (no framework) with no charts whatsoever — only KPI stat cards with computed numbers. FEATURES.md, based on actual reverse engineering, is the authoritative source along with the updated PROJECT.md. The correct approach is a **vanilla JS modularized clone** using Vite for build tooling and Tailwind CSS v4 for styling, preserving the original's `go()` router, `VIEWS` registry, and widget factory patterns but with cleaner code organization (separate files per view, centralized state management, CSS custom properties for theming).

The recommended workflow remains valid: **Phase 1 (RECON) → Phase 2-3 (Clone) → Phase 4-5 (Rebrand) → Phase 6 (Validation)**. However, the clone must be vanilla JS matching the original's patterns, not a React rebuild. Key risks include: the temptation to "improve" by adding a framework (anti-requirement), mixing rebrand visual changes into the clone phase (destroys A/B testing), and incomplete reverse engineering documentation (breeds drift from original behavior). The CSS custom properties theming boundary between clone and rebrand phases is the architecture's most critical decision — it enables pixel-perfect clone verification before any visual identity changes.

## Key Findings

### Recommended Stack (Corrected)

> **⚠️ STACK.md was researched against the wrong domain description and recommends React 19 + Zustand + Recharts. These recommendations are INVALID for this project. The corrected stack follows.**

Based on FEATURES.md's actual reverse engineering findings and updated PROJECT.md constraints:

**Core technologies (validated against the real system):**
- **Vanilla JavaScript (ES modules via Vite):** The original is 2135 lines of vanilla JS in a single HTML file. The clone must match the same framework to preserve behavior and enable valid A/B testing. Modularize into `src/views/`, `src/stores/`, `src/services/` with Vite bundling — same output, better DX.
- **Vite 8.1.0:** Build tool and dev server. Zero-config for vanilla JS. Enables ES module organization, HMR, and production bundling without introducing a UI framework. Rolldown-powered for sub-second builds. (STACK.md recommendation is still valid here.)
- **Tailwind CSS 4.3.1:** Pre-selected by project constraints. v4's CSS-first configuration (`@theme` directive) and design token system make rebranding trivial — change CSS variables, all components update. The original already uses Tailwind CSS CDN. (STACK.md recommendation is valid.)
- **dayjs 1.11.21:** 2 kB date utility with Portuguese locale (`pt-br`). Required for timestamp formatting (sites updated dates, SMS purchase times). (STACK.md recommendation is valid.)
- **@phosphor-icons/react → generic Phosphor Icons:** SVG icon library for BRAND-05. The React wrapper won't work with vanilla JS; use raw SVG imports or the web component version instead. (STACK.md identified the right icon library, wrong integration method.)

**What NOT to use (from STACK.md — confirmed valid):**
- No React/Vue/Angular (original is vanilla JS; constraint is "same stack as original")
- No Recharts/D3/ECharts (original has NO charts; only numeric KPI cards)
- No Redux/Zustand (vanilla JS observable store pattern, not framework state management)
- No @tanstack/react-table (vanilla JS HTML table generation, matching original's innerHTML pattern)
- No framer-motion until rebrand phase (BRAND-06 micro-animations only after clone parity)

**Technologies preserved from STACK.md that remain valid:**
- Chrome DevTools toolkit (Elements, Sources, Network, Application) — core to RECON phase
- Wappalyzer, Lighthouse — framework detection and performance baseline
- Tailwind CSS 4.3.1, Vite 8.1.0, dayjs 1.11.21 — build tooling and utilities
- Phosphor Icons (non-React version) — rebrand iconography

### Expected Features

**Must have (table stakes — Clone Phase, exactly matching original):**

| # | Feature | Complexity | Dependencies |
|---|---------|------------|-------------|
| 1 | **SPA Router (8 routes)** — vanilla JS `go()` + `VIEWS` registry, no hash, title updates | LOW | None |
| 2 | **localStorage Persistence** — `lab_bms_db_v1` (companies+sites) and `lab_bms_settings_v1` (API tokens) | LOW | None (foundation for all views) |
| 3 | **Component Library** — statCard, quickCard, stepBox, pill, btn-3d, icon-cube | MEDIUM | None |
| 4 | **Dashboard** — hero card, 4 KPI stats, 6 quick-access cards, API status pills | MEDIUM | localStorage, component library |
| 5 | **Etapa 1 (5-Step Wizard)** — CNPJ lookup (BrasilAPI) → domain engine (7 algorithms) → meta-tag → site HTML generator (~300 lines) → Cloudflare deploy (5-step pipeline with BLAKE3 hash) | HIGH | BrasilAPI, Cloudflare API, localStorage |
| 6 | **Etapa 2 (SMS Purchase)** — country/service select, buy number, SMS polling timer, re-deploy site | MEDIUM | SMS24h API, Cloudflare API, localStorage |
| 7 | **Etapa 3 (PDF Editor)** — pdf.js multi-page render, draggable text overlays, address field extraction (regex for 7 Brazilian fields), pdf-lib merge-on-download | HIGH | pdf.js CDN, pdf-lib CDN |
| 8 | **Banco de Empresas** — company grid with search + capital social range filter, "Usar na Etapa 1" action | MEDIUM | localStorage |
| 9 | **Planilha** — 8-column sites table, inline status dropdown, delete, CSV export (UTF-8 BOM for Excel) | MEDIUM | localStorage |
| 10 | **Configuracoes** — Cloudflare token management (auto-detect account), SMS24h key, backup/restore JSON | MEDIUM | Cloudflare API, SMS24h API, localStorage |
| 11 | **Shared UI Infrastructure** — Toast (3s auto-dismiss), Modal (HTML injection), Clipboard Copy (navigator.clipboard) | LOW | None |
| 12 | **Formatting Utils** — CNPJ mask, BRL currency, pt-BR date, Brazilian phone, slug, HTML escape | LOW | dayjs |
| 13 | **Ajuda** — static help with step-by-step guides | LOW | None |
| 14 | **Responsive Design** — 1024px sidebar collapse with overlay backdrop | LOW | None |
| 15 | **CORS Proxy Layer** — replicate Netlify `_redirects` proxy for Cloudflare and SMS24h APIs | MEDIUM | None |

**Should have (differentiators — Rebrand Phase, new visual identity only):**

| # | Feature | What It Adds |
|---|---------|-------------|
| 1 | **Emerald + Burnt Orange Palette (BRAND-01)** — replaces navy blue (#6366f1) with emerald green (#059669) + burnt orange (#ea580c) | Visual differentiation, 2025 aesthetic |
| 2 | **Poppins/Montserrat Typography (BRAND-02)** — replaces Inter + Sora | Modern geometric sans-serif, better readability |
| 3 | **Header Fixo + Mega Menu (BRAND-03)** — replaces sidebar with sticky header dropdown | More screen real estate, professional layout |
| 4 | **Glassmorphism + Neumorphism Cards (BRAND-04)** — expanded glass system with neumorphic variants | Modern visual language (2024-2026 trend) |
| 5 | **Phosphor Icons (BRAND-05)** — replaces emojis with 9000+ professional SVG icons in 6 weights | Consistent rendering, professional appearance |
| 6 | **Micro-Animations (BRAND-06)** — route transitions, staggered card entry, refined hover states | Polished UX, premium feel |
| 7 | **New Name + Logo (BRAND-07)** — independent brand identity | Market differentiation |
| 8 | **New Copywriting (BRAND-08)** — rewritten labels, tooltips, placeholders | Consistent brand voice |
| 9 | **Generated Site Rebrand** — updated `buildSiteHTML()` template with new visual identity | Consistent brand across dashboard AND customer sites |

**Defer (v2+ / future milestones):**
- Real backend/database (project constraint: 100% front-end, zero-dependency)
- React/Vue framework rewrite (anti-requirement: must match original stack)
- Charts/graphs (original has none — pure greenfield if desired later)
- Real authentication (original is cosmetic login only; localStorage gate)
- Multi-profile selector (cosmetic, swaps STORAGE_KEY)
- Dark/light theme toggle (original is dark-only; 2x rebrand work for light variant)
- i18n / English version (all content Brazilian Portuguese; CNPJ/CEP format specific)
- PWA / Service Worker (external API dependency defeats offline mode)
- Real SMS sending (original only BUYS numbers, doesn't send)
- BMS sensor/equipment features (wrong domain entirely — separate milestone)

### Architecture Approach

> **⚠️ ARCHITECTURE.md was researched against the wrong domain and shows sensor/equipment/alarm/report views and React/Vue component patterns. The corrected architecture follows.**

The original system is a vanilla JS SPA with ~60 functions across ~2135 lines in a single file. The replica will **modularize** this into a layered architecture while preserving identical behavior. The critical architectural decision is the **CSS custom properties theming boundary** between clone (Phase 2-3) and rebrand (Phase 4-5): only `src/styles/` and `public/` (fonts, icons, assets) change between phases; all JavaScript remains identical.

**Major components (corrected to match the REAL system):**

1. **Router + VIEWS Registry** — Maps 8 routes (dashboard, etapa1, etapa2, etapa3, banco, planilha, config, ajuda) to view functions via `ROUTES[]` array and `VIEWS{}` object. `go(route)` updates innerHTML in content area, toggles nav-link `.active` class, updates header title/subtitle. This is the original's exact pattern — must be preserved identically.

2. **Persistence Layer** — `getDB()` / `saveDB()` / `getSettings()` / `saveSettings()` wrappers around localStorage. Key names (`lab_bms_db_v1`, `lab_bms_settings_v1`) must match original exactly for storage compatibility testing (VAL-02). JSON import/export backup via Configuracoes view.

3. **State Management** — Three state objects: `etapa1State` (5 fields for wizard), `etapa2State` (4 fields for SMS flow), and UI state (active route, sidebar toggle, toast queue). Original uses scattered module-level variables. The clone should centralize into an observable store (pub/sub pattern) for testability while preserving identical mutation behavior.

4. **View Functions** — 8 view functions (`VIEWS.dashboard`, `VIEWS.etapa1`, `VIEWS.etapa2`, `VIEWS.etapa3`, `VIEWS.banco`, `VIEWS.planilha`, `VIEWS.config`, `VIEWS.ajuda`) each returning HTML strings injected via `innerHTML`. Plus the `buildSiteHTML()` template engine (~300 lines) that generates complete SaaS landing page HTML.

5. **Widget Factories** — `statCard()`, `quickCard()`, `stepBox()`, pills, 3D buttons (`btn-3d` with 8 color variants), icon cubes (`icon-cube` with 5 color variants), toast, modal. Each is a pure function: config → HTML string (with optional event listener attachment).

6. **Service Layer** — API clients for BrasilAPI (CNPJ lookup), Cloudflare Pages API (5-step deploy pipeline: create project → JWT → BLAKE3 hash → upload → deploy), SMS24h API (number purchase + polling), and the CORS proxy layer (`fetch` monkey-patch rewriting URLs). Also includes the domain suggestion engine (7 algorithms for subdomain generation) and address field extractor (regex for 7 Brazilian address fields).

7. **External CDN Dependencies** — pdf.js (PDF rendering), pdf-lib (PDF merge on download), and `@noble/hashes/blake3` (Cloudflare upload hash). These are loaded from CDN at runtime, not bundled.

8. **CSS Design System** — CSS custom properties on `:root` for all colors, fonts, spacing, shadows, border-radius. Component classes: `.glass`, `.grad-card`, `.neon`, `.btn-3d`, `.icon-cube`, `.pill`, `.nav-link`, `.step-card`. This is the **phase boundary**: clone uses original navy/indigo palette; rebrand swaps to emerald/orange.

**Key architectural patterns:**
- **VIEWS Registry** (Pattern 1 from ARCHITECTURE.md — preserved, matches original exactly)
- **Observable Store** (Pattern 2 — centralize the original's scattered state into a pub/sub store for testability, but maintain identical mutation behavior)
- **Widget Factory Functions** (Pattern 3 — `config → HTML string`, no framework lifecycle, manual event cleanup)
- **CSS Custom Properties Theming** (Pattern 4 — THE critical decision enabling two-phase workflow; all visual properties as CSS variables, no hardcoded colors in JS)

**What ARCHITECTURE.md got wrong and must be corrected in planning:**
- Shows sensor/equipment/alarm/report views — these DO NOT EXIST in the real system
- Shows ChartWrapper, ToggleSwitch, Slider, Breadcrumb widgets — not present in original
- Shows DataSimulator with setInterval for sensor telemetry — not present (real system uses on-demand fetch calls, not real-time simulation)
- Shows React component file structure — must be vanilla JS modules instead

### Critical Pitfalls

From PITFALLS.md, the top pitfalls verified as directly applicable to the actual project:

1. **Rebranding Before Functional Parity (Pitfall 1)** — Adding new colors, fonts, or layout changes while still implementing clone features creates a hybrid that matches neither original nor new design. **Prevention:** Hard phase boundary. No CSS color changes, no new fonts, no layout modifications until ALL REPL-* features pass verification. Use separate git branches: `phase/clone` and `phase/brand`.

2. **Reverse Engineering Without Documentation (Pitfall 3)** — Mentally noting findings instead of writing them down leads to clone drift (different intervals, different random ranges, different data structures). **Prevention:** Create `RECON.md` DURING extraction, not after. Document every localStorage key/value, every API response schema, every function signature. Target: 500+ lines of structured data before clone code begins.

3. **Ignoring localStorage Structures (Pitfall 5)** — Focusing on UI replication while missing the persistence layer means the clone saves with different keys or structures. VAL-02 fails. **Prevention:** Open Application → Storage → localStorage BEFORE any other RECON work. Document every key-value pair, data types, and when values change. Build persistence layer from this documentation.

4. **Ignoring CSS Details (Pitfall 7)** — "Close enough" mentality with Tailwind utility classes produces 1-4px discrepancies across 50+ components. **Prevention:** Use DevTools → Elements → Computed Styles to extract exact pixel values. Use Tailwind arbitrary values (`p-[13px]`, `rounded-[7px]`) to match original precisely. Pixel-by-pixel overlay comparison is the validation standard.

5. **Portuguese Encoding Issues (Pitfall 9)** — Special characters (ã, õ, ç, ê, á) rendering as mojibake, dayjs `pt-br` locale not loaded. **Prevention:** `<meta charset="UTF-8">`, `dayjs.locale('pt-br')` at app startup, no English fallback strings. All UI content is Brazilian Portuguese.

**Pitfalls from STACK.md that are IRRELEVANT to this project (wrong domain/framework):**
- Pitfall 2 (React Context re-renders) — irrelevant, no React
- Pitfall 4 (Assuming React before verification) — partially applicable: RECON phase must confirm vanilla JS, but the risk now is STACK.md's React assumption, not developer bias
- Pitfall 6 (Chart library mismatch) — irrelevant, no charts in original
- Pitfall 8 (Network timing) — partially applicable: original uses real `fetch` calls, not simulated delays; timing is real API latency, not mock

## Implications for Roadmap

Based on combined research (FEATURES.md as authoritative source, corrected architecture, and validated pitfalls):

### Phase 1: RECON (Reverse Engineering & Documentation)

**Rationale:** Must happen first — all clone decisions depend on RECON findings. The system has already been partially reverse-engineered (FEATURES.md contains substantial findings), but a formal `RECON.md` document with structured data (≥500 lines) is required before any clone code. This phase confirms vanilla JS framework (already known), documents exact API contracts, captures CSS pixel values, and maps all state transitions.

**Delivers:** `RECON.md` with: complete DOM tree extraction, all 8 route/VIEWS mappings, localStorage key-value schemas, API request/response contracts (BrasilAPI, Cloudflare Pages, SMS24h), CSS custom properties inventory, widget factory signatures, all ~60 function behaviors. Screenshots of every view for A/B testing baseline.

**Addresses:** RECON-01 through RECON-05 requirements

**Avoids:** Pitfall 3 (undocumented extraction), Pitfall 5 (ignoring localStorage), Pitfall 7 (approximate CSS)

**Research flag:** Well-documented patterns — skip research-phase. RECON is data extraction, not research.

---

### Phase 2: Foundation (Persistence + Router + Widgets)

**Rationale:** localStorage is the foundation every view depends on. The router must exist before any view can render. Shared widgets are used by all views. Building these first establishes the skeleton that Phase 3 populates. This mirrors the original's boot sequence: `getDB()` → `go(dashboard)`.

**Delivers:** 
- `src/persistence/` — `getDB()`, `saveDB()`, `getSettings()`, `saveSettings()`, JSON backup/restore (identical key names: `lab_bms_db_v1`, `lab_bms_settings_v1`)
- `src/router/` — `ROUTES[]`, `VIEWS{}` registry, `go()` function, nav-link `.active` toggling, header title/subtitle updates
- `src/widgets/` — statCard, quickCard, stepBox, pill (5 variants), btn-3d (8 variants), icon-cube (5 variants), toast, modal, clipboard copy
- `src/utils/` — fmtCNPJ, fmtMoney, fmtDate, formatBRPhone, slugify, escapeHTML, onlyDigits
- `src/styles/` — theme.css (CSS custom properties matching original navy palette), base.css, components.css, animations.css, responsive.css
- `index.html` — static shell (sidebar skeleton, header, content area, modals, toast container)
- `src/layout/` — Sidebar (3 categories: FLUXO PRINCIPAL, DADOS, SISTEMA), Header (sticky with blur, page title, subtitle, API status pills), ContentArea

**Uses:** Vite 8.1.0 (build), Tailwind CSS 4.3.1 (styling), dayjs 1.11.21 (date formatting)

**Implements:** Router + VIEWS Registry, Widget Factory, CSS Custom Properties Theming patterns

**Avoids:** Pitfall 7 (approximate CSS — pixel-exact extraction from RECON.md)

**Research flag:** Standard patterns — skip research-phase. Vanilla JS routing and localStorage are well-established.

---

### Phase 3: Views & Integrations (All 8 Routes + API Clients)

**Rationale:** With foundation in place (router, widgets, styles, state), build all 8 views in dependency order. Highly complex integrations (Cloudflare 5-step pipeline, PDF editor with 2 CDN libraries) are built and tested in isolation before wiring into their respective views. The Site HTML Generator (~300 lines) is the largest single function and needs comprehensive testing with multiple company profiles.

**Delivers:**

*In dependency order:*

1. **Dashboard** (simplest, no external APIs) — hero card, 4 KPI stat cards (computed from localStorage), 6 quick-access cards, API status warning pills
2. **Configuracoes** (enables API tokens for Etapas) — Cloudflare token input + auto-detect account via `/accounts` API, multi-account picker, SMS24h key, backup/restore
3. **API Service Layer** — `src/services/api/brasilApi.js` (CNPJ lookup + normalize), `src/services/api/cloudflare.js` (5-step deploy), `src/services/api/smsApi.js` (number purchase + polling), CORS proxy layer
4. **Etapa 1** (most complex, depends on Configuracoes + API services) — 5-step sequential wizard with progressive unlocking, CNPJ lookup (BrasilAPI), domain engine (7 algorithms), meta-tag generation, `buildSiteHTML()` template engine (~300 lines), Cloudflare deploy pipeline (create project → JWT → BLAKE3 hash → upload → deploy)
5. **Etapa 2** (depends on Configuracoes + API services + Etapa 1 sites) — country/service select for SMS number, buy number via SMS24h, auto-polling timer for activation code, re-deploy site with new phone number
6. **Etapa 3** (depends on CDN libraries) — pdf.js renderer (multi-page), click-to-add draggable contentEditable text overlays, address field extractor (regex for CEP, UF, logradouro, numero, complemento, bairro, municipio), pdf-lib merge-on-download
7. **Banco de Empresas** — company card grid, text search, capital social range filter (ideal: 10k-50k), pill badges (status/porte/capital), "Usar na Etapa 1" action (feeds into Etapa 1 state)
8. **Planilha** — 8-column HTML table (Company, CNPJ, Domain, Company Phone, Our Phone, Status, Updated, Actions), inline `<select>` status changes, delete with confirmation, CSV export with UTF-8 BOM
9. **Ajuda** — static help content, no dependencies, renders last

**Uses:** All foundation from Phase 2, dayjs for timestamps, CDN libraries (pdf.js, pdf-lib, @noble/hashes/blake3)

**Implements:** VIEWS registry pattern (each route gets one view function), Widget Factory pattern (views compose widgets)

**Avoids:** Pitfall 1 (no rebrand colors yet), Pitfall 3 (all behavior documented in RECON.md)

**Research flags:** 
- **Etapa 1 Cloudflare pipeline needs research-phase:** Complex 5-step API flow with JWT auth, BLAKE3 hashing, and dynamic import of `@noble/hashes/blake3`. API contracts may have changed since original was built.
- **Etapa 3 PDF editor needs research-phase:** pdf.js and pdf-lib CDN integration with vanilla JS has sparse documentation. Overlay positioning math requires careful study of original's `rerenderOverlays()`.
- Other views: Standard patterns — skip research-phase.

---

### Phase 4: Rebrand Foundation (Design Tokens + Typography + Icons + Layout)

**Rationale:** After all clone features are verified working, apply the new visual identity. This phase changes the CSS layer only — zero JavaScript changes. Start with the most impactful changes (color palette, fonts, icons) and the structural layout change (Header + Mega Menu). The layout restructure is the highest-risk rebrand item because it touches DOM structure, not just CSS.

**Delivers:**
- BRAND-01: New `:root` CSS custom properties (emerald green #059669 + burnt orange #ea580c replacing navy blue #6366f1)
- BRAND-02: Google Fonts swap (Inter + Sora → Poppins or Montserrat)
- BRAND-03: Header Fixo + Mega Menu layout — restructure from sidebar `flex` layout to single-column with sticky header dropdown menu
- BRAND-05: Phosphor Icons replacing emojis — map every emoji to Phosphor SVG (🧪→Flask, 🏠→House, 🧬→Dna, 📱→DeviceMobile, etc.)
- BRAND-07: New name + logo text in sidebar header, `<title>`, all text references

**Uses:** Phosphor Icons (SVG version, not React component), Tailwind CSS 4.3.1 `@theme` directive

**Implements:** CSS Custom Properties Theming pattern (swap `:root` variables)

**Avoids:** Pitfall 1 (validated: all REPL-* features pass before any brand code), Pitfall 10 (BRAND-06 animations deferred to Phase 5)

**Research flag:** BRAND-03 (Header + Mega Menu) needs research-phase — structural layout change affecting all views, requires careful DOM restructuring while preserving identical JS behavior. CSS Grid + dropdown menu animation patterns need design specification.

---

### Phase 5: Rebrand Polish (Cards + Animations + Copywriting + Generated Site)

**Rationale:** After the structural rebrand is stable (Phase 4), apply the finishing touches. Glassmorphism/neumorphism card variants enhance depth. Micro-animations add polish. Copywriting updates brand voice. The generated site template gets rebranded to ensure consistency between admin dashboard and customer-facing sites.

**Delivers:**
- BRAND-04: New card variants — `.neo-card`, `.neo-raised`, `.neo-pressed` using dual `box-shadow` technique, combined with existing `.glass` for hybrid effects
- BRAND-06: Micro-animations — route transition fades, staggered card entry, refined hover states. Constraint: max 300ms enter, max 200ms hover, respect `prefers-reduced-motion`
- BRAND-08: New copywriting — labels, tooltips, placeholders, toast messages rewritten with consistent brand voice
- Generated Site Rebrand: Update `buildSiteHTML()` template with new palette, new typography, new iconography

**Uses:** Phase 4 rebrand tokens as foundation

**Avoids:** Pitfall 10 (over-animation — constraints defined upfront)

**Research flag:** BRAND-04 (Glassmorphism + Neumorphism) needs research-phase — dual shadow technique requires browser compatibility validation and performance testing across breakpoints.

---

### Phase 6: Validation (Quality Gate)

**Rationale:** Before declaring the project complete, verify functional parity (A/B testing), storage compatibility, responsiveness, and bundle size against original baselines.

**Delivers:**
- VAL-01: A/B testing — clone vs original, all 8 routes, pixel-by-pixel screenshot overlay at 50% opacity. Every 1px difference is a bug.
- VAL-02: Storage compatibility — verify same data structures, same key names, data survives round-trip through both original and clone
- VAL-03: Responsiveness — all breakpoints, sidebar collapse at 1024px, mobile touch targets
- VAL-04: Bundle size — ≤20% larger than original (~150 kB gzipped original; target ≤180 kB). Note: Vite bundling of modularized code should not significantly exceed single-file original.

**Uses:** RECON.md baselines from Phase 1

**Avoids:** Pitfall 1 (final confirmation that clone matches original before rebrand is judged)

**Research flag:** Standard QA patterns — skip research-phase.

---

### Phase Ordering Rationale

1. **RECON → Foundation → Views is non-negotiable:** Router can't render views until it exists. Views can't display data until persistence exists. Widgets can't be composed until they're built. This is a strict dependency chain.

2. **Configuracoes before Etapa 1/2/3:** API tokens must be configurable before API-dependent views can function. While the CORS proxy layer can mock during development, the clone must match original behavior (tokens required, stored in localStorage).

3. **Etapa 1 before Etapa 2:** Etapa 2 re-deploys sites created in Etapa 1. The site must exist before a phone number can be attached via re-deploy.

4. **Dashboard first in Views phase:** Simplest view — no external APIs, only reads localStorage and composits widgets. Serves as integration test for the entire foundation layer.

5. **Ajuda last in Views phase:** Static content with zero dependencies — can be built any time but low priority.

6. **Clone complete before rebrand starts:** Hard boundary enforced by VAL-01 requirement. Cannot A/B test if visual identity has already changed. Use separate git branches.

7. **Rebrand Foundation before Polish:** Colors, fonts, layout, and icons establish the visual language. Cards, animations, and copywriting refine it. Changing the structural layout (BRAND-03) after polish risks rework.

8. **Validation gates production readiness:** A/B testing confirms functional parity. Storage testing confirms data portability. Bundle size confirms performance target. All three must pass.

### Research Flags

**Phases needing `/gsd-plan-phase --research-phase <N>` during planning:**

| Phase | Reason | Suggested Research |
|-------|--------|-------------------|
| Phase 1 (RECON) | Not research — extraction. Document, don't research. | Skip research-phase. Use RECON.md template. |
| Phase 3 (Cloudflare API) | 5-step pipeline with BLAKE3 hashing, JWT auth, dynamic ES module imports. API may have changed. | Research Cloudflare Pages API current docs, verify BLAKE3 integration pattern with `@noble/hashes` |
| Phase 3 (PDF Editor) | pdf.js + pdf-lib CDN integration, overlay positioning math, address regex for Brazilian postal format | Research pdf.js API for vanilla JS, pdf-lib merge API, validate CEP/UF regex patterns against current Brazilian postal standards |
| Phase 4 (BRAND-03) | Header + Mega Menu is a structural DOM change affecting all views. CSS Grid layout, dropdown animations, keyboard navigation, ARIA. | Research CSS Grid mega menu patterns, accessible dropdown patterns, Framer Motion vanilla JS or CSS-only animation alternatives |
| Phase 5 (BRAND-04) | Neumorphism dual-shadow technique needs browser compatibility validation | Research neumorphism CSS implementation, accessibility contrast ratios on glass/neumorphic surfaces |

**Phases with well-documented patterns (skip research-phase):**
- Phase 2 (Foundation): Vanilla JS routing, localStorage CRUD, widget factories — standard patterns
- Phase 3 (Dashboard, Banco, Planilha, Config, Ajuda): Standard CRUD views, HTML table generation, form inputs — well-documented
- Phase 6 (Validation): A/B testing, storage testing, Lighthouse audits — standard QA patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **LOW** | STACK.md was researched against the wrong domain (Building Management System with sensors) and recommends React 19 + Zustand + Recharts — all invalid for the actual vanilla JS business management SPA. The corrected stack (vanilla JS + Vite + Tailwind CSS + dayjs) is derived from FEATURES.md reverse engineering, not STACK.md. STACK.md needs complete revision or replacement. |
| Features | **HIGH** | FEATURES.md is based on actual reverse engineering of the production system (2135 lines of source code analyzed). Every feature, function, route, and API integration is verified against the real site. Domain correction from "Building Management System" to "Business Management System" is confirmed. |
| Architecture | **LOW** | ARCHITECTURE.md was researched against the wrong domain and shows sensor/equipment/alarm views, ChartWrapper/ToggleSwitch/Slider widgets, and React component patterns — none of which exist in the real system. Corrected architecture (VIEWS registry, widget factories, CSS theming boundary) is derived from FEATURES.md. ARCHITECTURE.md needs complete revision or replacement. |
| Pitfalls | **MEDIUM** | PITFALLS.md contains both domain-agnostic pitfalls (valid: rebrand timing, documentation, localStorage) and domain-specific ones (invalid: React Context issues, chart library mismatch). 8 of 10 pitfalls are directly applicable; 2 (Pitfall 2: React Context, Pitfall 6: Chart mismatch) are irrelevant but don't cause harm if followed. |

**Overall confidence: MEDIUM**

The research that matters (FEATURES.md — actual reverse engineering) is HIGH confidence. The two files that were researched against the wrong domain (STACK.md, ARCHITECTURE.md) are LOW confidence and need revision. PITFALLS.md is partially applicable at MEDIUM. The corrected PROJECT.md aligns with the real system.

### Gaps to Address

1. **STACK.md needs complete revision to match the real domain.** Current recommendations (React, Zustand, Recharts, @tanstack/react-table, ECharts) are for a sensor dashboard that doesn't exist. Must be rewritten to recommend: vanilla JS modularized with Vite, Tailwind CSS 4, dayjs, Phosphor Icons (SVG/web component), and CDN-loaded pdf.js/pdf-lib. **When:** Before Phase 2 planning begins.

2. **ARCHITECTURE.md needs complete revision to match the real domain.** Current architecture shows sensor/equipment/alarm/report views, ChartWrapper/ToggleSwitch/Slider/Breadcrumb widgets, DataSimulator with setInterval — none of which exist. Must be rewritten to show: Dashboard, Etapa1/2/3, Banco, Planilha, Config, Ajuda views; statCard/quickCard/stepBox/btn-3d/icon-cube/pill widgets; API service layer (BrasilAPI, Cloudflare, SMS24h); CORS proxy layer. **When:** Before Phase 2 planning begins.

3. **Vanilla JS icon integration for Phosphor Icons not researched.** STACK.md recommends `@phosphor-icons/react` — won't work with vanilla JS. Need to research: Phosphor Icons web component, SVG sprite approach, or CDN loading for vanilla JS. **When:** Before Phase 4 (Rebrand) planning. Not blocking clone phase.

4. **pdf.js + pdf-lib CDN version pinning not verified.** FEATURES.md identifies these are loaded from CDN but doesn't specify exact versions. The clone must use the same versions as the original to avoid behavioral differences. **When:** During Phase 1 RECON — check original's CDN URLs and version numbers.

5. **Cloudflare Pages API and SMS24h API contracts may have changed.** The original was built at an unknown date. API endpoints, auth methods, and response schemas may differ from current documentation. **When:** Phase 1 RECON should capture exact request/response shapes. Phase 3 research-phase should verify against current API docs and note any drift.

6. **Bundle size target (VAL-04: ≤20% larger) may be challenging with modularized vanilla JS.** The original is a single ~150 kB gzipped HTML file. Breaking it into ES modules and bundling with Vite may increase size due to module wrapper overhead. Target: ≤180 kB gzipped. **Mitigation:** Use Vite's tree-shaking and minification. Monitor bundle size continuously during Phase 2-3 development. If approaching limit, consider code-splitting or reducing utility library imports.

## Sources

### Primary (HIGH confidence)
- **Reverse engineering of `laboratoriodebms.netlify.app`** — Full HTML source (~2135 lines), all ~60 functions, CSS design system, API contracts, localStorage schemas extracted via WebFetch and DevTools analysis. *(Source for FEATURES.md — authoritative)*
- **UPDATED PROJECT.md** — Corrected domain description: "ferramenta de gestão empresarial brasileira" (Brazilian business management tool), not Building Management System. *(Project constraints and requirements)*
- **npm official registry** — Version verification for Vite, Tailwind CSS, dayjs. *(Source for STACK.md — partially valid)*

### Secondary (MEDIUM confidence)
- **STACK.md** — Stack research file. **NOTE:** Was researched against incorrect domain description. Technologies that remain valid: Vite 8.1.0, Tailwind CSS 4.3.1, dayjs 1.11.21, Chrome DevTools toolkit. Technologies that are INVALID: React 19, Zustand, Recharts, ECharts, @tanstack/react-table, framer-motion (for React). Needs revision.
- **ARCHITECTURE.md** — Architecture research file. **NOTE:** Was researched against incorrect domain description. Patterns that remain valid: VIEWS Registry, Observable Store, Widget Factory Functions, CSS Custom Properties Theming. Component inventory and build order are INVALID (shows sensor/equipment/alarm views). Needs revision.
- **PITFALLS.md** — Pitfalls research file. **NOTE:** Partially domain-agnostic. 8 of 10 pitfalls are directly applicable regardless of domain. 2 pitfalls (React Context, chart library mismatch) are irrelevant to the actual vanilla JS system.

### Tertiary (LOW confidence — for awareness only)
- **Cloudflare Pages API documentation** — API contracts may have changed since original was built. Must verify during RECON.
- **SMS24h API** — External service; API stability and endpoint availability unknown. Mock layer should be the primary development target.

---

*Research completed: 2026-06-27*
*Ready for roadmap: **Yes** — with caveats. STACK.md and ARCHITECTURE.md need revision before Phase 2 planning, but FEATURES.md + updated PROJECT.md provide sufficient ground truth for roadmap structure. The corrected architecture and stack recommendations in this SUMMARY.md supersede the original STACK.md and ARCHITECTURE.md files.*
