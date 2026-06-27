# Requirements: BMS Replica

**Defined:** 2026-06-27
**Core Value:** Réplica funcional exata da plataforma de gestão empresarial, com comportamento idêntico ao original.

## v1 Requirements

Requisitos para clone fiel 100% do original. Sem alterações visuais na v1.

### Reconhecimento (RECON)

- [x] **RECON-01**: Extrair árvore DOM completa e confirmar arquitetura vanilla JS
- [ ] **RECON-02**: Capturar todos os endpoints de API (BrasilAPI, Cloudflare Pages, SMS24h) com esquemas de request/response (sucesso + erro)
- [ ] **RECON-03**: Extrair esquema completo do localStorage (`lab_bms_db_v1`, `lab_bms_settings_v1`) com todos os objetos e sub-objetos condicionais
- [x] **RECON-04**: Mapear todas as 8 rotas e sistema de navegação (VIEWS registry, go() function)
- [ ] **RECON-05**: Fazer engenharia reversa de todas as funções de negócio (~60 funções, 3 objetos de estado, utilitários)

### Infraestrutura (CORE)

- [ ] **CORE-01**: SPA Router vanilla JS com 8 rotas, hash-free, title dinâmico e active nav-link
- [ ] **CORE-02**: Sidebar Navigation com 3 categorias, data-route, colapso mobile em 1024px
- [ ] **CORE-03**: localStorage Persistence com chaves `lab_bms_db_v1` e `lab_bms_settings_v1`, JSON com fallback defaults
- [ ] **CORE-04**: Sticky Header com blur, título dinâmico, pills de status API (Cloudflare/SMS24h OK/Danger)
- [ ] **CORE-05**: Toast Notification System — bottom-center, emoji icon, auto-dismiss 3s
- [ ] **CORE-06**: Generic Modal System — overlay, HTML content, background click close
- [ ] **CORE-07**: Clipboard Copy Utility com feedback toast
- [ ] **CORE-08**: Data Formatting Utilities (fmtCNPJ, fmtMoney, fmtDate, formatBRPhone, slugify, escapeHTML)
- [ ] **CORE-09**: CORS Proxy / API Mock Layer para desenvolvimento offline

### Dashboard (DASH)

- [ ] **DASH-01**: Cards de KPI — Empresas, Sites Criados, No Ar, Finalizados (statCard)
- [ ] **DASH-02**: Quick Cards com ações rápidas (quickCard)
- [ ] **DASH-03**: API Status Pills no header

### Etapa 1 — Wizard de Criação de Site (ETP1)

- [ ] **ETP1-01**: CNPJ Lookup via BrasilAPI com normalização de response
- [ ] **ETP1-02**: 5-Step Sequential Wizard (CNPJ → Domínio → Meta Tag → Gerar Site → Publicar) com progressive unlocking
- [ ] **ETP1-03**: Domain Suggestion Engine com 7 algoritmos de geração
- [ ] **ETP1-04**: Site HTML Generator — template engine ~300 linhas produzindo landing page SaaS completa
- [ ] **ETP1-05**: Cloudflare Pages API Deployment — pipeline 5 passos (create project → JWT → BLAKE3 hash → upload → deploy)

### Etapa 2 — Compra de Número SMS (ETP2)

- [ ] **ETP2-01**: SMS24h API Client wrapper (smsAPI)
- [ ] **ETP2-02**: Compra de número virtual por país/serviço
- [ ] **ETP2-03**: Auto-polling para código de ativação SMS (setInterval)
- [ ] **ETP2-04**: Display de número formatado com botão de cópia
- [ ] **ETP2-05**: Re-deploy do site no Cloudflare com novo número

### Etapa 3 — Editor PDF (ETP3)

- [ ] **ETP3-01**: PDF Viewer com pdf.js — renderização multi-página
- [ ] **ETP3-02**: Click-to-add overlays de texto (contentEditable, draggable, per-overlay delete)
- [ ] **ETP3-03**: PDF Download com merge via pdf-lib
- [ ] **ETP3-04**: Address Field Extractor — regex para 7 campos de endereço brasileiro

### Banco de Empresas (BANC)

