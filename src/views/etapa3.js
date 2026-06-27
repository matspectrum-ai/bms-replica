// src/views/etapa3.js
// Etapa 3 — PDF Editor (Phase 03-05)
// Task 1: CDN Setup + pdf.js Multi-Page Viewer (ETP3-01)
// Replaces 17-line stub with PDF rendering via pdf.js 3.11.174
// Matches RESEARCH.md Patterns 7 (CDN Lazy Loading), §PDF.js Integration

import { VIEWS } from '../router/index.js';
import { escapeHTML } from '../utils/string.js';
import { toast } from '../widgets/toast.js';

// =============================================================================
// PDF Editor Module State
// Matches RESEARCH.md lines 488-541
// =============================================================================
let pdfState = {
  fileBytes: null,       // Uint8Array — raw PDF bytes for pdf-lib merge
  pdfDoc: null,          // pdf.js document object
  pages: [],             // [{pageNum, viewport}] — page metadata
  overlays: []           // [{page, x, y, text, size, pageWidth, pageHeight}]
};

// =============================================================================
// VIEW RENDERER — Registered in VIEWS.etapa3
// Called by go('etapa3') via main.js → initEtapa3()
// =============================================================================
function renderEtapa3() {
  return `<div class="space-y-6">
    <!-- Header Card -->
    <div class="glass rounded-2xl p-6 flex items-center gap-4">
      <div class="icon-cube green" style="width:64px;height:64px;font-size:32px;flex-shrink:0">📄</div>
      <div>
        <h2 class="font-display text-2xl">Etapa 3 — Editor PDF</h2>
        <p class="text-slate-400 mt-1">Carregue, edite e baixe PDFs com campos de endereço mapeados</p>
      </div>
    </div>

    <!-- Toolbar (hidden until PDF is loaded) -->
    <div id="pdf-toolbar" class="hidden glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <span id="pdf-page-count" class="text-sm font-bold text-indigo-300 mr-2"></span>
      <button class="btn-3d ghost sm" onclick="window.adicionarTexto()">➕ Adicionar texto</button>
      <button class="btn-3d ghost sm" onclick="window.baixarPDF()">📥 Baixar PDF</button>
      <button class="btn-3d ghost sm" onclick="window.extrairEndereco()">📝 Extrair Endereço</button>
      <button class="btn-3d ghost sm" onclick="window.limparTudo()" style="color:#f87171">🗑️ Limpar tudo</button>
    </div>

    <!-- PDF Viewer Area -->
    <div id="pdf-viewer" class="space-y-4">
      <div class="file-drop" onclick="document.getElementById('pdf-file-input').click()">
        <div style="font-size:48px;margin-bottom:12px">📁</div>
        <div class="font-bold text-lg">Clique para selecionar um PDF</div>
        <div class="text-slate-400 mt-1">Ou arraste e solte o arquivo aqui</div>
        <input type="file" id="pdf-file-input" accept="application/pdf" onchange="window.carregarPDF(this.files[0])" style="display:none">
      </div>
    </div>

    <!-- Address Extraction Results (hidden until extraction — Task 3) -->
    <div id="pdf-address-results" class="hidden glass rounded-2xl p-6 space-y-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="icon-cube purple" style="width:40px;height:40px;font-size:18px;flex-shrink:0">📍</div>
        <div>
          <div class="font-display font-bold">Endereço Extraído</div>
          <div class="text-xs text-slate-400">Clique para copiar cada campo</div>
        </div>
      </div>
      <div id="pdf-address-fields" class="space-y-2"></div>
      <button class="btn-3d ghost sm" onclick="window.aplicarEndereco()">📝 Preencher campos no PDF</button>
    </div>

    <!-- Overlay List (Task 2) -->
    <div id="pdf-overlay-list" class="space-y-2"></div>
  </div>`;
}

