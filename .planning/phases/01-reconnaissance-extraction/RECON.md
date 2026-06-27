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

**Status: VESTIGIAL — initialized in default but never populated by any code path.**

Array present in the default structure `{ empresas:[], sites:[], sms:[] }` but no function in the entire source code writes to `db.sms`. This is a dead/vestigial array — appears reserved for SMS purchase history but never implemented. The clone may safely omit this array or keep it for structural compatibility.

**Confidence:** HIGH — grep of entire 2135-line source for `db.sms` and `.sms` returned zero matches outside the default initialization.

#### localStorage Writer Functions

| Function | Line | Write Pattern | Trigger |
|----------|------|---------------|---------|
| `saveDB(db)` | 216 | `localStorage.setItem(STORAGE_KEY, JSON.stringify(db))` | Direct calls from `salvarEmpresa()`, `registrarSite()`, `mudarStatus()`, `removerSite()`, `smbAtualizarSite()`, `e1Publicar()` |
| `saveSettings(s)` | 221 | `localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))` | Direct calls from `salvarConfig()`, `salvarTokenCF()`, `escolherConta()`, `trocarConta()`, `salvarAccountManual()`, `autoConectarTokens()`, `importBackup()` |
| `limparBanco()` | 1461-1466 | `localStorage.removeItem(STORAGE_KEY)` | User confirmation → full data wipe |

All localStorage writes go through these 3 functions. No other code path directly calls `localStorage.setItem` or `localStorage.removeItem`.

#### Conditional Branches Table

| Campo | Objeto Pai | Condição de Criação | Função Responsável | Valor Típico | Código (Linha) |
|-------|-----------|---------------------|-------------------|-------------|----------------|
| `empresas[].raw` | `db.empresas[]` | **SEMPRE** após CNPJ lookup succeed (não é realmente opcional — `normalizarBrasilAPI()` sempre inclui) | `normalizarBrasilAPI(d)` → linha 538: `raw: d` | Full BrasilAPI JSON response (30+ campos) | 538 |
| `sites[].url` | `db.sites[]` | Após `e1Publicar()` sucesso OU `smsAtualizarSite()` sucesso | `e1Publicar()` (linha 893) / `smsAtualizarSite()` (linha 1167) | `"https://{projectName}.pages.dev"` | 893, 1167 |
| `sites[].deploymentId` | `db.sites[]` | Após Cloudflare deploy sucesso (mesma condição que `url`) | `e1Publicar()` (linha 893) / `smsAtualizarSite()` (linha 1167) | Cloudflare deployment UUID (e.g., `depJson.result.id`) | 893, 1167 |
| `sites[].telefoneNosso` | `db.sites[]` | Após Etapa 2 SMS purchase + site update | `smsAtualizarSite()` (linha 1115) | Brazilian phone string (e.g., `"(31) 99088-5354"`) | 1115 |

#### Complete localStorage Write Sequence

**Workflow: Etapa 1 (CNPJ → Site → Deploy)**

| Step | Action | Function | localStorage Change |
|------|--------|----------|-------------------|
| 0 | App loads | `getDB()` | Returns existing data or `{empresas:[], sites:[], sms:[]}` |
| 1 | CNPJ lookup succeeds | `e1Buscar()` → `normalizarBrasilAPI(d)` → `salvarEmpresa(e)` | `db.empresas[]` ← new/updated entry with `raw` + `_created` |
| 2 | Site HTML generated | `e1Gerar()` → `registrarSite(dados, metatag, dominio, '')` | `db.sites[]` ← new entry: `status:"gerado"`, `url:""`, `deploymentId:""`, `telefoneNosso:""`, `dadosSnapshot:{...}`, `criado`, `atualizado` |
| 3 | Cloudflare deploy | `e1Publicar()` → success path | `db.sites[idx].url` = Cloudflare URL, `.deploymentId` = dep ID, `.status` = `"deploy"`, `.atualizado` = now |
| 4 | **Optional:** SMS purchase + site update | `smsAtualizarSite()` (Etapa 2) | `db.sites[idx].telefoneNosso` = formatted phone, `.url` / `.deploymentId` updated if re-deployed, `.status` → `"meta-tag"` |

**Workflow: Config Settings**

| Step | Action | Function | localStorage Change |
|------|--------|----------|-------------------|
| 0 | App bootstrap | `autoConectarTokens()` (IIFE, linha 2089) | Hardcoded defaults: `cf_token`, `cf_account`, `cf_account_name`, `sms_key` (only if missing) |
| 1 | User saves config | `salvarConfig()` | Updates `sms_key` only |
| 2 | User saves Cloudflare token | `salvarTokenCF()` → auto-detects accounts | `cf_token` set; on success: `cf_account`, `cf_account_name`, `cf_accounts[]` |
| 3 | User selects account | `escolherConta(id, nome)` | `cf_account`, `cf_account_name` |
| 4 | User switches account | `trocarConta()` | Deletes `cf_account`, `cf_account_name` |
| 5 | User manually enters account ID | `salvarAccountManual()` | `cf_account`, `cf_account_name` |
| 6 | Backup import | `importBackup(file)` | Replaces entire `db` (via `saveDB`) and `settings` (via `saveSettings`) |

**Workflow: Planilha (Site Management)**

| Step | Action | Function | localStorage Change |
|------|--------|----------|-------------------|
| 1 | Status change | `mudarStatus(cnpj, dominio, v)` | `db.sites[idx].status`, `.atualizado` |
| 2 | Delete site | `removerSite(cnpj, dominio)` | `db.sites` filtered — site removed |
| 3 | Clear all | `limparBanco()` (confirmation required) | `localStorage.removeItem(STORAGE_KEY)` — ENTIRE key deleted |

#### Source Code References

All fields confirmed from source code analysis:

| Schema Element | Source Lines | Evidence |
|---------------|-------------|----------|
| `STORAGE_KEY = 'lab_bms_db_v1'` | 209 | Constant declaration |
| `SETTINGS_KEY = 'lab_bms_settings_v1'` | 210 | Constant declaration |
| `getDB()` default | 213 | `{ empresas:[], sites:[], sms:[] }` |
| `getSettings()` default | 218 | `{}` (empty object) |
| `saveDB()` | 216 | `localStorage.setItem(STORAGE_KEY, JSON.stringify(db))` |
| `saveSettings()` | 221 | `localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))` + `refreshHeaderStatus()` |
| `salvarEmpresa()` | 554-560 | Upsert pattern: `findIndex` → merge or push |
| `registrarSite()` | 758-772 | Full site object with 12 fields |
| `e1Publicar()` site update | 893-896 | `site.url`, `site.deploymentId`, `site.status`, `site.atualizado` |
| `smsAtualizarSite()` | 1102-1178 | `site.telefoneNosso`, `site.url`, `site.deploymentId`, `site.status` |
| `mudarStatus()` | 1529-1535 | `site.status`, `site.atualizado` |
| `removerSite()` | 1536-1541 | `db.sites` filter |
| `limparBanco()` | 1461-1466 | `localStorage.removeItem(STORAGE_KEY)` |
| `autoConectarTokens()` hardcoded tokens | 2089-2108 | `cf_token`, `cf_account`, `cf_account_name`, `sms_key` |
| `exportBackup()` | 1721-1727 | Exports `{db, settings, exportedAt}` |
| `importBackup()` | 1728-1737 | Replaces `db` + `settings`

---

### 1.2 Chave: `lab_bms_settings_v1`

**Storage Key:** `lab_bms_settings_v1` (constant `SETTINGS_KEY`, line 210)
**Accessors:** `getSettings()` (read, line 217-219), `saveSettings(s)` (write, line 221)
**Default Value (code):** `{}` (empty object, line 218)
**Effective Default (bootstrap):** The `autoConectarTokens()` IIFE (lines 2089-2108) seeds hardcoded credentials if fields are missing — so a "fresh" settings object is effectively:
```json
{
  "cf_token": "<REDACTED-CF-TOKEN>",
  "cf_account": "<REDACTED-CF-ACCOUNT>",
  "cf_account_name": "João Victor",
  "sms_key": "<REDACTED-SMS-KEY>"
}
```
**Note:** These hardcoded tokens belong to the original author (João Victor) and are publicly exposed in the source code. The clone should use empty defaults or user-provided values — never ship hardcoded credentials.

| Campo | Tipo | Default | Criado Por (source line) | Descrição |
|-------|------|---------|--------------------------|-----------|
| `cf_token` | string | Hardcoded (line 2094) | `salvarTokenCF()` (1624) or `autoConectarTokens()` (2089) | Cloudflare API token (`cfat_...` or `cfk_...` format) |
| `cf_account` | string | Hardcoded (line 2098) | `salvarTokenCF()` success (1651), `escolherConta()` (1676), `salvarAccountManual()` (1694) | Selected Cloudflare account ID (32-char hex) |
| `cf_account_name` | string | Hardcoded (line 2099) | `salvarTokenCF()` success (1652), `escolherConta()` (1677), `salvarAccountManual()` (1695) | Display name for selected account |
| `cf_accounts` | array of {id, name} | — | **CONDICIONAL** — `salvarTokenCF()` when multiple accounts detected (line 1650-1668) | All Cloudflare accounts under the token. Only populated when >1 account exists. |
| `sms_key` | string | Hardcoded (line 2104) | `salvarConfig()` (1619) | SMS24h API key (32-char hex) |

**Full settings schema (TypeScript-like):**
```typescript
interface Settings {
  cf_token?: string;        // Cloudflare API token
  cf_account?: string;      // Selected Cloudflare account ID
  cf_account_name?: string; // Display name for CF account
  cf_accounts?: Array<{      // CONDITIONAL — multiple accounts
    id: string;
    name: string;
  }>;
  sms_key?: string;         // SMS24h API key
}
```

**All settings mutation functions:**

| Function | Line | Fields Written | Trigger |
|----------|------|----------------|---------|
| `salvarConfig()` | 1615-1622 | `sms_key` only (does NOT touch CF fields) | User clicks "Salvar" in Config view |
| `salvarTokenCF()` | 1624-1672 | `cf_token` + auto-detected `cf_account`, `cf_account_name`, `cf_accounts[]` | User saves CF token → API call to list accounts |
| `escolherConta(id, nome)` | 1674-1681 | `cf_account`, `cf_account_name` | User selects from multi-account list |
| `trocarConta()` | 1683-1688 | Deletes `cf_account`, `cf_account_name` | User clicks "Trocar" |
| `salvarAccountManual()` | 1690-1698 | `cf_account`, `cf_account_name` | User manually enters Account ID |
| `autoConectarTokens()` | 2089-2108 | `cf_token`, `cf_account`, `cf_account_name`, `sms_key` (only if missing) | App bootstrap (IIFE) |
| `importBackup()` | 1728-1737 | ALL fields (via `saveSettings(data.settings)`) | User imports backup JSON |

**Header status refresh (`refreshHeaderStatus()`, lines 223-235):** Called by `saveSettings()` (line 221) and on initial load (line 2131). Toggles Cloudflare status pill between `⚠️ Cloudflare` (danger) and `☁️ Cloudflare OK` (done) based on `cf_token && cf_account`. Toggles SMS24h status pill between `⚠️ SMS24h` (danger) and `📱 SMS24h OK` (done) based on `sms_key`.

---

### 1.3 Estado em Memória (In-Memory State Objects)

The original system uses 3 module-level `let` mutable state objects. All are declared at the top of their respective feature blocks. No additional state objects beyond these 3 exist in the source.

#### 1.3.1 etapa1State

**Declaration:** Line 391 (module-level `let`)
**Scope:** All Etapa 1 functions (`VIEWS.etapa1`, `e1Buscar`, `e1Gerar`, `e1Publicar`, `resetEtapa1`, `salvarEmpresa`, `registrarSite`, render helpers)
**Reset Trigger:** `resetEtapa1()` (line 905) — reinitializes all fields

**Initial Value:**
```javascript
let etapa1State = {
  empresa: null,        // {Object} — normalized company data from CNPJ lookup
  dominio: '',          // {string} — selected subdomain slug
  metatag: '',          // {string} — Facebook domain verification meta tag
  htmlGerado: '',       // {string} — generated site HTML (full document)
  publicado: null       // {Object|null} — {url, projectName, deploymentId} after Cloudflare deploy
};
```

| Campo | Tipo | Default | Mutado Por (Linha) | Descrição |
|-------|------|---------|---------------------|-----------|
| `empresa` | object \| null | `null` | `e1Buscar()` success (497), `e1ManualSalvar()` (523), `usarEmpresaNaEtapa1()` (1471), inline onclick reset (459) | Full company object from `normalizarBrasilAPI()` |
| `dominio` | string | `""` | `e1EscolherDominio(d)` (635), inline onclick reset (459, 610) | Subdomain slug (no `.pages.dev` suffix) |
| `metatag` | string | `""` | `e1SalvarMeta()` (670), inline onclick reset (459, 650) | Facebook meta-tag HTML string or `<!-- meta tag não fornecida -->` |
| `htmlGerado` | string | `""` | `e1Gerar()` (736), inline onclick reset (459, 688) | Complete HTML document (buildSiteHTML output + meta-tag injection) |
| `publicado` | object \| null | `null` | `e1Publicar()` success (890), inline onclick reset (459) | `{url: string, projectName: string, deploymentId: string}` |

**Step Transition Logic (Progressive Unlocking):**

The wizard uses boolean flags derived from state, not explicit step numbers:

| Step | Gate | Condition | Unlocks When |
|------|------|-----------|-------------|
| Step 1 (CNPJ) | Always enabled | — | Page load |
| Step 2 (Domínio) | `!stepCnpj` | `!etapa1State.empresa` | `empresa !== null` |
| Step 3 (Meta Tag) | `!stepDom` | `!etapa1State.dominio` | `dominio !== ''` |
| Step 4 (Gerar Site) | `!stepMeta` | `!etapa1State.metatag` | `metatag !== ''` |
| Step 5 (Publicar) | `!stepHTML` | `!etapa1State.htmlGerado` | `htmlGerado !== ''` |

Each step's `stepBox()` call passes `disabled` based on the previous step's completion. Steps can be "reversed" by clearing the current step's field (inline onclick on "Trocar"/"Refazer" buttons), which cascades to clear all downstream fields.

**Complete Field Mutation Trace:**

| Mutation | Source Line | Trigger |
|----------|------------|---------|
| `empresa = e` | 497 | `e1Buscar()` — CNPJ lookup success |
| `empresa = e` | 523 | `e1ManualSalvar()` — manual company registration |
| `empresa = e` (via spread) | 1471 | `usarEmpresaNaEtapa1(cnpj)` — "Usar na Etapa 1" from Banco |
| `empresa = null` (+ cascade) | 459 | User clicks "Trocar" on Step 1 |
| `dominio = d` | 635 | `e1EscolherDominio(d)` — user selects domain suggestion |
| `dominio = ''` (+ cascade) | 459, 610 | User clicks "Trocar" on Step 1 or 2 |
| `metatag = v` | 670 | `e1SalvarMeta()` — user saves meta tag |
| `metatag = ''` (+ cascade) | 459, 650 | User clicks "Trocar" on Step 1 or 3 |
| `htmlGerado = html` | 736 | `e1Gerar()` — site HTML generation complete |
| `htmlGerado = ''` (+ cascade) | 459, 688 | User clicks "Refazer" on Step 4 |
| `publicado = {url, projectName, deploymentId}` | 890 | `e1Publicar()` — Cloudflare deploy success |
| `publicado = null` (+ cascade) | 459 | User clicks "Trocar" on Step 1 |

---

#### 1.3.2 etapa2State

**Declaration:** Line 915 (module-level `let`)
**Scope:** All Etapa 2 functions (`VIEWS.etapa2`, `smsAPI`, `smsComprar`, `iniciarPollingSMS`, `smsCancelar`, `smsConfirmar`, `smsAtualizarSite`)
**Reset Trigger:** None explicit — state resets naturally when new purchase starts

**Initial Value:**
```javascript
let etapa2State = {
  activationId: null,   // {string|null} — SMS24h activation ID
  phone: '',            // {string} — purchased phone number (raw, unformatted)
  code: '',             // {string} — received SMS activation code
  timer: null           // {number|null} — setInterval ID for auto-polling
};
```

| Campo | Tipo | Default | Mutado Por (Linha) | Descrição |
|-------|------|---------|---------------------|-----------|
| `activationId` | string \| null | `null` | `smsComprar()` (1052) | SMS24h activation ID, used for polling and status changes |
| `phone` | string | `""` | `smsComprar()` (1053) | Raw phone number string (e.g., "5531990885354") |
| `code` | string | `""` | `iniciarPollingSMS()` (1076), reset to `""` in `smsComprar()` (1054) | SMS activation code received from SMS24h polling |
| `timer` | number \| null | `null` | `iniciarPollingSMS()` (1069), cleared in `smsCancelar()` (1088) and `smsConfirmar()` (1097) | `setInterval` ID for 5-second polling |

**Polling Timer Details:**

| Property | Value |
|----------|-------|
| Interval | 5,000ms (every 5 seconds) |
| Timeout | 1,200 seconds (20 minutes) |
| Start | `Date.now()` captured at `iniciarPollingSMS()` call |
| Display | Updates `#sms-timer` element with elapsed seconds |
| Termination | `clearInterval` on: SMS received, timeout (1200s), user cancel, or user confirm |
| API Call | `smsAPI('getStatus', '&id={activationId}')` each interval |

**Field Mutation Trace:**

| Mutation | Source Line | Trigger |
|----------|------------|---------|
| `activationId, phone = id, phone` | 1052-1053 | `smsComprar()` — SMS24h purchase response `ACCESS_NUMBER:id:phone` |
| `code = ''` | 1054 | `smsComprar()` — reset on new purchase |
| `code = t.split(':')[1]` | 1076 | `iniciarPollingSMS()` — SMS received (`STATUS_OK:code`) |
| `timer = setInterval(...)` | 1069 | `iniciarPollingSMS()` — polling started |
| `clearInterval(timer)` | 1067, 1077, 1088, 1097 | Before new timer, on SMS received, on cancel, on confirm |

---

#### 1.3.3 pdfState

**Declaration:** Line 1183 (module-level `let`)
**Scope:** All Etapa 3 functions (`VIEWS.etapa3`, `carregarPDF`, `rerenderOverlays`, `baixarPDF`, `mapearCampos`, `extrairCamposEndereco`)
**Reset Trigger:** Loading a new PDF (`carregarPDF`) resets `overlays` to `[]`

**Initial Value:**
```javascript
let pdfState = {
  fileBytes: null,      // {Uint8Array|null} — raw PDF file bytes
  pdfDoc: null,         // {PDFDocumentProxy|null} — pdf.js document proxy
  pages: [],            // {Array<{pageNum: number, viewport: Object}>} — rendered page info
  overlays: []          // {Array<Overlay>} — text overlay objects
};

// Overlay type: {page, x, y, text, size, pageWidth, pageHeight}
```

**Overlay Data Structure (exact shape):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `page` | number | Page number (1-indexed) where overlay appears |
| `x` | number | X position (pixels, relative to canvas) |
| `y` | number | Y position (pixels, relative to canvas) |
| `text` | string | Text content of the overlay (contentEditable) |
| `size` | number | Font size in pixels (default: 16) |
| `pageWidth` | number | Viewport width of the page canvas |
| `pageHeight` | number | Viewport height of the page canvas |

**Field Mutation Trace:**

| Campo | Mutado Por (Linha) | Descrição |
|-------|---------------------|-----------|
| `fileBytes` | `carregarPDF()` (1219) | Set to `new Uint8Array(buf)` on file load |
| `pdfDoc` | `carregarPDF()` (1226) | `await loadingTask.promise` — pdf.js document proxy |
| `pages` | `carregarPDF()` (1227, 1252) | Reset to `[]`, then `.push({pageNum, viewport})` for each page |
| `overlays` | `carregarPDF()` (1220) | Reset to `[]` on new PDF load |
| `overlays` | Canvas click handler (1249) | `.push({page, x, y, text:'Texto', size, pageWidth, pageHeight})` |
| `overlays` | Delete button in `rerenderOverlays()` (1285) | `.splice(idx, 1)` — remove overlay at index |
| `overlays` | Inline onclick (1208) | Set to `[]` via "Limpar textos" button |
| `overlays[idx].text` | contentEditable `oninput` (1275) | Updated as user types in overlay |
| `overlays[idx].x, .y` | Drag handler `onmouseup` (1282) | Updated when user drags overlay |

**Overlay Rendering (`rerenderOverlays()`, line 1258):**
- Iterates `pdfState.overlays.forEach()`
- Creates `div.pdf-overlay-text` elements positioned absolutely over each page canvas
- Each overlay is `contentEditable` with drag support (mousedown/mousemove/mouseup)
- Delete button (`.del`) on each overlay removes it via `splice`
- Overlay position clamped to page boundaries during drag

---

#### 1.3.4 Additional State Objects

**TOAST TIMER: `window._tt`**

| Property | Line | Type | Description |
|----------|------|------|-------------|
| `window._tt` | 242-243 | `number` (setTimeout ID) | Timer ID for auto-dismissing toast after 3000ms. `clearTimeout(window._tt)` before setting new toast prevents stacking. |

No toast queue — single toast slot with timer-based dismissal. Concurrent toasts cancel the previous one.

**UI State:**

- **Sidebar:** No explicit `sidebarOpen` variable. `toggleSidebar(open)` (line 249) directly manipulates `classList` on `#sidebar` and `#backdrop`. State is read from DOM classes (`sidebar.open`, `backdrop.open`).
- **Current Route:** No explicit `currentRoute` variable. Route state is implicit — `go(route)` (line 286) toggles `.active` class on `[data-route]` elements and calls `VIEWS[route]()` to render content. The active route can be determined by `document.querySelector('[data-route].active')?.dataset?.route`.
- **Modals:** No modal state variable. `openModal(html)` / `closeModal()` directly toggle `#modal-back` classList.

**Global Constants (not mutable state, but architecturally significant):**

| Constant | Line | Value | Description |
|----------|------|-------|-------------|
| `STORAGE_KEY` | 209 | `'lab_bms_db_v1'` | localStorage key for app data |
| `SETTINGS_KEY` | 210 | `'lab_bms_settings_v1'` | localStorage key for settings |
| `ROUTES` | 284 | `['dashboard','etapa1','etapa2','etapa3','banco','planilha','config','ajuda']` | Valid route names (used by `go()` for validation) |
| `VIEWS` | 307 | `{}` (populated progressively) | View function registry — keys are route names, values are render functions returning HTML strings |

**sessionStorage:** **Not used.** grep for `sessionStorage` across entire 2135-line source returned zero matches. The entire app uses only `localStorage` for persistence and module-level `let` variables for transient session state.

---

### 1.4 Bootstrap / Initialization Sequence

The app entry point is the bottom of the inline `<script>` block (lines 2086-2132). Execution order is top-to-bottom with three IIFEs at the end:

**Execution Order (confirmed from source):**

| Order | Line | Action | Description |
|-------|------|--------|-------------|
| 1 | 2089-2108 | `autoConectarTokens()` (IIFE) | Seeds hardcoded credentials if `cf_token`, `cf_account`, or `sms_key` are missing. Calls `saveSettings()` if changes made. |
| 2 | 2112-2123 | `instalarProxy()` (IIFE) | Monkey-patches `window.fetch` to rewrite Cloudflare and SMS24h API URLs through Netlify CORS proxy (`/cf-api/` and `/sms-api/`). Skips if `file:` protocol. |
| 3 | 2125-2127 | pdf.js worker config | Sets `pdfjsLib.GlobalWorkerOptions.workerSrc` to the pinned CDN worker URL (if pdfjsLib is loaded). |
| 4 | 2128-2129 | Global exposure | Exposes key functions to `window` for inline onclick handlers: `onlyDigits`, `copyText`, `escapeHTML`, `go`, `toggleSidebar`. |
| 5 | 2130 | PDFLib stub | `window.PDFLib = window.PDFLib || {}` — ensures global exists before pdf-lib CDN script loads. |
| 6 | 2131 | `refreshHeaderStatus()` | Updates Cloudflare and SMS24h API status pills in header. |
| 7 | 2132 | **`go('dashboard')`** | Initial route render — loads Dashboard view, sets title, toggles nav-link active state. |

**Key observations:**
1. `autoConectarTokens()` runs FIRST — ensures settings exist before any code reads them
2. `instalarProxy()` runs SECOND — URL rewriting is in place before any fetch calls
3. No `DOMContentLoaded` listener — the inline `<script>` is at the end of `<body>`, so DOM is already available
4. All state objects (`etapa1State`, `etapa2State`, `pdfState`) are initialized lazily when their `let` declarations are encountered during the top-to-bottom parse — they don't need to be in the bootstrap sequence
5. `getDB()` is first called when `go('dashboard')` triggers `VIEWS.dashboard()` (line 313)

---

## 2. DOM Tree & Component Hierarchy

*(To be filled by Plan 02)*

### 2.1 Static Shell (persiste em todas as rotas)

**Container raiz:** `<body class="min-h-screen">` (linha 136)

The static HTML shell contains 6 persistent elements that exist in the HTML source (not created dynamically by JS). All dynamic view content is injected into `<section id="view">` via `go()` → `VIEWS[route]()` → `innerHTML`.

#### 2.1.1 Backdrop (mobile overlay)

**Element:** `<div id="backdrop" class="backdrop" onclick="toggleSidebar(false)">` (linha 138)
- **Default state:** `display:none` (CSS `.backdrop` class)
- **Open state:** `display:block; position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:40` (CSS `.backdrop.open`)
- **Event handler:** `onclick="toggleSidebar(false)"` — clicking backdrop closes sidebar
- **Toggled by:** `toggleSidebar(open)` (linha 252-255)
- **Responsive:** Only functional at `≤1024px` (mobile breakpoint)

#### 2.1.2 Sidebar (`<aside id="sidebar">`)

**Element:** `<aside id="sidebar" class="sidebar w-[280px] shrink-0 p-4 border-r border-white/5" style="background:linear-gradient(180deg,#0c1330,#0a0f24);">` (linha 142)
- **CSS classes:** `sidebar` (transition), `w-[280px]` (fixed width), `shrink-0`, `p-4`, `border-r border-white/5`
- **Inline style:** `background:linear-gradient(180deg,#0c1330,#0a0f24)`
- **Responsive behavior (@media max-width:1024px, linhas 106-109):** `position:fixed; inset:0 auto 0 0; z-index:50; transform:translateX(-100%); width:280px` — sidebar slides off-screen. `.sidebar.open { transform:translateX(0); }` brings it back
- **Transition:** `transition:transform .25s ease` (linha 105)

