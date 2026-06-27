// src/views/etapa2.js
// Etapa 2 — SMS Purchase Wizard (SMS24h Integration)
// Matches RECON.md §1.4 Etapa 2 View + RESEARCH.md Patterns 2, 4, 6
//
// Replaces the Phase 02 stub with fully functional:
// - SMS24h API client (query-param auth, colon-delimited text responses)
// - Balance check + number purchase with country/service selectors
// - Auto-polling for activation codes (5s interval, 20min timeout)
// - Code display with copy button
// - Re-deploy existing site with new phone number via Cloudflare Pages
//
// Architecture: Module-scoped state, pure VIEWS render function, window-exposed
// event handlers. All side effects (fetch, DOM, setInterval) confined to handlers.
// Pitfall 4 compliance: clearInterval on ALL exit paths.

import { VIEWS } from '../router/index.js';
import { getSettings, getDB, saveDB } from '../stores/data.js';
import { escapeHTML, onlyDigits } from '../utils/string.js';
import { formatBRPhone, fmtMoney } from '../utils/format.js';
import { toast } from '../widgets/toast.js';
import { stepBox } from '../widgets/stepBox.js';
import { pill } from '../widgets/pill.js';

// =============================================================================
// Module-level state (ETP2-01, ETP2-02, ETP2-03, ETP2-04, ETP2-05)
// =============================================================================

export let etapa2State = {
  activationId: null,   // SMS24h activation ID (parsed from ACCESS_NUMBER response)
  phone: '',            // Purchased phone number (55319XXXXXXXX)
  code: '',             // Received activation code (from STATUS_OK response)
  timer: null           // setInterval ID for polling
};

// =============================================================================
// SMS24h API Client (ETP2-01)
// Pattern 2: API Client Wrapper — RESEARCH.md lines 285-303
// Query-param auth, text response (NOT JSON), colon-delimited parsing
// =============================================================================

export async function smsAPI(action, extra = '') {
  const k = getSettings().sms_key;
  if (!k) throw new Error('Sem API key SMS24h. Configure primeiro.');
  const url = `https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(k)}&action=${encodeURIComponent(action)}${extra}`;
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text(); // NOTE: Returns text, NOT JSON
}

// =============================================================================
// Balance check (ETP2-02)
// Parses colon-delimited ACCESS_BALANCE response, formats BRL via fmtMoney
// =============================================================================

window.e2VerSaldo = async function e2VerSaldo() {
  const balEl = document.getElementById('sms-balance');
  if (!balEl) return;
  try {
    const txt = await smsAPI('getBalance');
    // Response format: "ACCESS_BALANCE:XX.XX"
    if (txt.startsWith('ACCESS_BALANCE:')) {
      const value = parseFloat(txt.split(':')[1]);
      if (isNaN(value)) throw new Error('Valor inválido');
      balEl.innerHTML = `<span class="text-green-400 text-lg font-bold">Saldo: ${escapeHTML(fmtMoney(value))}</span>`;
    } else {
      balEl.innerHTML = `<span class="text-amber-300">Resposta inesperada: ${escapeHTML(txt)}</span>`;
      return;
    }
    // Enable buy button
    const btn = document.getElementById('btn-buy');
    if (btn) btn.disabled = false;
  } catch (e) {
    balEl.innerHTML = `<span class="text-rose-400">❌ Erro: ${escapeHTML(e.message)}</span>`;
  }
};

// =============================================================================
// Number purchase (ETP2-02, ETP2-04)
// Calls smsAPI('getNumber'), parses ACCESS_NUMBER:id:phone, displays formatted
// =============================================================================

