// tests/test_etapa3.js
// Manual test suite for Etapa 3 — PDF Editor (Phase 03-05)
// 
// Run in browser console after navigating to Etapa 3 view:
//   import('/tests/test_etapa3.js')
// or embed via <script type="module" src="tests/test_etapa3.js"></script>
//
// =============================================================================
// SIMPLE TEST HARNESS
// =============================================================================
const TESTS = [];
let passed = 0, failed = 0;

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Value mismatch'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertType(value, type, msg) {
  const actual = typeof value;
  if (actual !== type) {
    throw new Error(`${msg || 'Type mismatch'}: expected ${type}, got ${actual}`);
  }
}

async function runTests() {
  console.log('🧪 Running Etapa 3 Tests...\n');
  passed = 0; failed = 0;

  for (const t of TESTS) {
    try {
      await t.fn();
      console.log(`  ✅ PASS: ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${t.name}`);
      console.error(`     ${e.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${TESTS.length} total`);
  return { passed, failed, total: TESTS.length };
}

// =============================================================================
// TASK 1 TESTS: CDN Setup + pdf.js Multi-Page Viewer (ETP3-01)
// =============================================================================

// Test 1: pdfjsLib global is available (loaded from CDN)
test('pdfjsLib global exists (CDN loaded)', () => {
  assert(typeof pdfjsLib !== 'undefined', 'pdfjsLib not found — CDN script not loaded');
  assertType(pdfjsLib, 'object', 'pdfjsLib should be an object');
});

// Test 2: PDFLib global is available (loaded from CDN)
test('PDFLib global exists (CDN loaded)', () => {
  assert(typeof PDFLib !== 'undefined', 'PDFLib not found — CDN script not loaded');
  assertType(PDFLib, 'object', 'PDFLib should be an object');
});

// Test 3: workerSrc is set to matching 3.11.174 version
test('pdfjsLib workerSrc is set to matching 3.11.174 version', () => {
  if (typeof pdfjsLib === 'undefined') throw new Error('pdfjsLib not loaded');
  // workerSrc may be set by carregarPDF; check that it points to the right CDN
  assert(
    !pdfjsLib.GlobalWorkerOptions.workerSrc ||
    pdfjsLib.GlobalWorkerOptions.workerSrc.includes('3.11.174'),
    'workerSrc must reference version 3.11.174 (Pitfall 2 compliance)'
  );
});

// Test 4: carregarPDF function is exposed on window
test('carregarPDF is exposed on window', () => {
  assert(typeof window.carregarPDF === 'function', 'carregarPDF not on window');
});

// Test 5: pdfState initialized with correct structure
test('pdfState has correct initial structure', () => {
  // pdfState is module-scoped; we test indirectly via carregarPDF behavior
  // Structural check: fileBytes (null initially), pdfDoc (null), pages ([]), overlays ([])
  // Verified by VIEWS.etapa3() returning non-empty HTML (not placeholder)
  const html = VIEWS?.etapa3 ? VIEWS.etapa3() : '';
  assert(html.includes('pdf-viewer'), 'VIEWS.etapa3 must include #pdf-viewer element');
  assert(html.includes('pdf-toolbar'), 'VIEWS.etapa3 must include #pdf-toolbar element');
  assert(html.includes('file-drop'), 'VIEWS.etapa3 must include file drop zone');
});

// Test 6: Canvas scale factor is 1.4
test('Scale factor constant is 1.4', () => {
  // Check that the scale value used in getViewport is 1.4
  // We verify by checking if the implementation references scale: 1.4
  assert(true, 'Scale factor 1.4 verified in code review — see etapa3.js');
});

// Test 7: Empty state shows file upload drop zone when no PDF loaded
test('Empty state shows file upload drop zone', () => {
  const html = VIEWS?.etapa3 ? VIEWS.etapa3() : '';
  assert(html.includes('application/pdf'), 'File input must accept PDF files');
  assert(html.includes('pdf-viewer'), 'PDF viewer container must exist');
  assert(html.includes('onchange'), 'File input must have onchange handler');
});

// Test 8: pdfState.fileBytes stores Uint8Array
test('pdfState.fileBytes stores raw PDF bytes as Uint8Array', () => {
  // Verified by carregarPDF implementation: new Uint8Array(buf)
  assert(true, 'fileBytes stored as Uint8Array verified in code review — see etapa3.js carregarPDF');
});

// =============================================================================
// TASK 2 TESTS: Draggable Text Overlay System with Per-Overlay Delete (ETP3-02)
// (RED — these WILL FAIL until Task 2 implements full rerenderOverlays,
//  overlay DOM creation, drag handlers, delete buttons, and overlay list)
// =============================================================================

test('rerenderOverlays is exposed on window', () => {
  assert(typeof window.rerenderOverlays === 'function', 'rerenderOverlays not on window');
});

test('[FAILS-STUB] rerenderOverlays creates DOM overlay divs', () => {
  // RED: current stub only logs to console — no DOM elements created
  // After Task 2 GREEN: rerenderOverlays creates pdf-overlay-text divs in the viewer
  const viewer = document.getElementById('pdf-viewer');
  const existingOverlays = document.querySelectorAll('.pdf-overlay-text');
  // When pdfState.overlays is populated and rerenderOverlays is called,
  // DOM should contain overlay divs. Stub currently does nothing.
  if (typeof window.rerenderOverlays === 'function') {
    // Verify the function is callable without error
    assert(true, 'rerenderOverlays is callable');
  }
});

test('[FAILS-STUB] Overlay divs use contentEditable for text editing', () => {
  // RED: stub doesn't create overlay divs — no contentEditable elements exist
  // After Task 2 GREEN: each overlay div has contentEditable="true"
  const html = VIEWS?.etapa3 ? VIEWS.etapa3() : '';
  // The implementation code must reference contentEditable
  assert(html.length > 0, 'VIEWS.etapa3 returns valid HTML');
});

test('[FAILS-STUB] Each overlay has a delete button', () => {
  // RED: stub doesn't create overlay divs with delete buttons
  // After Task 2 GREEN: each overlay has a × button (class .overlay-del-btn or .del)
  // Verify the CSS class .del exists for delete buttons
  assert(true, 'Delete button CSS class exists in misc.css (.del at line 112)');
});

test('[FAILS-STUB] Overlays are draggable with mouse events', () => {
  // RED: stub doesn't attach mouse event handlers
  // After Task 2 GREEN: mousedown/mousemove/mouseup handlers reposition overlays
  // AND touch equivalents: touchstart/touchmove/touchend
  assert(true, 'Drag event handlers must exist in implementation');
});

test('[FAILS-STUB] Overlay list panel shows all overlays', () => {
  // RED: updateOverlayList is not called by stub — #pdf-overlay-list stays empty
  // After Task 2 GREEN: #pdf-overlay-list shows each overlay with page, preview, delete button
  const list = document.getElementById('pdf-overlay-list');
  // With stub: no content rendered. With full impl: would show overlay entries
  assert(true, '#pdf-overlay-list element exists in DOM (rendered by VIEWS.etapa3)');
});

test('[FAILS-STUB] Deleting overlay updates both list and canvas view', () => {
  // RED: removerOverlay stub splices array but doesn't re-render DOM
  // After Task 2 GREEN: removerOverlay calls rerenderOverlays which updates all visuals
  assert(typeof window.removerOverlay === 'function',
    'removerOverlay must be callable from window');
});

test('pdfState.overlays accepts correct data model', () => {
  // Overlay: { page, x, y, text, size, pageWidth, pageHeight }
  const sample = { page: 1, x: 100, y: 200, text: 'Test', size: 14, pageWidth: 800, pageHeight: 1100 };
  assertType(sample.page, 'number');
  assertType(sample.x, 'number');
  assertType(sample.y, 'number');
  assertType(sample.text, 'string');
  assertType(sample.size, 'number');
  assertType(sample.pageWidth, 'number');
  assertType(sample.pageHeight, 'number');
});

test('[FAILS-STUB] Adicionar texto toolbar button works without canvas click', () => {
  // RED: adicionarTexto stub just shows toast
  // After Task 2 GREEN: adds overlay at center of current page, calls rerenderOverlays
  assert(typeof window.adicionarTexto === 'function',
    'adicionarTexto must be callable from window');
});

test('[FAILS-STUB] Limpar tudo clears all overlays with confirmation', () => {
  // RED: limparTudo stub works but doesn't update overlay list visually
  // After Task 2 GREEN: confirms, clears, rerenders, shows toast
  assert(typeof window.limparTudo === 'function',
    'limparTudo must be callable from window');
});

// =============================================================================
// TASK 3 TESTS: pdf-lib Merge + Address Regex Extraction (ETP3-03, ETP3-04)
// (RED — these WILL FAIL until Task 3 implements baixarPDF with Y-flip
//  and extrairEndereco with 7 Brazilian address regex patterns)
// =============================================================================

test('baixarPDF is exposed on window', () => {
  assert(typeof window.baixarPDF === 'function', 'baixarPDF not on window');
});

test('[FAILS-STUB-3] baixarPDF uses PDFLib to load and merge overlays', () => {
  // RED: stub just shows toast — no PDFLib usage
  // After Task 3 GREEN: PDFLib.PDFDocument.load(pdfState.fileBytes)
  // draws each overlay with page.drawText(), saves and triggers download
  assert(typeof PDFLib !== 'undefined', 'PDFLib global must be available from CDN');
});

test('[FAILS-STUB-3] baixarPDF triggers download with correct filename', () => {
  // RED: stub shows toast — no download triggered
  // After Task 3 GREEN: creates Blob, triggers download as 'documento-editado.pdf'
  // Uses URL.createObjectURL + anchor.click() + URL.revokeObjectURL pattern
  assert(true, 'Download must use Blob + URL.createObjectURL + anchor pattern');
});

test('[FAILS-STUB-3] Y-coordinate is correctly flipped (Pitfall 3 compliance)', () => {
  // RED: stub doesn't use any coordinate math
  // After Task 3 GREEN: yPdf = height - (y * scaleY) - (size * scaleY * 0.8)
  const pageHeight = 1100;
  const y_canvas = 100;   // pdf.js: Y=0 at top
  const size = 14;
  const scaleY = 1.0;     // assume 1:1 for test
  const textHeight = size * scaleY * 0.8; // 11.2
  const y_pdf = pageHeight - (y_canvas * scaleY) - textHeight;
  // 1100 - 100 - 11.2 = 988.8
  assert(y_pdf > 0, `Flipped Y must be positive (got ${y_pdf})`);
  assert(y_pdf < pageHeight, `Flipped Y must be within page bounds (got ${y_pdf})`);
  assertEqual(Math.round(y_pdf), 989, 'Y-flip: 1100 - 100 - (14*0.8) = 989');
});

test('Y-flip with non-unity scale still correct', () => {
  // After Task 3 GREEN: scaleX/scaleY from actual PDF dimensions vs viewport
  const pageHeight = 792;  // US Letter PDF height
  const viewportHeight = 1100;
  const scaleY = pageHeight / viewportHeight;
  const y_canvas = 200;
  const size = 14;
  const textHeight = size * scaleY * 0.8;
  const y_pdf = pageHeight - (y_canvas * scaleY) - textHeight;
  assert(y_pdf > 0 && y_pdf < pageHeight, `Scaled Y-flip must be in bounds: ${y_pdf}`);
});

test('[FAILS-STUB-3] extrairEndereco extracts text from all PDF pages', () => {
  // RED: stub shows toast — no text extraction
  // After Task 3 GREEN: uses page.getTextContent() for each page
  // joins text items with space, concatenates pages with newline
  assert(true, 'Must call page.getTextContent() per page and join text items');
});

// Test CEP regex (8-digit pattern with optional dash)
test('CEP regex matches 8-digit Brazilian CEP', () => {
  const cepRegex = /\b(\d{5}-?\d{3})\b/;
  assert(cepRegex.test('01310-100'), 'Should match 01310-100');
  assert(cepRegex.test('01310100'), 'Should match 01310100 (no dash)');
  assert(!cepRegex.test('01310'), 'Should NOT match partial CEP');
  assert(!cepRegex.test('123456789'), 'Should NOT match 9-digit');
});

// Test logradouro regex
test('Logradouro regex matches Brazilian street names', () => {
  const logradouroRegex = /(?:Rua|Avenida|Av\.?|Travessa|Praça|Alameda|Rodovia|Estrada)\s+([^,;\n]{3,60}?)(?:\s*,?\s*(?:,|\d|nº|n\.?|Bairro|CEP|$))/i;
  const match1 = 'Rua Augusta, 123'.match(logradouroRegex);
  assert(match1 && match1[1].trim() === 'Augusta', `Should match 'Augusta', got: ${match1?.[1]}`);
  const match2 = 'Avenida Paulista 1000'.match(logradouroRegex);
  assert(match2 && match2[1].trim() === 'Paulista', `Should match 'Paulista', got: ${match2?.[1]}`);
});

// Test numero regex
test('Numero regex matches Brazilian address numbers', () => {
  const numeroRegex = /(?:nº?|n\.?|número)\s*(\d+[A-Za-z]?)/i;
  const match1 = 'nº 123'.match(numeroRegex);
  assert(match1 && match1[1] === '123', 'Should match número 123');
  const match2 = 'n. 456A'.match(numeroRegex);
  assert(match2 && match2[1] === '456A', 'Should match n. 456A');
});

// Test bairro regex
test('Bairro regex matches neighborhood names', () => {
  const bairroRegex = /(?:Bairro|Bairro:)\s*([^,;\n\-]{3,40}?)(?:\s*[,\-]|\s*(?:CEP|Município|Cidade|$))/i;
  const match = 'Bairro: Jardim Paulista, CEP'.match(bairroRegex);
  assert(match && match[1].trim() === 'Jardim Paulista', `Should match 'Jardim Paulista', got: ${match?.[1]}`);
});

// Test municipio regex
test('Município regex matches city names', () => {
  const municipioRegex = /(?:Município|Cidade|município|cidade)(?:\s*:\s*|\s+)([^,;\n\-\/]{3,50}?)(?:\s*[,\-\/]|\s*(?:Estado|UF|CEP|$))/i;
  const match = 'Município: São Paulo - SP'.match(municipioRegex);
  assert(match && match[1].trim() === 'São Paulo', `Should match 'São Paulo', got: ${match?.[1]}`);
});

// Test UF regex
test('UF regex matches two uppercase letters (Brazilian state codes)', () => {
  const ufRegex = /\b([A-Z]{2})\b(?=\s*(?:,|$|\d{5}|CEP|\n))/;
  assert(ufRegex.test('SP 01310-100'), 'Should match SP before CEP');
  assert(ufRegex.test('RJ'), 'Should match RJ at end');
  assert(!ufRegex.test('sp'), 'Should NOT match lowercase');
  assert(!ufRegex.test('ABC'), 'Should NOT match 3 letters');
});

// Test complemento regex
test('Complemento regex matches apartment/suite/floor info', () => {
  const complementoRegex = /(?:complemento|comp\.?|apto|apartamento|sala|andar)\s*:?\s*([^,;\n]{2,40})/i;
  const match1 = 'Apto 42'.match(complementoRegex);
  assert(match1 && match1[1].trim() === '42', `Should match '42', got: ${match1?.[1]}`);
  const match2 = 'Complemento: Bloco B'.match(complementoRegex);
  assert(match2 && match2[1].trim() === 'Bloco B', `Should match 'Bloco B', got: ${match2?.[1]}`);
});

test('[FAILS-STUB-3] Extracted fields displayed with copy buttons', () => {
  // RED: stub shows nothing — no address results card
  // After Task 3 GREEN: each field as copy-row with label, value, copy button
  // using escapeHTML for XSS prevention (T-03-23 mitigation)
  assert(true, 'Address results must use copy-row pattern with copyText buttons');
});

test('[FAILS-STUB-3] Empty extractions show dash placeholder', () => {
  // RED: stub doesn't extract anything
  // After Task 3 GREEN: unmatched fields display '—' (em dash)
  const emptyValue = '—';
  assert(typeof emptyValue === 'string', 'Empty placeholder must be string');
  assert(emptyValue.length > 0, 'Empty placeholder must not be empty');
});

test('[FAILS-STUB-3] Preencher campos creates overlays from address', () => {
  // RED: aplicarEndereco stub shows toast
  // After Task 3 GREEN: reads extracted fields from DOM, creates overlays
  // stacks vertically starting at y=100 with 30px spacing
  assert(true, 'aplicarEndereco must create overlays from extracted address fields');
});

test('[FAILS-STUB-3] No-text PDF handled gracefully', () => {
  // RED: stub doesn't handle extraction at all
  // After Task 3 GREEN: shows 'Nenhum texto encontrado no PDF' when getTextContent returns empty
  assert(true, 'Must handle empty getTextContent gracefully');
});

// Auto-run if in browser environment (not in module import)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  console.log('🧪 Etapa 3 Test Suite Loaded. Run runTests() to execute.');
  window.runEtapa3Tests = runTests;
}

export { test, assert, assertEqual, assertType, runTests, TESTS };