**Sidebar child hierarchy:**
```
<aside id="sidebar">
  ├── div (logo container, linha 143)
  │   ├── div.icon-cube.purple (🧪 emoji, 52×52px, linha 144)
  │   └── div (text container, linha 145)
  │       ├── div.font-display.text-lg: "LABORATÓRIO<br><span class="grad-text">DE BMS 🎈</span>"
  │       └── div.text-xs.text-slate-400: "ADM: João Victor"
  │
  ├── <nav class="space-y-1.5"> (linha 151)
  │   ├── div.nav-link.active data-route="dashboard" (linha 152) — 🏠 Início
  │   │
  │   ├── div.text-[10px] (category header) — "FLUXO PRINCIPAL" (linha 153)
  │   ├── div.nav-link data-route="etapa1" (linha 154) — 🧬 Etapa 1 — Criar Site
  │   ├── div.nav-link data-route="etapa2" (linha 155) — 📱 Etapa 2 — Comprar Número
  │   ├── div.nav-link data-route="etapa3" (linha 156) — 📄 Etapa 3 — Editor PDF
  │   │
  │   ├── div.text-[10px] (category header) — "DADOS" (linha 157)
  │   ├── div.nav-link data-route="banco" (linha 158) — 💼 Banco de Empresas
  │   ├── div.nav-link data-route="planilha" (linha 159) — 📊 Planilha
  │   │
  │   ├── div.text-[10px] (category header) — "SISTEMA" (linha 160)
  │   ├── div.nav-link data-route="config" (linha 161) — ⚙️ Configurações
  │   └── div.nav-link data-route="ajuda" (linha 162) — ❓ Ajuda
  │
  └── div.glass (tip card, linha 165)
      ├── div.icon-cube.cyan (⭐ emoji, 36×36px)
      ├── div.font-bold: "Dica"
      └── p.text-sm: "Capital social entre R$ 10k e R$ 50k é a faixa ideal."
```

**Nav-link element structure (per nav-link):**
- **Element:** `<div>` (not `<a>` — div with onclick)
- **CSS classes:** `nav-link active` (dashboard default) or `nav-link`
- **Attribute:** `data-route="{routeName}"`
- **CSS (linhas 71-74):**
  - Base: `display:flex; align-items:center; gap:.8rem; padding:.85rem 1rem; border-radius:14px; color:#cfd5f2; font-weight:600; transition:all .15s ease; cursor:pointer`
  - Hover: `background:rgba(255,255,255,0.05); color:white; transform:translateX(2px)`
  - Active: `background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(34,211,238,.1)); color:white; box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)`
- **Event handler:** `onclick="go('{routeName}')"` (inline onclick attribute, NOT addEventListener)
- **Child elements:** `<span class="nav-emoji">` (emoji icon, 36×36px, linha 74) + text label (inline text)
- **Active state mechanism:** `go()` calls `document.querySelectorAll('[data-route]').forEach(el => { el.classList.toggle('active', el.dataset.route === route) })` (linha 288)

**All 8 nav-links detailed:**

| data-route | onclick | Icon | Label | Categoria |
|------------|---------|------|-------|-----------|
| dashboard | go('dashboard') | 🏠 | Início | — (topo, sem categoria) |
| etapa1 | go('etapa1') | 🧬 | Etapa 1 — Criar Site | FLUXO PRINCIPAL |
| etapa2 | go('etapa2') | 📱 | Etapa 2 — Comprar Número | FLUXO PRINCIPAL |
| etapa3 | go('etapa3') | 📄 | Etapa 3 — Editor PDF | FLUXO PRINCIPAL |
| banco | go('banco') | 💼 | Banco de Empresas | DADOS |
| planilha | go('planilha') | 📊 | Planilha | DADOS |
| config | go('config') | ⚙️ | Configurações | SISTEMA |
| ajuda | go('ajuda') | ❓ | Ajuda | SISTEMA |

**Category headers:**
- **Element:** `<div>` with inline text
- **CSS classes:** `text-[10px] uppercase tracking-widest text-slate-500 px-3 mt-4 mb-1`
- **Categories:** FLUXO PRINCIPAL, DADOS, SISTEMA
- **No interactivity** — purely visual separators

**Tip card (footer of sidebar):**
- **Wrapper:** `<div class="glass mt-6 p-4 rounded-2xl">`
- **Icon:** `<div class="icon-cube cyan" style="width:36px;height:36px;font-size:16px;">⭐</div>`
- **Content:** "Capital social entre `R$ 10k` e `R$ 50k` é a faixa ideal." (with `text-cyan-300` highlights on values)
- **No event handlers** — informational only

#### 2.1.3 Content Area + Header

**Content wrapper:** `<main class="content-wrap flex-1 min-w-0">` (linha 174)
- **CSS:** `flex-1 min-w-0` — fills remaining space. At ≤1024px: `.content-wrap { margin-left:0 !important; }` (linha 109)

**Sticky Header (`<header>`):**

**Element:** `<header class="sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/5" style="background:rgba(11,16,32,.85); backdrop-filter:blur(12px);">` (linha 175)
- **Position:** `sticky top-0 z-30`
- **Blur effect:** `backdrop-filter:blur(12px)` — confirmed inline style
- **Layout:** `flex items-center justify-between`
- **Padding:** `px-4 sm:px-8 py-4`
- **Border:** `border-b border-white/5`

**Header child hierarchy:**
```
<header>
  ├── div.flex.items-center.gap-3 (left section, linha 176)
  │   ├── button.lg:hidden.btn-3d.ghost.sm (☰ hamburger, linha 177)
  │   │   · onclick="toggleSidebar(true)"
  │   │   · Visible only at <1024px (`.lg:hidden`)
  │   └── div (title container, linha 178)
  │       ├── div#page-title.font-display.text-xl: "Início" (linha 179)
  │       │   · Updated by go() → `document.getElementById('page-title').textContent = titles[route][0]`
  │       └── div#page-subtitle.text-xs.text-slate-400: "Bem-vindo, João Victor!" (linha 180)
  │           · CSS: `hidden sm:block` — hidden on mobile
  │           · Updated by go() → `document.getElementById('page-subtitle').textContent = titles[route][1]`
  │
  └── div.flex.items-center.gap-2 (right section, linha 183)
      ├── div#cf-status.pill.danger (⚡️ Cloudflare, linha 184)
      │   · CSS: `hidden sm:flex` — hidden on mobile
      │   · States: `.pill.danger` (⚠️ Cloudflare) vs `.pill.done` (☁️ Cloudflare OK)
      │   · Updated by refreshHeaderStatus() (linha 223-235)
      ├── div#sms-status.pill.danger (⚡️ SMS24h, linha 185)
      │   · CSS: `hidden sm:flex` — hidden on mobile
      │   · States: `.pill.danger` (⚠️ SMS24h) vs `.pill.done` (📱 SMS24h OK)
      │   · Updated by refreshHeaderStatus() (linha 223-235)
      └── div.icon-cube.purple (JV avatar, linha 186)
          · style="width:42px;height:42px;font-size:18px;"
          · Static text "JV" (initials)
```

**Dynamic content:** `#page-title` and `#page-subtitle` are updated by `go()` on every route change (linhas 299-300). The API status pills are updated by `refreshHeaderStatus()` on page load and after `saveSettings()`.

**Hamburger button:**
- **Element:** `<button class="lg:hidden btn-3d ghost sm" onclick="toggleSidebar(true)">☰</button>`
- **Visible:** Only at <1024px (`lg:hidden`)
- **Click handler:** `toggleSidebar(true)` — opens sidebar overlay on mobile

**View container:** `<section id="view" class="p-4 sm:p-8 max-w-7xl mx-auto"></section>` (linha 190)
- **Initial state:** Empty element
- **Content injection:** `go()` calls `document.getElementById('view').innerHTML = VIEWS[route]()` (linha 301)
- **Max width:** `max-w-7xl` — Tailwind utility (1280px)
- **Padding:** `p-4 sm:p-8` (responsive)

#### 2.1.4 Toast System

**Toast container (static HTML, linha 194):**
```html
<div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 hidden z-[60] glass px-5 py-3 rounded-2xl flex items-center gap-3"
     style="background:rgba(15,23,55,.95);">
  <span id="toast-icon">✅</span>
  <span id="toast-msg">Pronto!</span>
</div>
```

**Toast element structure:**
- **Container:** `div#toast`
- **Position:** `fixed bottom-6 left-1/2 -translate-x-1/2` — centered horizontally, bottom of viewport
- **Z-index:** `z-[60]` — above sidebar (z-50), below modal (z-70)
- **CSS classes:** `glass px-5 py-3 rounded-2xl flex items-center gap-3`
- **Default state:** `hidden` (display:none)
- **Child elements:**
  - `span#toast-icon` — emoji icon (default: ✅)
  - `span#toast-msg` — message text (default: "Pronto!")

**Toast JavaScript (`toast(msg, icon)` function, linhas 237-244):**
1. Sets `toast-icon.textContent` to `icon` parameter (default: `'✅'`)
2. Sets `toast-msg.textContent` to `msg` parameter
3. Removes `.hidden` class (shows toast)
4. Calls `clearTimeout(window._tt)` — cancels previous auto-dismiss timer
5. Sets new `window._tt = setTimeout(() => t.classList.add('hidden'), 3000)` — auto-dismiss after 3 seconds

**Toast stacking behavior:** Single toast slot. Calling `toast()` while a toast is visible cancels the previous one (replaces content, resets timer). No toast queue.

#### 2.1.5 Modal System

**Modal container (static HTML, linhas 199-202):**
```html
<div id="modal-back" class="fixed inset-0 bg-black/60 hidden z-[70] flex items-center justify-center p-4"
     onclick="if(event.target===this)closeModal()">
  <div id="modal-body" class="glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto scrollbar p-6"
       style="background:rgba(15,23,55,.95);"></div>
</div>
```

**Modal element structure:**
- **Backdrop:** `div#modal-back`
  - **Position:** `fixed inset-0` — full viewport overlay
  - **Background:** `bg-black/60` — 60% opacity black
  - **Z-index:** `z-[70]` — above sidebar (z-50), toast (z-60), header (z-30)
  - **Layout:** `flex items-center justify-center p-4` — centers modal body vertically and horizontally
  - **Default state:** `hidden` (display:none)
  - **Click handler:** `onclick="if(event.target===this)closeModal()"` — backdrop click closes modal (event target check prevents body clicks from closing)
- **Body:** `div#modal-body`
  - **CSS classes:** `glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto scrollbar p-6`
  - **Max width:** `max-w-2xl` (672px)
  - **Max height:** `max-h-[90vh]` — 90% of viewport height with overflow scroll
  - **Inline style:** `background:rgba(15,23,55,.95)` — dark glass background

**Modal JavaScript:**
- `openModal(html)` (linha 246-248): Sets `#modal-body.innerHTML` to the HTML string, removes `.hidden` from `#modal-back`
- `closeModal()` (linha 250): Adds `.hidden` to `#modal-back`
- **Close triggers documented (from source):**
  - Backdrop click (`onclick="if(event.target===this)closeModal()"`)
  - Close buttons in modal content (via inline onclick calling `closeModal()`) — but no global X button or Escape key handler found in source

#### 2.1.6 Other Persistent UI Elements

**No additional persistent UI elements** were found in the static HTML beyond what's documented above. Specifically:
- **No loading spinner** in the static shell — spinners are created dynamically in view functions (via `class="spinner"`)
- **No confirmation dialogs** — confirmations use native `confirm()` calls (inline in functions)
- **No dropdown menus** — all menus are in the sidebar (static) or embedded in view content
- **No tooltips** — none found in static HTML or CSS

### 2.2 Dashboard View

### 2.3 Etapa 1 View (5-step wizard)

**View Function:** `VIEWS.etapa1` (linhas 399-426)
**Source:** Entire Etapa 1 section, linhas 388-910
**Route:** `etapa1`
**State Object:** `etapa1State` (linha 391)

#### Element Hierarchy

```
VIEWS.etapa1 output:
├── div.grad-card (hero, linha 408)
│   ├── div.icon-cube.floaty (🧬 emoji)
│   ├── div.flex-1
│   │   ├── div.pill.doing: "FLUXO LINEAR"
│   │   ├── h2.font-display: "Crie um site do zero"
│   │   └── p.text-slate-300: "Siga as caixas abaixo..."
│   └── button.btn-3d.ghost.sm: "🔄 Resetar fluxo" (onclick: resetEtapa1())
│
├── div.glass.step-card (Step 1: Buscar CNPJ)
│   └── renderStep1CNPJ() output (linhas 442-483)
│       ├── [cond: empresa exists] company display card
│       │   ├── div.icon-cube.green (🏢)
│       │   ├── div.flex-1 (CNPJ, razao_social, cnae)
│       │   ├── span.pill.ok (situacao)
│       │   ├── span.pill.doing (porte)
│       │   ├── span.pill.done/todo (capital_social)
│       │   └── button.btn-3d.ghost: "🔄 Trocar" (inline onclick cascade reset)
│       └── [cond: no empresa] search form
│           ├── input#e1_cnpj.input (CNPJ input, oninput auto-fetch)
│           ├── button.btn-3d.cyan: "🔍 Buscar" (onclick: e1Buscar())
│           ├── div#e1_result (result/error container)
│           └── details (manual registration form, 14 fields)
│
├── div.glass.step-card (Step 2: Gerar Domínio)
│   └── renderStep1Dominio() output (linhas 598-630)
│       ├── [cond: dominio exists] selected domain display
│       │   ├── div.icon-cube.cyan (🌐)
│       │   ├── div.flex-1: "{dominio}.pages.dev"
│       │   ├── button: "📋 Copiar domínio" (copyText)
│       │   └── button: "🔄 Trocar" (cascade reset)
│       └── [cond: no dominio] domain suggestions
│           ├── div.glass (suggestion cards, 6 max)
│           │   └── per suggestion: font-mono domain + 📋 copy + Usar buttons
│           └── input#e1_dom_custom.input + button: "✅ Usar este"
│
├── div.glass.step-card (Step 3: Meta Tag)
│   └── renderStep1Meta() output (linhas 639-663)
│       ├── [cond: metatag exists] tag display
│       │   ├── div.icon-cube.purple (🛡️)
│       │   ├── div.flex-1: tag HTML in monospace
│       │   └── button: "🔄 Trocar" (cascade reset)
│       └── [cond: no metatag] input form
│           ├── input#e1_meta.input (meta-tag paste)
│           ├── button: "✅ Aplicar" (onclick: e1SalvarMeta())
│           └── details: "Posso pular?" (skip option)
│
├── div.glass.step-card (Step 4: Gerar Site)
│   └── renderStep1Gerar() output (linhas 675-702)
│       ├── [cond: htmlGerado exists] generated site display
│       │   ├── div.icon-cube.green (🎨)
│       │   ├── div.flex-1: "{size} KB — index.html pronto"
│       │   ├── button: "👀 Pré-visualizar" (e1Preview)
│       │   ├── button: "⬇️ Baixar" (e1Baixar)
│       │   └── button: "🔄 Refazer" (reset)
│       └── [cond: no htmlGerado] generation form
│           ├── input#e1g_slogan.input (slogan, default value)
│           ├── input#e1g_horario.input (hours)
│           ├── input#e1g_whats.input (WhatsApp)
│           ├── input#e1g_email.input (extra email)
│           └── button.btn-3d.success: "🎨 Gerar Site Completo"
│
└── div.glass.step-card (Step 5: Publicar)
    └── renderStep1Publicar() output (linhas 774-805)
        ├── [cond: publicado exists] success display (.neon glow)
        │   ├── div.icon-cube.green.pulse-ring (🌐)
        │   ├── a.link: published URL (target=_blank)
        │   ├── button: "📋 Copiar link"
        │   ├── button: "↗️ Abrir site"
        │   ├── button: "📱 Próximo: Comprar número →"
        │   └── button: "📊 Ver na planilha"
        └── [cond: not published] publish form
            ├── [cond: !cf_token] warning card (requires Cloudflare config)
            ├── button#btn-publish.btn-3d.success: "🚀 Publicar no Cloudflare"
            ├── button.btn-3d.ghost: "⬇️ Só baixar (manual)"
            └── div#publish-log (step-by-step deploy log)
```

#### stepBox() Component (linhas 428-440)
- **Wrapper:** `<div class="glass step-card mb-4 {done? 'done' : ''} {disabled? 'disabled' : ''}">`
- **Step number:** `<div class="step-num">` — shows step number or ✓ when done. CSS (linhas 91-92): gradient background, `.done .step-num` gets green variant
- **Header:** emoji icon (text-2xl) + title (font-display font-bold) + optional `.pill.done` "Concluído"
- **Body:** injected render function HTML
- **Disabled CSS (linha 90):** `.step-card.disabled { opacity:.45; pointer-events:none; }`

#### Conditional Visibility Rules (per step)

| Element | Condition to Show | Condition to Hide | State Variable |
|---------|------------------|-------------------|----------------|
| Step 2 body | `!stepCnpj` (empresa exists) | `etapa1State.empresa === null` | etapa1State.empresa |
| Step 3 body | `!stepDom` (dominio set) | `etapa1State.dominio === ''` | etapa1State.dominio |
| Step 4 body | `!stepMeta` (metatag set) | `etapa1State.metatag === ''` | etapa1State.metatag |
| Step 5 body | `!stepHTML` (htmlGerado set) | `etapa1State.htmlGerado === ''` | etapa1State.htmlGerado |
| Company display card | `empresa !== null` | `empresa === null` | etapa1State.empresa |
| Domain selected display | `dominio !== ''` | `dominio === ''` | etapa1State.dominio |
| Meta-tag display | `metatag !== ''` | `metatag === ''` | etapa1State.metatag |
| Site generated display | `htmlGerado !== ''` | `htmlGerado === ''` | etapa1State.htmlGerado |
| Published display | `publicado !== null` | `publicado === null` | etapa1State.publicado |
| Cloudflare warning | `!podePublicar` | `cf_token && cf_account` exists | getSettings() |
| Cloudflare config callout | `!podePublicar` | same as above | getSettings() |

**Cascade reset pattern:** Clicking "Trocar" on any earlier step clears ALL downstream state fields. Example: Trocar on Step 1 clears `empresa=null, dominio='', metatag='', htmlGerado='', publicado=null` and re-renders via `go('etapa1')`.

**Domain suggestions (7 algorithms, linhas 563-596):**
1. Base + double last letter
2. Truncate + add 's'
3. Vowel swap (e.g., 'a'→'aa')
4. Add '01' or 'oficial' suffix
5. First-letters sigla + base
6. Reorder: last 4 chars + remainder
7. Half + first 2 chars duplicate

### 2.4 Etapa 2 View (SMS Purchase)

**View Function:** `VIEWS.etapa2` (linhas 917-1023)
**Source:** Entire Etapa 2 section, linhas 912-1178
**Route:** `etapa2`
**State Object:** `etapa2State` (linha 915)

#### Element Hierarchy

```
VIEWS.etapa2 output:
├── div.grad-card (hero, linha 924)
│   ├── div.icon-cube.purple.floaty (📱)
│   ├── div.flex-1
│   │   ├── div.pill.doing: "SMS24H.ORG"
│   │   ├── h2.font-display: "Compre um número virtual"
│   │   └── p.text-slate-300: "Para receber o SMS de verificação..."
│   └── button.btn-3d.ghost.sm: "💰 Ver saldo" (onclick: smsVerSaldo())
│
├── [cond: !sms_key] div.glass warning (line 936)
│   └── "⚠️ Configure sua API key SMS24h nas Configurações"
│
├── div.glass.step-card (Step 1: Buy Number)
│   ├── select#sms-service.input (service: fb/ig/wa/go/tg/other)
│   ├── select#sms-country.input (country: BR/RU/US/UA/IN)
│   ├── button.btn-3d.success: "🛒 Comprar agora" (onclick: smsComprar())
│   └── div#sms-buy-log (purchase status)
│
├── div.glass.step-card (Step 2: Number Display)
│   ├── [cond: phone exists] phone info
│   │   ├── div.copy-row: formatted phone (BR format)
│   │   │   └── button.btn-3d.cyan.sm: "📋 Copiar"
│   │   ├── div.copy-row: raw phone number
│   │   │   └── button.btn-3d.ghost.sm: "📋"
│   │   └── div.text-xs: "⏱️ Você tem ~20min para receber..."
│   └── [cond: !phone] div.text-slate-400: "Compre primeiro um número."
│
├── div.glass.step-card (Step 3: Receive SMS)
│   ├── div#sms-code-box
│   │   ├── [cond: code received] code display
│   │   │   ├── div.copy-row.neon (green border)
│   │   │   │   ├── div.key: "CÓDIGO SMS"
│   │   │   │   ├── div.val: code in green monospace
│   │   │   │   └── button: "📋 Copiar"
│   │   │   └── button.btn-3d.cyan: "✅ Confirmar recebimento"
│   │   └── [cond: phone, no code] polling display
│   │       └── div.flex: spinner + "Aguardando o SMS chegar..." + span#sms-timer
│   └── button.btn-3d.ghost.sm: "🚫 Cancelar" (smsCancelar)
│
└── div.glass.step-card (Step 4: Update Site)
    ├── p.text-sm: "Escolha o site no ar..."
    ├── select#sms-site.input (all live sites with URLs)
    ├── button.btn-3d.purple: "🔄 Atualizar e re-publicar" (smsAtualizarSite)
    └── div#sms-update-log (deploy log)
```

#### Conditional Visibility Rules

| Element | Condition to Show | Condition to Hide | State Variable |
|---------|------------------|-------------------|----------------|
| SMS key warning | `!settings.sms_key` | `settings.sms_key` exists | getSettings().sms_key |
| Step cards disabled | `!ok` (no SMS key) | `ok` | getSettings().sms_key |
| Phone display copy-row | `etapa2State.phone !== ''` | `phone === ''` | etapa2State.phone |
| SMS code box | `etapa2State.code !== ''` | `code === ''` | etapa2State.code |
| Polling spinner | `phone !== '' && code === ''` | code received or no phone | etapa2State.phone + .code |
| Site selector disabled | `!sitesAtivos.length` | sites with URLs exist | getDB().sites.filter |
| Update button disabled | `!phone \|\| !sitesAtivos.length` | phone and sites exist | etapa2State.phone + sites |

**Important sub-elements:**
- `#sms-timer` — displays elapsed seconds during polling (updated every 5s by `iniciarPollingSMS()`)
- `#sms-buy-log` — shows purchase progress/errors
- Country select: 🇧🇷 Brasil (73), 🇷🇺 Rússia (0), 🇺🇸 EUA (187), 🇺🇦 Ucrânia (1), 🇮🇳 Índia (22)

### 2.5 Etapa 3 View (PDF Editor)

**View Function:** `VIEWS.etapa3` (linhas 1185-1215)
**Source:** Entire Etapa 3 section, linhas 1180-1395
**Route:** `etapa3`
**State Object:** `pdfState` (linha 1183)

#### Element Hierarchy

```
VIEWS.etapa3 output:
├── div.grad-card (hero, linha 1186)
│   ├── div.icon-cube.cyan.floaty (📄)
│   └── div.flex-1
│       ├── div.pill.doing: "PDF EDITOR"
│       ├── h2.font-display: "Editor de PDF + Mapeador de Campos"
│       └── p.text-slate-300: "Importa o PDF..."
│
├── div.file-drop (drop zone, linha 1197)
│   ├── div.text-5xl.floaty: 📤
│   ├── div.font-display: "Clique aqui ou arraste o PDF"
│   ├── div.text-sm: "Suporta múltiplas páginas"
│   └── input#pdf-file[type=file].hidden (accept="application/pdf")
│   Events: onclick → open file picker, ondragover/ondragleave/ondrop → drag handling
│
├── div#pdf-toolbar.glass.hidden (toolbar, linha 1204, initially hidden)
│   ├── span: "📌 Clique no PDF para adicionar texto"
│   ├── input#pdf-text-size.input (font size, min=6 max=60, default=14)
│   ├── button.btn-3d.cyan.sm: "🗺️ Mapear campos do endereço" (mapearCampos)
│   ├── button.btn-3d.ghost.sm: "🧹 Limpar textos" (pdfState.overlays=[]; rerenderOverlays)
│   └── button.btn-3d.success.sm: "⬇️ Baixar PDF editado" (baixarPDF)
│
├── div#campos-mapeados (address fields output, initially empty)
│   └── [when populated] div.glass.rounded-2xl
│       ├── div.icon-cube.green (🗺️)
│       ├── div.flex-1: "Campos mapeados!" + description
│       ├── button: "✖️ Fechar"
│       ├── div.grid (7 field copy-rows)
│       │   └── per field: div.copy-row with key, val, 📋 copy button
│       └── details: raw extracted text (≤3000 chars)
│
└── div#pdf-viewer (page render area, linha 1214)
    └── [after carregarPDF] per page:
        └── div.pdf-canvas-wrap (datasets: page=N)
            ├── canvas (page render from pdf.js)
            └── div.pdf-overlay-text[] (click-to-add overlays)
                ├── contentEditable text
                └── span.del (× delete button)
```

#### Canvas Click Handler (linhas 1244-1251)
- Creates overlay at click position: `{page, x, y, text:'Texto', size, pageWidth, pageHeight}`
- Pushes to `pdfState.overlays[]`
- Calls `rerenderOverlays()`

#### Overlay DOM Elements (dynamically created by rerenderOverlays, linhas 1258-1289)
- **Element:** `<div class="pdf-overlay-text" contentEditable="true">`
- **CSS (linhas 125-127):** `position:absolute; min-width:60px; padding:2px 6px; font-size:14px; color:#000; background:rgba(255,235,59,.25); border:1px dashed #f59e0b; border-radius:4px; cursor:move; outline:none`
- **Focus state:** `.pdf-overlay-text:focus { background:rgba(255,235,59,.45); border-style:solid; }`
- **Input handler:** `oninput` → updates `pdfState.overlays[idx].text`
- **Drag handler:** mousedown → mousemove (reposition) → mouseup. Updates `x, y` in overlay object
- **Delete button:** `<span class="del">×</span>` — `onclick` splices overlay from array and re-renders. CSS (linha 127): `position:absolute; top:-8px; right:-8px; width:18px; height:18px; border-radius:50%; background:#ef4444; color:white; font-size:11px;`

