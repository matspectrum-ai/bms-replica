// src/views/etapa3.js — PDF Editor
// Matches original RECON.md patterns exactly
import { VIEWS } from '../router/index.js';
import { escapeHTML } from '../utils/string.js';
import { toast } from '../widgets/toast.js';

let pdfState = window._pdfState = { fileBytes: null, pdfDoc: null, pages: [], overlays: [] };

function renderEtapa3() {
  return `<div class="space-y-6">
    <div class="glass rounded-2xl p-6 flex items-center gap-4">
      <div class="icon-cube green" style="width:64px;height:64px;font-size:32px;flex-shrink:0">📄</div>
      <div><h2 class="font-display text-2xl">Etapa 3 — Editor PDF</h2><p class="text-slate-400 mt-1">Clique no PDF para adicionar texto • Depois baixe o PDF editado</p></div>
    </div>
    <div id="pdf-toolbar" class="hidden glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <span id="pdf-page-count" class="text-sm font-bold text-indigo-300 mr-2"></span>
      <span class="text-xs text-slate-400">📌 Clique no PDF para adicionar texto editavel</span>
      <button class="btn-3d purple sm" id="btn-baixar-pdf">📥 Baixar PDF</button>
      <button class="btn-3d ghost sm" id="btn-extrair-endereco">📝 Extrair Endereço</button>
      <button class="btn-3d ghost sm" id="btn-limpar" style="color:#f87171">🗑️ Limpar</button>
    </div>
    <div id="pdf-viewer" class="space-y-4">
      <div class="file-drop" onclick="document.getElementById('pdf-file-input').click()" ondrop="event.preventDefault();window._carregarPDF(event.dataTransfer.files[0])" ondragover="event.preventDefault()">
        <div style="font-size:48px;margin-bottom:12px">📁</div>
        <div class="font-bold text-lg">Clique para selecionar um PDF</div>
        <div class="text-slate-400 mt-1">Ou arraste e solte o arquivo aqui</div>
        <input type="file" id="pdf-file-input" accept="application/pdf" onchange="window._carregarPDF(this.files[0])" style="display:none">
      </div>
    </div>
    <div id="pdf-address-results" class="hidden glass rounded-2xl p-6 space-y-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="icon-cube purple" style="width:40px;height:40px;font-size:18px;flex-shrink:0">📍</div>
        <div><div class="font-display font-bold">Endereco Extraido</div><div class="text-xs text-slate-400">Clique para copiar cada campo</div></div>
      </div>
      <div id="pdf-address-fields" class="space-y-2"></div>
    </div>
  </div>`;
}

export function initEtapa3() {
  VIEWS.etapa3 = renderEtapa3;
  window._carregarPDF = carregarPDF;
  window._baixarPDF = baixarPDF;
  window._limparTudo = limparTudo;
  window._extrairEndereco = extrairEndereco;
  // Attach handlers in post-render hook
  window.after_etapa3 = () => {
    const b1 = document.getElementById('btn-baixar-pdf');
    const b2 = document.getElementById('btn-extrair-endereco');
    const b3 = document.getElementById('btn-limpar');
    if (b1) b1.addEventListener('click', baixarPDF);
    if (b2) b2.addEventListener('click', extrairEndereco);
    if (b3) b3.addEventListener('click', limparTudo);
  };
}