window.e2Comprar = async function e2Comprar() {
  const countryEl = document.getElementById('sms-country');
  const serviceEl = document.getElementById('sms-service');
  if (!countryEl || !serviceEl) return;

  const country = countryEl.value;
  const service = serviceEl.value;

  toast('⏳ Comprando número...');

  try {
    const txt = await smsAPI('getNumber', `&service=${encodeURIComponent(service)}&country=${encodeURIComponent(country)}`);
    // Response format: "ACCESS_NUMBER:activationId:phoneNumber"
    // Split by ':' — bounds check per T-03-18 mitigation
    const parts = txt.split(':');
    if (parts.length < 3 || parts[0] !== 'ACCESS_NUMBER') {
      // Check for known error responses
      if (txt === 'NO_NUMBERS') {
        toast('❌ Sem números disponíveis para este serviço/país.', '⚠️');
        return;
      }
      if (txt === 'NO_BALANCE') {
        toast('❌ Saldo insuficiente. Recarregue sua conta SMS24h.', '💰');
        return;
      }
      if (txt === 'BAD_KEY') {
        toast('❌ API key inválida. Verifique nas Configurações.', '🔑');
        return;
      }
      toast('❌ Resposta inesperada: ' + escapeHTML(txt), '⚠️');
      return;
    }

    const activationId = parts[1];
    const phoneNumber = parts[2];

    etapa2State.activationId = activationId;
    etapa2State.phone = phoneNumber;

    toast('Número comprado!', '✅');
    go('etapa2'); // Re-render to show step 2 (polling)
  } catch (e) {
    toast('❌ Erro ao comprar: ' + escapeHTML(e.message), '⚠️');
  }
};

// =============================================================================
// Step 1: Balance + Purchase (ETP2-02, ETP2-04)
// Renders balance check button, country/service selects, buy button
// When phone exists: shows formatted phone with copy button + pill "Ativo"
// =============================================================================

function renderStep1SMS() {
  const { phone } = etapa2State;
  const done = !!phone;

  // Common countries and services
  const countries = [
    { value: '22', label: '🇧🇷 Brasil (+55)' },
    { value: '12', label: '🇺🇸 USA (+1)' },
    { value: '6',  label: '🇮🇩 Indonésia (+62)' },
    { value: '43', label: '🇬🇧 Reino Unido (+44)' },
    { value: '21', label: '🇨🇦 Canadá (+1)' }
  ];

  const services = [
    { value: 'fb', label: 'Facebook' },
    { value: 'go', label: 'Google' },
    { value: 'wa', label: 'WhatsApp' },
    { value: 'ig', label: 'Instagram' },
    { value: 'tg', label: 'Telegram' },
    { value: 'tw', label: 'Twitter/X' }
  ];

  let body = `
    <div class="space-y-4">
      <!-- Balance area -->
      <div>
        <button class="btn-3d cyan sm mb-2" onclick="window.e2VerSaldo()">💰 Verificar Saldo</button>
        <div id="sms-balance" class="text-sm"></div>
      </div>`;

  if (done) {
    // Show purchased phone
    const formatted = formatBRPhone(phone);
    body += `
      <div class="glass rounded-xl p-4 mt-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📱</span>
          <div class="flex-1">
            <div class="text-slate-400 text-xs mb-1">Número comprado</div>
            <div class="copy-row">
              <span class="font-mono text-lg text-cyan-300">${escapeHTML(formatted)}</span>
              <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(phone)}','Número copiado!')">📋 Copiar</button>
            </div>
          </div>
          ${pill('Ativo', 'done')}
        </div>
      </div>`;
  } else {
    // Show purchase form
    body += `
      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="text-slate-400 text-xs mb-1 block">País</label>
          <select id="sms-country" class="input w-full">
            ${countries.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-slate-400 text-xs mb-1 block">Serviço</label>
          <select id="sms-service" class="input w-full">
            ${services.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <button id="btn-buy" class="btn-3d purple w-full mt-3" disabled onclick="window.e2Comprar()">
        📱 Comprar Número
      </button>
      <div class="text-slate-500 text-xs mt-1">* Verifique o saldo antes de comprar</div>`;
  }

  body += `</div>`;

  return stepBox(1, '📱', 'Comprar Número SMS24h', done, body, false);
}

// =============================================================================
// Auto-polling (ETP2-03)
// 5-second interval, 20-min timeout, STATUS_OK extraction
// Pitfall 4 compliance: clearInterval on ALL exit paths
// Pattern 6: setInterval Polling with Cleanup — RESEARCH.md lines 437-467
// =============================================================================

