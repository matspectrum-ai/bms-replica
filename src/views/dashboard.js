// src/views/dashboard.js
// Full implementation: Phase 03 Plan 01 Task 1
// Source: RECON.md §Pattern 1 — Widget-Based View Composition
//
// Reads from localStorage (getDB, getSettings) and composes HTML using
// existing widget factories (statCard, quickCard). No additional business
// logic — purely data → widget → HTML.
//
// D-03: VIEWS.dashboard is a pure HTML string generator (no side effects).
// All values come from localStorage — trusted source, no escapeHTML needed
// for localStorage data. API status derived from getSettings().

import { VIEWS } from '../router/index.js';
import { getDB, getSettings } from '../stores/data.js';
import { statCard } from '../widgets/statCard.js';
import { quickCard } from '../widgets/quickCard.js';

export function initDashboard() {
  VIEWS.dashboard = () => {
    const db = getDB();
    const s = getSettings();
    const sites = db.sites || [];
    const empresas = db.empresas || [];
    const sitesNoAr = sites.filter(site => site.url && site.status === 'deploy').length;
    const finalizados = sites.filter(site => site.status === 'finalizado').length;
    const cfOk = !!(s.cf_token && s.cf_account);
    const smsOk = !!s.sms_key;

    return `<div class="space-y-6">
      <!-- Hero card -->
      <div class="grad-card rounded-3xl p-6 sm:p-8 flex flex-wrap gap-6 items-center">
        <div class="icon-cube purple" style="width:80px;height:80px;font-size:40px;border-radius:20px">🧪</div>
        <div class="flex-1">
          <div class="pill doing">PLATAFORMA DE GESTÃO EMPRESARIAL</div>
          <h2 class="font-display text-2xl sm:text-4xl mt-3">Laboratório de BMs</h2>
          <p class="text-slate-300 mt-2 max-w-2xl">Ferramenta completa para criação de sites SaaS, consulta de CNPJ, gerenciamento de PDFs e muito mais.</p>
        </div>
      </div>

      <!-- API warning card (conditional — shown when Cloudflare or SMS24h tokens are missing) -->
      ${(!cfOk || !smsOk) ? `
      <div class="glass rounded-2xl p-5" style="border-color:rgba(245,158,11,.4);">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <div class="font-bold">Configure as APIs primeiro</div>
            <div class="text-slate-300 text-sm mt-1">Sem tokens configurados, Etapa 1 (publicar) e Etapa 2 (SMS) não funcionam.</div>
          </div>
        </div>
      </div>` : ''}

      <!-- 4 KPI stat cards in a responsive grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('🏢', 'Empresas', empresas.length, 'purple')}
        ${statCard('🌐', 'Sites Criados', sites.length, 'cyan')}
        ${statCard('🚀', 'No Ar', sitesNoAr, 'green')}
        ${statCard('✅', 'Finalizados', finalizados, 'amber')}
      </div>

      <!-- 6 quick-action cards in a responsive grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${quickCard('🧬', 'Etapa 1 — Criar Site', 'CNPJ → Domínio → Meta → Site → Publicar', 'etapa1', 'purple')}
        ${quickCard('📱', 'Etapa 2 — Comprar Número', 'SMS24h integrado, polling automático', 'etapa2', 'cyan')}
        ${quickCard('📄', 'Etapa 3 — Editor PDF', 'Visualize, edite e mapeie campos', 'etapa3', 'green')}
        ${quickCard('💼', 'Banco de Empresas', 'Histórico de CNPJs consultados', 'banco', 'amber')}
        ${quickCard('📊', 'Planilha de Sites', 'Status de cada site publicado', 'planilha', 'rose')}
        ${quickCard('⚙️', 'Configurações', 'Tokens de API e backup', 'config', 'ghost')}
      </div>
    </div>`;
  };
}
