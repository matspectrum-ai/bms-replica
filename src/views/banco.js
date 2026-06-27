// src/views/banco.js
// Banco de Empresas — company grid with search/filter and cross-view state transfer
// Phase 03-02 Task 1: Replaces stub with full data-driven implementation
// Pattern: Post-Render Hook (RESEARCH.md §Pattern 5, lines 382-435)
//
// Renders all saved companies as glass cards in reverse-chronological order.
// Supports text search (name/CNPJ) and capital social range filter.
// "Usar na Etapa 1" transfers company data cross-view to Etapa 1 wizard.
// "Limpar" clears all companies with confirmation.
// All user data is escapeHTML'd before HTML interpolation (Pitfall 5 compliance).

import { VIEWS, go } from '../router/index.js';
import { getDB, saveDB } from '../stores/data.js';
import { escapeHTML, onlyDigits } from '../utils/string.js';
import { fmtCNPJ, fmtMoney } from '../utils/format.js';

export function initBanco() {
  // Register static HTML shell generator
  VIEWS.banco = () => {
    return `<div class="space-y-4">
      <div class="glass rounded-3xl p-4 flex flex-wrap gap-4 items-center">
        <div class="icon-cube green" style="width:48px;height:48px;font-size:22px">💼</div>
        <div class="flex-1">
          <span class="font-display font-bold">Banco de Empresas</span>
          <span class="text-slate-400 text-sm ml-2">Histórico de CNPJs consultados</span>
        </div>
        <input id="filter-q" class="input" placeholder="Buscar..." oninput="window.after_banco()" style="max-width:300px">
        <select id="filter-faixa" class="input" onchange="window.after_banco()">
          <option value="">Todos</option>
          <option value="ideal">Faixa ideal (R$10k–50k)</option>
          <option value="abaixo">Abaixo de R$10k</option>
          <option value="acima">Acima de R$50k</option>
        </select>
        <button class="btn-3d danger sm" onclick="window.limparBanco()">🗑️ Limpar</button>
      </div>
      <div id="banco-list" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"></div>
    </div>`;
  };

  // Post-render hook — runs AFTER innerHTML injection via router step 9
  window.after_banco = renderBanco;
  window.limparBanco = limparBanco;
  window.usarEmpresaNaEtapa1 = usarEmpresaNaEtapa1;
}

/**
 * Post-render hook: reads empresas from DB, applies filters, renders cards.
 * Called by router (go) after innerHTML injection, and by filter onchange/oninput.
 */
function renderBanco() {
  const db = getDB();
  const q = (document.getElementById('filter-q')?.value || '').toLowerCase();
  const faixa = document.getElementById('filter-faixa')?.value || '';

  // Copy and reverse — newest first
  let empresas = db.empresas ? [...db.empresas].reverse() : [];

  // Text filter: match razao_social (case-insensitive) or CNPJ digits
  if (q) {
    empresas = empresas.filter(e => {
      const razao = (e.razao_social || '').toLowerCase();
      const cnpjDigits = onlyDigits(e.cnpj || '');
      return razao.includes(q) || cnpjDigits.includes(q);
    });
  }

  // Capital social range filter
  if (faixa === 'ideal') {
    empresas = empresas.filter(e => {
      const cap = Number(e.capital_social) || 0;
      return cap >= 10000 && cap <= 50000;
    });
  } else if (faixa === 'abaixo') {
    empresas = empresas.filter(e => {
      const cap = Number(e.capital_social) || 0;
      return cap < 10000;
    });
  } else if (faixa === 'acima') {
    empresas = empresas.filter(e => {
      const cap = Number(e.capital_social) || 0;
      return cap > 50000;
    });
  }

  const list = document.getElementById('banco-list');
  if (!list) return;

  if (empresas.length === 0) {
    list.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="icon-cube purple" style="width:64px;height:64px;font-size:32px;margin:0 auto">💼</div>
        <h3 class="text-slate-400 mt-4">Sem empresas cadastradas</h3>
        <p class="text-slate-500 text-sm mt-1">Consulte um CNPJ na Etapa 1 para começar</p>
        <button class="btn-3d ghost sm mt-4" onclick="go('etapa1')">Ir para Etapa 1 →</button>
      </div>`;
  } else {
    list.innerHTML = empresas.map(renderEmpresaCard).join('');
  }
}

/**
 * Renders a single company card from empresa data.
 * Escapes all user-provided data before HTML interpolation (Pitfall 5).
 */
function renderEmpresaCard(empresa) {
  const nome = escapeHTML(empresa.razao_social || empresa.nome_fantasia || '—');
  const cnpj = fmtCNPJ(empresa.cnpj || '');
  const capital = fmtMoney(empresa.capital_social);
  const fantasia = empresa.nome_fantasia ? escapeHTML(empresa.nome_fantasia) : '';
  const municipio = escapeHTML(empresa.municipio || '');
  const uf = escapeHTML(empresa.uf || '');
  const cnae = escapeHTML(empresa.cnae_fiscal_descricao || empresa.cnae_descricao || '');

  const local = [municipio, uf].filter(Boolean).join(', ') || '—';

  return `<div class="glass rounded-2xl p-4 space-y-3">
    <div>
      <h3 class="font-bold text-white">${nome}</h3>
      ${fantasia ? `<p class="text-slate-400 text-xs">${fantasia}</p>` : ''}
    </div>
    <div class="text-sm space-y-1">
      <div class="flex justify-between">
        <span class="text-slate-400">CNPJ</span>
        <span class="font-mono text-white">${cnpj}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Capital</span>
        <span class="text-emerald-400">${capital}</span>
      </div>
      ${cnae ? `<div class="flex justify-between">
        <span class="text-slate-400">CNAE</span>
        <span class="text-slate-300 text-xs max-w-[60%] text-right">${cnae}</span>
      </div>` : ''}
      <div class="flex justify-between">
        <span class="text-slate-400">Local</span>
        <span class="text-white">${local}</span>
      </div>
    </div>
    <button class="btn-3d primary sm w-full" onclick="window.usarEmpresaNaEtapa1('${escapeHTML(empresa.cnpj || '')}')">Usar na Etapa 1</button>
  </div>`;
}

/**
 * Transfers a company to Etapa 1 wizard and navigates there.
 * Company is stored on window._empresaParaEtapa1 for Etapa 1 to consume.
 * @param {string} cnpjDigits - Raw CNPJ string (may include formatting)
 */
function usarEmpresaNaEtapa1(cnpjDigits) {
  const db = getDB();
  const digits = onlyDigits(cnpjDigits || '');
  const empresa = db.empresas.find(e => onlyDigits(e.cnpj || '') === digits);
  if (!empresa) {
    if (typeof window.toast !== 'undefined') window.toast('⚠️ Empresa não encontrada no banco.', '⚠️');
    return;
  }
  window._empresaParaEtapa1 = empresa;
  go('etapa1');
}

/**
 * Clears all empresas from the database with confirmation.
 */
function limparBanco() {
  if (!confirm('Limpar todo o banco de empresas?')) return;
  const db = getDB();
  db.empresas = [];
  saveDB(db);
  renderBanco();
  if (typeof window.toast !== 'undefined') window.toast('Banco de empresas limpo!', '🗑️');
}
