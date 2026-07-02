import { getSettings, saveSettings } from '../stores/data.js';
import { toast } from '../widgets/toast.js';
import { escapeHTML } from '../utils/string.js';

let _initialized = false;
export function initConfig() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  R.config = () => {
    const s = getSettings();
    const accountInfo = s.cf_account
      ? `<div class="glass rounded-xl p-3 mb-3 flex items-center gap-2"><span class="pill done">✓ Conta detectada</span> <span class="text-sm">${s.cf_account_name || s.cf_account}</span> <button class="btn-3d ghost sm ml-auto" onclick="trocarConta()">🔄 Trocar</button></div>`
      : '';
    return `
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="glass rounded-3xl p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="icon-cube cyan">☁️</div>
          <div><div class="font-display text-xl font-bold">Cloudflare API</div><div class="text-sm text-slate-400">Cola o token e o Account ID</div></div>
        </div>
        <label class="text-xs text-slate-400">API Token (Cloudflare Pages:Edit)</label>
        <input id="cfg_cf_token" class="input mt-1 mb-3" type="password" placeholder="cfut_... ou cfk_..." value="${s.cf_token || ''}"/>
        <label class="text-xs text-slate-400 mt-2">Account ID</label>
        <input id="cfg_cf_account_manual" class="input mt-1 mb-3" placeholder="ex: a1b2c3d4e5f6..." value="${s.cf_account || ''}"/>
        ${accountInfo}
        <div class="flex gap-2 flex-wrap">
          <button class="btn-3d success" onclick="salvarTokenCF()">🔍 Auto-descobrir conta</button>
          <button class="btn-3d cyan" onclick="salvarConfigCF()">💾 Salvar Cloudflare</button>
          <button class="btn-3d green" onclick="testarCloudflare()" ${!s.cf_account ? 'disabled' : ''}>🧪 Testar Pages</button>
          <a class="btn-3d ghost" href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">🔑 Criar token</a>
        </div>
        <div id="cf-save-log" class="mt-3"></div>
        <details class="mt-3"><summary class="text-sm text-cyan-300 cursor-pointer">Como conseguir o Account ID?</summary>
        <p class="text-sm text-slate-300 mt-2">Entre em <a class="text-cyan-300 underline" target="_blank" href="https://dash.cloudflare.com">dash.cloudflare.com</a> → canto inferior direito, seção "API" → Account ID. Ou veja em <a class="text-cyan-300 underline" target="_blank" href="https://dash.cloudflare.com/profile/api-tokens">Profile → API Tokens</a>.</p></details>
        <details class="mt-3"><summary class="text-sm text-cyan-300 cursor-pointer">Como criar um token?</summary>
        <p class="text-sm text-slate-300 mt-2">Vai em <a class="text-cyan-300 underline" target="_blank" href="https://dash.cloudflare.com/profile/api-tokens">Profile → API Tokens</a> → Create Token → Custom Token. Permissão: <code>Account → Cloudflare Pages → Edit</code>.</p></details>
      </div>

      <div class="glass rounded-3xl p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="icon-cube purple">📱</div>
          <div><div class="font-display text-xl font-bold">SMS24h.org API</div><div class="text-sm text-slate-400">Para comprar números virtuais</div></div>
        </div>
        <label class="text-xs text-slate-400">API Key</label>
        <input id="cfg_sms_key" class="input mt-1 mb-3" type="password" placeholder="cole sua API key" value="${s.sms_key || ''}"/>
        <div class="flex gap-2 flex-wrap">
          <button class="btn-3d success" onclick="salvarConfig()">💾 Salvar</button>
          <button class="btn-3d purple" onclick="testarSMS()">🧪 Testar (saldo)</button>
          <a class="btn-3d ghost" href="https://sms24h.org" target="_blank">🌐 Abrir SMS24h</a>
        </div>
        <details class="mt-3"><summary class="text-sm text-cyan-300 cursor-pointer">Como pegar?</summary>
        <p class="text-sm text-slate-300 mt-2">Entre em <a class="text-cyan-300 underline" target="_blank" href="https://sms24h.org">sms24h.org</a> → Perfil → API. Lá tem a sua API Key pessoal.</p></details>
      </div>

      <div class="glass rounded-3xl p-6 lg:col-span-2">
        <div class="flex items-start gap-3 mb-4">
          <div class="icon-cube amber">🛟</div>
          <div><div class="font-display text-xl font-bold">Backup / Restaurar</div><div class="text-sm text-slate-400">Exporte seus dados como arquivo</div></div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn-3d cyan" onclick="exportBackup()">📤 Exportar backup</button>
          <button class="btn-3d ghost" onclick="document.getElementById('imp-file').click()">📥 Importar backup</button>
          <input type="file" id="imp-file" accept="application/json" class="hidden" onchange="if(this.files[0])importBackup(this.files[0])">
        </div>
      </div>
    </div>`;
  };

  window.salvarConfig = salvarConfig;
  window.salvarTokenCF = salvarTokenCF;
  window.salvarConfigCF = salvarConfigCF;
  window.escolherConta = escolherConta;
  window.trocarConta = trocarConta;
  window.salvarAccountManual = salvarAccountManual;
  window.testarCloudflare = testarCloudflare;
  window.testarSMS = testarSMS;
  window.exportBackup = exportBackup;
  window.importBackup = importBackup;
}

function salvarConfig() {
  const s = getSettings();
  const get = id => document.getElementById(id)?.value?.trim();
  if (document.getElementById('cfg_sms_key')) s.sms_key = get('cfg_sms_key');
  saveSettings(s);
  toast('Configurações salvas', '💾');
}