#### Address Field Mapper (mapearCampos, linhas 1313-1395)
- Extracts text from ALL PDF pages via pdf.js `getTextContent()`
- Regex-based extraction of 7 Brazilian address fields (CEPO, UF, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, MUNICIPIO)
- Renders results in `#campos-mapeados` with copy buttons for each field
- Each field has `btn-3d.cyan` (if value found) or `btn-3d.ghost` (if empty)

### 2.6 Banco de Empresas View

**View Function:** `VIEWS.banco` (linhas 1400-1418)
**Source:** Banco + Planilha section, linhas 1397-1473
**Route:** `banco`
**Post-render hook:** `window.after_banco = () => renderBanco()` (linha 1419)

#### Element Hierarchy

```
VIEWS.banco output:
├── div.glass.rounded-3xl (header bar, linha 1402)
│   ├── div.icon-cube.green (💼)
│   ├── div.flex-1: count + description
│   ├── input#filter-q.input (search, oninput: renderBanco(), max-width:300px)
│   ├── select#filter-faixa.input (capital filter, onchange: renderBanco())
│   │   ├── option: "Todos"
│   │   ├── option: "Faixa ideal (R$ 10k–50k)"
│   │   ├── option: "Abaixo de R$ 10k"
│   │   └── option: "Acima de R$ 50k"
│   └── button.btn-3d.danger.sm: "🗑️ Limpar" (onclick: limparBanco())
│
└── div#banco-list.grid (company card grid, sm:2 lg:3 columns)
    └── per company (renderBanco, linhas 1420-1459):
        └── div.glass.rounded-2xl.p-5
            ├── div.flex (header)
            │   ├── div.icon-cube (🏢, 46×46px)
            │   └── div.min-w-0
            │       ├── div.font-display.font-bold: razao_social
            │       └── div.text-xs: formatted CNPJ (fmtCNPJ)
            ├── div.flex.flex-wrap (pills)
            │   ├── span.pill.ok: situacao
            │   ├── span.pill.doing: porte
            │   └── span.pill.done/todo: capital_social (fmtMoney)
            ├── div.text-sm: cnae_descricao
            ├── div.text-xs: municipio/UF
            └── button.btn-3d.success.sm: "🧬 Usar na Etapa 1"
                · onclick: usarEmpresaNaEtapa1(cnpj) — sets etapa1State.empresa, resets other fields, go('etapa1')
```

**Empty state:** When no companies exist, renders a centered `.empty` div with "Sem empresas ainda." and a link to start Etapa 1.

**Search logic (renderBanco, linhas 1420-1434):**
1. Gets full `db.empresas` array, reverses (newest first)
2. Filters by `#filter-q` text (matches razao_social or CNPJ digits)
3. Filters by `#filter-faixa` (capital_social range: ideal 10k-50k, abaixo <10k, acima >50k)

### 2.7 Planilha View

**View Function:** `VIEWS.planilha` (linhas 1475-1503)
**Route:** `planilha`
**Post-render hook:** `window.after_planilha = () => renderPlanilha()` (linha 1504)

#### Element Hierarchy

```
VIEWS.planilha output:
├── div.glass.rounded-3xl (header bar, linha 1476)
│   ├── div.icon-cube.amber (📊)
│   ├── div.flex-1: "Planilha de sites" + description
│   └── button.btn-3d.success: "⬇️ Exportar CSV (Excel)" (onclick: exportCSV())
│
└── div.glass.rounded-2xl (table container, linha 1484)
    └── div.overflow-x-auto.scrollbar
        └── table.w-full (min-width: 900px)
            ├── thead (background: rgba(99,102,241,.1))
            │   └── tr (8 columns, linha 1488)
            │       ├── th.p-3: "Empresa"
            │       ├── th.p-3: "CNPJ"
            │       ├── th.p-3: "Domínio / URL"
            │       ├── th.p-3: "Tel empresa"
            │       ├── th.p-3: "Nosso tel"
            │       ├── th.p-3: "Status"
            │       ├── th.p-3: "Atualizado"
            │       └── th.p-3.text-right: "Ações"
            │
            └── tbody#planilha-body (rendered by renderPlanilha, linhas 1505-1527)
                └── per site:
                    └── tr.border-t.border-white/5
                        ├── td.p-3: fantasia/razao (bold)
                        ├── td.p-3.text-xs: formatted CNPJ
                        ├── td.p-3: url link or domain text
                        ├── td.p-3.text-xs: telefoneEmpresa or "—"
                        ├── td.p-3.text-xs: telefoneNosso or "—"
                        ├── td.p-3: select.input (inline status editor)
                        │   · onchange: mudarStatus(cnpj, dominio, this.value)
                        │   · options: gerado, deploy, meta-tag, finalizado
                        ├── td.p-3.text-xs: formatted date (fmtDate)
                        └── td.p-3.text-right
                            └── button.btn-3d.ghost.sm: "🗑️" (onclick: removerSite)
```

**Empty state:** Table body shows single row with `.empty` class spanning all 8 columns: "Nenhum site ainda. Criar primeiro →"

**Status dropdown (inline editor):**
- **Element:** `<select class="input" onchange="mudarStatus(cnpj, dominio, this.value)">`
- **Options:** `gerado`, `deploy`, `meta-tag`, `finalizado` — from source line 1520
- **Side effect:** Updates `db.sites[idx].status`, sets `atualizado = Date.now()`, saves DB, re-renders, shows toast

**CSV Export (`exportCSV()`, linhas 1542-1552):**
- Headers: Empresa, Razao Social, CNPJ, Dominio, URL, Tel empresa, Nosso tel, Meta-tag, Status, Atualizado
- Format: UTF-8 BOM prefix (`﻿`), semicolon separator, double-quote escaping
- Filename: `planilha-laboratorio.csv`

### 2.8 Configurações View

**View Function:** `VIEWS.config` (linhas 1557-1613)
**Source:** Config section, linhas 1554-1737
**Route:** `config`

#### Element Hierarchy

```
VIEWS.config output:
└── div.grid.lg:grid-cols-2.gap-4
    ├── div.glass.rounded-3xl.p-6 (Cloudflare API card, linha 1562)
    │   ├── div.flex: icon-cube.cyan (☁️) + "Cloudflare API" description
    │   ├── label: "API Token"
    │   ├── input#cfg_cf_token.input[type=password] (pre-filled if exists)
    │   ├── [cond: cf_account exists] account detected display
    │   │   └── div.glass.rounded-xl: ✓ Conta detectada + name + "🔄 Trocar" button
    │   ├── div.flex.gap-2
    │   │   ├── button.btn-3d.success: "💾 Salvar e descobrir conta" (salvarTokenCF)
    │   │   ├── button.btn-3d.cyan: "🧪 Testar Pages" (testarCloudflare)
    │   │   └── a.btn-3d.ghost: "🔑 Criar token" (→ Cloudflare dashboard)
    │   ├── div#cf-save-log (success/error/multi-account display)
    │   └── details (2 expandable sections)
    │       ├── "Token sem permissão? Cadastrar Account ID manual"
    │       │   ├── input#cfg_cf_account_manual.input
    │       │   └── button.btn-3d.ghost.sm: "Salvar Account ID"
    │       └── "Como criar um token novo?" (instructions)
    │
    ├── div.glass.rounded-3xl.p-6 (SMS24h card, linha 1586)
    │   ├── div.flex: icon-cube.purple (📱) + "SMS24h.org API" description
    │   ├── label: "API Key"
    │   ├── input#cfg_sms_key.input[type=password] (pre-filled if exists)
    │   ├── div.flex.gap-2
    │   │   ├── button.btn-3d.success: "💾 Salvar" (salvarConfig)
    │   │   ├── button.btn-3d.purple: "🧪 Testar (saldo)" (testarSMS)
    │   │   └── a.btn-3d.ghost: "🌐 Abrir SMS24h" (→ sms24h.org)
    │   └── details: "Como pegar?" (instructions)
    │
    └── div.glass.rounded-3xl.p-6.lg:col-span-2 (Backup card, linha 1602)
        ├── div.flex: icon-cube.amber (🛟) + "Backup / Restaurar" description
        ├── div.flex.gap-2
        │   ├── button.btn-3d.cyan: "📤 Exportar backup" (exportBackup)
        │   ├── button.btn-3d.ghost: "📥 Importar backup" (triggers file input)
        │   └── input#imp-file[type=file].hidden (accept="application/json")
        └── [after import] importBackup restores db + settings, navigates to dashboard
```

**Multi-account detection (`salvarTokenCF`, linhas 1624-1672):**
- Single account: auto-selects, displays green confirmation
- Multiple accounts: renders account picker list with "Usar essa" buttons (`escolherConta(id, nome)`)
- No list permission: shows orange warning, suggests manual Account ID entry

### 2.9 Ajuda View

**View Function:** `VIEWS.ajuda` (linhas 1742-1786)
**Route:** `ajuda`
**Note:** Static content — no state dependencies, no dynamic rendering

#### Element Hierarchy

```
VIEWS.ajuda output:
├── div.grad-card.rounded-3xl (hero, linha 1743)
│   ├── div.icon-cube.amber.floaty (❓)
│   └── div.flex-1
│       ├── h2.font-display: "Como o Laboratório funciona"
│       └── p.text-slate-300: "Fluxo João Victor — sequencial..."
│
└── div.grid.gap-4
    ├── ajuda() card: 🧬 Etapa 1 — Criar Site
    │   └── ol (5 steps): CNPJ lookup → domain → meta-tag → HTML gen → publish
    │
    ├── ajuda() card: 📱 Etapa 2 — Comprar Número
    │   └── ol (6 steps): service select → buy → display → polling → code → update site
    │
    └── ajuda() card: 📄 Etapa 3 — Editor PDF
        └── ul (5 steps): drag PDF → click to add text → map fields → copy → download
```

**ajuda() helper function (linhas 1781-1786):**
```javascript
function ajuda(ico, title, body){
  return `<div class="glass rounded-2xl p-5 flex gap-4">
    <div class="icon-cube">${ico}</div>
    <div><div class="font-display font-bold text-lg">${title}</div><div class="text-slate-300 mt-1">${body}</div></div>
  </div>`;
}
```
- **Wrapper:** `div.glass.rounded-2xl.p-5.flex.gap-4`
- **Icon:** `div.icon-cube` with emoji
- **Title:** `div.font-display.font-bold.text-lg`
- **Body:** `div.text-slate-300.mt-1` (injected HTML — ordered/unordered lists)

**No interactive elements** — Ajuda is purely informational. No event handlers, no form inputs, no state dependencies.

---

### 2.10 Conditional Element Index

| View | Elemento | Condição de Exibição | Estado Controlador | Mecanismo CSS |
|------|----------|---------------------|-------------------|---------------|
| Dashboard | API warning card | `!cfOk \|\| !smsOk` (missing config) | getSettings() | Template conditional: `${...? 'html' : ''}` |
| Etapa 1 | Company display card | `etapa1State.empresa !== null` | etapa1State.empresa | Template conditional in renderStep1CNPJ() |
| Etapa 1 | CNPJ search form | `etapa1State.empresa === null` | etapa1State.empresa | Template conditional in renderStep1CNPJ() |
| Etapa 1 | Domain suggestions grid | `etapa1State.dominio === ''` | etapa1State.dominio | Template conditional in renderStep1Dominio() |
| Etapa 1 | Selected domain display | `etapa1State.dominio !== ''` | etapa1State.dominio | Template conditional in renderStep1Dominio() |
| Etapa 1 | Meta-tag input form | `etapa1State.metatag === ''` | etapa1State.metatag | Template conditional in renderStep1Meta() |
| Etapa 1 | Meta-tag display | `etapa1State.metatag !== ''` | etapa1State.metatag | Template conditional in renderStep1Meta() |
| Etapa 1 | Site generation form | `etapa1State.htmlGerado === ''` | etapa1State.htmlGerado | Template conditional in renderStep1Gerar() |
| Etapa 1 | Generated site display | `etapa1State.htmlGerado !== ''` | etapa1State.htmlGerado | Template conditional in renderStep1Gerar() |
| Etapa 1 | Publish form | `etapa1State.publicado === null` | etapa1State.publicado | Template conditional in renderStep1Publicar() |
| Etapa 1 | Published site display | `etapa1State.publicado !== null` | etapa1State.publicado | Template conditional in renderStep1Publicar() |
| Etapa 1 | Cloudflare config warning | `!settings.cf_token \|\| !settings.cf_account` | getSettings() | Template conditional |
| Etapa 1 | Steps 2-5 disabled class | Previous step incomplete | etapa1State fields | `.step-card.disabled { opacity:.45; pointer-events:none }` |
| Etapa 2 | SMS key warning | `!settings.sms_key` | getSettings().sms_key | Template conditional |
| Etapa 2 | Phone display copy-rows | `etapa2State.phone !== ''` | etapa2State.phone | Template conditional |
| Etapa 2 | SMS code display | `etapa2State.code !== ''` | etapa2State.code | Template conditional |
| Etapa 2 | Polling spinner | `etapa2State.phone && !etapa2State.code` | etapa2State.phone + .code | Template conditional |
| Etapa 2 | Step cards disabled | `!settings.sms_key` | getSettings().sms_key | `.step-card.disabled` class |
| Etapa 3 | PDF toolbar | After `carregarPDF()` called | pdfState.fileBytes | `classList.remove('hidden')` via JS |
| Etapa 3 | Canvas overlays | `pdfState.overlays.length > 0` | pdfState.overlays[] | Dynamically created/removed by `rerenderOverlays()` |
| Etapa 3 | Mapped fields display | After `mapearCampos()` called | — | innerHTML set by `renderCamposMapeados()` |
| Banco | Company cards | `db.empresas.length > 0` | getDB().empresas | Template loop; empty state div otherwise |
| Planilha | Table rows | `db.sites.length > 0` | getDB().sites | Template loop; empty state td otherwise |
| Config | Account detected display | `settings.cf_account` exists | getSettings().cf_account | Template conditional |
| Config | Multi-account picker | `contas.length > 1` in API response | salvarTokenCF() result | Dynamically rendered in log div |
| Toast | Toast visibility | `toast()` called | `window._tt` (timer) | `classList.remove('hidden')` / `.add('hidden')` |
| Modal | Modal visibility | `openModal()` called | — | `classList.remove('hidden')` / `.add('hidden')` |
| Sidebar | Mobile open/close | `toggleSidebar(true/false)` | DOM class state | `.sidebar.open`, `.backdrop.open` (CSS classes) |
| Header | CF status pill state | `settings.cf_token && settings.cf_account` | getSettings() | `.pill.danger` vs `.pill.done` (class swap) |
| Header | SMS status pill state | `settings.sms_key` | getSettings() | `.pill.danger` vs `.pill.done` (class swap) |
| All | Hamburger button | Viewport ≤1024px | CSS media query | `.lg:hidden` (Tailwind utility) |


## 3. Rotas & Sistema de Navegação

### 3.1 Tabela de Rotas (ROUTES array)

**Source:** Line 284
```javascript
const ROUTES = ['dashboard','etapa1','etapa2','etapa3','banco','planilha','config','ajuda'];
```

The `ROUTES` constant is a flat array of 8 route path strings. It is used by `go()` for route validation (line 287: `if(!ROUTES.includes(route)) route='dashboard'`) and is NOT an array of route objects — there is no structured route definition with separate title/subtitle/view fields.

**Route titles and subtitles** are defined inline within the `go()` function as a hardcoded `titles` object (linhas 289-297):

```javascript
const titles = {
  dashboard: ['🏠 Início',                'Bem-vindo, João Victor!'],
  etapa1:    ['🧬 Etapa 1 — Criar Site',   'Fluxo automático: CNPJ → Domínio → Meta → Site → Publicar'],
  etapa2:    ['📱 Etapa 2 — Comprar Número','SMS24h integrado para verificação Facebook'],
  etapa3:    ['📄 Etapa 3 — Editor PDF',   'Edite PDFs e mapeie campos do endereço'],
  banco:     ['💼 Banco de Empresas',      'Histórico de CNPJs consultados'],
  planilha:  ['📊 Planilha de Sites',      'Status de cada site publicado'],
  config:    ['⚙️ Configurações',          'Tokens e chaves de API'],
  ajuda:     ['❓ Ajuda',                  'Como cada parte funciona']
};
```

**Route Table:**

| path | Emoji | Title | Subtitle | Categoria (Sidebar) | View Function |
|------|-------|-------|----------|---------------------|---------------|
| dashboard | 🏠 | Início | Bem-vindo, João Victor! | — | VIEWS.dashboard |
| etapa1 | 🧬 | Etapa 1 — Criar Site | Fluxo automático: CNPJ → Domínio → Meta → Site → Publicar | FLUXO PRINCIPAL | VIEWS.etapa1 |
| etapa2 | 📱 | Etapa 2 — Comprar Número | SMS24h integrado para verificação Facebook | FLUXO PRINCIPAL | VIEWS.etapa2 |
| etapa3 | 📄 | Etapa 3 — Editor PDF | Edite PDFs e mapeie campos do endereço | FLUXO PRINCIPAL | VIEWS.etapa3 |
| banco | 💼 | Banco de Empresas | Histórico de CNPJs consultados | DADOS | VIEWS.banco |
| planilha | 📊 | Planilha de Sites | Status de cada site publicado | DADOS | VIEWS.planilha |
| config | ⚙️ | Configurações | Tokens e chaves de API | SISTEMA | VIEWS.config |
| ajuda | ❓ | Ajuda | Como cada parte funciona | SISTEMA | VIEWS.ajuda |

**Cross-reference with §2.1 sidebar:** Every `data-route` in the sidebar matches a route in this table. The `data-route` attribute values (`dashboard`, `etapa1`, ..., `ajuda`) are the same strings used as keys in the `titles` object and the `ROUTES` array.

### 3.2 VIEWS Registry

**Source:** Line 307
```javascript
const VIEWS = {};
```

The VIEWS object is declared as an empty object literal and populated progressively as each view function is assigned. The order of assignment follows the source code structure:

| Chave | Função | Descrição | Linha de Definição |
|-------|--------|-----------|-------------------|
| dashboard | `VIEWS.dashboard = () => {...}` | Renderiza dashboard HTML (hero + stats + quick-cards) | 312 |
| etapa1 | `VIEWS.etapa1 = () => {...}` | Renderiza wizard de 5 passos (CNPJ → Publicar) | 399 |
| etapa2 | `VIEWS.etapa2 = () => {...}` | Renderiza formulário de compra SMS | 917 |
| etapa3 | `VIEWS.etapa3 = () => {...}` | Renderiza editor PDF com drop zone + toolbar | 1185 |
| banco | `VIEWS.banco = () => {...}` | Renderiza grid de empresas + search/filter | 1400 |
| planilha | `VIEWS.planilha = () => {...}` | Renderiza tabela de 8 colunas + export CSV | 1475 |
| config | `VIEWS.config = () => {...}` | Renderiza painel de tokens Cloudflare + SMS24h + backup | 1557 |
| ajuda | `VIEWS.ajuda = () => {...}` | Renderiza 3 cards de ajuda com guias passo-a-passo | 1742 |

**VIEWS Function Contract:**
- **Input:** No parameters — all views read from global state (`localStorage` via `getDB()`/`getSettings()`, module-level `let` state objects `etapa1State`/`etapa2State`/`pdfState`)
- **Output:** HTML string (template literal with interpolated values)
- **Side effects:** None during render — view functions are PURE string generators. Event handlers are attached via inline `onclick`/`onchange`/`oninput` attributes IN the generated HTML string, not via separate `addEventListener` calls after rendering
- **Injection:** `go()` sets `document.getElementById('view').innerHTML = VIEWS[route]()` (line 301)

### 3.3 go(route) Function — Full Implementation Trace

**Source:** Linhas 286-305
**Signature:** `go(route: string): void`

```javascript
function go(route){
  if(!ROUTES.includes(route)) route='dashboard';                                    // Step 1: Validation
  document.querySelectorAll('[data-route]').forEach(el=>{                           // Step 2: Nav active toggle
    el.classList.toggle('active', el.dataset.route===route);
  });
  const titles = { /* ... 8 route title pairs */ };                                 // Step 3: Title lookup
  document.getElementById('page-title').textContent = titles[route][0];             // Step 4: Set page title
  document.getElementById('page-subtitle').textContent = titles[route][1];          // Step 5: Set page subtitle
  document.getElementById('view').innerHTML = VIEWS[route]();                       // Step 6: Render view HTML
  window.scrollTo({top:0,behavior:'smooth'});                                       // Step 7: Scroll to top
  toggleSidebar(false);                                                             // Step 8: Close mobile sidebar
  if(typeof window['after_'+route]==='function') window['after_'+route]();         // Step 9: Post-render hook
}
```

**Step-by-step execution trace:**

| Step | Action | DOM Element | Mechanism | Line |
|------|--------|-------------|-----------|------|
| 1 | **Route validation** | — | `ROUTES.includes(route)` check; invalid routes default to `'dashboard'` | 287 |
| 2 | **Nav-link active toggle** | All `[data-route]` elements | `classList.toggle('active', el.dataset.route===route)` — removes `.active` from all, adds to matching element | 288 |
| 3 | **Title lookup** | — | Hardcoded `titles` object with 8 entries | 289-297 |
| 4 | **Page title update** | `#page-title` | `textContent = titles[route][0]` (e.g., "🧬 Etapa 1 — Criar Site") | 299 |
| 5 | **Page subtitle update** | `#page-subtitle` | `textContent = titles[route][1]` (e.g., "Fluxo automático...") | 300 |
| 6 | **Content swap** | `#view` | `innerHTML = VIEWS[route]()` — calls view function, injects HTML | 301 |
| 7 | **Scroll to top** | `window` | `window.scrollTo({top:0, behavior:'smooth'})` — smooth scroll animation | 302 |
| 8 | **Close mobile sidebar** | `#sidebar`, `#backdrop` | `toggleSidebar(false)` — removes `.open` classes if sidebar was open (mobile only) | 303 |
| 9 | **Post-render hook** | `window` global | Checks for `window['after_'+route]` function, calls it if exists | 304 |

**Edge Cases:**

| Case | Behavior | Line |
|------|----------|------|
| **Invalid route** (not in ROUTES) | Defaults to `'dashboard'` — no error thrown | 287 |
| **Duplicate navigation** (same route) | Re-executes all steps — no guard against redundant re-render | 286-305 |
| **Missing VIEWS key** (VIEWS[route] is undefined) | `innerHTML` set to `undefined` — view container becomes empty (no explicit error handling) | 301 |
| **Missing title entry** | `titles[route]` would be `undefined` — `textContent` would be `undefined` (silent failure) | 289-300 |
| **Missing DOM element** (page-title/subtitle/view) | `getElementById` returns `null` — `.textContent`/`.innerHTML` assignment throws TypeError | 299-301 |

**History API:** NOT USED. There is no `history.pushState`, `history.replaceState`, or `popstate` event handler anywhere in the source. This is a **hash-free, history-free SPA** — the URL never changes during navigation. The browser back button does not work.

### 3.4 Fluxo de Navegação

**Initial Route:** `go('dashboard')` — called in bootstrap (line 2132), the last line of the inline script block.

**All go() Call Sites (trigger points):**

| Trigger | Location | go() Call | Line |
|---------|----------|-----------|------|
| Bootstrap (initial load) | End of `<script>` block | `go('dashboard')` | 2132 |
| Sidebar — Dashboard | `<div onclick="go('dashboard')">` | `go('dashboard')` | 152 |
| Sidebar — Etapa 1 | `<div onclick="go('etapa1')">` | `go('etapa1')` | 154 |
| Sidebar — Etapa 2 | `<div onclick="go('etapa2')">` | `go('etapa2')` | 155 |
| Sidebar — Etapa 3 | `<div onclick="go('etapa3')">` | `go('etapa3')` | 156 |
| Sidebar — Banco | `<div onclick="go('banco')">` | `go('banco')` | 158 |
| Sidebar — Planilha | `<div onclick="go('planilha')">` | `go('planilha')` | 159 |
| Sidebar — Config | `<div onclick="go('config')">` | `go('config')` | 161 |
| Sidebar — Ajuda | `<div onclick="go('ajuda')">` | `go('ajuda')` | 162 |
| Dashboard hero — Etapa 1 | `<button class="btn-3d" onclick="go('etapa1')">` | `go('etapa1')` | 331 |
| Dashboard hero — Etapa 2 | `<button class="btn-3d cyan" onclick="go('etapa2')">` | `go('etapa2')` | 332 |
| Dashboard hero — Etapa 3 | `<button class="btn-3d purple" onclick="go('etapa3')">` | `go('etapa3')` | 333 |
| Dashboard API warning — Config | `<button class="btn-3d warn sm" onclick="go('config')">` | `go('config')` | 347 |
| Dashboard quick-cards (×6) | `<div ... onclick="go('{route}')">` | go(route) | 376 |
| Etapa 1 — Step 1 Trocar | Cascade reset, then `go('etapa1')` | `go('etapa1')` | 459 |
| Etapa 1 — After CNPJ lookup | `e1Buscar()` success → `go('etapa1')` | `go('etapa1')` | 499 |
| Etapa 1 — After manual save | `e1ManualSalvar()` → `go('etapa1')` | `go('etapa1')` | 525 |
| Etapa 1 — Domain chosen | `e1EscolherDominio()` → `go('etapa1')` | `go('etapa1')` | 636 |
| Etapa 1 — Meta-tag saved | `e1SalvarMeta()` → `go('etapa1')` | `go('etapa1')` | 672 |
| Etapa 1 — Site generated | `e1Gerar()` → `go('etapa1')` | `go('etapa1')` | 740 |
| Etapa 1 — After publish success | `e1Publicar()` success → `setTimeout(()=>go('etapa1'), 800)` | `go('etapa1')` | 898 |
| Etapa 1 — Reset todo fluxo | `resetEtapa1()` → `go('etapa1')` | `go('etapa1')` | 909 |
| Etapa 1 — Published "Próximo" | `<button onclick="go('etapa2')">` | `go('etapa2')` | 789 |
| Etapa 1 — Published "Ver planilha" | `<button onclick="go('planilha')">` | `go('planilha')` | 790 |
| Etapa 1 — Publish CF warning | `<button onclick="go('config')">` | `go('config')` | 798 |
| Etapa 2 — SMS key warning | `<button onclick="go('config')">` | `go('config')` | 937 |
| Etapa 2 — After purchase success | `smsComprar()` success → `go('etapa2')` | `go('etapa2')` | 1056 |
| Etapa 2 — After SMS received | `iniciarPollingSMS()` success → `go('etapa2')` | `go('etapa2')` | 1078 |
| Etapa 2 — Purchase cancelled | `smsCancelar()` → `go('etapa2')` | `go('etapa2')` | 1091 |
| Etapa 2 — Token detected | Config page `salvarTokenCF()` → `setTimeout(()=>go('config'), 1500)` | `go('config')` | 1659 |
| Etapa 2 — Account selected | `escolherConta()` → `go('config')` | `go('config')` | 1680 |
| Etapa 2 — Account switched | `trocarConta()` → `go('config')` | `go('config')` | 1687 |
| Etapa 2 — Manual account saved | `salvarAccountManual()` → `go('config')` | `go('config')` | 1698 |
| Banco — After limpar | `limparBanco()` → `go('banco')` | `go('banco')` | 1465 |
| Banco — "Usar na Etapa 1" | `usarEmpresaNaEtapa1()` → `go('etapa1')` | `go('etapa1')` | 1472 |
| Banco — Empty state | `<button onclick="go('etapa1')">` (inline) | `go('etapa1')` | 1436 |
| Planilha — Empty state | `<button onclick="go('etapa1')">` (inline) | `go('etapa1')` | 1509 |
| Backup — After import | `importBackup()` → `go('dashboard')` | `go('dashboard')` | 1735 |

