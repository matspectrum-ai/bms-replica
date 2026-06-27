# Phase 01: Reconnaissance & Extraction - Research

**Researched:** 2026-06-27
**Domain:** Front-end reverse engineering — manual DevTools extraction of a vanilla JS SPA
**Confidence:** MEDIUM (Chrome DevTools features verified via official docs; methodology based on training knowledge)

## Summary

Phase 01 is a pure documentation phase — zero code is written. The deliverable is a **RECON.md** (~1000+ lines) that serves as the authoritative specification for all downstream clone phases. This research catalogs the systematic workflow, tooling, documentation formats, and common pitfalls specific to black-box reverse engineering of a vanilla JavaScript single-page application using only browser DevTools.

The target system at `laboratoriodebms.netlify.app` has already been partially analyzed (FEATURES.md catalogs ~60 functions, 8 routes, 3 state objects, 4 external APIs). The RECON phase must formalize these findings into a structured specification with pixel-perfect CSS, complete API contracts (success + error branches), full localStorage schemas including conditionally-created keys, and exhaustive function signatures with parameter lists and side effects.

**Primary recommendation:** Extract bottom-up by dependency (localStorage → DOM → Routes → APIs → Functions → CSS), document each layer in RECON.md as you go, and validate completeness against the FEATURES.md inventory before declaring the phase done.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** RECON.md organized by technical layer (not by view): DOM → APIs → State → Routes → Business Logic → CSS/Theme. Each layer covers the entire system from that perspective. Appendix with cross-references by view.
- **D-02:** Complete depth extraction (maximum detail level). Every function documented with signature, parameters, return value, and side effects. CSS documented pixel-perfect (Tailwind utility classes + custom properties). All API response branches (success + error) for BrasilAPI, Cloudflare Pages, and SMS24h.
- **D-03:** 100% manual extraction via browser DevTools: Elements (DOM tree, data-attributes, classes), Console (window inspection, __INITIAL_STATE__, store), Sources (Pretty Print JS bundles, function identification), Network (XHR/Fetch capture, request/response schemas), Application (localStorage, sessionStorage). Auxiliary tools: Wappalyzer (stack detection), Lighthouse (performance baseline).

### the agent's Discretion
- Exact order of sections within each layer in RECON.md
- Specific formatting of JSON schemas and API tables
- Use of screenshots or ASCII diagrams for DOM tree
- Level of commentary/annotation in extracted code

### Deferred Ideas (OUT OF SCOPE)
- Automation of extraction with Puppeteer/Playwright — could accelerate future phases if re-extraction needed after original updates
- Automated diff script between clone and original for continuous validation — relevant for Phase 4 (Validation)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECON-01 | Extrair árvore DOM completa e confirmar arquitetura vanilla JS | § Architecture Patterns (Pattern 1), § Common Pitfalls (Pitfall 1) |
| RECON-02 | Capturar todos os endpoints de API (BrasilAPI, Cloudflare Pages, SMS24h) com esquemas de request/response (sucesso + erro) | § Architecture Patterns (Pattern 3), § Code Examples (API Contract Extraction) |
| RECON-03 | Extrair esquema completo do localStorage (`lab_bms_db_v1`, `lab_bms_settings_v1`) com todos os objetos e sub-objetos condicionais | § Architecture Patterns (Pattern 2), § Common Pitfalls (Pitfall 2) |
| RECON-04 | Mapear todas as 8 rotas e sistema de navegação (VIEWS registry, go() function) | § Architecture Patterns (Pattern 4), § Code Examples (Route Extraction) |
| RECON-05 | Fazer engenharia reversa de todas as funções de negócio (~60 funções, 3 objetos de estado, utilitários) | § Architecture Patterns (Pattern 5), § Don't Hand-Roll |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DOM tree extraction | Browser / Client | — | Elements panel captures client-rendered HTML; all DOM is client-side in an SPA |
| API contract capture | Browser / Client (Network tab) | API / Backend (external services) | Request/response observed at browser boundary; actual API logic is external |
| localStorage schema extraction | Browser / Client (Application tab) | — | All state is client-side localStorage; no server-side persistence |
| Route/navigation mapping | Browser / Client | — | SPA routing is entirely client-side (go() function, VIEWS registry) |
| Business logic function extraction | Browser / Client (Sources panel) | — | All JS runs in browser; Pretty Print exposes source |
| CSS/theme extraction | Browser / Client (Elements → Computed) | — | All styling is client-rendered; Tailwind CDN + inline styles |

## Standard Stack

**No packages are installed in this phase.** This is a pure documentation/extraction phase using browser-native tooling.