// ==================== carregarPDF ====================
async function carregarPDF(file) {
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) { toast('pdf.js nao carregado', '⚠️'); return; }
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    pdfState.fileBytes = bytes;
    pdfState.overlays = [];
    pdfState.pages = [];
    
    const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
    pdfState.pdfDoc = await loadingTask.promise;

    const viewer = document.getElementById('pdf-viewer');
    viewer.innerHTML = '';

    for (let i = 1; i <= pdfState.pdfDoc.numPages; i++) {
      const page = await pdfState.pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.4 });
      pdfState.pages.push({ pageNum: i, viewport });

      const wrap = document.createElement('div');
      wrap.className = 'pdf-canvas-wrap';
      wrap.dataset.page = i;
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      wrap.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      ((vp, w, pn) => {
        canvas.addEventListener('click', (e) => {
          if (e.target.closest('.pdf-overlay-text')) return;
          const r = canvas.getBoundingClientRect();
          pdfState.overlays.push({
            page: pn, x: (e.clientX - r.left) * vp.width / r.width,
            y: (e.clientY - r.top) * vp.height / r.height,
            text: '', size: 18, pageWidth: vp.width, pageHeight: vp.height
          });
          crearOverlay(w, pdfState.overlays.length - 1);
        });
      })(viewport, wrap, i);

      viewer.appendChild(wrap);
    }

    document.getElementById('pdf-toolbar').classList.remove('hidden');
    document.getElementById('pdf-page-count').textContent = `📄 ${pdfState.pdfDoc.numPages} pagina(s)`;
    toast(`PDF carregado! ${pdfState.pdfDoc.numPages} pagina(s)`);
  } catch (err) {
    console.error('carregarPDF:', err);
    toast('Erro ao carregar o PDF', '⚠️');
  }
}

// ==================== crearOverlay ====================
function crearOverlay(wrap, idx) {
  const ol = pdfState.overlays[idx];
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;

  const r = canvas.getBoundingClientRect();
  const scX = r.width / ol.pageWidth;
  const scY = r.height / ol.pageHeight;

  const div = document.createElement('div');
  div.className = 'pdf-overlay-text';
  div.setAttribute('contenteditable', 'true');
  div.textContent = 'Digite aqui...';
  div.style.left = (ol.x * scX) + 'px';
  div.style.top = (ol.y * scY) + 'px';
  div.style.fontSize = (ol.size * scX) + 'px';

  div.addEventListener('input', () => { ol.text = div.textContent; });

  let dragging = false, sx, sy, ox, oy;
  div.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('del')) return;
    sx = e.clientX; sy = e.clientY; ox = ol.x; oy = ol.y;
    div.setPointerCapture(e.pointerId); dragging = false;
  });
  div.addEventListener('pointermove', (e) => {
    if (!div.hasPointerCapture(e.pointerId)) return;
    if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) dragging = true;
    if (!dragging) return;
    ol.x = ox + (e.clientX - sx) / scX;
    ol.y = oy + (e.clientY - sy) / scY;
    div.style.left = (ol.x * scX) + 'px';
    div.style.top = (ol.y * scY) + 'px';
  });
  div.addEventListener('pointerup', (e) => {
    div.releasePointerCapture(e.pointerId);
    if (!dragging) { div.focus(); selectAll(div); }
  });

  const del = document.createElement('span');
  del.className = 'del'; del.textContent = '×';
  del.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    const pos = pdfState.overlays.indexOf(ol);
    if (pos !== -1) pdfState.overlays.splice(pos, 1);
    div.remove();
  });
  div.appendChild(del);
  wrap.appendChild(div);
  setTimeout(() => { div.focus(); selectAll(div); }, 100);
}

function selectAll(el) {
  const s = window.getSelection(); const r = document.createRange();
  r.selectNodeContents(el); s.removeAllRanges(); s.addRange(r);
}

function limparTudo() {
  if (!pdfState.overlays.length) { toast('Nada para limpar'); return; }
  if (confirm(`Remover ${pdfState.overlays.length} campos?`)) {
    pdfState.overlays.length = 0;
    document.querySelectorAll('.pdf-overlay-text').forEach(e => e.remove());
    toast('Limpo');
  }
}

