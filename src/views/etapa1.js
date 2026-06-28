// src/views/etapa1.js
// Etapa 1 — Criar Site: 5-step Wizard with CNPJ lookup, domain engine,
// meta-tag generator, site HTML builder, and Cloudflare Pages deploy.
// Plan 03-03 — Full implementation replacing 58-line stub.
//
// Architecture: Module-level state machine with cascade reset.
// Each step unlocks progressively as previous step's field is populated.
// Uses stepBox() widget for consistent wizard card rendering.

import { VIEWS } from '../router/index.js';
import { getDB, saveDB, getSettings } from '../stores/data.js';
import { slugify, onlyDigits, escapeHTML } from '../utils/string.js';
import { fmtCNPJ, fmtMoney, fmtDate, formatBRPhone } from '../utils/format.js';
import { stepBox } from '../widgets/stepBox.js';
import { statCard } from '../widgets/statCard.js';
import { toast } from '../widgets/toast.js';

// =============================================================================
// MODULE-LEVEL STATE (RESEARCH.md Pattern 3, lines 321-343)
// =============================================================================
export let etapa1State = {
  empresa: null,        // Company object from CNPJ lookup (normalized)
  dominio: '',          // Selected domain slug
  metatag: '',          // Meta-tag HTML string
  htmlGerado: '',       // Generated site HTML
  publicado: null       // {url, projectName, deploymentId} after deploy
};

// =============================================================================
// CASCADE RESET — clearing step N clears steps N+1 through 5
// (RESEARCH.md lines 336-342)
// =============================================================================
export function resetDownstream(fromStep) {
  if (fromStep < 1) etapa1State.empresa = null;
  if (fromStep < 2) etapa1State.dominio = '';
  if (fromStep < 3) etapa1State.metatag = '';
  if (fromStep < 4) etapa1State.htmlGerado = '';
  if (fromStep < 5) etapa1State.publicado = null;
}

// =============================================================================
// NORMALIZAR BRASILAPI — Maps BrasilAPI JSON to internal empresa object
// (RESEARCH.md lines 699-721 context)
// =============================================================================
export function normalizarBrasilAPI(d) {
  return {
    razao_social: d.razao_social,
    nome_fantasia: d.nome_fantasia || d.razao_social,
    cnpj: d.cnpj,
    capital_social: Number(d.capital_social) || 0,
    municipio: d.municipio,
    uf: d.uf,
    cnae_fiscal_descricao: d.cnae_fiscal_descricao,
    logradouro: d.logradouro,
    numero: d.numero,
    bairro: d.bairro,
    cep: d.cep,
    ddd_telefone_1: d.ddd_telefone_1,
    telefone_1: d.telefone_1,
    email: d.email,
    natureza_juridica: d.natureza_juridica,
    porte: d.porte,
    data_abertura: d.data_abertura,
    raw: d  // Full original response preserved
  };
}

// =============================================================================
// SALVAR EMPRESA — Persists company to localStorage DB
// =============================================================================
export function salvarEmpresa(e) {
  const db = getDB();
  db.empresas.push(e);
  saveDB(db);
  return db;
}

// =============================================================================
// CNPJ LOOKUP — Fetches from BrasilAPI and normalizes
// (RESEARCH.md lines 699-721)
// =============================================================================
export async function e1Buscar() {
  const input = document.getElementById('e1_cnpj');
  const cnpj = onlyDigits(input ? input.value : '');
  if (cnpj.length !== 14) { toast('CNPJ precisa ter 14 números', '⚠️'); return; }

  const box = document.getElementById('e1_result');
  if (box) box.innerHTML = '<div class="spinner"></div>';

  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!r.ok) throw new Error('Não encontrado');
    const d = await r.json();
    const e = normalizarBrasilAPI(d);
    salvarEmpresa(e);
    etapa1State.empresa = e;
    toast('Empresa carregada!', '✅');
    window.go('etapa1');
  } catch (err) {
    if (box) {
      box.innerHTML = `<div class="glass rounded-2xl p-4 text-center text-rose-300">
        😕 Não consegui encontrar este CNPJ. Verifique ou cadastre manualmente.
      </div>`;
    }
  }
}

