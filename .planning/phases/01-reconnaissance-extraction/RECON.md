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