// =============================================================================
// carregarPDF(file) — Load and render PDF via pdf.js 3.11.174
// Exposed to window for inline onchange handler
// Matches RESEARCH.md lines 488-541
// =============================================================================
async function carregarPDF(file) {
  // Library availability check
  if (typeof pdfjsLib === 'undefined') {
    toast('❌ pdf.js não foi carregado. Recarregue a página.', '⚠️');
    return;
  }

  // Pitfall 2 compliance: pin worker to matching version 3.11.174
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  try {
    // Read file as ArrayBuffer and store raw bytes for pdf-lib merge (Task 3)
    const buf = await file.arrayBuffer();
    pdfState.fileBytes = new Uint8Array(buf);

    // Reset state
    pdfState.overlays = [];
    pdfState.pages = [];

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfState.fileBytes });
    pdfState.pdfDoc = await loadingTask.promise;

    // Clear viewer and render each page as canvas at scale 1.4
    const viewer = document.getElementById('pdf-viewer');
    viewer.innerHTML = '';

    for (let i = 1; i <= pdfState.pdfDoc.numPages; i++) {
      const page = await pdfState.pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.4 });
      pdfState.pages.push({ pageNum: i, viewport });

      // Create page wrapper
      const wrap = document.createElement('div');
      wrap.className = 'pdf-canvas-wrap';
      wrap.dataset.page = i;

      // Create canvas at viewport dimensions
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      wrap.appendChild(canvas);

      // Render page to canvas
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Click handler: add text overlay at click position (overlay rendering in Task 2)
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = viewport.width / rect.width;
        const scaleY = viewport.height / rect.height;
        pdfState.overlays.push({
          page: i,
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
          text: 'Texto',
          size: 14,
          pageWidth: viewport.width,
          pageHeight: viewport.height
        });
        rerenderOverlays(); // stub in Task 1, full impl in Task 2
      });

      viewer.appendChild(wrap);
    }

    // Show toolbar with page count
    document.getElementById('pdf-toolbar').classList.remove('hidden');
    document.getElementById('pdf-page-count').textContent =
      `📄 ${pdfState.pdfDoc.numPages} página(s) — escala 1.4`;
    toast(`✅ PDF carregado! ${pdfState.pdfDoc.numPages} página(s)`);

  } catch (err) {
    console.error('Erro ao carregar PDF:', err);
    toast('❌ Erro ao carregar o PDF. Verifique o arquivo.', '⚠️');
  }
}

// =============================================================================
// rerenderOverlays() — STUB (full implementation in Task 2)
// Task 1: only logs overlay count; canvas click pushes to pdfState.overlays
// Task 2: creates DOM overlay elements, drag handlers, delete buttons
// =============================================================================
function rerenderOverlays() {
  // STUB — will be fully implemented in Task 2
  // For now, just indicate overlay state is being tracked
  if (pdfState.overlays.length > 0) {
    console.log(`📝 ${pdfState.overlays.length} overlay(s) no estado`);
  }
}

// =============================================================================
// STUBS for Task 2/3 buttons (placeholders until implemented)
// =============================================================================
function adicionarTexto() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 2');
}

function limparTudo() {
  if (!pdfState.overlays.length) {
    toast('⚠️ Nenhum campo para remover');
    return;
  }
  if (confirm(`Remover todos os ${pdfState.overlays.length} campos?`)) {
    pdfState.overlays = [];
    rerenderOverlays();
    toast('🗑️ Todos os campos removidos');
  }
}

function baixarPDF() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
}

function extrairEndereco() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
}

function aplicarEndereco() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
}

function removerOverlay(idx) {
  // Stub — full impl in Task 2
  pdfState.overlays.splice(idx, 1);
  rerenderOverlays();
}

// =============================================================================
// INIT + EXPORTS
// =============================================================================

// Register view renderer in the VIEWS registry
export function initEtapa3() {
  VIEWS.etapa3 = renderEtapa3;
}

// Window exports for inline onclick handlers
window.carregarPDF = carregarPDF;
window.rerenderOverlays = rerenderOverlays;
window.removerOverlay = removerOverlay;
window.adicionarTexto = adicionarTexto;
window.limparTudo = limparTudo;
window.baixarPDF = baixarPDF;
window.extrairEndereco = extrairEndereco;
window.aplicarEndereco = aplicarEndereco;
