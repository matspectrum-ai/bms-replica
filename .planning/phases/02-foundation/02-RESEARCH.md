# Phase 02: Foundation - Research

**Researched:** 2026-06-27
**Domain:** Vanilla JavaScript SPA (client-side routing, localStorage persistence, factory function widgets, dark-theme design system)
**Confidence:** MEDIUM (Core patterns confirmed via RECON.md source analysis; Tailwind CDN confirmed via official docs; ES module patterns confirmed via MDN)

## Summary

Phase 02 builds the complete application skeleton: SPA router, localStorage persistence layer, reusable widget factory functions, formatting utilities, layout components (sidebar, header, backdrop), dark theme design system with 13 CSS custom properties and 23 component classes, and a CORS proxy layer. All code is vanilla JavaScript organized by technical layer (por camada), loaded via CDN with no bundler. Views are stubs only — functional views come in Phase 03.

The original system (~2135 lines single-file) uses inline onclick handlers (`onclick="go('dashboard')"`) which require global function references. The modular rebuild must balance ES module encapsulation with the need to expose ~8 functions to `window` for inline event handlers. This is consistent with the original's pattern (line 2128).

**Primary recommendation:** Use ES modules with `<script type="module" src="src/main.js">` as the entry point. Each module file exports its functions. `main.js` imports all modules and explicitly attaches the 8 global-required functions to `window` (go, toggleSidebar, closeModal, copyText, escapeHTML, onlyDigits, toast, openModal). This preserves the inline onclick pattern required by user decision D-04 while gaining module organization.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SPA Routing (CORE-01) | Browser / Client | — | Hash-free navigation via innerHTML swap, no server-side routing |
| Sidebar Navigation (CORE-02) | Browser / Client | — | Static DOM element with CSS transitions, JS toggles classes |
| localStorage Persistence (CORE-03) | Browser / Client | — | Client-side only; keys `lab_bms_db_v1` + `lab_bms_settings_v1` |
| Sticky Header (CORE-04) | Browser / Client | — | Static DOM with dynamic title/pill updates via JS |
| Toast System (CORE-05) | Browser / Client | — | Fixed-position DOM element, setTimeout auto-dismiss |
| Modal System (CORE-06) | Browser / Client | — | Fixed overlay, innerHTML content injection, backdrop click close |
| Clipboard Utility (CORE-07) | Browser / Client | — | navigator.clipboard.writeText + toast feedback |
| Formatting Utils (CORE-08) | Browser / Client | — | Pure functions: no side effects, no API calls |
| CORS Proxy (CORE-09) | Browser / Client | — | Monkey-patches window.fetch; no server component |
| Responsive Design (UI-01) | Browser / Client | — | CSS media query at 1024px, no server-side detection |
| Dark Theme (UI-02) | Browser / Client | — | CSS custom properties on :root, no JS toggle needed |
| 3D Buttons (UI-03) | Browser / Client | — | Pure CSS (gradients + multi-layer box-shadow) |
| Icon Cubes (UI-04) | Browser / Client | — | Pure CSS (gradients + inner highlight shadow) |
| Reusable Widgets (UI-05) | Browser / Client | — | Factory functions returning HTML strings or DOM elements |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Organização por camada técnica: `src/stores/`, `src/router/`, `src/views/` (stubs), `src/widgets/`, `src/utils/`, `src/styles/`. Cada diretório contém os módulos daquela camada. `index.html` na raiz com entry point `src/main.js`.
- **D-02:** HTML plano + CDN (igual ao original). Sem Vite, sem npm build step, sem bundler. Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`). Dependências externas (pdf.js, pdf-lib, @noble/hashes) via CDN com versões pinadas conforme RECON.md. Isso garante bundle size próximo ao original e facilita deploy no Netlify.
- **D-03:** Factory functions retornando strings HTML ou elementos DOM (igual ao original). Ex: `createStatCard(config)` → string HTML, `createModal(html)` → DOM element. Sem classes, sem Web Components, sem frameworks. Cada widget recebe um objeto de configuração e retorna HTML + opcionalmente setup de eventos.
- **D-04:** A estrutura de código deve seguir os padrões documentados no RECON.md (Phase 1). Funções devem ter os mesmos nomes e assinaturas quando possível. As diferenças são apenas organizacionais (módulos separados vs arquivo único).

### the agent's Discretion

- Nomes exatos dos arquivos dentro de cada diretório
- Ordem de implementação dentro da fase
- Estratégia de carregamento dos módulos (script tags ordenadas no HTML vs dynamic imports)
- Detalhes de implementação de cada widget que não afetam o comportamento externo

### Deferred Ideas (OUT OF SCOPE)

Nenhum — discussão ficou dentro do escopo da fase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-01 | SPA Router vanilla JS com 8 rotas, hash-free, title dinâmico e active nav-link | §5.1 Router Pattern — identical to original `go()` function with ROUTES flat array + titles object |
| CORE-02 | Sidebar Navigation com 3 categorias, data-route, colapso mobile em 1024px | §5.4 Sidebar Pattern — static HTML + CSS classes, no JS class needed |
| CORE-03 | localStorage Persistence com chaves `lab_bms_db_v1` e `lab_bms_settings_v1`, JSON com fallback defaults | §5.3 DataStore Pattern — matches original getDB/saveDB/getSettings/saveSettings |
| CORE-04 | Sticky Header com blur, título dinâmico, pills de status API | §5.2 Header Pattern — static HTML, JS updates textContent only |
| CORE-05 | Toast Notification System — bottom-center, emoji icon, auto-dismiss 3s | §6.2 Toast Widget — factory returning DOM element, global toast() function |
| CORE-06 | Generic Modal System — overlay, HTML content, background click close | §6.3 Modal Widget — static HTML shell, JS show/hide + content injection |
| CORE-07 | Clipboard Copy Utility com feedback toast | §5.5 copyText — navigator.clipboard.writeText + toast wrapper |
| CORE-08 | Data Formatting Utilities (fmtCNPJ, fmtMoney, fmtDate, formatBRPhone, slugify, escapeHTML) | §5.6 Format Utils — pure functions, no dependencies |
| CORE-09 | CORS Proxy / API Mock Layer para desenvolvimento offline | §5.7 Proxy Layer — monkey-patches window.fetch, URL rewriting |
| UI-01 | Responsive Design com breakpoint 1024px | §4.1 CSS Responsive — CSS media query, sidebar fixed overlay pattern |
| UI-02 | Dark Theme + Glassmorphism via CSS custom properties | §4.2 CSS Design System — 13 :root properties, .glass/.grad-card/.neon classes |
| UI-03 | 3D Button System com 8 variantes de cor | §4.3 3D Buttons — .btn-3d base + 7 color variants (.success/.warn/.danger/.cyan/.purple/.ghost/.sm) |
| UI-04 | Icon Cube Design System com 5 variantes de cor | §4.4 Icon Cubes — .icon-cube base + 5 color variants (.cyan/.green/.purple/.amber/.rose) |
| UI-05 | Componentes reutilizáveis (statCard, quickCard, stepBox) | §6.1 Widget Factories — statCard, quickCard, stepBox with config validation |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript (ES2020+) | — | All application logic | Locked decision D-02/D-03; original uses vanilla JS |
| Tailwind CSS v3 | 3.4.x (pinned via CDN) | Utility-first CSS framework | Original uses `cdn.tailwindcss.com`; locked decision D-02 |
| Google Fonts: Inter | latest (weights 400,500,600,700,800) | Body font | Original font; documented in RECON.md §6.1.8 |
| Google Fonts: Sora | latest (weights 600,700,800) | Display/heading font | Original font; documented in RECON.md §6.1.8 |
| `@noble/hashes` (BLAKE3) | latest (via esm.sh CDN) | Cloudflare Pages hash computation | Required for CORE-09 proxy; original uses dynamic import |
| pdf.js | 3.11.174 (pinned via cdnjs) | PDF rendering (Phase 03 Etapa 3) | Original pinned CDN; loaded lazily in Etapa 3 |
| pdf-lib | latest (via jsdelivr CDN) | PDF merge/download (Phase 03) | Original dependency; loaded lazily in Etapa 3 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None additional | — | — | All logic is vanilla JS; no frameworks, no state libs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ES modules via `<script type="module">` | Classic `<script>` tags in dependency order | Modules: cleaner code organization, "use strict" by default, tree-shaking-capable; Classic: no CORS requirements, simpler `file://` dev. Modules chosen for cleaner architecture per agent's discretion. |
| Tailwind v3 CDN | Tailwind v4 CDN (`@tailwindcss/browser@4`) | v4 uses CSS-first config (`@theme` blocks) which would require rewriting CSS custom properties from RECON.md; v3 uses JS config (`tailwind.config = {...}`) matching the original exactly. v3 CDN is well-documented and stable. |
| Dynamic `import()` for lazy loading | All scripts loaded upfront | Dynamic imports: paid for by 200ms latency per import; Upfront: simpler dependency graph. This app is small enough (~2135 lines modularized) that upfront loading is fine. Dynamic imports used only for pdf.js/pdf-lib (heavy, not always needed). |

