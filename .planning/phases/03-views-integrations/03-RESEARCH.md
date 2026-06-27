# Phase 03: Views & Integrations - Research

**Researched:** 2026-06-27
**Domain:** Vanilla JS SPA views with API integrations (BrasilAPI, Cloudflare Pages, SMS24h), PDF manipulation, polling systems, template generation
**Confidence:** HIGH (Core patterns from RECON.md source analysis + MDN official docs; CDN library usage verified via official documentation)

## Summary

Phase 03 fills in the 8 view stubs created in Phase 02 (Foundation) with full business logic, API integrations, and user interaction code. Every view function returns a pure HTML string matching the original's VIEWS contract — no side effects during render. Business logic lives in separate module functions (e1Buscar, smsComprar, carregarPDF, etc.) called via inline onclick handlers. The phase implements 28 requirements across 8 route views, integrating 3 external APIs (BrasilAPI, Cloudflare Pages, SMS24h) and 2 CDN libraries (pdf.js 3.11.174, pdf-lib).

The architecture follows a strict pattern: each view module exports an `init` function that assigns a render function to `VIEWS[route]`. Business logic functions remain module-scoped but are exposed to `window` when needed by inline onclick handlers. Three state objects (`etapa1State`, `etapa2State`, `pdfState`) are module-level `let` declarations — the same pattern as the original (RECON.md §3.3). Data persistence flows through the existing `src/stores/data.js` (getDB/saveDB/getSettings/saveSettings) — no direct localStorage access from view code.

**Primary recommendation:** Replicate the original's function-by-function architecture exactly per RECON.md §5, organizing code into 8 view modules. Use the existing Phase 02 foundation (router, stores, widgets, utils, proxy, styles) as the backbone. Each view module is ~200-400 lines; Etapa 1 is the largest at ~600 lines due to the 5-step wizard, buildSiteHTML template (~285 lines), and Cloudflare deploy pipeline.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CNPJ Lookup (ETP1-01) | Browser / Client | — | Direct fetch to BrasilAPI (public CORS-enabled API), no proxy needed |
| Sequential Wizard (ETP1-02) | Browser / Client | — | Pure client-side state machine (etapa1State), no server coordination |
| Domain Suggestions (ETP1-03) | Browser / Client | — | Pure computation (string manipulation), no API needed |
| Site HTML Generation (ETP1-04) | Browser / Client | — | Pure template function (~285 lines template literal), produces complete HTML document |
| Cloudflare Deploy (ETP1-05) | Browser / Client | Cloudflare API | 5-step pipeline executed client-side via proxied fetch; BLAKE3 hash computed locally |
| SMS Purchase (ETP2-01..05) | Browser / Client | SMS24h API | Client-side polling (setInterval), plain-text API responses, proxy for CORS |
| PDF Rendering (ETP3-01) | Browser / Client | — | pdf.js 3.11.174 via CDN, canvas rendering in browser |
| PDF Overlays (ETP3-02) | Browser / Client | — | DOM-based contentEditable overlays positioned over canvas |
| PDF Merge/Download (ETP3-03) | Browser / Client | — | pdf-lib via CDN, client-side PDF manipulation |
| Address Extraction (ETP3-04) | Browser / Client | — | Pure regex extraction from pdf.js text content |
| Company Grid (BANC-01..03) | Browser / Client | — | Dynamic rendering from localStorage data, client-side search/filter |
| Site Spreadsheet (PLAN-01..04) | Browser / Client | — | Client-side table rendering + CSV generation from localStorage |
| Config Management (CONF-01..03) | Browser / Client | Cloudflare API + SMS24h API | Token storage via localStorage, API test calls via proxy |
| Help Guides (AJUD-01) | Browser / Client | — | Static content, no state dependencies |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Cards de KPI — Empresas, Sites Criados, No Ar, Finalizados (statCard) | §Pattern 1: Widget-based View Composition — statCard calls from existing src/widgets/statCard.js, computed from getDB() data |
| DASH-02 | Quick Cards com ações rápidas (quickCard) | §Pattern 1: Widget-based View Composition — quickCard calls from existing src/widgets/quickCard.js, 6 action cards matching original |
| DASH-03 | API Status Pills no header | Already implemented in Phase 02 (refreshHeaderStatus in src/utils/header.js) — Phase 03 just ensures data flows |
| ETP1-01 | CNPJ Lookup via BrasilAPI com normalização de response | §API Integration Patterns + RECON.md §2.1 — direct fetch, normalizarBrasilAPI() transforms 30-field response |
| ETP1-02 | 5-Step Sequential Wizard com progressive unlocking | §Pattern 3: Wizard State Machine — etapa1State gates, cascade reset pattern |
| ETP1-03 | Domain Suggestion Engine com 7 algoritmos | §Domain Suggestion Algorithms — 7 pure functions, duplicate removal, 6 max suggestions |
| ETP1-04 | Site HTML Generator (~300 linhas) | §Template Engine Patterns — buildSiteHTML with helper breakdown, 25-field dados object |
| ETP1-05 | Cloudflare Pages API Deployment (5 passos) | §Cloudflare Pages 5-Step Pipeline — create→JWT→hash→upload→deploy, auth switching (API token vs JWT), FormData for final step |
| ETP2-01 | SMS24h API Client wrapper (smsAPI) | §API Integration Patterns + RECON.md §2.4 — smsAPI() wrapper, query-param auth, plain-text responses |
| ETP2-02 | Compra de número virtual por país/serviço | §API Integration Patterns — ACCESS_NUMBER response parsing, country/service enum |
| ETP2-03 | Auto-polling para código de ativação SMS (setInterval) | §SMS Polling Patterns — 5s interval, 20-min timeout, timer storage in etapa2State.timer |
| ETP2-04 | Display de número formatado com botão de cópia | §Pattern 4: Copy-to-Clipboard Pattern — formatBRPhone + inline copyText |
| ETP2-05 | Re-deploy do site no Cloudflare com novo número | §Cloudflare Pages 5-Step Pipeline — re-deploy skips create-project, builds new HTML with updated phone |
| ETP3-01 | PDF Viewer com pdf.js — renderização multi-página | §PDF.js Integration — CDN v3.11.174, scale 1.4, canvas-per-page, worker CDN path |
| ETP3-02 | Click-to-add overlays de texto (contentEditable, draggable) | §PDF Overlay Patterns — pdf-overlay-text divs, absolute positioning, drag handlers |
| ETP3-03 | PDF Download com merge via pdf-lib | §pdf-lib Integration — PDFDocument.load, drawText per overlay, Y-flip conversion |
| ETP3-04 | Address Field Extractor — regex para 7 campos | §Address Extraction Patterns — 7 regex patterns for Brazilian addresses, ordered text extraction |
| BANC-01 | Grid de cards de empresa com renderização dinâmica | §Pattern 5: Post-Render Hook Pattern — VIEWS.banco returns shell, renderBanco() fills #banco-list via after_banco hook |
| BANC-02 | Busca textual e filtro por capital social | §Pattern 5 — client-side filter, reverse-order display (newest first), capital faixa enum |
| BANC-03 | Ação "Usar na Etapa 1" que alimenta o wizard | §Cross-View State Transfer — imports empresa into etapa1State, resets downstream fields, navigates |
| PLAN-01 | Tabela de 8 colunas | §Pattern 5: Post-Render Hook Pattern — VIEWS.planilha returns shell, renderPlanilha() fills #planilha-body via after_planilha hook |
| PLAN-02 | Status dropdown inline para alteração de estado | §Pattern 5 — select.onchange calls mudarStatus(), updates localStorage, re-renders |
| PLAN-03 | Delete de registros | §Pattern 5 — confirm() dialog, localStorage filter, re-render |
| PLAN-04 | Export CSV com BOM UTF-8 para Excel | §CSV Export Patterns — UTF-8 BOM (\uFEFF), semicolon separator, Blob download, 10 columns |
| CONF-01 | Cloudflare Token Management com auto-detecção de conta | §API Integration Patterns + RECON.md §2.3 — Cloudflare /accounts endpoint, multi-account picker |
| CONF-02 | SMS24h API Key input | §Pattern 8: Config View Pattern — password input, test button, saveSettings |
| CONF-03 | Backup/Restore como arquivo JSON | §Pattern 8 — exportBackup (JSON download), importBackup (FileReader → JSON.parse → saveDB/saveSettings) |
| AJUD-01 | Guias passo-a-passo como listas ordenadas | §Pattern 9: Static Content View — ajuda() helper function, pure template, no state |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript (ES2020+) | — | All view logic, API calls, state management | Locked decision D-02/D-03; original uses vanilla JS |
| Tailwind CSS v3 | 3.4.0 (pinned CDN) | Utility-first CSS framework | Phase 02 foundation; locked decision D-02 |
| pdf.js | 3.11.174 (pinned cdnjs) | PDF rendering (Etapa 3) | Original pinned version; used lazily via dynamic import | [VERIFIED: mozilla.github.io/pdf.js/getting_started/] |
| pdf-lib | 1.17.1 (via jsdelivr CDN) | PDF merge/download (Etapa 3) | Original dependency; used lazily when Etapa 3 loads | [VERIFIED: github.com/Hopding/pdf-lib] |
| `@noble/hashes` (BLAKE3) | 2.2.0 (via esm.sh CDN) | Cloudflare Pages hash computation | Required for Cloudflare deploy pipeline Step 3 | [VERIFIED: npm registry] |
| Google Fonts: Inter | latest (weights 400,500,600,700,800) | Body font | Phase 02 foundation |
| Google Fonts: Sora | latest (weights 600,700,800) | Display/heading font | Phase 02 foundation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | All logic is vanilla JS; no additional libraries needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| inline onclick handlers | addEventListener in post-render hooks | Inline matches original exactly + simpler event lifecycle (no cleanup needed on re-render). addEventListener would require detaching before innerHTML replacement to prevent memory leaks. |
| Axios/fetch wrapper library | Vanilla fetch() | Axios adds 13KB gzipped; fetch() is native and sufficient. The only challenge is CORS (solved by Phase 02 proxy layer) and response.ok checking (trivial). |
| React/Vue for wizard state | Manual state object (etapa1State) | State machine with 5 fields is simple enough for imperative code. Adding a framework would violate the "vanilla JS" constraint and increase bundle size 10x. |
| Separate template engine (Handlebars/EJS) | Template literals | Template literals are native, zero-cost, and sufficient for ~300-line templates. Adding a template engine would require a build step (violates D-02) and adds 30KB+ bundle size. |
| pdf.js v6.x (latest) | pdf.js 3.11.174 (original pinned) | v6 may have breaking API changes. Pinning 3.11.174 guarantees identical rendering behavior to original. Upgrade path documented in §State of the Art. |

