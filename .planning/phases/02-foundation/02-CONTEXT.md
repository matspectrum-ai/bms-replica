# Phase 2: Foundation - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

## Phase Boundary

Construir o esqueleto completo da aplicação — router SPA, camada de persistência localStorage, widgets reutilizáveis, utilitários de formatação, componentes de layout (sidebar, header), sistema de tema dark, design system CSS (3D buttons, icon cubes, glassmorphism), e camada de proxy CORS. Tudo vanilla JS + Tailwind CSS via CDN, seguindo RECON.md como especificação autoritativa. Nenhuma view funcional ainda — apenas a infraestrutura que as views usarão.

## Implementation Decisions

### Estrutura do Projeto
- **D-01:** Organização por camada técnica: `src/stores/`, `src/router/`, `src/views/` (stubs), `src/widgets/`, `src/utils/`, `src/styles/`. Cada diretório contém os módulos daquela camada. `index.html` na raiz com entry point `src/main.js`.

### Build e Tooling
- **D-02:** HTML plano + CDN (igual ao original). Sem Vite, sem npm build step, sem bundler. Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`). Dependências externas (pdf.js, pdf-lib, @noble/hashes) via CDN com versões pinadas conforme RECON.md. Isso garante bundle size próximo ao original e facilita deploy no Netlify.

### Arquitetura de Widgets
- **D-03:** Factory functions retornando strings HTML ou elementos DOM (igual ao original). Ex: `createStatCard(config)` → string HTML, `createModal(html)` → DOM element. Sem classes, sem Web Components, sem frameworks. Cada widget recebe um objeto de configuração e retorna HTML + opcionalmente setup de eventos.

### Fidelidade ao Original
- **D-04:** A estrutura de código deve seguir os padrões documentados no RECON.md (Phase 1). Funções devem ter os mesmos nomes e assinaturas quando possível. As diferenças são apenas organizacionais (módulos separados vs arquivo único).

### the agent's Discretion
- Nomes exatos dos arquivos dentro de cada diretório
- Ordem de implementação dentro da fase
- Estratégia de carregamento dos módulos (script tags ordenadas no HTML vs dynamic imports)
- Detalhes de implementação de cada widget que não afetam o comportamento externo

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Specifications
- `.planning/phases/01-reconnaissance-extraction/RECON.md` — Especificação completa do sistema original (4400 linhas). Seções relevantes:
  - §2 DOM Structure — Layout, sidebar, header, elementos de cada view
  - §3 Route System — ROUTES array, VIEWS registry, função go()
  - §4 API Contracts — BrasilAPI, Cloudflare Pages, SMS24h
  - §5 Business Logic — Todas as funções com assinaturas
  - §6 CSS/Design System — Custom properties, classes de componentes, animações

### Project Foundation
- `.planning/PROJECT.md` — Escopo, constraints, key decisions
- `.planning/REQUIREMENTS.md` — CORE-01..09, UI-01..05
- `.planning/ROADMAP.md` § Phase 2 — Objetivo, dependências, critérios de sucesso

## Existing Code Insights

### From Phase 1 (RECON.md)
- O original usa ~2135 linhas de JS inline em um único arquivo
- Tailwind CSS v3 via CDN com config inline
- CSS custom properties no `:root` para theming
- localStorage com chaves `lab_bms_db_v1` e `lab_bms_settings_v1`
- Roteamento via função `go(route)` com array `ROUTES` e objeto `VIEWS`
- Widgets como factory functions: `statCard()`, `quickCard()`, `stepBox()`
- Sistema de toast, modal, clipboard como funções globais

## Specific Ideas

- Manter os mesmos nomes de chave localStorage (`lab_bms_db_v1`, `lab_bms_settings_v1`) para compatibilidade com o original — essencial para VAL-02 (teste de storage bidirecional)
- A estrutura de diretórios deve espelhar as camadas do RECON.md para facilitar navegação
- CSS custom properties devem ser idênticas às documentadas no RECON.md §6
- O proxy CORS deve replicar o comportamento do `instalarProxy()` documentado em RECON.md §5

## Deferred Ideas

Nenhum — discussão ficou dentro do escopo da fase.

---

*Phase: 02-foundation*
*Context gathered: 2026-06-27*