**Installation:**
```bash
# No npm install — CDN only. All files are plain JS/CSS.
# To serve locally for development (ES modules require HTTP, not file://):
npx serve . -p 3000   # or: python3 -m http.server 3000
```

**Version verification:** Tailwind v3 CDN supports version pinning via path:
- `https://cdn.tailwindcss.com/3.4.0` — pins to exact v3.4.x minor
- `https://cdn.tailwindcss.com` — always latest v3 (unpinned, used by original)
- v4 CDN: `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` [VERIFIED: tailwindcss.com/docs/installation/play-cdn]

## Package Legitimacy Audit

> No npm packages are installed in this phase. The phase uses CDN scripts and plain JavaScript files only. Tailwind CSS is loaded via CDN (`cdn.tailwindcss.com`), which is the official Tailwind Labs distribution. Google Fonts are loaded via `fonts.googleapis.com`. PDF libraries (pdf.js, pdf-lib, @noble/hashes) are CDN-loaded with pinned versions and are REQUIRED only for Phase 03 (not this phase). The CORS proxy layer may reference these but does not load them.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| tailwindcss (CDN) | cdn.tailwindcss.com | ~4 yrs | Official CDN | github.com/tailwindlabs/tailwindcss | N/A (not npm) | Approved — official distribution |
| Google Fonts | fonts.googleapis.com | ~10 yrs | N/A | N/A | N/A (not npm) | Approved — official Google CDN |
| pdf.js 3.11.174 | cdnjs.cloudflare.com | — | Official CDN | github.com/mozilla/pdf.js | N/A (not npm) | Approved — Phase 03 only |
| pdf-lib | jsdelivr.net | — | Official CDN | github.com/Hopding/pdf-lib | N/A (not npm) | Approved — Phase 03 only |
| @noble/hashes | esm.sh | — | N/A | github.com/paulmillr/noble-hashes | N/A (not npm) | Approved — Phase 03 only |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*This phase does not install any npm packages. All dependencies are CDN scripts sourced from official distribution channels.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          index.html (static shell)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Backdrop │  │ Sidebar  │  │  Header  │  │  Toast   │  │  Modal   │ │
│  │  #back-  │  │ #sidebar │  │ <header> │  │  #toast  │  │#modal-   │ │
│  │  drop    │  │ 8 nav-   │  │ title+   │  │  bottom  │  │  back +  │ │
│  │          │  │ links    │  │ pills    │  │  center  │  │  body    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                                          │
│  <section id="view">  ←── innerHTML injected by go(route)               │
│     (empty on page load, filled by router)                               │
│  </section>                                                              │
│                                                                          │
│  <script src="https://cdn.tailwindcss.com/3.4.0">  ←── Tailwind v3 CDN  │
│  <script type="module" src="src/main.js">  ←── App entry point          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │      src/main.js (entry)       │
                    │  - Imports all modules         │
                    │  - Exposes globals to window   │
                    │  - Calls autoConectarTokens()  │
                    │  - Calls instalarProxy()       │
                    │  - Calls refreshHeaderStatus() │
                    │  - Calls go('dashboard')       │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   ┌─────────┐   ┌─────────┐  ┌─────────┐ ┌─────────┐   ┌─────────┐
   │ stores/ │   │ router/ │  │ views/  │ │widgets/ │   │ utils/  │
   │         │   │         │  │         │ │         │   │         │
   │getDB()  │   │ROUTES[] │  │STUBS    │ │statCard │   │fmtCNPJ  │
   │saveDB() │   │titles{} │  │ONLY     │ │quickCard│   │fmtMoney │
   │getSett- │   │VIEWS{}  │  │(Phase 3)│ │stepBox  │   │fmtDate  │
   │ings()   │   │go()     │  │         │ │toast()  │   │slugify  │
   │saveSett-│   │toggle-  │  │         │ │open-    │   │escape-  │
   │ings()   │   │Sidebar()│  │         │ │Modal()  │   │HTML()   │
   └─────────┘   └─────────┘  └─────────┘ └─────────┘   └─────────┘
        │               │
        ▼               ▼
   localStorage   DOM (#view, #page-title, #page-subtitle,
   (lab_bms_db    [data-route] elements, #sidebar, #backdrop)
   _v1, lab_bms
   _settings_v1)

External (Phase 03 only):
   BrasilAPI  ←→  Cloudflare Pages API  ←→  SMS24h API
        │               │                      │
        └───────────────┴──────────────────────┘
                        │
              CORS Proxy Layer (instalarProxy)
              Monkey-patches window.fetch
              Rewrites upstream URLs → /cf-api/, /sms-api/
```

### Recommended Project Structure

```
index.html                      # Static shell + CDN scripts + module entry
src/
├── main.js                     # Entry point: imports all, exposes globals, boots app
├── stores/
│   └── data.js                 # getDB(), saveDB(), getSettings(), saveSettings()
├── router/
│   └── index.js                # ROUTES[], titles{}, go(), VIEWS{}, toggleSidebar()
├── views/                      # STUBS only for Phase 02
│   ├── dashboard.js            # VIEWS.dashboard — returns "Dashboard placeholder"
│   ├── etapa1.js               # VIEWS.etapa1 — returns "Etapa 1 placeholder"
│   ├── etapa2.js               # VIEWS.etapa2 — returns "Etapa 2 placeholder"
│   ├── etapa3.js               # VIEWS.etapa3 — returns "Etapa 3 placeholder"
│   ├── banco.js                # VIEWS.banco — returns "Banco de Empresas placeholder"
│   ├── planilha.js             # VIEWS.planilha — returns "Planilha placeholder"
│   ├── config.js               # VIEWS.config — returns "Configurações placeholder"
│   └── ajuda.js                # VIEWS.ajuda — returns "Ajuda placeholder"
├── widgets/
│   ├── statCard.js             # statCard(icon, label, value, color) → HTML string
│   ├── quickCard.js            # quickCard(icon, title, desc, route, color) → HTML string
│   ├── stepBox.js              # stepBox(n, ico, title, done, body, disabled?) → HTML string
│   ├── toast.js                # toast(msg, icon?) — DOM manipulation + timer
│   ├── modal.js                # openModal(html), closeModal() — DOM manipulation
│   └── pill.js                 # pill(label, variant) → HTML string (utility)
├── utils/
│   ├── format.js               # fmtCNPJ, fmtMoney, fmtDate, formatBRPhone
│   ├── string.js               # slugify, escapeHTML, onlyDigits
│   ├── clipboard.js            # copyText(text, msg?) — clipboard + toast
│   └── header.js               # refreshHeaderStatus() — header pill updates
├── proxy/
│   └── index.js                # instalarProxy() — monkey-patches window.fetch
└── styles/
    ├── theme.css                # :root CSS custom properties (13 variables)
    ├── components.css           # .glass, .grad-card, .neon, .ring-glow, .grad-text
    ├── buttons.css              # .btn-3d + 8 variants, .btn-3d:active, .btn-3d:disabled
    ├── icon-cube.css            # .icon-cube + 6 color variants
    ├── navigation.css           # .nav-link, .nav-link:hover, .nav-link.active, .nav-emoji
    ├── pills.css                # .pill + 5 variants (.ok/.todo/.doing/.done/.danger)
    ├── inputs.css               # .input, .input:focus, textarea.input, select.input
    ├── steps.css                # .step-card, .step-card.disabled, .step-num
    ├── layout.css               # .sidebar, .backdrop, .content-wrap, header styles
    ├── misc.css                 # .copy-row, .empty, .scrollbar, .file-drop, .switch-tab
    ├── pdf.css                  # .pdf-canvas-wrap, .pdf-overlay-text (needed later)
    ├── animations.css           # @keyframes float, spin, pulse-ring; .floaty, .spinner, .pulse-ring
    ├── responsive.css           # @media (max-width: 1024px) — sidebar collapse
    └── tailwind-config.js       # tailwind.config = { theme: { extend: { fontFamily: {...} } } }
```

### Pattern 1: Hash-Free SPA Router

**What:** A single `go(route)` function that validates the route against a flat `ROUTES` array, toggles `.active` on `[data-route]` elements, updates page title/subtitle, sets `#view.innerHTML = VIEWS[route]()`, scrolls to top, closes mobile sidebar, and runs a post-render hook. This is the exact pattern from the original (RECON.md §4.3).

**When to use:** Every navigation event in the app. Sidebar clicks, in-view buttons, post-action redirects. The original has 35+ call sites.

**Example:**
```javascript
// src/router/index.js — matches original go() exactly (RECON.md lines 286-305)
export const ROUTES = ['dashboard','etapa1','etapa2','etapa3','banco','planilha','config','ajuda'];

export const VIEWS = {}; // Populated by view modules

export function go(route) {
  if (!ROUTES.includes(route)) route = 'dashboard';                     // Step 1: Validation
  document.querySelectorAll('[data-route]').forEach(el => {             // Step 2: Nav toggle
    el.classList.toggle('active', el.dataset.route === route);
  });
  const titles = {                                                      // Step 3: Title lookup
    dashboard: ['🏠 Início',                'Bem-vindo, João Victor!'],
    etapa1:    ['🧬 Etapa 1 — Criar Site',   'Fluxo automático: CNPJ → Domínio → Meta → Site → Publicar'],
    etapa2:    ['📱 Etapa 2 — Comprar Número','SMS24h integrado para verificação Facebook'],
    etapa3:    ['📄 Etapa 3 — Editor PDF',   'Edite PDFs e mapeie campos do endereço'],
    banco:     ['💼 Banco de Empresas',      'Histórico de CNPJs consultados'],
    planilha:  ['📊 Planilha de Sites',      'Status de cada site publicado'],
    config:    ['⚙️ Configurações',          'Tokens e chaves de API'],
    ajuda:     ['❓ Ajuda',                  'Como cada parte funciona']
  };
  document.getElementById('page-title').textContent = titles[route][0];
  document.getElementById('page-subtitle').textContent = titles[route][1];
  document.getElementById('view').innerHTML = VIEWS[route]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toggleSidebar(false);
  if (typeof window['after_' + route] === 'function') window['after_' + route]();
}

// Sidebar toggle — matches original toggleSidebar() (RECON.md lines 252-255)
export function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('backdrop').classList.toggle('open', open);
}
```

**Key architecture notes:**
- No History API (no pushState, no popstate). Browser back button exits the app. This matches the original exactly.
- No duplicate-navigation guard. Calling `go('etapa1')` when already on Etapa 1 re-renders. Matches original behavior.
- Post-render hooks (`window['after_' + route]`) used by Banco and Planilha views to render data into containers that don't exist yet at VIEWS render time.
- All functions called from inline onclick MUST be on `window` (go, toggleSidebar, closeModal, copyText, toast, openModal, escapeHTML, onlyDigits).

### Pattern 2: Global Exposure for Inline Handlers

**What:** Functions needed by inline DOM event handlers (`onclick="go('dashboard')"`, `onclick="copyText(val, 'Copiado!')"`) must be attached to `window` because ES module exports are module-scoped, not global.

**When to use:** Every function referenced in an inline onclick/onchange/oninput attribute in HTML templates. The original exposes 8 functions to `window` (RECON.md line 2128).

**Example:**
```javascript
// src/main.js
import { go, toggleSidebar, VIEWS } from './router/index.js';
import { toast } from './widgets/toast.js';
import { openModal, closeModal } from './widgets/modal.js';
import { copyText } from './utils/clipboard.js';
import { escapeHTML } from './utils/string.js';
import { onlyDigits } from './utils/string.js';
import { getDB, saveDB, getSettings, saveSettings } from './stores/data.js';
import { refreshHeaderStatus } from './utils/header.js';
import { instalarProxy } from './proxy/index.js';

// Expose for inline onclick handlers (matches original line 2128)
window.go = go;
window.toggleSidebar = toggleSidebar;
window.closeModal = closeModal;
window.copyText = copyText;
window.escapeHTML = escapeHTML;
window.onlyDigits = onlyDigits;
window.toast = toast;
window.openModal = openModal;

// Bootstrap (matches original lines 2089-2132)
instalarProxy();
refreshHeaderStatus();
go('dashboard');
```

### Pattern 3: localStorage DataStore with Fallback Defaults

**What:** Two accessor pairs (`getDB`/`saveDB` for app data, `getSettings`/`saveSettings` for configuration) wrap localStorage with try/catch JSON parsing and schema defaults. This matches the original pattern exactly (RECON.md §3.1-3.2).

**When to use:** All data reads and writes. No direct localStorage access anywhere else in the codebase.

**Example:**
```javascript
// src/stores/data.js
// Source: RECON.md lines 209-221 — matches original exactly
const STORAGE_KEY = 'lab_bms_db_v1';
const SETTINGS_KEY = 'lab_bms_settings_v1';

export function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { empresas: [], sites: [], sms: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Corrupted localStorage DB, using defaults');
    return { empresas: [], sites: [], sms: [] };
  }
}

export function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Corrupted localStorage settings, using defaults');
    return {};
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  refreshHeaderStatus(); // Side effect: update API status pills
}
```

**Schema defaults (matches original RECON.md):**
- `getDB()` returns: `{ empresas: [], sites: [], sms: [] }` when key missing or corrupt
- `getSettings()` returns: `{}` when key missing or corrupt
- All fields are optional (downstream code null-checks `s.cf_token`, `s.cf_account`, `s.sms_key`)
- No schema versioning — the original does not use it. The clone preserves this simplicity.

### Pattern 4: Widget Factory Functions

**What:** Pure functions that take a configuration object, return an HTML string (or DOM element), and optionally attach event listeners. No classes, no `this`, no Web Components. This matches the original's `statCard()`, `quickCard()`, `stepBox()`, `ajuda()`, `pill()` functions.

**When to use:** Every reusable UI component. Each widget is a standalone factory function with zero dependencies on other widgets.

**Example:**
```javascript
// src/widgets/statCard.js
// Source: RECON.md lines 368-374 — matches original statCard() exactly
export function statCard(icon, label, value, color) {
  const formatted = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  return `
    <div class="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div class="icon-cube ${color}">${icon}</div>
      <div class="text-3xl font-extrabold mt-3">${formatted}</div>
      <div class="text-slate-400 text-sm">${label}</div>
    </div>
  `;
}

// src/widgets/quickCard.js
// Source: RECON.md lines 375-386 — matches original quickCard() exactly
export function quickCard(icon, title, desc, route, color) {
  return `
    <div class="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
         onclick="go('${route}')">
      <div class="icon-cube ${color}" style="width:44px;height:44px;font-size:20px">${icon}</div>
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm text-slate-400">${desc}</div>
      </div>
    </div>
  `;
}

// src/widgets/stepBox.js
// Source: RECON.md lines 428-440 — matches original stepBox() exactly
export function stepBox(n, ico, title, done, body, disabled = false) {
  const doneClass = done ? ' done' : '';
  const disabledClass = disabled ? ' disabled' : '';
  return `
    <div class="glass step-card mb-4${doneClass}${disabledClass}">
      <div class="step-num">${done ? '✓' : n}</div>
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">${ico}</span>
        <span class="font-display font-bold">${title}</span>
        ${done ? '<span class="pill done">Concluído</span>' : ''}
      </div>
      <div>${body}</div>
    </div>
  `;
}

// src/widgets/toast.js
// Source: RECON.md lines 237-244 — matches original toast() exactly
let _tt = null;

export function toast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.add('hidden'), 3000);
}

// src/widgets/modal.js
// Source: RECON.md lines 246-250 — matches original openModal/closeModal exactly
export function openModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-back').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('modal-back').classList.add('hidden');
}
```

### Pattern 5: CORS Proxy Layer

**What:** A monkey-patch of `window.fetch` that rewrites upstream API URLs to same-origin proxy paths (`/cf-api/` for Cloudflare, `/sms-api/` for SMS24h). Skips when running on `file:` protocol. Matches the original `instalarProxy()` (RECON.md §2.5, lines 2112-2123).

**When to use:** Called once during bootstrap (IIFE pattern). Applies globally to all subsequent fetch calls.

**Example:**
```javascript
// src/proxy/index.js
// Source: RECON.md lines 2112-2123 — matches original instalarProxy() exactly
export function instalarProxy() {
  if (location.protocol === 'file:') return; // local: no proxy needed
  const orig = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string') {
      if (url.startsWith('https://api.cloudflare.com')) {
        url = url.replace('https://api.cloudflare.com', '/cf-api');
      } else if (url.startsWith('https://api.sms24h.org')) {
        url = url.replace('https://api.sms24h.org', '/sms-api');
      } else if (url.startsWith('https://sms24h.org')) {
        url = url.replace('https://sms24h.org', '/sms-api');
      }
    }
    return orig(url, opts);
  };
}
```

### Anti-Patterns to Avoid

- **ES modules with bare `import` from CDN URLs:** `import { something } from 'https://esm.sh/...'` works but requires CORS headers from the CDN. The original uses dynamic `import()` (not static import) for CDN modules — preserve this pattern.
- **Using npm for any dependency:** Locked decision D-02 forbids npm. All libraries must be CDN script tags in `index.html`.
- **Creating a class-based router:** Locked decision D-03 requires factory functions. The original `go()` is a plain function, not a class. Keep it that way.
- **Using `history.pushState` or `popstate`:** The original has zero History API usage. Adding it would change behavior and break backward compatibility.
- **Mixing data and presentation:** The original keeps state access (`getDB()`, `getSettings()`, `etapa1State`) separate from view rendering (`VIEWS[route]()` returns HTML strings with no side effects). Preserve this separation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPA routing | Custom history-based router | `go()` + VIEWS registry pattern (already designed) | The original's pattern is proven (2135 lines in production), simpler than History API, and matches locked decision D-04 |
| State management | Custom observable/store system | Module-level state objects + localStorage accessors (already designed) | The original uses 3 `let` state objects and localStorage. A pub/sub store would be overengineering for ~8 views and 50 data points. |
| JSON parse/validate | Custom schema validator | try/catch + fallback defaults (already designed) | The original's 2-3 line pattern is sufficient. A full JSON schema library (ajv, zod) is 50KB+ and violates D-02's no-npm constraint |
| Module bundling | Webpack, Vite, Rollup | ES modules + `<script type="module">` | Locked decision D-02 forbids bundlers. Native ES modules are supported by all modern browsers and work with CDN deployment |
| CSS preprocessing | Sass, Less, PostCSS | Tailwind CDN v3 + custom CSS with `:root` variables | Locked decision D-02. Tailwind CDN provides utility classes; CSS custom properties provide theming without a build step |
| DOM diffing / VDOM | Custom reconciliation | innerHTML swap (already designed) | The app does full re-renders on navigation (8 routes, infrequent). innerHTML is fast enough for this scale. A VDOM implementation would be 5KB+ of unnecessary complexity. |

**Key insight:** The original 2135-line single-file app works reliably in production. The modularization should preserve the simplicity — don't add architectural complexity (state libraries, router classes, VDOM) that the original doesn't need. The main improvement is code organization (separate files per layer), not new patterns.

## Runtime State Inventory

> Phase 02 is a **greenfield foundation phase**, not a rename/refactor/migration. No existing codebase is being modified — we are building from scratch following RECON.md as the specification. The runtime state inventory is intentionally omitted because there is no existing runtime state to inventory.

## Common Pitfalls

### Pitfall 1: ES Module Global Scope Breakage

**What goes wrong:** Moving functions into ES modules breaks all inline `onclick="go('dashboard')"` handlers because module exports are scoped to the module, not the global `window`.

**Why it happens:** ES modules run in strict mode with their own scope. `go` defined in `router/index.js` is NOT accessible as `window.go` unless explicitly assigned.

**How to avoid:** In `main.js`, after importing all modules, explicitly attach the 8 global-required functions to `window`:
```javascript
window.go = go;
window.toggleSidebar = toggleSidebar;
window.closeModal = closeModal;
window.copyText = copyText;
window.escapeHTML = escapeHTML;
window.onlyDigits = onlyDigits;
window.toast = toast;
window.openModal = openModal;
```

**Warning signs:** Console errors like `Uncaught ReferenceError: go is not defined` when clicking sidebar navigation links. Browser console shows `go` as `undefined` when typed.

### Pitfall 2: ES Modules Require HTTP Server

**What goes wrong:** Opening `index.html` directly from the filesystem (`file://` protocol) causes CORS errors when the browser tries to load ES modules.

**Why it happens:** ES module imports are subject to CORS. `file://` origins cannot load modules via `import` statements. This is a browser security restriction, not a bug.

**How to avoid:** Always serve the project via a local HTTP server during development:
```bash
npx serve . -p 3000
# or
python3 -m http.server 3000
```
The original's `instalarProxy()` already has a `file:` protocol check (RECON.md line 2113) — this must be preserved.

**Warning signs:** Console error: `Access to script at 'file:///...' from origin 'null' has been blocked by CORS policy`.

### Pitfall 3: Tailwind CDN Version Drift

**What goes wrong:** Using `cdn.tailwindcss.com` (unpinned) means the site silently receives Tailwind updates. A future Tailwind release could introduce breaking changes to utility class names or default behavior.

**Why it happens:** The original uses the unpinned CDN URL. The CDN can be updated by Tailwind Labs at any time.

**How to avoid:** Pin to a specific minor version: `https://cdn.tailwindcss.com/3.4.0` [VERIFIED: tailwindcss.com/docs/installation/play-cdn]. This matches the original's Tailwind v3 behavior while preventing surprise updates. The custom config (`tailwind.config = {...}`) works identically with pinned versions.

**Warning signs:** Visual regressions after CDN update; utility classes that no longer compile; different default spacing/color behavior.

### Pitfall 4: localStorage Quota Exceeded

**What goes wrong:** `saveDB()` or `saveSettings()` calls `JSON.stringify()` + `localStorage.setItem()`. If accumulated data (companies, sites, backups) exceeds the 5-10MB localStorage limit, `setItem` throws a `QuotaExceededError`.

**Why it happens:** The original has no error handling for quota exceeded. The data model (companies + sites + settings) is typically well under 1MB, but edge cases exist (many large companies with `raw` BrasilAPI responses, many sites with full `dadosSnapshot` objects).

**How to avoid:** Wrap `saveDB()` and `saveSettings()` in try/catch, show a toast if save fails:
```javascript
export function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    toast('⚠️ Erro ao salvar: armazenamento cheio. Exporte seu backup.', '⚠️');
    console.error('localStorage quota exceeded', e);
  }
}
```

**Warning signs:** Silent data loss (changes not persisted). Check Application → Storage → Local Storage in DevTools.

### Pitfall 5: CSS Hardcoded Values vs Custom Properties

**What goes wrong:** RECON.md §6.1 documents that 9 of the 13 `:root` custom properties are defined but NOT consumed via `var()`. Their hex values are hardcoded directly in CSS rules. If someone changes a custom property value thinking it will propagate, it won't.

**Why it happens:** The original developer defined the properties as a palette reference but used hardcoded values in individual rules. This is inconsistent but must be preserved for visual fidelity in the clone.

**How to avoid:** EXACTLY replicate the CSS from RECON.md §6. Do NOT convert hardcoded hex values to `var()` references — that would change the visual output and break clone fidelity. Document that these properties serve as palette documentation, not active theming variables.

**Warning signs:** Colors don't update when `:root` variables are changed. Grep for `var(--` in the CSS — only `--bg`, `--text`, `--muted`, `--border` are consumed via `var()`.

## Code Examples

### Complete main.js Entry Point

```javascript
// src/main.js
// Boot sequence matches original (RECON.md lines 2089-2132)

// Import all modules
import { go, toggleSidebar, VIEWS } from './router/index.js';
import { toast } from './widgets/toast.js';
import { openModal, closeModal } from './widgets/modal.js';
import { copyText } from './utils/clipboard.js';
import { escapeHTML, onlyDigits } from './utils/string.js';
import { getDB, saveDB, getSettings, saveSettings } from './stores/data.js';
import { refreshHeaderStatus } from './utils/header.js';
import { instalarProxy } from './proxy/index.js';

// Import view stubs (Phase 02: placeholder views only)
import { initDasboard } from './views/dashboard.js';
import { initEtapa1 } from './views/etapa1.js';
import { initEtapa2 } from './views/etapa2.js';
import { initEtapa3 } from './views/etapa3.js';
import { initBanco } from './views/banco.js';
import { initPlanilha } from './views/planilha.js';
import { initConfig } from './views/config.js';
import { initAjuda } from './views/ajuda.js';

// Populate VIEWS registry (matches original progressive assignment)
initDasboard();
initEtapa1();
initEtapa2();
initEtapa3();
initBanco();
initPlanilha();
initConfig();
initAjuda();

// Expose global functions for inline onclick handlers (matches original line 2128)
window.go = go;
window.toggleSidebar = toggleSidebar;
window.closeModal = closeModal;
window.copyText = copyText;
window.escapeHTML = escapeHTML;
window.onlyDigits = onlyDigits;
window.toast = toast;
window.openModal = openModal;

// Bootstrap sequence (matches original lines 2089-2132)
// Note: autoConectarTokens is intentionally OMITTED — the original hardcodes credentials.
// The clone uses empty defaults (getSettings() returns {} when key is missing).
instalarProxy();           // Step 1: Monkey-patch fetch for CORS proxy
refreshHeaderStatus();     // Step 2: Update API status pills
go('dashboard');           // Step 3: Initial route render
```

### View Stub Pattern (Phase 02)

```javascript
// src/views/dashboard.js
// Source: Phase 02 placeholder — full implementation in Phase 03
import { VIEWS } from '../router/index.js';

export function initDasboard() {
  VIEWS.dashboard = () => {
    const { statCard } = requireActualOrStub();
    return `
      <div class="space-y-6">
        <div class="grad-card rounded-3xl p-6 sm:p-8 flex flex-wrap items-center gap-6">
          <div class="icon-cube purple floaty" style="width:180px;height:180px;font-size:90px;border-radius:40px">🧪</div>
          <div class="flex-1 min-w-[200px]">
            <span class="pill doing">BEM-VINDO</span>
            <h1 class="font-display text-3xl mt-2">Laboratório <span class="grad-text">de BMS 🎈</span></h1>
            <p class="text-slate-300 mt-2">Ferramenta completa para criação e gestão de sites</p>
            <div class="flex flex-wrap gap-3 mt-4">
              <button class="btn-3d" onclick="go('etapa1')">🧬 Criar Site</button>
              <button class="btn-3d cyan" onclick="go('etapa2')">📱 Comprar Número</button>
              <button class="btn-3d purple" onclick="go('etapa3')">📄 Editor PDF</button>
            </div>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('🏢', 'Empresas', 0, 'brand')}
          ${statCard('🌐', 'Sites Criados', 0, 'cyan')}
          ${statCard('🚀', 'No Ar', 0, 'green')}
          ${statCard('✅', 'Finalizados', 0, 'amber')}
        </div>
      </div>
    `;
  };
}

// Helper: use real widgets if loaded, fallback inline
function requireActualOrStub() {
  try {
    return { statCard: window._statCard || ((ico, lbl, val, clr) => `<div class="glass rounded-2xl p-4"><div class="icon-cube ${clr}">${ico}</div><div class="text-3xl font-extrabold mt-3">${val}</div><div class="text-slate-400 text-sm">${lbl}</div></div>`) };
  } catch { return { statCard: () => '' }; }
}
```