**Installation:**
```bash
# No npm install — CDN only. All files are plain JS/CSS.
# CDN scripts loaded in index.html:
#   - pdf.js 3.11.174: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
#   - pdf-lib 1.17.1: https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js
#   - @noble/hashes: dynamic import('https://esm.sh/@noble/hashes@2.2.0/blake3')
```

**Version verification:**
```bash
npm view pdfjs-dist version          # → 6.0.227 (latest npm, but we use older CDN-pinned 3.11.174)
npm view pdf-lib version             # → 1.17.1 ✓
npm view @noble/hashes version       # → 2.2.0 ✓
```
[VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| pdfjs-dist | npm | ~9 yrs | 20.9M/wk | github.com/mozilla/pdf.js | [SUS] | Flagged — npm latest (6.0.227) published 2026-05-30 triggers "too-new"; but we use CDN-pinned v3.11.174 from cdnjs.cloudflare.com (stable since 2023). Not installing via npm. |
| pdf-lib | npm | ~5 yrs | 7.7M/wk | github.com/Hopding/pdf-lib | [OK] | Approved — v1.17.1 from jsdelivr CDN |
| @noble/hashes | npm | ~4 yrs | 59.2M/wk | github.com/paulmillr/noble-hashes | [OK] | Approved — v2.2.0 from esm.sh CDN |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** pdfjs-dist (npm) — but we use CDN-pinned v3.11.174, not npm. The SUS flag is for the latest npm package only, which is irrelevant to our CDN usage.

*All CDN URLs are from official distribution channels (cdnjs.cloudflare.com, jsdelivr.net, esm.sh). No npm installs in this phase.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         index.html (Phase 02 shell)                       │
│  Static: #backdrop, #sidebar, <header>, #toast, #modal-back              │
│  CDN scripts: tailwindcss, pdf.js, pdf-lib                               │
│  Entry: <script type="module" src="src/main.js">                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │                     src/main.js (Phase 02)                      │
    │  Imports all init functions → populates VIEWS registry          │
    │  Exposes 8+ functions to window (for inline onclick)            │
    │  Boot: instalarProxy → refreshHeaderStatus → go('dashboard')   │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
    ┌───────────┬───────────┬───────┴───────┬───────────┬───────────┐
    ▼           ▼           ▼               ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────────────────────────────────┐ ┌─────────┐
│ stores/ │ │ router/ │ │         views/ (Phase 03)            │ │widgets/ │
│ data.js │ │index.js │ │  Each init function assigns a        │ │statCard │
│         │ │         │ │  renderer to VIEWS[route].           │ │quickCard│
│ getDB() │ │ ROUTES[]│ │  Business logic functions remain     │ │stepBox  │
│saveDB() │ │ VIEWS{} │ │  module-scoped; exposed to window    │ │toast()  │
│getSett- │ │  go()   │ │  as needed for inline onclick.       │ │pill()   │
│ings()   │ │toggle-  │ └─────────────────────────────────────┘ │modal    │
│saveSett-│ │Sidebar()│                                          └─────────┘
│ings()   │ └─────────┘
└────┬────┘             ┌──────────────────────────────────────────────────┐
     │                  │         3 Module-Level State Objects              │
     ▼                  │                                                  │
localStorage            │  etapa1State: {empresa, dominio, metatag,        │
(lab_bms_db_v1,         │                htmlGerado, publicado}             │
 lab_bms_settings_v1)    │  etapa2State: {activationId, phone, code, timer} │
                         │  pdfState:    {fileBytes, pdfDoc, pages,         │
                         │                overlays[]}                       │
                         └───────────────────┬──────────────────────────────┘
                                             │
    ┌────────────────────────────────────────┼──────────────────────────────┐
    │                     External APIs (via Phase 02 proxy)                │
    │                                                                       │
    │  BrasilAPI ──direct──► fetch() (no proxy, CORS-enabled)               │
    │  Cloudflare ──/cf-api/──► instalarProxy rewrites URL                  │
    │  SMS24h     ──/sms-api/──► instalarProxy rewrites URL                 │
    │                                                                       │
    │  CDN Libraries (lazy-loaded in Etapa 3):                              │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐                     │
    │  │  pdf.js  │  │ pdf-lib  │  │ @noble/hashes    │                     │
    │  │ 3.11.174 │  │  1.17.1  │  │ (dynamic import) │                     │
    │  └──────────┘  └──────────┘  └──────────────────┘                     │
    └───────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 03 additions)

```
src/
├── main.js                     # Updated: imports 8 view init functions
├── stores/
│   └── data.js                 # Existing (Phase 02) — unchanged
├── router/
│   └── index.js                # Existing (Phase 02) — unchanged
├── views/                      # FULL implementations for Phase 03
│   ├── dashboard.js            # ~80 lines — statCard(4x) + quickCard(6x) from DB
│   ├── etapa1.js               # ~600 lines — 5-step wizard, ~20 functions
│   ├── etapa2.js               # ~300 lines — SMS purchase, polling, re-deploy
│   ├── etapa3.js               # ~400 lines — PDF viewer, overlays, merge, regex
│   ├── banco.js                # ~120 lines — company grid, search, filter
│   ├── planilha.js             # ~150 lines — 8-column table, status dropdown, CSV
│   ├── config.js               # ~250 lines — Cloudflare + SMS24h config, backup
│   └── ajuda.js                # ~60 lines — static help guides
├── widgets/                    # Existing (Phase 02) — unchanged
├── utils/
│   ├── format.js               # Existing (Phase 02) — unchanged
│   ├── string.js               # Existing (Phase 02) — unchanged
│   ├── clipboard.js            # Existing (Phase 02) — unchanged
│   └── header.js               # Existing (Phase 02) — unchanged
├── proxy/
│   └── index.js                # Existing (Phase 02) — unchanged
└── styles/                     # Existing (Phase 02) — unchanged
```