// =============================================================================
// ALTERAR EMPRESA — Reset and go back to CNPJ search
// =============================================================================
export function alterarEmpresa() {
  etapa1State.empresa = null;
  resetDownstream(1);
  window.go('etapa1');
}

// =============================================================================
// DOMAIN SUGGESTION ENGINE — 7 algorithms, max 6 unique slugs
// (RESEARCH.md lines 840-876 — EXACT implementation)
// =============================================================================
export function gerarSugestoesDominio(nome) {
  const slug = slugify(nome);
  const sugs = new Set();

  // Algorithm 1: Base + double last letter
  const last = slug.slice(-1);
  if (last) sugs.add((slug + last).slice(0, 32));

  // Algorithm 2: Truncate + add 's'
  sugs.add((slug.slice(0, 10) + 's').slice(0, 32));

  // Algorithm 3: First vowel doubled
  const vowels = slug.match(/[aeiou]/);
  if (vowels) sugs.add(slug.replace(vowels[0], vowels[0] + vowels[0]).slice(0, 32));

  // Algorithm 4: Add '01' or 'oficial' suffix
  sugs.add((slug + '01').slice(0, 32));
  sugs.add((slug + 'oficial').slice(0, 32));

  // Algorithm 5: First-letters sigla + base
  const words = (nome || '').toLowerCase().split(/\s+/);
  const sigla = words.map(w => w[0] || '').join('').slice(0, 4);
  if (sigla.length >= 2) sugs.add((sigla + slug).slice(0, 32));

  // Algorithm 6: Reorder — last 4 chars + remainder
  if (slug.length >= 6) {
    sugs.add((slug.slice(-4) + slug.slice(0, -4)).slice(0, 32));
  }

  // Algorithm 7: Half + first 2 chars duplicated
  const half = Math.floor(slug.length / 2);
  const prefix = slug.slice(0, Math.max(2, half));
  sugs.add((prefix + prefix.slice(0, 2)).slice(0, 32));

  // Filter: min 4 chars, remove base slug duplicate, limit 6
  return [...sugs].filter(s => s.length >= 4 && s !== slug).slice(0, 6);
}

// =============================================================================
// SELECT DOMAIN — Sets dominio and re-renders (unlocks Step 3)
// =============================================================================
export function selecionarDominio(slug) {
  etapa1State.dominio = slug;
  window.go('etapa1');
}

// =============================================================================
// GERAR METATAG — Auto-fills meta-tag textarea with company data
// =============================================================================
export function gerarMetatag() {
  const { empresa } = etapa1State;
  if (!empresa) return;

  const nome = escapeHTML(empresa.nome_fantasia);
  const desc = escapeHTML(empresa.cnae_fiscal_descricao || 'Empresa brasileira');
  const keywords = escapeHTML(
    [empresa.nome_fantasia, empresa.cnae_fiscal_descricao, empresa.municipio, empresa.uf]
      .filter(Boolean).join(', ')
  );

  const meta = `<title>${nome} — Site Oficial</title>
<meta property="og:title" content="${nome}">
<meta property="og:description" content="${desc}">
<meta name="description" content="${desc}">
<meta name="keywords" content="${keywords}">
<meta name="twitter:card" content="summary">`;

  const textarea = document.getElementById('e1_metatag');
  if (textarea) textarea.value = meta;
}

// =============================================================================
// SALVAR METATAG — Reads textarea, saves to state, resets downstream
// =============================================================================
export function salvarMetatag() {
  const textarea = document.getElementById('e1_metatag');
  if (!textarea) return;
  etapa1State.metatag = textarea.value;
  resetDownstream(3);
  window.go('etapa1');
}

