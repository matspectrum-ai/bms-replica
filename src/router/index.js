// src/router/index.js
// SPA Router — hash-free, history-free navigation (matches original RECON.md lines 286-305)
// Part of: Phase 02-03 (SPA Router + View Stubs)
//
// Design decisions per STATE.md:
// - ROUTES is a flat array of strings (not objects)
// - titles object lives INSIDE go() (not a separate export)
// - VIEWS functions are pure string generators with no side effects
// - ZERO History API usage
// - No duplicate-navigation guard

// =============================================================================
// ROUTES — Flat array of 8 route name strings
// Matches RECON.md §4.1 (line 284)
// =============================================================================
export const ROUTES = [
  'dashboard',
  'etapa1',
  'etapa2',
  'etapa3',
  'banco',
  'planilha',
  'config',
  'ajuda'
];

// =============================================================================
// VIEWS — Empty registry object
// Populated by view modules via init functions (Task 02-03-02)
// Each VIEWS[route] is a pure function () => HTML string
// Matches RECON.md §4.2 (line 307)
// =============================================================================
export const VIEWS = {};

// =============================================================================
// go(route) — 9-step navigation function
// Matches original exact trace from RECON.md §4.3 (lines 286-305)
//
// 1. Validate route against ROUTES array
// 2. Toggle .active on [data-route] nav-links
// 3. Lookup title/subtitle from hardcoded titles object
// 4. Update #page-title textContent
// 5. Update #page-subtitle textContent
// 6. Render view: #view.innerHTML = VIEWS[route]()
// 7. Scroll to top: window.scrollTo({top:0, behavior:'smooth'})
// 8. Close mobile sidebar: toggleSidebar(false)
// 9. Post-render hook: window['after_' + route]() if exists
// =============================================================================
export function go(route) {
  // Step 1: Validate — invalid routes default to 'dashboard'
  if (!ROUTES.includes(route)) route = 'dashboard';

  // Step 2: Nav-link active toggle
  // Remove .active from all [data-route] elements, add to the matching one
  document.querySelectorAll('[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Step 3: Title lookup
  // Hardcoded titles object INSIDE go() — NOT a separate export
  // Matches RECON.md lines 289-297 exactly
  const titles = {
    dashboard: ['🏠 Início',                'Bem-vindo, João Victor!'],
    etapa1:    ['🧬 Etapa 1 — Criar Site',   'Fluxo automático: CNPJ → Domínio → Meta → Site → Publicar'],
    etapa2:    ['📱 Etapa 2 — Comprar Número','SMS24h integrado para verificação Facebook'],
    etapa3:    ['📄 Etapa 3 — Editor PDF',   'Edite PDFs e mapeie campos do endereço'],
    banco:     ['💼 Banco de Empresas',      'Histórico de CNPJs consultados'],
    planilha:  ['📊 Planilha de Sites',      'Status de cada site publicado'],
    config:    ['⚙️ Configurações',          'Tokens e chaves de API'],
    ajuda:     ['❓ Ajuda',                  'Como cada parte funciona']
  };

  // Step 4: Update page title
  document.getElementById('page-title').textContent = titles[route][0];

  // Step 5: Update page subtitle
  document.getElementById('page-subtitle').textContent = titles[route][1];

  // Step 6: Render view content via VIEWS registry
  document.getElementById('view').innerHTML = VIEWS[route]();

  // Step 7: Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Step 8: Close mobile sidebar on navigation
  toggleSidebar(false);

  // Step 9: Post-render hook (used by Banco and Planilha in Phase 03)
  if (typeof window['after_' + route] === 'function') window['after_' + route]();
}

// =============================================================================
// toggleSidebar(open) — Opens/closes mobile sidebar overlay
// Matches original toggleSidebar() from RECON.md lines 252-255
//
// open=true:  Adds .open class to #sidebar and #backdrop (shows sidebar)
// open=false: Removes .open class (hides sidebar)
// =============================================================================
export function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('backdrop').classList.toggle('open', open);
}
