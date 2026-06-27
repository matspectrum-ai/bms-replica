// src/views/dashboard.js
// Dashboard view stub — returns placeholder HTML with hero card and 4 stat cards
// Full implementation: Phase 03
// Matches RECON.md §1.2 Dashboard View structure

import { VIEWS } from '../router/index.js';

export function initDashboard() {
  VIEWS.dashboard = () => {
    return `<div class="space-y-6">
      <!-- Hero card -->
      <div class="glass rounded-2xl p-6 text-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;margin:0 auto">🏠</div>
        <h2 class="font-display text-2xl mt-4">Dashboard</h2>
        <p class="text-slate-400 mt-2">KPIs, status e ações rápidas — implementação completa na Phase 03</p>
      </div>

      <!-- 4 stat card placeholders in a responsive grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass rounded-2xl p-4 text-center">
          <div class="icon-cube purple" style="width:48px;height:48px;font-size:22px;margin:0 auto">🏢</div>
          <div class="text-3xl font-extrabold mt-3">0</div>
          <div class="text-slate-400 text-sm">Empresas</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="icon-cube cyan" style="width:48px;height:48px;font-size:22px;margin:0 auto">🌐</div>
          <div class="text-3xl font-extrabold mt-3">0</div>
          <div class="text-slate-400 text-sm">Sites Criados</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="icon-cube green" style="width:48px;height:48px;font-size:22px;margin:0 auto">🚀</div>
          <div class="text-3xl font-extrabold mt-3">0</div>
          <div class="text-slate-400 text-sm">No Ar</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="icon-cube amber" style="width:48px;height:48px;font-size:22px;margin:0 auto">✅</div>
          <div class="text-3xl font-extrabold mt-3">0</div>
          <div class="text-slate-400 text-sm">Finalizados</div>
        </div>
      </div>
    </div>`;
  };
}