window.e2IniciarPolling = function e2IniciarPolling() {
  // Guard: clear previous interval before starting new (Pitfall 4)
  if (etapa2State.timer) {
    clearInterval(etapa2State.timer);
    etapa2State.timer = null;
  }

  const startTime = Date.now();

  etapa2State.timer = setInterval(async () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // Update timer display
    const timerEl = document.getElementById('sms-timer');
    if (timerEl) timerEl.textContent = `(${elapsed}s)`;

    // Timeout: 20 minutes (1200 seconds)
    if (elapsed > 1200) {
      clearInterval(etapa2State.timer);
      etapa2State.timer = null;
      const statusEl = document.getElementById('sms-status');
      if (statusEl) {
        statusEl.innerHTML = '<div class="text-amber-300">⏰ Tempo limite excedido (20 min). Tente comprar outro número.</div>';
      }
      toast('⏰ Tempo limite de espera excedido.', '⚠️');
      return;
    }

    try {
      const txt = await smsAPI('getStatus', `&id=${etapa2State.activationId}`);

      if (txt.startsWith('STATUS_OK:')) {
        // Extract code after colon
        const code = txt.split(':')[1] || '';
        etapa2State.code = code;

        // Stop polling
        clearInterval(etapa2State.timer);
        etapa2State.timer = null;

        toast('📩 Código recebido!');
        go('etapa2'); // Re-render with code displayed
      }
      // STATUS_WAIT_CODE — continue polling (no action needed)
      // STATUS_CANCEL — activation cancelled (handled below)
      if (txt.startsWith('STATUS_CANCEL')) {
        clearInterval(etapa2State.timer);
        etapa2State.timer = null;
        const statusEl = document.getElementById('sms-status');
        if (statusEl) {
          statusEl.innerHTML = '<div class="text-rose-400">❌ Ativação cancelada pelo servidor.</div>';
        }
        go('etapa2');
      }
    } catch (e) {
      // Silently swallow polling errors — network hiccups shouldn't kill polling
      // This is intentional per Pitfall 4 resilience guidance
      console.debug('Polling error (non-fatal):', e.message);
    }
  }, 5000);
};

// =============================================================================
// Cancel purchase (ETP2-03)
// Clears interval, resets state, shows cancel message
// =============================================================================

window.e2Cancelar = function e2Cancelar() {
  if (etapa2State.timer) {
    clearInterval(etapa2State.timer);
    etapa2State.timer = null;
  }
  etapa2State = {
    activationId: null,
    phone: '',
    code: '',
    timer: null
  };
  toast('❌ Compra cancelada');
  go('etapa2'); // Re-render back to purchase step
};

// =============================================================================
// Confirm code (ETP2-03)
// =============================================================================

window.e2Confirmar = function e2Confirmar() {
  toast('✅ Código confirmado!');
  go('etapa2'); // Stays on current view, code is confirmed
};

// =============================================================================
// Step 2: Auto-Polling for Code (ETP2-03, ETP2-04)
// Renders when activationId exists and code is not yet received
// Shows timer, status, cancel button; code display when received
// =============================================================================

function renderStep2Polling() {
  const { activationId, phone, code } = etapa2State;
  const hasCode = !!code;
  const done = hasCode;

  let body = '';

  if (hasCode) {
    // Code received — display it
    body = `
      <div class="space-y-4">
        <div class="glass rounded-xl p-4 text-center">
          <div class="text-slate-400 text-xs mb-2">Código de ativação recebido para</div>
          <div class="font-mono text-lg text-cyan-300 mb-1">${escapeHTML(formatBRPhone(phone))}</div>
          <div class="text-3xl font-mono font-bold text-green-400 my-4 tracking-widest">${escapeHTML(code)}</div>
          <div class="flex gap-2 justify-center">
            <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(code)}','Código copiado!')">📋 Copiar Código</button>
            <button class="btn-3d green sm" onclick="window.e2Confirmar()">✅ Confirmar</button>
          </div>
        </div>
      </div>`;
  } else {
    // Polling in progress
    body = `
      <div class="space-y-4">
        <div class="glass rounded-xl p-4 text-center">
          <div class="text-slate-400 text-xs mb-2">Aguardando SMS para</div>
          <div class="font-mono text-lg text-cyan-300 mb-3">${escapeHTML(formatBRPhone(phone))}</div>
          <div class="flex items-center justify-center gap-3 mb-3">
            <span class="animate-pulse text-2xl">📩</span>
            <span class="text-amber-300 font-bold">Aguardando código</span>
            <span id="sms-timer" class="text-slate-400 text-sm font-mono">(0s)</span>
          </div>
          <div id="sms-status" class="text-slate-400 text-xs mb-3">
            Verificando a cada 5 segundos... (máx. 20 min)
          </div>
          <button class="btn-3d danger sm" onclick="window.e2Cancelar()">❌ Cancelar</button>
        </div>
      </div>`;
  }

  return stepBox(2, '📩', 'Receber Código SMS', done, body, false);
}