// =============================================================================
// BUILD SITE HTML — ~285-line template literal producing complete site
// CRITICAL: All user data MUST be escapeHTML'd (Pitfall 5 — XSS prevention)
// =============================================================================
export function buildSiteHTML(dados) {
  const e = (s) => escapeHTML(s || '');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${dados.metatag || `<title>${e(dados.nome_fantasia)} — Site Oficial</title>`}
  <script src="https://cdn.tailwindcss.com/3.4.0"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Sora', sans-serif; }
    .hero-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    section { scroll-margin-top: 80px; }
    .card { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 2rem; }
    .service-card { transition: transform 0.3s ease; }
    .service-card:hover { transform: translateY(-4px); }
  </style>
</head>
<body class="min-h-screen bg-gray-50">
  <!-- Header / Nav -->
  <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur shadow-sm z-50">
    <nav class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold" style="font-family:'Sora',sans-serif;">${e(dados.nome_fantasia)}</h1>
      <div class="hidden md:flex gap-6 text-sm font-medium text-gray-600">
        <a href="#sobre" class="hover:text-purple-600 transition">Sobre Nós</a>
        <a href="#servicos" class="hover:text-purple-600 transition">Serviços</a>
        <a href="#contato" class="hover:text-purple-600 transition">Contato</a>
      </div>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="hero-gradient text-white pt-32 pb-24 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-6" style="font-family:'Sora',sans-serif;">${e(dados.nome_fantasia)}</h1>
      <p class="text-xl md:text-2xl text-purple-100 mb-8">${e(dados.cnae_descricao || 'Excelência em serviços')}</p>
      <a href="#contato" class="inline-block bg-white text-purple-700 font-bold px-8 py-4 rounded-full text-lg hover:bg-purple-50 transition shadow-lg">Entre em Contato</a>
    </div>
  </section>

  <!-- About Section -->
  <section id="sobre" class="py-20 px-6">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-extrabold text-gray-800 mb-8 text-center" style="font-family:'Sora',sans-serif;">Sobre Nós</h2>
      <div class="card mb-8">
        <p class="text-gray-600 leading-relaxed text-lg">
          A <strong>${e(dados.nome_fantasia)}</strong> atua no segmento de <strong>${e(dados.cnae_descricao || 'prestação de serviços')}</strong>,
          constituída como <strong>${e(dados.natureza_juridica || 'Empresa')}</strong> de porte <strong>${e(dados.porte || 'não informado')}</strong>.
        </p>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-purple-600 mb-2">${e(dados.capital_social || '—')}</div>
          <div class="text-gray-500 text-sm">Capital Social</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-purple-600 mb-2">${e(dados.ano_fundacao || '—')}</div>
          <div class="text-gray-500 text-sm">Fundação</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold text-purple-600 mb-2">${e(dados.porte || '—')}</div>
          <div class="text-gray-500 text-sm">Porte</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section id="servicos" class="py-20 px-6 bg-gray-100">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-extrabold text-gray-800 mb-12 text-center" style="font-family:'Sora',sans-serif;">Nossos Serviços</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card service-card">
          <div class="text-3xl mb-4">🚀</div>
          <h3 class="text-xl font-bold mb-2" style="font-family:'Sora',sans-serif;">Soluções Digitais</h3>
          <p class="text-gray-600">Transformação digital para impulsionar o crescimento do seu negócio.</p>
        </div>
        <div class="card service-card">
          <div class="text-3xl mb-4">📊</div>
          <h3 class="text-xl font-bold mb-2" style="font-family:'Sora',sans-serif;">Consultoria</h3>
          <p class="text-gray-600">Análise estratégica e orientação especializada para resultados sustentáveis.</p>
        </div>
        <div class="card service-card">
          <div class="text-3xl mb-4">🔧</div>
          <h3 class="text-xl font-bold mb-2" style="font-family:'Sora',sans-serif;">Suporte Técnico</h3>
          <p class="text-gray-600">Atendimento ágil e eficiente para manter sua operação sempre ativa.</p>
        </div>
        <div class="card service-card">
          <div class="text-3xl mb-4">💡</div>
          <h3 class="text-xl font-bold mb-2" style="font-family:'Sora',sans-serif;">Inovação</h3>
          <p class="text-gray-600">Desenvolvimento de projetos inovadores com tecnologias de ponta.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contato" class="py-20 px-6">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-extrabold text-gray-800 mb-12 text-center" style="font-family:'Sora',sans-serif;">Contato</h2>
      <div class="card">
        <div class="space-y-4 text-gray-600">
          ${dados.logradouro ? `<p>📍 <strong>Endereço:</strong> ${e(dados.logradouro)}, ${e(dados.numero)} — ${e(dados.bairro)}, ${e(dados.municipio)}/${e(dados.uf)} — CEP ${e(dados.cep)}</p>` : ''}
          ${dados.telefone ? `<p>📞 <strong>Telefone:</strong> <a href="tel:${e(dados.telefone_1 || '')}" class="text-purple-600 hover:underline">${e(dados.telefone)}</a></p>` : ''}
          ${dados.email ? `<p>✉️ <strong>E-mail:</strong> <a href="mailto:${e(dados.email)}" class="text-purple-600 hover:underline">${e(dados.email)}</a></p>` : ''}
        </div>
        <!-- Map placeholder -->
        <div class="mt-8 bg-gray-200 rounded-xl h-64 flex items-center justify-center text-gray-400">
          📍 Localização — ${e(dados.municipio || '')}/${e(dados.uf || '')}
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-800 text-gray-300 py-12 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <p class="font-bold text-white text-lg mb-2" style="font-family:'Sora',sans-serif;">${e(dados.nome_fantasia)}</p>
      <p class="text-sm mb-1">CNPJ: ${e(fmtCNPJ(dados.cnpj || ''))}</p>
      <p class="text-xs text-gray-500 mt-4">© ${new Date().getFullYear()} — ${e(dados.nome_fantasia)}. Todos os direitos reservados.</p>
      <p class="text-xs text-gray-600 mt-1">Site gerado por Laboratório de BMS</p>
    </div>
  </footer>
</body>
</html>`;
}

// =============================================================================
// GERAR SITE HTML — Builds dados object, calls buildSiteHTML, stores result
// =============================================================================
export function gerarSiteHTML() {
  const { empresa, dominio, metatag } = etapa1State;

  if (!metatag) {
    toast('Gere as meta tags primeiro!', '⚠️');
    return;
  }

  const tel = empresa.ddd_telefone_1 && empresa.telefone_1
    ? formatBRPhone(empresa.ddd_telefone_1 + empresa.telefone_1)
    : '';

  const dados = {
    nome_fantasia: empresa.nome_fantasia,
    razao_social: empresa.razao_social,
    cnpj: empresa.cnpj,
    dominio: dominio,
    url: dominio ? `${dominio}.pages.dev` : '',
    telefone: tel,
    email: empresa.email || '',
    logradouro: empresa.logradouro || '',
    numero: empresa.numero || '',
    bairro: empresa.bairro || '',
    municipio: empresa.municipio || '',
    uf: empresa.uf || '',
    cep: empresa.cep || '',
    cnae_descricao: empresa.cnae_fiscal_descricao || '',
    natureza_juridica: empresa.natureza_juridica || '',
    porte: empresa.porte || '',
    capital_social: empresa.capital_social ? fmtMoney(empresa.capital_social) : '',
    metatag: metatag,
    ano_fundacao: empresa.data_abertura ? String(new Date(empresa.data_abertura).getFullYear()) : '',
    telefone_1: empresa.ddd_telefone_1 && empresa.telefone_1
      ? empresa.ddd_telefone_1 + empresa.telefone_1 : ''
  };

  etapa1State.htmlGerado = buildSiteHTML(dados);
  toast('Site gerado!', '✅');
  window.go('etapa1');
}

// =============================================================================
// PREVIEW — Opens generated HTML in a new browser tab
// =============================================================================
export function e1Preview() {
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (w) {
    w.document.write(etapa1State.htmlGerado);
    w.document.close();
  }
}

// =============================================================================
// CLOUDFLARE PAGES 5-STEP DEPLOY PIPELINE
// (RESEARCH.md lines 754-833 — EXACT implementation)
// Pitfall 6: Auth switching — API token for steps 1,2,5; JWT for steps 3,4
// Pitfall 3: BLAKE3 hash uses deprecated unescape+encodeURIComponent pattern
// =============================================================================
async function safeJson(r) {
  const text = await r.text();
  try { return JSON.parse(text); } catch(e) {
    throw new Error(`API retornou HTML/erro (HTTP ${r.status}): ${text.slice(0, 200)}`);
  }
}

export async function e1Publicar() {
  const s = getSettings();
  if (!s.cf_token || !s.cf_account) {
    const log = document.getElementById('publish-log');
    if (log) log.innerHTML = '<div class="text-amber-300">⚠️ Configure o token Cloudflare nas Configurações antes de publicar.</div>';
    return;
  }

  const projectName = etapa1State.dominio;
  if (!projectName) {
    toast('Selecione um domínio primeiro!', '⚠️');
    return;
  }

  const log = document.getElementById('publish-log');
  const btn = document.getElementById('btn-publish');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Publicando...'; }

  try {
    const apiHeaders = { 'Authorization': `Bearer ${s.cf_token}`, 'Content-Type': 'application/json' };
    const base = `https://api.cloudflare.com/client/v4/accounts/${s.cf_account}/pages`;

    // Step 1: Create project (idempotent — handles "already exists")
    if (log) log.innerHTML = '📦 Criando projeto...';
    const r1 = await fetch(`${base}/projects`, {
      method: 'POST', headers: apiHeaders,
      body: JSON.stringify({ name: projectName, production_branch: 'main' })
    });
    const d1 = await safeJson(r1);
    if (!d1.success && !(d1.errors || []).some(e =>
      e.code === 8000007 || e.code === 8000031 || (e.message || '').toLowerCase().includes('exists')
    )) {
      throw new Error('CRIAR: ' + JSON.stringify(d1.errors || d1));
    }
    if (log) log.innerHTML = '📦 Projeto criado/confirmado ✅';

    // Step 2: Get JWT upload token
    // Auth: API token
    if (log) log.innerHTML = '🔑 Obtendo token de upload...';
    const r2 = await fetch(`${base}/projects/${projectName}/upload-token`, { headers: apiHeaders });
    const d2 = await safeJson(r2);
    if (!d2.success) throw new Error('JWT: ' + JSON.stringify(d2));
    const jwt = d2.result.jwt;
    if (log) log.innerHTML = '🔑 Token de upload obtido ✅';

    // Step 3: BLAKE3 hash (LOCAL computation — no API call)
    // Uses deprecated unescape+encodeURIComponent pattern for hash compatibility (Pitfall 3)
    if (log) log.innerHTML = '🔐 Calculando hash...';
    const { blake3 } = await import('https://esm.sh/@noble/hashes@2.2.0/blake3');
    const html = etapa1State.htmlGerado;
    const b64 = btoa(unescape(encodeURIComponent(html)));
    const toHash = new TextEncoder().encode(b64 + 'html');
    const hashBytes = blake3(toHash);
    const hex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const fileHash = hex.slice(0, 32);
    if (log) log.innerHTML = '🔐 Hash calculado ✅';

    // Step 4: Upload asset (uses JWT auth — NOT API token — Pitfall 6)
    // Auth: JWT from Step 2
    if (log) log.innerHTML = '📤 Enviando arquivo...';
    const uploadHeaders = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };
    const r4 = await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload', {
      method: 'POST', headers: uploadHeaders,
      body: JSON.stringify([{ key: fileHash, value: b64, base64: true, metadata: { contentType: 'text/html' } }])
    });
    const upRes = await safeJson(r4);
    if (!upRes.success) throw new Error('UPLOAD: ' + JSON.stringify(upRes));
    if (log) log.innerHTML = '📤 Arquivo enviado ✅';

    // Step 5: Create deployment (uses API token auth + FormData)
    // Auth: API token (NOT JWT)
    if (log) log.innerHTML = '🚀 Criando deploy...';
    const fd = new FormData();
    fd.append('manifest', JSON.stringify({ '/index.html': fileHash }));
    const r5 = await fetch(`${base}/projects/${projectName}/deployments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.cf_token}` },
      body: fd
    });
    const depJson = await safeJson(r5);
    if (!depJson.success) throw new Error('DEPLOY: ' + JSON.stringify(depJson));

    // Success
    const url = depJson.result.url || `https://${projectName}.pages.dev`;
    etapa1State.publicado = { url, projectName, deploymentId: depJson.result.id };

    // Update site in DB
    const db = getDB();
    const site = db.sites.find(site => site.dominio === projectName);
    if (site) {
      site.url = url;
      site.deploymentId = depJson.result.id;
      site.status = 'deploy';
      site.atualizado = Date.now();
      saveDB(db);
    }

    if (log) log.innerHTML = '🚀 Deploy criado! ✅';
    toast('🎉 Site publicado!', '🚀');
    setTimeout(() => window.go('etapa1'), 800);

  } catch (e) {
    if (log) {
      log.innerHTML = `<div class="text-rose-300">❌ ${escapeHTML(e.message)}</div>
        <div class="text-slate-400 text-xs mt-2">💡 Dica: verifique se o token tem permissão Pages:Edit</div>`;
    }
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Tentar novamente'; }
  }
}

