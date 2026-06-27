# Laboratório de BMS — Réplica Front-end

[![Bundle Size](https://img.shields.io/badge/bundle-41%20kB%20gzipped-brightgreen)](https://github.com/matspectrum-ai/bms-replica)
[![Phases](https://img.shields.io/badge/phases-4%2F6%20complete-blue)](https://github.com/matspectrum-ai/bms-replica)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Clone funcional 100% do front-end hospedado em [laboratoriodebms.netlify.app](https://laboratoriodebms.netlify.app/), reconstruído via **engenharia reversa caixa-preta** utilizando exclusivamente DevTools do navegador. O sistema é uma plataforma de gestão empresarial brasileira com consulta de CNPJ, criação de sites SaaS, compra de números SMS, edição de PDF, banco de empresas e planilha de controle.

> **Nota:** "BMS" neste contexto significa *Business Management System* (Sistema de Gestão Empresarial), não *Building Management System* (Sistema de Gestão Predial). O nome original é "Laboratório de BMs".

---

## 🚀 Como Rodar

```bash
# 1. Clone o repositório
git clone https://github.com/matspectrum-ai/bms-replica.git
cd bms-replica

# 2. Sirva os arquivos localmente (ES modules não funcionam com file://)
npx serve . -p 3000

# 3. Abra no navegador
# http://localhost:3000
```

**Pronto.** Nenhuma instalação, nenhum `npm install`, nenhum backend.

### Requisitos

| O que | Precisa? | Detalhe |
|-------|----------|---------|
| Node.js | Sim | Só para rodar `npx serve` como servidor HTTP |
| Navegador | Sim | Chrome, Firefox, Edge, Safari — qualquer um moderno |
| Internet | Sim (1ª carga) | Baixa Tailwind CSS, fontes Google, pdf.js, pdf-lib via CDN |
| Backend | **Não** | 100% client-side |
| Banco de dados | **Não** | localStorage do navegador |
| API key | **Não** | O app funciona com dados mock sem nenhuma chave |
| AI / LLM | **Não** | Zero inteligência artificial — é JavaScript puro |

---

## 📦 Stack Tecnológica

| Camada | Tecnologia | Versão | Carregamento |
|--------|-----------|--------|-------------|
| Linguagem | Vanilla JavaScript (ES Modules) | ES2022+ | Nativo do browser |
| CSS Framework | Tailwind CSS | 3.4.0 | CDN (`cdn.tailwindcss.com`) |
| Fontes | Inter + Sora | — | Google Fonts CDN |
| PDF Viewer | pdf.js | 3.11.174 | CDN (`cdnjs.cloudflare.com`) |
| PDF Manipulation | pdf-lib | 1.17.1 | CDN (`jsdelivr.net`) |
| Hashing | @noble/hashes (BLAKE3) | 2.2.0 | Dynamic `import()` |
| Ícones | Emoji nativos | — | Sistema operacional |

> **Sem npm, sem bundler, sem build step.** A aplicação é servida como arquivos estáticos. O único "build" é opcional e serve apenas para medir o tamanho do bundle.

---

## 🗺️ Estrutura do Projeto

```
bms-replica/
├── index.html              # Entry point — shell HTML com sidebar, header, modals, CDNs
├── _redirects              # Netlify proxy rules (CORS)
├── .gitignore
├── README.md
│
├── src/
│   ├── main.js             # Bootstrap: init views, expor globais, carregar proxy
│   │
│   ├── router/
│   │   └── index.js        # SPA Router: go(), ROUTES[], VIEWS{}, toggleSidebar()
│   │
│   ├── stores/
│   │   └── data.js         # Persistência: getDB(), saveDB(), getSettings(), saveSettings()
│   │
│   ├── views/              # 8 views funcionais (substituem stubs da Fase 2)
│   │   ├── dashboard.js    # Dashboard — cards KPI, quick actions, API warning
│   │   ├── etapa1.js       # Etapa 1 — Wizard 5 passos (CNPJ → Deploy Cloudflare)
│   │   ├── etapa2.js       # Etapa 2 — Compra número SMS (SMS24h)
│   │   ├── etapa3.js       # Etapa 3 — Editor PDF (pdf.js + pdf-lib)
│   │   ├── banco.js        # Banco de Empresas — grid com busca/filtro
│   │   ├── planilha.js     # Planilha — tabela 8 colunas + CSV export
│   │   ├── config.js       # Configurações — tokens API + backup/restore
│   │   └── ajuda.js        # Ajuda — guias estáticos
│   │
│   ├── widgets/            # Componentes UI reutilizáveis (factory functions)
│   │   ├── toast.js        # Notificações bottom-center com auto-dismiss 3s
│   │   ├── modal.js        # Modal genérico com overlay
│   │   ├── statCard.js     # Card de KPI com ícone + número + label
│   │   ├── quickCard.js    # Card de ação rápida com navegação
│   │   ├── stepBox.js      # Box de passo do wizard com estado disabled
│   │   └── pill.js         # Badge de status colorido
│   │
│   ├── utils/              # Utilitários
│   │   ├── format.js       # fmtCNPJ, fmtMoney, fmtDate, formatBRPhone
│   │   ├── string.js       # escapeHTML, onlyDigits, slugify
│   │   ├── clipboard.js    # copyText() com feedback toast
│   │   └── header.js       # refreshHeaderStatus() — pills de API
│   │
│   ├── proxy/
│   │   └── index.js        # instalarProxy() — monkey-patch fetch para CORS
│   │
│   └── styles/             # 12 arquivos CSS (~550 linhas)
│       ├── theme.css       # :root custom properties (13 variáveis)
│       ├── components.css  # Glassmorphism, grad-card, neon, ring-glow, grad-text
│       ├── buttons.css     # Botões 3D (8 variantes de cor + press animation)
│       ├── icon-cube.css   # Icon cubes (5 variantes de cor + gradiente)
│       ├── navigation.css  # Sidebar nav-links com active state
│       ├── pills.css       # Status pills (danger, warning, ok, doing)
│       ├── inputs.css      # Campos de formulário estilizados
│       ├── steps.css       # Step indicators do wizard
│       ├── layout.css      # Sidebar transition
│       ├── misc.css        # Spinner, scrollbar, file-drop, PDF overlay
│       ├── animations.css  # @keyframes: floaty, spin, pulse-ring
│       └── responsive.css  # Breakpoint 1024px: sidebar → overlay mobile
│
├── tests/
│   ├── validation-hub.html # Dashboard de validação (storage + bundle + visual)
│   ├── test_storage.js     # Testes de compatibilidade localStorage bidirecional
│   ├── test_visual.js      # Testes de estrutura DOM das 8 views
│   ├── test_responsive.js  # Testes de breakpoints responsivos
│   ├── test_etapa1.js      # Testes unitários do wizard Etapa 1
│   ├── test_etapa2.js      # Testes unitários do SMS wizard
│   ├── test_etapa3.js      # Testes unitários do editor PDF
│   ├── test-helpers.js     # Helpers compartilhados (mock DOM APIs)
│   └── measure-bundle.sh   # Script de medição de bundle gzip
│
└── .planning/              # Documentação de planejamento GSD
    ├── PROJECT.md          # Contexto do projeto
    ├── REQUIREMENTS.md     # 60 requisitos (51 v1 + 9 v2)
    ├── ROADMAP.md          # 6 fases com critérios de sucesso
    ├── STATE.md            # Estado atual do projeto
    ├── config.json         # Configuração do workflow
    ├── research/           # Pesquisa de domínio (STACK, FEATURES, ARCHITECTURE, PITFALLS)
    └── phases/             # Artefatos por fase (CONTEXT, RESEARCH, PLAN, SUMMARY)
```

---

## 🔧 Funcionalidades

### Dashboard

- **4 cards de KPI** computados do localStorage: Empresas, Sites Criados, No Ar, Finalizados
- **6 cards de ação rápida** com navegação para cada módulo
- **Card de aviso** condicional quando tokens de API não estão configurados
- Atualização em tempo real a cada renderização

### Etapa 1 — Criar Site (Wizard 5 passos)

| Passo | O que faz |
|-------|-----------|
| 1. CNPJ | Consulta BrasilAPI (`https://brasilapi.com.br/api/cnpj/v1/`) — normaliza 18 campos |
| 2. Domínio | 7 algoritmos de sugestão: duplicação de letras, troca de vogais, truncagem, sigla, reordenação, combinação |
| 3. Meta Tag | Gera meta tags para o site |
| 4. Gerar Site | Template engine ~290 linhas produzindo landing page SaaS completa com hero, about, services, contact |
| 5. Publicar | Pipeline Cloudflare Pages: create project → JWT → BLAKE3 hash → upload → deploy |

### Etapa 2 — Comprar Número SMS

- **API SMS24h**: consulta saldo, compra número por país/serviço
- **Auto-polling**: verificação a cada 5 segundos por código de ativação (timeout 20 min)
- **Re-deploy**: atualiza site existente com novo número de telefone
- Estados: NO_NUMBERS, NO_BALANCE, BAD_KEY, sucesso

### Etapa 3 — Editor PDF

- **pdf.js**: renderização multi-página com canvas (escala 1.4x)
- **Overlays**: texto arrastável (contentEditable) com delete por overlay
- **pdf-lib**: merge dos overlays no PDF e download
- **Extrator de endereço**: regex para 7 campos brasileiros (CEP, UF, logradouro, número, complemento, bairro, município)

### Banco de Empresas

- Grid de cards com busca textual (nome/CNPJ)
- Filtro por faixa de capital social
- Botão "Usar na Etapa 1" — transfere dados entre views via `window._empresaParaEtapa1`

### Planilha de Sites

- Tabela de 8 colunas: Empresa, CNPJ, Domínio, Tel Empresa, Tel Nosso, Status, Atualizado, Ações
- Dropdown de status inline (deploy/criado/erro/finalizado)
- Delete com confirmação
- **Export CSV**: UTF-8 BOM + ponto-e-vírgula, compatível com Excel brasileiro

### Configurações

- Cloudflare Token + Account ID com auto-detecção
- SMS24h API Key
- Backup completo como download JSON
- Restore via upload de arquivo JSON com validação

### Ajuda

- 3 cartões estáticos com guias passo a passo
- Ícones emoji + listas ordenadas

---

## 🎨 Design System

| Elemento | Descrição |
|----------|-----------|
| **Paleta** | Navy escuro (`#0b1020`) + indigo accent (`#6366f1`) + cyan (`#22d3ee`) |
| **Tipografia** | Inter (corpo) + Sora (headings display) |
| **Glassmorphism** | Cartões com `backdrop-filter: blur(10px)`, bordas translúcidas |
| **3D Buttons** | 8 variantes de cor com `box-shadow` duplo + animação de press (`translateY`) |
| **Icon Cubes** | 5 variantes com gradiente interno + highlight shadow |
| **Tema escuro** | 13 CSS custom properties no `:root` |
| **Responsivo** | Sidebar colapsa em 1024px → overlay mobile com backdrop |

---

## 📊 Métricas

| Métrica | Valor | Limite |
|---------|-------|--------|
| Bundle total (gzip) | **41.2 kB** | ≤ 180 kB |
| CSS (gzip) | 3.7 kB | — |
| JS (gzip) | 38.4 kB | — |
| Linhas de código | ~3,435 | — |
| Requisitos implementados | 51/51 (v1) | — |
| Testes automatizados | 105+ assertions | — |

---

## 🏗️ Metodologia

O projeto foi construído com **GSD (Git. Ship. Done.)** — metodologia de desenvolvimento plan-driven:

| Fase | Planos | Status |
|------|--------|--------|
| 1. Reconnaissance & Extraction | 5 | ✅ RECON.md — 4400 linhas de especificação |
| 2. Foundation | 5 | ✅ Router, stores, widgets, CSS, proxy |
| 3. Views & Integrations | 5 | ✅ 8 views, 3 APIs externas |
| 4. Validation | 2 | ✅ A/B testing, storage, responsive, bundle |
| 5. Rebrand Foundation | — | 📋 Deferido |
| 6. Rebrand Polish | — | 📋 Deferido |

### Engenharia Reversa

Todo o sistema original foi extraído via **análise caixa-preta** usando exclusivamente:
- Chrome DevTools (Elements, Console, Sources, Network, Application)
- Pretty Print de bundles JS minificados
- Inspeção de localStorage/sessionStorage
- Captura de requisições XHR/Fetch
- Wappalyzer e Lighthouse

O resultado é o `RECON.md` (4400 linhas) — a especificação autoritativa que guiou toda a reconstrução.

---

## 🧪 Testes

```bash
# Testes de storage (Node.js):
node --experimental-vm-modules tests/test_storage.js

# Medir bundle:
bash tests/measure-bundle.sh

# Abrir hub de validação no navegador:
npx serve . -p 3000
# → http://localhost:3000/tests/validation-hub.html
```

### Cobertura de Testes

| Suite | Assertions | Cobre |
|-------|-----------|-------|
| `test_storage.js` | 18 | VAL-02 — Compatibilidade localStorage bidirecional |
| `test_visual.js` | 70 | VAL-01 — Estrutura DOM das 8 views |
| `test_responsive.js` | 17 | VAL-03 — Breakpoints responsivos |
| `test_etapa1.js` | 25+ | ETP1 — Wizard CNPJ→Deploy |
| `test_etapa2.js` | 22 | ETP2 — Compra SMS |
| `test_etapa3.js` | 40+ | ETP3 — Editor PDF |

---

## 🔌 APIs Externas

O app original consome 3 APIs reais. O clone as integra, mas **funciona perfeitamente sem elas** — os dados são persistidos no localStorage e as views renderizam com dados mock.

| API | Endpoint | Uso | Precisa de chave? |
|-----|----------|-----|-------------------|
| BrasilAPI | `https://brasilapi.com.br/api/cnpj/v1/` | Consulta CNPJ | **Não** (pública) |
| Cloudflare Pages | `https://api.cloudflare.com/client/v4/` | Deploy de sites | **Sim** (configurar em Configurações) |
| SMS24h | `https://sms24h.com/api/` | Compra número SMS | **Sim** (configurar em Configurações) |

### Como configurar as APIs

1. Abra o app → navegue para **Configurações** (⚙️)
2. Cole seu **Cloudflare API Token** — o Account ID é detectado automaticamente
3. Cole sua **SMS24h API Key**
4. Clique em **Salvar**

Sem tokens, o Dashboard mostra um aviso amarelo e as Etapas 1 (publicar) e 2 (SMS) funcionam com dados mock para demonstração.

---

## 📝 localStorage Schema

O app usa duas chaves no localStorage, idênticas às do original:

### `lab_bms_db_v1`

```json
{
  "empresas": [
    {
      "cnpj": "00.000.000/0001-00",
      "nome": "Nome da Empresa",
      "nomeFantasia": "Nome Fantasia",
      "porte": "ME",
      "capitalSocial": 50000,
      "atividades": [...],
      "telefones": ["(11) 99999-9999"],
      "email": "contato@empresa.com.br",
      "logradouro": "Rua Exemplo, 123",
      "municipio": "São Paulo",
      "uf": "SP",
      "cep": "01000-000",
      "raw": { /* resposta completa da BrasilAPI */ }
    }
  ],
  "sites": [
    {
      "id": "uuid",
      "empresaCnpj": "00.000.000/0001-00",
      "subdomain": "nome-empresa",
      "deploymentId": "cloudflare-deploy-id",
      "url": "https://nome-empresa.pages.dev",
      "status": "deploy",
      "phone": "(11) 99999-9999",
      "criadoEm": "2024-01-01T00:00:00.000Z"
    }
  ],
  "sms": []
}
```

### `lab_bms_settings_v1`

```json
{
  "cf_token": "seu-cloudflare-api-token",
  "cf_account": "id-da-conta-cloudflare",
  "sms_key": "sua-sms24h-api-key"
}
```

---

## 🚢 Deploy

O app é 100% estático — qualquer servidor de arquivos funciona:

```bash
# Netlify (como o original)
netlify deploy --prod

# Vercel
vercel

# GitHub Pages
git push  # configurar Pages no repo settings

# Qualquer servidor HTTP
python3 -m http.server 3000
npx serve . -p 3000
```

---

## 📋 Roadmap Futuro

O **clone fiel (v1)** está 100% completo. As fases de rebranding (v2) estão planejadas para um futuro milestone:

- 🎨 **Nova paleta**: verde esmeralda + laranja queimado
- 🔤 **Nova tipografia**: Poppins / Montserrat
- 📐 **Novo layout**: Header fixo + Mega Menu dropdown
- ✨ **Novos ícones**: Phosphor Icons (substituindo emojis)
- 🎭 **Micro-animações**: transições de rota, entrada staggered, hover states

---

## 📄 Licença

MIT — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

*Documentação gerada em 2026-06-27. Projeto construído com GSD Core v1.6.0.*
