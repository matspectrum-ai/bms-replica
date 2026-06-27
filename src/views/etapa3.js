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
// TASK 2: OVERLAY SYSTEM — Draggable overlays, delete, overlay list
// =============================================================================

// =============================================================================
// rerenderOverlays() — Full DOM overlay creation + drag + delete
// Removes old overlay DOM, redraws all overlays from pdfState.overlays array
// Each overlay div: contentEditable, draggable (mouse+touch), delete button
// =============================================================================
function rerenderOverlays() {
  // Remove existing overlay DOM elements
  document.querySelectorAll('.pdf-overlay-text').forEach(el => el.remove());

  const viewer = document.getElementById('pdf-viewer');
  if (!viewer) return;

  // Create overlay div for each entry in pdfState.overlays
  pdfState.overlays.forEach((ol, idx) => {
    const wrap = viewer.querySelector(`.pdf-canvas-wrap[data-page="${ol.page}"]`);
    if (!wrap) return;

    const canvas = wrap.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / ol.pageWidth;
    const scaleY = rect.height / ol.pageHeight;

    // Create overlay div
    const div = document.createElement('div');
    div.className = 'pdf-overlay-text';
    div.contentEditable = 'true';
    div.textContent = ol.text;
    div.style.left = `${ol.x * scaleX}px`;
    div.style.top = `${ol.y * scaleY}px`;
    div.style.fontSize = `${ol.size * scaleX}px`;
    div.style.position = 'absolute';
    div.dataset.overlayIdx = idx;

    // Update state on text change (input event)
    div.addEventListener('input', () => {
      pdfState.overlays[idx].text = div.textContent;
      updateOverlayList();
    });

    // ---- Drag implementation (mouse) ----
    let dragging = false, startX, startY, origX, origY;
    div.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('overlay-del-btn')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = ol.x;
      origY = ol.y;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / scaleX;
      const dy = (e.clientY - startY) / scaleY;
      ol.x = origX + dx;
      ol.y = origY + dy;
      div.style.left = `${ol.x * scaleX}px`;
      div.style.top = `${ol.y * scaleY}px`;
    });
    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        updateOverlayList();
      }
    });

    // ---- Drag implementation (touch) ----
    div.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('overlay-del-btn')) return;
      dragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      origX = ol.x;
      origY = ol.y;
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const dx = (e.touches[0].clientX - startX) / scaleX;
      const dy = (e.touches[0].clientY - startY) / scaleY;
      ol.x = origX + dx;
      ol.y = origY + dy;
      div.style.left = `${ol.x * scaleX}px`;
      div.style.top = `${ol.y * scaleY}px`;
    });
    document.addEventListener('touchend', () => {
      if (dragging) {
        dragging = false;
        updateOverlayList();
      }
    });

    // Delete button (× in top-right corner)
    const delBtn = document.createElement('span');
    delBtn.className = 'overlay-del-btn del';
    delBtn.textContent = '×';
    delBtn.title = 'Remover este campo';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      pdfState.overlays.splice(idx, 1);
      rerenderOverlays();
    };
    div.appendChild(delBtn);

    wrap.appendChild(div);
  });

  updateOverlayList();
}

// =============================================================================
// updateOverlayList() — Refresh the #pdf-overlay-list panel
// Shows all overlays with page number, text preview, and per-item delete button
// =============================================================================
function updateOverlayList() {
  const list = document.getElementById('pdf-overlay-list');
  if (!list) return;

  if (pdfState.overlays.length === 0) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = pdfState.overlays.map((ol, i) => {
    const preview = (ol.text || 'Texto').slice(0, 30);
    return `<div class="copy-row" style="align-items:flex-start">
      <span class="key">Pág. ${ol.page}</span>
      <span class="val" style="flex:1">${escapeHTML(preview)}</span>
      <button class="btn-3d ghost sm" onclick="window.removerOverlay(${i})" style="color:#f87171;padding:2px 8px;font-size:12px">×</button>
    </div>`;
  }).join('');

  // Add bulk clear button when overlays exist
  if (pdfState.overlays.length > 0) {
    list.innerHTML += `<button class="btn-3d ghost sm mt-2" onclick="window.limparTudo()" style="color:#f87171;width:100%">🗑️ Limpar todos (${pdfState.overlays.length})</button>`;
  }
}

// =============================================================================
// removerOverlay(idx) — Remove a specific overlay by index
// Updates both the overlay DOM and the overlay list panel
// =============================================================================
function removerOverlay(idx) {
  pdfState.overlays.splice(idx, 1);
  rerenderOverlays();
  toast('Campo removido');
}

// =============================================================================
// adicionarTexto() — Add text overlay at center of last loaded page
// Works without requiring a canvas click (toolbar button)
// =============================================================================
function adicionarTexto() {
  if (!pdfState.pages.length) {
    toast('⚠️ Carregue um PDF primeiro');
    return;
  }
  const page = pdfState.pages[pdfState.pages.length - 1];
  pdfState.overlays.push({
    page: page.pageNum,
    x: page.viewport.width / 2 - 50,
    y: page.viewport.height / 2,
    text: 'Novo texto',
    size: 14,
    pageWidth: page.viewport.width,
    pageHeight: page.viewport.height
  });
  rerenderOverlays();
  toast('✅ Campo adicionado');
}

// =============================================================================
// limparTudo() — Clear all overlays with confirmation dialog
// =============================================================================
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

// =============================================================================
// STUBS for Task 3 features (implemented in next task)
// =============================================================================
function baixarPDF() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
}

function extrairEndereco() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
}

function aplicarEndereco() {
  toast('⚠️ Funcionalidade em desenvolvimento — Task 3');
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
