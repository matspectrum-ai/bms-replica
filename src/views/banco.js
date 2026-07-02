import { getDB, saveDB } from '../stores/data.js';
import { fmtCNPJ, fmtMoney, onlyDigits } from '../utils/string.js';
import { toast } from '../widgets/toast.js';

let _initialized = false;
export function initBanco() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  R.banco = () => {
    const db = getDB();
    return `<div class="glass rounded-3xl p-5 mb-5 flex flex-wrap items-center gap-3">
      <div class="icon-cube green">💼</div>
      <div class="flex-1 min-w-[200px]">
        <div class="font-display text-xl font-extrabold">${db.empresas.length} empresa(s) salvas</div>
        <div class="text-sm text-slate-400">Banco local no navegador</div>
      </div>
      <input id="filter-q" oninput="renderBanco()" placeholder="🔎 Buscar..." class="input" style="max-width:300px;">
      <select id="filter-faixa" onchange="renderBanco()" class="input" style="max-width:240px;">
        <option value="">Todos</option>
        <option value="ideal">Faixa ideal (R$ 10k–50k)</option>
        <option value="abaixo">Abaixo de R$ 10k</option>
        <option value="acima">Acima de R$ 50k</option>
      </select>
      <button class="btn-3d danger sm" onclick="limparBanco()">🗑️ Limpar</button>
    </div>
    <div id="banco-list" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>`;
  };

  window.after_banco = () => renderBanco();
  window.renderBanco = renderBanco;
  window.limparBanco = limparBanco;
  window.usarEmpresaNaEtapa1 = usarEmpresaNaEtapa1;
}

function renderBanco() {
  const db = getDB();
  const q = (document.getElementById('filter-q')?.value || '').toLowerCase();
  const faixa = document.getElementById('filter-faixa')?.value || '';
  let list = db.empresas.slice().reverse();
  if (q) list = list.filter(e => (e.razao_social || '').toLowerCase().includes(q) || onlyDigits(e.cnpj).includes(onlyDigits(q)));
  if (faixa) {
    list = list.filter(e => {
      const c = Number(e.capital_social) || 0;
      if (faixa === 'ideal') return c >= 10000 && c <= 50000;
      if (faixa === 'abaixo') return c < 10000;
      if (faixa === 'acima') return c > 50000;
      return true;
    });
  }
  const el = document.getElementById('banco-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty col-span-full">Sem empresas ainda. <button class="text-cyan-300 underline" onclick="go('etapa1')">Iniciar Etapa 1 →</button></div>`;
    return;
  }
  el.innerHTML = list.map(e => {
    const c = Number(e.capital_social) || 0;
    const ideal = c >= 10000 && c <= 50000;
    return `<div class="glass rounded-2xl p-5 flex flex-col gap-2">
      <div class="flex items-start gap-3">
        <div class="icon-cube" style="width:46px;height:46px;font-size:20px;">🏢</div>
        <div class="min-w-0 flex-1">
          <div class="font-display font-bold leading-tight truncate">${e.razao_social || '—'}</div>
          <div class="text-xs text-slate-400 truncate">${fmtCNPJ(e.cnpj)}</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${e.situacao ? `<span class="pill ok">${e.situacao}</span>` : ''}
        ${e.porte ? `<span class="pill doing">${e.porte}</span>` : ''}
        <span class="pill ${ideal ? 'done' : 'todo'}">${fmtMoney(e.capital_social)}</span>
      </div>
      <div class="text-sm text-slate-300 truncate">${e.cnae_descricao || ''}</div>
      <div class="text-xs text-slate-400">${e.municipio || ''} ${e.uf ? '/ ' + e.uf : ''}</div>
      <div class="flex gap-2 mt-2">
        <button class="btn-3d success sm" onclick="usarEmpresaNaEtapa1('${e.cnpj}')">🧬 Usar na Etapa 1</button>
      </div>
    </div>`;
  }).join('');
}

function limparBanco() {
  if (!confirm('Apagar TUDO?')) return;
  localStorage.removeItem('lab_bms_db_v1');
  toast('Banco limpo', '🧹');
  window.go('banco');
}

function usarEmpresaNaEtapa1(cnpj) {
  const db = getDB();
  const e = db.empresas.find(x => onlyDigits(x.cnpj) === onlyDigits(cnpj));
  if (!e) return;
  if (typeof window.etapa1State !== 'undefined' && window.etapa1State) {
    window.etapa1State.empresa = e;
    window.etapa1State.dominio = '';
    window.etapa1State.metatag = '';
    window.etapa1State.htmlGerado = '';
    window.etapa1State.publicado = null;
  }
  window.go('etapa1');
}
