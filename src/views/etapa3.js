// src/views/etapa3.js
// Etapa 3 view stub — returns placeholder HTML
// Full implementation: Phase 03
// Matches RECON.md §1.5 Etapa 3 View (PDF Editor)

import { VIEWS } from '../router/index.js';

export function initEtapa3() {
  VIEWS.etapa3 = () => {
    return `<div class="space-y-6">
      <div class="glass rounded-2xl p-6 text-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">📄</div>
        <h2 class="font-display text-2xl mt-4">Etapa 3 — Editor PDF</h2>
        <p class="text-slate-400 mt-2">Edite PDFs e mapeie campos do endereço — implementação completa na Phase 03</p>
      </div>
    </div>`;
  };
}
