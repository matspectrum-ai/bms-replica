# Roadmap: BMS Replica

## Overview

Clone funcional 100% do front-end de gestão empresarial brasileira (https://laboratoriodebms.netlify.app/) via engenharia reversa caixa-preta, seguido de rebranding completo. A jornada começa com extração sistemática (RECON), avança pela fundação de infraestrutura (router + persistência + widgets + UI), constrói todas as 8 views com integrações de API, valida paridade funcional contra o original, e finaliza com nova identidade visual em duas ondas — fundação estrutural do rebrand e refinamento visual.

**Abordagem:** Horizontal Layers — cada fase completa uma camada técnica inteira antes de avançar para a próxima.

## Phases

- [ ] **Phase 1: Reconnaissance & Extraction** — Extrair e documentar sistematicamente DOM, APIs, estado, rotas e lógica de negócio do sistema original
- [ ] **Phase 2: Foundation** — Infraestrutura completa: router SPA, persistência localStorage, widgets reutilizáveis, utilitários, layout, tema e proxy CORS
- [ ] **Phase 3: Views & Integrations** — Todas as 8 rotas com integrações de API: Dashboard, Etapa 1-3, Banco, Planilha, Configurações, Ajuda
- [ ] **Phase 4: Validation** — Validação de paridade: A/B testing, compatibilidade de storage, responsividade, bundle size
- [ ] **Phase 5: Rebrand Foundation** — Nova identidade visual estrutural: paleta, tipografia, layout Header+Mega Menu, ícones, nome/logotipo
- [ ] **Phase 6: Rebrand Polish** — Refinamentos visuais: cards glassmorphism+neumorphism, micro-animações, copywriting, site gerado rebrandeado

## Phase Details

### Phase 1: Reconnaissance & Extraction
**Goal**: Documentação estruturada completa do sistema original — cada elemento DOM, contrato de API, chave de estado, rota, função e propriedade CSS catalogada com precisão de pixel, formando a especificação autoritativa para todo o trabalho de clone.

**Depends on**: Nothing (first phase)

**Requirements**: RECON-01, RECON-02, RECON-03, RECON-04, RECON-05

**Success Criteria** (what must be TRUE):
  1. `RECON.md` contains ≥500 lines of structured data covering DOM tree, API contracts, localStorage schemas, route mappings, and function behaviors
  2. Every localStorage key-value pair (`lab_bms_db_v1`, `lab_bms_settings_v1`) is documented with complete JSON schemas, data types, and conditional sub-objects
  3. Every API endpoint (BrasilAPI CNPJ, Cloudflare Pages 5-step pipeline, SMS24h purchase/polling) is documented with request/response schemas for both success and error cases
  4. All 8 routes are mapped with exact VIEWS registry entries, `go()` navigation flow, header title/subtitle updates, and CSS active states
  5. All ~60 business logic functions are documented with signatures, parameters, return values, state mutations, and side effects

**Plans**: TBD

### Phase 2: Foundation
**Goal**: Esqueleto completo da aplicação — router SPA, camada de persistência, widgets compartilhados, utilitários de formatação, componentes de layout (sidebar, header), sistema de tema dark, design system CSS (3D buttons, icon cubes, glassmorphism), e camada de proxy CORS — permitindo que qualquer view seja construída sobre uma base sólida e idêntica ao original.

**Depends on**: Phase 1 (RECON.md provides exact specifications)

**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, UI-01, UI-02, UI-03, UI-04, UI-05

**Success Criteria** (what must be TRUE):
  1. User can navigate between all 8 routes via sidebar (3 categories: FLUXO PRINCIPAL, DADOS, SISTEMA) with no page reloads, correct title/subtitle updates, and active nav-link CSS highlighting
  2. Application data persists across browser sessions using `lab_bms_db_v1` and `lab_bms_settings_v1` localStorage keys with identical JSON structures to the original, including fallback defaults
  3. Toast notifications appear at bottom-center with emoji icons and auto-dismiss after 3 seconds; generic modals open/close with HTML content injection and background-click dismiss; clipboard copy works with toast feedback
  4. All formatting utilities produce outputs matching the original: CNPJ mask (##.###.###/####-##), BRL currency (R$ X.XXX,XX), pt-BR dates (DD/MM/AAAA), Brazilian phone format, slug generation, and HTML escaping
  5. Dark theme renders pixel-identically to the original: glassmorphism cards, 3D buttons (8 color variants with press animation), icon cubes (5 color variants with gradient+shadow), responsive sidebar collapse at 1024px with overlay backdrop

**Plans**: TBD
**UI hint**: yes

### Phase 3: Views & Integrations
**Goal**: Todas as 8 rotas de view renderizam e se comportam de forma idêntica ao original — Dashboard com KPIs computados, wizards Etapa 1-3 (CNPJ → Site → SMS → PDF), Banco de Empresas com busca/filtro, Planilha com edição inline, Configurações com gestão de tokens, Ajuda com guias estáticos — com todas as integrações de API (BrasilAPI, Cloudflare Pages, SMS24h) correspondendo aos padrões de request/response do original.

**Depends on**: Phase 2 (Foundation provides router, persistence, widgets, utils, layout, theme)

**Requirements**: DASH-01, DASH-02, DASH-03, ETP1-01, ETP1-02, ETP1-03, ETP1-04, ETP1-05, ETP2-01, ETP2-02, ETP2-03, ETP2-04, ETP2-05, ETP3-01, ETP3-02, ETP3-03, ETP3-04, BANC-01, BANC-02, BANC-03, PLAN-01, PLAN-02, PLAN-03, PLAN-04, CONF-01, CONF-02, CONF-03, AJUD-01

**Success Criteria** (what must be TRUE):
  1. Dashboard displays 4 computed KPI stat cards (Empresas, Sites Criados, No Ar, Finalizados from localStorage), 6 quick-action cards, and live API status pills (Cloudflare/SMS24h OK/Danger)
  2. User can complete the full Etapa 1 wizard: CNPJ lookup via BrasilAPI with response normalization → domain suggestion (7 algorithms) → meta-tag generation → site HTML generation (~300-line template) → Cloudflare Pages deployment (5-step pipeline: create project → JWT → BLAKE3 hash → upload → deploy), resulting in a live SaaS landing page
  3. User can purchase a virtual SMS number (Etapa 2) by country/service via SMS24h API, with auto-polling for activation code, and re-deploy an existing site with the new phone number attached
  4. User can load a PDF (Etapa 3), render multiple pages via pdf.js, add draggable contentEditable text overlays with per-overlay delete, extract 7 Brazilian address fields via regex, and download the merged PDF via pdf-lib
  5. User can search and filter the company database (Banco de Empresas) with text search and capital social range filter (ideal 10k-50k), use "Usar na Etapa 1" action; manage sites in the 8-column spreadsheet (Planilha) with inline status dropdowns, row deletion, and CSV export (UTF-8 BOM); configure Cloudflare tokens with auto-detection and SMS24h API keys (Configurações) with full JSON backup/restore; and view step-by-step help guides (Ajuda)

**Plans**: TBD
**UI hint**: yes

### Phase 4: Validation
**Goal**: Clone comprovadamente idêntico ao original — A/B testing confirma paridade pixel-a-pixel, armazenamento compatível bidirecionalmente, breakpoints responsivos idênticos, e bundle size dentro de 20% do original. Esta fase é o gate de qualidade antes de qualquer alteração visual de rebrand.

**Depends on**: Phase 3 (all views must be complete and functional)

**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04

**Success Criteria** (what must be TRUE):
  1. Clone passes A/B testing: all 8 views produce identical rendered output to the original when performing the same actions — verified via pixel-by-pixel screenshot overlay at 50% opacity
  2. Data written by the clone can be read by the original and vice-versa — bidirectional localStorage compatibility confirmed (`lab_bms_db_v1` and `lab_bms_settings_v1` survive round-trip through both systems)
  3. Responsive behavior matches original at all breakpoints: sidebar collapses at 1024px with overlay backdrop, touch targets remain usable on mobile viewports
  4. Production bundle size is ≤180 kB gzipped (≤20% larger than original ~150 kB gzipped baseline)

**Plans**: TBD

### Phase 5: Rebrand Foundation
**Goal**: Nova identidade visual estrutural aplicada — paleta verde esmeralda + laranja queimado substitui azul marinho, tipografia Poppins/Montserrat substitui Inter/Sora, layout Header fixo + Mega Menu substitui sidebar, Phosphor Icons substituem emojis, e novo nome de marca é estabelecido. Camada CSS apenas; zero alterações em JavaScript.

**Depends on**: Phase 4 (clone must be validated before any visual changes)

**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-05, BRAND-07

**Success Criteria** (what must be TRUE):
  1. All UI elements render with the new emerald green (#059669) and burnt orange (#ea580c) palette via CSS custom properties — every navy blue (#6366f1) reference eliminated across all 8 views
  2. Header fixo + mega menu replaces sidebar: sticky header with blur, categorized dropdown menus for all 8 routes, keyboard navigation (arrow keys, Escape), and ARIA attributes for screen readers
  3. All emoji icons replaced with Phosphor Icons SVG equivalents across every view, sidebar/menu, toast, and modal — consistent sizing and rendering across platforms
  4. New brand name and logotipo appear in header, `<title>`, and all on-screen brand references — system is visually distinct from the original

**Plans**: TBD
**UI hint**: yes

### Phase 6: Rebrand Polish
**Goal**: Toques finais de identidade visual — variantes de cards Glassmorphism + Neumorphism, micro-animações (transições de rota, entrada staggered de cards, hover states refinados), copywriting atualizado em todos os labels/tooltips/toasts, e template de site gerado (`buildSiteHTML`) rebrandeado para consistência entre dashboard admin e sites de clientes.

**Depends on**: Phase 5 (rebrand foundation must be stable before polish)

**Requirements**: BRAND-04, BRAND-06, BRAND-08, BRAND-09

**Success Criteria** (what must be TRUE):
  1. Card components render with new glassmorphism + neumorphism variants (`.neo-card`, `.neo-raised`, `.neo-pressed`) using dual `box-shadow` technique, combined with existing `.glass` for hybrid effects across all views
  2. Micro-animations execute smoothly: route transition fades (max 300ms), staggered card entry, refined hover states (max 200ms) — all respecting `prefers-reduced-motion` for accessibility
  3. All UI text — labels, tooltips, placeholders, toast messages, page titles, step descriptions — reflects the new brand voice consistently across all 8 views
  4. Sites generated via Etapa 1's `buildSiteHTML()` template render with the new visual identity (emerald/orange palette, Poppins/Montserrat typography, Phosphor Icons) matching the rebranded admin dashboard

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Reconnaissance & Extraction | 0/0 | Not started | - |
| 2. Foundation | 0/0 | Not started | - |
| 3. Views & Integrations | 0/0 | Not started | - |
| 4. Validation | 0/0 | Not started | - |
| 5. Rebrand Foundation | 0/0 | Not started | - |
| 6. Rebrand Polish | 0/0 | Not started | - |