// =============================================================================
// Re-deploy existing site (ETP2-05)
// Skips create-project (Step 1), runs Steps 2-5 of Cloudflare deploy pipeline
// Matches ETP1-05 deploy pipeline — RESEARCH.md lines 754-833
// =============================================================================

window.e2RePublicar = async function e2RePublicar() {
  const select = document.getElementById('redeploy-site');
  const logEl = document.getElementById('redeploy-log');
  const btnEl = document.getElementById('btn-redeploy');
  if (!select || !logEl) return;

  const siteIndex = parseInt(select.value, 10);
  const db = getDB();
  const site = db.sites[siteIndex];
  if (!site || !site.dominio) {
    toast('❌ Site não encontrado.', '⚠️');
    return;
  }

  const s = getSettings();
  if (!s.cf_token || !s.cf_account) {
    logEl.innerHTML = '<div class="text-amber-300">⚠️ Configure token Cloudflare nas Configurações primeiro.</div>';
    return;
  }

  const projectName = site.dominio;
  const newPhone = etapa2State.phone;

  // Disable button during deploy
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = '⏳ Republicando...';
  }

  logEl.innerHTML = '';

  try {
    const apiHeaders = {
      'Authorization': `Bearer ${s.cf_token}`,
      'Content-Type': 'application/json'
    };
    const base = `https://api.cloudflare.com/client/v4/accounts/${s.cf_account}/pages`;

    // Re-build HTML with new phone number
    // Uses a lightweight inline template that mirrors etapa1's buildSiteHTML
    logEl.innerHTML += '<div class="text-slate-400 text-xs">🔄 Regenerando HTML com novo número...</div>';

    const empresa = db.empresas.find(e => e.cnpj === site.cnpj) || {};
    const html = _buildSiteHTMLForRedeploy({
      ...empresa,
      ...site,
      telefoneNosso: newPhone,
      dominio: site.dominio
    });

    // Step 2: Get JWT upload token
    logEl.innerHTML += '<div class="text-slate-400 text-xs">🔑 Obtendo token de upload...</div>';
    const r2 = await fetch(`${base}/projects/${encodeURIComponent(projectName)}/upload-token`, { headers: apiHeaders });
    const d2 = await r2.json();
    if (!d2.success) throw new Error('JWT: ' + JSON.stringify(d2.errors || d2));
    const jwt = d2.result.jwt;

    // Step 3: BLAKE3 hash (local computation)
    logEl.innerHTML += '<div class="text-slate-400 text-xs">🔐 Calculando hash...</div>';
    const { blake3 } = await import('https://esm.sh/@noble/hashes@2.2.0/blake3');
    const b64 = btoa(unescape(encodeURIComponent(html)));
    const toHash = new TextEncoder().encode(b64 + 'html');
    const hashBytes = blake3(toHash);
    const hex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const fileHash = hex.slice(0, 32);

    // Step 4: Upload asset (uses JWT auth, NOT API token)
    logEl.innerHTML += '<div class="text-slate-400 text-xs">📤 Enviando arquivo...</div>';
    const uploadHeaders = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };
    const r4 = await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload', {
      method: 'POST',
      headers: uploadHeaders,
      body: JSON.stringify([{
        key: fileHash,
        value: b64,
        base64: true,
        metadata: { contentType: 'text/html' }
      }])
    });
    const upRes = await r4.json();
    if (!upRes.success) throw new Error('UPLOAD: ' + JSON.stringify(upRes.errors || upRes));

    // Step 5: Create deployment (uses API token auth, FormData)
    logEl.innerHTML += '<div class="text-slate-400 text-xs">🚀 Criando deploy...</div>';
    const fd = new FormData();
    fd.append('manifest', JSON.stringify({ '/index.html': fileHash }));
    const deployHeaders = { 'Authorization': `Bearer ${s.cf_token}` };
    const r5 = await fetch(`${base}/projects/${encodeURIComponent(projectName)}/deployments`, {
      method: 'POST',
      headers: deployHeaders,
      body: fd
    });
    const depJson = await r5.json();
    if (!depJson.success) throw new Error('DEPLOY: ' + JSON.stringify(depJson.errors || depJson));

    // Success
    const url = depJson.result.url || `https://${projectName}.pages.dev`;

    // Update site in DB
    site.url = url;
    site.deploymentId = depJson.result.id;
    site.status = 'deploy';
    site.atualizado = Date.now();
    site.telefoneNosso = newPhone;
    saveDB(db);

    logEl.innerHTML = `<div class="text-green-400 text-sm mt-2">✅ Site republicado!</div>
      <div class="copy-row mt-1">
        <a href="${escapeHTML(url)}" target="_blank" class="text-cyan-400 text-xs underline">${escapeHTML(url)}</a>
        <button class="btn-3d cyan sm" onclick="copyText('${escapeHTML(url)}','URL copiada!')">📋 Copiar</button>
      </div>`;

    toast('🔄 Site republicado com novo número!', '🚀');

    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = '🔄 Republicar com novo número';
    }

    setTimeout(() => go('etapa2'), 1200);
  } catch (e) {
    logEl.innerHTML += `<div class="text-rose-300 text-xs mt-1">❌ ${escapeHTML(e.message)}</div>
      <div class="text-slate-500 text-xs mt-1">💡 Dica: verifique se o token tem permissão Pages:Edit</div>`;
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = '🔄 Tentar novamente';
    }
  }
};

