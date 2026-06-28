// src/views/waitlist.js
// Plan: 07-03, Task 03-01 — Waitlist view
// D-05: Shown when beta is full (max 2 accounts reached)
//
// Follows dashboard.js view pattern:
//   - Import VIEWS from router
//   - Export initWaitlist() that assigns VIEWS.waitlist = () => HTML string
//   - Uses existing design system (glass, btn-3d, icon-cube, font-display)
//   - All text in pt-BR

import { VIEWS } from '../router/index.js';

export function initWaitlist() {
  VIEWS.waitlist = () => {
    return `<div class="min-h-[80vh] flex items-center justify-center p-4">
      <div class="glass rounded-3xl p-8 max-w-md w-full" style="background:rgba(15,23,55,.95);">
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="icon-cube amber" style="width:72px;height:72px;font-size:36px;border-radius:20px;">⏳</div>
        </div>

        <!-- Title -->
        <h1 class="font-display text-2xl sm:text-3xl text-center grad-text mb-4">Beta Lotado</h1>

        <!-- Message (D-05) -->
        <p class="text-slate-300 text-sm text-center leading-relaxed mb-6">
          O beta do Laboratório de BMs está limitado a 2 contas no momento.
          Deixe seu email para ser notificado quando novas vagas abrirem.
        </p>

        <!-- Status message (hidden by default) -->
        <div id="wl-msg" class="hidden mb-4 p-3 rounded-xl text-sm text-center"></div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Email</label>
            <input id="wl-email" type="email" placeholder="seu@email.com" autocomplete="email"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition">
          </div>
          <button id="wl-btn" class="btn-3d amber w-full mt-2">Entrar na Lista de Espera</button>
        </div>

        <!-- Back link -->
        <p class="text-center mt-6 text-sm text-slate-400">
          <span class="text-purple-400 cursor-pointer hover:underline" onclick="go('login')">← Voltar ao login</span>
        </p>
      </div>
    </div>`;
  };

  // Post-render hook: handle waitlist email submission
  if (typeof window !== 'undefined') { window.after_waitlist = () => {
    const emailEl = document.getElementById('wl-email');
    const btnEl = document.getElementById('wl-btn');
    const msgEl = document.getElementById('wl-msg');

    if (!emailEl || !btnEl || !msgEl) return;

    function showMsg(text, isError) {
      msgEl.textContent = text;
      msgEl.classList.remove('hidden');
      msgEl.style.background = isError
        ? 'rgba(239,68,68,.12)'
        : 'rgba(34,197,94,.12)';
      msgEl.style.color = isError ? '#fca5a5' : '#86efac';
      msgEl.style.border = isError
        ? '1px solid rgba(239,68,68,.25)'
        : '1px solid rgba(34,197,94,.25)';
    }

    async function handleSubmit() {
      const email = emailEl.value.trim();

      if (!email || !email.includes('@')) {
        showMsg('Insira um email válido.', true);
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Enviando...';

      try {
        const resp = await fetch('/.netlify/functions/waitlist-join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (resp.ok) {
          showMsg('Obrigado! Você será notificado.', false);
          emailEl.disabled = true;
          btnEl.textContent = 'Inscrito ✓';
        } else {
          const body = await resp.json();
          showMsg(body.error || 'Erro ao enviar. Tente novamente.', true);
          btnEl.disabled = false;
          btnEl.textContent = 'Entrar na Lista de Espera';
        }
      } catch (e) {
        showMsg('Erro de conexão. Verifique sua internet.', true);
        btnEl.disabled = false;
        btnEl.textContent = 'Entrar na Lista de Espera';
      }
    }

    btnEl.addEventListener('click', handleSubmit);

    // Enter key submits
    emailEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  };}
}