### Pattern 1: Widget-Based View Composition (Dashboard)

**What:** The Dashboard view reads from localStorage (`getDB()`, `getSettings()`) and composes its HTML using existing widget factory functions (`statCard`, `quickCard`, `pill`). No additional business logic — purely data → widget → HTML. This matches RECON.md §5.2 (VIEWS.dashboard, lines 312-367).

**When to use:** Dashboard view (DASH-01, DASH-02). Also applicable to any view that primarily displays computed data.

**Example:**
```javascript
// src/views/dashboard.js
// Source: RECON.md lines 312-367
import { VIEWS } from '../router/index.js';
import { getDB, getSettings } from '../stores/data.js';
import { statCard } from '../widgets/statCard.js';
import { quickCard } from '../widgets/quickCard.js';

export function initDashboard() {
  VIEWS.dashboard = () => {
    const db = getDB();
    const s = getSettings();
    const sites = db.sites || [];
    const empresas = db.empresas || [];
    const sitesNoAr = sites.filter(site => site.url && site.status === 'deploy').length;
    const finalizados = sites.filter(site => site.status === 'finalizado').length;
    const cfOk = !!(s.cf_token && s.cf_account);
    const smsOk = !!s.sms_key;

    return `<div class="space-y-6">
      <!-- Hero card -->
      <div class="grad-card rounded-3xl p-6 sm:p-8 flex flex-wrap gap-6 items-center">
        <div class="icon-cube floaty purple" style="width:80px;height:80px;font-size:40px">🧪</div>
        <div class="flex-1">
          <div class="pill doing">PLATAFORMA DE GESTÃO EMPRESARIAL</div>
          <h2 class="font-display text-2xl sm:text-4xl mt-3">Laboratório de BMs</h2>
          <p class="text-slate-300 mt-2 max-w-2xl">Ferramenta completa para criação de sites SaaS, consulta de CNPJ, gerenciamento de PDFs e muito mais.</p>
        </div>
      </div>

      <!-- API warning card (conditional) -->
      ${(!cfOk || !smsOk) ? `
      <div class="glass rounded-2xl p-5" style="border-color:rgba(245,158,11,.4);">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <div class="font-bold">Configure as APIs primeiro</div>
            <div class="text-slate-300 text-sm mt-1">Sem tokens configurados, Etapa 1 (publicar) e Etapa 2 (SMS) não funcionam.</div>
          </div>
        </div>
      </div>` : ''}

      <!-- 4 stat cards -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('🏢', 'Empresas', empresas.length, 'purple')}
        ${statCard('🌐', 'Sites Criados', sites.length, 'cyan')}
        ${statCard('🚀', 'No Ar', sitesNoAr, 'green')}
        ${statCard('✅', 'Finalizados', finalizados, 'amber')}
      </div>

      <!-- 6 quick cards -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${quickCard('🧬', 'Etapa 1 — Criar Site', 'CNPJ → Domínio → Meta → Site → Publicar', 'etapa1', 'purple')}
        ${quickCard('📱', 'Etapa 2 — Comprar Número', 'SMS24h integrado, polling automático', 'etapa2', 'cyan')}
        ${quickCard('📄', 'Etapa 3 — Editor PDF', 'Visualize, edite e mapeie campos', 'etapa3', 'green')}
        ${quickCard('💼', 'Banco de Empresas', 'Histórico de CNPJs consultados', 'banco', 'amber')}
        ${quickCard('📊', 'Planilha de Sites', 'Status de cada site publicado', 'planilha', 'rose')}
        ${quickCard('⚙️', 'Configurações', 'Tokens de API e backup', 'config', 'ghost')}
      </div>
    </div>`;
  };
}
```

### Pattern 2: API Client Wrapper (smsAPI)

**What:** The SMS24h API returns plain text (not JSON) with colon-delimited responses. The `smsAPI(action, extra)` wrapper handles URL construction, API key injection via query parameter, and error propagation. This matches RECON.md §5.4 (lines 1025-1032).

**When to use:** All SMS24h API calls (getBalance, getNumber, getStatus, setStatus). Not needed for BrasilAPI (direct fetch) or Cloudflare (uses Authorization header, not query param auth).

**Example:**
```javascript
// Inside src/views/etapa2.js
// Source: RECON.md lines 1025-1032
async function smsAPI(action, extra = '') {
  const k = getSettings().sms_key;
  if (!k) throw new Error('Sem API key SMS24h. Configure primeiro.');
  const url = `https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(k)}&action=${encodeURIComponent(action)}${extra}`;
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text(); // NOTE: Returns text, NOT JSON
}
```

**Key implementation notes:**
- The API key goes in the query string (`api_key=`), NOT in headers
- Responses are PLAIN TEXT — colon-delimited: `ACCESS_NUMBER:12345678:5531990885354`
- Error responses are also plain text: `NO_NUMBERS`, `NO_BALANCE`, `BAD_KEY`
- The CORS proxy rewrites `https://api.sms24h.org` → `/sms-api` (via Phase 02 proxy)

### Pattern 3: Wizard State Machine (Etapa 1)

**What:** A 5-step sequential wizard using a module-level `let etapa1State` object. Each step has a boolean gate derived from the previous step's field. Steps "unlock" progressively as fields are populated. Cascade reset: clearing a step clears ALL downstream fields. The wizard uses `go('etapa1')` to re-render after each state change. This matches RECON.md §1.3 + §3.3.1 + §5.3.

**When to use:** Etapa 1 — Criar Site (ETP1-02). Any multi-step form where steps must be completed sequentially.

**Example:**
```javascript
// Inside src/views/etapa1.js
// Source: RECON.md lines 391-905
let etapa1State = {
  empresa: null,        // Company object from CNPJ lookup
  dominio: '',          // Selected subdomain slug
  metatag: '',          // Facebook meta-tag HTML
  htmlGerado: '',       // Generated site HTML
  publicado: null       // {url, projectName, deploymentId} after deploy
};

// Boolean gates for progressive unlocking
// stepCnpj = !empresa → true when empresa is null (step not done)
// stepDom  = !dominio  → true when dominio is empty
// stepMeta = !metatag  → true when metatag is empty
// stepHTML = !htmlGerado → true when htmlGerado is empty

// Cascade reset: clearing step N clears steps N+1 through 5
function resetDownstream(fromStep) {
  if (fromStep <= 1) etapa1State.empresa = null;
  if (fromStep <= 2) etapa1State.dominio = '';
  if (fromStep <= 3) etapa1State.metatag = '';
  if (fromStep <= 4) etapa1State.htmlGerado = '';
  if (fromStep <= 5) etapa1State.publicado = null;
}
```

**Rendering pattern (each step has its own render function):**
```javascript
// Step wrapper using stepBox() widget (from Phase 02)
// stepBox(n, icon, title, done, body, disabled) → HTML string
function renderStep1CNPJ() {
  const { empresa } = etapa1State;
  const done = empresa !== null;
  const body = empresa
    ? renderCompanyCard(empresa)   // Show company data
    : renderCNPJSearchForm();      // Show CNPJ input + search button
  return stepBox(1, '🔍', 'Consultar CNPJ no BrasilAPI', done, body, false);
}
```

### Pattern 4: Copy-to-Clipboard Pattern

**What:** Every displayed value that can be copied (domain, URL, phone, code, address fields) uses a `copy-row` div with an inline `onclick="copyText(value, 'Mensagem copiada!')"` button. The `copyText` function (from Phase 02 `src/utils/clipboard.js`) wraps `navigator.clipboard.writeText` + toast feedback.

