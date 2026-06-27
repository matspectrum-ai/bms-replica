// tests/test_visual.js
// VAL-01: Automated view structure comparison tests for all 8 views
// GREEN phase — full implementation
//
// Imports test-helpers.js (describe/it/assert/assertContains/summary)
// Accesses the router via window.go and window.toggleSidebar (exposed in main.js)
// Tests navigate through each view and assert structural properties per RECON.md.
//
// RECON.md cross-references are included in comments for each structural assertion.
// Tests run in-browser on the clone — they must execute AFTER main.js bootstraps.

import { describe, it, assert, assertContains } from './test-helpers.js';

// =============================================================================
// Bootstrap Guard — wait for window.go to be defined
// main.js is loaded as ES module; bootstrap may be async.
// =============================================================================
async function waitForBootstrap(maxWaitMs = 5000) {
  const start = Date.now();
  while (typeof window.go !== 'function') {
    if (Date.now() - start > maxWaitMs) {
      throw new Error('App bootstrap timed out — window.go not defined after ' + maxWaitMs + 'ms');
    }
    await new Promise(r => setTimeout(r, 100));
  }
}

// =============================================================================
// Safe navigation — wraps go(route) in try/catch, waits for DOM update
// =============================================================================
async function safeGo(route, waitMs = 100) {
  const viewEl = document.getElementById('view');
  window.go(route);
  // Allow DOM to update (go() is synchronous but some views have post-render hooks)
  await new Promise(r => setTimeout(r, waitMs));
  return viewEl.innerHTML;
}