### Core Tools (Browser-Native)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Chrome DevTools | 149.x | All extraction: Elements, Console, Sources, Network, Application, Lighthouse | The only tool capable of black-box SPA inspection; built into every Chrome installation [VERIFIED: developer.chrome.com/docs/devtools] |
| Chrome DevTools Console Utilities API | Built-in | $0-$4, $(selector), $$(selector), copy(), getEventListeners(), monitor(), monitorEvents(), keys(), values(), table(), debug() | Official Chrome API for DOM inspection and debugging; documented at developer.chrome.com/docs/devtools/console/utilities [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| Chrome DevTools Network Panel | Built-in | XHR/Fetch capture, header inspection, payload viewing, preserve log, replay XHR, filter by type, export HAR | Standard for API traffic analysis; documented at developer.chrome.com/docs/devtools/network/reference [VERIFIED: developer.chrome.com/docs/devtools/network/reference] |
| Chrome DevTools Sources Panel | Built-in | Pretty Print minified JS, breakpoints, watch expressions, snippets, scope inspection, call stack | Standard for JS reverse engineering; supports stepping through comma-separated expressions in minified code since Chrome 108 [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference] |
| Lighthouse | Built-in (DevTools panel) | Performance, Accessibility, Best Practices, SEO baseline | Capture baseline metrics for VAL-04 bundle size comparison; Navigation/Timespan/Snapshot modes [VERIFIED: developer.chrome.com/docs/devtools/lighthouse] |

### Auxiliary Tools

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Wappalyzer | Browser extension | Stack detection (framework, CDN, analytics) | Verify vanilla JS, detect Tailwind CDN version, confirm no hidden frameworks [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual DevTools extraction | Puppeteer/Playwright automation | Automation deferred per D-03; manual extraction provides deeper understanding but slower |
| Console.log-based inspection | Debugger breakpoints + watch expressions | Breakpoints enable pause-and-inspect of runtime state; more precise than log-based debugging [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference] |

**Installation:** No packages to install. Chrome DevTools is available at `/usr/bin/google-chrome` (version 149.0.7827.114).

## Package Legitimacy Audit

> **N/A** — Phase 01 installs zero external packages. All tooling is browser-native or already present on the system. No npm/pip/cargo packages are introduced.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 01: RECON WORKFLOW                      │
│                                                                  │
│  INPUT: https://laboratoriodebms.netlify.app/                    │
│                                                                  │
│  STEP 0 — ENVIRONMENT PREP                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Open Chrome DevTools (F12)                                │   │
│  │ Network tab → ☑ Preserve log, ☐ Disable cache             │   │
│  │ Application tab → Local Storage → note existing keys      │   │
│  │ Sources tab → locate JS bundles                           │   │
│  │ Wappalyzer → confirm stack                                │   │
│  │ Lighthouse → run Navigation audit → save baseline         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 1 — LOCALSTORAGE FIRST (foundation layer)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Application tab → Local Storage → Copy all key-value      │   │
│  │ Console: Object.keys(localStorage) → discover ALL keys    │   │
│  │ Console: JSON.parse(localStorage.getItem(key)) → schema   │   │
│  │ Exercise app through all 8 routes → re-check for new keys │   │
│  │ Document: key names, JSON schemas, default values,        │   │
│  │   when each key is created/updated, conditional branches  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 2 — DOM TREE (structure layer)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Elements tab → Inspect each of 8 views                    │   │
│  │ Copy outerHTML for key containers                         │   │
│  │ Document: element hierarchy, data-attributes, classes,    │   │
│  │   IDs, aria attributes, conditional elements              │   │
│  │ Screenshot each view for A/B testing baseline             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 3 — ROUTES & NAVIGATION (orchestration layer)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Sources → Pretty Print JS → find ROUTES array, VIEWS obj  │   │
│  │ Console: ROUTES → array of route definitions              │   │
│  │ Console: Object.keys(VIEWS) → all view function names     │   │
│  │ Exercise go('route') for each route → observe title,      │   │
│  │   nav-link.active, content area swap, history behavior    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 4 — API CONTRACTS (integration layer)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Network tab → ☑ Preserve log, filter: Fetch/XHR           │   │
│  │ Exercise all API-triggering flows (CNPJ lookup, deploy,   │   │
│  │   SMS purchase, Cloudflare account detection)             │   │
│  │ For each endpoint: copy request headers, payload,         │   │
│  │   response headers, response body (success + error)       │   │
│  │ Force errors: invalid CNPJ, bad API token, network off   │   │
│  │ Export HAR for archival                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 5 — BUSINESS LOGIC FUNCTIONS (behavior layer)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Sources → Pretty Print JS → systematically extract:       │   │
│  │   - All function names (search /^function\s+\w+/ in JS)   │   │
│  │   - Function signatures (params from source)              │   │
│  │   - Return values (trace return statements)               │   │
│  │   - Side effects (DOM writes, localStorage, fetch,        │   │
│  │     setInterval, event listeners)                         │   │
│  │   - Call graph (which functions call which)               │   │
│  │ Console: debug(fn) → exercise → trace call stack          │   │
│  │ Console: monitor(fn) → observe all invocations            │   │
│  │ Cross-reference against FEATURES.md inventory             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 6 — CSS / THEME (visual layer)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Elements → Computed tab → document all custom properties  │   │
│  │ Elements → Styles → extract all component classes:        │   │
│  │   .glass, .grad-card, .btn-3d (8 variants), .icon-cube   │   │
│  │   (5 variants), .pill (5 variants), .nav-link, .step-card │   │
│  │ Document: exact pixel values, gradients, shadows,         │   │
│  │   transitions, animations, media queries (1024px)         │   │
│  │ CSS Overview panel → capture design token inventory       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STEP 7 — CROSS-REFERENCES & VALIDATION                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Cross-reference appendix: view → {DOM, APIs, state,       │   │
│  │   functions, CSS}                                         │   │
│  │ Validate completeness: every FEATURES.md function has     │   │
│  │   a RECON.md entry; every localStorage branch documented  │   │
│  │ Validate sufficiency: could a developer who never saw     │   │
│  │   the original rebuild it from RECON.md alone?            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OUTPUT: .planning/phases/01-reconnaissance-extraction/RECON.md   │
│          (~1000+ lines, 7 layers, cross-reference appendix)      │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended RECON.md Structure

Per D-01, organized by technical layer. The planner determines exact section ordering (agent discretion), but the following is the recommended structure based on dependency order (each layer depends on the one before it for context):

```
# RECON.md: Laboratório de BMs — Especificação de Engenharia Reversa

## 1. localStorage & State Schema          [Layer: State — Foundation]
### 1.1 Chave: lab_bms_db_v1
### 1.2 Chave: lab_bms_settings_v1
### 1.3 Estado em Memória (etapa1State, etapa2State, pdfState)

## 2. DOM Tree & Component Hierarchy        [Layer: DOM — Structure]
### 2.1 Shell Estático (sidebar, header, content, modals, toast)
### 2.2 Dashboard View
### 2.3 Etapa 1 View (5-step wizard)
### 2.4 Etapa 2 View
### 2.5 Etapa 3 View (PDF editor)
### 2.6 Banco de Empresas View
### 2.7 Planilha View
### 2.8 Configurações View
### 2.9 Ajuda View

## 3. Rotas & Sistema de Navegação          [Layer: Routes]
### 3.1 Tabela de Rotas (ROUTES array)
### 3.2 VIEWS Registry
### 3.3 go(route) Function
### 3.4 Comportamento de Navegação (title, nav-link.active, history)

## 4. Contratos de API                      [Layer: APIs]
### 4.1 BrasilAPI — CNPJ Lookup
### 4.2 Cloudflare Pages API — Deploy Pipeline (5 passos)
### 4.3 Cloudflare API — Account Detection
### 4.4 SMS24h API — Number Purchase & Polling
### 4.5 CORS Proxy Layer (Netlify _redirects)

## 5. Funções de Lógica de Negócio          [Layer: Logic]
### 5.1 Core/Infra (go, getDB, saveDB, toast, modal, etc.)
### 5.2 Dashboard (VIEWS.dashboard, statCard, quickCard)
### 5.3 Etapa 1 (e1Buscar, e1Gerar, e1Publicar, buildSiteHTML, etc.)
### 5.4 Etapa 2 (smsAPI, smsPolling, etc.)
### 5.5 Etapa 3 (carregarPDF, rerenderOverlays, baixarPDF, etc.)
### 5.6 Banco (renderBanco, usarEmpresaNaEtapa1, etc.)
### 5.7 Planilha (renderPlanilha, mudarStatus, exportCSV, etc.)
### 5.8 Config (salvarConfig, salvarTokenCF, exportBackup, etc.)
### 5.9 Utilitários (fmtCNPJ, fmtMoney, fmtDate, slugify, copyText, etc.)
### 5.10 Boot/Proxy (autoConectarTokens, instalarProxy)

## 6. CSS / Design System                    [Layer: CSS]
### 6.1 CSS Custom Properties (:root)
### 6.2 Component Classes (.glass, .grad-card, .btn-3d, .icon-cube, etc.)
### 6.3 Utility Variants (8 btn-3d colors, 5 icon-cube colors, 5 pill variants)
### 6.4 Animations & Keyframes
### 6.5 Responsive Breakpoints (1024px)
### 6.6 Tailwind CDN Version & Configuration

## 7. Apêndice: Referências Cruzadas por View
### 7.1 Dashboard → {DOM:§2.2, APIs:—, State:§1.1, Routes:§3, CSS:§6.2}
### 7.2 Etapa 1 → {DOM:§2.3, APIs:§4.1-4.2, State:§1.1-1.3, CSS:§6}
### ... (all 8 views)
```

### Pattern 1: DOM Tree Extraction Workflow
**What:** Systematic extraction of the complete DOM structure for all 8 views, including static shell elements (sidebar, header, modals, toast container) that persist across routes.
**When to use:** RECON-01 — must be done after localStorage extraction (step 1) and before route mapping (step 3), since DOM structure reveals navigation elements.
**Technique:**
1. **Static shell first:** Inspect Elements panel on page load (dashboard view). Copy the `<body>` structure: `<aside id="sidebar">`, `<header>`, `<main id="content">`, modal containers, toast container.
2. **Per-view extraction:** For each route, call `go('routeName')` from Console, then inspect the `#content` innerHTML. Document element hierarchy, `data-*` attributes, CSS classes, and conditional elements.
3. **Conditional elements:** Exercise each view through ALL states (loading, empty, error, populated) to capture conditional DOM branches. Example: Etapa 1 has 5 step states; each step shows/hides different elements.
4. **Console shortcuts:**
   - `$0` — currently selected element in Elements panel [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]
   - `copy($0.outerHTML)` — copy element HTML to clipboard
   - `$$('selector')` — returns array of all matching elements
   - `getEventListeners($0)` — reveals attached event handlers [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]

**Documentation format for each element:**
```markdown
### Element: `<nav class="nav-link" data-route="etapa1">`
- **Parent:** `<aside id="sidebar">` > `<nav class="nav-links">`
- **Children:** `<span class="icon">🧪</span>` + `<span class="label">Etapa 1</span>`
- **States:** `.active` class when current route matches `data-route`
- **Event:** `click` → `go('etapa1')` (via `getEventListeners($0)`)
- **CSS:** `.nav-link { display: flex; padding: 12px 16px; border-radius: 12px; }`
```

### Pattern 2: localStorage Schema Extraction
**What:** Discover ALL localStorage keys and their complete JSON schemas, including conditionally-created sub-objects that only appear after specific user actions.
**When to use:** RECON-03 — MUST be done FIRST (step 1 in the workflow), because all other layers depend on understanding the data model.
**Technique:**
1. **Initial snapshot:** Open Application → Storage → Local Storage → copy all key-value pairs [VERIFIED: developer.chrome.com/docs/devtools/storage/localstorage]
2. **Discover hidden keys:** In Console, run `Object.keys(localStorage)` to see ALL keys (some may be hidden by domain filtering) [ASSUMED]
3. **Schema extraction:** For each key, `JSON.parse(localStorage.getItem('key'))` and document the full JSON tree, noting data types, default values, and nullable fields.
4. **Exercise for conditional branches:** The critical risk is missing conditionally-created sub-objects. Example from FEATURES.md:
   - `empresas[].raw` — only present when CNPJ lookup succeeds
   - `sites[].deploymentId` — only present after Cloudflare deploy completes
   - `sites[].phoneNumber` — only present after Etapa 2 SMS purchase
5. **Mutation tracking:** Use `monitorEvents(window, 'storage')` [ASSUMED] or wrap `localStorage.setItem` to log all writes during app exercise.
6. **Console commands:**
   ```javascript
   // Capture current state as formatted JSON
   copy(JSON.stringify(JSON.parse(localStorage.getItem('lab_bms_db_v1')), null, 2))
   
   // Monitor all localStorage writes
   const origSet = Storage.prototype.setItem;
   Storage.prototype.setItem = function(key, value) {
     console.log('localStorage.setItem:', key, value);
     return origSet.apply(this, arguments);
   };
   ``` [ASSUMED]

**Documentation format:**
```json
// lab_bms_db_v1 — Schema
{
  "empresas": [                         // Array of company objects
    {
      "cnpj": "string (##.###.###/####-##)",
      "razao_social": "string",
      "nome_fantasia": "string",
      "porte": "string (ME/EPP/DEMAIS)",
      "capital_social": "number (BRL)",
      "raw": {                          // CONDITIONAL — only after successful CNPJ lookup
        "cnae_fiscal_descricao": "string",
        "municipio": "string",
        "uf": "string (2-letter)"
      }
    }
  ],
  "sites": [                            // Array of site objects
    {
      "id": "string (uuid)",
      "empresaCnpj": "string",
      "domain": "string",
      "status": "string (criado|no_ar|finalizado)",
      "deploymentId": "string|null",   // CONDITIONAL — only after Cloudflare deploy
      "phoneNumber": "string|null",    // CONDITIONAL — only after Etapa 2
      "createdAt": "ISO8601 string",
      "updatedAt": "ISO8601 string"
    }
  ]
}
```

### Pattern 3: API Contract Extraction from Network Tab
**What:** Capture complete API contracts — not just successful response shapes, but error responses, request headers (including auth tokens), response headers (rate limit info), and query parameters.
**When to use:** RECON-02 — after routes are mapped (step 3) since you need to know which views trigger which API calls.
**Technique:**
1. **Setup:** Network tab → ☑ Preserve log (keeps requests across page navigations), filter by **Fetch/XHR** to exclude static assets [VERIFIED: developer.chrome.com/docs/devtools/network/reference]
2. **Capture success flows:** Exercise each API-triggering action and for each request:
   - **Headers tab:** Copy Request Headers (Authorization, Content-Type, custom headers), Response Headers (rate-limit-*, content-type)
   - **Payload tab:** Copy request body/query parameters [VERIFIED: developer.chrome.com/docs/devtools/network/reference]
   - **Response tab:** Copy full response body
   - **Timing tab:** Note request duration (for mock simulation later)
3. **Force error states:** Deliberately trigger errors to document error response shapes:
   - BrasilAPI: Use invalid CNPJ (e.g., `00000000000000`) → capture 404/400 response
   - Cloudflare API: Use invalid/expired token → capture 401/403 response
   - SMS24h API: Use invalid API key → capture error response
   - Network offline: Toggle Offline in Network throttling → capture fetch failure behavior
4. **Replay XHR:** Right-click request → **Replay XHR** (or press R) to re-send without re-navigating [VERIFIED: developer.chrome.com/docs/devtools/network/reference]
5. **Export for archival:** Right-click → **Save all as HAR with content** to preserve complete request/response pairs for offline reference
6. **Console shortcuts:** `copy()` copies the last Console result to clipboard [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]

**Documentation format for each endpoint:**
```markdown
### Endpoint: GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
**Trigger:** `e1Buscar()` in Etapa 1, Step 1
**Method:** GET
**Headers:**
  - (none — public API, no auth)

**Success Response (200):**
```json
{
  "cnpj": "string (##.###.###/####-##)",
  "razao_social": "string",
  "nome_fantasia": "string",
  "cnae_fiscal_descricao": "string",
  ...
}
```

**Error Response (404 — CNPJ not found):**
```json
{
  "message": "CNPJ 00.000.000/0000-00 não encontrado.",
  "type": "not_found"
}
```

**Rate Limiting:** No rate limit headers observed. [ASSUMED — may exist but wasn't triggered during testing]
**Network Timing:** ~200-800ms (varies by load)
**CORS Proxy:** Request goes through Netlify `_redirects` proxy layer → URL rewritten by `instalarProxy()` [ASSUMED — verify during extraction]
```

### Pattern 4: Route & Navigation System Extraction
**What:** Map the complete SPA routing system — the ROUTES array, VIEWS registry object, go() function implementation, and navigation behavior (title updates, active nav-link CSS, history API usage).
**When to use:** RECON-04 — after DOM extraction (step 2) since the DOM reveals navigation elements, before API extraction (step 4) since different routes trigger different APIs.
**Technique:**
1. **Find ROUTES in Sources:** Pretty Print JS → search for `ROUTES` or array of route objects. Document each route's `path`, `title`, `subtitle`, and `view` name.
2. **Find VIEWS registry:** Search for `VIEWS` or `VIEWS = {` to find the view function registry. `Object.keys(VIEWS)` in Console confirms all 8 views.
3. **Trace go() function:** Set a breakpoint on `go()` in Sources, then navigate to observe:
   - How title/subtitle are updated (`document.title`, header DOM manipulation)
   - How `.active` class is toggled on nav-links
   - How content area is updated (innerHTML replacement)
   - Whether history.pushState/replaceState is used (hash-free routing)
4. **Console exercise:** Call `go('etapa1')`, `go('config')`, etc. from Console to verify all routes render correctly.

**Documentation format:**
```markdown
### ROUTES Array
```js
const ROUTES = [
  { path: 'dashboard',  title: 'Dashboard',    subtitle: 'Visão geral',       view: 'dashboard' },
  { path: 'etapa1',     title: 'Etapa 1',      subtitle: 'Criar site',        view: 'etapa1' },
  { path: 'etapa2',     title: 'Etapa 2',      subtitle: 'Comprar número',    view: 'etapa2' },
  { path: 'etapa3',     title: 'Etapa 3',      subtitle: 'Editar PDF',        view: 'etapa3' },
  { path: 'banco',      title: 'Banco',        subtitle: 'Empresas',          view: 'banco' },
  { path: 'planilha',   title: 'Planilha',     subtitle: 'Sites',             view: 'planilha' },
  { path: 'config',     title: 'Configurações', subtitle: 'Tokens e backup',  view: 'config' },
  { path: 'ajuda',      title: 'Ajuda',        subtitle: 'Guias',             view: 'ajuda' },
];
```

### go(route) Function
**Signature:** `go(routeName: string): void`
**Side effects:**
1. Updates `#header-title` and `#header-subtitle`
2. Toggles `.active` class on `[data-route]` nav-links
3. Calls `VIEWS[route]()` to get HTML string
4. Sets `#content.innerHTML` to view output
5. Updates `document.title`
6. Calls `refreshHeaderStatus()` (API status pills)
```

### Pattern 5: Business Logic Function Extraction from Minified/Obfuscated JS
**What:** Systematically extract all ~60+ function signatures, parameter lists, return values, side effects, and call relationships from the Pretty Printed JavaScript source in the Sources panel.
**When to use:** RECON-05 — after API contracts (step 4) since API client functions are a subset of business logic functions.
**Technique:**
1. **Pretty Print:** Sources panel auto-pretty-prints minified files by default. Verify by checking the `{}` icon at the bottom — if it shows `{}`, Pretty Print is active [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference]
2. **Find all functions:** In the Pretty Printed source, search for function patterns:
   - `function name(` — named function declarations
   - `const name = function(` or `const name = (` — function expressions
   - `const name = async (` — async functions
   - `name: function(` or `name(` — object method shorthand
3. **Trace data flow through obfuscated variables:** Use the **Scope** pane while paused at breakpoints to reveal actual variable values. Obfuscated names like `a`, `b`, `t` resolve to their runtime values in Scope [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference]
4. **Identify side effects:** For each function, scan for:
   - DOM writes: `innerHTML =`, `appendChild`, `createElement`, `setAttribute`
   - localStorage writes: `localStorage.setItem`, `saveDB()`, `saveSettings()`
   - Network: `fetch(`, `smsAPI(`
   - Timers: `setInterval`, `setTimeout`
   - Event listeners: `addEventListener`, `onclick =`
5. **Trace call graph:** Use `debug(fn)` to break when a function is called, then inspect the Call Stack to see which caller invoked it [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]
6. **Monitor invocations:** `monitor(fn)` logs every call with arguments. `monitorEvents($0, 'click')` logs DOM events [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]
7. **Use Snippets:** Create reusable Console snippets (Sources → Snippets) for common extraction tasks:
   ```javascript
   // Snippet: listAllFunctions
   // Lists all function names in global scope
   Object.keys(window).filter(k => typeof window[k] === 'function').sort()
   ``` [ASSUMED]
8. **Step through comma-separated expressions:** Minified code often uses `a(),b(),c()` patterns. Chrome 108+ debugger steps through these individually [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference]

**Documentation format for each function:**
```markdown
### fmtCNPJ(cnpj)
**Source:** Utilitários (line ~1850 in pretty-printed source)
**Signature:** `fmtCNPJ(cnpj: string): string`
**Parameters:**
  - `cnpj` (string): Raw 14-digit CNPJ string (only digits)
**Return:** Formatted CNPJ string (##.###.###/####-##) or empty string if invalid
**Side Effects:** None (pure function)
**Called By:** e1Buscar(), renderBanco(), renderPlanilha()
**Algorithm:** Inserts punctuation at positions 2, 5, 8, 12, 15 using substring slicing
**Edge Cases:** Returns '' if cnpj.length !== 14
```

### Anti-Patterns to Avoid
- **Extracting CSS as "about the same":** "Close enough" produces cumulative 1-4px discrepancies across components. Always extract exact Computed values from Elements → Computed tab [ASSUMED]
- **Documenting only success API responses:** Downstream developers hit errors immediately without error schemas. Force every API call to fail at least once and document the error response shape.
- **Skipping localStorage branches you "didn't see":** The app may only write `sites[].deploymentId` after a successful Cloudflare deploy. Exercise every workflow to completion before declaring the schema complete.
- **Documenting functions in source order rather than dependency order:** Functions that are called by everything (getDB, saveDB, toast, go) should be documented first — they're the foundation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event listener discovery | Grep through source guessing at `addEventListener` calls | `getEventListeners($0)` in Console | Returns ALL listeners registered on any DOM element, including those added by libraries or inline handlers [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| Function invocation tracing | Scatter `console.log` calls throughout source | `debug(fn)` + `monitor(fn)` in Console | `debug` breaks execution at function entry; `monitor` logs every call with arguments; no source modification needed [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| localStorage write tracking | Manual inspection after each action | Monkey-patch `Storage.prototype.setItem` | Captures ALL writes including those from minified code you can't easily instrument [ASSUMED] |
| DOM event monitoring | Click handlers traced by reading source | `monitorEvents($0, 'click')` or `monitorEvents($0, 'key')` | Logs Event objects for all specified events; type shortcuts (mouse, key, touch, control) cover groups [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| API response capture | Screenshot or manual transcription | Network tab → Response tab → Copy, or Export HAR | Exact byte-for-byte response preserved; HAR format includes headers, timing, and body [VERIFIED: developer.chrome.com/docs/devtools/network/reference] |
| CSS value extraction | Visual approximation | Elements → Computed tab → filter by category | Shows final computed values resolving all cascade, inheritance, and custom properties [ASSUMED] |
| Call graph reconstruction | Manual source reading | `debug(fn)` → exercise → Call Stack pane | Shows exact call chain from entry point to breakpoint; copy stack trace for documentation [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference] |

**Key insight:** Chrome DevTools Console Utilities API provides purpose-built reverse engineering primitives (`$0`-`$4`, `debug`, `monitor`, `monitorEvents`, `getEventListeners`, `copy`) that eliminate the need for custom instrumentation scripts. Using these built-ins is faster, more reliable, and doesn't modify the target application.

## Runtime State Inventory

> **N/A** — Phase 01 is not a rename, refactor, or migration. No runtime state, stored data, live service config, OS-registered state, secrets, or build artifacts need to be inventoried. This is a greenfield documentation phase targeting an external system.

## Common Pitfalls

### Pitfall 1: DOM Extraction Without Context
**What goes wrong:** Copying the HTML of each view without documenting which elements are conditional (shown/hidden based on state), which elements are dynamically generated (created by JS, not in static HTML), and which attributes trigger behavior (`data-route`, `data-step`, `onclick`).
**Why it happens:** Elements panel shows the current DOM state — it doesn't show the logic that created it. A developer looking at static HTML alone can't tell that `.step-card.disabled` becomes `.step-card` after CNPJ lookup succeeds.
**How to avoid:** For each view, exercise it through ALL states:
- **Dashboard:** Empty state (no localStorage), populated state (with data)
- **Etapa 1:** All 5 step states + error states (invalid CNPJ, API down)
- **Etapa 2:** Before purchase, during purchase, after SMS code received
- **Etapa 3:** No PDF loaded, PDF loaded, overlays added, overlays deleted
- **Config:** No tokens configured, tokens configured, multi-account
Document the conditions under which each element appears/disappears.
**Warning signs:** RECON.md lists only one DOM state per view. The phrase "this is what the page looks like" without noting "when X is true."

### Pitfall 2: Missing Conditional localStorage Branches
**What goes wrong:** Documenting the localStorage schema based on an initial inspection without exercising all features. Conditional branches like `empresas[].raw` (populated by CNPJ lookup) or `sites[].deploymentId` (populated by Cloudflare deploy) are missed. Downstream builders encounter `undefined` errors when accessing missing properties.
**Why it happens:** localStorage is inspected once at the start. The schema appears complete. But many keys/objects only exist after specific user actions.
**How to avoid:**
1. Start with a CLEAN localStorage (Application → Clear All)
2. Exercise EVERY workflow to completion (CNPJ lookup, site generation, Cloudflare deploy, SMS purchase, PDF overlay, status change, backup/restore)
3. After each workflow, re-inspect localStorage (`Object.keys(localStorage)` + parse each key)
4. Document WHEN each key/branch is created and WHAT action populates it
**Warning signs:** RECON.md shows a single JSON schema with no annotations about conditional fields. Every optional/conditional field must be marked as such.

### Pitfall 3: Documenting APIs Without Error Responses
**What goes wrong:** RECON.md documents only the happy-path response shape. Downstream builders write API clients that crash on error responses because they don't handle the error shape.
**Why it happens:** It's natural to test with valid inputs. Error cases require deliberate effort (bad CNPJ, expired token, network offline).
**How to avoid:** For EVERY external API endpoint, deliberately trigger and document:
- **4xx errors:** Invalid input (wrong CNPJ format, bad API key)
- **5xx errors:** Simulate by blocking the domain in Network request blocking [VERIFIED: developer.chrome.com/docs/devtools/network/reference]
- **Network errors:** Toggle Offline in Network throttling
- **Timeout errors:** Use Network throttling → Custom → Add... → set extremely slow profile
Document the EXACT error response body, status code, and any error-specific headers.
**Warning signs:** API contract section shows only `200 OK` responses. No `404`, `401`, `500` entries.

### Pitfall 4: Approximate CSS Values ("Close Enough")
**What goes wrong:** Using "about 12px" instead of exact `13px`, "blue-ish" instead of `#6366f1`, "some shadow" instead of `box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`. Cumulative discrepancies across 50+ components produce a visually different clone.
**Why it happens:** Visual approximation feels adequate. But the original's design system uses specific values for a reason — 1px differences in padding cascade through grid layouts.
**How to avoid:**
1. Elements Panel → select element → **Computed** tab → shows all final computed values (resolved through cascade) [ASSUMED]
2. Elements Panel → **Styles** tab → shows all applied rules with exact selectors
3. Copy exact values including units: `padding: 13px 20px`, not `padding: ~12-14px horizontal`
4. For gradients: copy the exact `linear-gradient(160deg, #4f46e5, #3730a3 60%, #312e81)` not "purple gradient"
5. For shadows: copy ALL layers including `inset` shadows, `0 0` ambient shadows, and colored shadows
**Warning signs:** CSS values in RECON.md use words like "about", "approximately", or have single-value approximations where multi-layer properties exist (e.g., `box-shadow: 0 2px 8px rgba(0,0,0,0.3)` when the original has 3 shadow layers).

### Pitfall 5: Incomplete Function Call Graph
**What goes wrong:** Documenting functions in isolation without capturing who calls whom, what side effects cascade, and what order functions must be called. Downstream builders replicate functions but wire them together incorrectly.
**Why it happens:** Source code is read top-to-bottom. But execution order is determined by event handlers, callbacks, and async chains — not source order.
**How to avoid:**
1. Use `debug(fn)` to break when each function is called, then inspect Call Stack [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]
2. Use `monitor(fn)` to log every invocation with arguments during exercise [VERIFIED: developer.chrome.com/docs/devtools/console/utilities]
3. For each function, document: **Called By:** (list of callers), **Calls:** (list of callees), **Called When:** (user action, route change, timer, etc.)
**Warning signs:** Function documentation shows signature and return value but no "Called By" or "Calls" section.

### Pitfall 6: Ignoring CORS Proxy Layer
**What goes wrong:** Documenting API endpoints as direct calls to external services, when the original uses a Netlify `_redirects` proxy layer (`/cf-api/* → https://api.cloudflare.com/*`). Clone builders hit CORS errors because they call external APIs directly.
**Why it happens:** The Network tab shows the proxied URLs (`/cf-api/client/v4/...`) not the real URLs. The proxy rewriting layer (`instalarProxy()`) is invisible in Network traces — you only see the already-rewritten URLs.
**How to avoid:**
1. Inspect the `instalarProxy()` function in Sources to understand URL rewriting logic
2. Find the `_redirects` file (if accessible) or infer proxy rules from API call patterns
3. Document BOTH the client-side URL AND the target upstream URL
4. Note that the clone must either replicate the proxy layer or fully mock APIs for development
**Warning signs:** RECON.md API section shows only the proxied URLs (`/cf-api/...`) without documenting the upstream target.

## Code Examples

Verified patterns from official Chrome DevTools documentation:

### Console Utilities for Reverse Engineering
```javascript
// Source: developer.chrome.com/docs/devtools/console/utilities [VERIFIED]

// $0 — currently selected element in Elements panel
$0                          // Returns the element
$0.outerHTML                // Full HTML of element
copy($0.outerHTML)          // Copies to clipboard

// $1, $2, ... — previously selected elements (up to $4)
$1                          // Second most recently selected element

// $(selector) — shortcut for document.querySelector
$('#sidebar')               // First element matching #sidebar
$('[data-route="etapa1"]')  // First element with data-route="etapa1"

// $$(selector) — returns array of all matching elements
$$('.nav-link')             // All navigation links
$$('.nav-link').map(el => el.dataset.route)  // All route names

// getEventListeners(object) — discover ALL event handlers
getEventListeners($0)       // All listeners on selected element
getEventListeners(document) // All listeners on document

// monitor(function) — log every invocation with arguments
monitor(go)                // Logs: "function go called with arguments: "etapa1""

// monitorEvents(object[, events]) — log DOM events
monitorEvents($0, 'click')  // Log all clicks on selected element
monitorEvents(window, ['resize', 'scroll'])  // Multiple events
monitorEvents($0, 'key')    // All keyboard events (type shortcut)

// debug(function) — break when function is called
debug(e1Buscar)             // Debugger pauses when e1Buscar is called
undebug(e1Buscar)           // Stop debugging

// keys(object) / values(object) — enumerate properties
Object.keys(VIEWS)          // All view names
keys(window)                // All global properties (Console Utility version)

// table(data) — display as sortable table
table(ROUTES)               // Route table
table(Object.entries(localStorage))  // All localStorage key-value pairs

// inspect(object) — opens in appropriate panel
inspect($0)                 // Opens in Elements panel
inspect(go)                 // Opens in Sources panel
```

### Network Tab Extraction Workflow
```javascript
// Source: developer.chrome.com/docs/devtools/network/reference [VERIFIED]

// Step 1: Setup
// Network tab → ☑ Preserve log → filter: Fetch/XHR → ☐ Disable cache

// Step 2: Exercise all API-triggering flows
// Navigate through each view, trigger all actions

// Step 3: For each XHR/Fetch request, inspect:
// Headers tab    → Request Headers (Auth, Content-Type, custom)
//                → Response Headers (rate-limit, content-type, caching)
// Payload tab    → Query String Parameters / Form Data
// Response tab   → Full response body
// Timing tab     → Request duration breakdown

// Step 4: Force errors
// Network conditions → Offline → trigger API calls → document failure behavior
// Use invalid inputs → document 4xx error shapes
// Network request blocking → block specific domains → document timeout behavior

// Step 5: Export
// Right-click any request → Save all as HAR with content
// Right-click any request → Replay XHR (press R) to re-send
```

### Function Extraction from Sources Panel
```javascript
// Source: developer.chrome.com/docs/devtools/javascript/reference [VERIFIED]

// Step 1: Pretty Print (automatic in Sources panel)
// Verify {} icon at bottom-left shows pretty-print is active

// Step 2: Set breakpoints to trace execution
// Click line number in Sources → blue marker appears
// Exercise the app → execution pauses at breakpoint

// Step 3: While paused, inspect:
// Scope pane        → Local variables (current values)
//                   → Closure variables (captured scope)
//                   → Global variables
// Call Stack pane   → Full call chain from entry point
//                   → Right-click → Copy stack trace

// Step 4: Watch expressions
// Watch pane → + → enter expression (e.g., "etapa1State.currentStep")
// Values update in real-time as you step through code

// Step 5: Step through comma-separated expressions (Chrome 108+)
// Minified code like: return foo(),bar(),42
// Debugger steps through each expression individually

// Step 6: Live-edit paused functions (Chrome 105+)
// Edit the top-most function in Call Stack while paused
// Press Ctrl+S → debugger restarts the function with changes
```

### Lighthouse Baseline Capture
```markdown
# Source: developer.chrome.com/docs/devtools/lighthouse [VERIFIED]

**Navigation Audit (baseline for VAL-04):**
1. DevTools → Lighthouse panel
2. Mode: Navigation
3. Device: Desktop
4. Categories: Performance + Best Practices + Accessibility + SEO
5. ☐ Clear storage (for clean baseline)
6. Click "Analyze page load"
7. Save report: three-dots menu → Save (JSON)

**Metrics to record for bundle size comparison:**
- Total resource size (from Performance audit)
- JavaScript resource size (main bundle)
- CSS resource size
- Total requests
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `console.log` instrumentation | `debug(fn)` + `monitor(fn)` Console Utilities | Chrome DevTools (stable since 2015+) | Zero source modification; captures call stacks and arguments without polluting source [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| DOM inspection via `document.querySelector` | `$0-$4` auto-binding to Elements panel selection | Chrome DevTools (stable since 2015+) | Instant reference to last 5 inspected elements; no manual selector writing [VERIFIED: developer.chrome.com/docs/devtools/console/utilities] |
| Export individual API responses | HAR export with full content | Network panel (stable) | Complete request/response archive including timing, headers, and body; offline reference [VERIFIED: developer.chrome.com/docs/devtools/network/reference] |
| Minified code unreadable | Pretty Print + comma-separated expression stepping | Chrome 108 (2022) | Debugger steps through `a(),b(),c()` patterns in minified code as individual expressions [VERIFIED: developer.chrome.com/docs/devtools/javascript/reference] |
| CSS value approximation | Computed tab + CSS Overview panel | Computed tab (stable); CSS Overview (Chrome 87+) | Exact pixel values from cascade resolution; design token inventory [ASSUMED] |
| Static localStorage inspection | Monkey-patched write tracking + exercise-all-flows | Custom technique | Captures conditionally-created keys that static inspection misses [ASSUMED] |

**Deprecated/outdated:**
- **`console.log`-based reverse engineering:** Replaced by `debug()`, `monitor()`, and breakpoint-based inspection which don't require source modification
- **Visual CSS approximation:** Replaced by Computed tab which resolves all cascade, inheritance, and custom property values to exact numbers
- **Manual HAR construction:** Replaced by Network panel's built-in "Save all as HAR with content"

## Assumptions Log

> All claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Wappalyzer extension is the recommended tool for stack detection | Standard Stack | Low — Chrome DevTools Sources panel can also reveal framework usage; Wappalyzer is a convenience, not a requirement |
| A2 | `Object.keys(localStorage)` reveals all keys including those not visible in the Application panel UI | Architecture Patterns (Pattern 2) | Low — Application panel shows all keys by domain; Console command is redundant for same-origin inspection but useful for cross-origin iframes |
| A3 | Monkey-patching `Storage.prototype.setItem` is the recommended method for tracking all localStorage writes | Architecture Patterns (Pattern 2) | Low — Application panel shows key-values; monkey-patching is a supplementary technique for temporal tracking |
| A4 | Chrome DevTools Snippets can store reusable extraction scripts | Architecture Patterns (Pattern 5) | Very Low — Snippets are a convenience; all commands can be typed directly in Console |
| A5 | Elements → Computed tab shows final computed CSS values resolving all cascade and inheritance | Common Pitfalls (Pitfall 4) | Low — Computed tab is the standard DevTools feature for this; confirmed by Chrome DevTools documentation structure |
| A6 | CORS proxy layer (`instalarProxy()`) rewrites URLs and must be documented for clone to replicate | Common Pitfalls (Pitfall 6) | Medium — if the proxy layer is simpler than assumed (e.g., only path rewriting), the clone may not need a proxy at all; verify during RECON extraction |
| A7 | CSS Overview panel (Chrome 87+) provides design token inventory useful for RECON | State of the Art | Very Low — CSS Overview is a supplementary tool; Computed tab is the primary CSS extraction method |
| A8 | The original app at laboratoriodebms.netlify.app is still accessible and behaves identically to when FEATURES.md was researched | All sections | Medium — if the original has been updated since FEATURES.md research, RECON.md may need to capture changed behavior; re-verify during extraction |

## Open Questions

1. **Exact Cloudflare Pages API version and endpoint stability**
   - What we know: FEATURES.md documents a 5-step pipeline (create project → JWT → BLAKE3 hash → upload → deploy). The endpoints are likely `/client/v4/accounts/{id}/pages/projects` etc.
   - What's unclear: Whether Cloudflare has deprecated or changed these endpoints since the original was built. Specific API version, deprecation headers, and any breaking changes.
   - Recommendation: During RECON extraction, capture exact URLs, note any deprecation warnings in response headers, and document the Cloudflare API version if present in response.

2. **SMS24h API endpoint contract details**
   - What we know: FEATURES.md identifies `smsAPI(action, params)` wrapper with number purchase and SMS code polling.
   - What's unclear: Exact API base URL, authentication method (header? query param?), rate limits, supported countries/services list, polling interval duration.
   - Recommendation: Capture full request/response for: getBalance, getNumbers (by country/service), buyNumber, getSMS (polling). Document auth mechanism exactly.

3. **Tailwind CSS CDN version used by the original**
   - What we know: Original uses Tailwind CSS via CDN. FEATURES.md notes Tailwind CDN but doesn't specify version.
   - What's unclear: Whether it's Tailwind v3 or v4 CDN, which affects utility class availability and configuration.
   - Recommendation: Check the `<script>` or `<link>` tag in Sources → Page tab for the exact CDN URL and version. Document in RECON.md §6.6.

4. **pdf.js and pdf-lib CDN version pinning**
   - What we know: Original loads pdf.js and pdf-lib from CDN. FEATURES.md doesn't specify versions.
   - What's unclear: Exact CDN URLs and versions. Different versions may have different APIs, causing clone divergence.
   - Recommendation: In Sources → Page tab, locate the pdf.js and pdf-lib script URLs. Document exact versions. The clone must use the same versions to avoid behavioral differences.

5. **Whether `__INITIAL_STATE__` or similar global state object exists**
   - What we know: FEATURES.md mentions 3 state objects (`etapa1State`, `etapa2State`, `pdfState`) as module-level variables.
   - What's unclear: Whether there's a global state object (like `__INITIAL_STATE__`) that seeds the app, or whether state is entirely lazy-initialized from localStorage.
   - Recommendation: In Console, inspect `window.__INITIAL_STATE__`, `window.store`, and any other global objects. Document bootstrap sequence in RECON.md §5.10.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Google Chrome | All RECON extraction (DevTools) | ✓ | 149.0.7827.114 | Chromium, Edge (Chromium-based) |
| Node.js | HAR file processing (optional) | ✓ | v20.20.2 | — |
| npm | None directly (no packages installed) | ✓ | 10.8.2 | — |
| Wappalyzer | Stack detection (auxiliary) | ✗ | — | Manual inspection of Sources → Page tab for framework signatures |
| Git | Commit RECON.md | ✓ | (repo exists) | — |
| Internet access | Access to laboratoriodebms.netlify.app | Required | — | None — target site must be accessible |

**Missing dependencies with no fallback:**
- **Internet access to laboratoriodebms.netlify.app:** The entire phase depends on accessing the live target site. If the site is down, extraction cannot proceed. No fallback exists — the site is the single source of truth.

**Missing dependencies with fallback:**
- **Wappalyzer:** Not critical. Stack detection can be done manually via Sources → Page tab (look for framework files, CDN URLs, characteristic code patterns). The original is already confirmed as vanilla JS + Tailwind CDN.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | N/A — Phase 01 produces documentation, not executable code |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECON-01 | DOM tree completeness and vanilla JS confirmation | Manual: Compare extracted DOM against live site for all 8 routes | N/A — manual verification | ❌ Manual |
| RECON-02 | API contract completeness (all endpoints, success + error) | Manual: Check each endpoint has success, error, headers, and payload documented | N/A — manual verification | ❌ Manual |
| RECON-03 | localStorage schema completeness (all keys, all conditional branches) | Manual: Cross-reference against FEATURES.md inventory and exercise-all-flows checklist | N/A — manual verification | ❌ Manual |
| RECON-04 | Route map completeness (all 8 routes, go() behavior, VIEWS registry) | Manual: Verify ROUTES array, go() side effects, navigation behavior documented | N/A — manual verification | ❌ Manual |
| RECON-05 | Business logic function extraction completeness (~60 functions) | Manual: Cross-reference RECON.md function list against FEATURES.md inventory; every function has signature + params + return + side effects + call graph | N/A — manual verification | ❌ Manual |

### Sampling Rate
- **Per task commit:** Manual review of RECON.md section against live site
- **Per wave merge:** Cross-reference all 5 RECON requirements against FEATURES.md inventory
- **Phase gate:** All 5 RECON requirements verified complete before advancing to Phase 02

### Wave 0 Gaps
- No automated test infrastructure exists or is needed for a documentation phase. Validation is manual: compare RECON.md against live site behavior.
- **Completeness checklist (manual):**
  - [ ] All 8 routes documented with DOM tree, triggered APIs, and state dependencies
  - [ ] All ~60 functions from FEATURES.md inventory have RECON.md entries
  - [ ] Both localStorage keys fully schematized with conditional branches annotated
  - [ ] Every API endpoint documented with success AND error response shapes
  - [ ] CSS custom properties and component classes extracted with exact pixel values
  - [ ] Cross-reference appendix maps each view to its DOM/API/State/Route/Function/CSS sections
  - [ ] Lighthouse baseline captured for VAL-04 comparison

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes — observe | Document authentication patterns observed (API tokens in headers, cosmetic login form). Note: original uses localStorage for mock auth, no real OAuth/JWT. |
| V3 Session Management | Yes — observe | Document session management (single-user localStorage mock). No real sessions — purely cosmetic. |
| V4 Access Control | No | Original is single-user. No role-based access control exists. |
| V5 Input Validation | Yes — observe | Document input validation patterns (CNPJ format, domain name sanitization, HTML escaping via `escapeHTML()`). Note which inputs are sanitized and which are not. |
| V6 Cryptography | Yes — observe | Document BLAKE3 hash usage (Cloudflare upload). Note: API tokens stored in plaintext localStorage — document this as a finding for the clone's awareness. |

### Known Threat Patterns for vanilla JS SPA with localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API tokens in plaintext localStorage | Information Disclosure | Document in RECON.md as observed behavior; clone should replicate exactly (match original) but note as security concern for future hardening |
| XSS via innerHTML injection | Tampering | Document that original uses `innerHTML` for view rendering; note `escapeHTML()` utility function existence; document which view functions use `escapeHTML()` vs raw string interpolation |
| Unvalidated URL parameters in fetch calls | Tampering | Document that CNPJ and domain inputs are used directly in API URLs; note any sanitization observed |
| CORS proxy exposing Cloudflare API | Elevation of Privilege | Document the `instalarProxy()` mechanism; note that the proxy allows client-side Cloudflare API calls that would normally require server-side auth |

## Sources

### Primary (HIGH confidence — verified against official Chrome DevTools documentation)
- [developer.chrome.com/docs/devtools/console/utilities] — Console Utilities API reference: `$0`-`$4`, `$(selector)`, `$$(selector)`, `$x(path)`, `clear()`, `copy(object)`, `debug(function)`, `dir(object)`, `getEventListeners(object)`, `keys(object)`, `monitor(function)`, `monitorEvents(object[, events])`, `table(data)`, `inspect(object)`, `queryObjects(Constructor)`. [VERIFIED: webfetch — 2026-06-27]
- [developer.chrome.com/docs/devtools/network/reference] — Network features reference: Record requests, Preserve log, Replay XHR, filter by Fetch/XHR, view headers/payload/response/timing, export HAR, request blocking, network throttling (Offline, custom profiles). [VERIFIED: webfetch — 2026-06-27]
- [developer.chrome.com/docs/devtools/javascript/reference] — JavaScript debugging reference: Pretty Print, breakpoints, step through comma-separated expressions (Chrome 108+), Scope pane, Call Stack, live edit paused functions (Chrome 105+), restart frame, authored/deployed file grouping, ignore-listed sources. [VERIFIED: webfetch — 2026-06-27]
- [developer.chrome.com/docs/devtools/storage/localstorage] — View and edit local storage: Application panel key-value viewing, editing, deleting, filtering, Console interaction. [VERIFIED: webfetch — 2026-06-27]
- [developer.chrome.com/docs/devtools/lighthouse] — Lighthouse panel: Navigation/Timespan/Snapshot modes, category selection, device selection, advanced settings (clear storage, JS sampling, throttling). [VERIFIED: webfetch — 2026-06-27]
- [developer.chrome.com/docs/devtools/sources] — Sources panel overview: Page tab, Editor tab, Snippets, Workspaces, debug JavaScript, file viewing. [VERIFIED: webfetch — 2026-06-27]

### Secondary (MEDIUM confidence — existing project research)
- [.planning/research/FEATURES.md] — Original system inventory: ~60 functions, 8 routes, 3 state objects, 4 external services, complete feature dependency graph. Authoritative reference for RECON extraction completeness. [CITED: internal project file]
- [.planning/research/SUMMARY.md] — Research synthesis with domain corrections. Confirms vanilla JS stack, localStorage foundation, CSS custom properties theming boundary. [CITED: internal project file]
- [.planning/phases/01-reconnaissance-extraction/01-CONTEXT.md] — User decisions: RECON.md layer organization, extraction depth, manual DevTools method. [CITED: internal project file]

### Tertiary (LOW confidence — training knowledge, not verified this session)
- RECON.md documentation format and per-element/per-function/per-endpoint templates — these are synthesized from reverse engineering best practices and are recommendations, not established standards. [ASSUMED]
- Monkey-patching `Storage.prototype.setItem` for localStorage write tracking — this is a well-known debugging technique but was not verified from an authoritative source in this session. [ASSUMED]
- Elements → Computed tab for exact CSS values — this is standard DevTools usage but the specific technique for reverse engineering was not verified from an authoritative source. [ASSUMED]
- CSS Overview panel for design token inventory — mentioned in Chrome DevTools documentation structure but specific reverse engineering application is assumed. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Chrome DevTools features verified against official documentation (developer.chrome.com). No packages to install.
- Architecture: HIGH — Workflow order (localStorage → DOM → Routes → APIs → Functions → CSS) derived from dependency analysis of the target system documented in FEATURES.md. DevTools techniques verified against official docs.
- Pitfalls: MEDIUM — 4 of 6 pitfalls are reinforced by official DevTools documentation; 2 (CSS approximation, CORS proxy) are based on project-specific knowledge from FEATURES.md/SUMMARY.md and training knowledge about common reverse engineering errors.
- RECON.md format: LOW — The recommended section structure and documentation templates are synthesized from best practices; no authoritative "RECON.md standard" exists. Format is agent discretion per D-01.

**Research date:** 2026-06-27
**Valid until:** 2026-07-11 (14 days — target site stability is the limiting factor; DevTools features are stable)
