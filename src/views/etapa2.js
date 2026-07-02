import { getDB, saveDB, getSettings } from '../stores/data.js';
import { toast } from '../widgets/toast.js';
import { onlyDigits, escapeHTML, formatBRPhone } from '../utils/string.js';

let _initialized = false;
export function initEtapa2() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  window.etapa2State = { activationId: null, phone: '', code: '', timer: null };

  R.etapa2 = () => {
    const s = getSettings();
    const ok = !!s.sms_key;
    const db = getDB();
    const sitesAtivos = db.sites.filter(x => x.url);

    return `
    <div class="grad-card rounded-3xl p-6 sm:p-8 mb-6">
      <div class="flex items-start gap-4 flex-wrap">
        <div class="icon-cube purple floaty">📱</div>
        <div class="flex-1 min-w-0">
          <div class="pill doing mb-2">SMS24H.ORG</div>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold">Compre um número virtual</h2>
          <p class="text-slate-300">Para receber o SMS de verificação do Facebook. Custos são debitados do seu saldo SMS24h.</p>
        </div>
        <button class="btn-3d ghost sm" onclick="smsVerSaldo()">💰 Ver saldo</button>
      </div>
    </div>

    ${!ok ? `<div class="glass rounded-2xl p-5 mb-4" style="border-color:rgba(245,158,11,.4)">
      ⚠️ <b>Configure sua API key SMS24h</b> nas <button class="text-cyan-300 underline" onclick="go('config')">Configurações</button> antes de continuar.
    </div>` : ''}

    <div class="glass step-card mb-4 ${!ok ? 'disabled' : ''}">
      <div class="step-num">1</div>
      <div class="flex items-start gap-3 mb-3 flex-wrap">
        <div class="text-2xl">🛒</div>
        <div class="flex-1"><div class="font-display font-bold text-lg">Comprar número para o Facebook</div></div>
      </div>
      <div class="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <select id="sms-service" class="input">
          <option value="fb">Facebook</option>
          <option value="ig">Instagram</option>
          <option value="wa">WhatsApp</option>
          <option value="go">Google</option>
          <option value="tg">Telegram</option>
          <option value="other">Outro</option>
        </select>
        <select id="sms-country" class="input">
          <option value="73">🇧🇷 Brasil (73)</option>
          <option value="0">🇷🇺 Rússia (0)</option>
          <option value="187">🇺🇸 EUA (187)</option>
          <option value="1">🇺🇦 Ucrânia (1)</option>
          <option value="22">🇮🇳 Índia (22)</option>
        </select>
        <button class="btn-3d success" onclick="smsComprar()">🛒 Comprar agora</button>
      </div>
      <div id="sms-buy-log" class="mt-3 text-sm text-slate-300"></div>
    </div>

    <div class="glass step-card mb-4 ${!window.etapa2State.phone ? 'disabled' : ''}">
      <div class="step-num">2</div>
      <div class="flex items-start gap-3 mb-3 flex-wrap">
        <div class="text-2xl">📞</div>
        <div class="flex-1"><div class="font-display font-bold text-lg">Número comprado</div></div>
      </div>
      ${window.etapa2State.phone ? `
        <div class="copy-row mb-2">
          <div class="key">Número (BR)</div>
          <div class="val text-cyan-300 text-lg font-mono">${formatBRPhone(window.etapa2State.phone)}</div>
          <button class="btn-3d cyan sm" onclick="copyText('${formatBRPhone(window.etapa2State.phone)}','Número copiado!')">📋 Copiar</button>
        </div>
        <div class="copy-row mb-2">
          <div class="key">Sem formatação</div>
          <div class="val font-mono">${window.etapa2State.phone}</div>
          <button class="btn-3d ghost sm" onclick="copyText('${window.etapa2State.phone}','Copiado')">📋</button>
        </div>
        <div class="text-xs text-slate-400 mt-2">⏱️ Você tem ~20min para receber o SMS. Use esse número no cadastro do Facebook agora.</div>
      ` : `<div class="text-slate-400">Compre primeiro um número.</div>`}
    </div>

    <div class="glass step-card mb-4 ${!window.etapa2State.phone ? 'disabled' : ''}">
      <div class="step-num">3</div>
      <div class="flex items-start gap-3 mb-3 flex-wrap">
        <div class="text-2xl">💬</div>
        <div class="flex-1"><div class="font-display font-bold text-lg">Receber SMS</div></div>
        ${window.etapa2State.phone && !window.etapa2State.code ? `<button class="btn-3d ghost sm" onclick="smsCancelar()">🚫 Cancelar</button>` : ''}
      </div>
      <div id="sms-code-box">
        ${window.etapa2State.code ? `<div class="copy-row neon" style="border-color:rgba(16,185,129,.4)">
          <div class="key">CÓDIGO SMS</div>
          <div class="val text-green-300 text-2xl font-mono font-bold">${window.etapa2State.code}</div>
          <button class="btn-3d success sm" onclick="copyText('${window.etapa2State.code}','Código copiado!')">📋 Copiar</button>
        </div>
        <button class="btn-3d cyan mt-3" onclick="smsConfirmar()">✅ Confirmar recebimento (fechar ativação)</button>` :
        window.etapa2State.phone ? `<div class="flex items-center gap-2 text-slate-300"><span class="spinner"></span> Aguardando o SMS chegar... <span id="sms-timer" class="text-xs text-slate-400"></span></div>` :
        '<div class="text-slate-400">Aguardando compra do número.</div>'}
      </div>
    </div>

    <div class="glass step-card mb-4 ${!window.etapa2State.phone ? 'disabled' : ''}">
      <div class="step-num">4</div>
      <div class="flex items-start gap-3 mb-3 flex-wrap">
        <div class="text-2xl">🔄</div>
        <div class="flex-1"><div class="font-display font-bold text-lg">Atualizar site com este número</div></div>
      </div>
      <p class="text-sm text-slate-300 mb-3">Escolha o site no ar onde quer adicionar o número (vira <code class="text-cyan-300">empresa /nosso</code>):</p>
      <div class="grid sm:grid-cols-[1fr_auto] gap-2">
        <select id="sms-site" class="input">
          ${sitesAtivos.length ? sitesAtivos.map(s => `<option value="${s.cnpj}-${s.dominio}">${s.fantasia || s.razao} — ${s.dominio}</option>`).join('') : '<option value="">Nenhum site no ar ainda</option>'}
        </select>
        <button class="btn-3d purple" onclick="smsAtualizarSite()" ${!window.etapa2State.phone || !sitesAtivos.length ? 'disabled' : ''}>🔄 Atualizar e re-publicar</button>
      </div>
      <div id="sms-update-log" class="mt-3"></div>
    </div>
    `;
  };

  window.smsAPI = smsAPI;
  window.smsVerSaldo = smsVerSaldo;
  window.smsComprar = smsComprar;
  window.smsCancelar = smsCancelar;
  window.smsConfirmar = smsConfirmar;
  window.smsAtualizarSite = smsAtualizarSite;
}