**When to use:** Every copyable value display. Used ~30+ times across all views.

**Example:**
```javascript
// Source: RECON.md — used extensively in planilha, etapa2, etc.
`<div class="copy-row">
  <div class="key">Domínio</div>
  <div class="val font-mono">${escapeHTML(dominio)}.pages.dev</div>
  <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(dominio)}.pages.dev','Domínio copiado!')">📋 Copiar</button>
</div>`
```

### Pattern 5: Post-Render Hook Pattern (Banco + Planilha)

**What:** Views with interactive search/filter controls render a static HTML shell (the VIEWS function). Data is populated AFTER innerHTML injection via a post-render hook (`window.after_{route}`). This separation exists because the data containers (`#banco-list`, `#planilha-body`) don't exist in the DOM until after `#view.innerHTML` is set.

**When to use:** Banco de Empresas (BANC-01, BANC-02) and Planilha (PLAN-01, PLAN-02, PLAN-03). Not needed for views that don't have separate data container elements.

**Example:**
```javascript
// src/views/banco.js
// Source: RECON.md lines 1400-1459
export function initBanco() {
  VIEWS.banco = () => {
    // Static shell: header bar + empty grid container
    return `<div class="space-y-4">
      <div class="glass rounded-3xl p-4 flex flex-wrap items-center gap-4">
        <div class="icon-cube green" style="width:48px;height:48px;font-size:22px">💼</div>
        <div class="flex-1">
          <span class="font-display font-bold">Banco de Empresas</span>
          <span class="text-slate-400 text-sm ml-2">Histórico de CNPJs consultados</span>
        </div>
        <input id="filter-q" class="input" placeholder="Buscar..." oninput="window.after_banco()" style="max-width:300px">
        <select id="filter-faixa" class="input" onchange="window.after_banco()">
          <option value="">Todos</option>
          <option value="ideal">Faixa ideal (R$ 10k–50k)</option>
          <option value="abaixo">Abaixo de R$ 10k</option>
          <option value="acima">Acima de R$ 50k</option>
        </select>
        <button class="btn-3d danger sm" onclick="window.limparBanco()">🗑️ Limpar</button>
      </div>
      <div id="banco-list" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"></div>
    </div>`;
  };

  // Post-render hook — runs AFTER innerHTML injection
  window.after_banco = () => renderBanco();
  window.limparBanco = limparBanco;
  window.usarEmpresaNaEtapa1 = usarEmpresaNaEtapa1;
}

function renderBanco() {
  const db = getDB();
  const q = (document.getElementById('filter-q')?.value || '').toLowerCase();
  const faixa = document.getElementById('filter-faixa')?.value || '';
  let empresas = [...db.empresas].reverse(); // Newest first

  // Text filter
  if (q) empresas = empresas.filter(e =>
    e.razao_social.toLowerCase().includes(q) ||
    onlyDigits(e.cnpj).includes(q)
  );

  // Capital range filter
  if (faixa === 'ideal') empresas = empresas.filter(e => e.capital_social >= 10000 && e.capital_social <= 50000);
  else if (faixa === 'abaixo') empresas = empresas.filter(e => e.capital_social < 10000);
  else if (faixa === 'acima') empresas = empresas.filter(e => e.capital_social > 50000);

  document.getElementById('banco-list').innerHTML = empresas.length
    ? empresas.map(renderCompanyCard).join('')
    : '<div class="empty col-span-full text-center py-12">Sem empresas ainda. <button class="btn-3d ghost sm" onclick="go(\'etapa1\')">Começar →</button></div>';
}
```

### Pattern 6: setInterval Polling with Cleanup (Etapa 2)

**What:** SMS activation code polling using `setInterval` every 5 seconds. The interval ID is stored in `etapa2State.timer` for cleanup. Polling stops on: SMS received (STATUS_OK), timeout (1200s / 20min), cancel, or confirm. The timer display (`#sms-timer`) shows elapsed seconds. This matches RECON.md §5.4 (lines 1066-1082).

**When to use:** Etapa 2 polling (ETP2-03). Any polling scenario in this application.

**Example:**
```javascript
// Source: RECON.md lines 1066-1082
function iniciarPollingSMS() {
  if (etapa2State.timer) clearInterval(etapa2State.timer);
  const start = Date.now();
  etapa2State.timer = setInterval(async () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const timer = document.getElementById('sms-timer');
    if (timer) timer.textContent = `(${elapsed}s)`;

    // Timeout: 20 minutes
    if (elapsed > 1200) { clearInterval(etapa2State.timer); return; }

    try {
      const t = await smsAPI('getStatus', `&id=${etapa2State.activationId}`);
      if (t.startsWith('STATUS_OK:')) {
        etapa2State.code = t.split(':')[1];
        clearInterval(etapa2State.timer);
        go('etapa2'); // Re-render view with code displayed
      }
    } catch(e) { /* ignore polling errors — temporary network issues shouldn't kill polling */ }
  }, 5000);
}
```

**Critical details:**
- Previous timer cleared before starting new one (prevents duplicate intervals)
- Timeout at 1200 seconds (20 minutes) — matches SMS24h activation expiry
- Errors silently swallowed — network hiccup shouldn't terminate polling
- Timer ID stored in mutable state for cleanup by cancel/confirm functions

### Pattern 7: CDN Library Lazy Loading (pdf.js + pdf-lib)

**What:** Heavy CDN libraries (pdf.js ~300KB, pdf-lib ~400KB) are only loaded when the user navigates to Etapa 3. The index.html includes the CDN `<script>` tags (or uses dynamic import for @noble/hashes). The libraries attach themselves to `window` (pdfjsLib, PDFLib). Code checks for library availability before use.

**When to use:** Etapa 3 only (ETP3-01..04). Libraries are not needed for any other view.

**Example:**
```javascript
// In index.html (CDN scripts):
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>

// In src/views/etapa3.js:
async function carregarPDF(file) {
  if (typeof pdfjsLib === 'undefined') {
    toast('❌ pdf.js não foi carregado. Recarregue a página.', '⚠️');
    return;
  }
  // Set worker source (must match major version)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const buf = await file.arrayBuffer();
  pdfState.fileBytes = new Uint8Array(buf);
  pdfState.overlays = [];
  pdfState.pages = [];

  const loadingTask = pdfjsLib.getDocument({ data: pdfState.fileBytes });
  pdfState.pdfDoc = await loadingTask.promise;

  // Render each page as canvas
  const viewer = document.getElementById('pdf-viewer');
  viewer.innerHTML = '';
  for (let i = 1; i <= pdfState.pdfDoc.numPages; i++) {
    const page = await pdfState.pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.4 });
    pdfState.pages.push({ pageNum: i, viewport });

    const wrap = document.createElement('div');
    wrap.className = 'pdf-canvas-wrap';
    wrap.dataset.page = i;

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrap.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Click handler for adding text overlays
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = viewport.width / rect.width;
      const scaleY = viewport.height / rect.height;
      pdfState.overlays.push({
        page: i, x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY,
        text: 'Texto', size: 14, pageWidth: viewport.width, pageHeight: viewport.height
      });
      rerenderOverlays();
    });

    viewer.appendChild(wrap);
  }

  document.getElementById('pdf-toolbar').classList.remove('hidden');
  toast(`PDF carregado! ${pdfState.pdfDoc.numPages} página(s)`, '✅');
}
```

### Pattern 8: Config View Pattern (Conf)

**What:** A form-based settings view with pre-filled inputs from `getSettings()`, save buttons that update individual settings fields via `saveSettings()`, and API test buttons that validate credentials. The Cloudflare token flow includes account auto-detection (single/multi-account handling). This matches RECON.md §1.8 + §5.8.

**When to use:** Config view (CONF-01, CONF-02, CONF-03).

