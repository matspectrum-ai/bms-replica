// src/views/register.js
// Plan: 07-03, Task 03-01 — Register view
// D-05: Checks account count before allowing registration, redirects to waitlist if full
//
// Follows dashboard.js view pattern:
//   - Import VIEWS from router
//   - Export initRegister() that assigns VIEWS.register = () => HTML string
//   - Uses existing design system (glass, btn-3d, font-display)
//   - All text in pt-BR

import { VIEWS } from '../router/index.js';

export function initRegister() {
  VIEWS.register = () => {
    return `<div class="min-h-[80vh] flex items-center justify-center p-4">
      <div class="glass rounded-3xl p-8 max-w-md w-full" style="background:rgba(15,23,55,.95);">
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="icon-cube purple" style="width:72px;height:72px;font-size:36px;border-radius:20px;">✨</div>
        </div>

        <!-- Title -->
        <h1 class="font-display text-2xl sm:text-3xl text-center grad-text mb-1">Criar Conta</h1>
        <p class="text-slate-400 text-center text-sm mb-8">Preencha os dados para começar</p>

        <!-- Message area (hidden by default) -->
        <div id="reg-msg" class="hidden mb-4 p-3 rounded-xl text-sm text-center"></div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Usuário</label>
            <input id="reg-user" type="text" placeholder="Escolha um nome de usuário" autocomplete="username"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Senha</label>
            <input id="reg-pass" type="password" placeholder="Mínimo 4 caracteres" autocomplete="new-password"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Confirmar Senha</label>
            <input id="reg-pass2" type="password" placeholder="Repita a senha" autocomplete="new-password"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition">
          </div>
          <button id="reg-btn" class="btn-3d purple w-full mt-2">Criar Conta</button>
        </div>

        <!-- Login link -->
        <p class="text-center mt-6 text-sm text-slate-400">
          Já tem conta?
          <span class="text-purple-400 cursor-pointer hover:underline" onclick="go('login')">Entrar</span>
        </p>
      </div>
    </div>`;
  };

  // Post-render hook: check account count, then handle registration
  if (typeof window !== 'undefined') { window.after_register = () => {
    const userEl = document.getElementById('reg-user');
    const passEl = document.getElementById('reg-pass');
    const pass2El = document.getElementById('reg-pass2');
    const btnEl = document.getElementById('reg-btn');
    const msgEl = document.getElementById('reg-msg');

    if (!userEl || !passEl || !pass2El || !btnEl || !msgEl) return;

    let canRegister = false;
    let checked = false;

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

    function hideMsg() {
      msgEl.classList.add('hidden');
    }

    // Step 1: Check account count first (D-05)
    async function checkLimit() {
      try {
        const resp = await fetch('/.netlify/functions/auth-count');
        const data = await resp.json();
        canRegister = data.canRegister;

        if (!canRegister) {
          // Beta is full — redirect to waitlist (D-05)
          showMsg('beta lotado. Redirecionando para lista de espera...', true);
          setTimeout(() => go('waitlist'), 1500);
          btnEl.disabled = true;
        }
        checked = true;
      } catch (e) {
        showMsg('Erro ao verificar disponibilidade. Tente novamente.', true);
      }
    }

    // Step 2: Handle registration submission
    async function handleRegister() {
      hideMsg();

      if (!checked) {
        showMsg('Verificando disponibilidade...', false);
        return;
      }

      if (!canRegister) {
        go('waitlist');
        return;
      }

      const username = userEl.value.trim();
      const password = passEl.value;
      const password2 = pass2El.value;

      if (!username || !password) {
        showMsg('Preencha todos os campos.', true);
        return;
      }

      if (username.length < 2) {
        showMsg('Usuário deve ter pelo menos 2 caracteres.', true);
        return;
      }

      if (password.length < 4) {
        showMsg('Senha deve ter pelo menos 4 caracteres.', true);
        return;
      }

      if (password !== password2) {
        showMsg('As senhas não conferem.', true);
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Criando...';

      try {
        const resp = await fetch('/.netlify/functions/auth-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (resp.status === 201 || resp.ok) {
          showMsg('Conta criada! Redirecionando...', false);
          setTimeout(() => go('login'), 2000);
        } else {
          const body = await resp.json();
          showMsg(body.error || 'Erro ao criar conta. Tente novamente.', true);
          btnEl.disabled = false;
          btnEl.textContent = 'Criar Conta';
        }
      } catch (e) {
        showMsg('Erro de conexão. Verifique sua internet.', true);
        btnEl.disabled = false;
        btnEl.textContent = 'Criar Conta';
      }
    }

    btnEl.addEventListener('click', handleRegister);

    // Enter key on last field submits
    pass2El.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRegister();
    });

    // Check limit on load
    checkLimit();
  };}
}
