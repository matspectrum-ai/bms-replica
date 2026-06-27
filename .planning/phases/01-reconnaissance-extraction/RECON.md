# RECON.md: Laboratório de BMs — Especificação de Engenharia Reversa

**Target URL:** `https://laboratoriodebms.netlify.app/`
**Extraction Date:** 2026-06-27
**Tooling:** `webfetch` (HTML source capture), Chrome DevTools (manual analysis planned)
**Confidence Level:** HIGH (source code captured and analyzed in full)
**Raw Source:** `data/raw-source.html` (118,388 bytes — full inline HTML+JS+CSS)

---

## Stack Confirmation

| Attribute | Value | Detection Method |
|-----------|-------|-----------------|
| **Framework** | **Vanilla JavaScript** (no React, Vue, Angular) | Source inspection: no `__REACT_`, `__vue__`, `ng-` attributes found |
| **JS Bundle** | Single inline `<script>` block (~2135 lines) | Source inspection: one large `<script>` tag in `<head>` — no external JS files |
| **CSS** | Single inline `<style>` block + Tailwind CDN | Source inspection: one `<style>` tag + `<script src="cdn.tailwindcss.com">` |
| **HTML** | Static `index.html` shell (sidebar, header, modal, toast) + dynamic view injection via `innerHTML` | Source inspection: `<body>` contains static shell, `<section id="view">` is empty |
| **Routing** | Hash-free SPA router via `go(route)` + `VIEWS[route]()` + `innerHTML` swap | Source analysis: `go()` function, `ROUTES` array, `VIEWS` object |
| **State** | `localStorage` (2 keys) + 3 module-level `let` state objects | Source analysis: `STORAGE_KEY`, `SETTINGS_KEY`, `etapa1State`, `etapa2State`, `pdfState` |

### CDN Libraries Detected