### CSS Custom Properties (from RECON.md §6.1)

```css
/* src/styles/theme.css */
/* Source: RECON.md lines 17-22 — exact replica of original :root */
:root {
  --bg: #0b1020;
  --bg2: #0f172a;
  --card: #111a36;
  --soft: #1a2348;
  --border: rgba(255,255,255,0.08);
  --text: #e6e9f5;
  --muted: #9aa3c7;
  --accent: #6366f1;
  --accent2: #22d3ee;
  --accent3: #a855f7;
  --ok: #22c55e;
  --warn: #f59e0b;
  --bad: #ef4444;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: Inter, sans-serif;
}

.font-display { font-family: Sora, sans-serif; }
```

### Tailwind CDN Config

```html
<!-- In index.html <head>, BEFORE the Tailwind CDN <script> tag -->
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['Sora', 'sans-serif'],
          sans: ['Inter', 'sans-serif']
        }
      }
    }
  }
</script>
<script src="https://cdn.tailwindcss.com/3.4.0"></script>
```

### Formatting Utilities (from RECON.md §5.9)

```javascript
// src/utils/format.js
// Source: RECON.md lines 257-274 — exact replicas

export function fmtCNPJ(c) {
  const d = (c || '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function fmtMoney(v) {
  if (v === null || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('pt-BR');
}

export function formatBRPhone(num) {
  const s = String(num).replace(/\D/g, '');
  if (s.length === 13 && s.startsWith('55')) return formatBRPhone(s.slice(2));
  if (s.length === 11) return s.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (s.length === 10) return s.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return s;
}
```