- [ ] **BANC-01**: Grid de cards de empresa com renderização dinâmica
- [ ] **BANC-02**: Busca textual e filtro por capital social (ideal: 10k-50k)
- [ ] **BANC-03**: Ação "Usar na Etapa 1" que alimenta o wizard

### Planilha (PLAN)

- [ ] **PLAN-01**: Tabela de 8 colunas (Empresa, CNPJ, Domínio/URL, Tel Empresa, Tel Nosso, Status, Atualizado, Ações)
- [ ] **PLAN-02**: Status dropdown inline para alteração de estado
- [ ] **PLAN-03**: Delete de registros
- [ ] **PLAN-04**: Export CSV com BOM UTF-8 para Excel

### Configurações (CONF)

- [ ] **CONF-01**: Cloudflare Token Management com auto-detecção de conta
- [ ] **CONF-02**: SMS24h API Key input
- [ ] **CONF-03**: Backup/Restore como arquivo JSON (download/upload)

### Ajuda (AJUD)

- [ ] **AJUD-01**: Guias passo-a-passo como listas ordenadas com ícones

### Responsividade e Tema (UI)

- [ ] **UI-01**: Responsive Design com breakpoint 1024px (sidebar collapse, overlay backdrop)
- [ ] **UI-02**: Dark Theme + Glassmorphism via CSS custom properties
- [ ] **UI-03**: 3D Button System com 8 variantes de cor
- [ ] **UI-04**: Icon Cube Design System com 5 variantes de cor
- [ ] **UI-05**: Componentes reutilizáveis (statCard, quickCard, stepBox)

### Validação (VAL)

- [ ] **VAL-01**: Teste A/B funcional — clone vs original lado a lado, mesmas ações = mesmos resultados
- [ ] **VAL-02**: Teste de storage — clone lê dados gravados pelo original e vice-versa
- [ ] **VAL-03**: Teste de responsividade — mesmos breakpoints e comportamentos
- [ ] **VAL-04**: Teste de performance — bundle ≤ 20% maior que original

## v2 Requirements

Requisitos para o rebranding e nova identidade visual.

### Branding (BRAND)