// =============================================================================
// RENDER FUNCTIONS — Each step has its own render function
// =============================================================================

function renderCompanyCard(empresa) {
  const tel = empresa.ddd_telefone_1 && empresa.telefone_1
    ? formatBRPhone(empresa.ddd_telefone_1 + empresa.telefone_1) : '—';

  return `<div class="space-y-3">
    <div class="copy-row">
      <div class="key">Razão Social</div>
      <div class="val font-bold">${escapeHTML(empresa.razao_social)}</div>
      <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(empresa.razao_social)}','Razão social copiada!')">📋</button>
    </div>
    ${empresa.nome_fantasia !== empresa.razao_social ? `<div class="copy-row">
      <div class="key">Nome Fantasia</div>
      <div class="val">${escapeHTML(empresa.nome_fantasia)}</div>
      <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(empresa.nome_fantasia)}','Nome copiado!')">📋</button>
    </div>` : ''}
    <div class="copy-row">
      <div class="key">CNPJ</div>
      <div class="val font-mono">${fmtCNPJ(empresa.cnpj)}</div>
      <button class="btn-3d cyan sm" onclick="copyText('${onlyDigits(empresa.cnpj)}','CNPJ copiado!')">📋</button>
    </div>
    <div class="copy-row">
      <div class="key">Capital Social</div>
      <div class="val">${fmtMoney(empresa.capital_social)}</div>
    </div>
    <div class="copy-row">
      <div class="key">Atividade</div>
      <div class="val text-sm">${escapeHTML(empresa.cnae_fiscal_descricao || '—')}</div>
    </div>
    <div class="copy-row">
      <div class="key">Localização</div>
      <div class="val text-sm">${escapeHTML(empresa.municipio || '')}/${escapeHTML(empresa.uf || '')}</div>
    </div>
    ${empresa.logradouro ? `<div class="copy-row">
      <div class="key">Endereço</div>
      <div class="val text-sm">${escapeHTML(empresa.logradouro)}, ${escapeHTML(empresa.numero || 'S/N')} — ${escapeHTML(empresa.bairro || '')}</div>
    </div>` : ''}
    ${tel !== '—' ? `<div class="copy-row">
      <div class="key">Telefone</div>
      <div class="val">${escapeHTML(tel)}</div>
      <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(tel)}','Telefone copiado!')">📋</button>
    </div>` : ''}
    <button class="btn-3d ghost sm mt-2" onclick="window.alterarEmpresa()">🔄 Alterar CNPJ</button>
  </div>`;
}

