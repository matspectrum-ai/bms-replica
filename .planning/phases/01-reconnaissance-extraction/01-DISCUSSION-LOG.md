# Phase 01: Reconnaissance & Extraction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 01-reconnaissance-extraction
**Areas discussed:** RECON.md Structure, Extraction Depth, Extraction Tools

---

## Estrutura do RECON.md

| Option | Description | Selected |
|--------|-------------|----------|
| Por camada técnica | DOM → APIs → Estado → Rotas → Funções → CSS. Cada camada cobre o sistema inteiro. | ✓ |
| Por view/rota | Cada view documentada por completo com DOM, APIs, estado e funções. | |
| Híbrido | Camadas técnicas como seções principais + apêndice por view com referências cruzadas. | |

**User's choice:** Por camada técnica (Recommended)
**Notes:** Alinha com a abordagem Horizontal Layers do projeto. Cada camada é consumida por uma fase diferente do clone.

---

## Profundidade da Extração

| Option | Description | Selected |
|--------|-------------|----------|
| Completo | Cada função com assinatura, parâmetros, retorno e side effects. CSS pixel-perfect. Todos os branches de API. ~1000+ linhas. | ✓ |
| Essencial | Funções principais, CSS por classes utilitárias, APIs happy path. ~500-700 linhas. | |
| Resumo | Visão geral, funções críticas apenas, schemas principais. ~300-400 linhas. | |

**User's choice:** Completo (Recommended)
**Notes:** Garante que fases seguintes tenham tudo sem adivinhação. Inclui objetos condicionais do localStorage que causam falhas silenciosas se omitidos.

---

## Ferramentas de Extração

| Option | Description | Selected |
|--------|-------------|----------|
| DevTools manual | Elements, Console, Sources (Pretty Print), Network, Application. Inspeção direta. | ✓ |
| Automação com script | Puppeteer/Playwright para extração automática de DOM, localStorage, network. | |
| Híbrido | Automação para extração bruta + manual para análise de lógica e CSS. | |

**User's choice:** DevTools manual (Recommended)
**Notes:** Alinha com a restrição do projeto de "exclusivamente DevTools e ferramentas de navegador". Wappalyzer e Lighthouse como auxiliares.

---

## the agent's Discretion

- Ordem exata das seções dentro de cada camada no RECON.md
- Formatação específica de schemas JSON e tabelas de API
- Uso de screenshots ou diagramas ASCII para DOM tree
- Nível de comentário/anotação no código extraído

## Deferred Ideas

- Automação da extração com Puppeteer/Playwright — pode acelerar fases futuras
- Script de diff automatizado entre clone e original para validação contínua (Fase 4)