async function smsAPI(action, extra = '') {
  const k = getSettings().sms_key;
  if (!k) throw new Error('Sem API key SMS24h. Configure primeiro.');
  const url = `https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(k)}&action=${encodeURIComponent(action)}${extra}`;
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}

async function smsVerSaldo() {
  try {
    const t = await smsAPI('getBalance');
    toast('Saldo: ' + t, '💰');
  } catch (e) {
    toast('Erro: ' + e.message + ' (Pode ser CORS — use proxy)', '❌');
  }
}

async function smsComprar() {
  const service = document.getElementById('sms-service').value;
  const country = document.getElementById('sms-country').value;
  const log = document.getElementById('sms-buy-log');
  if (!log) return;
  log.innerHTML = '<span class="spinner"></span> Comprando número...';
  try {
    const t = await smsAPI('getNumber', `&service=${service}&country=${country}`);
    if (t.startsWith('ACCESS_NUMBER:')) {
      const [, id, phone] = t.split(':');
      window.etapa2State.activationId = id;
      window.etapa2State.phone = phone;
      window.etapa2State.code = '';
      log.innerHTML = '<span class="text-green-300">✅ Número adquirido</span>';
      window.go('etapa2');
      iniciarPollingSMS();
    } else {
      log.innerHTML = '<span class="text-rose-300">❌ Resposta: ' + escapeHTML(t) + '</span>';
    }
  } catch (e) {
    log.innerHTML = '<span class="text-rose-300">❌ ' + e.message + '</span><div class="text-xs text-slate-400 mt-1">Se for CORS, configure proxy ou peça pra mim adicionar Worker.</div>';
  }
}

function iniciarPollingSMS() {
  if (window.etapa2State.timer) clearInterval(window.etapa2State.timer);
  const start = Date.now();
  window.etapa2State.timer = setInterval(async () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const timer = document.getElementById('sms-timer');
    if (timer) timer.textContent = `(${elapsed}s)`;
    if (elapsed > 1200) { clearInterval(window.etapa2State.timer); return; }
    try {
      const t = await smsAPI('getStatus', `&id=${window.etapa2State.activationId}`);
      if (t.startsWith('STATUS_OK:')) {
        window.etapa2State.code = t.split(':')[1];
        clearInterval(window.etapa2State.timer);
        window.go('etapa2');
      }
    } catch (e) { /* ignore */ }
  }, 5000);
}

