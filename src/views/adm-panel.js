// src/views/adm-panel.js
// Plan: 07-03, Task 03-02 — ADM Panel view
// D-01: ADM-only access to IP management and account overview
// D-02: IP allowlist CRUD (add/remove/list) via ip-manage function
//
// The view renders the admin dashboard with 3 sections:
//   A. IP Allowlist Management (add/remove/list)
//   B. Registered Accounts table
//   C. Access Requests list
//
// Client-side guard: shows "Acesso restrito" if !isAdmin()
// Server-side enforcement: all function calls include Authorization header
//
// Follows dashboard.js view pattern:
//   - Import VIEWS from router
//   - Export initAdmPanel() that assigns VIEWS.adm = () => HTML string
//   - Uses existing design system (glass, btn-3d, icon-cube, font-display)
//   - All text in pt-BR

import { VIEWS } from '../router/index.js';
import { checkAuth, isAdmin, getToken } from '../auth/session.js';

export function initAdmPanel() {
  VIEWS.adm = () => {
    const pendingAlert = window._adminAlert;
    const alertHtml = pendingAlert ? `<div class="glass rounded-2xl p-5 mb-6" style="border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.08);">
      <div class="flex gap-4 items-start">
        <div class="text-3xl shrink-0">🚨</div>
        <div class="flex-1">
          <h3 class="font-display text-lg" style="color:#fca5a5;">Alerta de Segurança</h3>
          <p class="text-slate-300 mt-1 text-sm">${pendingAlert.message}</p>
          <p class="text-xs text-slate-500 mt-1">${new Date(pendingAlert.timestamp).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>` : '';

    return `<div class="space-y-6">
      <!-- Header -->
      ${alertHtml}
      <div class="grad-card rounded-3xl p-6 sm:p-8 flex flex-wrap gap-6 items-center">
        <div class="icon-cube purple" style="width:72px;height:72px;font-size:36px;border-radius:20px;">🛡️</div>
        <div class="flex-1">
          <div class="pill doing">PAINEL DO ADMINISTRADOR</div>
          <h2 class="font-display text-2xl sm:text-3xl mt-3">Gerenciar Acesso</h2>
          <p class="text-slate-300 mt-2">Controle de IPs autorizados e visualização de contas.</p>
        </div>
      </div>

      <!-- ADM guard: restricted message (hidden by default — shown by post-render hook if !isAdmin) -->
      <div id="adm-restricted" class="hidden glass rounded-2xl p-8 text-center" style="border-color:rgba(239,68,68,.3);">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="font-display text-xl mb-2" style="color:#fca5a5;">Acesso Restrito</h3>
        <p class="text-slate-400">Apenas o administrador pode acessar este painel.</p>
      </div>

      <!-- Main ADM content (hidden when restricted) -->
      <div id="adm-content">

        <!-- Stats summary -->
        <div id="adm-stats" class="grid sm:grid-cols-3 gap-4 mb-6">
          <div class="glass rounded-2xl p-5 text-center">
            <div class="text-3xl mb-1">🌐</div>
            <div id="stat-ips" class="font-display text-2xl">--</div>
            <div class="text-xs text-slate-400 mt-1">IPs Autorizados</div>
          </div>
          <div class="glass rounded-2xl p-5 text-center">
            <div class="text-3xl mb-1">👤</div>
            <div id="stat-accounts" class="font-display text-2xl">--</div>
            <div class="text-xs text-slate-400 mt-1">Contas Registradas</div>
          </div>
          <div class="glass rounded-2xl p-5 text-center">
            <div class="text-3xl mb-1">📩</div>
            <div id="stat-requests" class="font-display text-2xl">--</div>
            <div class="text-xs text-slate-400 mt-1">Solicitações</div>
          </div>
        </div>

        <!-- Section A: IP Allowlist Management (D-02) -->
        <div class="glass rounded-2xl p-5" style="background:rgba(15,23,55,.6);">
          <h3 class="font-display text-lg mb-1">IPs Autorizados</h3>
          <p class="text-xs text-slate-400 mb-4">Gerencie quais endereços IP podem acessar o sistema.</p>

          <!-- IP table (scrollable on mobile) -->
          <div class="overflow-x-auto -mx-1 px-1">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th class="pb-3 pr-4">IP</th>
                  <th class="pb-3 pr-4">Descrição</th>
                  <th class="pb-3 pr-4 hidden sm:table-cell">Adicionado em</th>
                  <th class="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody id="adm-ip-table">
                <tr><td colspan="4" class="text-center text-slate-500 py-6">Carregando...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Add IP form -->
          <div class="mt-5 pt-5 border-t border-white/5">
            <div class="flex flex-col sm:flex-row gap-3">
              <input id="adm-ip" type="text" placeholder="192.168.1.1"
                class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition text-sm">
              <input id="adm-label" type="text" placeholder="Ex: Casa, Escritório"
                class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition text-sm">
              <button id="adm-add-btn" class="btn-3d purple sm shrink-0">Adicionar</button>
            </div>
            <div id="adm-ip-msg" class="hidden mt-3 text-xs"></div>
          </div>
        </div>

        <!-- Section B: Registered Accounts (D-01) -->
        <div class="glass rounded-2xl p-5" style="background:rgba(15,23,55,.6);">
          <h3 class="font-display text-lg mb-1">Contas Cadastradas</h3>
          <p class="text-xs text-slate-400 mb-4">Visão geral das contas registradas no sistema.</p>

          <div class="overflow-x-auto -mx-1 px-1">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th class="pb-3 pr-4">Usuário</th>
                  <th class="pb-3 pr-4 hidden sm:table-cell">Criado em</th>
                  <th class="pb-3">Tipo</th>
                </tr>
              </thead>
              <tbody id="adm-accounts-table">
                <tr><td colspan="3" class="text-center text-slate-500 py-6">Carregando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section C: Access Requests -->
        <div class="glass rounded-2xl p-5" style="background:rgba(15,23,55,.6);">
          <h3 class="font-display text-lg mb-1">Solicitações de Acesso</h3>
          <p class="text-xs text-slate-400 mb-4">Usuários bloqueados que solicitaram acesso.</p>

          <div class="overflow-x-auto -mx-1 px-1">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th class="pb-3 pr-4">IP</th>
                  <th class="pb-3 pr-4">Email</th>
                  <th class="pb-3 hidden sm:table-cell">Data</th>
                </tr>
              </thead>
              <tbody id="adm-requests-table">
                <tr><td colspan="3" class="text-center text-slate-500 py-6">Carregando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div><!-- /adm-content -->
    </div>`;
  };

  // Post-render hook: load data, handle ADM guard, attach event listeners
  if (typeof window !== 'undefined') { window.after_adm = () => {
    const auth = checkAuth();

    // ADM guard: hide management UI if not admin (D-01)
    if (!auth.authenticated || !auth.isAdmin) {
      const restricted = document.getElementById('adm-restricted');
      const content = document.getElementById('adm-content');
      if (restricted) restricted.classList.remove('hidden');
      if (content) content.classList.add('hidden');
      return;
    }

    const token = getToken();
    const ipTableBody = document.getElementById('adm-ip-table');
    const accountsTableBody = document.getElementById('adm-accounts-table');
    const requestsTableBody = document.getElementById('adm-requests-table');
    const addBtn = document.getElementById('adm-add-btn');
    const ipInput = document.getElementById('adm-ip');
    const labelInput = document.getElementById('adm-label');
    const ipMsg = document.getElementById('adm-ip-msg');

    // IPv4 validation regex
    function isValidIPv4(ip) {
      const parts = ip.split('.');
      if (parts.length !== 4) return false;
      return parts.every(p => {
        const num = parseInt(p, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && String(num) === p;
      });
    }

    function showIpMsg(text, isError) {
      if (!ipMsg) return;
      ipMsg.textContent = text;
      ipMsg.classList.remove('hidden');
      ipMsg.style.color = isError ? '#fca5a5' : '#86efac';
    }

    function hideIpMsg() {
      if (ipMsg) ipMsg.classList.add('hidden');
    }

    // Load IP list
    async function loadIPs() {
      if (!ipTableBody) return;
      try {
        const resp = await fetch('/.netlify/functions/ip-manage', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await resp.json();

        if (!resp.ok) {
          ipTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-red-400 py-4">Erro ao carregar IPs.</td></tr>';
          return;
        }

        const ips = data.ips || [];
        document.getElementById('stat-ips').textContent = ips.length;

        if (ips.length === 0) {
          ipTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-slate-500 py-6">Nenhum IP cadastrado.</td></tr>';
          return;
        }

        ipTableBody.innerHTML = ips.map(entry => `
          <tr class="border-t border-white/5">
            <td class="py-3 pr-4 font-mono text-purple-300">${entry.ip}</td>
            <td class="py-3 pr-4 text-slate-300">${entry.label || '—'}</td>
            <td class="py-3 pr-4 text-slate-500 text-xs hidden sm:table-cell">${entry.addedAt || '—'}</td>
            <td class="py-3 text-right">
              <button class="btn-3d danger sm text-xs" onclick="window._removeIP('${entry.ip}')">Remover</button>
            </td>
          </tr>
        `).join('');
      } catch (e) {
        ipTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-red-400 py-4">Erro de conexão.</td></tr>';
      }
    }

    // Load accounts list
    async function loadAccounts() {
      if (!accountsTableBody) return;
      try {
        const resp = await fetch('/.netlify/functions/accounts-list', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await resp.json();

        if (!resp.ok) {
          accountsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-red-400 py-4">Erro ao carregar contas.</td></tr>';
          return;
        }

        const accounts = data.accounts || [];
        document.getElementById('stat-accounts').textContent = accounts.length;

        if (accounts.length === 0) {
          accountsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-slate-500 py-6">Nenhuma conta registrada.</td></tr>';
          return;
        }

        accountsTableBody.innerHTML = accounts.map(acc => `
          <tr class="border-t border-white/5">
            <td class="py-3 pr-4 text-white">${acc.username}</td>
            <td class="py-3 pr-4 text-slate-500 text-xs hidden sm:table-cell">${acc.createdAt || '—'}</td>
            <td class="py-3">
              ${acc.isAdmin ? '<span class="pill doing" style="font-size:0.7rem;">ADM</span>' : '<span class="text-slate-400 text-xs">Usuário</span>'}
            </td>
          </tr>
        `).join('');
      } catch (e) {
        accountsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-red-400 py-4">Erro de conexão.</td></tr>';
      }
    }

    // Load access requests
    async function loadRequests() {
      if (!requestsTableBody) return;
      try {
        const resp = await fetch('/.netlify/functions/ip-manage?action=list-requests', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await resp.json();

        const requests = data.requests || [];
        document.getElementById('stat-requests').textContent = requests.length;

        if (requests.length === 0) {
          requestsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-slate-500 py-6">Nenhuma solicitação pendente.</td></tr>';
          return;
        }

        requestsTableBody.innerHTML = requests.map(req => `
          <tr class="border-t border-white/5">
            <td class="py-3 pr-4 font-mono text-xs text-purple-300">${req.ip || '—'}</td>
            <td class="py-3 pr-4 text-slate-300">${req.email || '—'}</td>
            <td class="py-3 text-slate-500 text-xs hidden sm:table-cell">${req.requestedAt || '—'}</td>
          </tr>
        `).join('');
      } catch (e) {
        requestsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-slate-500 py-6">—</td></tr>';
      }
    }

    // Remove IP handler
    window._removeIP = async function(ip) {
      if (!confirm('Remover IP ' + ip + '?')) return;
      try {
        const resp = await fetch('/.netlify/functions/ip-manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ action: 'remove', ip })
        });
        if (resp.ok) {
          loadIPs(); // Refresh table
        } else {
          alert('Erro ao remover IP.');
        }
      } catch (e) {
        alert('Erro de conexão.');
      }
    };

    // Add IP handler
    async function handleAddIP() {
      hideIpMsg();
      const ip = ipInput.value.trim();
      const label = labelInput.value.trim();

      if (!ip) {
        showIpMsg('Digite um endereço IP.', true);
        return;
      }

      if (!isValidIPv4(ip)) {
        showIpMsg('Formato de IP inválido. Use: 192.168.1.1', true);
        return;
      }

      addBtn.disabled = true;
      addBtn.textContent = 'Adicionando...';

      try {
        const resp = await fetch('/.netlify/functions/ip-manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ action: 'add', ip, label: label || undefined })
        });

        if (resp.ok) {
          ipInput.value = '';
          labelInput.value = '';
          showIpMsg('IP adicionado com sucesso!', false);
          loadIPs(); // Refresh table
        } else {
          const body = await resp.json();
          showIpMsg(body.error || 'Erro ao adicionar IP.', true);
        }
      } catch (e) {
        showIpMsg('Erro de conexão.', true);
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Adicionar';
      }
    }

    if (addBtn) addBtn.addEventListener('click', handleAddIP);

    // Load all data
    loadIPs();
    loadAccounts();
    loadRequests();
  };}
}
