// src/views/ajuda.js
// Full implementation: Phase 03 Plan 01 Task 2
// Source: RESEARCH.md §Pattern 9 — Static Content View
//
// Pure template view with no state dependencies, no event handlers, and no data reads.
// Uses the ajuda(ico, title, body) helper function to render 3 glass cards with
// ordered lists. Renders identically on every navigation.
//
// D-03: VIEWS.ajuda is a pure HTML string generator (no side effects).
// Module-private ajuda() function is NOT exported — only used within this module.

import { VIEWS } from '../router/index.js';

/**
 * Module-private helper — renders a glass card with icon-cube, title, and body.
 * @param {string} ico - Emoji icon
 * @param {string} title - Card title
 * @param {string} body - Card body HTML content
 * @returns {string} HTML string for a glass card
 */
function ajuda(ico, title, body) {
  return `<div class="glass rounded-2xl p-5 flex gap-4">
    <div class="icon-cube purple" style="width:52px;height:52px;font-size:24px;flex-shrink:0">${ico}</div>
    <div>
      <div class="font-display font-bold text-lg">${title}</div>
      <div class="text-slate-300 mt-1">${body}</div>
    </div>
  </div>`;
}

export function initAjuda() {
  VIEWS.ajuda = () => {
    return `<div class="space-y-6">
      <!-- Header card -->
      <div class="glass rounded-3xl p-6 sm:p-8 flex flex-wrap gap-6 items-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;border-radius:20px">❓</div>
        <div class="flex-1">
          <h2 class="font-display text-2xl sm:text-3xl">Como Funciona</h2>
          <p class="text-slate-300 mt-2">Guia rápido para cada etapa do sistema</p>
        </div>
      </div>

      <!-- Guide card 1: Etapa 1 -->
      ${ajuda('🧬', 'Etapa 1 — Criar Site', '<ol class="list-decimal pl-5 space-y-2 mt-2"><li>Consulte o CNPJ da empresa no BrasilAPI</li><li>Escolha um domínio sugerido</li><li>Configure as meta tags (título, descrição)</li><li>Gere o HTML do site automaticamente</li><li>Publique no Cloudflare Pages</li></ol>')}

      <!-- Guide card 2: Etapa 2 -->
      ${ajuda('📱', 'Etapa 2 — Comprar Número', '<ol class="list-decimal pl-5 space-y-2 mt-2"><li>Verifique seu saldo SMS24h</li><li>Escolha país e serviço (ex: Facebook)</li><li>Compre o número virtual</li><li>Aguarde o código de ativação (polling automático)</li><li>Copie o código e confirme</li></ol>')}

      <!-- Guide card 3: Etapa 3 -->
      ${ajuda('📄', 'Etapa 3 — Editor PDF', '<ol class="list-decimal pl-5 space-y-2 mt-2"><li>Carregue um arquivo PDF</li><li>Clique nas páginas para adicionar campos de texto</li><li>Arraste para reposicionar os campos</li><li>Use "Extrair Endereço" para preencher automaticamente</li><li>Baixe o PDF com os campos mesclados</li></ol>')}
    </div>`;
  };
}
