# Feature Research: BMS Replica (Laboratorio de BMs)

**Domain:** Business Operations Dashboard / SPA with API integrations
**Researched:** 2026-06-27
**Confidence:** HIGH

> **CRITICAL DOMAIN CORRECTION:** PROJECT.md describes this as a "Building Management System" with sensors, temperature, and energy consumption. After full reverse engineering of `laboratoriodebms.netlify.app`, the actual system is a **business automation dashboard** (Business Management) for: company registration via CNPJ lookup, automatic SaaS site generation, virtual phone number purchasing, PDF editing, and Cloudflare Pages deployment. "BMS" means "Business Management System" — a laboratory ("Laboratorio de BMs") for business operations. **There are NO temperature sensors, NO energy charts, NO equipment controls.** The clone must reflect the REAL system, not PROJECT.md's mischaracterization.

## Feature Landscape

### Table Stakes (Users Expect These)

Features the original system has. Missing any = clone incomplete.

| Feature | Why Expected | Complexity | Reverse-Engineered From |
|---------|--------------|------------|------------------------|
| **SPA Router (8 routes, client-side)** | Core architecture. No page reloads. 8 routes: dashboard, etapa1, etapa2, etapa3, banco, planilha, config, ajuda | LOW | `go(route)` function, `ROUTES` array, `VIEWS` object — vanilla JS hash-free routing with title updates and active nav-link CSS toggling |
| **Sidebar Navigation** | Every dashboard needs navigation. 3 categories (FLUXO PRINCIPAL, DADOS, SISTEMA) with emoji icons and active state | LOW | `<aside id="sidebar">` with `.nav-link` elements, `data-route` attributes, `.active` class toggling, mobile collapse at 1024px |
| **KPI Stat Cards (Dashboard)** | Quick overview: Empresas, Sites Criados, No Ar, Finalizados — computed from localStorage on each render | LOW | `statCard()` rendering `.glass` cards with `.icon-cube` + number + label, grid layout |
| **localStorage Persistence (2 keys)** | All data client-side: `lab_bms_db_v1` (companies + sites) and `lab_bms_settings_v1` (API tokens) | LOW | `getDB()`/`saveDB()`/`getSettings()`/`saveSettings()` — JSON with fallback defaults |
| **CNPJ Lookup via BrasilAPI** | External API for Brazilian company registration data. Core workflow entry point | MEDIUM | `e1Buscar()` — `fetch('https://brasilapi.com.br/api/cnpj/v1/'+cnpj)`, normalizes response into internal company object schema |
| **5-Step Sequential Wizard (Etapa 1)** | CNPJ → Domain → Meta Tag → Generate Site → Publish. Progressive unlocking. State in module-level variable | MEDIUM | `etapa1State` object, `stepBox()` with `.disabled` CSS class, conditional rendering based on step completion |
| **Site HTML Generator** | Template engine producing complete SaaS landing page (~20KB HTML) from company data with hero, about, values, services, contact, footer | HIGH | `buildSiteHTML(dados)` — ~300 lines of template string interpolation, embedded CSS, responsive grid, conditional sections |
| **Domain Suggestion Engine** | 7 algorithms generating unique subdomain names avoiding exact company name match | MEDIUM | `gerarSugestoesDominio(nome)` — letter doubling, vowel swapping, truncation, sigla extraction, reordering, mixing |
| **Cloudflare Pages API Deployment** | 5-step pipeline: create project → get JWT → BLAKE3 hash → upload asset → create deployment | HIGH | `e1Publicar()` — 5 sequential fetch calls with error handling per step, dynamic `@noble/hashes/blake3` import |
| **PDF Viewer + Editor (Etapa 3)** | pdf.js multi-page rendering, click-to-add draggable contentEditable text overlays, per-overlay delete | HIGH | `carregarPDF()`, `rerenderOverlays()` — pdf.js CDN for rendering, pdf-lib CDN for merge-on-download, custom overlay DOM elements with mouse drag handlers |
| **PDF Address Field Extractor** | Regex-based extraction of 7 Brazilian address fields from PDF text content | MEDIUM | `extrairCamposEndereco(text)` — regex for CEP (#####-###), UF (2-letter state codes), logradouro, numero, complemento, bairro, municipio patterns |
| **Company Database (Banco de Empresas)** | Grid of company cards with text search, capital social range filter (ideal: 10k-50k), "Usar na Etapa 1" action | MEDIUM | `VIEWS.banco`, `renderBanco()` — client-side search + filter dropdown, card rendering with pill badges for status/porte/capital |
| **Spreadsheet Table (Planilha)** | 8-column table of all sites: Company, CNPJ, Domain/URL, Company Phone, Our Phone, Status, Updated, Actions. Status dropdown, delete, CSV export (BOM) | MEDIUM | `VIEWS.planilha`, `renderPlanilha()` — HTML table with `<select>` for inline status changes, `exportCSV()` with UTF-8 BOM for Excel |
| **Settings Panel (Configuracoes)** | Cloudflare token management (auto-detect account from token, multi-account picker), SMS24h API key, backup/restore as JSON file | MEDIUM | `VIEWS.config` — token input with auto-detection via Cloudflare `/accounts` API, multi-account selection UI, backup as full JSON download |
| **SMS24h API Integration** | Buy virtual numbers by country/service, poll for activation SMS code, auto-polling timer, display formatted phone with copy button | MEDIUM | `smsAPI(action, params)` wrapper, `etapa2State` management, `setInterval` auto-polling |
| **Toast Notification System** | Bottom-center transient notifications with emoji icon, auto-dismiss after 3 seconds | LOW | `toast(msg, icon)` — fixed-position div with CSS glass styling, `setTimeout` auto-hide with clearTimeout for stacking |
| **Generic Modal System** | Reusable modal overlay with HTML content injection, background click to close, scrollable body | LOW | `openModal(html)` / `closeModal()` — backdrop overlay + body div |
| **Clipboard Copy Utility** | Copy-to-clipboard with toast feedback — used for domains, phone numbers, meta-tags, PDF fields | LOW | `copyText(t, msg)` — `navigator.clipboard.writeText` + toast |
| **Responsive Design (1024px breakpoint)** | Mobile sidebar collapse with overlay backdrop, responsive grids, touch-friendly inputs | LOW | CSS media query at 1024px, `toggleSidebar()`, `.backdrop` overlay, collapsible sidebar |
| **Dark Theme + Glassmorphism** | Deep blue/dark purple via CSS custom properties. Glassmorphism cards, gradient backgrounds, neon glow effects | LOW | `:root` CSS vars (`--bg`, `--card`, `--border`, `--text`, etc.), `.glass`, `.grad-card`, `.neon`, `.ring-glow` utility classes |
| **Data Formatting Utilities** | CNPJ mask (##.###.###/####-##), BRL currency, date (pt-BR), Brazilian phone, slug generation, HTML escape | LOW | `fmtCNPJ()`, `fmtMoney()`, `fmtDate()`, `formatBRPhone()`, `slugify()`, `escapeHTML()` |
| **Sticky Header with Blur** | Always-visible header with dynamic page title + subtitle + API status pills (Cloudflare/SMS24h OK/Danger) | LOW | `<header class="sticky">` with `backdrop-filter: blur(12px)`, dynamic title via `go()` |
| **Help Section (Ajuda)** | Step-by-step workflow guides as ordered lists with emoji icon cards | LOW | `VIEWS.ajuda` — static content rendering with `ajuda()` helper function |
| **CORS Proxy Layer** | Netlify `_redirects` proxying `/cf-api/*` → Cloudflare API and `/sms-api/*` → SMS24h API. `fetch` monkey-patched to rewrite URLs | MEDIUM | `instalarProxy()` — wraps `window.fetch` to rewrite API URLs. Clone must replicate or fully mock |

### Differentiators (Competitive Advantage)

Features from the rebrand phase (BRAND-01 through BRAND-08) plus preserved original differentiators.

| Feature | Value Proposition | Complexity | Strategy |
|---------|-------------------|------------|----------|
| **3D Button System (Preserved)** | The most distinctive visual element: buttons with bottom shadow creating depth illusion, press animation (translateY + shadow reduction), 8 color variants | LOW (preserve) | Keep `.btn-3d` with new emerald/orange palette colors. Structure: `box-shadow` with 2 layers (bottom shadow + ambient), `transform: translateY(4px)` on `:active` |
| **Icon Cube Design System (Preserved)** | Second most distinctive: gradient background with inner highlight shadow + bottom shadow. 5 color variants. Used for KPI icons, section headers, avatars | LOW (preserve) | Keep `.icon-cube` with new gradient colors. Structure: `linear-gradient(160deg, light, mid 60%, dark)` + `box-shadow` with inner highlight + bottom shadow |
| **Emerald + Burnt Orange Palette (BRAND-01)** | Replaces navy blue (#6366f1) with emerald green (#059669) + burnt orange (#ea580c). Instantly differentiates from original | MEDIUM | Replace all `:root` CSS custom properties, recolor `.icon-cube` variants, `.grad-text`, `.pill` colors, `.btn-3d` gradients. Systematic find-and-replace in CSS |
| **Poppins/Montserrat Typography (BRAND-02)** | Modern geometric sans-serif replacing Inter + Sora. Better readability for dashboard data | LOW | Swap Google Fonts CDN URLs, update all `font-family` references in utility CSS |
| **Header Fixo + Mega Menu (BRAND-03)** | Professional layout: always-visible sticky header with categorized dropdown menu replacing sidebar. More screen real estate for content | HIGH | Restructure from `flex` with sidebar+content to single-column with header dropdown. Touch: CSS grid, dropdown animations, keyboard navigation, ARIA |
| **Glassmorphism + Neumorphism Cards (BRAND-04)** | Expand existing `.glass` system with neumorphic variants: raised, pressed, concave. Modern 2024-2026 visual language | MEDIUM | New CSS classes `.neo-card`, `.neo-raised`, `.neo-pressed`. Uses dual `box-shadow` (light + dark) technique. Combine with existing `.glass` for hybrid effects |
| **Phosphor Icons (BRAND-05)** | 9000+ professional SVG icons replacing emojis. 6 weight variants (thin, light, regular, bold, fill, duotone). Consistent rendering across platforms | MEDIUM | Map every emoji to Phosphor icon: 🧪→Flask, 🏠→House, 🧬→Dna, 📱→DeviceMobile, 📄→FilePdf, 💼→Briefcase, 📊→ChartBar, ⚙️→Gear, ❓→Question, etc. Import via CDN or npm |
| **Micro-Animations (BRAND-06)** | Smooth route transitions, staggered card entry, refined hover states. Expand existing animations: `floaty`, `spinner`, `pulse-ring` | MEDIUM | CSS `@keyframes` for entry animations. `transition` on route content swap. Preserve existing keyframe animations, add new ones for cards, modals, toasts |
| **New Name + Logo (BRAND-07)** | Brand identity independent from "Laboratorio de BMs". Potential names aligned with emerald palette | LOW | New text in sidebar header, `<title>`, all text references. Simple logo: emerald icon cube with initials |
| **New Copywriting (BRAND-08)** | Labels, tooltips, placeholders, toast messages rewritten with consistent brand voice | LOW | Systematic string replacement across all VIEWS functions, toast calls, placeholders, page titles |
| **Site HTML Gen Preserved + Rebranded** | The generated SaaS sites also get the new visual identity — consistent brand across admin dashboard AND generated customer sites | HIGH | Update `buildSiteHTML()` template: new palette, new typography, new iconography in generated HTML. Ensures generated sites match rebranded dashboard |

### Anti-Features (Do NOT Build)

Features commonly requested that would harm this project.

| Anti-Feature | Why Requested | Why Problematic | What to Do Instead |
|--------------|---------------|-----------------|-------------------|
| **Real Backend / Database** | "Let's save data server-side" | Violates 100% front-end constraint. Adds infra cost, real auth, CORS, complex deploy. Project value is zero-dependency | localStorage with JSON export/import backup (already exists in original's Configuracoes) |
| **React / Vue / Framework Rewrite** | "React is industry standard" | PROJECT.md explicitly mandates "Mesmo stack do original" and "Mesmo framework... detectados no original". Original is vanilla JS. Framework rewrite = NOT a clone | Vanilla JS SPA with same `go()` + `VIEWS` pattern. Consider Vite for build tooling but keep framework identical |
| **Real Authentication (OAuth/JWT)** | "Need login for security" | Backend complexity, session management, CSRF protection. Original is single-user (ADM: Joao Victor) with cosmetic UI only | Mock login form that saves admin name to localStorage. Purely cosmetic — gate on localStorage check, not real auth |
| **WebSocket / Real-time Server** | "Real-time data!" | System generates data locally via `setInterval`/`Math.random()` and fetches APIs on demand. No persistent data source. WebSocket requires a server | Keep polling (`setInterval` already in etapa2 SMS timer) and on-demand `fetch` calls |
| **BMS Sensor Simulation (Temp/Energy)** | "PROJECT.md says Building Management System" | PROJECT.md is WRONG about the domain. Original site has ZERO sensor data, temperature monitoring, or energy charts. Adding them builds features not in the original — violates clone scope | **Fix PROJECT.md** to match reality. If the project wants to EVOLVE toward BMS later, that's a separate milestone after clone+rebrand |
| **Charts (Recharts/D3/Chart.js)** | "Dashboard needs charts" | Original has NO charts. Only KPI stat cards with numbers. Adding charts creates divergence from original | Stat cards only. If charts are desired, add them as a NEW feature in a post-rebrand milestone, not during clone |
| **Multi-Tenancy / Multi-User** | "Multiple admins" | localStorage is inherently single-user. Multi-tenancy needs backend, auth, data isolation | Single-user with maybe a cosmetic profile selector that swaps `STORAGE_KEY` (e.g., `lab_bms_db_v1_profile2`) |
| **Dark/Light Theme Toggle** | "Users want choice" | System designed entirely for dark theme. Light theme would require reviewing EVERY color, shadow, and contrast rule — effectively 2x rebrand work | Single dark theme (standard for technical dashboards). If light theme desired later, do as rebrand variant |
| **i18n / Internationalization** | "English version too" | All content is Brazilian Portuguese (CNPJ format, BrasilAPI, CEP, phone format). Full i18n framework would bloat the bundle | Portuguese-only. If needed later, extract strings to a simple constants object |
| **PWA / Service Worker** | "Install as app" | System depends on external APIs (BrasilAPI, Cloudflare, SMS24h). Offline mode mostly broken. Service worker adds cache strategy complexity | Browser cache already keeps HTML/CSS/JS offline. localStorage is already offline. No need for SW |
| **Real SMS Sending** | "Send real SMS to clients" | Original only BUYS virtual numbers (doesn't send). SMS sending requires gateway account, cost, and is a different feature entirely | Keep SMS24h integration for number purchasing only (match original). SMS sending is future milestone |
| **Drag-and-Drop Dashboard Layout** | "Customizable layout" | Massive complexity for limited value. Dashboard has fixed well-designed layout (6 quick-cards + 4 stats). Customization doesn't improve utility | Fixed responsive grid layout. Rebrand's new layout (Header + Mega Menu) is structural improvement enough |

## Feature Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                   REVERSE ENGINEERING (Phase 1)              │
│                                                              │
│  DOM Extract ──> Component Inventory ──> Clone Scaffold      │
│  JS Extract  ──> State Map ──────────> Data Layer            │
│  CSS Extract  ──> Design Tokens ──────> Tailwind Config      │
│  Network Capt.──> API Contracts ──────> Mock/Proxy Layer     │
│  Route Map    ──> SPA Router ────────> Navigation            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   CLONE PHASE (Phase 2-3)                    │
│                                                              │
│  localStorage Persistence (FOUNDATION)                       │
│      │                                                       │
│      ├──required by──> ALL data-driven views                 │
│      │                                                       │
│  Component Library (statCard, quickCard, stepBox, etc.)      │
│      │                                                       │
│      ├──used by──> Dashboard, Banco, Planilha, Etapas        │
│      │                                                       │
│  SPA Router (go + VIEWS + navigation)                        │
│      │                                                       │
│      ├──> Dashboard                                          │
│      │      └──requires──> KPI Stats (localStorage)          │
│      │      └──requires──> API Status Pills (settings)       │
│      │                                                       │
│      ├──> Etapa 1 (5-step Wizard)                            │
│      │      ├──requires──> CNPJ Lookup (BrasilAPI fetch)     │
│      │      ├──requires──> Domain Engine (7 algorithms)      │
│      │      ├──requires──> Site HTML Generator (template)    │
│      │      ├──requires──> Cloudflare API Client (5 steps)   │
│      │      └──writes to──> localStorage (empresa + site)    │
│      │                                                       │
│      ├──> Etapa 2 (SMS Purchase)                             │
│      │      ├──requires──> SMS24h API Client                 │
│      │      ├──requires──> Cloudflare API (re-deploy site)   │
│      │      └──updates──> localStorage (site phone number)   │
│      │                                                       │
│      ├──> Etapa 3 (PDF Editor)                               │
│      │      ├──requires──> pdf.js (CDN rendering)            │
│      │      ├──requires──> pdf-lib (CDN merge)               │
│      │      └──requires──> Address Field Extractor (regex)   │
│      │                                                       │
│      ├──> Banco de Empresas                                  │
│      │      ├──reads from──> localStorage (empresas)         │
│      │      ├──has──> search + filter                        │
│      │      └──feeds into──> Etapa 1 ("Usar na Etapa 1")    │
│      │                                                       │
│      ├──> Planilha                                           │
│      │      ├──reads from──> localStorage (sites)            │
│      │      ├──has──> status dropdown + delete               │
│      │      └──exports──> CSV (Excel-compatible)             │
│      │                                                       │
│      ├──> Configuracoes                                      │
│      │      ├──reads/writes──> localStorage (settings)       │
│      │      ├──required by──> Etapa 1 (Cloudflare token)     │
│      │      ├──required by──> Etapa 2 (SMS24h key)           │
│      │      └──has──> backup/restore (JSON file)             │
│      │                                                       │
│      └──> Ajuda (static content, no dependencies)            │
│                                                              │
│  Shared Infrastructure:                                      │
│      ├── Toast System (all views use it)                     │
│      ├── Modal System (used by Etapas, Planilha)             │
│      ├── Clipboard Copy (used extensively)                   │
│      ├── Formatting Utils (CNPJ, BRL, date, phone, slug)     │
│      └── CORS Proxy / API Mock Layer                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   REBRAND PHASE (Phase 4-5)                  │
│                                                              │
│  Design Token Migration (CSS vars → new palette)              │
│      └──required by──> ALL visual components                 │
│                                                              │
│  Typography Swap (Google Fonts CDN)                           │
│      └──affects──> ALL text rendering                        │
│                                                              │
│  New Layout (Header + Mega Menu)                              │
│      └──CONFLICTS with──> existing Sidebar (must replace)    │
│                                                              │
│  Icon Migration (Emoji → Phosphor SVG)                        │
│      └──touches──> ALL views (every emoji mapped)            │
│                                                              │
│  New Branding (Logo, Name, Copywriting)                       │
│      └──requires──> all text strings identified + replaced   │
│                                                              │
│  Micro-Animations                                             │
│      └──enhances──> view transitions + component states      │
│                                                              │
│  Generated Site Rebrand                                       │
│      └──requires──> buildSiteHTML() template updated         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   VALIDATION PHASE (Phase 6)                 │
│                                                              │
│  A/B Testing (Clone vs Original, side-by-side)               │
│      └──requires──> Complete Clone (all REPL features)       │
│                                                              │
│  Storage Compatibility Test                                   │
│      └──requires──> localStorage layer done                  │
│                                                              │
│  Responsiveness Test (all breakpoints)                        │
│      └──requires──> ALL views rendered                       │
│                                                              │
│  Bundle Size Benchmark (<= 20% larger than original)          │
│      └──requires──> Complete build output                    │
└─────────────────────────────────────────────────────────────┘
```

### Critical Dependency Notes

1. **localStorage is THE foundation.** Every data-driven view reads from `getDB()` or `getSettings()`. Build this FIRST in the clone phase.
2. **Component library must precede views.** All views use `statCard()`, `quickCard()`, `stepBox()`, `pill`, `btn-3d`, `icon-cube`. Build component factory before any view.
3. **Cloudflare API client is the most complex integration.** 5-step pipeline (project → JWT → BLAKE3 hash → upload → deploy). Build and test in isolation before wiring into Etapa 1.
4. **Site HTML Generator is the largest single function.** ~300 lines of template string with embedded CSS, responsive grid, conditional sections. Test with multiple company profiles.
5. **PDF Editor requires two CDN libraries.** pdf.js (render) + pdf-lib (download). Both must load before Etapa 3 is accessible.
6. **Rebrand MUST follow clone completion.** The `go()`, `VIEWS`, and state must work identically before visual changes begin — otherwise you can't A/B test.

## MVP Definition

### Recomendation: Phase Structure

#### Phase 2-3: Clone (Functional Parity)

- [ ] **SPA Router + 8 Views** — Identical navigation with same titles and subtitles
- [ ] **localStorage Persistence** — Same keys, same data structures
- [ ] **Dashboard** — Hero card, KPI stats (4), quick-access cards (6), API status warning
- [ ] **Etapa 1 (5-step Wizard)** — CNPJ lookup, domain engine, meta-tag, site generator, Cloudflare deploy
- [ ] **Etapa 2 (SMS Purchase)** — Country/service select, buy number, SMS polling, re-deploy
- [ ] **Etapa 3 (PDF Editor)** — PDF renderer, text overlays, field mapping, PDF download
- [ ] **Banco de Empresas** — Company grid, search, filter, "Usar na Etapa 1"
- [ ] **Planilha** — Sites table, status dropdown, delete, CSV export
- [ ] **Configuracoes** — Cloudflare token + auto-detect, SMS24h key, backup/restore
- [ ] **Ajuda** — Static help with step-by-step guides
- [ ] **Toast + Modal + Clipboard** — Shared UI infrastructure
- [ ] **Responsive Design** — 1024px breakpoint with collapsible sidebar
- [ ] **All Formatting Utils** — CNPJ, BRL, date, phone, slug, HTML escape
- [ ] **CORS Proxy / API Mock Layer** — Replicate Netlify proxy or mock for offline dev

#### Phase 4-5: Rebrand (New Visual Identity)

- [ ] **New Color Palette** — Emerald + burnt orange
- [ ] **New Typography** — Poppins or Montserrat
- [ ] **New Layout** — Header fixo + Mega Menu
- [ ] **New Cards** — Glassmorphism + Neumorphism
- [ ] **New Iconography** — Phosphor Icons
- [ ] **Micro-Animations** — Route transitions, hover states
- [ ] **New Name + Logo** — Brand identity
- [ ] **New Copywriting** — Consistent brand voice
- [ ] **Generated Site Rebrand** — Updated buildSiteHTML template

#### Phase 6: Validation (Quality Gate)

- [ ] **A/B Testing** — Clone vs original, all 8 routes
- [ ] **Storage Test** — Same data structures, compatibility
- [ ] **Responsiveness Test** — All breakpoints
- [ ] **Bundle Size** — <= 20% larger than original

### Deferred (Future Milestones)

- [ ] Multi-profile selector (cosmetic, swaps STORAGE_KEY)
- [ ] Theme color variants beyond dark
- [ ] Real BMS sensor/equipment features (separate milestone)
- [ ] PWA install prompt
- [ ] i18n

## Feature Prioritization Matrix

| Feature | User Value | Impl Cost | Priority | Phase |
|---------|------------|-----------|----------|-------|
| SPA Router + Navigation | HIGH | LOW | P1 | Clone |
| localStorage Persistence | HIGH | LOW | P1 | Clone |
| Component Library | HIGH | MEDIUM | P1 | Clone |
| Dashboard View | HIGH | MEDIUM | P1 | Clone |
| Etapa 1 Wizard (5 steps) | HIGH | HIGH | P1 | Clone |
| Cloudflare API Client | HIGH | HIGH | P1 | Clone |
| Site HTML Generator | HIGH | HIGH | P1 | Clone |
| SMS24h API Client | MEDIUM | MEDIUM | P1 | Clone |
| PDF Editor (Etapa 3) | MEDIUM | HIGH | P1 | Clone |
| Banco de Empresas | MEDIUM | MEDIUM | P1 | Clone |
| Planilha | MEDIUM | MEDIUM | P1 | Clone |
| Configuracoes | HIGH | MEDIUM | P1 | Clone |
| Toast + Modal + Clipboard | MEDIUM | LOW | P1 | Clone |
| Formatting Utils | MEDIUM | LOW | P1 | Clone |
| CORS Proxy / API Mock | MEDIUM | MEDIUM | P1 | Clone |
| Responsive Design | HIGH | LOW | P1 | Clone |
| Ajuda | LOW | LOW | P2 | Clone |
| Color Palette (BRAND-01) | HIGH | MEDIUM | P1 | Rebrand |
| Typography (BRAND-02) | MEDIUM | LOW | P1 | Rebrand |
| New Layout (BRAND-03) | HIGH | HIGH | P1 | Rebrand |
| Cards (BRAND-04) | MEDIUM | MEDIUM | P2 | Rebrand |
| Phosphor Icons (BRAND-05) | MEDIUM | MEDIUM | P1 | Rebrand |
| Micro-animations (BRAND-06) | LOW | MEDIUM | P2 | Rebrand |
| Logo + Name (BRAND-07) | HIGH | LOW | P1 | Rebrand |
| Copywriting (BRAND-08) | MEDIUM | LOW | P2 | Rebrand |
| Gen Site Rebrand | MEDIUM | HIGH | P2 | Rebrand |
| A/B Testing | HIGH | MEDIUM | P1 | Validation |
| Storage Test | HIGH | LOW | P1 | Validation |
| Responsiveness Test | HIGH | LOW | P1 | Validation |
| Bundle Size Check | MEDIUM | LOW | P1 | Validation |

**Priority key:** P1 = Must have for phase, P2 = Important but phase can complete without, P3 = Future

## Original System: Feature Inventory Summary

From full reverse engineering (2135 lines of unminified JS source) of `laboratoriodebms.netlify.app`:

| Module | Lines | Key Functions | State Variables | External APIs |
|--------|-------|---------------|-----------------|---------------|
| Core/Infra | ~80 | `go()`, `getDB()`, `saveDB()`, `getSettings()`, `saveSettings()`, `toast()`, `openModal()`, `closeModal()`, `toggleSidebar()` | `ROUTES`, `VIEWS`, `STORAGE_KEY`, `SETTINGS_KEY` | — |
| Dashboard | ~50 | `VIEWS.dashboard`, `statCard()`, `quickCard()` | — (reads from getDB/getSettings) | — |
| Etapa 1 | ~350 | `VIEWS.etapa1`, `e1Buscar()`, `e1Gerar()`, `e1Publicar()`, `gerarSugestoesDominio()`, `stepBox()`, `normalizarBrasilAPI()`, `salvarEmpresa()` | `etapa1State` (5 fields) | BrasilAPI, Cloudflare Pages API, esm.sh |
| Etapa 2 | ~200 | `VIEWS.etapa2`, `smsAPI()`, `smsPolling()`, `atualizarSiteComNumero()` | `etapa2State` (4 fields) | SMS24h API, Cloudflare Pages API |
| Etapa 3 | ~200 | `VIEWS.etapa3`, `carregarPDF()`, `rerenderOverlays()`, `baixarPDF()`, `mapearCampos()`, `extrairCamposEndereco()` | `pdfState` (4 fields) | pdf.js CDN, pdf-lib CDN |
| Banco | ~70 | `VIEWS.banco`, `renderBanco()`, `limparBanco()`, `usarEmpresaNaEtapa1()` | — | — |
| Planilha | ~80 | `VIEWS.planilha`, `renderPlanilha()`, `mudarStatus()`, `removerSite()`, `exportCSV()` | — | — |
| Config | ~150 | `VIEWS.config`, `salvarConfig()`, `salvarTokenCF()`, `escolherConta()`, `testarCloudflare()`, `testarSMS()`, `exportBackup()`, `importBackup()` | — | Cloudflare API, SMS24h API |
| Ajuda | ~40 | `VIEWS.ajuda`, `ajuda()` | — | — |
| Site Gen | ~300 | `buildSiteHTML()`, `calcAnos()` | — | — |
| Boot/Proxy | ~40 | `autoConectarTokens()`, `instalarProxy()` | — | — |
| Utils | ~50 | `fmtCNPJ()`, `fmtMoney()`, `fmtDate()`, `formatBRPhone()`, `slugify()`, `escapeHTML()`, `copyText()`, `onlyDigits()`, `refreshHeaderStatus()` | — | — |
| CSS | ~200 | `:root` vars, `.glass`, `.grad-card`, `.neon`, `.btn-3d` (8 variants), `.icon-cube` (5 variants), `.pill` (5 variants), `.nav-link`, `.step-card`, `.input`, animations | — | Tailwind CDN |
| **TOTAL** | **~2135** | **~60 functions** | **3 state objects** | **4 external services** |

## Sources

- **Primary:** Full reverse engineering of `https://laboratoriodebms.netlify.app/` — HTML + 2135 lines of unminified inline JavaScript source extracted via `webfetch` (format: html) — HIGH confidence
- **Secondary:** Original CSS design system extracted from inline `<style>` block — all CSS custom properties, component classes, animations — HIGH confidence
- **Domain:** Brazilian business operations domain — CNPJ (Receita Federal company ID), CNAE (economic activity classification), BrasilAPI public REST API — HIGH confidence
- **APIs:** Cloudflare Pages API documentation, SMS24h API, pdf.js/pdf-lib CDN libraries — HIGH confidence
- **Note on PROJECT.md:** The PROJECT.md description of "Building Management System with temperature sensors and energy monitoring" does NOT match the actual system. This research is based on the REAL system, not the PROJECT.md description. The PROJECT.md should be updated to reflect the actual domain.

---

*Feature research for: BMS Replica (Laboratorio de BMs clone + rebrand)*
*Researched: 2026-06-27*
*Source: Reverse engineering of production system at laboratoriodebms.netlify.app*