function renderCNPJSearchForm() {
  return `<div class="space-y-4">
    <p class="text-slate-400 text-sm">Digite o CNPJ da empresa (somente números)</p>
    <input id="e1_cnpj" class="input" placeholder="00.000.000/0000-00" maxlength="18"
      oninput="let v=this.value.replace(/\\D/g,'');if(v.length>2)v=v.slice(0,2)+'.'+v.slice(2);if(v.length>6)v=v.slice(0,6)+'.'+v.slice(6);if(v.length>10)v=v.slice(0,10)+'/'+v.slice(10);if(v.length>15)v=v.slice(0,15)+'-'+v.slice(15);this.value=v;"
      onkeydown="if(event.key==='Enter')window.e1Buscar()">
    <button class="btn-3d purple" onclick="window.e1Buscar()">🔍 Buscar Empresa</button>
    <div id="e1_result" class="mt-3"></div>
  </div>`;
}

function renderStep1CNPJ() {
  const { empresa } = etapa1State;
  const done = empresa !== null;
  const body = empresa ? renderCompanyCard(empresa) : renderCNPJSearchForm();
  return stepBox(1, '🔍', 'Consultar CNPJ no BrasilAPI', done, body, false);
}

function renderStep2Dominio() {
  const { empresa, dominio } = etapa1State;
  const disabled = empresa === null;
  const done = dominio !== '';

  if (disabled) {
    return stepBox(2, '🌐', 'Escolher Domínio', false,
      '<p class="text-slate-400 text-sm">Busque uma empresa no passo 1 para gerar sugestões de domínio.</p>', true);
  }

  const slugNome = empresa.nome_fantasia || empresa.razao_social;
  const sugs = gerarSugestoesDominio(slugNome);

  const body = `<div class="space-y-3">
    ${dominio ? `<div class="glass rounded-xl p-3 mb-3">
      <div class="text-xs text-slate-400">Domínio selecionado:</div>
      <div class="flex items-center gap-2 mt-1">
        <span class="font-mono font-bold text-purple-300">${escapeHTML(dominio)}.pages.dev</span>
        <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(dominio)}.pages.dev','Domínio copiado!')">📋 Copiar</button>
      </div>
    </div>` : ''}
    <p class="text-slate-400 text-sm">${sugs.length ? 'Selecione um domínio sugerido:' : 'Nenhuma sugestão gerada. Tente outro nome.'}</p>
    <div class="flex flex-wrap gap-2">
      ${sugs.map(s => `<button class="btn-3d ghost sm" onclick="window.selecionarDominio('${escapeHTML(s)}')">🌐 ${escapeHTML(s)}</button>`).join('')}
    </div>
    <button class="btn-3d ghost sm mt-2" onclick="window.alterarEmpresa()">🔄 Voltar e alterar CNPJ</button>
  </div>`;

  return stepBox(2, '🌐', 'Escolher Domínio', done, body, disabled);
}