- **BRAND-01**: Nova paleta de cores (verde esmeralda + laranja queimado)
- **BRAND-02**: Nova tipografia (Poppins ou Montserrat)
- **BRAND-03**: Novo layout Header fixo + Mega Menu dropdown (substitui sidebar)
- **BRAND-04**: Cards Glassmorphism + Neumorphism
- **BRAND-05**: Nova iconografia (Phosphor Icons)
- **BRAND-06**: Micro-animações e transições suaves
- **BRAND-07**: Novo nome e logotipo
- **BRAND-08**: Novos textos, labels e tooltips com identidade da marca
- **BRAND-09**: Site HTML Generator rebrandeado (sites gerados também recebem nova identidade)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sensores, gráficos, charts, equipamentos | Não existem no original — domínio é gestão empresarial, não BMS industrial |
| Backend / Database real | Projeto 100% front-end. localStorage + JSON backup já cobre o necessário |
| React / Vue / Framework rewrite | Original é vanilla JS. Constraint: mesmo stack do original |
| Autenticação real (OAuth/JWT) | Original usa localStorage para mock de sessão (single-user) |
| Multi-tenancy / Multi-usuário | localStorage é single-user por natureza |
| Tema claro/escuro toggle | Sistema desenhado para dark theme. Light theme = 2x trabalho de rebrand |
| i18n / Internacionalização | Todo conteúdo é português brasileiro (CNPJ, CEP, BrasilAPI) |
| PWA / Service Worker | APIs externas já requerem rede. Cache do browser é suficiente |
| WebSocket / Real-time server | Dados são on-demand (fetch) ou polling (setInterval). Sem fonte de dados persistente |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RECON-01 | Phase 1 — Reconnaissance & Extraction | Complete |
| RECON-02 | Phase 1 — Reconnaissance & Extraction | Pending |
| RECON-03 | Phase 1 — Reconnaissance & Extraction | Pending |
| RECON-04 | Phase 1 — Reconnaissance & Extraction | Complete |
| RECON-05 | Phase 1 — Reconnaissance & Extraction | Pending |
| CORE-01 | Phase 2 — Foundation | Pending |
| CORE-02 | Phase 2 — Foundation | Pending |
| CORE-03 | Phase 2 — Foundation | Pending |
| CORE-04 | Phase 2 — Foundation | Pending |
| CORE-05 | Phase 2 — Foundation | Pending |
| CORE-06 | Phase 2 — Foundation | Pending |
| CORE-07 | Phase 2 — Foundation | Pending |
| CORE-08 | Phase 2 — Foundation | Pending |
| CORE-09 | Phase 2 — Foundation | Pending |
| DASH-01 | Phase 3 — Views & Integrations | Pending |
| DASH-02 | Phase 3 — Views & Integrations | Pending |
| DASH-03 | Phase 3 — Views & Integrations | Pending |
| ETP1-01 | Phase 3 — Views & Integrations | Pending |
| ETP1-02 | Phase 3 — Views & Integrations | Pending |
| ETP1-03 | Phase 3 — Views & Integrations | Pending |
| ETP1-04 | Phase 3 — Views & Integrations | Pending |
| ETP1-05 | Phase 3 — Views & Integrations | Pending |
| ETP2-01 | Phase 3 — Views & Integrations | Pending |
| ETP2-02 | Phase 3 — Views & Integrations | Pending |
| ETP2-03 | Phase 3 — Views & Integrations | Pending |
| ETP2-04 | Phase 3 — Views & Integrations | Pending |
| ETP2-05 | Phase 3 — Views & Integrations | Pending |
| ETP3-01 | Phase 3 — Views & Integrations | Pending |
| ETP3-02 | Phase 3 — Views & Integrations | Pending |
| ETP3-03 | Phase 3 — Views & Integrations | Pending |
| ETP3-04 | Phase 3 — Views & Integrations | Pending |
| BANC-01 | Phase 3 — Views & Integrations | Pending |
| BANC-02 | Phase 3 — Views & Integrations | Pending |
| BANC-03 | Phase 3 — Views & Integrations | Pending |
| PLAN-01 | Phase 3 — Views & Integrations | Pending |
| PLAN-02 | Phase 3 — Views & Integrations | Pending |
| PLAN-03 | Phase 3 — Views & Integrations | Pending |
| PLAN-04 | Phase 3 — Views & Integrations | Pending |
| CONF-01 | Phase 3 — Views & Integrations | Pending |
| CONF-02 | Phase 3 — Views & Integrations | Pending |
| CONF-03 | Phase 3 — Views & Integrations | Pending |
| AJUD-01 | Phase 3 — Views & Integrations | Pending |
| UI-01 | Phase 2 — Foundation | Pending |
| UI-02 | Phase 2 — Foundation | Pending |
| UI-03 | Phase 2 — Foundation | Pending |
| UI-04 | Phase 2 — Foundation | Pending |
| UI-05 | Phase 2 — Foundation | Pending |
| VAL-01 | Phase 4 — Validation | Pending |
| VAL-02 | Phase 4 — Validation | Pending |
| VAL-03 | Phase 4 — Validation | Pending |
| VAL-04 | Phase 4 — Validation | Pending |
| BRAND-01 | Phase 5 — Rebrand Foundation | Pending |
| BRAND-02 | Phase 5 — Rebrand Foundation | Pending |
| BRAND-03 | Phase 5 — Rebrand Foundation | Pending |
| BRAND-04 | Phase 6 — Rebrand Polish | Pending |
| BRAND-05 | Phase 5 — Rebrand Foundation | Pending |
| BRAND-06 | Phase 6 — Rebrand Polish | Pending |
| BRAND-07 | Phase 5 — Rebrand Foundation | Pending |
| BRAND-08 | Phase 6 — Rebrand Polish | Pending |
| BRAND-09 | Phase 6 — Rebrand Polish | Pending |

**Coverage:**

- v1 requirements: 51 total — mapped: 51
- v2 requirements: 9 total — mapped: 9
- Unmapped: 0

---
*Requirements defined: 2026-06-27 after domain research and feature scoping*