// ==================== baixarPDF ====================
async function baixarPDF() {
  const PDFLib = window.PDFLib;
  if (!PDFLib) { toast('pdf-lib nao carregado', '⚠️'); return; }
  
  const bytes = pdfState.fileBytes;
  if (!bytes || !bytes.length) { toast('Carregue um PDF primeiro'); return; }

  try {
    toast('Gerando PDF...');
    // Create a copy to avoid any buffer detachment issues
    const copy = bytes.slice();
    const pdfDoc = await PDFLib.PDFDocument.load(copy);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    let drawn = 0;

    for (const ol of pdfState.overlays) {
      if (!ol.text || ol.page < 1 || ol.page > pages.length) continue;
      const page = pages[ol.page - 1];
      const { width, height } = page.getSize();
      const scX = width / ol.pageWidth;
      const scY = height / ol.pageHeight;
      page.drawText(ol.text, {
        x: ol.x * scX, y: height - (ol.y * scY) - (ol.size * scY * 0.8),
        size: ol.size * scY, font, color: PDFLib.rgb(0, 0, 0)
      });
      drawn++;
    }

    if (!drawn) { toast('Nenhum texto para salvar no PDF'); return; }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'documento-editado.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`PDF baixado com ${drawn} campo(s)!`);
  } catch (err) {
    console.error('baixarPDF:', err);
    toast('Erro: ' + (err.message || 'desconhecido'), '⚠️');
  }
}

// ==================== extrairEndereco ====================
async function extrairEndereco() {
  if (!pdfState.pdfDoc) { toast('Carregue um PDF primeiro'); return; }
  try {
    toast('Extraindo...');
    const parts = [];
    for (let i = 1; i <= pdfState.pdfDoc.numPages; i++) {
      const page = await pdfState.pdfDoc.getPage(i);
      const tc = await page.getTextContent();
      parts.push(tc.items.map(it => it.str).join(' '));
    }
    const full = parts.join('\n');
    const pat = {
      cep: /\b(\d{5}-?\d{3})\b/,
      logradouro: /(?:Rua|Avenida|Av\.?|Travessa|Praça|Alameda|Rodovia|Estrada)\s+([^,;\n]{3,60}?)(?:\s*,?\s*(?:,|\d|nº|n\.?|Bairro|CEP|$))/i,
      numero: /(?:nº?|n\.?|número)\s*(\d+[A-Za-z]?)/i,
      complemento: /(?:complemento|comp\.?|apto|apartamento|sala|andar)\s*:?\s*([^,;\n]{2,40})/i,
      bairro: /(?:Bairro)\s*([^,;\n\-]{3,40}?)(?:\s*[,\-]|\s*(?:CEP|Município|Cidade|$))/i,
      municipio: /(?:Município|Cidade)\s*(?::\s*|\s+)([^,;\n\-\/]{3,50}?)(?:\s*[,\-\/]|\s*(?:Estado|UF|CEP|$))/i,
      uf: /\b([A-Z]{2})\b(?=\s*(?:,|$|\d{5}|CEP|\n))/
    };
    const ex = {};
    for (const [k, r] of Object.entries(pat)) {
      const m = full.match(r); ex[k] = m ? m[1].trim() : '—';
    }
    if (ex.cep !== '—' && ex.cep.length === 8) ex.cep = ex.cep.slice(0,5)+'-'+ex.cep.slice(5);
    const fd = document.getElementById('pdf-address-fields');
    const labels = { cep:'CEP', logradouro:'Logradouro', numero:'Numero', complemento:'Complemento', bairro:'Bairro', municipio:'Municipio', uf:'UF' };
    if (fd) {
      fd.innerHTML = Object.entries(labels).map(([k,l]) => {
        const v = escapeHTML(ex[k]||'—');
        return `<div class="copy-row"><span class="key">${l}</span><span class="val">${v}</span><button class="btn-3d ghost sm" onclick="copyText('${v.replace(/'/g,"\\'")}','${l} copiado!')">📋</button></div>`;
      }).join('');
    }
    document.getElementById('pdf-address-results').classList.remove('hidden');
    const found = Object.values(ex).filter(v=>v!=='—').length;
    toast(found ? `${found} campos encontrados` : 'Nenhum endereco encontrado');
  } catch (err) { console.error(err); toast('Erro ao extrair', '⚠️'); }
}