| Library | CDN URL | Version | Pinned? |
|---------|---------|---------|---------|
| Tailwind CSS | `https://cdn.tailwindcss.com` | v3 (CDN latest) | ❌ Unpinned |
| pdf.js | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` | 3.11.174 | ✅ Pinned |
| pdf-lib | `https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js` | latest | ❌ Unpinned |
| noble-hashes (BLAKE3) | `https://esm.sh/@noble/hashes/blake3` | latest | ❌ Unpinned (dynamic `import()`) |
| Google Fonts: Inter | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800` | — | ✅ Weights pinned |
| Google Fonts: Sora | `https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800` | — | ✅ Weights pinned |

---

## 1. localStorage & State Schema

### 1.1 Chave: `lab_bms_db_v1`

**Storage Key:** `lab_bms_db_v1` (constant `STORAGE_KEY`)
**Accessors:** `getDB()` (read), `saveDB(db)` (write)
**Default Value:**
```json
{ "empresas": [], "sites": [], "sms": [] }
```

#### db.empresas[]

Array of company objects. Each entry represents a CNPJ that has been looked up (via BrasilAPI) or manually registered.

| Campo | Tipo | Obrigatório | Condicional? | Criado Por |
|-------|------|-------------|-------------|------------|
| cnpj | string (##.###.###/####-##) | Sim | Não | `salvarEmpresa()` → `normalizarBrasilAPI()` or `e1ManualSalvar()` |
| razao_social | string | Sim | Não | BrasilAPI response / manual entry |
| fantasia | string | Sim | Não | BrasilAPI `nome_fantasia` or fallback to `razao_social` |
| capital_social | number \| null | Não | Não | BrasilAPI `capital_social` |
| porte | string | Não | Não | BrasilAPI `porte` or `descricao_porte` |
| situacao | string | Não | Não | BrasilAPI `descricao_situacao_cadastral` |
| inicio | string (date) | Não | Não | BrasilAPI `data_inicio_atividade` |
| natureza | string | Não | Não | BrasilAPI `natureza_juridica` |
| cnae_principal | string | Não | Não | BrasilAPI `cnae_fiscal` |
| cnae_descricao | string | Não | Não | BrasilAPI `cnae_fiscal_descricao` |
| cnaes_secundarios | array | Não | Não | BrasilAPI `cnaes_secundarios[]` |
| logradouro | string | Não | Não | BrasilAPI: composite of `descricao_tipo_de_logradouro` + `logradouro` + `numero` |
| complemento | string | Não | Não | BrasilAPI `complemento` |
| bairro | string | Não | Não | BrasilAPI `bairro` |
| municipio | string | Não | Não | BrasilAPI `municipio` |
| uf | string (2-letter) | Não | Não | BrasilAPI `uf` |
| cep | string | Não | Não | BrasilAPI `cep` |
| telefone | string | Não | Não | BrasilAPI: composite of `ddd_telefone_1` / `ddd_telefone_2` |
| email | string | Não | Não | BrasilAPI `email` |
| socios | array of {nome, qualif} | Não | Não | BrasilAPI `qsa[]` |
| raw | object | Não | **SIM — condicional** | `normalizarBrasilAPI()` — contains FULL BrasilAPI response |
| _created | number (epoch ms) | Não | Não | `salvarEmpresa()` on first insert |
| _updated | number (epoch ms) | Não | Não | `salvarEmpresa()` on every update |

#### db.sites[]

Array of site objects. Each entry represents a generated site (Etapa 1 output).

| Campo | Tipo | Obrigatório | Condicional? | Criado Por |
|-------|------|-------------|-------------|------------|
| cnpj | string | Sim | Não | `registrarSite()` → from empresa data |
| razao | string | Sim | Não | `registrarSite()` |
| fantasia | string | Sim | Não | `registrarSite()` |
| dominio | string | Sim | Não | `registrarSite()` → `{slug}.pages.dev` |
| metatag | string | Não | Não | `registrarSite()` → from Etapa 1 step 3 |
| telefoneEmpresa | string | Não | Não | `registrarSite()` → from empresa |
| telefoneNosso | string | Não | Não | `registrarSite()` → initially empty, filled by Etapa 2 |
| status | string | Sim | Não | `registrarSite()` → `"gerado"` initial; updated to `"deploy"` after publish |
| url | string | Não | **SIM — condicional** | `e1Publicar()` success → Cloudflare Pages URL |
| deploymentId | string | Não | **SIM — condicional** | `e1Publicar()` success → Cloudflare deployment ID |
| dadosSnapshot | object | Não | Não | `registrarSite()` → full `dados` object snapshot |
| criado | number (epoch ms) | Não | Não | `registrarSite()` |
| atualizado | number (epoch ms) | Não | Não | `registrarSite()` + updated on publish |

**Note on status field:** Possible values observed: `"gerado"` (site HTML generated but not deployed), `"deploy"` (published to Cloudflare). The original FEATURES.md referenced `"criado"`, `"no_ar"`, `"finalizado"` but the actual source uses `"gerado"` and `"deploy"`.

#### db.sms[]

Array of SMS purchase records. (To be fully documented in Task 01-01-03 — populated by Etapa 2 flow.)

| Campo | Tipo | Obrigatório | Condicional? | Criado Por |
|-------|------|-------------|-------------|------------|
| (fields TBD from Etapa 2 source analysis) | | | | `smsAPI()` purchase flow |

#### Conditional Branches Table

| Campo | Objeto Pai | Condição de Criação | Função Responsável | Valor Típico |
|-------|-----------|---------------------|-------------------|-------------|
| `empresas[].raw` | `db.empresas[]` | Após `normalizarBrasilAPI()` — sempre que CNPJ lookup succeeds | `normalizarBrasilAPI(d)` | Full BrasilAPI JSON response object (30+ fields) |
| `sites[].url` | `db.sites[]` | Após `e1Publicar()` sucesso no Cloudflare deploy | `e1Publicar()` success branch | `"https://{projectName}.pages.dev"` |
| `sites[].deploymentId` | `db.sites[]` | Após `e1Publicar()` sucesso no Cloudflare deploy | `e1Publicar()` success branch | Cloudflare deployment UUID |
| `sites[].telefoneNosso` | `db.sites[]` | Após Etapa 2 SMS purchase + site update | `atualizarSiteComNumero()` (Etapa 2) | Brazilian phone number string |

#### localStorage Write Sequence — Etapa 1 Workflow

1. **Initial state:** `getDB()` returns `{ empresas:[], sites:[], sms:[] }` (empty or existing)
2. **After CNPJ lookup (Step 1):** `salvarEmpresa(e)` → `db.empresas` gains new entry with `raw` object, `_created` timestamp
3. **After site generation (Step 4):** `registrarSite(dados, metatag, dominio, '')` → `db.sites` gains new entry with `status: "gerado"`, empty `url`/`deploymentId`
4. **After Cloudflare deploy (Step 5):** `e1Publicar()` success → `db.sites[].url` = Cloudflare URL, `db.sites[].deploymentId` = deployment ID, `status` → `"deploy"`, `atualizado` updated
5. **After Etapa 2 SMS purchase:** `atualizarSiteComNumero()` → `db.sites[].telefoneNosso` populated

---

### 1.2 Chave: `lab_bms_settings_v1`

**Storage Key:** `lab_bms_settings_v1` (constant `SETTINGS_KEY`)
**Accessors:** `getSettings()` (read), `saveSettings(s)` (write)
**Default Value:** `{}` (empty object)

| Campo | Tipo | Obrigatório | Condicional? | Criado Por |
|-------|------|-------------|-------------|------------|
| cf_token | string | Não | Não | `salvarConfig()` → Cloudflare API token input |
| cf_account | string | Não | Não | `salvarConfig()` → selected Cloudflare account ID |
| cf_accounts | array | Não | **SIM — condicional** | `autoConectarTokens()` → auto-detected from Cloudflare `/accounts` API |
| sms_key | string | Não | Não | `salvarConfig()` → SMS24h API key input |

**Auto-detection flow (`autoConectarTokens()`):** On app bootstrap, if `cf_token` exists but `cf_account` is missing, auto-detects available Cloudflare accounts by calling `/client/v4/accounts` and stores them as `cf_accounts[]`. The user selects one via `escolherConta()` which sets `cf_account`.

**Header status refresh (`refreshHeaderStatus()`):** Called by `saveSettings()` and on initial load. Updates Cloudflare status pill (`cf-status`) and SMS24h status pill (`sms-status`) based on token/key presence.

---

### 1.3 Estado em Memória (In-Memory State Objects)

*(To be filled by Task 01-01-03)*

#### 1.3.1 etapa1State

*(To be documented)*

#### 1.3.2 etapa2State

*(To be documented)*

#### 1.3.3 pdfState

*(To be documented)*

---

### 1.4 Bootstrap / Initialization Sequence

The app entry point is the bottom of the inline `<script>` block. The IIFE/self-executing code at the end:

*(To be documented — traced from source)*

---

## 2. DOM Tree & Component Hierarchy

*(To be filled by Plan 02)*

### 2.1 Shell Estático (sidebar, header, content, modals, toast)

### 2.2 Dashboard View

### 2.3 Etapa 1 View (5-step wizard)

### 2.4 Etapa 2 View

### 2.5 Etapa 3 View (PDF editor)

### 2.6 Banco de Empresas View

### 2.7 Planilha View

### 2.8 Configurações View

### 2.9 Ajuda View


## 3. Rotas & Sistema de Navegação

*(To be filled by Plan 02)*

### 3.1 Tabela de Rotas (ROUTES array)

### 3.2 VIEWS Registry

### 3.3 go(route) Function

### 3.4 Comportamento de Navegação (title, nav-link.active, history)


## 4. Contratos de API

*(To be filled by Plan 03)*

### 4.1 BrasilAPI — CNPJ Lookup

### 4.2 Cloudflare Pages API — Deploy Pipeline (5 passos)

### 4.3 Cloudflare API — Account Detection

### 4.4 SMS24h API — Number Purchase & Polling

### 4.5 CORS Proxy Layer (Netlify _redirects)


## 5. Funções de Lógica de Negócio

*(To be filled by Plan 03)*

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


## 6. CSS / Design System

*(To be filled by Plan 04)*

### 6.1 CSS Custom Properties (:root)

### 6.2 Component Classes (.glass, .grad-card, .btn-3d, .icon-cube, etc.)

### 6.3 Utility Variants (8 btn-3d colors, 5 icon-cube colors, 5 pill variants)

### 6.4 Animations & Keyframes

### 6.5 Responsive Breakpoints (1024px)

### 6.6 Tailwind CDN Version & Configuration

**Tailwind CDN URL:** `https://cdn.tailwindcss.com` (unversioned, resolves to latest v3 CDN build)

