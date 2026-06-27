// src/views/config.js
// Configurações view stub — returns placeholder HTML
// Full implementation: Phase 03
// Matches RECON.md §1.8 Configurações View

import { VIEWS } from '../router/index.js';

export function initConfig() {
  VIEWS.config = () => {
    return `<div class="space-y-6">
      <div class="glass rounded-2xl p-6 text-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">⚙️</div>
        <h2 class="font-display text-2xl mt-4">Configurações</h2>
        <p class="text-slate-400 mt-2">Tokens e chaves de API — implementação completa na Phase 03</p>
      </div>
    </div>`;
  };
}
