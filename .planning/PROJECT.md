# BMS Replica

## What This Is

Clone funcional 100% do front-end do sistema de Building Management System (BMS) hospedado em https://laboratoriodebms.netlify.app/, reconstruído via engenharia reversa caixa-preta. Após paridade funcional completa, o sistema recebe uma nova identidade visual, branding e UX completamente renovadas — mesmo comportamento, visual único.

## Core Value

Um dashboard BMS completo e funcional que replica exatamente o comportamento do original, mas com identidade visual e experiência de usuário totalmente renovadas.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **RECON-01**: Extrair árvore DOM, identificar framework e estruturas de componente
- [ ] **RECON-02**: Capturar todos os endpoints XHR/Fetch e esquemas de dados
- [ ] **RECON-03**: Extrair estado global, localStorage e sessionStorage
- [ ] **RECON-04**: Mapear todas as rotas e sistema de navegação
- [ ] **RECON-05**: Fazer engenharia reversa da lógica de negócio (cálculos, thresholds, alarmes)
- [ ] **REPL-01**: Sistema de login com autenticação local mockada
- [ ] **REPL-02**: Dashboard principal com cards de KPIs e atualização em tempo real
- [ ] **REPL-03**: Gráficos replicados com mesmos datasets e lógica matemática
- [ ] **REPL-04**: Tabelas dinâmicas com filtros, ordenação e paginação
- [ ] **REPL-05**: Controles de atuação (Ligar/Desligar, sliders de setpoint)
- [ ] **REPL-06**: Sistema de alertas/notificações com thresholds idênticos
- [ ] **REPL-07**: Persistência local com mesmas chaves e estruturas
- [ ] **BRAND-01**: Nova paleta de cores (substituir azul marinho por verde esmeralda + laranja queimado)
- [ ] **BRAND-02**: Nova tipografia (substituir fonte original por Poppins ou Montserrat)
- [ ] **BRAND-03**: Novo layout e arquitetura visual (Header fixo + Mega Menu)
- [ ] **BRAND-04**: Novos cards com Glassmorphism ou Neumorphism
- [ ] **BRAND-05**: Nova iconografia (Phosphor Icons ou Material Symbols)
- [ ] **BRAND-06**: Micro-animações e transições suaves
- [ ] **BRAND-07**: Novo nome e logotipo
- [ ] **BRAND-08**: Textos, labels e tooltips com nova identidade
- [ ] **VAL-01**: Teste A/B funcional — clone vs original lado a lado
- [ ] **VAL-02**: Teste de storage — mesmas estruturas, nomes diferentes
- [ ] **VAL-03**: Teste de responsividade
- [ ] **VAL-04**: Teste de performance — bundle ≤ 20% maior que original

### Out of Scope

- Acesso ao backend/servidor — projeto é 100% front-end com dados mockados
- Funcionalidades não existentes no original — escopo limitado ao que existe no sistema fonte
- Backend real ou integração com APIs externas

## Context

O sistema original está hospedado no Netlify como site estático. Todos os dados são gerados localmente via `Math.random()`, `setInterval` ou funções similares no próprio JavaScript. Não há backend real — o sistema simula um ambiente BMS completo com sensores, equipamentos, alarmes e relatórios.

**Metodologia**: Engenharia reversa caixa-preta usando DevTools (Elements, Console, Sources, Network, Application), ferramentas externas (Wappalyzer, Lighthouse) e análise de bundles JS minificados.

**Domínio**: Building Management System — monitoramento e controle de equipamentos industriais/laboratoriais com sensores de temperatura, consumo energético, e sistemas de alarme.

## Constraints

- **Stack**: Mesmo framework e biblioteca de gráficos detectados no original + Tailwind CSS para estilização
- **Ferramentas**: Exclusivamente DevTools e ferramentas de navegador para extração
- **Performance**: Bundle final não pode exceder 20% do tamanho do original
- **Mock data**: Todos os dados devem ser gerados localmente, sem dependências externas
- **Responsividade**: Mesmos breakpoints do original

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clone fiel primeiro, rebrandear depois | Separar engenharia reversa do redesign para garantir paridade funcional | — Pending |
| Mesmo stack do original | Evitar retrabalho de adaptação de lógica para framework diferente | — Pending |
| Tailwind CSS | Facilita rebranding posterior com sistema de design tokens | — Pending |
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
*Last updated: 2026-06-27 after initialization*
