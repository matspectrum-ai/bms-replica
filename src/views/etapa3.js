import { toast } from '../widgets/toast.js';
import { extrairCamposEndereco, escapeHTML } from '../utils/string.js';

let _initialized = false;
export function initEtapa3() {
  if (_initialized) return;
  _initialized = true;
  const R = window.VIEWS;
  if (!R) return;

  window.pdfState = { fileBytes: null, pdfDoc: null, pages: [], overlays: [] };

  R.etapa3 = () => `
  <div class="grad-card rounded-3xl p-6 sm:p-8 mb-6">
    <div class="flex items-start gap-4 flex-wrap">
      <div class="icon-cube cyan floaty">📄</div>
      <div class="flex-1 min-w-0">
        <div class="pill doing mb-2">PDF EDITOR</div>
        <h2 class="font-display text-2xl sm:text-3xl font-extrabold">Editor de PDF + Mapeador de Campos</h2>
        <p class="text-slate-300">Importa o PDF, clica onde quer adicionar texto, mapeia endereço com botões de copiar.</p>
      </div>
    </div>
  </div>

  <div class="file-drop mb-4" onclick="document.getElementById('pdf-file').click()" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="event.preventDefault();this.classList.remove('dragover');if(event.dataTransfer.files[0])carregarPDF(event.dataTransfer.files[0])">
    <div class="text-5xl mb-3 floaty">📤</div>
    <div class="font-display text-lg font-bold">Clique aqui ou arraste o PDF</div>
    <div class="text-sm text-slate-400 mt-1">Suporta múltiplas páginas</div>
    <input type="file" id="pdf-file" accept="application/pdf" class="hidden" onchange="if(this.files[0])carregarPDF(this.files[0])">
  </div>

  <div id="pdf-toolbar" class="hidden glass rounded-2xl p-4 mb-4 flex flex-wrap gap-2 items-center sticky top-[88px] z-20" style="background:rgba(15,23,55,.95);">
    <span class="text-sm text-slate-300 mr-2">📌 <b>Clique no PDF</b> para adicionar texto</span>
    <input id="pdf-text-size" type="number" min="6" max="60" value="14" class="input" style="width:80px;padding:.5rem;font-size:.85rem;" title="Tamanho da fonte">
    <button class="btn-3d cyan sm" onclick="mapearCampos()">🗺️ Mapear campos do endereço</button>
    <button class="btn-3d ghost sm" onclick="window.pdfState.overlays=[];rerenderOverlays()">🧹 Limpar textos</button>
    <button class="btn-3d success sm" onclick="baixarPDF()">⬇️ Baixar PDF editado</button>
  </div>

  <div id="campos-mapeados"></div>

  <div id="pdf-viewer" class="text-center overflow-auto scrollbar" style="max-height:80vh;"></div>
  `;

  window.carregarPDF = carregarPDF;
  window.rerenderOverlays = rerenderOverlays;
  window.baixarPDF = baixarPDF;
  window.mapearCampos = mapearCampos;
}

async function carregarPDF(file) {
  const buf = await file.arrayBuffer();
  window.pdfState.fileBytes = new Uint8Array(buf);
  window.pdfState.overlays = [];
  document.getElementById('pdf-toolbar').classList.remove('hidden');
  document.getElementById('campos-mapeados').innerHTML = '';

  const loadingTask = pdfjsLib.getDocument({ data: window.pdfState.fileBytes.slice() });
  window.pdfState.pdfDoc = await loadingTask.promise;
  window.pdfState.pages = [];
  const viewer = document.getElementById('pdf-viewer');
  viewer.innerHTML = '';
  for (let i = 1; i <= window.pdfState.pdfDoc.numPages; i++) {
    const page = await window.pdfState.pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.4 });
    const wrap = document.createElement('div');
    wrap.className = 'pdf-canvas-wrap mb-4';
    wrap.dataset.page = i;
    wrap.style.width = viewport.width + 'px';
    wrap.style.height = viewport.height + 'px';
    wrap.style.margin = '0 auto';
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrap.appendChild(canvas);
    viewer.appendChild(wrap);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    wrap.addEventListener('click', (ev) => {
      if (ev.target !== wrap && ev.target !== canvas) return;
      const rect = wrap.getBoundingClientRect();
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      const size = Number(document.getElementById('pdf-text-size').value) || 14;
      window.pdfState.overlays.push({ page: i, x, y, text: 'Texto', size, pageWidth: viewport.width, pageHeight: viewport.height });
      rerenderOverlays();
    });
    window.pdfState.pages.push({ pageNum: i, viewport });
  }
  rerenderOverlays();
  toast('PDF carregado (' + window.pdfState.pdfDoc.numPages + ' páginas)', '📄');
}

