// src/views/config.js
// Full implementation: Phase 03 Plan 01 Task 3
// Source: RESEARCH.md §Pattern 8 — Config View Pattern
//
// Form-based settings view for Cloudflare API token, SMS24h API key,
// and full JSON backup/restore. Business logic functions (save, test,
// backup, import) exposed to window for inline onclick handlers.
//
// Threat mitigations applied:
//   T-03-02: escapeHTML() on all user-provided values before HTML interpolation
//   T-03-03: JSON.parse in try/catch with structure validation for backup import
//   T-03-04: Token inputs use type="password" (masked in DOM)
//   T-03-05: Import confirmation dialog before overwriting localStorage

import { VIEWS } from '../router/index.js';
import { getSettings, saveSettings, getDB, saveDB } from '../stores/data.js';
import { refreshHeaderStatus } from '../utils/header.js';
import { escapeHTML } from '../utils/string.js';

// =============================================================================
// VIEWS.config — render function (pure HTML string generator)
// =============================================================================
export function initConfig() {
  VIEWS.config = () => {
    const s = getSettings();

    return `<div class="space-y-6">
      <!-- Header card -->
      <div class="glass rounded-3xl p-6 sm:p-8 flex flex-wrap gap-6 items-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;border-radius:20px">⚙️</div>
        <div class="flex-1">
          <h2 class="font-display text-2xl sm:text-3xl">Configurações</h2>
          <p class="text-slate-300 mt-2">Tokens e chaves de API</p>
        </div>
      </div>

      <!-- Cloudflare Configuration card (CONF-01) -->
      <div class="glass rounded-2xl p-5 sm:p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">☁️</span>
          <span class="font-display font-bold text-lg">Cloudflare</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-sm text-slate-400" for="cf-token">API Token</label>
            <input id="cf-token" class="input w-full mt-1" type="password" value="${escapeHTML(s.cf_token || '')}" placeholder="Cloudflare API Token">
          </div>
          <div>
            <label class="text-sm text-slate-400" for="cf-account">Account ID</label>
            <input id="cf-account" class="input w-full mt-1" value="${escapeHTML(s.cf_account || '')}" placeholder="Cloudflare Account ID">
          </div>
          <div id="cf-account-info" class="text-sm text-slate-400"></div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-3d purple sm" onclick="salvouCfToken()">💾 Salvar</button>
            <button class="btn-3d cyan sm" onclick="testarCloudflare()">🔍 Testar Conexão</button>
          </div>
        </div>

        <!-- Expandable instructions -->
        <details class="mt-4 text-sm text-slate-400">
          <summary class="cursor-pointer hover:text-slate-300">📖 Como criar um token Cloudflare</summary>
          <div class="mt-2 space-y-1 pl-2 border-l border-white/10">
            <p>1. Acesse <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" class="text-cyan-300 underline">dash.cloudflare.com/profile/api-tokens</a></p>
            <p>2. Clique em "Criar Token" → Usar modelo "Edit Cloudflare Pages"</p>
            <p>3. Permissões necessárias: <strong>Pages:Edit</strong> e <strong>Account Settings:Read</strong></p>
            <p>4. O Account ID está na página inicial do dashboard (barra lateral direita)</p>
          </div>
        </details>
      </div>

      <!-- SMS24h Configuration card (CONF-02) -->
      <div class="glass rounded-2xl p-5 sm:p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">📱</span>
          <span class="font-display font-bold text-lg">SMS24h</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-sm text-slate-400" for="sms-key">API Key</label>
            <input id="sms-key" class="input w-full mt-1" type="password" value="${escapeHTML(s.sms_key || '')}" placeholder="SMS24h API Key">
          </div>
          <div class="text-xs text-slate-400">Chave encontrada em <a href="https://sms24h.org" target="_blank" class="text-cyan-300 underline">sms24h.org</a> → Perfil → API</div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-3d purple sm" onclick="salvouSmsKey()">💾 Salvar</button>
            <button class="btn-3d cyan sm" onclick="testarSMS()">🔍 Testar Conexão</button>
          </div>
        </div>
      </div>

      <!-- Data Management card (CONF-03) -->
      <div class="glass rounded-2xl p-5 sm:p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">💾</span>
          <span class="font-display font-bold text-lg">Backup e Restauração</span>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-slate-400">Exporte todos os dados (empresas, sites, configurações) para um arquivo JSON. Use para backup ou transferência entre dispositivos.</p>
          <button class="btn-3d amber sm" onclick="exportarBackup()">📥 Exportar Backup</button>

          <div class="border-t border-white/10 pt-4 mt-4">
            <p class="text-sm text-slate-400 mb-2">Importe um arquivo de backup JSON para restaurar todos os dados.</p>
            <div class="flex flex-wrap gap-2 items-center">
              <input id="import-file" class="input" type="file" accept=".json" style="max-width:260px">
              <button class="btn-3d rose sm" onclick="importarBackup()">📤 Importar Backup</button>
            </div>
            <p class="text-xs text-amber-300 mt-2">⚠️ A importação substituirá todos os dados atuais.</p>
          </div>
        </div>
      </div>
    </div>`;
  };

  // =============================================================================
  // BUSINESS LOGIC FUNCTIONS (exposed to window for inline onclick)
  // =============================================================================

  /**
   * Saves Cloudflare API token and account ID from form inputs to settings.
   * Reads #cf-token and #cf-account values, updates settings, refreshes header.
   */
  window.salvouCfToken = () => {
    const token = document.getElementById('cf-token')?.value || '';
    const account = document.getElementById('cf-account')?.value || '';
    const s = getSettings();
    s.cf_token = token;
    s.cf_account = account;
    saveSettings(s);
    // saveSettings already calls refreshHeaderStatus() internally
    window.toast?.('Token Cloudflare salvo!', '✅');
  };

  /**
   * Saves SMS24h API key from form input to settings.
   * Reads #sms-key value, updates settings, refreshes header.
   */
  window.salvouSmsKey = () => {
    const key = document.getElementById('sms-key')?.value || '';
    const s = getSettings();
    s.sms_key = key;
    saveSettings(s);
    // saveSettings already calls refreshHeaderStatus() internally
    window.toast?.('Chave SMS24h salva!', '✅');
  };

  /**
   * Tests Cloudflare API connectivity by listing Pages projects.
   * Uses Fetch API with Bearer token auth. Displays result count or error.
   */
  window.testarCloudflare = async () => {
    const s = getSettings();
    const token = document.getElementById('cf-token')?.value || s.cf_token;
    const account = document.getElementById('cf-account')?.value || s.cf_account;

    if (!token || !account) {
      window.toast?.('Preencha o token e o Account ID primeiro.', '⚠️');
      return;
    }

    const info = document.getElementById('cf-account-info');
    if (info) info.innerHTML = '<span class="text-slate-400">⏳ Testando conexão...</span>';

    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const d = await r.json();
      if (d.success && d.result) {
        const projectCount = Array.isArray(d.result) ? d.result.length : 0;
        if (info) info.innerHTML = `<span class="text-green-300">✅ Conectado! ${escapeHTML(String(projectCount))} projeto(s) encontrado(s)</span>`;
        window.toast?.(`✅ Conectado! ${projectCount} projeto(s)`, '☁️');
      } else {
        const errMsg = d.errors?.[0]?.message || 'Token inválido ou sem permissão';
        if (info) info.innerHTML = `<span class="text-rose-300">❌ ${escapeHTML(errMsg)}</span>`;
        window.toast?.('❌ ' + errMsg, '⚠️');
      }
    } catch (e) {
      if (info) info.innerHTML = `<span class="text-rose-300">❌ ${escapeHTML(e.message || 'Erro de conexão')}</span>`;
      window.toast?.('❌ Erro de conexão. Verifique o token.', '⚠️');
    }
  };

  /**
   * Tests SMS24h API connectivity by querying balance.
   * Uses query-parameter auth pattern matching smsAPI() from Phase 03 Plan 02.
   */
  window.testarSMS = async () => {
    const key = document.getElementById('sms-key')?.value || getSettings().sms_key;

    if (!key) {
      window.toast?.('Preencha a chave API primeiro.', '⚠️');
      return;
    }

    try {
      const r = await fetch(
        `https://api.sms24h.org/stubs/handler_api?api_key=${encodeURIComponent(key)}&action=getBalance`
      );
      const t = await r.text();
      if (t.startsWith('ACCESS_BALANCE:')) {
        const balance = t.split(':')[1];
        window.toast?.(`✅ Saldo: R$ ${escapeHTML(balance)}`, '📱');
      } else if (t === 'BAD_KEY') {
        window.toast?.('❌ Chave inválida', '⚠️');
      } else {
        window.toast?.(`❌ ${escapeHTML(t)}`, '⚠️');
      }
    } catch (e) {
      window.toast?.('❌ Erro de conexão. Verifique a chave.', '⚠️');
    }
  };

  /**
   * Exports full database + settings as a downloadable JSON backup file.
   * Serializes {db, settings, exportedAt} and triggers browser download.
   */
  window.exportarBackup = () => {
    const data = {
      db: getDB(),
      settings: getSettings(),
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `laboratorio-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.toast?.('💾 Backup exportado!', '📥');
  };

  /**
   * Imports a JSON backup file, validates structure, and applies to localStorage.
   * Shows confirmation before overwriting current data.
   */
  window.importarBackup = () => {
    const fileInput = document.getElementById('import-file');
    if (!fileInput?.files?.length) {
      window.toast?.('Selecione um arquivo de backup primeiro.', '⚠️');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate structure
        if (!data || typeof data !== 'object') throw new Error('Formato inválido');
        if (!data.db || typeof data.db !== 'object') throw new Error('Dados ausentes (db)');
        if (!data.settings || typeof data.settings !== 'object') throw new Error('Dados ausentes (settings)');

        // Confirmation before overwriting
        if (!confirm('⚠️ Isso substituirá todos os dados atuais pelos dados do backup. Continuar?')) return;

        saveDB(data.db);
        saveSettings(data.settings);
        // saveSettings already calls refreshHeaderStatus() internally

        window.toast?.('✅ Dados restaurados!', '📤');

        // Navigate to dashboard to show restored data
        setTimeout(() => {
          if (typeof window.go === 'function') window.go('dashboard');
        }, 800);

      } catch (err) {
        console.error('Backup import failed:', err);
        window.toast?.('❌ Arquivo inválido. Verifique o formato.', '⚠️');
      }
    };

    reader.readAsText(file);
  };
}