// =============================================================================
// Lightweight HTML builder for re-deploy (ETP2-05)
// Mirrors etapa1's buildSiteHTML but works inline for Etapa 2
// Generates a simple landing page with company data + new phone number
// =============================================================================

function _buildSiteHTMLForRedeploy(dados) {
  const {
    razao_social = 'Empresa',
    nome_fantasia = razao_social,
    descricao_situacao_cadastral = '',
    cnae_fiscal_descricao = '',
    telefoneNosso = '',
    dominio = '',
    logradouro = '', numero = '', complemento = '', bairro = '',
    municipio = '', uf = '', cep = '',
    capital_social = '',
    data_inicio_atividade = ''
  } = dados;

  const fantasia = nome_fantasia || razao_social;
  const endereco = [logradouro, numero, complemento, bairro, `${municipio} - ${uf}`, cep]
    .filter(Boolean).join(', ');

  const phoneFormatted = telefoneNosso ? formatBRPhone(telefoneNosso) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(fantasia)} — Site Oficial</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height:1.6; }
    .hero { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 80px 20px; text-align:center; }
    .hero h1 { font-size: 2.5rem; color: #38bdf8; margin-bottom: 10px; }
    .hero p { color: #94a3b8; max-width: 600px; margin: 0 auto; }
    .section { max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .card { background: #1e293b; border-radius: 16px; padding: 30px; margin-bottom: 20px; }
    .card h2 { color: #38bdf8; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { }
    .info-item .label { color: #64748b; font-size: 0.85rem; }
    .info-item .value { font-size: 1rem; }
    .cta { background: #38bdf8; color: #0f172a; padding: 15px 30px; border-radius: 8px; 
            text-decoration:none; font-weight: bold; display: inline-block; margin-top: 15px; }
    .contact { text-align: center; padding: 60px 20px; }
    .contact h2 { color: #38bdf8; margin-bottom: 10px; }
    .phone { font-size: 1.8rem; color: #38bdf8; font-weight: bold; }
    footer { text-align: center; padding: 30px; color: #475569; font-size: 0.85rem; }
    @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${escapeHTML(fantasia)}</h1>
    <p>${escapeHTML(descricao_situacao_cadastral || cnae_fiscal_descricao || 'Empresa comprometida com excelência e qualidade.')}</p>
  </section>

  <section class="section">
    <div class="card">
      <h2>📋 Informações da Empresa</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Razão Social</div>
          <div class="value">${escapeHTML(razao_social)}</div>
        </div>
        <div class="info-item">
          <div class="label">Atividade</div>
          <div class="value">${escapeHTML(cnae_fiscal_descricao || '—')}</div>
        </div>
        <div class="info-item">
          <div class="label">Capital Social</div>
          <div class="value">${escapeHTML(fmtMoney(capital_social))}</div>
        </div>
        <div class="info-item">
          <div class="label">Início</div>
          <div class="value">${escapeHTML(data_inicio_atividade || '—')}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📍 Endereço</h2>
      <p>${escapeHTML(endereco || 'Endereço não informado')}</p>
    </div>
  </section>

  <section class="contact">
    <h2>📞 Entre em Contato</h2>
    ${phoneFormatted ? `<p class="phone">${escapeHTML(phoneFormatted)}</p>` : '<p class="phone">Telefone não informado</p>'}
    <p style="color:#94a3b8; margin-top:10px;">Estamos prontos para atender você!</p>
  </section>

  <footer>
    <p>${escapeHTML(fantasia)} — ${escapeHTML(dominio)}.pages.dev</p>
    <p style="margin-top:5px;">© ${new Date().getFullYear()} Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;
}

// =============================================================================
// Step 3: Re-deploy Site (ETP2-05)
// Renders when phone exists AND code is confirmed
// Site selector dropdown, re-deploy button, deploy log area
// =============================================================================

function renderStep3ReDeploy() {
  const { phone, code } = etapa2State;
  const done = false; // Step 3 is never "done" — can be repeated

  const db = getDB();
  const deployedSites = (db.sites || []).filter(s => s.status === 'deploy');

  let body = '';

  if (deployedSites.length === 0) {
    body = `
      <div class="text-slate-400 text-sm">
        <p>Nenhum site publicado encontrado.</p>
        <p class="mt-2">Publique um site na <button class="btn-3d cyan sm" onclick="go('etapa1')">Etapa 1</button> primeiro.</p>
      </div>`;
  } else {
    body = `
      <div class="space-y-4">
        <div>
          <label class="text-slate-400 text-xs mb-1 block">Selecione o site para republicar</label>
          <select id="redeploy-site" class="input w-full">
            ${deployedSites.map((s, i) =>
              `<option value="${i}">${escapeHTML(s.fantasia || s.dominio)} — ${escapeHTML(s.dominio)}.pages.dev</option>`
            ).join('')}
          </select>
        </div>
        <button id="btn-redeploy" class="btn-3d purple w-full" onclick="window.e2RePublicar()">
          🔄 Republicar com novo número
        </button>
        <div class="text-slate-500 text-xs">
          O HTML será regenerado com o novo número de telefone (<span class="text-cyan-400 font-mono">${escapeHTML(formatBRPhone(phone))}</span>).
        </div>
        <div id="redeploy-log" class="text-xs space-y-1 mt-2"></div>
      </div>`;
  }

  return stepBox(3, '🚀', 'Republicar Site', done, body, false);
}

// =============================================================================
// Main VIEWS.etapa2 render function
// Renders header card, balance, and appropriate steps based on state
// =============================================================================

function renderEtapa2() {
  const { activationId, phone, code } = etapa2State;
  const hasCode = !!code;
  const hasPhone = !!phone;

  let stepsHTML = '';

  // Step 1: Always shown (purchase)
  stepsHTML += renderStep1SMS();

  // Step 2: Show when number purchased (polling or code display)
  if (hasPhone) {
    stepsHTML += renderStep2Polling();
  }

  // Step 3: Show when code confirmed (re-deploy)
  if (hasPhone && hasCode) {
    stepsHTML += renderStep3ReDeploy();
  }

  return `<div class="space-y-6">
    <!-- Header card -->
    <div class="glass rounded-2xl p-6 text-center">
      <div class="icon-cube cyan" style="width:80px;height:80px;font-size:40px;margin:0 auto">📱</div>
      <h2 class="font-display text-2xl mt-4">Etapa 2 — Comprar Número</h2>
      <p class="text-slate-400 mt-2">SMS24h integrado — compre números virtuais para verificação</p>
    </div>

    ${stepsHTML}
  </div>`;
}

// =============================================================================
// Init function — registers VIEWS.etapa2 and sets up post-render hook
// Called from main.js during app initialization
// =============================================================================

export function initEtapa2() {
  VIEWS.etapa2 = function etapa2View() {
    return renderEtapa2();
  };

  // Post-render hook: auto-start polling when step 2 is shown
  window.after_etapa2 = () => {
    if (etapa2State.activationId && !etapa2State.timer && !etapa2State.code) {
      // Use setTimeout to let the DOM mount first before polling starts
      setTimeout(() => window.e2IniciarPolling(), 100);
    }
  };
}