function rerenderOverlays() {
  document.querySelectorAll('.pdf-overlay-text').forEach(el => el.remove());
  window.pdfState.overlays.forEach((ov, idx) => {
    const wrap = document.querySelector(`.pdf-canvas-wrap[data-page="${ov.page}"]`);
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'pdf-overlay-text';
    el.contentEditable = true;
    el.textContent = ov.text;
    el.style.left = ov.x + 'px';
    el.style.top = ov.y + 'px';
    el.style.fontSize = ov.size + 'px';
    el.dataset.idx = idx;
    el.addEventListener('input', () => { ov.text = el.textContent; });
    el.addEventListener('mousedown', e => {
      if (e.target.classList.contains('del')) return;
      const sx = e.clientX, sy = e.clientY, ox = ov.x, oy = ov.y;
      function mv(ev) {
        ov.x = ox + (ev.clientX - sx);
        ov.y = oy + (ev.clientY - sy);
        el.style.left = ov.x + 'px';
        el.style.top = ov.y + 'px';
      }
      function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    });
    const del = document.createElement('span');
    del.className = 'del';
    del.textContent = '×';
    del.onclick = (e) => { e.stopPropagation(); window.pdfState.overlays.splice(idx, 1); rerenderOverlays(); };
    el.appendChild(del);
    wrap.appendChild(el);
  });
}

async function baixarPDF() {
  if (!window.pdfState.fileBytes) { toast('Carregue um PDF primeiro', '⚠️'); return; }
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDoc = await PDFDocument.load(window.pdfState.fileBytes.slice());
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  for (const ov of window.pdfState.overlays) {
    const page = pages[ov.page - 1];
    const pageH = page.getHeight();
    const scale = page.getWidth() / ov.pageWidth;
    const x = ov.x * scale;
    const y = pageH - (ov.y * scale) - (ov.size * scale * 0.8);
    page.drawText(ov.text || '', { x, y, size: ov.size * scale, font: helv, color: rgb(0, 0, 0) });
  }
  const out = await pdfDoc.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf-editado.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('PDF baixado', '⬇️');
}

async function mapearCampos() {
  if (!window.pdfState.pdfDoc) { toast('Carregue um PDF primeiro', '⚠️'); return; }
  const box = document.getElementById('campos-mapeados');
  box.innerHTML = '<div class="glass rounded-2xl p-4 mb-4"><span class="spinner"></span> Extraindo texto e procurando campos...</div>';
  let allText = '';
  for (let i = 1; i <= window.pdfState.pdfDoc.numPages; i++) {
    const page = await window.pdfState.pdfDoc.getPage(i);
    const tc = await page.getTextContent();
    const lines = {};
    tc.items.forEach(it => {
      const y = Math.round(it.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push({ x: it.transform[4], s: it.str });
    });
    const yKeys = Object.keys(lines).map(Number).sort((a, b) => b - a);
    const pageText = yKeys.map(y => lines[y].sort((a, b) => a.x - b.x).map(o => o.s).join(' ')).join('\n');
    allText += pageText + '\n';
  }
  const campos = extrairCamposEndereco(allText);
  renderCamposMapeados(campos, allText);
}

function renderCamposMapeados(campos, fullText) {
  const labels = {
    LOGRADOURO: '📍 LOGRADOURO', NUMERO: '🔢 NÚMERO', COMPLEMENTO: '🏢 COMPLEMENTO',
    BAIRRO: '🏘️ BAIRRO', CEP: '📮 CEP', MUNICIPIO: '🌆 MUNICÍPIO', UF: '🗺️ UF'
  };
  const html = `<div class="glass rounded-2xl p-5 mb-4">
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <div class="icon-cube green" style="width:44px;height:44px;font-size:20px;">🗺️</div>
      <div class="flex-1">
        <div class="font-display font-bold text-lg">Campos mapeados!</div>
        <div class="text-sm text-slate-400">Clique nos botões para copiar cada valor</div>
      </div>
      <button class="btn-3d ghost sm" onclick="document.getElementById('campos-mapeados').innerHTML=''">✖️ Fechar</button>
    </div>
    <div class="grid sm:grid-cols-2 gap-2">
      ${Object.keys(labels).map(k => {
        const v = campos[k] || '';
        return `<div class="copy-row">
          <div class="key">${labels[k]}</div>
          <div class="val ${v ? 'text-cyan-300' : 'text-slate-500'}">${escapeHTML(v || '(vazio)')}</div>
          <button class="btn-3d ${v ? 'cyan' : 'ghost'} sm" ${!v ? 'disabled' : ''} onclick="copyText('${escapeHTML(v).replace(/'/g, "\\'")}','${k} copiado!')">📋</button>
        </div>`;
      }).join('')}
    </div>
    <details class="mt-3"><summary class="text-xs text-slate-400 cursor-pointer">Ver texto bruto extraído</summary>
      <pre class="text-xs text-slate-400 mt-2 max-h-48 overflow-auto bg-black/30 p-3 rounded-lg whitespace-pre-wrap">${escapeHTML(fullText.slice(0, 3000))}</pre>
    </details>
  </div>`;
  document.getElementById('campos-mapeados').innerHTML = html;
}