**Key sub-patterns:**
- **Save-on-edit:** SMS key saved immediately on button click → `saveSettings(s)` → `refreshHeaderStatus()` → toast
- **Token + account detection:** Cloudflare token saved → fetch `/accounts` → auto-select single account OR show multi-account picker
- **Test buttons:** `testarCloudflare()` fetches `/pages/projects` to verify token validity; `testarSMS()` calls `smsAPI('getBalance')`
- **Backup:** `exportBackup()` serializes `{db, settings, exportedAt}` as JSON download; `importBackup()` reads file → `JSON.parse` → `saveDB` + `saveSettings` → navigate
- **Password inputs:** `<input type="password">` with pre-filled values from settings
- **Expandable instructions:** `<details>` elements for "How to create a token" guides

### Pattern 9: Static Content View (Ajuda)

**What:** A pure template view with no state dependencies, no event handlers, and no data reads. Uses the `ajuda(ico, title, body)` helper function to render 3 glass cards with ordered/unordered lists. This matches RECON.md §1.9 + §5.8 (lines 1742-1786).

**When to use:** Ajuda view (AJUD-01). Any purely informational view.

```javascript
// Source: RECON.md lines 1781-1786
function ajuda(ico, title, body) {
  return `<div class="glass rounded-2xl p-5 flex gap-4">
    <div class="icon-cube" style="width:52px;height:52px;font-size:24px;flex-shrink:0">${ico}</div>
    <div>
      <div class="font-display font-bold text-lg">${title}</div>
      <div class="text-slate-300 mt-1">${body}</div>
    </div>
  </div>`;
}
```

### Anti-Patterns to Avoid

- **Direct localStorage access from views:** Always use `getDB()`/`saveDB()`/`getSettings()`/`saveSettings()` from `src/stores/data.js`. Direct `localStorage.getItem('lab_bms_db_v1')` bypasses error handling, schema defaults, and header status refresh.
- **addEventListener in view render functions:** Event handlers go in inline `onclick`/`onchange`/`oninput` attributes in the returned HTML string. This avoids needing to detach listeners when the view is re-rendered (innerHTML replacement destroys old DOM).
- **Storing sensitive data in template literals:** API keys and tokens should NEVER be hardcoded in templates. The original's `autoConectarTokens()` hardcodes credentials — the clone reads from user-provided `getSettings()`.
- **Mutating state without re-rendering:** After changing `etapa1State`, always call `go('etapa1')` to trigger view re-render. The VIEWS function reads current state each time it's called — stale DOM won't update otherwise.
- **Forgetting cascade reset:** When clearing a step field, ALL downstream fields must be cleared. Failing to do this creates impossible state (e.g., `htmlGerado` exists but `dominio` is empty).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF rendering | Custom canvas drawing from raw PDF binary | pdf.js 3.11.174 (CDN) | PDF spec is 1000+ pages; pdf.js handles font embedding, compression, image decoding. Custom implementation would be months of work. |
| PDF manipulation/writing | Custom PDF binary writer | pdf-lib 1.17.1 (CDN) | PDF binary format is complex (cross-reference tables, compressed streams, font subsetting). pdf-lib handles all of this. |
| BLAKE3 hashing | Custom BLAKE3 implementation | @noble/hashes (dynamic import from esm.sh) | Cryptographic hash algorithms are complex and error-prone. Cloudflare Pages requires exact BLAKE3 output. |
| CSV generation | Manual string concatenation with edge-by-edge quoting | Template literal with helper function | Simple enough to build; but must include UTF-8 BOM for Excel. The exportCSV() function is ~15 lines — not worth a library. |
| CNPJ validation | Custom Brazilian CNPJ validator | `onlyDigits()` + length check (14 digits) | Original only checks digit count, not check digits. Full DV validation would be over-engineering for this use case. |
| Template engine | Handlebars/Mustache/EJS | JavaScript template literals (`` `...` ``) | Template literals are native, zero-dependency, and sufficient for all 8 views. Adding a library violates CDN-only constraint and adds 30KB+. |
| State management | Redux/MobX/Zustand | Module-level `let` objects (etapa1State, etc.) | 3 state objects with ~5 fields each. A state management library would be 10x the code of the state it manages. |

**Key insight:** The original system runs ~2135 lines of vanilla JS with zero npm dependencies and only 3 CDN libraries (2 of which are lazy-loaded). This is a mature, battle-tested architecture. Adding libraries or frameworks would increase complexity without proportional benefit. The constraint "stack do original" (PROJECT.md) is not just a preference — it's the reason the system is maintainable at this scale.

## Runtime State Inventory

> Phase 03 is a greenfield view implementation phase (not a rename/refactor/migration phase). The Runtime State Inventory is not applicable.

**Nothing found in any category:** The phase builds new view modules that populate existing infrastructure (router, stores, widgets) created in Phase 02. No existing state, config, registrations, secrets, or artifacts need to be modified.

## Common Pitfalls

### Pitfall 1: CORS Errors During Local Development
**What goes wrong:** Cloudflare API and SMS24h API calls fail with CORS errors when running on `http://localhost` without the Netlify proxy. The Phase 02 proxy (`instalarProxy()`) only activates when NOT on `file://` protocol — but it rewrites URLs to `/cf-api/` and `/sms-api/` paths that only work behind a Netlify `_redirects` proxy.

**Why it happens:** `instalarProxy()` monkey-patches `window.fetch` to replace upstream URLs with same-origin paths. Without Netlify's `_redirects` (or a local dev server proxy), these paths 404.

**How to avoid:** Two options:
1. **Local dev server with proxy:** Use Vite/CRA proxy or a simple Node proxy to forward `/cf-api/*` → `https://api.cloudflare.com/*` and `/sms-api/*` → `https://api.sms24h.org/*`
2. **Mock layer:** The Phase 02 mock infrastructure (`instalarProxy` + `apiMocks`) returns mock responses for development. This is the RECOMMENDED approach for implementing and testing views without real API keys.

**Warning signs:** Console shows `fetch` to `/cf-api/client/v4/...` returning 404 or CORS errors. Header status pills show ⚠️ (danger) despite valid tokens.

### Pitfall 2: pdf.js Worker Path Mismatch
**What goes wrong:** pdf.js renders a blank canvas or throws `Error: Setting up fake worker failed`.

**Why it happens:** The pdf.js library (pdf.min.js) must be paired with a matching worker file (pdf.worker.min.js). If versions don't match or the workerSrc is wrong, pdf.js silently fails.

**How to avoid:** Always pin BOTH library and worker to the exact same version:
```javascript
// Correct — both 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
```
Never use the default worker path (which points to a different CDN or version).

**Warning signs:** Canvas element exists but is blank. Console shows `Warning: Setting up fake worker.` or `Deprecated API usage`.

### Pitfall 3: pdf-lib Y-Coordinate Flip
**What goes wrong:** Text overlays appear at wrong positions in the downloaded PDF — vertically mirrored or offset.

**Why it happens:** pdf.js canvas uses a top-left origin (Y increases downward). pdf-lib (and PDF spec) uses bottom-left origin (Y increases upward). Directly using canvas coordinates in pdf-lib will flip the Y axis.

**How to avoid:** Convert Y coordinate when merging overlays:
```javascript
// Source: RECON.md lines 1291-1311
// Y flip: pageHeight - (y * scale) - (size * scale * 0.8)
const yPdf = overlay.pageHeight - (overlay.y * scale) - (overlay.size * scale * 0.8);
page.drawText(overlay.text, {
  x: overlay.x * scale,
  y: yPdf,
  size: overlay.size * scale,
  font: helveticaFont,  // Standard font — no embedding needed
  color: PDFLib.rgb(0, 0, 0)
});
```

**Warning signs:** Text appears at the bottom when it should be at the top, or text is outside the page boundaries.

### Pitfall 4: setInterval Memory Leak (SMS Polling)
**What goes wrong:** Multiple polling intervals accumulate, causing duplicate API calls and memory leaks. The `#sms-timer` displays wildly incorrect elapsed time.

**Why it happens:** Calling `iniciarPollingSMS()` without first clearing the existing interval, or navigating away from Etapa 2 without cleaning up the timer.

