# BMS Replica

## What This Is

Clone funcional 100% do front-end da ferramenta de gestão empresarial hospedada em https://laboratoriodebms.netlify.app/, reconstruído via engenharia reversa caixa-preta. O sistema original é uma SPA vanilla JavaScript com funcionalidades de consulta CNPJ, criação de sites, compra de números SMS, edição de PDF, planilha e banco de empresas. Após paridade funcional completa, o sistema recebe uma nova identidade visual, branding e UX completamente renovadas.

## Core Value

Uma réplica funcional exata da plataforma de gestão empresarial, com comportamento idêntico ao original, mas com identidade visual e experiência de usuário totalmente renovadas.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **RECON-01**: Extrair árvore DOM completa, confirmar framework vanilla JS e estrutura de componentes
- [ ] **RECON-02**: Capturar todos os endpoints de API (BrasilAPI, Cloudflare Pages, SMS24h) e esquemas de request/response
- [ ] **RECON-03**: Extrair estado global, todas as chaves e estruturas do localStorage (`lab_bms_db_v1`, `lab_bms_settings_v1`)
- [ ] **RECON-04**: Mapear todas as rotas/views e sistema de navegação (VIEWS registry)
- [ ] **RECON-05**: Fazer engenharia reversa da lógica de negócio (~60 funções, 3 objetos de estado)
- [ ] **REPL-01**: Sistema de views com navegação SPA (router vanilla JS)
- [ ] **REPL-02**: Tela de Consulta CNPJ com integração BrasilAPI
- [ ] **REPL-03**: Tela Criar Site com deploy Cloudflare Pages
- [ ] **REPL-04**: Tela Comprar Número SMS com integração SMS24h
- [ ] **REPL-05**: Editor PDF com pdf.js e pdf-lib
- [ ] **REPL-06**: Planilha/lista de dados
- [ ] **REPL-07**: Banco de Empresas com CRUD local
- [ ] **REPL-08**: Cards de KPI/status com atualização dinâmica
- [ ] **REPL-09**: Componentes de UI reutilizáveis (statCard, quickCard, stepBox)
- [ ] **REPL-10**: Sistema de tema claro/escuro com persistência
- [ ] **REPL-11**: Camada de mock para APIs externas (simular respostas)
- [ ] **REPL-12**: Persistência local com mesmas chaves e estruturas do original
- [ ] **BRAND-01**: Nova paleta de cores (verde esmeralda + laranja queimado)
- [ ] **BRAND-02**: Nova tipografia (Poppins ou Montserrat)
- [ ] **BRAND-03**: Novo layout e arquitetura visual (Header fixo + Mega Menu)
- [ ] **BRAND-04**: Novos cards com Glassmorphism ou Neumorphism
- [ ] **BRAND-05**: Nova iconografia (Phosphor Icons ou Material Symbols)
- [ ] **BRAND-06**: Micro-animações e transições suaves
- [ ] **BRAND-07**: Novo nome e logotipo
- [ ] **BRAND-08**: Textos, labels e tooltips com nova identidade
- [ ] **VAL-01**: Teste A/B funcional — clone vs original lado a lado
- [ ] **VAL-02**: Teste de storage — mesmas estruturas, nomes diferentes
- [ ] **VAL-03**: Teste de responsividade (breakpoint 1024px sidebar)
- [ ] **VAL-04**: Teste de performance — bundle ≤ 20% maior que original

### Out of Scope

- Sensores, gráficos, charts, equipamentos industriais — não existem no original
- Backend real — todas as APIs externas serão mockadas na camada de serviço
- Funcionalidades não existentes no original
- Autenticação real (o original usa localStorage para estado de sessão)

## Context

O sistema original está hospedado no Netlify como SPA vanilla JavaScript (~2135 linhas de código inline). Utiliza Tailwind CSS via CDN para estilização, com sistema de temas via CSS custom properties. Faz chamadas reais para APIs externas (BrasilAPI para CNPJ, Cloudflare Pages API para deploy de sites, SMS24h para números SMS). O estado é mantido em localStorage com chaves `lab_bms_db_v1` e `lab_bms_settings_v1`.

**Metodologia**: Engenharia reversa caixa-preta usando DevTools (Elements, Console, Sources, Network, Application), ferramentas externas (Wappalyzer, Lighthouse) e análise de bundles JS.

**Domínio real**: Ferramenta de gestão empresarial brasileira — consulta de CNPJ, geração de sites SaaS, aquisição de números SMS, edição de PDFs, banco de dados de empresas, planilha.

## Constraints

- **Stack**: Vanilla JavaScript (mesmo do original) + Tailwind CSS (build step com Vite para DX)
- **Ferramentas**: Exclusivamente DevTools e ferramentas de navegador para extração
- **Performance**: Bundle final não pode exceder 20% do tamanho do original
- **Mock data**: APIs externas devem ser mockadas para permitir desenvolvimento offline
- **Responsividade**: Mesmos breakpoints do original (sidebar colapsa em 1024px)
- **Arquitetura**: Separação clara entre lógica de negócio e apresentação para facilitar rebranding

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clone fiel primeiro, rebrandear depois | Garantir paridade funcional antes de alterar visual | — Pending |
| Vanilla JavaScript (stack do original) | Evitar retrabalho de adaptação para framework diferente | — Pending |
| Tailwind CSS com build Vite | DX superior ao CDN, mesmo output final | — Pending |
| CSS custom properties para theming | Separação limpa entre clone e rebrand — só styles/ muda | — Pending |
| Camada de mock para APIs externas | Desenvolvimento offline, sem dependência de serviços reais | — Pending |
| Repositório público | Transparência e portfólio | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-27 after domain research correction*