async function smsCancelar() {
  if (!confirm('Cancelar este número?')) return;
  try {
    await smsAPI('setStatus', `&status=8&id=${window.etapa2State.activationId}`);
    if (window.etapa2State.timer) clearInterval(window.etapa2State.timer);
    window.etapa2State = { activationId: null, phone: '', code: '', timer: null };
    toast('Cancelado', '🚫');
    window.go('etapa2');
  } catch (e) { toast('Erro: ' + e.message, '❌'); }
}

async function smsConfirmar() {
  try {
    await smsAPI('setStatus', `&status=6&id=${window.etapa2State.activationId}`);
    toast('Ativação finalizada', '✅');
  } catch (e) { /* ignore */ }
}

async function smsAtualizarSite() {
  const sel = document.getElementById('sms-site').value;
  if (!sel) { toast('Escolha um site', '⚠️'); return; }
  const [cnpj, dominio] = sel.split('-');
  const log = document.getElementById('sms-update-log');
  if (!log) return;
  log.innerHTML = '<span class="spinner"></span> Recriando site com o número novo...';

  const db = getDB();
  const site = db.sites.find(s => onlyDigits(s.cnpj) === onlyDigits(cnpj) && s.dominio === dominio);
  if (!site) { log.innerHTML = '<span class="text-rose-300">Site não encontrado</span>'; return; }

  const novoTelFormatado = formatBRPhone(window.etapa2State.phone);
  site.telefoneNosso = novoTelFormatado;
  const dadosAtt = { ...site.dadosSnapshot, telefone: site.dadosSnapshot.telefone, telefoneNosso: novoTelFormatado };

  const { buildSiteHTML } = await import('./build-site-html.js');
  let html = buildSiteHTML(dadosAtt);
  if (site.metatag && !site.metatag.includes('<!-- meta tag não fornecida')) {
    html = html.replace('<head>', '<head>\n' + site.metatag);
  }

  const settings = getSettings();
  if (!settings.cf_token || !settings.cf_account) {
    log.innerHTML = '<span class="text-rose-300">⚠️ Configure Cloudflare nas Configurações primeiro</span>';
    return;
  }
  const projectName = site.dominio.replace('.pages.dev', '');
  try {
    log.innerHTML += '<div class="text-sm text-slate-300">Pegando upload-token...</div>';
    const r2 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.cf_account}/pages/projects/${projectName}/upload-token`, {
      method: 'GET', headers: { 'Authorization': `Bearer ${settings.cf_token}` }
    });
    const d2 = await r2.json();
    const jwt = d2.result?.jwt;
    if (!jwt) throw new Error('JWT vazio: ' + JSON.stringify(d2));

    log.innerHTML += '<div class="text-sm text-slate-300">Calculando hash...</div>';
    const { blake3 } = await import('https://esm.sh/@noble/hashes/blake3');
    const b64 = btoa(unescape(encodeURIComponent(html)));
    const hashBytes = blake3(new TextEncoder().encode(b64 + 'html'));
    const fileHash = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);

    await fetch('https://api.cloudflare.com/client/v4/pages/assets/check-missing', {
      method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes: [fileHash] })
    });
    log.innerHTML += '<div class="text-sm text-slate-300">Subindo arquivo...</div>';
    await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload', {
      method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key: fileHash, value: b64, base64: true, metadata: { contentType: 'text/html' } }])
    });

    log.innerHTML += '<div class="text-sm text-slate-300">Criando novo deployment...</div>';
    const fd = new FormData();
    fd.append('manifest', JSON.stringify({ '/index.html': fileHash }));
    const dep = await fetch(`https://api.cloudflare.com/client/v4/accounts/${settings.cf_account}/pages/projects/${projectName}/deployments`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${settings.cf_token}` }, body: fd
    });
    const depJson = await dep.json();
    if (!dep.ok) throw new Error(JSON.stringify(depJson));
    const url = depJson.result?.url || site.url;
    site.url = url;
    site.deploymentId = depJson.result?.id;
    site.status = 'meta-tag';
    site.atualizado = Date.now();
    site.dadosSnapshot = dadosAtt;
    saveDB(db);

    log.innerHTML = `<div class="glass rounded-xl p-3 neon" style="border-color:rgba(16,185,129,.4)">
      ✅ <b>Site atualizado!</b> Acesse: <a class="text-cyan-300 underline" href="${url}" target="_blank">${url}</a>
    </div>`;
    toast('Site re-publicado com número adicionado', '🔄');
  } catch (err) {
    log.innerHTML = '<span class="text-rose-300">❌ ' + err.message + '</span>';
  }
}
