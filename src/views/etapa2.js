// src/views/etapa2.js
// Etapa 2 view stub — returns placeholder HTML
// Full implementation: Phase 03
// Matches RECON.md §1.4 Etapa 2 View (SMS Purchase)

import { VIEWS } from '../router/index.js';

export function initEtapa2() {
  VIEWS.etapa2 = () => {
    return `<div class="space-y-6">
      <div class="glass rounded-2xl p-6 text-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">📱</div>
        <h2 class="font-display text-2xl mt-4">Etapa 2 — Comprar Número</h2>
        <p class="text-slate-400 mt-2">SMS24h integrado para verificação Facebook — implementação completa na Phase 03</p>
      </div>
    </div>`;
  };
}