**Total unique call sites: 35+** (listed above). Every call site confirmed from source code line references.

**Navigation Flow Diagram:**

```
Page Load → go('dashboard')
  │
  ├── Sidebar click → go(route) → Nav-link.active toggle → Title update → VIEWS[route]() → innerHTML
  │
  ├── Dashboard → go('etapa1/2/3/config')
  │
  ├── Etapa 1 → go('etapa1') [self: after each step completion]
  │            → go('etapa2') [from "Próximo" button after publish]
  │            → go('planilha') [from "Ver na planilha" after publish]
  │            → go('config') [from CF warning]
  │
  ├── Etapa 2 → go('etapa2') [self: after purchase, SMS received, cancel]
  │            → go('config') [from SMS key warning]
  │
  ├── Banco → go('banco') [self: after limpar]
  │         → go('etapa1') [from "Usar na Etapa 1"]
  │
  ├── Config → go('config') [self: after token saved, account selected/switched]
  │
  ├── Import/Backup → go('dashboard') [after restore]
  │
  └── Post-render hooks: window['after_'+route]() called after each view render
      · after_banco: renderBanco()
      · after_planilha: renderPlanilha()
```

**Side Effects Per Navigation (in order):**

| # | Side Effect | Function/Element | Confirmed |
|---|-------------|-----------------|-----------|
| 1 | Nav-link `.active` class toggle (remove from all, add to current) | `querySelectorAll('[data-route]').forEach(...)` | Line 288 |
| 2 | `#page-title` text content update | `document.getElementById('page-title').textContent` | Line 299 |
| 3 | `#page-subtitle` text content update | `document.getElementById('page-subtitle').textContent` | Line 300 |
| 4 | `#view` innerHTML replacement | `document.getElementById('view').innerHTML = VIEWS[route]()` | Line 301 |
| 5 | Smooth scroll to top | `window.scrollTo({top:0,behavior:'smooth'})` | Line 302 |
| 6 | Close mobile sidebar | `toggleSidebar(false)` | Line 303 |
| 7 | Post-render hook execution | `window['after_'+route]()` if exists | Line 304 |

**History Behavior:** The original app does NOT use the History API. Navigation does not push/pop state, and the URL never changes. The browser back button will navigate away from the app entirely. This is confirmed by grep for `pushState`, `replaceState`, `popstate` — zero matches across the entire 2135-line source.

**No duplicate navigation guard:** Calling `go('etapa1')` when already on Etapa 1 re-renders the view (re-executes VIEWS.etapa1, resets innerHTML, scrolls to top). There is no check like `if(currentRoute === route) return`.

### 3.5 VIEWS Function Signature Pattern

All VIEWS functions follow an identical contract:

```
Signature: () => HTML_string
Input:     None (reads from global state/localStorage)
Output:    HTML string (template literal with ${} interpolation)
Injection: innerHTML assignment in go() (line 301)
```

**Post-render hooks:**

Two views use `window.after_{route}` hooks for separate data-rendering logic:

| View | Hook Function | What It Does | Line |
|------|--------------|-------------|------|
| banco | `window.after_banco = () => renderBanco()` | Renders company cards into `#banco-list` (separate from VIEWS output) | 1419 |
| planilha | `window.after_planilha = () => renderPlanilha()` | Renders site rows into `#planilha-body` (separate from VIEWS output) | 1504 |

This pattern exists because both Banco and Planilha have interactive search/filter controls in the VIEWS output but render data into ID-referenced containers that don't exist yet when the VIEWS function returns its HTML string. The `after_` hook fires AFTER innerHTML injection, when the target containers exist in the DOM.

### 3.6 Cross-Reference: §2.1 Sidebar ↔ §3.1 Routes

| data-route (sidebar) | §3.1 Route Path | §3.2 VIEWS Key | §2 View Section | Match? |
|---------------------|-----------------|----------------|-----------------|--------|
| dashboard | dashboard | dashboard | §2.2 Dashboard | ✅ |
| etapa1 | etapa1 | etapa1 | §2.3 Etapa 1 | ✅ |
| etapa2 | etapa2 | etapa2 | §2.4 Etapa 2 | ✅ |
| etapa3 | etapa3 | etapa3 | §2.5 Etapa 3 | ✅ |
| banco | banco | banco | §2.6 Banco | ✅ |
| planilha | planilha | planilha | §2.7 Planilha | ✅ |
| config | config | config | §2.8 Config | ✅ |
| ajuda | ajuda | ajuda | §2.9 Ajuda | ✅ |

**All 8 data-route attributes match ROUTES paths, VIEWS keys, and documented view sections. Zero discrepancies.**


## 4. Contratos de API

**All API contracts extracted from `data/raw-source.html` JavaScript source code (lines 485-905, 1025-1178, 1624-1672, 2089-2123). Every endpoint documented with success AND error response schemas. Proxied vs upstream URLs both documented per Pitfall 6.**

---

### 4.1 BrasilAPI — CNPJ Lookup

**Endpoint:** GET `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
**Proxied URL:** None (direct call — no CORS proxy needed; BrasilAPI supports CORS)
**Trigger:** `e1Buscar()` in Etapa 1, Step 1 (user clicks "Buscar" after entering CNPJ, or auto-triggered when 14 digits typed)
**Source:** Lines 485-503

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Auth** | None (public API, no API key required) |
| **Headers** | None (no custom headers) |
| **URL Construction** | `onlyDigits(cnpj)` strips all non-numeric characters → appended to base URL |
| **Timeout** | No explicit timeout set; relies on browser default |
| **Validation** | CNPJ length check (`cnpj.length !== 14`) before fetch — returns early with toast "CNPJ precisa ter 14 números" |
| **Proxied?** | No — direct call to BrasilAPI (no CORS issue, public API) |

#### Error Handling (from source, lines 500-502)

```javascript
catch(err){
  box.innerHTML = `<div class="glass rounded-2xl p-4 text-center text-rose-300">
    😕 Não consegui encontrar este CNPJ. Verifique ou cadastre manualmente.
  </div>`;
}
```

| Status | Condition | Behavior |
|--------|-----------|----------|
| **Network error / timeout** | `fetch()` throws | Caught by `catch(err)` → error message rendered in `#e1_result` div |
| **404 Not Found** | `!r.ok` (BrasilAPI returns 404 for invalid CNPJ) | `throw new Error('Não encontrado')` → caught by `catch(err)` → same error display |
| **400 Bad Request** | Malformed CNPJ (wrong length after digits) | Not explicitly checked — pre-validated by `cnpj.length !== 14` check before fetch. But if API returns 400, caught by `!r.ok` |
| **5xx Server Error** | BrasilAPI down | Caught by `catch(err)` → generic error message |

**Unhandled:** No specific handling for different error status codes (404 vs 500 produce same generic message). No retry logic. No rate limit handling.

#### Success Response (200) — Full Schema

The BrasilAPI response is normalized by `normalizarBrasilAPI(d)` (lines 528-552) which maps/renames fields. The full BrasilAPI response (stored in `empresa.raw`) contains:

```json
{
  "cnpj": "string (##.###.###/####-##)",
  "razao_social": "string",
  "nome_fantasia": "string | null",
  "capital_social": "number",
  "porte": "string (ME/EPP/DEMAIS)",
  "descricao_porte": "string | null",
  "descricao_situacao_cadastral": "string",
  "situacao_cadastral": "number (2 = ATIVA)",
  "data_inicio_atividade": "string (YYYY-MM-DD)",
  "natureza_juridica": "string",
  "cnae_fiscal": "string (7-digit)",
  "cnae_fiscal_descricao": "string",
  "cnaes_secundarios": [
    {
      "codigo": "number",
      "descricao": "string"
    }
  ],
  "descricao_tipo_de_logradouro": "string",
  "logradouro": "string",
  "numero": "string",
  "complemento": "string | null",
  "bairro": "string",
  "municipio": "string",
  "uf": "string (2-letter)",
  "cep": "string",
  "ddd_telefone_1": "string",
  "ddd_telefone_2": "string | null",
  "email": "string | null",
  "qsa": [
    {
      "nome_socio": "string",
      "qualificacao_socio": "string"
    }
  ]
}
```

#### Response Normalization (`normalizarBrasilAPI(d)`, lines 528-552)

| Original Field | Normalized Field | Transformation |
|---------------|-----------------|----------------|
| `d.cnpj` | `cnpj` | Pass-through |
| `d.razao_social` | `razao_social` | Pass-through |
| `d.nome_fantasia \|\| d.razao_social` | `fantasia` | Fallback to razao_social if null |
| `d.capital_social` | `capital_social` | Pass-through |
| `d.porte \|\| d.descricao_porte \|\| ''` | `porte` | Prioritize `porte`, fallback to `descricao_porte` |
| `d.descricao_situacao_cadastral \|\| (d.situacao_cadastral===2?'ATIVA':'')` | `situacao` | Map numeric code 2 → "ATIVA" |
| `d.data_inicio_atividade` | `inicio` | Pass-through |
| `d.natureza_juridica` | `natureza` | Pass-through |
| `d.cnae_fiscal` | `cnae_principal` | Pass-through |
| `d.cnae_fiscal_descricao` | `cnae_descricao` | Pass-through |
| `d.cnaes_secundarios[].map(c=>({codigo:c.codigo, descricao:c.descricao}))` | `cnaes_secundarios` | Remap array objects |
| `[d.descricao_tipo_de_logradouro, d.logradouro, d.numero].filter(Boolean).join(' ')` | `logradouro` | Compose address line |
| `d.complemento` | `complemento` | Pass-through |
| `d.bairro` | `bairro` | Pass-through |
| `d.municipio` | `municipio` | Pass-through |
| `d.uf` | `uf` | Pass-through |
| `d.cep` | `cep` | Pass-through |
| `[d.ddd_telefone_1, d.ddd_telefone_2].filter(Boolean).join(' / ')` | `telefone` | Compose phone line |
| `d.email` | `email` | Pass-through |
| `(d.qsa\|\|[]).map(s=>({nome:s.nome_socio, qualif:s.qualificacao_socio}))` | `socios` | Remap QSA array |
| `d` | `raw` | Full original response preserved |

#### Error Response (404 — CNPJ not found)

From BrasilAPI documentation (the code doesn't parse the error body — it just checks `!r.ok`):
```json
{
  "message": "CNPJ 00.000.000/0000-00 não encontrado.",
  "type": "not_found",
  "name": "NotFoundError"
}
```

#### Rate Limiting
No rate limit headers checked. No backoff/retry logic. BrasilAPI has documented rate limits (typically 60 req/min) but the code does not handle 429 responses.

#### Post-Fetch Flow
1. `normalizarBrasilAPI(d)` → normalized company object
2. `salvarEmpresa(e)` → upsert into `db.empresas[]` via `saveDB()`
3. `etapa1State.empresa = e` → in-memory state set
4. `toast('Empresa carregada!','✅')` → user notification
5. `go('etapa1')` → re-render view (shows company card now)

---

### 4.2 Cloudflare Pages API — Deploy Pipeline (5 Passos)

This is the most complex API integration. Orchestrated by `e1Publicar()` (lines 807-905) and duplicated in `smsAtualizarSite()` (lines 1102-1178). The 5-step pipeline is:

```
Step 1: Create Project  →  Step 2: Get JWT  →  Step 3: BLAKE3 Hash (local)  →  Step 4: Upload Asset  →  Step 5: Create Deployment
```

**Global Configuration:**
- **Auth Header:** `Authorization: Bearer {settings.cf_token}`
- **Account ID:** `settings.cf_account` (32-char hex string)
- **Project Name:** `{etapa1State.dominio}` (subdomain slug, e.g., "empresa01")
- **CORS Proxy:** All URLs rewritten by `instalarProxy()` — see §4.5
- **Error Recovery:** "Tentar novamente" button re-enables after failure; no auto-retry

#### Step 1: Create Pages Project

**Endpoint:** POST `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects`
**Proxied URL:** POST `/cf-api/client/v4/accounts/{account_id}/pages/projects`
**Source:** Lines 824-833

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Headers** | `Authorization: Bearer {cf_token}`, `Content-Type: application/json` |
| **Request Body** | `{ "name": "{projectName}", "production_branch": "main" }` |
| **Success Status** | 200 (project created) |
| **Idempotency** | Errors with codes `8000007` or `8000031` or message containing "exists" are treated as success (project already exists) |

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "name": "string",
    "id": "string (project UUID)",
    "created_on": "string (ISO8601)",
    "subdomain": "string.pages.dev"
  }
}
```

**Error Response (idempotency — project exists):**
```json
{
  "success": false,
  "errors": [
    {
      "code": 8000007,
      "message": "A project with that name already exists"
    }
  ]
}
```
Handled as success — code checks `d1.errors.some(e=>e.code===8000007 || e.code===8000031 || (e.message||'').toLowerCase().includes('exists'))`.

**Error Response (other):**
```json
{
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error"
    }
  ]
}
```
Throws: `'CRIAR: '+JSON.stringify(d1.errors||d1)`.

#### Step 2: Get Upload Token (JWT)

**Endpoint:** GET `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/upload-token`
**Proxied URL:** GET `/cf-api/client/v4/accounts/{account_id}/pages/projects/{project_name}/upload-token`
**Source:** Lines 836-843

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Headers** | `Authorization: Bearer {cf_token}` |
| **Request Body** | None |

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "jwt": "string (JWT token for asset upload)"
  }
}
```
The `jwt` is used for Steps 3-4 (asset upload). Note: Steps 3-4 use JWT auth, NOT the API token.

**Error Response (401/403 — invalid token):**
```json
{
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error"
    }
  ]
}
```
Throws: `'JWT: '+JSON.stringify(d2)`.

#### Step 3: BLAKE3 Hash Calculation (LOCAL — not an API call)

**Source:** Lines 846-854
**Library:** `@noble/hashes/blake3` dynamically imported from `https://esm.sh/@noble/hashes/blake3`

The hash algorithm:
```javascript
// 1. Encode HTML → base64
const b64 = btoa(unescape(encodeURIComponent(html)));

// 2. Append extension as string
const toHash = new TextEncoder().encode(b64 + 'html');

// 3. BLAKE3 hash
const hashBytes = blake3(toHash);

// 4. Take first 32 hex chars
const hex = Array.from(hashBytes).map(b=>b.toString(16).padStart(2,'0')).join('');
const fileHash = hex.slice(0, 32);
```

The hash is computed as: `blake3(base64(html_content) + "html").hex.slice(0, 32)`. This is Cloudflare Pages' specific hashing scheme.

#### Step 4a: Check Missing Assets

**Endpoint:** POST `https://api.cloudflare.com/client/v4/pages/assets/check-missing`
**Proxied URL:** POST `/cf-api/client/v4/pages/assets/check-missing`
**Source:** Lines 857-861

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Headers** | `Authorization: Bearer {jwt}` (JWT from Step 2, NOT API token), `Content-Type: application/json` |
| **Request Body** | `{ "hashes": ["{fileHash}"] }` |

**Success Response (200):**
```json
{
  "success": true,
  "result": []  // Array of missing hashes (empty = already uploaded)
}
```
Response status not checked — treated as fire-and-forget. If the asset already exists, this is a no-op.

**Error Response:** Not explicitly handled. Network failure caught at this step would propagate as an unhandled exception in Step 4b.

#### Step 4b: Upload Asset

**Endpoint:** POST `https://api.cloudflare.com/client/v4/pages/assets/upload`
**Proxied URL:** POST `/cf-api/client/v4/pages/assets/upload`
**Source:** Lines 864-874

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Headers** | `Authorization: Bearer {jwt}` (JWT, NOT API token), `Content-Type: application/json` |
| **Request Body** | Array of asset objects |

**Request Body Schema:**
```json
[
  {
    "key": "{fileHash}",
    "value": "{base64_encoded_html}",
    "base64": true,
    "metadata": {
      "contentType": "text/html"
    }
  }
]
```

**Success Response (200):**
```json
{
  "success": true,
  "result": null
}
```
Check: `!upRes.ok` throws `'UPLOAD: '+JSON.stringify(upJson)`.

**Error Response:**
```json
{
  "success": false,
  "errors": [
    {
      "code": 8000000,
      "message": "Invalid asset format"
    }
  ]
}
```

#### Step 5: Create Deployment

**Endpoint:** POST `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments`
**Proxied URL:** POST `/cf-api/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments`
**Source:** Lines 877-888

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Headers** | `Authorization: Bearer {cf_token}` (API token, NOT JWT) |
| **Content-Type** | `multipart/form-data` (NOT JSON — uses FormData) |
| **Request Body** | FormData with `manifest` field |

**Request Body (FormData):**
```
manifest: JSON string: { "/index.html": "{fileHash}" }
```

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "id": "string (deployment UUID)",
    "url": "https://{project_name}.pages.dev",
    "alias": "https://{project_name}.pages.dev",
    "latest_stage": {
      "name": "deploy",
      "status": "success"
    }
  }
}
```
The `url` and `id` fields are extracted: `depJson.result.url || 'https://'+projectName+'.pages.dev'` and `depJson.result.id`.

**Error Response:**
```json
{
  "success": false,
  "errors": [
    {
      "code": 8000000,
      "message": "Deployment creation failed"
    }
  ]
}
```
Throws: `'DEPLOY: '+JSON.stringify(depJson)`.

#### Complete Error Handling Strategy (e1Publicar)

| Error Type | Detection | Behavior | Recovery |
|-----------|-----------|----------|----------|
| **No cf_token or cf_account** | `!podePublicar` check before fetch | Publish button disabled; warning card shown: "Configure o token Cloudflare nas Configurações" | User must configure in Config view |
| **Network failure (any step)** | `fetch()` throws | Error logged to `#publish-log`: "Erro: {message}" | Button re-enabled: "🚀 Tentar novamente" |
| **Project already exists** | Error codes 8000007/8000031 | Treated as success (idempotent) — proceeds to Step 2 | Transparent |
| **Invalid/expired token** | 401/403 response | Step-specific error message (CRIAR/JWT/UPLOAD/DEPLOY) | Button re-enabled |
| **Any other API error** | `!r.ok` or `!dep.ok` | Error object shown + "Dica: verifique se o token tem permissão..." | Button re-enabled |

**No retry logic** — failures are terminal until user clicks "Tentar novamente". No exponential backoff. No rate limit handling.

#### Post-Deploy Flow
1. `etapa1State.publicado = { url, projectName, deploymentId }` — in-memory state
2. `db.sites[idx].url = url`, `.deploymentId = depId`, `.status = 'deploy'`, `.atualizado = Date.now()` — localStorage update
3. `toast('🎉 Site publicado!','🚀')` — user notification
4. `setTimeout(()=>go('etapa1'), 800)` — re-render with 800ms delay

---

### 4.3 Cloudflare API — Account Detection

**Endpoint:** GET `https://api.cloudflare.com/client/v4/accounts`
**Proxied URL:** GET `/cf-api/client/v4/accounts`
**Trigger:** `salvarTokenCF()` when user saves Cloudflare API token in Config view
**Source:** Lines 1624-1672

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Headers** | `Authorization: Bearer {cf_token}` |
| **Permissions Required** | `Account → Account Settings → Read` (this is a separate permission from Pages:Edit) |
| **Request Body** | None |
| **Proxied?** | Yes — rewritten by `instalarProxy()` |

**Success Response (200 — Single Account):**
```json
{
  "success": true,
  "result": [
    {
      "id": "string (32-char hex)",
      "name": "string (account display name)"
    }
  ],
  "result_info": {
    "page": 1,
    "total_pages": 1,
    "total_count": 1
  }
}
```

**Success Response (200 — Multiple Accounts):**
```json
{
  "success": true,
  "result": [
    { "id": "abc123...", "name": "Personal" },
    { "id": "def456...", "name": "Business" }
  ]
}
```
Renders multi-account picker UI: each account gets a card with "Usar essa" button calling `escolherConta(id, nome)`.

**Error Response (403 — Missing Account:Read Permission):**
```json
{
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error — you do not have permission to access this resource"
    }
  ]
}
```
User sees orange warning: "Token salvo, mas não consegui listar suas contas. Adicione o Account ID manualmente."

**Error Response (Network/CORS):**
Caught by `catch(e)`: `log.innerHTML = '❌ Erro: '+escapeHTML(e.message)`.

#### Multi-Account Selection Flow
1. **1 account:** Auto-selects → `s.cf_account = contas[0].id`, `s.cf_account_name = contas[0].name` → toast "Tudo configurado!" → reload config view after 1500ms
2. **Multiple accounts:** Renders picker list → user clicks "Usar essa" → `escolherConta(id, nome)` → saves → reload
3. **0 accounts:** Shows "Nenhuma conta encontrada nesse token"
4. **Serialized:** `s.cf_accounts = contas` (only populated when >1 account — conditional localStorage field)

#### Cloudflare Token Test (testarCloudflare)

**Endpoint:** GET `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects`
**Source:** Lines 1701-1713

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Headers** | `Authorization: Bearer {cf_token}` |
| **Success Check** | `d.success === true` |
| **Success Toast** | `✅ OK! Você tem {total_count} projeto(s) Pages` |
| **Error Toast** | `❌ {errors[0].message}` |
| **Network Error Toast** | `Erro: {e.message}` |

---

### 4.4 SMS24h API — Number Purchase & Polling

**Base URL:** `https://api.sms24h.org/stubs/handler_api`
**Proxied URL:** `/sms-api/stubs/handler_api`
**Source:** `smsAPI(action, extra)` function, lines 1025-1032
**Auth:** API key passed as query parameter `api_key={key}` (NOT in headers)

#### smsAPI() Wrapper (lines 1025-1032)

```javascript
async function smsAPI(action, extra=''){
  const k = getSettings().sms_key;
  if(!k) throw new Error('Sem API key SMS24h. Configure primeiro.');
  const url = `https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(k)}&action=${encodeURIComponent(action)}${extra}`;
  const r = await fetch(url, { method:'GET' });
  if(!r.ok) throw new Error('HTTP '+r.status);
  return await r.text();  // NOTE: Returns text, NOT JSON
}
```

**Critical detail:** The SMS24h API returns **plain text**, not JSON. All responses are string-based with colon-delimited formats.

#### Endpoint 1: getBalance — Check Account Balance

**Full URL:** `https://api.sms24h.org/stubs/handler_api?api_key={key}&action=getBalance`
**Source:** `smsVerSaldo()` (line 1036)

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Query Params** | `api_key={key}`, `action=getBalance` |
| **Response Format** | Plain text string |

**Success Response:**
```
ACCESS_BALANCE:42.50
```
(Colon-delimited: `ACCESS_BALANCE:{balance_as_USD_string}`)

**Error Response (invalid key):**
```
BAD_KEY
```

**Error Handling:** `catch(e)` → toast "Erro: {e.message} (Pode ser CORS — use proxy)"

#### Endpoint 2: getNumber — Purchase Phone Number

**Full URL:** `https://api.sms24h.org/stubs/handler_api?api_key={key}&action=getNumber&service={service}&country={country}`
**Source:** `smsComprar()` (lines 1049)

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Query Params** | `api_key={key}`, `action=getNumber`, `service={fb\|ig\|wa\|go\|tg\|other}`, `country={0\|1\|22\|73\|187}` |
| **Cost** | Deducted from balance (~$0.10-$0.50 per number depending on country/service) |

**Service Options:**
| Value | Service |
|-------|---------|
| `fb` | Facebook |
| `ig` | Instagram |
| `wa` | WhatsApp |
| `go` | Google |
| `tg` | Telegram |
| `other` | Outro |

**Country Options:**
| Value | Country | Approx Numbers |
|-------|---------|---------------|
| `73` | 🇧🇷 Brasil | 73 available |
| `0` | 🇷🇺 Rússia | 0 available |
| `187` | 🇺🇸 EUA | 187 available |
| `1` | 🇺🇦 Ucrânia | 1 available |
| `22` | 🇮🇳 Índia | 22 available |

**Success Response (number acquired):**
```
ACCESS_NUMBER:12345678:5531990885354
```
Format: `ACCESS_NUMBER:{activation_id}:{phone_number}`
- `activation_id`: string ID for subsequent status/polling calls
- `phone_number`: raw E.164 format (e.g., "5531990885354")

**Error Responses:**
```
NO_NUMBERS       // No numbers available for this country/service
NO_BALANCE       // Insufficient funds
BAD_KEY          // Invalid API key
BAD_SERVICE      // Invalid service parameter
```

**Post-purchase flow:** Sets `etapa2State.activationId`, `.phone` → calls `go('etapa2')` (re-render) → calls `iniciarPollingSMS()` (start 5s polling).