async function salvarTokenCF() {
  const token = document.getElementById('cfg_cf_token')?.value?.trim();
  const log = document.getElementById('cf-save-log');
  if (!token) { toast('Cole o token primeiro', '⚠️'); return; }
  log.innerHTML = '<div class="text-sm text-slate-300"><span class="spinner"></span> Salvando e descobrindo sua conta...</div>';
  const s = getSettings();
  s.cf_token = token;
  saveSettings(s);
  try {
    const r = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const d = await r.json();
    if (!d.success) {
      const msg = d.errors?.[0]?.message || 'Erro desconhecido';
      log.innerHTML = `<div class="glass rounded-xl p-3 text-sm" style="border-color:rgba(245,158,11,.4)">
        ⚠️ Token salvo, mas não consegui listar suas contas: <b>${escapeHTML(msg)}</b><br>
        <span class="text-xs text-slate-400">Adicione o Account ID manualmente abaixo (clique em "Token sem permissão...").</span>
      </div>`;
      return;
    }
    const contas = d.result || [];
    if (contas.length === 0) {
      log.innerHTML = '<div class="text-rose-300">❌ Nenhuma conta encontrada nesse token.</div>';
      return;
    }
    if (contas.length === 1) {
      s.cf_account = contas[0].id;
      s.cf_account_name = contas[0].name;
      saveSettings(s);
      const manualInput = document.getElementById('cfg_cf_account_manual');
      if (manualInput) manualInput.value = contas[0].id;
      log.innerHTML = `<div class="glass rounded-xl p-3 text-sm neon" style="border-color:rgba(16,185,129,.4)">
        ✅ Conta detectada e salva: <b>${escapeHTML(contas[0].name)}</b><br>
        <span class="text-xs text-slate-400 font-mono">${contas[0].id}</span>
      </div>`;
      toast('Tudo configurado!', '✅');
      setTimeout(() => window.go('config'), 1500);
    } else {
      log.innerHTML = `<div class="glass rounded-xl p-3 text-sm">
        Você tem ${contas.length} contas. Escolha qual usar:
        ${contas.map(c => `<div class="flex items-center justify-between gap-2 mt-2 p-2 rounded-lg" style="background:rgba(255,255,255,.03);">
          <div><b>${escapeHTML(c.name)}</b><div class="text-xs text-slate-400 font-mono">${c.id}</div></div>
          <button class="btn-3d cyan sm" onclick="escolherConta('${c.id}','${escapeHTML(c.name).replace(/'/g, "\\'")}')">Usar essa</button>
        </div>`).join('')}
      </div>`;
    }
  } catch (e) {
    log.innerHTML = `<div class="text-rose-300">❌ Erro: ${escapeHTML(e.message)}</div>`;
  }
}

function escolherConta(id, nome) {
  const s = getSettings();
  s.cf_account = id;
  s.cf_account_name = nome;
  saveSettings(s);
  toast('Conta selecionada: ' + nome, '✅');
  window.go('config');
}

function trocarConta() {
  const s = getSettings();
  delete s.cf_account;
  delete s.cf_account_name;
  saveSettings(s);
  window.go('config');
}

function salvarAccountManual() {
  const id = document.getElementById('cfg_cf_account_manual')?.value?.trim();
  if (!id) { toast('Cole o Account ID', '⚠️'); return; }
  const s = getSettings();
  s.cf_account = id;
  s.cf_account_name = 'Conta ' + id.slice(0, 8);
  saveSettings(s);
  toast('Account ID salvo', '💾');
  window.go('config');
}

function salvarConfigCF() {
  const token = document.getElementById('cfg_cf_token')?.value?.trim();
  const account = document.getElementById('cfg_cf_account_manual')?.value?.trim();
  if (!token && !account) { toast('Preencha ao menos um campo', '⚠️'); return; }
  const s = getSettings();
  if (token) s.cf_token = token;
  if (account) {
    s.cf_account = account;
    s.cf_account_name = s.cf_account_name || 'Conta ' + account.slice(0, 8);
  }
  saveSettings(s);
  toast('Config Cloudflare salva', '☁️');
  window.go('config');
}

async function testarCloudflare() {
  const s = getSettings();
  if (!s.cf_token) { toast('Salve o token primeiro', '⚠️'); return; }
  if (!s.cf_account) { toast('Account ID não detectado. Salve o token primeiro.', '⚠️'); return; }
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${s.cf_account}/pages/projects`, {
      headers: { 'Authorization': `Bearer ${s.cf_token}` }
    });
    const d = await r.json();
    if (d.success) { toast(`✅ OK! Você tem ${d.result_info?.total_count || d.result.length} projeto(s) Pages`, '☁️'); }
    else { toast('❌ ' + (d.errors?.[0]?.message || 'Erro'), '❌'); }
  } catch (e) { toast('Erro: ' + e.message, '❌'); }
}

async function testarSMS() {
  salvarConfig();
  const k = getSettings().sms_key;
  if (!k) { toast('Configure a API key primeiro', '⚠️'); return; }
  try {
    const r = await fetch(`https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(k)}&action=getBalance`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const t = await r.text();
    toast('Saldo: ' + t, '💰');
  } catch (e) { toast('Erro: ' + e.message, '❌'); }
}

function exportBackup() {
  const data = { db: getDB(), settings: getSettings(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'laboratorio-bms-backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup baixado', '📤');
}

async function importBackup(file) {
  try {
    const txt = await file.text();
    const data = JSON.parse(txt);
    if (data.db) { const { saveDB } = await import('../stores/data.js'); saveDB(data.db); }
    if (data.settings) saveSettings(data.settings);
    toast('Backup restaurado', '📥');
    window.go('dashboard');
  } catch (e) { toast('Arquivo inválido', '❌'); }
}