**How to avoid:**
1. Always `clearInterval(etapa2State.timer)` before starting a new one
2. Clear interval on ALL exit paths: SMS received, timeout, cancel, confirm
3. Consider clearing in a cleanup hook (though the original does not do this — navigation via `go()` replaces the DOM and the interval continues in the background until timeout)

**Warning signs:** Multiple API calls per 5-second interval. Console shows accumulating `getStatus` requests.

### Pitfall 5: Template Literal XSS
**What goes wrong:** User-provided data injected into HTML via template literals without escaping creates XSS vectors. Even though this is a single-user localStorage app, it's bad practice.

**Why it happens:** Company names, CNPJ data, domain names, and meta tags can contain special characters. Template literals like `${empresa.razao_social}` inject raw values.

**How to avoid:** Use `escapeHTML()` (from Phase 02 `src/utils/string.js`) on ALL user-provided data before template interpolation:
```javascript
`<div class="font-bold">${escapeHTML(empresa.razao_social)}</div>`
```
This escapes `&`, `<`, `>`, `"`, `'` — the same 5 entities the original escapes.

**Warning signs:** HTML special characters in company names break the layout. `<script>` tags in meta-tag content execute when the view renders.

### Pitfall 6: Cloudflare Deploy Auth Switching
**What goes wrong:** Step 4 (Upload Asset) fails with 401/403 errors even though Step 1 (Create Project) succeeded.

**Why it happens:** The Cloudflare Pages API uses TWO different authentication mechanisms:
- Steps 1, 2, 5: `Authorization: Bearer {cf_token}` (API token)
- Steps 3 (hash), 4 (upload): `Authorization: Bearer {jwt}` (JWT from Step 2 response)

Using the API token for the upload step will fail.

**How to avoid:** Track which auth mechanism each step requires. The JWT from Step 2's response replaces the API token for Steps 3-4. Then switch back to the API token for Step 5 (deployment uses FormData with API token auth).

**Warning signs:** Step 4 fails with "Authentication error" but Step 1 worked. Console shows 401/403 responses from upload endpoints.

## Code Examples

Verified patterns from official sources:

### Fetch with Error Handling (BrasilAPI)
```javascript
// Source: MDN Fetch API docs [CITED: developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch]
// Matches RECON.md lines 485-503 pattern
async function e1Buscar() {
  const input = document.getElementById('e1_cnpj');
  const cnpj = onlyDigits(input.value);
  if (cnpj.length !== 14) { toast('CNPJ precisa ter 14 números', '⚠️'); return; }

  const box = document.getElementById('e1_result');
  box.innerHTML = '<div class="spinner"></div>';

  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!r.ok) throw new Error('Não encontrado');
    const d = await r.json();
    const e = normalizarBrasilAPI(d);
    salvarEmpresa(e);
    etapa1State.empresa = e;
    toast('Empresa carregada!', '✅');
    go('etapa1');
  } catch(err) {
    box.innerHTML = `<div class="glass rounded-2xl p-4 text-center text-rose-300">
      😕 Não consegui encontrar este CNPJ. Verifique ou cadastre manualmente.
    </div>`;
  }
}
```

### CSV Export with UTF-8 BOM
```javascript
// Source: RECON.md lines 1542-1552
// UTF-8 BOM (\uFEFF) required for Excel to detect UTF-8 encoding
function exportCSV() {
  const sites = getDB().sites;
  const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel
  const headers = ['Empresa', 'Razao Social', 'CNPJ', 'Dominio', 'URL', 'Tel empresa', 'Nosso tel', 'Meta-tag', 'Status', 'Atualizado'];
  const sep = ';'; // Semicolon for Brazilian Excel (comma is decimal separator in pt-BR)

  let csv = BOM + headers.join(sep) + '\n';
  for (const s of sites) {
    const row = [
      s.fantasia || '', s.razao || '', fmtCNPJ(s.cnpj), s.dominio || '', s.url || '',
      s.telefoneEmpresa || '', s.telefoneNosso || '', s.metatag || '', s.status || '', fmtDate(s.atualizado)
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep);
    csv += row + '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'planilha-laboratorio.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV exportado!', '📊');
}
```