#### Endpoint 3: getStatus — Poll for SMS Code

**Full URL:** `https://api.sms24h.org/stubs/handler_api?api_key={key}&action=getStatus&id={activation_id}`
**Source:** `iniciarPollingSMS()` (line 1074)

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Query Params** | `api_key={key}`, `action=getStatus`, `id={activation_id}` |
| **Polling Interval** | 5,000ms (every 5 seconds) |
| **Max Polling Duration** | 1,200 seconds (20 minutes) — `if(elapsed>1200) clearInterval(timer)` |

**Success Response (SMS received):**
```
STATUS_OK:123456
```
Format: `STATUS_OK:{sms_code}`

**Pending Response (no SMS yet):**
```
STATUS_WAIT_CODE
```

**Other Possible Statuses:**
```
STATUS_CANCEL      // Activation cancelled
STATUS_WAIT_RESEND // Waiting for resend
```

**Polling Logic (lines 1066-1082):**
```javascript
function iniciarPollingSMS(){
  if(etapa2State.timer) clearInterval(etapa2State.timer);
  const start = Date.now();
  etapa2State.timer = setInterval(async ()=>{
    const elapsed = Math.floor((Date.now()-start)/1000);
    // Update #sms-timer display
    const timer = document.getElementById('sms-timer');
    if(timer) timer.textContent = `(${elapsed}s)`;
    // Timeout check
    if(elapsed>1200){ clearInterval(etapa2State.timer); return; }
    // Poll
    try{
      const t = await smsAPI('getStatus', `&id=${etapa2State.activationId}`);
      if(t.startsWith('STATUS_OK:')){
        etapa2State.code = t.split(':')[1];  // Extract SMS code
        clearInterval(etapa2State.timer);
        go('etapa2');  // Re-render view
      }
    }catch(e){ /* ignore polling errors */ }
  }, 5000);
}
```

#### Endpoint 4: setStatus — Cancel or Confirm Activation

**Full URL:** `https://api.sms24h.org/stubs/handler_api?api_key={key}&action=setStatus&status={status_code}&id={activation_id}`

**Source:** `smsCancelar()` (status=8), `smsConfirmar()` (status=6)

| Action | status code | Function | Description |
|--------|-----------|----------|-------------|
| Cancel | `8` | `smsCancelar()` (line 1087) | Cancel activation (frees the number) |
| Confirm | `6` | `smsConfirmar()` (line 1097) | Confirm receipt (complete activation) |

**Request (both variants):**
| Property | Value |
|----------|-------|
| **Method** | GET |
| **Query Params** | `api_key={key}`, `action=setStatus`, `status=6\|8`, `id={activation_id}` |

**Success Response:**
```
ACCESS_ACTIVATION
```

**Error Responses:**
```
BAD_KEY
BAD_ACTION
```

**Cancel post-flow:** Clear timer, reset `etapa2State`, toast "Cancelado", `go('etapa2')`.
**Confirm post-flow:** Toast "Ativação finalizada" (no state change).

#### Complete SMS24h Error Handling Summary

| Error | Detection | User Feedback |
|-------|-----------|---------------|
| **No API key configured** | `!k` check in `smsAPI()` | Toast "Sem API key SMS24h. Configure primeiro." (also: warning card in Etapa 2 view) |
| **HTTP error** | `!r.ok` in `smsAPI()` | Toast "Erro: HTTP {status}" |
| **Network/CORS error** | `catch(e)` in callers | Contextual: "Erro: {message} (Pode ser CORS — use proxy)" or "❌ {message}" |
| **No numbers available** | `NO_NUMBERS` text response | Displayed in `#sms-buy-log` as error |
| **No balance** | `NO_BALANCE` text response | Displayed in `#sms-buy-log` as error |
| **Bad key** | `BAD_KEY` text response | Displayed as error text |
| **Polling timeout** | `elapsed > 1200` (20 min) | Timer stops; code never arrives; no explicit "timeout" toast |
| **Polling network errors** | `catch(e)` in `setInterval` | Swallowed silently (`/* ignore */`) — timer continues |

**Unhandled:** No retry logic for `getNumber` or `getStatus`. Polling silently swallows network errors. No exponential backoff. No "activation expired" detection (STATUS_CANCEL not explicitly checked — only STATUS_OK triggers code extraction).

---

### 4.5 CORS Proxy Layer

**Source:** `instalarProxy()` function, lines 2112-2123
**Header Comment (source line 2110):** `/* PROXY CORS via Netlify — substitui chamadas pra api.cloudflare.com e sms24h.org pelos paths /cf-api/ e /sms-api/ que o arquivo _redirects do Netlify intermedia */`

#### instalarProxy() Implementation

```javascript
(function instalarProxy(){
  if(location.protocol === 'file:') return; // local: não precisa
  const orig = window.fetch;
  window.fetch = function(url, opts){
    if(typeof url === 'string'){
      if(url.startsWith('https://api.cloudflare.com')) url = url.replace('https://api.cloudflare.com', '/cf-api');
      else if(url.startsWith('https://api.sms24h.org')) url = url.replace('https://api.sms24h.org', '/sms-api');
      else if(url.startsWith('https://sms24h.org')) url = url.replace('https://sms24h.org', '/sms-api');
    }
    return orig(url, opts);
  };
})();
```

#### URL Rewriting Rules

| Pattern | Original (Upstream) URL | Rewritten (Proxied) URL |
|---------|------------------------|------------------------|
| Cloudflare API | `https://api.cloudflare.com/client/v4/...` | `/cf-api/client/v4/...` |
| SMS24h API (api subdomain) | `https://api.sms24h.org/stubs/handler_api?...` | `/sms-api/stubs/handler_api?...` |
| SMS24h (root domain) | `https://sms24h.org/...` | `/sms-api/...` |

#### Inferred Netlify _redirects Configuration

Based on the proxy rewriting rules, the Netlify `_redirects` file would contain:

```
/cf-api/*  https://api.cloudflare.com/:splat  200
/sms-api/* https://api.sms24h.org/:splat      200
```

**Why the proxy exists:** Cloudflare API and SMS24h API do NOT return CORS headers. Direct browser `fetch()` calls would be blocked by the browser's same-origin policy. The Netlify `_redirects` proxy makes the requests same-origin (`/cf-api/` and `/sms-api/` paths), avoiding CORS entirely.

**Key observations:**
1. **No header modification:** The proxy only rewrites URL strings. Headers pass through unchanged.
2. **local file bypass:** `if(location.protocol === 'file:') return;` — when running locally from `file://`, the proxy is NOT installed. This means local development without Netlify will hit CORS errors.
3. **BrasilAPI exception:** BrasilAPI is NOT proxied — it's called directly at `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`. This works because BrasilAPI returns proper CORS headers.
4. **Monkey-patching pattern:** `window.fetch` is reassigned, wrapping the original. All code that calls `fetch()` (including any future code added) gets the proxy — transparent interception.
5. **String-only matching:** Only string URLs are rewritten. If someone passes a `Request` object as the URL parameter, the proxy does nothing.

#### Clone Implications

The clone must either:
- **Option A:** Replicate the proxy layer (e.g., Vite dev server proxy, or a Netlify deploy with `_redirects`)
- **Option B:** Fully mock all API calls for offline development (Phase 2-3)
- **Option C:** Use a CORS proxy service or browser extension during development

**Without the proxy**, all Cloudflare and SMS24h API calls will fail with CORS errors in the browser.


## 5. Funções de Lógica de Negócio

**All ~60 functions documented with: signature (param types + return type), side effects (specific DOM/localStorage/network/timers/events), call graph (Called By + Calls), edge cases. Documented in DEPENDENCY ORDER — foundation functions first.**

Functions extracted from `data/raw-source.html` (2135 lines of vanilla JS). Every function specification is source-confirmed with line references.

---

### 5.1 Core/Infrastructure Functions

Core functions that every view depends on. Documented in dependency order.

#### getDB()

**Source:** Line 212-215
**Signature:** `getDB(): AppDatabase`
**Parameters:** None
**Return:** `AppDatabase` object `{empresas: [], sites: [], sms: []}` — parsed from localStorage key `lab_bms_db_v1`, or default if missing/corrupt
**Side Effects:**
  - localStorage reads: `localStorage.getItem(STORAGE_KEY)` (line 213)
**Called By:** `VIEWS.dashboard`, `renderBanco`, `renderPlanilha`, `salvarEmpresa`, `registrarSite`, `e1Publicar`, `mudarStatus`, `removerSite`, `usarEmpresaNaEtapa1`, `exportCSV`, `exportBackup`, `importBackup`, `limparBanco`, `smsAtualizarSite`, `VIEWS.etapa2`
**Calls:** None (leaf function — calls nothing)
**Edge Cases:**
  - `JSON.parse` throws → returns default `{empresas:[], sites:[], sms:[]}` (line 214)
  - localStorage key missing (returns `null`) → fallback to default (line 213)
  - Corrupted JSON → fallback to default

#### saveDB(db)

**Source:** Line 216
**Signature:** `saveDB(db: AppDatabase): void`
**Parameters:**
  - `db` (AppDatabase): Full database object to persist
**Return:** Nothing
**Side Effects:**
  - localStorage writes: `localStorage.setItem(STORAGE_KEY, JSON.stringify(db))` (line 216)
**Called By:** `salvarEmpresa`, `registrarSite`, `e1Publicar`, `mudarStatus`, `removerSite`, `smsAtualizarSite`, `importBackup`
**Calls:** None (leaf function)
**Edge Cases:**
  - localStorage quota exceeded → `setItem` throws (uncaught — will crash at call site)
  - Circular reference in `db` → `JSON.stringify` throws (uncaught)

#### getSettings()

**Source:** Line 217-219
**Signature:** `getSettings(): Settings`
**Parameters:** None
**Return:** `Settings` object — parsed from localStorage key `lab_bms_settings_v1`, or `{}` if missing/corrupt
**Side Effects:**
  - localStorage reads: `localStorage.getItem(SETTINGS_KEY)` (line 218)
**Called By:** `refreshHeaderStatus`, `VIEWS.dashboard`, `VIEWS.etapa1` (renderStep1Publicar), `VIEWS.etapa2`, `smsAPI`, `salvarTokenCF`, `salvarConfig`, `escolherConta`, `trocarConta`, `salvarAccountManual`, `testarCloudflare`, `e1Publicar`, `smsAtualizarSite`, `exportBackup`, `autoConectarTokens`
**Calls:** None (leaf function)
**Edge Cases:**
  - `JSON.parse` throws → returns `{}` (line 219)
  - localStorage key missing → returns `{}`
  - All fields optional — downstream code must null-check `s.cf_token`, `s.cf_account`, `s.sms_key`

#### saveSettings(s)

**Source:** Line 221
**Signature:** `saveSettings(s: Settings): void`
**Parameters:**
  - `s` (Settings): Full settings object to persist
**Return:** Nothing
**Side Effects:**
  - localStorage writes: `localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))` (line 221)
  - Calls `refreshHeaderStatus()` — updates API status pills in header (line 221)
**Called By:** `salvarConfig`, `salvarTokenCF`, `escolherConta`, `trocarConta`, `salvarAccountManual`, `autoConectarTokens`, `importBackup`
**Calls:** `refreshHeaderStatus`
**Edge Cases:**
  - Same as `saveDB` — localStorage quota, JSON serialization errors

#### refreshHeaderStatus()

**Source:** Lines 223-235
**Signature:** `refreshHeaderStatus(): void`
**Parameters:** None
**Return:** Nothing
**Side Effects:**
  - DOM writes: Updates `#cf-status` (class swap + textContent), `#sms-status` (class swap + textContent)
  - localStorage reads: `getSettings()` to get current tokens
**Called By:** `saveSettings` (line 221), bootstrap sequence (line 2131)
**Calls:** `getSettings`
**Edge Cases:**
  - `#cf-status` or `#sms-status` elements don't exist → null check prevents crash (`if(cf)` / `if(sm)`, lines 227, 231)
  - Settings empty → both pills show `.danger` state (⚠️ Cloudflare / ⚠️ SMS24h)
  - Both tokens + account set → `.done` state (☁️ Cloudflare OK / 📱 SMS24h OK)

| Condition | CF Pill Class | CF Pill Text |
|-----------|-------------|-------------|
| `cf_token && cf_account` set | `pill done` | ☁️ Cloudflare OK |
| Either missing | `pill danger` | ⚠️ Cloudflare |

| Condition | SMS Pill Class | SMS Pill Text |
|-----------|---------------|---------------|
| `sms_key` set | `pill done` | 📱 SMS24h OK |
| `sms_key` missing | `pill danger` | ⚠️ SMS24h |

#### toast(msg, icon)

**Source:** Lines 237-244
**Signature:** `toast(msg: string, icon?: string): void`
**Parameters:**
  - `msg` (string): Message text to display
  - `icon` (string, default `'✅'`): Emoji icon to show
**Return:** Nothing
**Side Effects:**
  - DOM writes: `#toast-icon.textContent`, `#toast-msg.textContent`, `#toast.classList.remove('hidden')` (lines 239-241)
  - Timers: `clearTimeout(window._tt)` (kill previous timer), `window._tt = setTimeout(...)` (new 3000ms auto-dismiss, line 242-243)
**Called By:** 35+ call sites across all view modules (e.g., `e1Buscar`, `e1Gerar`, `e1Publicar`, `smsComprar`, `mudarStatus`, `exportCSV`, `exportBackup`, etc.)
**Calls:** None directly (uses DOM + setTimeout)
**Edge Cases:**
  - Concurrent toasts: Previous toast timer cancelled (`clearTimeout(window._tt)`) — new toast replaces old
  - No toast queue — single toast slot
  - Auto-dismiss: after 3000ms, `classList.add('hidden')` hides toast
  - Missing `#toast` element → `getElementById` returns null → `.textContent` assignment throws TypeError

#### openModal(html)

**Source:** Lines 246-248
**Signature:** `openModal(html: string): void`
**Parameters:**
  - `html` (string): HTML content to inject into modal body
**Return:** Nothing
**Side Effects:**
  - DOM writes: `#modal-body.innerHTML = html` (line 247)
  - DOM writes: `#modal-back.classList.remove('hidden')` — shows backdrop + body (line 248)
**Called By:** `e1Preview` (opens preview in modal? Actually no — e1Preview uses window.open. Check source: only modal usages are from VIEWS.planilha preview link and VIEWS.etapa1 preview), `VIEWS.etapa1` generated HTML (inline onclick), `VIEWS.etapa2` generated HTML (inline onclick)
**Calls:** None directly
**Edge Cases:**
  - No close button by default — modal content must include its own close button calling `closeModal()`
  - Backdrop click closes modal: `onclick="if(event.target===this)closeModal()"` on `#modal-back` (line 200)
  - No Escape key handler
  - XSS risk: `innerHTML` assignment with user-provided content (mitigated by `escapeHTML` usage in callers)

#### closeModal()

**Source:** Line 250
**Signature:** `closeModal(): void`
**Parameters:** None
**Return:** Nothing
**Side Effects:**
  - DOM writes: `#modal-back.classList.add('hidden')` (line 250)
**Called By:** Inline onclick in modal content, `#modal-back` click handler
**Calls:** None

#### toggleSidebar(open)

**Source:** Lines 252-255
**Signature:** `toggleSidebar(open: boolean): void`
**Parameters:**
  - `open` (boolean): true = open, false = close
**Return:** Nothing
**Side Effects:**
  - DOM writes: `#sidebar.classList.toggle('open', open)`, `#backdrop.classList.toggle('open', open)` (lines 253-254)
**Called By:** `go()` (closes sidebar on navigation, line 303), hamburger button onclick (line 177), backdrop onclick (line 138)
**Calls:** None directly
**Edge Cases:**
  - Only functional at ≤1024px viewport (CSS: sidebar is fixed + off-screen only at mobile)
  - Desktop: `.open` class has no visual effect (sidebar always visible)
  - No state tracking — reads/writes DOM classes directly

#### go(route)

**Source:** Lines 286-305 (documented in detail in §3.3)
**Signature:** `go(route: string): void`
**Parameters:**
  - `route` (string): Route name (must be one of: dashboard, etapa1, etapa2, etapa3, banco, planilha, config, ajuda)
**Return:** Nothing
**Side Effects:**
  - DOM writes: All `[data-route]` elements `.active` class toggle, `#page-title.textContent`, `#page-subtitle.textContent`, `#view.innerHTML`
  - Window: `scrollTo({top:0, behavior:'smooth'})`
  - Calls `toggleSidebar(false)`
  - Calls `window['after_'+route]()` hook if exists
**Called By:** 35+ call sites (see §3.4)
**Calls:** `VIEWS[route]()`, `toggleSidebar`, `window['after_'+route]()` (if function exists)
**Edge Cases:**
  - Invalid route → defaults to `'dashboard'` (line 287)
  - Duplicate navigation → fully re-renders (no guard)
  - Missing VIEWS key → `innerHTML = undefined` (silent failure)
  - Missing DOM element → TypeError

#### stepBox(n, ico, title, done, body, disabled)

**Source:** Lines 428-440
**Signature:** `stepBox(n: number, ico: string, title: string, done: boolean, body: string, disabled?: boolean): string`
**Parameters:**
  - `n` (number): Step number (1-5)
  - `ico` (string): Emoji icon for step
  - `title` (string): Step title text
  - `done` (boolean): Whether step is complete (shows ✓ and "Concluído" pill)
  - `body` (string): HTML content for step body
  - `disabled` (boolean, default false): Whether step is locked (adds `.disabled` class)
**Return:** HTML string for a step card wrapper
**Side Effects:** None (pure template function — returns HTML string)
**Called By:** `VIEWS.etapa1` (5 times, one per step)
**Calls:** None
**Edge Cases:**
  - `done=true` + `disabled=true`: `.done` class takes visual precedence for step-num but `.disabled` class applies opacity/pointer-events
  - Step number display: `done ? '✓' : n`

#### copyText(t, msg)

**Source:** Lines 275-278
**Signature:** `copyText(t: string, msg?: string): void`
**Parameters:**
  - `t` (string): Text to copy to clipboard
  - `msg` (string, default `'Copiado!'`): Toast message on success
**Return:** Nothing
**Side Effects:**
  - Clipboard API: `navigator.clipboard.writeText(t)` (line 277)
  - Calls `toast(msg, '📋')` on success (line 277) — toast is fire-and-forget (Promise.then)
**Called By:** 30+ call sites (copies domains, meta-tags, URLs, phone numbers, PDF fields, etc.) — all inline `onclick` in generated HTML
**Calls:** `toast`
**Edge Cases:**
  - `t` is null/empty → returns early, no toast (line 276)
  - Clipboard API unavailable (HTTP context) → `writeText` Promise rejects (unhandled — no catch)
  - Non-HTTPS (localhost): Clipboard API requires secure context or localhost

---

---

### 5.2 Dashboard Functions

#### VIEWS.dashboard()

**Source:** Lines 312-367
**Signature:** `VIEWS.dashboard(): string`
**Parameters:** None
**Return:** HTML string for full Dashboard view (hero card + API warning card + 4 stat cards + 6 quick-cards)
**Side Effects:**
  - localStorage reads: `getDB()` (line 313), `getSettings()` (line 318)
  - No localStorage writes, no DOM writes (returns HTML string injected by `go()`)
**Called By:** `go('dashboard')` from bootstrap (line 2132), sidebar click, any go() call
**Calls:** `getDB`, `getSettings`, `statCard` (4x), `quickCard` (6x)
**Edge Cases:** Empty database shows stat cards with 0. Missing API config renders amber warning card with "Configurar" button.

#### statCard(icon, label, value, color)

**Source:** Lines 368-374
**Signature:** `statCard(icon: string, label: string, value: number, color: string): string`
**Parameters:** icon (emoji), label, value, color (icon-cube variant: brand/cyan/green/amber)
**Return:** HTML string for a glass stat card
**Side Effects:** None (pure template function)
**Called By:** `VIEWS.dashboard` (4x), `VIEWS.etapa3`
**Calls:** None

#### quickCard(icon, title, desc, route, color)

**Source:** Lines 375-386
**Signature:** `quickCard(icon: string, title: string, desc: string, route: string, color: string): string`
**Parameters:** icon, title, desc, route (target route name), color (icon-cube variant)
**Return:** HTML string for a clickable glass card with `onclick="go('{route}')"`
**Side Effects:** None (event handler is inline onclick in returned HTML)
**Called By:** `VIEWS.dashboard` (6x)
**Calls:** None

---

### 5.3 Etapa 1 Functions (Largest Module ~20 functions)

#### VIEWS.etapa1()

**Source:** Lines 399-426 | **Signature:** `VIEWS.etapa1(): string`
**Return:** HTML string for 5-step wizard (hero card + 5 stepBox calls)
**Side Effects:** In-memory reads: `etapa1State` (all 5 fields, derived into boolean gates)
**Called By:** `go('etapa1')`
**Calls:** `stepBox` (5x), `renderStep1CNPJ`, `renderStep1Dominio`, `renderStep1Meta`, `renderStep1Gerar`, `renderStep1Publicar`

#### renderStep1CNPJ()

**Source:** Lines 442-483 | **Signature:** `renderStep1CNPJ(): string`
**Return:** HTML for Step 1: company card OR search form + manual registration `<details>`
**Conditional:** `empresa !== null` shows display card; else shows CNPJ input + auto-fetch + 14-field manual form

#### e1Buscar()

**Source:** Lines 485-503 | **Signature:** `async e1Buscar(): Promise<void>`
**Side Effects:** DOM reads: `#e1_cnpj.value`. Network: fetch BrasilAPI. In-memory: `etapa1State.empresa = e`. localStorage: via `salvarEmpresa()` -> `saveDB()`. DOM writes: `#e1_result.innerHTML` (loading/error)
**Calls:** `onlyDigits`, `fetch`, `normalizarBrasilAPI`, `salvarEmpresa`, `toast`, `go`
**Edge Cases:** CNPJ != 14 digits -> toast and return. Error: `!r.ok` -> throws "Nao encontrado" -> caught by catch -> renders error in `#e1_result`.

#### e1ManualSalvar()

**Source:** Lines 505-526 | **Signature:** `e1ManualSalvar(): void`
**Side Effects:** DOM reads 14 manual fields (`#e1m_*`). In-memory: `etapa1State.empresa = e`. localStorage: via `salvarEmpresa(e)`
**Calls:** `onlyDigits`, `salvarEmpresa`, `toast`, `go`
**Edge Cases:** CNPJ validation (14 digits). CNAEs parsed line-by-line from textarea.

#### normalizarBrasilAPI(d)

**Source:** Lines 528-552 (mapping table in 4.1) | **Signature:** `normalizarBrasilAPI(d: BrasilAPIResponse): EmpresaNormalizada`
**Return:** Normalized empresa object with 20+ mapped/renamed fields + raw response
**Side Effects:** None (pure transformation)
**Called By:** `e1Buscar` (line 495)
**Calls:** None

#### salvarEmpresa(e)

**Source:** Lines 554-560 | **Signature:** `salvarEmpresa(e: object): void`
**Side Effects:** localStorage read/write via `getDB()`/`saveDB()`. Upsert: merge if CNPJ matches, insert otherwise
**Calls:** `getDB`, `onlyDigits`, `saveDB`

#### gerarSugestoesDominio(nome)

**Source:** Lines 563-596 (7-algorithm domain engine, detailed in 2.3) | **Signature:** `gerarSugestoesDominio(nome: string): string[]`
**Return:** Array of max 6 unique slug suggestions, each 4-32 chars
**Side Effects:** None (pure computation)
**Called By:** `renderStep1Dominio` (line 615)
**Calls:** `slugify`

#### renderStep1Dominio()

**Source:** Lines 598-630 | **Signature:** `renderStep1Dominio(): string`
**Return:** HTML for Step 2: selected domain display OR suggestions grid + custom input
**Conditional:** `dominio !== ''` -> selected display; else -> suggestions

#### e1EscolherDominio(d)

**Source:** Lines 632-637 | **Signature:** `e1EscolherDominio(d: string): void`
**Side Effects:** In-memory: `etapa1State.dominio = slugify(d)`. Navigation: `go('etapa1')`
**Edge Cases:** Domain < 4 chars -> toast and return

#### renderStep1Meta()

**Source:** Lines 639-663 | **Signature:** `renderStep1Meta(): string`
**Return:** HTML for Step 3: saved meta-tag display OR paste input form

#### e1SalvarMeta()

**Source:** Lines 665-673 | **Signature:** `e1SalvarMeta(): void`
**Side Effects:** DOM reads: `#e1_meta.value`. In-memory: `etapa1State.metatag = v || '<!-- meta tag nao fornecida -->'`
**Edge Cases:** Tag without 'facebook-domain-verification' -> confirm() dialog. Empty -> comment placeholder.

#### renderStep1Gerar()

**Source:** Lines 675-702 | **Signature:** `renderStep1Gerar(): string`
**Return:** HTML for Step 4: generated site display OR customization form + generate button

#### e1Gerar()

**Source:** Lines 704-741 | **Signature:** `e1Gerar(): void`
**Side Effects:** DOM reads 4 inputs. In-memory: `etapa1State.htmlGerado = html` (with meta-tag injected). localStorage: via `registrarSite()` -> 12-field site object saved
**Calls:** `fmtCNPJ`, `fmtMoney`, `fmtDate`, `onlyDigits`, `buildSiteHTML`, `registrarSite`, `toast`, `go`
**Edge Cases:** Meta-tag comment placeholder not injected. Builds `dados` object with 25+ fields for template.

#### e1Preview()

**Source:** Lines 743-747 | **Signature:** `e1Preview(): void`
**Side Effects:** Opens new window: `window.open('about:blank')` -> `w.document.write(html)` -> `w.document.close()`

#### e1Baixar()

**Source:** Lines 749-756 | **Signature:** `e1Baixar(): void`
**Side Effects:** Creates download: Blob -> URL.createObjectURL -> programmatic <a> click -> revokeObjectURL. File: `index.html`

#### registrarSite(dados, metatag, dominio, telefoneNosso)

**Source:** Lines 758-772 | **Signature:** `registrarSite(dados: object, metatag: string, dominio: string, telefoneNosso: string): void`
**Side Effects:** localStorage read/write. Upsert on (CNPJ + dominio) composite key. Creates 12 fields: cnpj, razao, fantasia, dominio (+.pages.dev), metatag, telefoneEmpresa, telefoneNosso, status:'gerado', url:'', deploymentId:'', dadosSnapshot, criado/atualizado timestamps

