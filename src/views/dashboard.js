import { getDB, getSettings } from '../stores/data.js';
import { fmtMoney } from '../utils/string.js';

let _initialized = false;
export function initDashboard() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  R.dashboard = () => {
    const db = getDB();
    const totalEmp = db.empresas.length;
    const totalSites = db.sites.length;
    const finalizados = db.sites.filter(s => s.status === 'finalizado').length;
    const ativos = db.sites.filter(s => s.url).length;
    const settings = getSettings();
    const cfOk = !!(settings.cf_token && settings.cf_account);
    const smsOk = !!settings.sms_key;

    return `
    <div class="grad-card rounded-3xl p-6 sm:p-10 mb-6 relative overflow-hidden">
      <div class="absolute -right-10 -top-10 floaty opacity-40 hidden sm:block">
        <div class="icon-cube purple" style="width:180px;height:180px;font-size:90px;border-radius:40px;">🧪</div>
      </div>
      <div class="pill done mb-3">🎈 Laboratório aberto</div>
      <h1 class="font-display text-3xl sm:text-5xl font-extrabold leading-tight">Bom dia, <span class="grad-text">João Victor</span></h1>
      <p class="text-slate-300 mt-3 max-w-2xl">Painel central do <b>Laboratório de BMs</b>. Cadastra a empresa, cria o site automaticamente, verifica na Meta, compra número e edita PDF — tudo daqui.</p>
      <div class="flex flex-wrap gap-3 mt-6">
        <button class="btn-3d" onclick="go('etapa1')">🧬 Iniciar fluxo de site</button>
        <button class="btn-3d cyan" onclick="go('etapa2')">📱 Comprar número</button>
        <button class="btn-3d purple" onclick="go('etapa3')">📄 Editor de PDF</button>
      </div>
    </div>

    ${(!cfOk || !smsOk) ? `
      <div class="glass rounded-2xl p-5 mb-6 flex items-start gap-4" style="border-color:rgba(245,158,11,.4);">
        <div class="icon-cube amber" style="width:48px;height:48px;font-size:22px;">⚠️</div>
        <div class="flex-1">
          <div class="font-bold">Configure as APIs para liberar a automação completa</div>
          <div class="text-sm text-slate-300 mt-1">
            ${!cfOk ? '<span class="pill danger mr-1">Cloudflare</span> ' : ''}
            ${!smsOk ? '<span class="pill danger mr-1">SMS24h</span> ' : ''}
          </div>
        </div>
        <button class="btn-3d warn sm" onclick="go('config')">Configurar →</button>
      </div>` : ''}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${statCard('💼', 'Empresas', totalEmp, 'brand')}
      ${statCard('🎨', 'Sites criados', totalSites, 'cyan')}
      ${statCard('🌐', 'No ar', ativos, 'green')}
      ${statCard('🏁', 'Finalizados', finalizados, 'amber')}
    </div>

    <h2 class="font-display text-xl font-bold mb-4">🧪 Áreas do laboratório</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      ${quickCard('🧬', 'Etapa 1 — Criar Site', 'CNPJ + domínio + meta + site + publicar Cloudflare.', 'etapa1', 'cyan')}
      ${quickCard('📱', 'Etapa 2 — Número SMS', 'Compra número SMS24h e atualiza site no ar.', 'etapa2', 'purple')}
      ${quickCard('📄', 'Etapa 3 — Editor PDF', 'Edita PDF, mapeia campos do endereço, baixa.', 'etapa3', 'brand')}
      ${quickCard('💼', 'Banco de Empresas', 'Histórico de CNPJs consultados.', 'banco', 'green')}
      ${quickCard('📊', 'Planilha', 'Status, link, meta-tag, número.', 'planilha', 'amber')}
      ${quickCard('⚙️', 'Configurações', 'Tokens Cloudflare e SMS24h.', 'config', 'rose')}
    </div>
    `;
  };
}

function statCard(icon, label, value, color) {
  return `<div class="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
    <div class="icon-cube ${color}" style="width:46px;height:46px;font-size:20px;">${icon}</div>
    <div class="text-3xl font-extrabold mt-3">${value}</div>
    <div class="text-slate-400 text-sm">${label}</div>
  </div>`;
}

function quickCard(icon, title, desc, route, color) {
  return `<div class="glass rounded-2xl p-5 hover:scale-[1.01] transition cursor-pointer" onclick="go('${route}')">
    <div class="flex items-start gap-4">
      <div class="icon-cube ${color}">${icon}</div>
      <div class="min-w-0">
        <div class="font-display font-bold text-lg">${title}</div>
        <div class="text-sm text-slate-400 mt-1">${desc}</div>
        <div class="mt-3 text-cyan-300 text-sm font-bold">Abrir →</div>
      </div>
    </div>
  </div>`;
}
