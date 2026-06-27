// src/views/planilha.js
// Planilha de Sites — 8-column spreadsheet with inline editing and CSV export
// Phase 03-02 Task 2+3: Replaces stub with full data-driven implementation
// Pattern: Post-Render Hook (RESEARCH.md §Pattern 5)
//
// Renders all saved sites as an 8-column table in reverse-chronological order.
// Status dropdown changes site status inline with localStorage persistence.
// Delete button removes row with confirmation dialog.
// CSV export produces UTF-8 BOM semicolon-delimited file for Brazilian Excel.
// All user data is escapeHTML'd before HTML interpolation (Pitfall 5 compliance).

import { VIEWS } from '../router/index.js';
import { getDB, saveDB } from '../stores/data.js';
import { escapeHTML } from '../utils/string.js';
import { fmtCNPJ, fmtDate, formatBRPhone } from '../utils/format.js';

export function initPlanilha() {
  // Register static HTML shell generator
  VIEWS.planilha = () => {
    const db = getDB();
    const count = (db.sites || []).length;

    return `<div class="space-y-4">
      <div class="glass rounded-3xl p-4 flex flex-wrap gap-4 items-center">
        <div class="icon-cube amber" style="width:48px;height:48px;font-size:22px">📊</div>
        <div class="flex-1">
          <span class="font-display font-bold">Planilha de Sites</span>
          <span class="text-slate-400 text-sm ml-2">Status de cada site publicado</span>
        </div>
        <span class="pill todo">${count} site${count !== 1 ? 's' : ''}</span>
        <button class="btn-3d cyan sm" onclick="window.exportarCSV()">📥 Exportar CSV</button>
      </div>
      <div class="glass rounded-2xl overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10 text-slate-400">
              <th class="p-3 text-left font-medium">Empresa</th>
              <th class="p-3 text-left font-medium">CNPJ</th>
              <th class="p-3 text-left font-medium">Domínio / URL</th>
              <th class="p-3 text-left font-medium">Tel Empresa</th>
              <th class="p-3 text-left font-medium">Nosso Tel</th>
              <th class="p-3 text-left font-medium">Status</th>
              <th class="p-3 text-left font-medium">Atualizado</th>
              <th class="p-3 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody id="planilha-body"></tbody>
        </table>
      </div>
    </div>`;
  };

  // Post-render hook — runs AFTER innerHTML injection via router step 9
  window.after_planilha = renderPlanilha;
  window.mudarStatus = mudarStatus;
  window.deletarSite = deletarSite;
  // window.exportarCSV placeholder — full implementation in Task 3
  window.exportarCSV = function() {
    if (typeof window.toast !== 'undefined') window.toast('Exportação CSV será implementada em breve.', '📊');
  };
}

/**
 * Post-render hook: reads sites from DB, reverses (newest first), renders rows.
 * Called by router (go) after innerHTML injection.
 */