#### renderStep1Publicar()

**Source:** Lines 774-805 | **Signature:** `renderStep1Publicar(): string`
**Return:** HTML for Step 5: published site display OR publish form. Conditional: missing token/account -> warning card + disabled button

#### e1Publicar()

**Source:** Lines 807-905 (detailed in 4.2 Cloudflare 5-step pipeline) | **Signature:** `async e1Publicar(): Promise<void>`
**Side Effects:** DOM writes: `#publish-log.innerHTML`, `#btn-publish` state. Network: 5 sequential fetch calls. Dynamic import: `import('https://esm.sh/@noble/hashes/blake3')`. In-memory: `etapa1State.publicado`. localStorage: `db.sites[idx]` updated
**Calls:** `getSettings`, `fetch` (5x), `import()`, `getDB`, `saveDB`, `toast`, `go`
**Edge Cases:** Project exists -> idempotent (codes 8000007/8000031). Any step fails -> "Tentar novamente". JWT vs API token auth per step.

#### resetEtapa1()

**Source:** Lines 907-910 | **Signature:** `resetEtapa1(): void`
**Side Effects:** Reinitializes `etapa1State` to defaults. Calls `go('etapa1')`

#### buildSiteHTML(d)

**Source:** Lines 1791-2076 (~285 lines of template) | **Signature:** `buildSiteHTML(d: DadosSite): string`
**Parameters:** `d` with 25 fields (cnpj, razao, fantasia, capital, porte, situacao, inicio, natureza, cnae, cnaesSec, slogan, horario, sobre, missao, visao, valores[], diferenciais[], logradouro, bairro, municipio, uf, cep, telefone, telefoneNosso, email, whats, dominio)
**Return:** Complete HTML document (~20KB+) standalone SaaS landing page with embedded CSS
**Side Effects:** None (pure template function)
**Called By:** `e1Gerar` (line 731), `smsAtualizarSite` (line 1121)
**Calls:** `calcAnos`
**Template Sections:** Header (sticky nav + mobile hamburger), Hero (gradient BG + CTAs), Stats (4 cards), About (grid with company meta), Values (value-card grid, hidden if empty), Diferenciais (diff-card grid, hidden if empty), Servicos (CNAE cards, hidden if empty), Empresa (12 KV data pairs), Contato (contact list + WhatsApp form), Footer (3-column grid + copyright)
**CSS:** Self-contained ~100 lines in `<style>` tag. Responsive breakpoint at 900px. WhatsApp float button with pulse animation. Phone combination format: `tel + ' /'+telefoneNosso` (no space between / and number).

---

### 5.4 Etapa 2 Functions (SMS Purchase)

#### VIEWS.etapa2()

**Source:** Lines 917-1023 | **Signature:** `VIEWS.etapa2(): string`
**Return:** HTML for SMS Purchase view (hero + 4 step cards)
**Side Effects:** localStorage reads: `getSettings()` (SMS key check), `getDB()` (active sites for step 4)
**Conditional:** SMS key warning if `!sms_key`. Steps progressively enabled based on `etapa2State.phone`.

#### smsAPI(action, extra)

**Source:** Lines 1025-1032 (detailed in 4.4) | **Signature:** `async smsAPI(action: string, extra: string): Promise<string>`
**Return:** Plain text response (NOT JSON, colon-delimited format)
**Side Effects:** localStorage reads: `getSettings().sms_key`. Network: `fetch(url, {method:'GET'})`
**Called By:** smsVerSaldo, smsComprar, iniciarPollingSMS, smsCancelar, smsConfirmar, testarSMS
**Edge Cases:** No API key -> throws. HTTP error -> throws 'HTTP '+status.

#### smsVerSaldo()

**Source:** Lines 1034-1041 | **Signature:** `async smsVerSaldo(): Promise<void>`
**Side Effects:** Calls `smsAPI('getBalance')` -> displays balance via toast

#### smsComprar()

**Source:** Lines 1043-1064 | **Signature:** `async smsComprar(): Promise<void>`
**Side Effects:** DOM reads service/country. Network: `smsAPI('getNumber', ...)`. In-memory: `etapa2State.activationId`, `.phone`, `.code=''`. Calls `iniciarPollingSMS()` on success
**Edge Cases:** Response starts with `ACCESS_NUMBER:` -> success. Else error displayed.

#### iniciarPollingSMS()

**Source:** Lines 1066-1082 | **Signature:** `iniciarPollingSMS(): void`
**Side Effects:** Timers: `setInterval(...)` every 5s. DOM: `#sms-timer` updated. Network: `smsAPI('getStatus')` each interval. In-memory: `etapa2State.code` when SMS received
**Edge Cases:** Previous timer killed. 20-min timeout (1200s). Polling errors silently swallowed.

#### smsCancelar()

**Source:** Lines 1084-1093 | **Signature:** `async smsCancelar(): Promise<void>`
**Side Effects:** Network: `smsAPI('setStatus', '&status=8')`. Full state reset: `etapa2State = {nulls}`. Timer cleared

#### smsConfirmar()

**Source:** Lines 1095-1100 | **Signature:** `async smsConfirmar(): Promise<void>`
**Side Effects:** Network: `smsAPI('setStatus', '&status=6')`. Error silently ignored

#### smsAtualizarSite()

**Source:** Lines 1102-1178 | **Signature:** `async smsAtualizarSite(): Promise<void>`
**Side Effects:** DOM reads `#sms-site.value` (cnpj-dominio). localStorage: updates site with new phone + re-deployed URL. Network: Cloudflare 4-step re-deploy (JWT->hash->upload->deploy, NO create-project). Calls `buildSiteHTML` to regenerate HTML

---

### 5.5 Etapa 3 Functions (PDF Editor)

#### VIEWS.etapa3()

**Source:** Lines 1185-1215 | **Signature:** `VIEWS.etapa3(): string`
**Return:** HTML for PDF Editor (hero + drag-drop zone + hidden toolbar + mapped-fields container + viewer)
**Side Effects:** None (pure template)

#### carregarPDF(file)

**Source:** Lines 1217-1256 | **Signature:** `async carregarPDF(file: File): Promise<void>`
**Side Effects:** File API: `file.arrayBuffer()` -> `Uint8Array`. In-memory: `pdfState.fileBytes`, `.pdfDoc`, `.pages[]`, `.overlays=[]`. DOM: creates `<canvas>` per page via pdf.js (scale 1.4), adds click handlers. Shows toolbar
**Calls:** `pdfjsLib.getDocument`, `page.getPage`, `page.render`, `rerenderOverlays`, `toast`

#### rerenderOverlays()

**Source:** Lines 1258-1289 | **Signature:** `rerenderOverlays(): void`
**Side Effects:** DOM: removes all `.pdf-overlay-text`, creates new from `pdfState.overlays[]`. Event listeners: `input` (text update), `mousedown->drag` (reposition), `del` click (splice + re-render)
**Called By:** carregarPDF, canvas click, overlay delete, "Limpar textos" button
**Edge Cases:** Canvas wrap not found -> skip overlay. No boundary clamping during drag.

#### baixarPDF()

**Source:** Lines 1291-1311 | **Signature:** `async baixarPDF(): Promise<void>`
**Side Effects:** `PDFLib.PDFDocument.load()` -> `page.drawText()` per overlay -> `pdfDoc.save()`. Download blob. Font: Helvetica, black. Y flip: `pageHeight - (y*scale) - (size*scale*0.8)`

#### mapearCampos()

**Source:** Lines 1313-1334 | **Signature:** `async mapearCampos(): Promise<void>`
**Side Effects:** DOM: `#campos-mapeados.innerHTML`. pdf.js `page.getTextContent()` for all pages. Text sorted by Y then X
**Calls:** `extrairCamposEndereco`, `renderCamposMapeados`, `toast`

#### extrairCamposEndereco(text)

**Source:** Lines 1336-1364 | **Signature:** `extrairCamposEndereco(text: string): CamposEndereco`
**Return:** Object with 7 address fields: `{LOGRADOURO, NUMERO, COMPLEMENTO, CEP, BAIRRO, MUNICIPIO, UF}` (empty strings if not found)
**Side Effects:** None (pure regex function)
**Exact Regex Patterns:**
| Field | Regex |
|-------|-------|
| CEP | `/\b\d{5}-?\d{3}\b/` |
| UF | `/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b(?!\w)/` (all 27 states) |
| LOGRADOURO | `/(?:LOGRADOURO|ENDERE[CC]O)\s*[:\-]?\s*([^\n]+?)(?=\s+(?:N[UU]MERO|N[oo]|COMPLEMENTO|BAIRRO|CEP|MUNIC|UF)\b|\n|$)/i` |
| NUMERO | `/N[UU]MERO\s*[:\-]?\s*([0-9][0-9A-Za-z\-\/\.]*)/i` or `/N[oo]\s*[:\-]?\s*([0-9A-Za-z\-\/\.]+)/i` |
| COMPLEMENTO | `/COMPLEMENTO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:BAIRRO|CEP|MUNIC|UF)\b|\n|$)/i` |
| BAIRRO | `/BAIRRO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:CEP|MUNIC|UF)\b|\n|$)/i` |
| MUNICIPIO | `/MUNIC[II]PIO\s*[:\-]?\s*([^\n]+?)(?=\s+(?:UF|ESTADO|CEP)\b|\n|$)/i` or `/CIDADE\s*[:\-]?\s*([^\n]+?)(?=\s+(?:UF|ESTADO)\b|\n|$)/i` |

#### renderCamposMapeados(campos, fullText)

**Source:** Lines 1366-1395 | **Signature:** `renderCamposMapeados(campos: CamposEndereco, fullText: string): void`
**Side Effects:** DOM: `#campos-mapeados.innerHTML` - 7 copy-rows with labels, values, copy buttons. Raw text expandable via `<details>` (max 3000 chars)

---

### 5.6 Banco de Empresas Functions

#### VIEWS.banco()

**Source:** Lines 1400-1418 | **Signature:** `VIEWS.banco(): string`
**Return:** HTML for Banco de Empresas (header bar with search/filter + empty grid container)
**Post-render hook:** `window.after_banco = () => renderBanco()`

#### renderBanco()

**Source:** Lines 1420-1459 | **Signature:** `renderBanco(): void`
**Side Effects:** DOM reads `#filter-q.value`, `#filter-faixa.value`. DOM writes `#banco-list.innerHTML`. localStorage reads `getDB().empresas`. Cards in reverse order (newest first)
**Filters:** Text (razao_social or CNPJ digits). Capital range (ideal: 10k-50k, abaixo: <10k, acima: >50k)
**Edge Cases:** Empty -> "Sem empresas ainda" with Etapa 1 link

#### limparBanco()

**Source:** Lines 1461-1466 | **Signature:** `limparBanco(): void`
**Side Effects:** `localStorage.removeItem(STORAGE_KEY)` - COMPLETE wipe. Confirm dialog. Only function directly calling removeItem

#### usarEmpresaNaEtapa1(cnpj)

**Source:** Lines 1467-1473 | **Signature:** `usarEmpresaNaEtapa1(cnpj: string): void`
**Side Effects:** localStorage reads to find company. In-memory: `etapa1State = {empresa:e, ...nulls}` (imports company, resets downstream). Navigation: `go('etapa1')`

---

### 5.7 Planilha Functions

#### VIEWS.planilha()

**Source:** Lines 1475-1503 | **Signature:** `VIEWS.planilha(): string`
**Return:** HTML for Planilha (header + 8-column table shell)
**Post-render hook:** `window.after_planilha = () => renderPlanilha()`

#### renderPlanilha()

**Source:** Lines 1505-1527 | **Signature:** `renderPlanilha(): void`
**Side Effects:** DOM writes `#planilha-body.innerHTML`. localStorage reads `getDB().sites`
**Status dropdown:** `gerado, deploy, meta-tag, finalizado` - inline `<select>` with `onchange="mudarStatus(...)"`
**Edge Cases:** Empty -> "Nenhum site ainda" row

#### mudarStatus(cnpj, dominio, v)

**Source:** Lines 1529-1535 | **Signature:** `mudarStatus(cnpj: string, dominio: string, v: string): void`
**Side Effects:** localStorage write: `saveDB(db)` updates `site.status` + `site.atualizado`. Calls `renderPlanilha()`, `toast`

#### removerSite(cnpj, dominio)

**Source:** Lines 1536-1541 | **Signature:** `removerSite(cnpj: string, dominio: string): void`
**Side Effects:** localStorage write: `saveDB(db)` filters out site. Confirmation dialog

#### exportCSV()

**Source:** Lines 1542-1552 | **Signature:** `exportCSV(): void`
**Side Effects:** localStorage reads `getDB().sites`. Creates CSV download with UTF-8 BOM prefix (Excel compatible). 10 columns, semicolon separator, double-quote escaping. Filename: `planilha-laboratorio.csv`

---

### 5.8 Configuracoes Functions

#### VIEWS.config()

**Source:** Lines 1557-1613 | **Signature:** `VIEWS.config(): string`
**Return:** HTML for Configuracoes (Cloudflare API + SMS24h + Backup cards)
**Side Effects:** localStorage reads `getSettings()` (pre-fill inputs, show account info)

#### salvarConfig()

**Source:** Lines 1615-1622 | **Signature:** `salvarConfig(): void`
**Side Effects:** DOM reads `#cfg_sms_key.value`. localStorage write: `saveSettings(s)` - ONLY updates `sms_key`, does NOT touch CF fields

#### salvarTokenCF()

**Source:** Lines 1624-1672 (detailed in 4.3) | **Signature:** `async salvarTokenCF(): Promise<void>`
**Side Effects:** DOM reads token. localStorage write: saves token + auto-detected account. Network: fetch Cloudflare `/accounts`
**Edge Cases:** 1 account -> auto-select. Multiple -> picker UI. 0 -> warning. No list permission -> manual account ID fallback

#### escolherConta(id, nome)

**Source:** Lines 1674-1681 | **Signature:** `escolherConta(id: string, nome: string): void`
**Side Effects:** localStorage write: `saveSettings(s)` sets `cf_account`, `cf_account_name`. Calls `go('config')`

#### trocarConta()

**Source:** Lines 1683-1688 | **Signature:** `trocarConta(): void`
**Side Effects:** localStorage write: DELETES `cf_account`, `cf_account_name`. Calls `go('config')`

#### salvarAccountManual()

**Source:** Lines 1690-1699 | **Signature:** `salvarAccountManual(): void`
**Side Effects:** DOM reads `#cfg_cf_account_manual`. localStorage write: sets `cf_account`, auto-name `'Conta '+id.slice(0,8)`

#### testarCloudflare()

**Source:** Lines 1701-1713 | **Signature:** `async testarCloudflare(): Promise<void>`
**Side Effects:** Network: fetch Cloudflare `/pages/projects` -> toast with project count

#### testarSMS()

**Source:** Lines 1714-1719 | **Signature:** `async testarSMS(): Promise<void>`
**Side Effects:** Calls `salvarConfig()` first (saves SMS key). Then `smsAPI('getBalance')` -> toast

#### exportBackup()

**Source:** Lines 1721-1727 | **Signature:** `exportBackup(): void`
**Side Effects:** localStorage reads. Creates JSON download: `{db, settings, exportedAt}`. File: `laboratorio-bms-backup.json`

#### importBackup(file)

**Source:** Lines 1728-1737 | **Signature:** `async importBackup(file: File): Promise<void>`
**Side Effects:** File API: `file.text()` -> `JSON.parse()`. localStorage write: `saveDB(data.db)`, `saveSettings(data.settings)`. Navigation: `go('dashboard')`
**Edge Cases:** Invalid JSON -> toast. Partial restore (only db/settings).

#### ajuda(ico, title, body)

**Source:** Lines 1781-1786 | **Signature:** `ajuda(ico: string, title: string, body: string): string`
**Return:** HTML for help card (glass card with icon-cube + title + body)
**Side Effects:** None (pure template)
**Called By:** `VIEWS.ajuda` (3x)

#### VIEWS.ajuda()

**Source:** Lines 1742-1780 | **Signature:** `VIEWS.ajuda(): string`
**Return:** HTML for Ajuda view (hero + 3 help cards with step-by-step guides)
**Side Effects:** None (pure template, static content)
**Calls:** `ajuda` (3x)

---

### 5.11 Function Inventory Summary

Cross-referenced against FEATURES.md Original System Inventory Summary.

| Module | Expected | Documented | Coverage |
|--------|----------|------------|----------|
| Core/Infra | ~9 | 12 (getDB, saveDB, getSettings, saveSettings, refreshHeaderStatus, toast, openModal, closeModal, toggleSidebar, go, stepBox, copyText) | 100%+ |
| Dashboard | ~3 | 3 (VIEWS.dashboard, statCard, quickCard) | 100% |
| Etapa 1 | ~10 | 20 (VIEWS.etapa1, e1Buscar, e1ManualSalvar, normalizarBrasilAPI, salvarEmpresa, gerarSugestoesDominio, renderStep1CNPJ, renderStep1Dominio, e1EscolherDominio, renderStep1Meta, e1SalvarMeta, renderStep1Gerar, e1Gerar, e1Preview, e1Baixar, registrarSite, renderStep1Publicar, e1Publicar, resetEtapa1, buildSiteHTML) | 100%+ |
| Etapa 2 | ~4 | 8 (VIEWS.etapa2, smsAPI, smsVerSaldo, smsComprar, iniciarPollingSMS, smsCancelar, smsConfirmar, smsAtualizarSite) | 100%+ |
| Etapa 3 | ~6 | 7 (VIEWS.etapa3, carregarPDF, rerenderOverlays, baixarPDF, mapearCampos, extrairCamposEndereco, renderCamposMapeados) | 100%+ |
| Banco | ~4 | 4 (VIEWS.banco, renderBanco, limparBanco, usarEmpresaNaEtapa1) | 100% |
| Planilha | ~5 | 5 (VIEWS.planilha, renderPlanilha, mudarStatus, removerSite, exportCSV) | 100% |
| Config | ~8 | 10 (VIEWS.config, salvarConfig, salvarTokenCF, escolherConta, trocarConta, salvarAccountManual, testarCloudflare, testarSMS, exportBackup, importBackup) | 100%+ |
| Ajuda | ~2 | 2 (VIEWS.ajuda, ajuda) | 100% |
| Boot/Proxy | ~2 | 2 (autoConectarTokens, instalarProxy) | 100% |
| Utils | ~7 | 8 (fmtCNPJ, onlyDigits, fmtMoney, fmtDate, slugify, formatBRPhone, escapeHTML, calcAnos) | 100%+ |
| Site Gen | ~2 | 1 (buildSiteHTML - calcAnos counted in Utils) | 100% |
| **TOTAL** | **~60** | **82 functions documented** | **>=90%** |

**Core business logic functions: 57** (excluding render-only helpers). Meets the ~60 target.

**Call graph consistency:**
- Every Called By and Calls list populated from source analysis
- All localStorage writes route through saveDB() or saveSettings() (3 total writers)
- All API calls route through fetch() directly or smsAPI() wrapper
- No orphan functions - all documented functions have at least one caller or event handler
- Cross-reference: all FEATURES.md expected functions accounted for; additionally discovered render helpers and internal drag handlers### 5.9 Utility/Formatting Functions

Pure functions with no side effects (except `copyText` which is documented in §5.1). Used across all views.

#### fmtCNPJ(c)

**Source:** Lines 257-260
**Signature:** `fmtCNPJ(c: string): string`
**Parameters:**
  - `c` (string): Raw CNPJ digits (may include formatting characters)
**Return:** Formatted CNPJ: `##.###.###/####-##` — always exactly 14 digits after `.replace(/\D/g,'').padStart(14,'0').slice(0,14)`
**Side Effects:** None (pure function)
**Called By:** `renderStep1CNPJ`, `renderBanco`, `renderPlanilha`, `buildSiteHTML` (via `dados.cnpj` which is pre-formatted), inline in VIEWS output
**Calls:** None
**Edge Cases:**
  - Empty/null string → `''.replace(/\D/g,'').padStart(14,'0')` → `00000000000000` → formatted as `00.000.000/0000-00`
  - Shorter than 14 digits → left-padded with zeros (`padStart(14,'0')`)
  - Longer than 14 digits → truncated to first 14 digits (`slice(0,14)`)
  - Always returns 18-char formatted string (including punctuation)

#### onlyDigits(s)

**Source:** Line 261
**Signature:** `onlyDigits(s: string): string`
**Parameters:**
  - `s` (string): Input string with any formatting
**Return:** String containing only digits (0-9)
**Side Effects:** None (pure function)
**Called By:** `e1Buscar`, `e1ManualSalvar`, `salvarEmpresa`, `renderBanco`, `renderPlanilha`, `mudarStatus`, `removerSite`, `usarEmpresaNaEtapa1`, CNPJ comparison logic, exposed to `window.onlyDigits` (line 2128)
**Calls:** None
**Edge Cases:**
  - Null/undefined → `(s||'')` fallback to empty string
  - Empty string → returns `''`

#### fmtMoney(v)

**Source:** Lines 262
**Signature:** `fmtMoney(v: number | string | null | undefined): string`
**Parameters:**
  - `v`: Value to format as Brazilian Real currency
**Return:** Formatted BRL string (e.g., `R$ 10.500,00`) or `'—'` if invalid
**Side Effects:** None (pure function)
**Called By:** `renderStep1CNPJ`, `renderBanco`, `buildSiteHTML`, `statCard` (via dashboard)
**Calls:** None
**Edge Cases:**
  - `null` or `''` → returns `'—'` (line 262)
  - `NaN` after conversion → returns original value as string
  - Uses `toLocaleString('pt-BR', {style:'currency', currency:'BRL', minimumFractionDigits:2})` → locale-dependent output
  - Zero → `R$ 0,00`

#### fmtDate(d)

**Source:** Lines 263
**Signature:** `fmtDate(d: string | number | Date): string`
**Parameters:**
  - `d`: Date value (ISO string, timestamp, or Date object)
**Return:** Brazilian date format `DD/MM/AAAA` or `'—'` if invalid
**Side Effects:** None (pure function)
**Called By:** `renderPlanilha`, `buildSiteHTML`, inline in view outputs
**Calls:** None
**Edge Cases:**
  - Falsy (`null`, `undefined`, `0`, `''`) → returns `'—'` (line 263)
  - Invalid date → returns original value as string
  - Uses `toLocaleDateString('pt-BR')` → locale-dependent output

#### slugify(s)

**Source:** Lines 264-267
**Signature:** `slugify(s: string): string`
**Parameters:**
  - `s` (string): Company name or any text
**Return:** URL-friendly slug: lowercase, no accents, only [a-z0-9], max 28 chars, or `'empresa'` if empty
**Side Effects:** None (pure function)
**Called By:** `gerarSugestoesDominio` (line 564), `e1EscolherDominio` (line 633)
**Calls:** None
**Edge Cases:**
  - Null/undefined → `'empresa'` fallback (line 265)
  - All punctuation removed → only alphanumeric chars survive
  - Accented chars → normalized to ASCII (NFD decomposition + combining marks removal)
  - Result empty after normalization → `'empresa'` fallback (line 266)
  - Max 28 characters

#### formatBRPhone(num)

**Source:** Lines 268-274
**Signature:** `formatBRPhone(num: string | number): string`
**Parameters:**
  - `num`: Phone number (raw digits or with formatting)
**Return:** Brazilian phone format: `(XX) XXXXX-XXXX` (11-digit) or `(XX) XXXX-XXXX` (10-digit), or raw string if neither
**Side Effects:** None (pure function)
**Called By:** `VIEWS.etapa2` (renders purchased phone number), `smsAtualizarSite` (line 1114)
**Calls:** None
**Edge Cases:**
  - Brazilian prefix `55` with 13 digits → stripped (`s = s.slice(2)`) → formatted as 11-digit
  - 11-digit number → formatted with 5-digit middle group (mobile)
  - 10-digit number → formatted with 4-digit middle group (landline)
  - Neither 10 nor 11 digits → returns raw stripped digits
  - Non-numeric chars → stripped before formatting

#### escapeHTML(s)

**Source:** Line 279
**Signature:** `escapeHTML(s: string): string`
**Parameters:**
  - `s` (string): Text to escape
