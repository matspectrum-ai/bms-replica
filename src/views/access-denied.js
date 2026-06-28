// src/views/access-denied.js
// Plan: 07-03, Task 03-02 — Access Denied view
// D-06: Blocked IPs see "Acesso Negado" with request-access flow
//
// This view is NOT a normal route — it replaces the entire app shell when IP check fails.
// It renders standalone (no sidebar, no header dependency).
//
// Follows dashboard.js view pattern:
//   - Import VIEWS from router
//   - Export initAccessDenied() that assigns VIEWS['access-denied'] = () => HTML string
//   - Uses existing design system (glass, btn-3d, icon-cube, font-display)
//   - All text in pt-BR

import { VIEWS } from '../router/index.js';
import { requestAccess } from '../auth/ip-gate.js';

export function initAccessDenied() {
  VIEWS['access-denied'] = () => {
    return `<div class="min-h-screen flex items-center justify-center p-4" style="background:var(--bg);">
      <div class="glass rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center" style="background:rgba(15,23,55,.95);">
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="icon-cube rose" style="width:80px;height:80px;font-size:40px;border-radius:22px;">🚫</div>
        </div>

        <!-- Title (D-06) -->
        <h1 class="font-display text-2xl sm:text-3xl mb-3" style="color:#fca5a5;">Acesso Negado</h1>

        <!-- Message (D-06) -->
        <p class="text-slate-300 text-sm leading-relaxed mb-8 max-w-md mx-auto">
          Seu endereço IP não está autorizado a acessar o Laboratório de BMs.
          Se você acredita que isso é um erro, solicite acesso ao administrador.
        </p>

        <!-- Status area -->
        <div id="ar-status" class="hidden mb-4 p-3 rounded-xl text-sm"></div>

        <!-- Form -->
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Seu Email</label>
            <input id="ar-email" type="email" placeholder="seu@email.com" autocomplete="email"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none transition">
          </div>
          <button id="ar-btn" class="btn-3d danger w-full justify-center">Solicitar Acesso</button>
        </div>
      </div>
    </div>`;
  };

  // Post-render hook: handle access request submission
  if (typeof window !== 'undefined') { window.after_access_denied = () => {
    const emailEl = document.getElementById('ar-email');
    const btnEl = document.getElementById('ar-btn');
    const statusEl = document.getElementById('ar-status');

    if (!emailEl || !btnEl || !statusEl) return;

    function showStatus(text, isError) {
      statusEl.textContent = text;
      statusEl.classList.remove('hidden');
      statusEl.style.background = isError
        ? 'rgba(239,68,68,.12)'
        : 'rgba(34,197,94,.12)';
      statusEl.style.color = isError ? '#fca5a5' : '#86efac';
      statusEl.style.border = isError
        ? '1px solid rgba(239,68,68,.25)'
        : '1px solid rgba(34,197,94,.25)';
    }

    async function handleRequest() {
      const email = emailEl.value.trim();

      if (!email || !email.includes('@')) {
        showStatus('Insira um email válido.', true);
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Enviando...';

      const result = await requestAccess(email);

      if (result.success) {
        showStatus('Solicitação enviada! O administrador irá analisar seu pedido.', false);
        emailEl.disabled = true;
        btnEl.textContent = 'Enviado ✓';
      } else {
        showStatus('Erro ao enviar. Tente novamente.', true);
        btnEl.disabled = false;
        btnEl.textContent = 'Solicitar Acesso';
      }
    }

    btnEl.addEventListener('click', handleRequest);

    // Enter key submits
    emailEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRequest();
    });
  };}
}