// =============================================================================
// runVisualTests — Main entry point
// Resets test results, waits for bootstrap, runs all describe blocks, returns summary.
// =============================================================================
export async function runVisualTests() {
  // Wait for app bootstrap
  try {
    await waitForBootstrap();
  } catch (e) {
    console.error('❌ Bootstrap failed:', e.message);
    return { pass: 0, fail: 1, total: 1, error: e.message };
  }

  // ===========================================================================
  // Test Setup — import sanity
  // ===========================================================================
  describe('Test Infrastructure', () => {
    // RECON.md §4.4 — VIEWS registry populated by init functions
    it('window.go is defined', () => {
      assert(typeof window.go === 'function', 'window.go not defined — main.js may not have loaded');
    });
    it('window.toggleSidebar is defined', () => {
      assert(typeof window.toggleSidebar === 'function', 'window.toggleSidebar not defined');
    });
    it('#view container exists in DOM', () => {
      const viewEl = document.getElementById('view');
      assert(viewEl !== null, '#view element not found in DOM');
    });
    it('#sidebar exists in DOM', () => {
      const sidebar = document.getElementById('sidebar');
      assert(sidebar !== null, '#sidebar element not found in DOM');
    });
    it('#page-title exists in DOM', () => {
      const title = document.getElementById('page-title');
      assert(title !== null, '#page-title element not found in DOM');
    });
  });

  // ===========================================================================
  // Dashboard View — RECON.md §1.2.1 Dashboard KPI cards
  // ===========================================================================
  describe('Dashboard View', () => {
    let html = '';
    it('navigates to dashboard without error', async () => {
      let threw = false;
      try { html = await safeGo('dashboard'); } catch (e) { threw = true; }
      assert(!threw, 'go("dashboard") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Dashboard HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.2.1 — Dashboard has 4 KPI stat cards (icon-cube inside glass)
    it('has at least 4 stat cards (icon-cube elements)', () => {
      const icons = html.match(/icon-cube/g);
      assert(icons && icons.length >= 4, `Expected >=4 icon-cube elements, found ${icons ? icons.length : 0}`);
    });
    // Dashboard renders 6 quick-action cards via quickCard()
    it('has quick-action cards (glass divs with onclick)', () => {
      const cards = html.match(/onclick="go\('/g);
      assert(cards && cards.length >= 3, `Expected >=3 onclick="go(" navigation cards, found ${cards ? cards.length : 0}`);
    });
    // RECON.md §4 — header title updates
    it('updates #page-title to dashboard title', () => {
      const title = document.getElementById('page-title');
      assert(title && title.textContent.length > 0, '#page-title is empty after dashboard navigation');
      assertContains(title.textContent, 'Início', '#page-title does not contain "Início"');
    });
    // No orphaned error strings
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Etapa 1 View — RECON.md §1.3 Wizard, §1.3.1 Step 1 CNPJ
  // ===========================================================================
  describe('Etapa 1 View', () => {
    let html = '';
    it('navigates to etapa1 without error', async () => {
      let threw = false;
      try { html = await safeGo('etapa1'); } catch (e) { threw = true; }
      assert(!threw, 'go("etapa1") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Etapa 1 HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.3.1 — CNPJ input field with id e1_cnpj
    it('contains CNPJ input field (#e1_cnpj)', () => {
      assert(html.includes('e1_cnpj'), 'CNPJ input (#e1_cnpj) not found');
    });
    // RECON.md §1.3 — 5-step wizard with stepBox widget
    it('has at least 3 step indicators (stepBox or wizard cards)', () => {
      // stepBox renders numbered step cards with "✓" for completed steps
      // On initial load (no CNPJ), at least step 1 is rendered
      const steps = html.match(/step/g);
      assert(steps && steps.length >= 3, `Expected >=3 "step" references, found ${steps ? steps.length : 0}`);
    });
    // RECON.md §1.3.1 — "Buscar CNPJ" / "Buscar Empresa" button
    it('contains "Buscar Empresa" or "Buscar CNPJ" button', () => {
      const hasBuscar = html.includes('Buscar Empresa') || html.includes('Buscar CNPJ');
      assert(hasBuscar, 'CNPJ search button text not found');
    });
    it('updates #page-title to Etapa 1 title', () => {
      const title = document.getElementById('page-title');
      assertContains(title.textContent, 'Etapa 1', '#page-title does not contain "Etapa 1"');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Etapa 2 View — RECON.md §1.4 SMS Purchase
  // ===========================================================================
  describe('Etapa 2 View', () => {
    let html = '';
    it('navigates to etapa2 without error', async () => {
      let threw = false;
      try { html = await safeGo('etapa2'); } catch (e) { threw = true; }
      assert(!threw, 'go("etapa2") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Etapa 2 HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.4 — Country and service select dropdowns
    it('contains country selector (#sms-country)', () => {
      assert(html.includes('sms-country'), 'Country dropdown (#sms-country) not found');
    });
    it('contains service selector (#sms-service)', () => {
      assert(html.includes('sms-service'), 'Service dropdown (#sms-service) not found');
    });
    // RECON.md §1.4 — "Comprar Número" / buy button
    it('contains "Comprar Número" or purchase button', () => {
      const hasComprar = html.includes('Comprar Número') || html.includes('btn-buy');
      assert(hasComprar, 'Purchase button not found');
    });
    it('contains "Verificar Saldo" or balance check button', () => {
      const hasSaldo = html.includes('Verificar Saldo') || html.includes('Ver Saldo');
      assert(hasSaldo, 'Balance check button not found');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Etapa 3 View — RECON.md §1.5 PDF Editor
  // ===========================================================================
  describe('Etapa 3 View', () => {
    let html = '';
    it('navigates to etapa3 without error', async () => {
      let threw = false;
      try { html = await safeGo('etapa3'); } catch (e) { threw = true; }
      assert(!threw, 'go("etapa3") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Etapa 3 HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.5 — PDF file input (accept="application/pdf")
    it('contains PDF file input (accept="application/pdf")', () => {
      const hasFileInput = html.includes('application/pdf') || html.includes('type="file"');
      assert(hasFileInput, 'PDF file input not found — expected type="file" or application/pdf');
    });
    // RECON.md §1.5 — Toolbar with action buttons
    it('contains PDF toolbar (#pdf-toolbar)', () => {
      assert(html.includes('pdf-toolbar'), 'PDF toolbar (#pdf-toolbar) not found');
    });
    // At least one canvas-related element
    it('contains canvas or rendering area', () => {
      const hasCanvas = html.includes('canvas') || html.includes('pdf-viewer') || html.includes('pdf-canvas');
      assert(hasCanvas, 'Canvas or PDF rendering area not found');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Banco de Empresas View — RECON.md §1.6 Company Database
  // ===========================================================================
  describe('Banco de Empresas View', () => {
    let html = '';
    it('navigates to banco without error', async () => {
      let threw = false;
      try { html = await safeGo('banco'); } catch (e) { threw = true; }
      assert(!threw, 'go("banco") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Banco HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.6 — Search input for filtering companies
    it('contains search input (#filter-q)', () => {
      assert(html.includes('filter-q'), 'Search input (#filter-q) not found');
    });
    // RECON.md §1.6 — Capital range filter
    it('contains capital range filter (#filter-faixa)', () => {
      assert(html.includes('filter-faixa'), 'Capital range filter (#filter-faixa) not found');
    });
    // Company card container
    it('contains company cards container', () => {
      const hasGrid = html.includes('grid') || html.includes('empresa') || html.includes('Banco de Empresas');
      assert(hasGrid, 'Company card container not found');
    });
    it('updates #page-title to Banco title', () => {
      const title = document.getElementById('page-title');
      assertContains(title.textContent, 'Banco', '#page-title does not contain "Banco"');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Planilha View — RECON.md §1.7 Spreadsheet
  // ===========================================================================
  describe('Planilha View', () => {
    let html = '';
    it('navigates to planilha without error', async () => {
      let threw = false;
      try { html = await safeGo('planilha'); } catch (e) { threw = true; }
      assert(!threw, 'go("planilha") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Planilha HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.7 — Table element with site data
    it('contains a <table> element', () => {
      assert(html.includes('<table'), 'No <table> element found');
    });
    // RECON.md §1.7 — Export CSV button
    it('contains "Exportar CSV" button', () => {
      const hasExport = html.includes('Exportar CSV') || html.includes('exportarCSV');
      assert(hasExport, 'Export CSV button not found');
    });
    // Table should have header cells
    it('has at least 6 table columns (header cells)', () => {
      const thCount = (html.match(/<th/g) || []).length;
      assert(thCount >= 6, `Expected >=6 <th> elements for 8+ column table, found ${thCount}`);
    });
    it('updates #page-title to Planilha title', () => {
      const title = document.getElementById('page-title');
      assertContains(title.textContent, 'Planilha', '#page-title does not contain "Planilha"');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Config View — RECON.md §1.8 Settings
  // ===========================================================================
  describe('Config View', () => {
    let html = '';
    it('navigates to config without error', async () => {
      let threw = false;
      try { html = await safeGo('config'); } catch (e) { threw = true; }
      assert(!threw, 'go("config") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Config HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.8 — Token inputs are type="password" (masked)
    it('contains password input fields for API tokens', () => {
      const pwCount = (html.match(/type="password"/g) || []).length;
      assert(pwCount >= 1, `Expected >=1 password inputs, found ${pwCount}`);
    });
    // RECON.md §1.8 — Cloudflare token section
    it('contains "Cloudflare" token section', () => {
      const hasCF = html.includes('Cloudflare') || html.includes('cf_token');
      assert(hasCF, 'Cloudflare token section not found');
    });
    // RECON.md §1.8 — Backup/Restore buttons
    it('contains "Exportar Backup" or backup button', () => {
      const hasBackup = html.includes('Exportar Backup') || html.includes('exportarBackup');
      assert(hasBackup, 'Backup/Export button not found');
    });
    it('contains "Importar Backup" or import button', () => {
      const hasImport = html.includes('Importar Backup') || html.includes('importarBackup');
      assert(hasImport, 'Import/Restore button not found');
    });
    it('updates #page-title to Config title', () => {
      const title = document.getElementById('page-title');
      assertContains(title.textContent, 'Configura', '#page-title does not contain "Configura"');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Ajuda View — RECON.md §1.9 Help/Guide
  // ===========================================================================
  describe('Ajuda View', () => {
    let html = '';
    it('navigates to ajuda without error', async () => {
      let threw = false;
      try { html = await safeGo('ajuda'); } catch (e) { threw = true; }
      assert(!threw, 'go("ajuda") threw an error');
    });
    it('renders non-empty content (>100 chars)', () => {
      assert(html.length > 100, `Ajuda HTML too short: ${html.length} chars`);
    });
    // RECON.md §1.9 — 3 glass card guides
    it('has at least 3 glass cards (glass class divs)', () => {
      const glassCount = (html.match(/class="glass /g) || html.match(/class='glass /g) || []).length;
      assert(glassCount >= 3, `Expected >=3 .glass cards, found ${glassCount}`);
    });
    // RECON.md §1.9 — Ordered lists in guide cards
    it('contains <ol> (ordered list) elements in guide cards', () => {
      assert(html.includes('<ol'), 'No <ol> (ordered list) found in Ajuda view');
    });
    // RECON.md §1.9 — Emoji icons
    it('contains emoji icons in guide cards', () => {
      const emojiCount = (html.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
      assert(emojiCount >= 1, `Expected >=1 emoji icons, found ${emojiCount}`);
    });
    it('updates #page-title to Ajuda title', () => {
      const title = document.getElementById('page-title');
      assertContains(title.textContent, 'Ajuda', '#page-title does not contain "Ajuda"');
    });
    it('has no orphaned error strings in HTML', () => {
      assert(!html.includes('[object Object]'), 'HTML contains "[object Object]"');
      assert(!html.includes('undefined'), 'HTML contains "undefined"');
    });
  });

  // ===========================================================================
  // Cross-View Navigation Tests — RECON.md §4 Routes
  // ===========================================================================
  describe('Cross-View Navigation', () => {
    it('navigates all 8 routes in sequence without errors', async () => {
      const routes = ['dashboard', 'etapa1', 'etapa2', 'etapa3', 'banco', 'planilha', 'config', 'ajuda'];
      let errors = [];
      for (const r of routes) {
        try { await safeGo(r, 50); } catch (e) { errors.push(`${r}: ${e.message}`); }
      }
      assert(errors.length === 0, `Navigation errors on routes: ${errors.join('; ')}`);
    });

    it('sidebar toggle works (toggleSidebar(true) adds .open)', () => {
      const sidebar = document.getElementById('sidebar');
      window.toggleSidebar(true);
      assert(sidebar.classList.contains('open'), 'Sidebar does not have .open after toggleSidebar(true)');
      window.toggleSidebar(false);
    });

    it('sidebar toggle works (toggleSidebar(false) removes .open)', () => {
      const sidebar = document.getElementById('sidebar');
      window.toggleSidebar(true);
      window.toggleSidebar(false);
      assert(!sidebar.classList.contains('open'), 'Sidebar still has .open after toggleSidebar(false)');
    });

    // RECON.md §1.1.1 — Backdrop visibility tied to sidebar toggle
    it('backdrop gets .open class with sidebar toggle', () => {
      const backdrop = document.getElementById('backdrop');
      window.toggleSidebar(true);
      assert(backdrop.classList.contains('open'), 'Backdrop does not have .open after toggleSidebar(true)');
      window.toggleSidebar(false);
    });

    it('active nav-link follows navigation', async () => {
      await safeGo('etapa1', 50);
      const activeLink = document.querySelector('[data-route].active');
      assert(activeLink !== null, 'No active nav-link found');
      assert(activeLink.dataset.route === 'etapa1',
        `Expected active route "etapa1", got "${activeLink.dataset.route}"`);
    });

    // RECON.md §1.1.3 — header title updates on every route change
    it('header title updates for each route', async () => {
      const titleMap = {
        'dashboard': 'Início',
        'etapa1': 'Etapa 1',
        'etapa2': 'Etapa 2',
        'etapa3': 'Etapa 3',
        'banco': 'Banco',
        'planilha': 'Planilha',
        'config': 'Configura',
        'ajuda': 'Ajuda'
      };
      for (const [route, expected] of Object.entries(titleMap)) {
        await safeGo(route, 30);
        const title = document.getElementById('page-title');
        assertContains(title.textContent, expected,
          `After ${route}, #page-title "${title.textContent}" does not contain "${expected}"`);
      }
    });
  });

  // ===========================================================================
  // CSS Class Presence — RECON.md §1.1 DOM Shell, §6 CSS
  // ===========================================================================
  describe('CSS Class Presence', () => {
    // Run after navigation settles
    it('.sidebar class exists in DOM', () => {
      const sidebar = document.getElementById('sidebar');
      assert(sidebar.classList.contains('sidebar'), '#sidebar missing .sidebar class');
    });
    it('.backdrop class exists in DOM', () => {
      const backdrop = document.getElementById('backdrop');
      assert(backdrop.classList.contains('backdrop'), '#backdrop missing .backdrop class');
    });
    it('.nav-link elements exist', () => {
      const navLinks = document.querySelectorAll('.nav-link');
      assert(navLinks.length >= 8, `Expected >=8 .nav-link elements, found ${navLinks.length}`);
    });
    it('.glass elements exist in rendered content', () => {
      // After navigating to dashboard which has glass stat/quick cards
      const glassEls = document.querySelectorAll('.glass');
      assert(glassEls.length >= 1, `Expected >=1 .glass elements, found ${glassEls.length}`);
    });
  });

  // Return test summary
  return summary();
}
