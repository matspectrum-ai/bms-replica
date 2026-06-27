// src/views/etapa1.js
// Etapa 1 view stub — returns placeholder HTML with 5-step wizard shell
// Full implementation: Phase 03
// Matches RECON.md §1.3 Etapa 1 View (5-step wizard)

import { VIEWS } from '../router/index.js';

export function initEtapa1() {
  VIEWS.etapa1 = () => {
    return `<div class="space-y-6">
      <!-- Header card -->
      <div class="glass rounded-2xl p-6 text-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">🧬</div>
        <h2 class="font-display text-2xl mt-4">Etapa 1 — Criar Site</h2>
        <p class="text-slate-400 mt-2">Wizard de criação — implementação completa na Phase 03</p>
      </div>

      <!-- 5 step-like cards in sequence -->
      <div class="space-y-3">
        <div class="glass rounded-2xl p-4 flex items-center gap-4">
          <div class="icon-cube purple" style="width:48px;height:48px;font-size:22px;flex-shrink:0">1</div>
          <div>
            <div class="font-bold">🔍 Consultar CNPJ</div>
            <div class="text-slate-400 text-sm mt-1">Buscar dados da empresa via BrasilAPI</div>
          </div>
        </div>
        <div class="glass rounded-2xl p-4 flex items-center gap-4">
          <div class="icon-cube cyan" style="width:48px;height:48px;font-size:22px;flex-shrink:0">2</div>
          <div>
            <div class="font-bold">🌐 Escolher Domínio</div>
            <div class="text-slate-400 text-sm mt-1">Gerar e selecionar domínio para o site</div>
          </div>
        </div>
        <div class="glass rounded-2xl p-4 flex items-center gap-4">
          <div class="icon-cube green" style="width:48px;height:48px;font-size:22px;flex-shrink:0">3</div>
          <div>
            <div class="font-bold">🏷️ Meta Tags</div>
            <div class="text-slate-400 text-sm mt-1">Configurar título, descrição e palavras-chave</div>
          </div>
        </div>
        <div class="glass rounded-2xl p-4 flex items-center gap-4">
          <div class="icon-cube amber" style="width:48px;height:48px;font-size:22px;flex-shrink:0">4</div>
          <div>
            <div class="font-bold">⚡ Gerar Site</div>
            <div class="text-slate-400 text-sm mt-1">Criar HTML do site com dados da empresa</div>
          </div>
        </div>
        <div class="glass rounded-2xl p-4 flex items-center gap-4">
          <div class="icon-cube purple" style="width:48px;height:48px;font-size:22px;flex-shrink:0">5</div>
          <div>
            <div class="font-bold">🚀 Publicar</div>
            <div class="text-slate-400 text-sm mt-1">Publicar site via Cloudflare Pages</div>
          </div>
        </div>
      </div>
    </div>`;
  };
}