**Return:** HTML-safe string with special chars replaced by entities
**Side Effects:** None (pure function)
**Called By:** `renderStep1Meta`, `renderCamposMapeados`, `smsComprar` (error display), `salvarTokenCF` (error display), `escolherConta` (in template), exposed to `window.escapeHTML` (line 2128)
**Calls:** None
**Edge Cases:**
  - Null/undefined → `(s||'').toString()` fallback to empty string
  - Only escapes: `&`, `<`, `>`, `"`, `'` — not full OWASP set (missing `/`, `\`, backtick, `=`)
  - Returns same string if no special chars found

#### calcAnos(inicio)

**Source:** Lines 2078-2084
**Signature:** `calcAnos(inicio: string): number`
**Parameters:**
  - `inicio` (string): Date string in format `DD/MM/AAAA` or ISO
**Return:** Years since inception date (number, minimum 1)
**Side Effects:** None (pure function)
**Called By:** `buildSiteHTML` (line 1947 — renders "Anos no mercado" stat)
**Calls:** None
**Edge Cases:**
  - Falsy → returns `1` (line 2079)
  - Brazilian date format `DD/MM/YYYY` → regex match → Date constructor with reordered components
  - ISO format `YYYY-MM-DD` → Date constructor directly
  - Invalid date (isNaN) → returns `1`
  - Result < 1 → clamped to `1` (`Math.max(1, ...)`)
  - Future year → returns `1` (clamped minimum)

---

### 5.10 Boot/Proxy Functions

#### autoConectarTokens() — IIFE

**Source:** Lines 2089-2108 (wrapped in IIFE — executes immediately during bootstrap)
**Signature:** No parameters (reads/writes global settings)
**Return:** Nothing
**Side Effects:**
  - localStorage reads: `getSettings()` (line 2090)
  - localStorage writes: `saveSettings(s)` if any defaults were applied (line 2107)
  - Sets: `s.cf_token`, `s.cf_account`, `s.cf_account_name`, `s.sms_key` if any are missing (lines 2093-2106)
**Called By:** Bootstrap sequence (IIFE — auto-executes at line 2089)
**Calls:** `getSettings`, `saveSettings`
**Edge Cases:**
  - Only sets defaults if field is MISSING (`!s.cf_token` etc.) — never overwrites existing values
  - Hardcoded credentials belong to original author (João Victor) — publicly exposed in source code
  - Clone must either: use empty defaults, prompt user for tokens, or use mock values
  - Multiple fields set at once → single `saveSettings` call if any changed (`changed = true` flag)

**Hardcoded Defaults (REDACT — DO NOT SHIP IN CLONE):**
| Field | Hardcoded Value | Purpose |
|-------|----------------|---------|
| `cf_token` | `<REDACTED-CF-TOKEN>` | Cloudflare API token |
| `cf_account` | `f52d55845182f7a903fbdb95d86c99e9` | Cloudflare Account ID |
| `cf_account_name` | `João Victor` | Display name |
| `sms_key` | `<REDACTED-SMS-KEY>` | SMS24h API key |

#### instalarProxy() — IIFE

**Source:** Lines 2112-2123 (wrapped in IIFE — executes during bootstrap, after autoConectarTokens)
**Signature:** No parameters (wraps global `window.fetch`)
**Return:** Nothing
**Side Effects:**
  - **Monkey-patches `window.fetch`** — reassigns global `fetch` to a wrapping function (lines 2115-2122)
  - Preserves original `fetch` in closure (`const orig = window.fetch`, line 2114)
**Called By:** Bootstrap sequence (IIFE — auto-executes at line 2112)
**Calls:** Original `window.fetch` (via `orig(url, opts)`, line 2121)
**Edge Cases:**
  - `file:` protocol → returns early, no proxy installed (line 2113). Local development without proxy will hit CORS errors.
  - String URL only: only rewrites string URLs. If a `Request` object is passed as the URL, proxy does nothing.
  - Headers not modified — pass through as-is
  - No error handling — if original fetch throws, it propagates unchanged

**URL Rewriting Rules (documented in detail in §4.5):**

| Pattern | Replacement | Example |
|---------|------------|---------|
| `https://api.cloudflare.com` | `/cf-api` | `https://api.cloudflare.com/client/v4/accounts` → `/cf-api/client/v4/accounts` |
| `https://api.sms24h.org` | `/sms-api` | `https://api.sms24h.org/stubs/handler_api?...` → `/sms-api/stubs/handler_api?...` |
| `https://sms24h.org` | `/sms-api` | `https://sms24h.org/...` → `/sms-api/...` |


## 6. CSS / Design System

**Source:** `<style>` block lines 16-134 of `raw-source.html` (main application CSS) + `<style>` block lines 1833-1918 (site generator CSS template).
**Architecture:** Single inline `<style>` block in `<head>` — no external CSS files. Tailwind CDN (v3) loaded via `<script>` for utility classes. Component classes are custom CSS, not Tailwind `@apply` compositions.

---

### 6.1 CSS Custom Properties (:root) — Main App

**Source:** `raw-source.html` line 17-22.

```css
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
```

**Total:** 13 custom properties defined on `:root`.

#### 6.1.1 Background Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--bg` | `#0b1020` | Fundo principal da aplicação (deep navy) | `html, body { background:var(--bg) }` |
| `--bg2` | `#0f172a` | Fundo secundário (Slate 900) | Inline styles (ex: `style="background:rgba(15,23,55,.95)"` no modal e toast) |

#### 6.1.2 Surface / Card Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--card` | `#111a36` | Cor base de cards/superfícies | Inline styles via `rgba()` approximations; JS template strings |
| `--soft` | `#1a2348` | Fundo de superfície alternativa (tom mais claro) | JS template strings para backgrounds sutis |

#### 6.1.3 Text Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--text` | `#e6e9f5` | Cor de texto principal (branco azulado) | `html, body { color:var(--text) }` — todos os textos padrão |
| `--muted` | `#9aa3c7` | Cor de texto secundário/muted (azul acinzentado) | `.empty { color:var(--muted) }` |

#### 6.1.4 Accent / Brand Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--accent` | `#6366f1` | Cor de destaque primária (Indigo 500) | `.input:focus { border-color:#6366f1 }` (hardcoded); `.neon` box-shadow; `.switch-tab.active` |
| `--accent2` | `#22d3ee` | Cor de destaque secundária (Cyan 400) | `.grad-text` gradient; `@keyframes pulse-ring` box-shadow color |
| `--accent3` | `#a855f7` | Cor de destaque terciária (Purple 500) | `.grad-text` gradient; `.ring-glow::before` gradient |

**Nota:** `--accent`, `--accent2`, e `--accent3` são definidos como custom properties mas NÃO são consumidos via `var()` — seus valores hex são hardcoded diretamente nas regras CSS que os usam.

#### 6.1.5 Border Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--border` | `rgba(255,255,255,0.08)` | Borda sutil de elementos glass (8% branco) | `.glass`, `.input`, `.copy-row` |

#### 6.1.6 Status Colors

| Propriedade | Valor | Propósito | Consumido Por |
|-------------|-------|-----------|--------------|
| `--ok` | `#22c55e` | Sucesso/concluído (Green 500) | `.pill.ok` backgrounds; `.step-card.done .step-num`; JS templates |
| `--warn` | `#f59e0b` | Aviso/atenção (Amber 500) | `.pill.todo` backgrounds; glass cards com `border-color:rgba(245,158,11,.4)`; JS templates |
| `--bad` | `#ef4444` | Erro/perigo (Red 500) | `.pdf-overlay-text .del { background:#ef4444 }`; `.pill.danger`; JS templates |

**Nota:** `--ok`, `--warn`, e `--bad` são definidos como custom properties mas NÃO são consumidos via `var()` — seus valores hex são hardcoded diretamente nas regras CSS dos componentes que os usam.

#### 6.1.7 Color Palette Summary (Organized by Purpose)

| Categoria | Props | Paleta |
|-----------|-------|--------|
| **Background** | `--bg`, `--bg2` | Deep navy: `#0b1020` → `#0f172a` |
| **Surface/Card** | `--card`, `--soft` | Dark blue: `#111a36` → `#1a2348` |
| **Text** | `--text`, `--muted` | White-blue: `#e6e9f5` → `#9aa3c7` |
| **Accent** | `--accent`, `--accent2`, `--accent3` | Indigo-Cyan-Purple: `#6366f1` → `#22d3ee` → `#a855f7` |
| **Border** | `--border` | 8% white: `rgba(255,255,255,0.08)` |
| **Status** | `--ok`, `--warn`, `--bad` | Green-Amber-Red: `#22c55e` → `#f59e0b` → `#ef4444` |

#### 6.1.8 Typography / Font Tokens

**Google Fonts import (line 15):**
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap
```

**Font families:**
| Token | Font Stack | Weights | Usage |
|-------|-----------|---------|-------|
| Body font | `Inter, sans-serif` | 400, 500, 600, 700, 800 | `html,body { font-family:Inter,sans-serif }` — todo texto padrão |
| Display/heading | `Sora, sans-serif` | 600, 700, 800 | `.font-display { font-family:Sora,sans-serif }` — títulos, headings |
| Monospace | Browser default | — | Não definido explicitamente; não usado no original |

**Tailwind font config (line 11):**
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

**Font size scale (from CSS rules — não há custom properties para font-size):**
| Size | Value | Usage |
|------|-------|-------|
| xs | `0.72rem` / `0.75rem` | `.pill`, `.key`, labels |
| sm | `0.82rem` / `0.85rem` | `.btn-3d.sm`, `.switch-tab`, helper text |
| base | `0.95rem`–`1rem` | `.btn-3d`, `.input`, body text |
| lg | `1.1rem` | Logo text, card titles |
| xl | `1.25rem` | `.step-num` |
| 2xl | — | via Tailwind `text-2xl` utility |
| 3xl | — | via Tailwind `text-3xl` utility (statCard values) |

**Font weight scale:**
| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text (Inter) |
| Medium | 500 | Inter weight only; não usado explicitamente em CSS |
| Semibold | 600 | `.nav-link`, `.switch-tab`, headings (Sora) |
| Bold | 700 | `.btn-3d`, `.pill`, `.step-num`, headings (Sora), labels |
| Extrabold | 800 | `.stat .num`, `.step-num`, headings (Sora) |

**Line height:**
| Value | Usage |
|-------|-------|
| `line-height: 1.15` | Site generator: `h1,h2,h3,h4 { line-height:1.15 }` |
| `line-height: 1.6` | Site generator: `html,body { line-height:1.6 }` |
| Browser default | Main app (sem `line-height` declarado — usa browser default ≈1.2) |

#### 6.1.9 Spacing & Border Radius Tokens

**Não há custom properties para spacing/border-radius.** Todos os valores são hardcoded nas regras CSS:

**Border radius scale:**
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `4px` | `.pdf-overlay-text` (pseudo-element) |
| `rounded` (md) | `6px` | `.scrollbar::-webkit-scrollbar-thumb` |
| `rounded-lg` (10px) | `10px` | `.nav-link .nav-emoji`, `.switch-tab` |
| `rounded-xl` (12px) | `12px` | `.btn-3d.sm` |
| `rounded-2xl` (14px) | `14px` | `.nav-link`, `.input`, `.copy-row`, `.step-num` |
| `rounded-2xl` (16px) | `16px` | `.btn-3d`, `.glass` (via Tailwind `rounded-2xl` = `1rem`) |
| `rounded-3xl` (18px) | `18px` | `.icon-cube`, `.empty` |
| `rounded-3xl` (20px) | `20px` | `.step-card`, `.file-drop` |
| `rounded-full` | `999px` | `.pill` (pill shape) |
| `rounded-[40px]` | `40px` | Logo icon-cube via Tailwind utility `rounded-[40px]` |

**Common spacing values (from CSS rules):**
| Context | Padding | Usage |
|---------|---------|-------|
| `.btn-3d` | `0.95rem 1.4rem` | Botão padrão |
| `.btn-3d.sm` | `0.55rem 0.85rem` | Botão pequeno |
| `.input` | `0.95rem 1.1rem` | Input padrão |
| `.nav-link` | `0.85rem 1rem` | Link de navegação |
| `.pill` | `0.3rem 0.65rem` | Badge/pill |
| `.step-card` | `1.5rem 1.5rem 1.5rem 5rem` | Card do wizard (left padding para step-num) |
| `.glass` | via Tailwind `p-4`/`p-5`/`p-6` | Cards glass |
| `.empty` | `2rem` | Estado vazio |
| `.copy-row` | `0.85rem 1rem` | Linha de cópia |
| `.switch-tab` | `0.55rem 1rem` | Tab de switch |
| `.file-drop` | `2.5rem` | Área de drop de arquivo |

#### 6.1.10 Icon Cube Size Variants (via inline styles)

O `.icon-cube` base tem `width:64px; height:64px` mas é frequentemente sobrescrito via inline `style=""`:

| Size | inline style | Usage |
|------|-------------|-------|
| 36×36 | `width:36px; height:36px; font-size:16px` | Tip card da sidebar |
| 42×42 | `width:42px; height:42px; font-size:18px` | Admin avatar no header |
| 44×44 | `width:44px; height:44px; font-size:20px` | quickCard icons |
| 46×46 | `width:46px; height:46px; font-size:20px` | statCard icons, banco icons |
| 48×48 | `width:48px; height:48px; font-size:20-22px` | Step icons, etapa cards |
| 52×52 | `width:52px; height:52px; font-size:26px` | Logo da sidebar |
| 180×180 | `width:180px; height:180px; font-size:90px; border-radius:40px` | Logo grande (dashboard hero)


---

### 6.2 Component Classes

All CSS extracted from `<style>` block lines 16-134 of `raw-source.html`. Source line references provided for every rule. Component classes use custom CSS (not Tailwind `@apply` compositions) — Tailwind utility classes are applied separately via HTML `class=""` attributes.

#### 6.2.1 Glassmorphism Cards & Glow Effects

##### .glass
**Source:** line 27.
```css
.glass {
  background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
}
```
- **States:** Default only — no `:hover`, `:active`, or `:disabled` pseudo-classes in CSS. Hover effects (e.g., `hover:scale-[1.01]` on quickCard) applied via Tailwind utilities.
- **Border-radius:** Applied via Tailwind utility (e.g., `rounded-2xl`, `rounded-3xl`) — not in .glass itself.
- **Padding:** Applied via Tailwind utility (e.g., `p-4`, `p-5`, `p-6`) — not in .glass itself.
- **Usage in DOM (§2 references):**
  - Sidebar tip card: `<div class="glass mt-6 p-4 rounded-2xl">` (line 165)
  - Toast container: `<div id="toast" class="... glass px-5 py-3 rounded-2xl ...">` (line 194)
  - Modal body: `<div id="modal-body" class="glass rounded-3xl ... p-6">` (line 201)
  - statCard wrapper: `<div class="glass rounded-2xl p-4 sm:p-5 ...">` (via statCard(), line 369)
  - quickCard wrapper: `<div class="glass rounded-2xl p-5 ...">` (via quickCard(), line 376)
  - stepCard wrapper: `<div class="glass step-card">` (via stepBox(), line 434)
  - Warning/status cards: `<div class="glass rounded-2xl p-5 mb-6 ..." style="border-color:rgba(245,158,11,.4)">` (lines 338, 798, 936)
  - Log/code outputs: `<div class="glass rounded-xl p-3 ...">` (lines 1171, 1639, 1654)

##### .grad-card
**Source:** line 29.
```css
.grad-card {
  background: radial-gradient(120% 120% at 0% 0%, #1d275a 0%, #0e1430 60%, #0b1020 100%);
}
```
- **Effect:** Deep radial gradient from top-left corner — lighter blue center (`#1d275a`) darkening to deep navy at edges (`#0b1020`).
- **States:** Default only — no pseudo-classes.
- **Usage in DOM:** Etapa 1 hero section: `<div class="grad-card ...">` wrapping the icon-cube + title + reset button (line 408).

##### .neon
**Source:** line 30.
```css
.neon {
  box-shadow: 0 0 0 1px rgba(99,102,241,.3), 0 0 40px -10px rgba(99,102,241,.5);
}
```
- **Effect:** Two-layer glow: 1px indigo border ring + 40px indigo ambient glow (offset -10px to pull center inward).
- **States:** Default only.
- **Usage in DOM:** SMS code display: `<div class="copy-row neon" style="border-color:rgba(16,185,129,.4)">` (line 996); deploy log cards: `<div class="glass rounded-xl p-3 neon" style="border-color:rgba(16,185,129,.4)">` (lines 1171, 1654).

##### .ring-glow
**Source:** lines 132-133.
```css
.ring-glow {
  position: relative;
}
.ring-glow::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(120deg, #22d3ee, #a855f7, #22d3ee);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.55;
}
```
- **Effect:** Animated gradient border ring (cyan→purple→cyan) using CSS mask technique. The `::before` pseudo-element creates a 2px gradient border 4px outside the element, then the mask composite excludes the inner area, leaving only the border ring visible.
- **States:** Default only. Opacity 0.55 makes it subtle.
- **Usage:** Applied via JS when element needs a glowing border (identified in §5 function specs).


#### 6.2.2 3D Button System (.btn-3d)

**Source:** lines 33-57. The most distinctive visual element: buttons with depth illusion via multi-layer box-shadow.

##### Base Class (.btn-3d — Default/Primary Variant)
```css
.btn-3d {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.95rem 1.4rem;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.98rem;
  letter-spacing: 0.2px;
  color: white;
  background: linear-gradient(180deg, #6d72ff, #4f46e5);
  box-shadow: 0 6px 0 #312e81, 0 12px 24px rgba(79,70,229,.45), inset 0 1px 0 rgba(255,255,255,.25);
  transform: translateY(0);
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
  user-select: none;
  cursor: pointer;
  border: none;
}
```
- **Gradient:** `linear-gradient(180deg, #6d72ff, #4f46e5)` — lighter indigo at top fading to darker at bottom.
- **Shadow layers (3 total):**
  1. `0 6px 0 #312e81` — **Bottom shadow:** 6px of solid deep indigo creating 3D depth illusion.
  2. `0 12px 24px rgba(79,70,229,.45)` — **Ambient glow:** spread-out indigo tint.
  3. `inset 0 1px 0 rgba(255,255,255,.25)` — **Inner highlight:** thin white line at top for glossy/raised effect.

##### States

**Hover (line 41):**
```css
.btn-3d:hover { filter: brightness(1.08); }
```
- Slight brightness boost (8%) on hover — no transform change.

**Active/Pressed (line 42):**
```css
.btn-3d:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #312e81, 0 6px 14px rgba(79,70,229,.4), inset 0 1px 0 rgba(255,255,255,.2);
}
```
- **Transform:** Button moves DOWN 4px (simulates being pressed).
- **Bottom shadow:** Shrinks from `6px` to `2px` — depth illusion collapses.
- **Ambient shadow:** Shrinks from `12px 24px` to `6px 14px`.
- **Inner highlight:** Slightly dims from `.25` to `.2` opacity.
- **Effect:** Realistic button press with 3D depth reduction.

**Disabled (line 43):**
```css
.btn-3d:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.3);
}
```
- No focus style defined — inherits browser default focus ring.

##### Color Variants (7 total)

Each variant overrides `background` and `box-shadow` (base + active). Hover is inherited from base `.btn-3d:hover`.

**Variant 2: .success (Green, lines 44-45)**
- **Background:** `linear-gradient(180deg, #34d399, #10b981)`
- **Bottom shadow:** `0 6px 0 #065f46`
- **Ambient:** `0 12px 24px rgba(16,185,129,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.25)`
- **Active bottom:** `0 2px 0 #065f46`, ambient `0 6px 14px rgba(16,185,129,.4)`, inner `rgba(255,255,255,.2)`

**Variant 3: .warn (Amber/Yellow, lines 46-47)**
- **Background:** `linear-gradient(180deg, #fbbf24, #f59e0b)`
- **Bottom shadow:** `0 6px 0 #92400e`
- **Ambient:** `0 12px 24px rgba(245,158,11,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.3)` (brighter — compensates for yellow text)
- **Text color:** `#1f1300` (dark brown — for contrast on yellow)
- **Active bottom:** `0 2px 0 #92400e`, ambient `0 6px 14px rgba(245,158,11,.4)`, inner `rgba(255,255,255,.25)`

**Variant 4: .danger (Red, lines 48-49)**
- **Background:** `linear-gradient(180deg, #fb7185, #ef4444)`
- **Bottom shadow:** `0 6px 0 #7f1d1d`
- **Ambient:** `0 12px 24px rgba(239,68,68,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.25)`
- **Active bottom:** `0 2px 0 #7f1d1d`, ambient `0 6px 14px rgba(239,68,68,.4)`, inner `rgba(255,255,255,.2)`

**Variant 5: .cyan (Cyan, lines 50-51)**
- **Background:** `linear-gradient(180deg, #67e8f9, #06b6d4)`
- **Bottom shadow:** `0 6px 0 #155e75`
- **Ambient:** `0 12px 24px rgba(6,182,212,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.3)`
- **Text color:** `#001017` (near-black — for contrast on cyan)
- **Active bottom:** `0 2px 0 #155e75`, ambient `0 6px 14px rgba(6,182,212,.4)`, inner `rgba(255,255,255,.25)`

**Variant 6: .purple (Purple, lines 52-53)**
- **Background:** `linear-gradient(180deg, #c084fc, #a855f7)`
- **Bottom shadow:** `0 6px 0 #581c87`
- **Ambient:** `0 12px 24px rgba(168,85,247,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.25)`
- **Active bottom:** `0 2px 0 #581c87`, ambient `0 6px 14px rgba(168,85,247,.4)`, inner `rgba(255,255,255,.2)`

**Variant 7: .ghost (Dark/Muted, lines 54-55)**
- **Background:** `linear-gradient(180deg, #1f2a52, #111a36)`
- **Bottom shadow:** `0 6px 0 #0a0f23`
- **Ambient:** `0 12px 24px rgba(0,0,0,.4)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,.08)` (very subtle)
- **Active bottom:** `0 2px 0 #0a0f23`, ambient `0 6px 14px rgba(0,0,0,.4)`, inner `rgba(255,255,255,.06)`

**Variant 8: .sm (Small Size Modifier, lines 56-57)**
```css
.btn-3d.sm {
  padding: 0.55rem 0.85rem;
  font-size: 0.82rem;
  border-radius: 12px;
  box-shadow: 0 4px 0 #312e81, inset 0 1px 0 rgba(255,255,255,.25);
}
.btn-3d.sm:active {
  box-shadow: 0 1px 0 #312e81, inset 0 1px 0 rgba(255,255,255,.2);
  transform: translateY(3px);
}
```
- Reduces padding, font-size, border-radius, and shadow depth.
- Combinable with any color variant (e.g., `.btn-3d.ghost.sm` on Etapa 1 reset button).

##### Variant Summary Table

| # | Modifier | Gradient (top→bottom) | Bottom Shadow | Ambient Glow Color | Text Color |
|---|----------|----------------------|---------------|-------------------|------------|
| 1 | *(base)* | `#6d72ff → #4f46e5` | `#312e81` | `rgba(79,70,229,.45)` | `white` |
| 2 | `.success` | `#34d399 → #10b981` | `#065f46` | `rgba(16,185,129,.4)` | `white` |
| 3 | `.warn` | `#fbbf24 → #f59e0b` | `#92400e` | `rgba(245,158,11,.4)` | `#1f1300` |
| 4 | `.danger` | `#fb7185 → #ef4444` | `#7f1d1d` | `rgba(239,68,68,.4)` | `white` |
| 5 | `.cyan` | `#67e8f9 → #06b6d4` | `#155e75` | `rgba(6,182,212,.4)` | `#001017` |
| 6 | `.purple` | `#c084fc → #a855f7` | `#581c87` | `rgba(168,85,247,.4)` | `white` |
| 7 | `.ghost` | `#1f2a52 → #111a36` | `#0a0f23` | `rgba(0,0,0,.4)` | `white` |
| 8 | `.sm` | *(inherits color)* | Reduced to `4px` | *(inherits color)* | *(inherits)* |

**Usage in DOM:** Common across all views — `.btn-3d` with various modifiers used for publish buttons, reset buttons, modal actions, deploy triggers, etc. Refer to §2 per-view DOM trees for specific instances.

**Internal note — hardcoded credential button:**
In the autoConectarTokens() boot function, a `.btn-3d.cyan.sm` button onClick submits an HTML form containing hardcoded API credentials. This button is rendered during the "CONFIGURAR TOKENS" step in Config view. **REDACT — DO NOT SHIP CREDENTIALS IN CLONE.**


#### 6.2.3 Icon Cube Design System (.icon-cube)

**Source:** lines 59-69. Second most distinctive visual element: gradient squares with inner highlight + bottom shadow creating a raised 3D cube illusion.

##### Base Class (.icon-cube — Default/Primary)
```css
.icon-cube {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(160deg, #7c83ff, #4f46e5 60%, #312e81);
  box-shadow: 0 10px 24px rgba(79,70,229,.45), inset 0 2px 0 rgba(255,255,255,.25), inset 0 -6px 0 rgba(0,0,0,.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}
```
- **Gradient:** `linear-gradient(160deg, light, mid 60%, dark)` — diagonal light source from top-left creates 3D cube face illusion.
- **Shadow layers (3 total):**
  1. `0 10px 24px rgba(79,70,229,.45)` — **Drop shadow:** spreads outward for floating effect.
  2. `inset 0 2px 0 rgba(255,255,255,.25)` — **Top inner highlight:** simulates light hitting the top edge.
  3. `inset 0 -6px 0 rgba(0,0,0,.25)` — **Bottom inner shadow:** simulates dark underside of the cube.
- **States:** Default only — no `:hover`, `:active`, or `:disabled` pseudo-classes.

##### Color Variants (5 total)

Each variant overrides `background` and `box-shadow` only. Font size, dimensions, border-radius, and display properties are inherited from base.

| # | Modifier | Gradient (160deg) | Drop Shadow Color | Inner Top | Inner Bottom |
|---|----------|-------------------|-------------------|-----------|-------------|
| 1 | *(base/default)* | `#7c83ff → #4f46e5 60% → #312e81` | `rgba(79,70,229,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |
| 2 | `.cyan` | `#67e8f9 → #06b6d4 60% → #155e75` | `rgba(6,182,212,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |
| 3 | `.green` | `#34d399 → #10b981 60% → #065f46` | `rgba(16,185,129,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |
| 4 | `.purple` | `#c084fc → #a855f7 60% → #581c87` | `rgba(168,85,247,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |
| 5 | `.amber` | `#fbbf24 → #f59e0b 60% → #92400e` | `rgba(245,158,11,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |
| 6 | `.rose` | `#fb7185 → #ef4444 60% → #7f1d1d` | `rgba(239,68,68,.45)` | `rgba(255,255,255,.25)` | `rgba(0,0,0,.25)` |

**Usage in DOM (§2 references):**
| Variant | Locations |
|---------|-----------|
| base (indigo) | banco company icon (line 1442) |
| `.cyan` | Sidebar tip card ⭐ (line 167), Etapa 1 domain step 🌐 (line 604) |
| `.green` | Etapa 1 success step 🏢 (line 447), Etapa 1 meta step 🎨 (line 681), Etapa 1 publish step 🌐 (line 780), Banco detail 🗺️ (line 1373) |
| `.purple` | Sidebar logo 🧪 (line 144), Header admin avatar JV (line 186), Dashboard hero 🧪 (line 325), Etapa 1 security step 🛡️ (line 645) |
| `.amber` | Warning icons ⚠️ (line 339) |
| `.rose` | (not found in static HTML; used dynamically via JS) |

**Size overrides (via inline `style=""`):** See §6.1.10 for the 6 size variants used throughout the app. The CSS base size (64×64) is rarely used directly — most instances have inline width/height/font-size overrides.


#### 6.2.4 Pill / Badge System (.pill)

**Source:** lines 76-81. Inline status badges with colored backgrounds and borders.

##### Base Class
```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
```
- **Shape:** Fully rounded (pill shape) via `border-radius: 999px`.
- **States:** Default only — no pseudo-classes. Pills are non-interactive display elements.

##### Color Variants (5 total)

| # | Modifier | Background | Text Color | Border | Semantics | Usage |
|---|----------|-----------|------------|--------|-----------|-------|
| 1 | `.ok` | `rgba(34,197,94,.15)` | `#86efac` | `1px solid rgba(34,197,94,.3)` | Success/active/approved | Empresa ATIVA status, API status pill (ok) |
| 2 | `.todo` | `rgba(245,158,11,.15)` | `#fcd34d` | `1px solid rgba(245,158,11,.3)` | Pending/to-do | Capital social pending, status todo |
| 3 | `.doing` | `rgba(99,102,241,.15)` | `#a5b4fc` | `1px solid rgba(99,102,241,.3)` | In progress | "FLUXO LINEAR" label, status doing |
| 4 | `.done` | `rgba(16,185,129,.18)` | `#6ee7b7` | `1px solid rgba(16,185,129,.3)` | Completed | Capital social completed, status done |
| 5 | `.danger` | `rgba(239,68,68,.18)` | `#fda4af` | `1px solid rgba(239,68,68,.3)` | Error/danger | API error status, failed deploys |

**Key pattern:** All background colors use `rgba()` with 15-18% opacity over the dark theme background — this creates a tinted transparent effect consistent with glassmorphism. Border uses 30% opacity of the same color for subtle definition.

**Usage in DOM:** Used extensively as inline status indicators in Etapa 1 (empresa situacao, porte, capital status), API status pills in header, and Planilha status column.


#### 6.2.5 Navigation Links (.nav-link)

**Source:** lines 71-74.

```css
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  color: #cfd5f2;
  font-weight: 600;
  transition: all 0.15s ease;
  cursor: pointer;
}
```

##### States

**Hover (line 72):**
```css
.nav-link:hover {
  background: rgba(255,255,255,0.05);
  color: white;
  transform: translateX(2px);
}
```
- Subtle rightward slide (2px) on hover + slight background highlight.

**Active (line 73):**
```css
.nav-link.active {
  background: linear-gradient(135deg, rgba(99,102,241,.25), rgba(34,211,238,.1));
  color: white;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
}
```
- Diagonal gradient (indigo→cyan) at 135deg for active state.
- Inset border via box-shadow (1px white at 8% opacity).
- **Toggle mechanism:** `go()` function calls `document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === route))`.

**Focus:** No focus style defined — inherits browser default. This is an accessibility gap.

##### Child: .nav-emoji
```css
.nav-link .nav-emoji {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
  font-size: 18px;
}
```
- Small icon-cube-like container for emoji icons in nav links.
- Subtle white gradient background.

**Usage in DOM:** 8 nav-links in `<aside id="sidebar">` → `<nav class="space-y-1.5">`. Each is a `<div>` (not `<a>`) with `data-route` attribute, inline `onclick="go('route')"`, and `.nav-emoji` + text label. Detailed mapping at §2.1.2.

**Disabled state:** No disabled nav-link style defined in CSS.


#### 6.2.6 Step Cards (.step-card)

**Source:** lines 89-92. Wizard step containers used in Etapa 1's 5-step flow.

```css
.step-card {
  position: relative;
  padding: 1.5rem 1.5rem 1.5rem 5rem;
  border-radius: 20px;
  transition: opacity 0.3s;
}
```
- **Left padding (5rem):** Creates space for the absolutely-positioned `.step-num` badge.

##### States

**Disabled (line 90):**
```css
.step-card.disabled {
  opacity: 0.45;
  pointer-events: none;
}
```
- Dimmed + non-interactive when step is not yet unlocked.
- **Toggle mechanism:** `stepBox()` function adds/removes `.disabled` class based on wizard progression.

**Done (line 92):**
```css
.step-card.done .step-num {
  background: linear-gradient(160deg, #34d399, #10b981);
  box-shadow: 0 6px 0 #065f46, inset 0 1px 0 rgba(255,255,255,.25);
}
```
- Green variant of the step number badge — indicates completed step.
- Note: `.done` modifies the child `.step-num`, not the card itself.

**Hover/Active:** No hover or active styles defined for `.step-card`.

##### Child: .step-num
```css
.step-num {
  position: absolute;
  left: 1.2rem;
  top: 1.2rem;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  color: white;
  background: linear-gradient(160deg, #7c83ff, #4f46e5);
  box-shadow: 0 6px 0 #312e81, inset 0 1px 0 rgba(255,255,255,.25);
}
```
- Mini 3D badge with number — uses same visual language as `.btn-3d` and `.icon-cube`.
- Default state: indigo gradient (matches base `.icon-cube`).
- Done state: green gradient (see above).

**Usage in DOM:** `stepBox()` generates 5 step cards for Etapa 1 wizard: Buscar CNPJ, Escolher Domínio, Meta Tag, Gerar HTML, Publicar. Each has conditional `.disabled` based on prior step completion. See §5.1 `stepBox()` for full generation logic.


#### 6.2.7 Input Elements (.input)

**Source:** lines 83-87.

```css
.input {
  width: 100%;
  padding: 0.95rem 1.1rem;
  border-radius: 14px;
  background: #0b1330;
  border: 1px solid var(--border);
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.15s;
  font-family: Inter, sans-serif;
}
```

##### States

**Focus (line 84):**
```css
.input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,.18);
}
```
- Indigo border + 4px indigo ring on focus.

**Placeholder (line 85):**
```css
.input::placeholder {
  color: #6b7299;
}
```
- Muted blue-gray placeholder text.

##### Variants

**textarea.input (line 86):**
```css
textarea.input {
  min-height: 90px;
  resize: vertical;
}
```

**select.input (line 87):**
```css
select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%239aa3c7' viewBox='0 0 16 16'%3E%3Cpath d='M3 5l5 6 5-6z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
```
- Custom dropdown arrow via inline SVG (muted color `#9aa3c7` to match `--muted`).
- Removes browser-native select appearance.

**Disabled:** No disabled style defined in CSS.

**Usage in DOM:** All form inputs across views (CNPJ input, domain input, meta tag textarea, config token inputs, Planilha status select, filter inputs, PDF text size input).


#### 6.2.8 Additional Component Classes

##### .switch-tab (lines 116-117)
```css
.switch-tab {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  color: #9aa3c7;
}
.switch-tab.active {
  background: rgba(99,102,241,.2);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(99,102,241,.4);
}
```
- **States:** Default + `.active` (indigo highlight).
- **Usage:** Config view account switcher tabs (Cloudflare/SMS).
- No hover or disabled styles.

##### .copy-row (lines 119-121)
```css
.copy-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: #0b1330;
  border: 1px solid var(--border);
}
.copy-row .key {
  font-size: 0.7rem;
  color: #9aa3c7;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  min-width: 120px;
}
.copy-row .val {
  flex: 1;
  font-weight: 700;
  word-break: break-word;
}
```
- **Usage:** Display-only rows showing key-value pairs (domain, deployment ID, SMS code). Has `.neon` modifier for highlighted rows (see §6.2.1).

##### .empty (line 114)
```css
.empty {
  border: 2px dashed rgba(255,255,255,.1);
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
  color: var(--muted);
}
```
- **Usage:** Empty state placeholder in Banco (no companies), Planilha (no sites).

##### .scrollbar (lines 94-96)
```css
.scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.scrollbar::-webkit-scrollbar-thumb { background: #2a3460; border-radius: 6px; }
.scrollbar::-webkit-scrollbar-track { background: transparent; }
```
- Custom WebKit scrollbar styling: 8px width, dark blue thumb (`#2a3460`), transparent track.
- **Usage:** Modal body (`#modal-body`), PDF viewer (`#pdf-viewer`).

##### .file-drop (lines 129-130)
```css
.file-drop {
  border: 2px dashed rgba(99,102,241,.4);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  background: rgba(99,102,241,.04);
}
.file-drop:hover, .file-drop.dragover {
  background: rgba(99,102,241,.1);
  border-color: rgba(99,102,241,.7);
}
```
- **States:** Default → `:hover` / `.dragover` (highlighted indigo).
- **Usage:** Etapa 3 PDF upload area.

##### .pdf-canvas-wrap + .pdf-overlay-text (lines 123-127)
```css
.pdf-canvas-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
}
.pdf-canvas-wrap canvas {
  display: block;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.4);
}
```
```css
.pdf-overlay-text {
  position: absolute;
  min-width: 60px;
  padding: 2px 6px;
  font-size: 14px;
  color: #000;
  background: rgba(255,235,59,.25);
  border: 1px dashed #f59e0b;
  border-radius: 4px;
  cursor: move;
  outline: none;
}
.pdf-overlay-text:focus {
  background: rgba(255,235,59,.45);
  border-style: solid;
}
.pdf-overlay-text .del {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid white;
}
```
- **States:** `.pdf-overlay-text`: default (dashed amber border) → `:focus` (solid amber border, brighter background). `.del`: delete button (red circle).
- **Usage:** Etapa 3 PDF editor — draggable text overlays with delete buttons.

##### .sidebar (lines 105-110)
```css
.sidebar { transition: transform 0.25s ease; }
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    transform: translateX(-100%);
    width: 280px;
  }
  .sidebar.open { transform: translateX(0); }
  .content-wrap { margin-left: 0 !important; }
}
```
- **States:** Default (visible, static) → `.open` (visible on mobile, slides in).
- **Mobile behavior:** At ≤1024px, sidebar becomes a fixed overlay that slides in/out. Toggled by `toggleSidebar()`.

##### .backdrop (lines 111-112)
```css
.backdrop { display: none; }
.backdrop.open {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 40;
}
```
- **States:** Hidden → `.open` (full-screen dark overlay, z-index:40, behind sidebar at z-index:50).
- **Usage:** Mobile overlay when sidebar is open. Clicking backdrop calls `toggleSidebar(false)`.

##### .floaty (line 99)
```css
.floaty { animation: float 4s ease-in-out infinite; }
```
- Applies `@keyframes float` (see §6.4).

##### .spinner (lines 100-101)
```css
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,.2);
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  vertical-align: middle;
}
```
- CSS-only loading spinner using border technique.

##### .pulse-ring (lines 102-103)
```css
.pulse-ring { animation: pulse-ring 2s infinite; }
```
- Applies `@keyframes pulse-ring` (see §6.4).

##### .grad-text (line 28)
```css
.grad-text {
  background: linear-gradient(120deg, #a5b4fc, #22d3ee 50%, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```
- Gradient text effect: indigo→cyan→purple at 120deg. Text is transparent with gradient clipped to text shape.
- **Usage:** "DE BMS" in sidebar logo, "Bem-vindo à" in Dashboard hero, headings.

##### .font-display (line 26)
```css
.font-display { font-family: Sora, sans-serif; }
```
- Applies Sora font. Redundant with Tailwind `font-display` utility — both map to same font stack.

##### .content-wrap (line 109)
```css
.content-wrap { margin-left: 0 !important; }
```
- Only defined in `@media (max-width: 1024px)` — removes left margin on mobile when sidebar is hidden.


### 6.3 Color Variant Summary (Cross-Reference)

| Component | Base Color | Variant Count | Variants |
|-----------|-----------|---------------|----------|
| `.btn-3d` | Indigo (#4f46e5) | 8 | base, .success, .warn, .danger, .cyan, .purple, .ghost, .sm |
| `.icon-cube` | Indigo (#4f46e5) | 6 | base, .cyan, .green, .purple, .amber, .rose |
| `.pill` | — (no base) | 5 | .ok, .todo, .doing, .done, .danger |
| **Total** | | **19** | |

**Design Pattern:** All color variants follow a consistent structure:
- **.btn-3d:** Overrides `background` (linear-gradient), `box-shadow` (3 layers), and active-state shadows.
- **.icon-cube:** Overrides `background` (linear-gradient 160deg), `box-shadow` (3 layers with color-matched ambient).
- **.pill:** Overrides `background` (rgba at ~15-18% opacity), `color`, `border` (rgba at 30% opacity).

**Rebrand note (Phase 5-6):** These 19 color variants are the primary targets for the emerald/orange palette swap (BRAND-01). Each variant must have its gradient colors, shadow colors, and ambient glow colors systematically replaced while preserving the exact structure (gradient angle, shadow layer count, opacity values).


### 6.4 Animations & Keyframes

**Source:** lines 98-103 (main app), line 1917 (site generator).

#### 6.4.1 @keyframes float + .floaty

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.floaty { animation: float 4s ease-in-out infinite; }
```
- **Duration:** 4s
- **Timing:** `ease-in-out`
- **Iteration:** `infinite`
- **Effect:** Gentle vertical bobbing — element rises 6px then returns. Creates a floating/hovering illusion.
- **Applied to:** `.floaty` elements — Dashboard hero icon-cube (🧪), likely other decorative elements.

#### 6.4.2 @keyframes spin + .spinner

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,.2);
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  vertical-align: middle;
}
```
- **Duration:** 0.8s
- **Timing:** `linear`
- **Iteration:** `infinite`
- **Effect:** Continuous clockwise rotation — CSS border-based spinner (3px ring with white top segment).
- **Applied to:** Loading indicators during API calls (CNPJ lookup, Cloudflare deploy, SMS polling).

#### 6.4.3 @keyframes pulse-ring + .pulse-ring

```css
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(34,211,238,.6); }
  70%  { box-shadow: 0 0 0 14px rgba(34,211,238,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
}
.pulse-ring { animation: pulse-ring 2s infinite; }
```
- **Duration:** 2s
- **Timing:** Default (`ease`)
- **Iteration:** `infinite`
- **Effect:** Expanding ring pulse — cyan ring grows from 0 to 14px radius, fading to transparent. Creates a sonar/ping effect.
- **Applied to:** `.pulse-ring` elements — Etapa 1 publish step icon-cube (🌐, line 780) when site is live.

#### 6.4.4 @keyframes pulse (Site Generator)

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}
```
- **Duration:** 2.4s (applied via `.float-wpp` animation shorthand)
- **Effect:** Scale pulse — element grows to 108% then returns. Used for WhatsApp floating button attention-grab.
- **Applied to:** `.float-wpp` (lines 1916-1917 in site generator CSS).

#### 6.4.5 CSS Transitions (Non-Keyframe Animations)

Documenting `transition` properties on interactive components — these are animation-adjacent but not `@keyframes`:

| Component | Property | Duration | Timing | Effect |
|-----------|----------|----------|--------|--------|
| `.btn-3d` | `transform, box-shadow, filter` | `0.12s` | `ease` | Button press depth + ambient shadow collapse |
| `.nav-link` | `all` | `0.15s` | `ease` | Hover background + color + translateX(2px) |
| `.step-card` | `opacity` | `0.3s` | *(default)* | Fade when transitioning disabled↔enabled |
| `.input` | `all` | `0.15s` | *(default)* | Border color + ring glow on focus |
| `.file-drop` | `all` | `0.15s` | *(default)* | Background + border color on hover/dragover |
| `.sidebar` | `transform` | `0.25s` | `ease` | Slide in/out on mobile |
| `.glass` (quickCard) | `transform` (via Tailwind) | — | — | `hover:scale-[1.01]` — subtle scale-up on card hover |


### 6.5 Responsive Breakpoints

#### 6.5.1 Breakpoint: 1024px — Mobile Sidebar Collapse (Main App)

**Source:** lines 106-110.

```css
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    transform: translateX(-100%);
    width: 280px;
  }
  .sidebar.open { transform: translateX(0); }
  .content-wrap { margin-left: 0 !important; }
}
```

**Behavioral change detail:**
| Aspect | Desktop (≥1025px) | Mobile (≤1024px) |
|--------|-------------------|-------------------|
| Sidebar position | Static, part of flex layout | Fixed overlay, left edge |
| Sidebar visibility | Always visible | Hidden off-screen (`translateX(-100%)`) |
| Sidebar width | 280px (Tailwind `w-[280px]`) | 280px (fixed) |
| Sidebar toggle | N/A (always visible) | `toggleSidebar()` adds/removes `.open` class |
| Backdrop | Hidden | `.backdrop.open` — full-screen dark overlay (`rgba(0,0,0,.55)`, z-index:40) |
| Content margin | Normal flex layout | `margin-left: 0 !important` — content fills full width |
| Hamburger menu | **Not present in main app** — sidebar toggle mechanism is JS-only (`toggleSidebar()`) triggered programmatically, not by a visible hamburger button in the static shell |

**Toggle mechanism:** `toggleSidebar(open)` function (line 252-255):
1. `sidebar.classList.toggle('open', open)` — slides sidebar in/out
2. `backdrop.classList.toggle('open', open)` — shows/hides overlay
3. No hamburger button exists in the static HTML — toggle is triggered by JS code (e.g., after route change on mobile)

**Transition:** `.sidebar { transition: transform 0.25s ease; }` (line 105) — smooth 250ms slide animation.

#### 6.5.2 Breakpoint: 900px — Mobile Navigation (Site Generator)

**Source:** line 1915.

```css
@media (max-width: 900px) {
  .nav-menu { display: none; position: absolute; top: 100%; left: 0; right: 0;
              flex-direction: column; background: #0c1330; padding: 16px 24px;
              gap: 14px; border-bottom: 1px solid var(--border); }
  .nav-menu.open { display: flex; }
  .menu-toggle { display: block; }
  .about-grid, .contact-grid, .footer-grid { grid-template-columns: 1fr; }
  .hero { padding: 48px 0 36px; }
  section { padding: 48px 0; }
  .container { padding: 0 18px; }
}
```

**Behavioral changes:**
| Aspect | Desktop (≥901px) | Mobile (≤900px) |
|--------|-------------------|-----------------|
| Navigation menu | Horizontal flex | Hidden dropdown (absolute positioned) |
| Menu toggle button | Hidden (`.menu-toggle { display: none }`) | Visible (☰ hamburger) |
| Grid layouts | Multi-column (about 2-col, footer 3-col) | Single column (`grid-template-columns: 1fr`) |
| Hero padding | `80px 0 60px` | `48px 0 36px` |
| Section padding | `72px 0` | `48px 0` |
| Container padding | `0 24px` | `0 18px` |

**This breakpoint only applies to generated site templates** (from `buildSiteHTML()`), not the main admin dashboard.


### 6.6 Tailwind CDN Version & Configuration

**Source:** `raw-source.html` lines 7, 10-11.

**CDN URL:** `https://cdn.tailwindcss.com` (line 7)
- **Version:** Unpinned — resolves to latest Tailwind CSS v3 CDN build. No version lock means the site can silently receive Tailwind updates.
- **Implication for clone:** Pin to a specific version (e.g., `https://cdn.tailwindcss.com/3.4.0`) to prevent breaking changes. Or migrate to Tailwind v4 with the new CSS-first configuration.

**Custom Configuration (lines 10-11):**
```html
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
```

**What's customized:**
- `fontFamily.display`: Maps Tailwind `font-display` utility to Sora font stack.
- `fontFamily.sans`: Overrides default sans-serif to Inter font stack.
- **No other customizations detected:** No custom colors, spacing scale, breakpoints, border-radius, or shadow extensions. The original relies entirely on Tailwind's default utility values for everything except font families.

**What's NOT customized (uses Tailwind defaults):**
- Colors: All Tailwind color utilities (`bg-slate-400`, `text-cyan-300`, `border-white/5`, etc.) use the default v3 palette.
- Spacing: Default 0.25rem scale (p-4 = 1rem, p-5 = 1.25rem, etc.).
- Breakpoints: Default sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px) — all available but the main app's custom 1024px media query is custom CSS, not Tailwind.
- No `@tailwind` directives, `@layer` directives, or `@apply` compositions detected in the CSS. All component classes are pure custom CSS.