function renderStep3Meta() {
  const { empresa, dominio, metatag } = etapa1State;
  const disabled = dominio === '';
  const done = metatag !== '';

  if (disabled) {
    return stepBox(3, '🏷️', 'Meta Tags', false,
      '<p class="text-slate-400 text-sm">Escolha um domínio no passo 2 para configurar as meta tags.</p>', true);
  }

  const defaultMeta = metatag || '';

  const body = `<div class="space-y-3">
    <p class="text-slate-400 text-sm">Configure as meta tags para SEO e compartilhamento em redes sociais.</p>
    <button class="btn-3d cyan sm" onclick="window.gerarMetatag()">✨ Gerar Meta Tags</button>
    <textarea id="e1_metatag" class="input w-full" rows="5" placeholder="As meta tags aparecerão aqui...">${escapeHTML(defaultMeta)}</textarea>
    <div class="flex gap-2">
      <button class="btn-3d green sm" onclick="window.salvarMetatag()">💾 Salvar Meta Tags</button>
      <button class="btn-3d ghost sm" onclick="window.resetDownstream2()">🔄 Voltar</button>
    </div>
  </div>`;

  return stepBox(3, '🏷️', 'Meta Tags', done, body, disabled);
}

function renderStep4HTML() {
  const { metatag, htmlGerado } = etapa1State;
  const disabled = metatag === '';
  const done = htmlGerado !== '';

  if (disabled) {
    return stepBox(4, '⚡', 'Gerar Site', false,
      '<p class="text-slate-400 text-sm">Salve as meta tags no passo 3 para gerar o site.</p>', true);
  }

  const sizeKB = htmlGerado ? (new Blob([htmlGerado]).size / 1024).toFixed(1) : '0';

  const body = `<div class="space-y-3">
    <button class="btn-3d green" onclick="window.gerarSiteHTML()">⚡ Gerar Site</button>
    ${done ? `<div class="glass rounded-xl p-4 mt-3 space-y-2">
      <div class="flex items-center gap-2 text-green-300 text-sm">✅ HTML gerado (${sizeKB} kB)</div>
      <div class="flex gap-2">
        <button class="btn-3d cyan sm" onclick="window.e1Preview()">👁️ Preview</button>
        <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(htmlGerado).replace(/'/g, "\\'")}','HTML copiado!')">📋 Copiar HTML</button>
      </div>
    </div>` : ''}
    <button class="btn-3d ghost sm mt-2" onclick="window.resetDownstream3()">🔄 Voltar</button>
  </div>`;

  return stepBox(4, '⚡', 'Gerar Site HTML', done, body, disabled);
}

function renderStep5Publicar() {
  const { htmlGerado, publicado } = etapa1State;
  const disabled = htmlGerado === '';
  const done = publicado !== null;

  if (disabled) {
    return stepBox(5, '🚀', 'Publicar no Cloudflare', false,
      '<p class="text-slate-400 text-sm">Gere o site no passo 4 para publicá-lo.</p>', true);
  }

  const body = `<div class="space-y-3">
    ${done ? `<div class="glass rounded-xl p-4 space-y-2 bg-green-900/20 border border-green-500/30">
      <div class="text-green-300 font-bold">🎉 Site Publicado!</div>
      <div class="copy-row">
        <div class="key">URL</div>
        <div class="val font-mono text-sm">${escapeHTML(publicado.url)}</div>
      </div>
      <div class="text-xs text-slate-400">Projeto: ${escapeHTML(publicado.projectName)} | ID: ${escapeHTML(publicado.deploymentId || '')}</div>
      <div class="flex gap-2 mt-3">
        <button class="btn-3d cyan sm" onclick="window.open('${escapeHTML(publicado.url)}','_blank')">🌐 Abrir Site</button>
        <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(publicado.url)}','URL copiada!')">📋 Copiar URL</button>
        <button class="btn-3d ghost sm" onclick="resetDownstream(5);window.go('etapa1')">🔄 Re-publicar</button>
      </div>
    </div>` : `<div>
      <button id="btn-publish" class="btn-3d purple" onclick="window.e1Publicar()">🚀 Publicar Site</button>
      <div id="publish-log" class="mt-3 text-sm text-slate-300 space-y-1"></div>
    </div>`}
    <button class="btn-3d ghost sm mt-2" onclick="window.resetDownstream4()">🔄 Voltar</button>
  </div>`;

  return stepBox(5, '🚀', 'Publicar no Cloudflare', done, body, disabled);
}

