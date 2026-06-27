# Phase 1: Reconnaissance & Extraction - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

## Phase Boundary

Extrair e documentar sistematicamente TODO o front-end do sistema original em https://laboratoriodebms.netlify.app/ via engenharia reversa caixa-preta usando DevTools. O entregável é um documento RECON.md (~1000+ linhas) que serve como especificação autoritativa para todas as fases de clone. Nenhum código é escrito nesta fase — apenas extração e documentação.

## Implementation Decisions

### Estrutura do RECON.md
- **D-01:** Documento organizado por camada técnica (não por view): DOM → APIs → Estado → Rotas → Lógica de Negócio → CSS/Tema. Cada camada cobre o sistema inteiro daquela perspectiva. Apêndice com referências cruzadas por view.

### Profundidade da Extração
- **D-02:** Extração completa (nível máximo de detalhe). Cada função documentada com assinatura, parâmetros, valor de retorno e side effects. CSS documentado pixel-perfect (classes utilitárias Tailwind + custom properties). Todos os branches de resposta de API (sucesso + erro) para BrasilAPI, Cloudflare Pages e SMS24h.

### Ferramentas e Método
- **D-03:** Extração 100% manual via DevTools do navegador: Elements (árvore DOM, data-attributes, classes), Console (inspeção de window, __INITIAL_STATE__, store), Sources (Pretty Print de bundles JS, identificação de funções), Network (captura de XHR/Fetch, schemas de request/response), Application (localStorage, sessionStorage). Ferramentas auxiliares: Wappalyzer (detecção de stack), Lighthouse (baseline de performance).

### the agent's Discretion
- Ordem exata das seções dentro de cada camada no RECON.md
- Formatação específica de schemas JSON e tabelas de API
- Uso de screenshots ou diagramas ASCII para DOM tree
- Nível de comentário/anotação no código extraído

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Escopo do projeto, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 51 requisitos v1 com REQ-IDs
- `.planning/ROADMAP.md` § Phase 1 — Objetivo, dependências, critérios de sucesso
- `.planning/STATE.md` — Estado atual do projeto

### Research
- `.planning/research/FEATURES.md` — Inventário completo do sistema original (23 table stakes, 60+ funções, 8 rotas)
- `.planning/research/SUMMARY.md` — Síntese de pesquisa com flags e gaps

### Target System
- `https://laboratoriodebms.netlify.app/` — Sistema original a ser analisado
- `.planning/research/FEATURES.md` § "Original System Inventory" — Mapeamento inicial de funções, views, APIs e localStorage

## Existing Code Insights

### Reusable Assets
- Nenhum — projeto greenfield, sem código existente

### Established Patterns
- Nenhum — primeira fase do projeto

### Integration Points
- O RECON.md gerado nesta fase será o ponto de integração para todas as fases seguintes (Foundation, Views, Validation)

## Specific Ideas

- O RECON.md deve ter densidade suficiente para que um desenvolvedor que nunca viu o original possa reconstruí-lo
- Schemas JSON do localStorage devem incluir TODOS os objetos condicionais (ex: `empresas[].raw`, `sites[].deploymentId`) que causam falhas silenciosas se omitidos
- Contratos de API devem documentar exatamente a forma da resposta (não apenas o endpoint) — incluindo headers, status codes e corpo para sucesso e erro
- A extração de funções deve priorizar as ~60 funções identificadas pela pesquisa, mas não se limitar a elas — capturar TODAS as funções definidas no bundle

## Deferred Ideas

- Automação da extração com Puppeteer/Playwright — pode acelerar fases futuras se houver necessidade de re-extrair após atualizações do original
- Script de diff automatizado entre clone e original para validação contínua — relevante para Fase 4 (Validation)

---

*Phase: 01-reconnaissance-extraction*
*Context gathered: 2026-06-27*