```javascript
// src/utils/string.js
// Source: RECON.md lines 261-279 — exact replicas

export function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

export function slugify(s) {
  if (!s) return 'empresa';
  let r = s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 28);
  return r || 'empresa';
}

export function escapeHTML(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-file ~2135 lines inline `<script>` | Multi-file ES modules with explicit `window` exposure | Phase 02 (June 2026) | Better code organization without behavior change |
| Tailwind v3 CDN (unpinned) | Tailwind v3 CDN 3.4.0 (pinned) | Phase 02 (June 2026) | Prevents silent breaking changes from CDN updates |
| Tailwind v4 `@tailwindcss/browser@4` CDN | NOT adopted — v3 CDN (matches original) | Phase 02 (June 2026) | v4 CSS-first `@theme` config would require rewriting CSS from RECON.md |
| Inline `<style>` block | Separate CSS files: `src/styles/*.css` loaded via `<link>` | Phase 02 (June 2026) | Better organization, same CSS content; no build step |
| Hardcoded API credentials in `autoConectarTokens()` | Omitting `autoConectarTokens` entirely | Phase 02 (June 2026) | Security improvement; empty defaults from `getSettings() → {}` |

**Deprecated/outdated:**
- `autoConectarTokens()` (RECON.md lines 2089-2108): Contains hardcoded Cloudflare and SMS24h API credentials belonging to the original author. The clone uses empty settings defaults (`getSettings()` returns `{}` when key is missing). Users configure their own tokens via the Config view. This is a deliberate deviation from the original for security reasons.
- Tailwind v4 CDN (`@tailwindcss/browser@4`): Uses CSS-first `@theme` blocks instead of JS `tailwind.config = {...}`. Not adopted because the original uses v3 JS config pattern and we preserve visual fidelity.
- `file:` protocol development: ES modules cannot load from `file://` URLs due to CORS. Use a local HTTP server (`npx serve .` or `python3 -m http.server`) for all development.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `cdn.tailwindcss.com/3.4.0` supports the same `tailwind.config = {...}` JS config as the unpinned CDN | Standard Stack | If Tailwind v3 CDN pinned versions don't support custom config, we must use the unpinned URL or switch to self-hosted CSS. Risk: LOW — the Tailwind team maintains backward compatibility for v3 CDN builds. |
| A2 | `npx serve . -p 3000` is available on the development machine | Environment Availability | If `serve` is not globally installed, use `python3 -m http.server 3000` as fallback (confirmed available). Risk: LOW — Python confirmed installed. |
| A3 | Google Fonts CDN (`fonts.googleapis.com`) will continue serving Inter and Sora | Standard Stack | If Google Fonts CDN is blocked or unavailable, fonts will fall back to browser sans-serif. Risk: LOW — CDN has 99.9%+ uptime. |
| A4 | `pdf.js` 3.11.174, `pdf-lib`, and `@noble/hashes` CDN URLs from RECON.md are still valid and accessible | Standard Stack | These are Phase 03 dependencies, not needed for Phase 02. If CDN URLs changed, update them in Phase 03 planning. Risk: LOW for Phase 02. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Tailwind v3 CDN pinned version exact URL format**
   - What we know: Tailwind v3 CDN supports version pinning. The documented URL `https://cdn.tailwindcss.com` serves v3. The official Play CDN page documents v4 only (jsdelivr URL).
   - What's unclear: The exact pinning URL for v3. Historical evidence (Wayback Machine, community posts) suggests `https://cdn.tailwindcss.com/3.4.0` works but this needs to be confirmed with a live test by the planner.
   - Recommendation: Test `https://cdn.tailwindcss.com/3.4.0` during planning. If it doesn't work, use `https://cdn.tailwindcss.com` (unpinned, matches original) and document the version drift risk.

2. **Netlify `_redirects` file format for CORS proxy**
   - What we know: The original uses Netlify's `_redirects` to proxy `/cf-api/*` → Cloudflare API and `/sms-api/*` → SMS24h API (RECON.md §2.5). The proxy monkey-patches fetch to rewrite URLs.
   - What's unclear: Whether the Phase 02 Foundation should include the `_redirects` file in the project root (matching Netlify deployment), or defer this to Phase 03 when API integration is built. For local development, `instalarProxy()` skips on `file:` protocol and would need a dev server with proxy config.
   - Recommendation: Include the `_redirects` file in the project root during Phase 02 as part of CORE-09 (CORS Proxy). For local dev without Netlify, the `file:` protocol check in `instalarProxy()` will skip proxying (API calls will hit CORS errors — acceptable during foundation phase).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npx serve` (local dev server) | ✓ | v20.20.2 | — |
| npm | `npx serve` | ✓ | 10.8.2 | — |
| Python 3 | `python3 -m http.server` (fallback dev server) | ✓ | 3.11.2 | — |
| npx | `npx serve` | ✓ | available | — |
| Modern browser (ES modules) | Runtime | ✓ | Any modern (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+) | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

> Workflow `nyquist_validation` is not explicitly set to `false` in `.planning/config.json` (file absent — defaults to enabled). Treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — Wave 0 gap |
| Config file | None detected — Wave 0 gap |
| Quick run command | `echo "No tests configured"` — Wave 0 gap |
| Full suite command | `echo "No tests configured"` — Wave 0 gap |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | go() navigates between 8 routes, updates title, toggles nav-link.active | integration | `node -e "..."` — requires DOM | ❌ Wave 0 |
| CORE-02 | Sidebar has 8 nav-links, 3 category headers, collapses at ≤1024px | visual/manual | Manual browser test | ❌ Wave 0 |
| CORE-03 | getDB returns defaults when localStorage empty; saveDB+getDB roundtrip | unit | `node --input-type=module -e "import {getDB,saveDB} from './src/stores/data.js'; ..."` | ❌ Wave 0 |
| CORE-04 | Header displays dynamic title via go(); refreshHeaderStatus toggles pills | integration | Requires DOM — browser test | ❌ Wave 0 |
| CORE-05 | toast() shows element, hides after 3s; concurrent toasts replace | integration | Requires DOM — browser test | ❌ Wave 0 |
| CORE-06 | openModal() shows overlay; backdrop click closes; closeModal() hides | integration | Requires DOM — browser test | ❌ Wave 0 |
| CORE-07 | copyText() writes to clipboard, shows toast on success | unit | `node --input-type=module -e "..."` — clipboard mock | ❌ Wave 0 |
| CORE-08 | fmtCNPJ formats 14 digits correctly; fmtMoney handles null; slugify handles accents | unit | `node --input-type=module -e "import {fmtCNPJ} from './src/utils/format.js'; ..."` | ❌ Wave 0 |
| CORE-09 | instalarProxy rewrites Cloudflare/SMS24h URLs; skips on file: protocol | unit | `node --input-type=module -e "..."` — fetch mock | ❌ Wave 0 |
| UI-01 | Sidebar transforms off-screen at ≤1024px; .open slides it in | visual/manual | Manual browser test with responsive resize | ❌ Wave 0 |
| UI-02 | All :root CSS variables render correct colors on dark background | visual/manual | Visual inspection in browser | ❌ Wave 0 |
| UI-03 | .btn-3d renders with 3D shadow; :active moves down 4px | visual/manual | Visual inspection | ❌ Wave 0 |
| UI-04 | .icon-cube renders with gradient + inner highlight shadow | visual/manual | Visual inspection | ❌ Wave 0 |
| UI-05 | statCard/quickCard/stepBox return correct HTML strings with given config | unit | `node --input-type=module -e "..."` — string output assertion | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node --input-type=module -e "import {getDB,saveDB} from './src/stores/data.js'; console.assert(getDB().empresas.length === 0, 'default works')"`
- **Per wave merge:** Manual visual check of all 8 routes in browser
- **Phase gate:** All unit tests pass + manual visual check

### Wave 0 Gaps

- [ ] `tests/test_stores.js` — covers CORE-03 (getDB/saveDB/getSettings/saveSettings)
- [ ] `tests/test_utils.js` — covers CORE-08 (fmtCNPJ, fmtMoney, fmtDate, formatBRPhone, slugify, escapeHTML, onlyDigits)
- [ ] `tests/test_proxy.js` — covers CORE-09 (instalarProxy URL rewriting)
- [ ] `tests/test_widgets.js` — covers UI-05 (statCard, quickCard, stepBox HTML output)
- [ ] Framework install: No test framework detected. Install `node:test` (built-in Node.js 20+) or lightweight test runner.
- [ ] Browser-based test setup: No browser automation tooling detected (Playwright/Cypress). Required for CORE-01, CORE-02, CORE-04, CORE-05, CORE-06, UI-01.

> **Recommendation for Wave 0:** Use Node.js built-in `node:test` runner (`node --test`) for unit-testable modules (stores, utils, proxy, widget factories). Defer browser-based testing (router, sidebar, toast, modal) until Phase 03 when all 8 views are functional and visual verification is more valuable. Add a simple `test_runner.js` script that `node --test tests/` runs.

## Security Domain

> Security enforcement is enabled (absent from config = default enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No authentication — single-user localStorage. Out of scope per PROJECT.md. |
| V3 Session Management | No | No session — stateless SPA. |
| V4 Access Control | No | No access control — single-user app. |
| V5 Input Validation | Yes (Phase 03) | `escapeHTML()` for XSS prevention in rendered HTML. `onlyDigits()` for CNPJ sanitization. CNPJ length validation (14 digits). |
| V6 Cryptography | No | BLAKE3 hash used for Cloudflare Pages asset verification (Phase 03). Not cryptographic in security sense — content-addressing only. |
| V7 Error Handling | Yes | try/catch in getDB/getSettings prevents localStorage corruption from crashing app. toast() shows user-friendly messages. |
| V8 Data Protection | Yes | localStorage stores all data client-side. No data transmitted to servers except via API calls (Phase 03). Export/import backup as JSON. |
| V9 Communications | Yes (Phase 03) | All API calls use HTTPS. `instalarProxy()` rewrites URLs but does not downgrade security. |
| V10 Malicious Code | Yes | `escapeHTML()` prevents XSS in dynamically rendered content. `innerHTML` assignments only from trusted template strings (not user input). Phase 03 must ensure all user input goes through `escapeHTML()`. |

### Known Threat Patterns for Vanilla JS SPA + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via innerHTML from URL params or user input | Tampering / Information Disclosure | `escapeHTML()` on all user-provided strings before rendering. Never directly inject user input into innerHTML. |
| localStorage data tampering (user modifies JSON manually) | Tampering | Defensive reads: try/catch on JSON.parse, fallback defaults, null-checks on all fields. No assumption that stored data is valid. |
| Clipboard abuse (malicious site overwrites clipboard) | Spoofing | `navigator.clipboard.writeText` only runs on user gesture (click). No background clipboard writes. |
| CORS proxy abuse (fetch monkey-patch intercepts all requests) | Information Disclosure / Elevation of Privilege | `instalarProxy()` only rewrites Cloudflare and SMS24h URLs. Does NOT intercept other domains. URL rewriting is string-prefix only — no regex injection risk. |
| QuotaExceededError crashes app | Denial of Service | try/catch in saveDB/saveSettings with user-visible toast fallback. |

## Sources

### Primary (HIGH confidence)
- RECON.md §3 (localStorage & State Schema) — complete field-level schema with conditional branches, source line references for all 4 accessor functions
- RECON.md §4 (Rotas & Navegação) — full go() implementation trace (9 steps), ROUTES array, titles object, VIEWS registry, 35+ call sites
- RECON.md §5 (Funções de Lógica de Negócio) — ~60 functions with signatures, side effects, call graph, edge cases
- RECON.md §6 (CSS / Design System) — 13 custom properties, 23 component classes, 19 color variants, 4 keyframes, 2 breakpoints

### Secondary (MEDIUM confidence)
- [tailwindcss.com/docs/installation/play-cdn] — official v4 CDN docs; v3 CDN behavior inferred from community knowledge and Wayback Machine
- [tailwindcss.com/docs/theme] — official Tailwind theme variable documentation; confirms `@theme` vs `:root` distinction for v4
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) — official ES module documentation; confirms `<script type="module">`, import/export, module scoping, CORS restrictions
- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — official Web Storage API documentation; confirms API surface and `file:` protocol undefined behavior

### Tertiary (LOW confidence)
- [ASSUMED] `cdn.tailwindcss.com/3.4.0` pinning URL format — not confirmed via live test; planner must verify
- [ASSUMED] `google-fonts` CDN availability — assumed stable based on 10-year track record
- [ASSUMED] `npx serve` availability for local dev — confirmed via `npx --version`; `serve` package assumed installable
- [ASSUMED] Vanilla JS SPA router best practices — synthesized from general web development knowledge; original's pattern is the authoritative reference

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — Tailwind CDN confirmed via official docs; ES modules confirmed via MDN; font CDNs assumed stable
- Architecture: HIGH — Router, DataStore, widget patterns all extracted from RECON.md authoritative source (~4400 lines)
- Pitfalls: MEDIUM — ES module scope issues well-documented; Tailwind version drift is a known risk; localStorage quota is an edge case
- Security: MEDIUM — XSS surface mapped from RECON.md patterns; ASVS categories assigned

**Research date:** 2026-06-27
**Valid until:** 2026-08-27 (60 days — stable domain, no fast-moving dependencies)