### Cloudflare Pages 5-Step Deploy Pipeline
```javascript
// Source: RECON.md lines 807-905 (§2.2)
// 5-step pipeline: create → JWT → hash → upload → deploy
async function e1Publicar() {
  const s = getSettings();
  if (!s.cf_token || !s.cf_account) {
    document.getElementById('publish-log').innerHTML = '<div class="text-amber-300">⚠️ Configure o token Cloudflare nas Configurações antes de publicar.</div>';
    return;
  }

  const projectName = etapa1State.dominio;
  const log = document.getElementById('publish-log');
  const btn = document.getElementById('btn-publish');
  btn.disabled = true;
  btn.textContent = '⏳ Publicando...';

  try {
    const headers = { 'Authorization': `Bearer ${s.cf_token}`, 'Content-Type': 'application/json' };
    const base = `https://api.cloudflare.com/client/v4/accounts/${s.cf_account}/pages`;

    // Step 1: Create project (idempotent)
    log.innerHTML = '📦 Criando projeto...';
    const r1 = await fetch(`${base}/projects`, { method: 'POST', headers, body: JSON.stringify({ name: projectName, production_branch: 'main' }) });
    const d1 = await r1.json();
    if (!d1.success && !d1.errors.some(e => e.code === 8000007 || e.code === 8000031 || (e.message || '').toLowerCase().includes('exists'))) {
      throw new Error('CRIAR: ' + JSON.stringify(d1.errors || d1));
    }

    // Step 2: Get JWT upload token
    log.innerHTML = '🔑 Obtendo token de upload...';
    const r2 = await fetch(`${base}/projects/${projectName}/upload-token`, { headers });
    const d2 = await r2.json();
    if (!d2.success) throw new Error('JWT: ' + JSON.stringify(d2));
    const jwt = d2.result.jwt;

    // Step 3: BLAKE3 hash (local computation)
    log.innerHTML = '🔐 Calculando hash...';
    const { blake3 } = await import('https://esm.sh/@noble/hashes@2.2.0/blake3');
    const html = etapa1State.htmlGerado;
    const b64 = btoa(unescape(encodeURIComponent(html)));
    const toHash = new TextEncoder().encode(b64 + 'html');
    const hashBytes = blake3(toHash);
    const hex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const fileHash = hex.slice(0, 32);

    // Step 4: Upload asset (uses JWT auth, NOT API token)
    log.innerHTML = '📤 Enviando arquivos...';
    const uploadHeaders = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };
    const r4 = await fetch(`https://api.cloudflare.com/client/v4/pages/assets/upload`, {
      method: 'POST', headers: uploadHeaders,
      body: JSON.stringify([{ key: fileHash, value: b64, base64: true, metadata: { contentType: 'text/html' } }])
    });
    const upRes = await r4.json();
    if (!upRes.success) throw new Error('UPLOAD: ' + JSON.stringify(upRes));

    // Step 5: Create deployment (uses API token auth, FormData)
    log.innerHTML = '🚀 Criando deploy...';
    const fd = new FormData();
    fd.append('manifest', JSON.stringify({ '/index.html': fileHash }));
    const r5 = await fetch(`${base}/projects/${projectName}/deployments`, { method: 'POST', headers: { 'Authorization': `Bearer ${s.cf_token}` }, body: fd });
    const depJson = await r5.json();
    if (!depJson.success) throw new Error('DEPLOY: ' + JSON.stringify(depJson));

    // Success
    const url = depJson.result.url || `https://${projectName}.pages.dev`;
    etapa1State.publicado = { url, projectName, deploymentId: depJson.result.id };
    // Update site in DB
    const db = getDB();
    const site = db.sites.find(site => site.dominio === projectName);
    if (site) { site.url = url; site.deploymentId = depJson.result.id; site.status = 'deploy'; site.atualizado = Date.now(); saveDB(db); }
    toast('🎉 Site publicado!', '🚀');
    setTimeout(() => go('etapa1'), 800);

  } catch (e) {
    log.innerHTML = `<div class="text-rose-300">❌ ${escapeHTML(e.message)}</div>
      <div class="text-slate-400 text-xs mt-2">💡 Dica: verifique se o token tem permissão Pages:Edit</div>`;
    btn.disabled = false;
    btn.textContent = '🚀 Tentar novamente';
  }
}
```

### Domain Suggestion Algorithms
```javascript
// Source: RECON.md lines 563-596
// 7 algorithms, produces max 6 unique slugs, each 4-32 chars
function gerarSugestoesDominio(nome) {
  const slug = slugify(nome);
  const sugs = new Set();

  // Algorithm 1: Base + double last letter
  const last = slug.slice(-1);
  if (last) sugs.add((slug + last).slice(0, 32));

  // Algorithm 2: Truncate + add 's'
  sugs.add((slug.slice(0, 10) + 's').slice(0, 32));

  // Algorithm 3: Vowel swap (first vowel doubled)
  const vowels = slug.match(/[aeiou]/);
  if (vowels) sugs.add(slug.replace(vowels[0], vowels[0] + vowels[0]).slice(0, 32));

  // Algorithm 4: Add '01' or 'oficial' suffix
  sugs.add((slug + '01').slice(0, 32));
  sugs.add((slug + 'oficial').slice(0, 32));

  // Algorithm 5: First-letters sigla + base
  const words = nome.toLowerCase().split(/\s+/);
  const sigla = words.map(w => w[0] || '').join('').slice(0, 4);
  if (sigla.length >= 2) sugs.add((sigla + slug).slice(0, 32));

  // Algorithm 6: Reorder — last 4 chars + remainder
  if (slug.length >= 6) {
    sugs.add((slug.slice(-4) + slug.slice(0, -4)).slice(0, 32));
  }

  // Algorithm 7: Half + first 2 chars duplicated
  const half = Math.floor(slug.length / 2);
  const prefix = slug.slice(0, Math.max(2, half));
  sugs.add((prefix + prefix.slice(0, 2)).slice(0, 32));

  // Filter: min 4 chars, remove base slug duplicate, limit 6
  return [...sugs].filter(s => s.length >= 4 && s !== slug).slice(0, 6);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf.js v3.11.174 (2023) | pdf.js v6.0.227 (2026) | 2025-2026 | v6 may have API changes. Pinning 3.11.174 guarantees identical rendering. Upgrade after VAL-01 pass. |
| pdf-lib 1.17.1 (2022) | pdf-lib 1.17.1 (unchanged) | — | Stable since 2022. No upgrades needed. |
| `unescape()` + `encodeURIComponent()` for base64 | `TextEncoder` + standard base64 | ECMAScript 2015+ | `unescape()` is deprecated but still works. Keep for original compatibility; replace in v2 rebrand. |
| inline `<script>` single file (~2135 lines) | ES modules in `src/views/` (8 files) | Phase 02 | Better organization without changing runtime behavior. Module imports replace global function references. |

**Deprecated/outdated:**
- `unescape()`: Used in BLAKE3 hash computation (`btoa(unescape(encodeURIComponent(html)))`). Deprecated since ES3 but still functional. The correct modern approach is `TextEncoder` → base64, but this changes the hash output. Keep for v1 compatibility; document for v2.
- Hardcoded API credentials: The original's `autoConectarTokens()` seeds real credentials. The clone reads from empty `getSettings()` defaults — user provides their own via Config view. This is a security improvement documented in Phase 02.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 7 domain suggestion algorithms can be replicated exactly from RECON.md pseudocode | Domain Suggestion Algorithms | Low — RECON.md lines 563-596 document each algorithm's logic precisely. Edge case: the original may produce different slugs for certain Portuguese accents due to browser-specific NFD normalization. |
| A2 | Cloudflare Pages API endpoints and auth mechanisms remain unchanged | Cloudflare Pages 5-Step Pipeline | Medium — Cloudflare could change API endpoints or deprecate the v4 API. The original was last confirmed working on the extraction date. Test with real tokens before considering VAL-01 complete. |
| A3 | SMS24h API returns colon-delimited plain text (not JSON) as documented | SMS Polling Patterns | Low — SMS24h.org is a stable service with documented text-based API. The smsAPI wrapper already handles text responses. |
| A4 | pdf-lib StandardFonts.Helvetica is available without embedding external font files | pdf-lib Integration | Low — pdf-lib ships 14 Standard PDF fonts (including Helvetica). Confirmed via pdf-lib documentation. The original uses `PDFLib.StandardFonts.Helvetica` without font embedding. |
| A5 | BLAKE3 hash computation via `@noble/hashes` produces identical output to the original | Cloudflare Pages 5-Step Pipeline | Medium — The hash depends on the exact byte sequence: `blake3(base64(html_content) + "html").hex.slice(0, 32)`. Any difference in encoding (UTF-8 vs Latin-1, newline normalization) changes the hash. Pin library version to 2.2.0. |
| A6 | BrasilAPI endpoint and response schema are stable | §API Integration Patterns | Low — BrasilAPI is a well-maintained public API with versioning (`/api/cnpj/v1/`). The normalization function handles field name changes via mapping. |

## Open Questions

1. **CDN library loading strategy for pdf.js/pdf-lib**
   - What we know: The original loads pdf.js and pdf-lib via `<script>` tags in the HTML. pdf.js worker is set via `GlobalWorkerOptions.workerSrc`. @noble/hashes is loaded via dynamic `import()`.
   - What's unclear: Whether to load libraries eagerly in index.html (matching original) or lazily when Etapa 3 is first navigated to (better initial load performance).
   - Recommendation: Load eagerly in index.html with `<script>` tags matching the original. The libraries are ~700KB combined but are cached after first load. This is simpler and matches the original exactly, which is the v1 priority.

2. **Mock data strategy during view development**
   - What we know: Phase 02 includes `instalarProxy()` for URL rewriting and `apiMocks` for mock responses. The views need realistic data to test rendering.
   - What's unclear: Whether to extend the mock layer with preset CNPJ data, SMS responses, and Cloudflare deploy mocks, or to develop against real APIs.
   - Recommendation: Extend the mock layer minimally — seed `localStorage` with 2-3 sample empresas and sites for development. Real API testing should use the Config view to input actual tokens. The mock layer should simulate all API response formats (success + error) but not all edge cases.

3. **Validation strategy for buildSiteHTML output**
   - What we know: buildSiteHTML generates ~20KB of standalone HTML. The output must include specific sections (header, hero, stats, about, contact, footer) with responsive CSS and injected company data.
   - What's unclear: How to validate the template output programmatically (regex assertions vs visual comparison).
   - Recommendation: Write a snapshot test that generates HTML with a known `dados` object and asserts key sections exist (hero title contains company name, footer includes CNPJ, stats count matches data). Visual validation is manual via `e1Preview()` (opens in new tab).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (for local server) | ES module loading (requires HTTP, not file://) | ✓ | v22.x | python3 -m http.server 3000 |
| pdf.js CDN (cdnjs) | Etapa 3 PDF rendering | ✓ | 3.11.174 | Bundle locally if CDN unavailable |
| pdf-lib CDN (jsdelivr) | Etapa 3 PDF download | ✓ | 1.17.1 | Bundle locally |
| @noble/hashes CDN (esm.sh) | Cloudflare deploy BLAKE3 hash | ✓ | 2.2.0 | Bundle locally or fallback to mock |
| BrasilAPI (internet) | CNPJ lookup | ✓ (public API) | v1 | Mock layer for offline dev |
| Cloudflare Pages API | Site deployment | Requires API token | v4 | Mock layer for offline dev |
| SMS24h API | SMS purchase | Requires API key | — | Mock layer for offline dev |

**Missing dependencies with no fallback:** None — all external APIs have mock layer fallbacks (Phase 02 proxy + mock infrastructure). The CDN libraries can be bundled locally if internet is unavailable.

**Missing dependencies with fallback:**
- Cloudflare API token: Required for deploy. Mock layer provides simulated responses for development.
- SMS24h API key: Required for SMS purchase. Mock layer provides simulated responses for development.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Phase 02 used manual verification (UAT) |
| Config file | none — Wave 0 |
| Quick run command | `npx serve . -p 3000` (manual) |
| Full suite command | Manual visual verification against original |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Stat cards show correct counts from localStorage | integration | Manual: navigate to dashboard, verify 4 KPI values | ❌ Wave 0 |
| ETP1-01 | CNPJ lookup returns company data and renders display card | integration | Manual: enter valid CNPJ, verify card renders | ❌ Wave 0 |
| ETP1-02 | Wizard steps unlock progressively | integration | Manual: complete each step, verify next unlocks | ❌ Wave 0 |
| ETP1-03 | Domain suggestions generate max 6 unique slugs | unit | `node -e "gerarSugestoesDominio('Test Company')"` | ❌ Wave 0 |
| ETP1-04 | buildSiteHTML outputs complete HTML document | unit | `node -e "buildSiteHTML(mockDados)"` — verify string contains `<html>`, `<head>`, `<body>` | ❌ Wave 0 |
| ETP2-03 | SMS polling starts/stops correctly | integration | Manual: purchase number, verify timer updates, cancel, verify cleanup | ❌ Wave 0 |
| ETP3-01 | PDF renders all pages as canvas elements | integration | Manual: upload test PDF, verify canvas count matches page count | ❌ Wave 0 |
| ETP3-04 | Address regex extracts 7 fields from Brazilian address text | unit | `node -e "extrairCamposEndereco(addressText)"` | ❌ Wave 0 |
| PLAN-04 | CSV export produces valid UTF-8 BOM + semicolon-delimited file | unit | Manual: export CSV, open in Excel, verify encoding | ❌ Wave 0 |
| CONF-03 | Backup/restore round-trips correctly | integration | Manual: add data → export → clear → import → verify data restored | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Visual check in browser on modified view(s)
- **Per wave merge:** Full manual smoke test across all implemented views
- **Phase gate:** Side-by-side comparison with original (precursor to VAL-01)

### Wave 0 Gaps
- [ ] `tests/test_domain_suggestions.js` — covers ETP1-03 (7 algorithms, edge cases)
- [ ] `tests/test_build_site_html.js` — covers ETP1-04 (template output sections)
- [ ] `tests/test_address_regex.js` — covers ETP3-04 (7 field extraction patterns)
- [ ] `tests/test_csv_export.js` — covers PLAN-04 (UTF-8 BOM, quoting, columns)
- [ ] Framework install: `npm install -D` — none detected, using manual verification
- [ ] `tests/conftest.js` — shared fixtures (mock dados object, mock empresa, mock sites)

## Security Domain

> security_enforcement is enabled in .planning/config.json (workflow.security_enforcement: true, ASVS Level 1)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user authentication — single-user localStorage app |
| V3 Session Management | No | No server-side sessions — state is in localStorage + module-level `let` |
| V4 Access Control | No | No role-based access — all views accessible to single user |
| V5 Input Validation | Yes | `escapeHTML()` for XSS prevention; `onlyDigits()` for CNPJ validation before API calls; length checks on domain/CNPJ; CNPJ 14-digit gate before fetch |
| V6 Cryptography | No | No custom cryptography — BLAKE3 hashing via @noble/hashes (well-audited library) used only for Cloudflare API requirement, not for security |
| V7 Error Handling | Yes | All API calls wrapped in try/catch; generic error messages shown to user (no stack traces in DOM). SMS polling errors silently swallowed. Cloudflare deploy errors shown with recovery button. |
| V8 Data Protection | Yes | localStorage stores all data client-side. API tokens stored in localStorage (acceptable for single-user local app). No PII transmitted to third parties except intentional API calls (BrasilAPI CNPJ lookup, Cloudflare deploy). |
| V9 Communication | Yes | All external API calls use HTTPS. Cloudflare and SMS24h calls proxied through Netlify for CORS compliance. BrasilAPI called directly (CORS-enabled). |
| V10 Malicious Code | Yes | Only CDN scripts from official distribution channels (cdnjs, jsdelivr, esm.sh). No eval(), no new Function(), no innerHTML with unsanitized data without escapeHTML(). All onclick handlers use pre-defined global functions, not inline code strings. |
| V11 Business Logic | Yes | CNPJ validation before API calls (14-digit check). Domain length validation (min 4 chars). Cascade reset prevents inconsistent wizard state. SMS polling has 20-minute timeout. Cloudflare deploy has proper auth switching. |
| V12 Files & Resources | Yes | PDF file upload validated for type (accept="application/pdf"). PDF file size is browser-limited (no explicit cap). CSV export uses proper MIME type. Backup import validates JSON before applying. |

### Known Threat Patterns for Vanilla JS SPA + External APIs

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via template literal injection | Tampering | `escapeHTML()` on all user-provided data before interpolation; 5 entities escaped (& < > " ') |
| API token exposure in localStorage | Information Disclosure | Single-user app — acceptable risk. Tokens never sent to third parties except their intended API endpoints. Document token scoping requirements (Cloudflare: Pages:Edit + Account:Read). |
| CSRF via malicious site calling Cloudflare API with stored token | Spoofing | Cloudflare API calls use `Authorization: Bearer` header, not cookies. CSRF attacks require cookie-based auth. Not applicable. |
| SMS24h API key in query string visible in network logs | Information Disclosure | All requests use HTTPS — query strings are encrypted in transit. The proxy layer rewrites URLs, keeping the key in the query string but routing through same-origin paths on Netlify. |
| PDF file with embedded malicious JavaScript | Elevation of Privilege | pdf.js disables PDF JavaScript by default. The viewer only renders pages — no script execution. Content extraction via getTextContent() is text-only. |
| Large PDF causing browser OOM | Denial of Service | pdf.js renders pages one at a time (each page rendered independently). Browser canvas memory is per-page. Very large PDFs may still consume significant memory but won't crash due to incremental rendering. |

## Sources

### Primary (HIGH confidence)
- [RECON.md] — Complete original system specification (4400 lines). All function signatures, API contracts, state schemas, and view structures confirmed via source code analysis. Used for: every view structure, every function implementation, every API endpoint.
- [MDN: Fetch API] — developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch. Confirmed fetch() error handling pattern (try/catch + response.ok check). Last modified: 2025-08-20.
- [MDN: setInterval] — developer.mozilla.org/en-US/docs/Web/API/Window/setInterval. Confirmed clearInterval cleanup, timer ID management, delay restrictions. Last modified: 2026-03-30.
- [MDN: Blob] — developer.mozilla.org/en-US/docs/Web/API/Blob. Confirmed Blob constructor, URL.createObjectURL/download pattern. Last modified: 2025-11-07.

### Secondary (MEDIUM confidence)
- [pdf.js Getting Started] — mozilla.github.io/pdf.js/getting_started/. Confirmed CDN distribution channels, workerSrc configuration, file layout. Official Mozilla documentation.
- [pdf-lib GitHub README] — github.com/Hopding/pdf-lib. Confirmed CDN usage, PDFDocument API, drawText, Y-coordinate system. Official project documentation.
- [npm registry] — Confirmed package versions: pdfjs-dist (6.0.227), pdf-lib (1.17.1), @noble/hashes (2.2.0). Verified via `npm view`.

### Tertiary (LOW confidence)
- [WebSearch] — General queries for fetch error handling, polling patterns, CSV export, template literal patterns. All patterns confirmed against RECON.md and MDN authoritative sources. Used for secondary validation only.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries confirmed via npm registry + official documentation. CDN versions pinned to original values from RECON.md.
- Architecture: HIGH — Every pattern confirmed via RECON.md source analysis. Original system structure is fully understood and documented.
- Pitfalls: HIGH — Pitfalls derived from RECON.md edge cases + standard web API gotchas confirmed via MDN.

**Research date:** 2026-06-27
**Valid until:** 2026-07-27 (30 days — stable domain, phased implementation)
