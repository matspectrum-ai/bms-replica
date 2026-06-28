// src/views/login.js
// Plan: 07-03, Task 03-01 — Login view
// D-04: Login form with username + password, calls session.login()
//
// Follows dashboard.js view pattern:
//   - Import VIEWS from router
//   - Export initLogin() that assigns VIEWS.login = () => HTML string
//   - Uses existing design system (glass, btn-3d, icon-cube, grad-text, font-display)
//   - All text in pt-BR

import { VIEWS } from '../router/index.js';
import { login } from '../auth/session.js';

export function initLogin() {
  VIEWS.login = () => {
    return `<div class="min-h-[80vh] flex items-center justify-center p-4">
      <div class="glass rounded-3xl p-8 max-w-md w-full" style="background:rgba(15,23,55,.95);">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <div class="icon-cube purple" style="width:72px;height:72px;font-size:36px;border-radius:20px;">🧪</div>
        </div>

        <!-- Title -->
        <h1 class="font-display text-2xl sm:text-3xl text-center grad-text mb-1">Laboratório de BMs</h1>
        <p class="text-slate-400 text-center text-sm mb-8">Entre com suas credenciais</p>

        <!-- Error message (hidden by default) -->
        <div id="login-error" class="hidden mb-4 p-3 rounded-xl text-sm text-center" style="background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.25);"></div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Usuário</label>
            <input id="login-user" type="text" placeholder="Usuário" autocomplete="username"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1.5 ml-1">Senha</label>
            <input id="login-pass" type="password" placeholder="Senha" autocomplete="current-password"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition">
          </div>
          <button id="login-btn" class="btn-3d purple w-full mt-2">Entrar</button>
        </div>

        <!-- Register link -->
        <p class="text-center mt-6 text-sm text-slate-400">
          Não tem conta?
          <span class="text-purple-400 cursor-pointer hover:underline" onclick="go('register')">Criar conta</span>
        </p>
      </div>
    </div>`;
  };

  // Post-render hook: attach event listeners after DOM is injected
  if (typeof window !== 'undefined') { window.after_login = () => {
    const userEl = document.getElementById('login-user');
    const passEl = document.getElementById('login-pass');
    const btnEl = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    if (!userEl || !passEl || !btnEl || !errorEl) return;

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }

    function hideError() {
      errorEl.classList.add('hidden');
    }

    async function handleLogin() {
      hideError();
      const username = userEl.value.trim();
      const password = passEl.value;

      if (!username || !password) {
        showError('Preencha usuário e senha.');
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Entrando...';

      const result = await login(username, password);

      if (result.success) {
        // Success — redirect to dashboard (bootstrap in Plan 04 will handle IP check)
        go('dashboard');
      } else {
        const messages = {
          invalid_credentials: 'Usuário ou senha incorretos.',
          account_not_found: 'Conta não encontrada.',
          network_error: 'Erro de conexão. Verifique sua internet.'
        };
        showError(messages[result.error] || 'Erro ao fazer login. Tente novamente.');
        btnEl.disabled = false;
        btnEl.textContent = 'Entrar';
      }
    }

    btnEl.addEventListener('click', handleLogin);

    // Enter key submits form
    passEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    userEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') passEl.focus();
    });
  };}
}