**Tailwind Config:**
```javascript
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
```

The Tailwind CDN is loaded via `<script>` tag. The config extends the default theme with two custom font families: `display` (Sora) for headings and `sans` (Inter) for body text. No other Tailwind configuration customizations detected (no custom colors, spacing, or breakpoints).


## 7. Apêndice: Referências Cruzadas por View

*(To be filled progressively as each plan completes)*

### 7.1 Dashboard → {DOM:§2.2, APIs:—, State:§1.1, Routes:§3, CSS:§6.2}

### 7.2 Etapa 1 → {DOM:§2.3, APIs:§4.1-4.2, State:§1.1-1.3, CSS:§6}

### 7.3 Etapa 2 → {DOM:§2.4, APIs:§4.4, State:§1.1-1.3, CSS:§6}

### 7.4 Etapa 3 → {DOM:§2.5, APIs:—, State:§1.3, CSS:§6}

### 7.5 Banco de Empresas → {DOM:§2.6, APIs:—, State:§1.1, CSS:§6}

### 7.6 Planilha → {DOM:§2.7, APIs:—, State:§1.1, CSS:§6}

### 7.7 Configurações → {DOM:§2.8, APIs:§4.3, State:§1.2, CSS:§6}

### 7.8 Ajuda → {DOM:§2.9, APIs:—, State:—, CSS:§6}


### Lighthouse Baseline

<manual-step>

**Lighthouse baseline could not be captured automatically** — the `lighthouse` CLI package is not installed and `npx lighthouse` timed out during download. Chrome 149 is available at `/usr/bin/google-chrome`. Run the following command to capture the baseline:

```bash
# Install lighthouse globally first:
npm install -g lighthouse

# Run the audit:
lighthouse https://laboratoriodebms.netlify.app/ \
  --preset=desktop \
  --only-categories=performance,best-practices,accessibility,seo \
  --output=json \
  --output-path=.planning/phases/01-reconnaissance-extraction/data/lighthouse-baseline.json \
  --chrome-flags="--headless --no-sandbox"
```

**Required metrics for VAL-04 bundle size comparison:**
- Total resource size (Performance audit → Diagnostics)
- JavaScript resource size
- CSS resource size  
- Total requests

**Fallback:** If Lighthouse cannot be installed, manually open Chrome DevTools → Lighthouse panel → Mode: Navigation → Device: Desktop → Categories: Performance + Best Practices + Accessibility + SEO → "Analyze page load" → Save JSON to `data/lighthouse-baseline.json`.

</manual-step>