function renderPlanilha() {
  const db = getDB();
  const sites = db.sites ? [...db.sites].reverse() : [];

  const body = document.getElementById('planilha-body');
  if (!body) return;

  if (sites.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="p-8 text-center">
      <div class="icon-cube purple" style="width:48px;height:48px;font-size:24px;margin:0 auto">📊</div>
      <p class="text-slate-400 mt-3">Nenhum site publicado ainda</p>
      <p class="text-slate-500 text-xs mt-1">Os sites aparecerão aqui após serem criados na Etapa 1</p>
    </td></tr>`;
    return;
  }

  // Map original index for status/delete callbacks (sites are reversed)
  body.innerHTML = sites.map((site, displayIndex) => {
    const originalIndex = db.sites.length - 1 - displayIndex;
    return renderSiteRow(site, originalIndex);
  }).join('');
}

/**
 * Renders a single table row for a site entry.
 * All user data is escapeHTML'd before HTML interpolation (Pitfall 5).
 * @param {object} s - Site object from DB
 * @param {number} index - Original index in db.sites array (pre-reverse)
 */
function renderSiteRow(s, index) {
  const empresa = escapeHTML(s.fantasia || s.razao || '—');
  const cnpj = fmtCNPJ(s.cnpj || '');
  const telEmpresa = formatBRPhone(s.telefoneEmpresa) || '—';
  const telNosso = s.telefoneNosso ? formatBRPhone(s.telefoneNosso) : '';

  // Domain/URL column
  let dominioCell;
  if (s.url) {
    const safeUrl = escapeHTML(s.url);
    dominioCell = `<a href="${safeUrl}" target="_blank" rel="noopener" class="text-cyan-400 underline">🔗 Abrir</a>`;
  } else if (s.dominio) {
    const safeDominio = escapeHTML(s.dominio);
    dominioCell = `<span class="font-mono text-white">${safeDominio}</span>
      <button class="btn-3d ghost xs ml-1" onclick="copyText('${safeDominio}')" title="Copiar domínio">📋</button>`;
  } else {
    dominioCell = '—';
  }

  // Phone columns
  const telEmpresaCell = telEmpresa !== '—'
    ? `<span class="font-mono text-white">${telEmpresa}</span>
       <button class="btn-3d ghost xs ml-1" onclick="copyText('${escapeHTML(s.telefoneEmpresa || '')}')" title="Copiar">📋</button>`
    : '—';

  const telNossoCell = telNosso
    ? `<span class="font-mono text-white">${telNosso}</span>
       <button class="btn-3d ghost xs ml-1" onclick="copyText('${escapeHTML(s.telefoneNosso || '')}')" title="Copiar">📋</button>`
    : '—';

  // Status select with current value pre-selected
  const currentStatus = s.status || 'criado';
  const statusOptions = [
    { value: 'deploy', label: 'Deploy' },
    { value: 'criado', label: 'Criado' },
    { value: 'erro', label: 'Erro' },
    { value: 'finalizado', label: 'Finalizado' }
  ];

  const statusSelect = `<select class="input text-xs py-1 px-2" onchange="window.mudarStatus(${index}, this.value)">
    ${statusOptions.map(opt =>
      `<option value="${opt.value}"${currentStatus === opt.value ? ' selected' : ''}>${opt.label}</option>`
    ).join('')}
  </select>`;

  const atualizado = fmtDate(s.atualizado) || '—';

  return `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
    <td class="p-3 text-white max-w-[180px] truncate" title="${empresa}">${empresa}</td>
    <td class="p-3 font-mono text-white text-xs">${cnpj}</td>
    <td class="p-3">${dominioCell}</td>
    <td class="p-3">${telEmpresaCell}</td>
    <td class="p-3">${telNossoCell}</td>
    <td class="p-3">${statusSelect}</td>
    <td class="p-3 text-slate-400 text-xs">${atualizado}</td>
    <td class="p-3 text-center">
      <button class="btn-3d danger sm" onclick="window.deletarSite(${index})" title="Remover site">🗑️</button>
    </td>
  </tr>`;
}

/**
 * Updates a site's status in the DB and re-renders the table.
 * @param {number} index - Index in db.sites array
 * @param {string} newStatus - New status value
 */
function mudarStatus(index, newStatus) {
  const db = getDB();
  if (!db.sites || !db.sites[index]) return;
  db.sites[index].status = newStatus;
  db.sites[index].atualizado = Date.now();
  saveDB(db);
  renderPlanilha();
  if (typeof window.toast !== 'undefined') window.toast('Status atualizado!', '✅');
}

/**
 * Removes a site from the DB with confirmation.
 * @param {number} index - Index in db.sites array
 */
function deletarSite(index) {
  if (!confirm('Remover este site da planilha?')) return;
  const db = getDB();
  if (!db.sites || !db.sites[index]) return;
  db.sites.splice(index, 1);
  saveDB(db);
  renderPlanilha();
  if (typeof window.toast !== 'undefined') window.toast('Site removido', '🗑️');
}


