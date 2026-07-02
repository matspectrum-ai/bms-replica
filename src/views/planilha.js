import { getDB, saveDB } from '../stores/data.js';
import { fmtCNPJ, fmtDate, onlyDigits } from '../utils/string.js';
import { toast } from '../widgets/toast.js';

let _initialized = false;
export function initPlanilha() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  R.planilha = () => {
    return `<div class="glass rounded-3xl p-5 mb-5 flex flex-wrap items-center gap-3">
      <div class="icon-cube amber">📊</div>
      <div class="flex-1 min-w-0">
        <div class="font-display text-xl font-extrabold">Planilha de sites</div>
        <div class="text-sm text-slate-400">Status, link, meta-tag e número.</div>
      </div>
      <button class="btn-3d success" onclick="exportCSV()">⬇️ Exportar CSV (Excel)</button>
    </div>
    <div class="glass rounded-2xl overflow-hidden">
      <div class="overflow-x-auto scrollbar">
        <table class="w-full text-sm min-w-[900px]">
          <thead style="background:rgba(99,102,241,.1)">
            <tr class="text-left">
              <th class="p-3">Empresa</th>
              <th class="p-3">CNPJ</th>
              <th class="p-3">Domínio / URL</th>
              <th class="p-3">Tel empresa</th>
              <th class="p-3">Nosso tel</th>
              <th class="p-3">Status</th>
              <th class="p-3">Atualizado</th>
              <th class="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody id="planilha-body"></tbody>
        </table>
      </div>
    </div>`;
  };

  window.after_planilha = () => renderPlanilha();
  window.renderPlanilha = renderPlanilha;
  window.mudarStatus = mudarStatus;
  window.removerSite = removerSite;
  window.exportCSV = exportCSV;
}

function renderPlanilha() {
  const db = getDB();
  const body = document.getElementById('planilha-body');
  if (!db.sites.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty">Nenhum site ainda. <button class="text-cyan-300 underline" onclick="go('etapa1')">Criar primeiro →</button></td></tr>`;
    return;
  }
  body.innerHTML = db.sites.slice().reverse().map(s => {
    return `<tr class="border-t border-white/5">
      <td class="p-3"><b>${s.fantasia || s.razao || '—'}</b></td>
      <td class="p-3 text-xs">${fmtCNPJ(s.cnpj)}</td>
      <td class="p-3">${s.url ? `<a class="text-cyan-300 underline" target="_blank" href="${s.url}">${s.dominio}</a>` : s.dominio}</td>
      <td class="p-3 text-xs">${s.telefoneEmpresa || '—'}</td>
      <td class="p-3 text-xs">${s.telefoneNosso || '—'}</td>
      <td class="p-3"><select class="input" style="padding:.4rem .6rem;font-size:.8rem" onchange="mudarStatus('${s.cnpj}','${s.dominio}',this.value)">
        ${['gerado', 'deploy', 'meta-tag', 'finalizado'].map(v => `<option value="${v}" ${s.status === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select></td>
      <td class="p-3 text-xs">${fmtDate(s.atualizado)}</td>
      <td class="p-3 text-right whitespace-nowrap">
        <button class="btn-3d ghost sm" onclick="removerSite('${s.cnpj}','${s.dominio}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function mudarStatus(cnpj, dominio, v) {
  const db = getDB();
  const s = db.sites.find(x => onlyDigits(x.cnpj) === onlyDigits(cnpj) && x.dominio === dominio);
  if (!s) return;
  s.status = v;
  s.atualizado = Date.now();
  saveDB(db);
  renderPlanilha();
  toast('Status atualizado', '📌');
}

function removerSite(cnpj, dominio) {
  if (!confirm('Remover este site?')) return;
  const db = getDB();
  db.sites = db.sites.filter(x => !(onlyDigits(x.cnpj) === onlyDigits(cnpj) && x.dominio === dominio));
  saveDB(db);
  renderPlanilha();
  toast('Removido', '🗑️');
}

function exportCSV() {
  const db = getDB();
  if (!db.sites.length) { toast('Nada para exportar', '⚠️'); return; }
  const rows = [['Empresa', 'Razao Social', 'CNPJ', 'Dominio', 'URL', 'Tel empresa', 'Nosso tel', 'Meta-tag', 'Status', 'Atualizado']];
  db.sites.forEach(s => rows.push([s.fantasia || '', s.razao || '', fmtCNPJ(s.cnpj), s.dominio, s.url || '', s.telefoneEmpresa || '', s.telefoneNosso || '', s.metatag || '', s.status, new Date(s.atualizado).toLocaleString('pt-BR')]));
  const csv = rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'planilha-laboratorio.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('CSV exportado', '📥');
}