// =============================================================================
// VIEWS.etapa1 — Main view renderer
// Renders the 5-step wizard with progressive unlocking based on state
// =============================================================================
function renderEtapa1() {
  return `<div class="space-y-6">
    <!-- Header card -->
    <div class="glass rounded-2xl p-6 text-center">
      <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">🧬</div>
      <h2 class="font-display text-2xl mt-4">Etapa 1 — Criar Site</h2>
      <p class="text-slate-400 mt-2">Fluxo automático: CNPJ → Domínio → Meta → Site → Publicar</p>
    </div>

    <!-- 5 step cards in sequence -->
    <div class="space-y-3">
      ${renderStep1CNPJ()}
      ${renderStep2Dominio()}
      ${renderStep3Meta()}
      ${renderStep4HTML()}
      ${renderStep5Publicar()}
    </div>
  </div>`;
}

// =============================================================================
// INIT — Populates VIEWS registry and exposes functions to window
// =============================================================================
export function initEtapa1() {
  VIEWS.etapa1 = renderEtapa1;

  // Expose functions to window for inline onclick handlers
  window.e1Buscar = e1Buscar;
  window.alterarEmpresa = alterarEmpresa;
  window.selecionarDominio = selecionarDominio;
  window.gerarMetatag = gerarMetatag;
  window.salvarMetatag = salvarMetatag;
  window.gerarSiteHTML = gerarSiteHTML;
  window.e1Preview = e1Preview;
  window.e1Publicar = e1Publicar;

  // Shortcut functions for step reset buttons (inline onclick)
  window.resetDownstream2 = () => { resetDownstream(2); window.go('etapa1'); };
  window.resetDownstream3 = () => { resetDownstream(3); window.go('etapa1'); };
  window.resetDownstream4 = () => { resetDownstream(4); window.go('etapa1'); };

  // Cross-view integration (BANC-03): check for empresa from Banco transfer
  if (window._empresaParaEtapa1) {
    etapa1State.empresa = window._empresaParaEtapa1;
    delete window._empresaParaEtapa1;
    window.go('etapa1');
  }
}
