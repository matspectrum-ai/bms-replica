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