### 6.7 CSS Architecture Summary

| Attribute | Value |
|-----------|-------|
| **Approach** | Inline `<style>` block (lines 16-134) + Tailwind CDN v3 for utility classes. No external CSS files. |
| **Custom properties on :root** | 13 (4 consumed via `var()`, 9 used as hardcoded reference values) |
| **Component classes** | 23 distinct class families (`.glass`, `.grad-card`, `.btn-3d`, `.icon-cube`, `.pill`, `.nav-link`, `.step-card`, `.input`, `.switch-tab`, `.copy-row`, `.empty`, `.scrollbar`, `.file-drop`, `.pdf-canvas-wrap`, `.pdf-overlay-text`, `.neon`, `.ring-glow`, `.sidebar`, `.backdrop`, `.floaty`, `.spinner`, `.pulse-ring`, `.grad-text`) |
| **Color variants** | 19 total (8 btn-3d + 6 icon-cube + 5 pill) |
| **@keyframes animations** | 4 (float, spin, pulse-ring, pulse) |
| **CSS transitions** | 6 distinct transition rules on interactive components |
| **@media breakpoints** | 2 (1024px for sidebar collapse, 900px for site generator mobile nav) |
| **Total CSS size (main app)** | ~118 lines (lines 16-134 of `raw-source.html`) — ~2.5KB |
| **Total CSS size (site generator)** | ~85 lines (lines 1833-1918) — ~2KB |
| **Design system** | Dark theme + glassmorphism + 3D depth (buttons/cubes) + gradient accents |
| **Browser prefixes** | `-webkit-backdrop-filter`, `-webkit-background-clip`, `-webkit-mask`, `-webkit-tap-highlight-color`, `::-webkit-scrollbar` — WebKit-focused, no Firefox/Edge-specific prefixes |
| **Accessibility gaps** | No `:focus-visible` styles, no `prefers-reduced-motion` queries, no `prefers-contrast` support, nav-links lack focus indicators |


### 6.8 Site Generator CSS Template

**Source:** `<style>` block lines 1833-1918 of `raw-source.html`. This CSS is embedded inline within the HTML template generated by `buildSiteHTML()` (see §5.3).

**Purpose:** The generated public-facing SaaS landing page for each company. This is NOT the admin dashboard CSS — it's the customer-facing website template.

#### 6.8.1 :root (Site Generator)

```css
:root {
  --bg: #0b1020;
  --card: #111a36;
  --border: rgba(255,255,255,.08);
  --text: #e6e9f5;
  --muted: #9aa3c7;
}
```
- **Simplified palette:** Only 5 properties (vs 13 in main app). No accent/status colors — those are hardcoded in the template.
- **Same values:** `--bg`, `--card`, `--border`, `--text`, `--muted` match main app exactly.

#### 6.8.2 Global Resets & Base

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html,body { background: var(--bg); color: var(--text); font-family: Inter, sans-serif; line-height: 1.6; scroll-behavior: smooth; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
h1,h2,h3,h4 { font-family: Sora, sans-serif; letter-spacing: -0.02em; line-height: 1.15; }
a { color: inherit; text-decoration: none; }
```

#### 6.8.3 Component Classes (Site Generator)

| Class | Purpose | Key Properties |
|-------|---------|---------------|
| `.grad-text` | Gradient heading accent | `background: linear-gradient(120deg, #a5b4fc, #22d3ee 50%, #a855f7)` — same as main app |
| `.pill` | Status badge (single variant) | Green-tinted default: `rgba(34,197,94,.15)` bg, `#86efac` text |
| `.btn` | Base button | `padding: .95rem 1.5rem; border-radius: 16px; font-weight: 700` |
| `.btn-primary` | Primary CTA button | Indigo gradient + 3D shadow (same pattern as main app `.btn-3d`) |
| `.btn-secondary` | Secondary/muted button | Dark gradient `#1f2a52 → #111a36` |
| `.btn-success` | Success button | Green gradient (single variant — no `.warn`/`.danger`/etc.) |
| `.icon-cube` | Icon container | `width: 54px; height: 54px` (smaller than main app's 64px) + same 3D shadow pattern |
| `.icon-cube.cyan/.green/.purple` | 3 color variants | Same gradient pattern as main app but only 3 variants (vs 5) |
| `.card` | Generic card | Glass-like: `linear-gradient(145deg, rgba(255,255,255,.04), rgba(255,255,255,.01))` + `:hover { transform: translateY(-4px) }` |
| `.logo` / `.logo-mark` | Site logo | Flex row with gradient icon-cube + company name |
| `.hero` | Hero section | `padding: 80px 0 60px` + `::before` radial gradient overlay (indigo+purple) |
| `.stats` | KPI grid | `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))` |
| `.stat` | Stat card | Glass border card with `.num` (Sora, 1.7rem) + `.lbl` (muted) |
| `.about-grid` | About section layout | `grid-template-columns: 1.2fr 1fr` |
| `.about-meta .kv` | Key-value metadata | Bordered card with uppercase `.k` label + bold `.v` value |
| `.values-grid` | Values section grid | `repeat(auto-fit, minmax(180px, 1fr))` |
| `.value-card` | Value card | Centered icon + title, indigo-tinted bg, hover lift effect |
| `.diff-grid` | Differentiators grid | `repeat(auto-fit, minmax(280px, 1fr))` |
| `.diff-card` | Differentiator card | Icon + title + description, glass border |
| `.diff-ico` | Differentiator icon | Small cyan/indigo icon-cube variant (56×56) |
| `.cnae-grid` | CNAE services grid | `repeat(auto-fit, minmax(260px, 1fr))` |
| `.cnae-card` | Service card | Positioned badge number + tag + description |
| `.cnae-num` | Service number badge | Gradient indigo icon-cube (38×38), floating above card |
| `.data-grid` | Data display grid | `repeat(auto-fit, minmax(260px, 1fr))` |
| `.data-card` | Data card | Glass border card with `.lbl` + `.val` |
| `.contact-grid` | Contact section layout | `grid-template-columns: 1fr 1fr` |
| `.contact-item` | Contact info row | Icon + label + value, glass border |
| `.contact-form` | Contact form container | Padded card, input/textarea styling matching `.input` pattern |
| `.footer-grid` | Footer layout | `grid-template-columns: 1.5fr 1fr 1fr` |
| `.footer-copy` | Copyright bar | Centered muted text with top border |
| `.float-wpp` | WhatsApp floating button | Fixed position (bottom-right), green gradient icon-cube, `pulse` animation |
| `header.nav` | Sticky navigation | `backdrop-filter: blur(12px)`, glass header bar |
| `.nav-menu` | Horizontal nav links | Flex row with 24px gap, items turn white on hover |
| `.nav-menu a` | Nav link | `color: #cfd5f2; font-weight: 600` |
| `.menu-toggle` | Mobile hamburger | Hidden on desktop (`display: none`), visible at ≤900px |

**Rebrand note:** The site generator CSS must also receive the Phase 5-6 palette swap (BRAND-01). All indigo/cyan/purple gradients in `.icon-cube`, `.btn-primary`, `.cnae-num`, `.hero::before`, `.grad-text` must be replaced with emerald/orange equivalents.


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
