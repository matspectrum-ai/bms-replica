// src/main.js
// Application entry point — matches original bootstrap sequence (RECON.md lines 2089-2132)
// Boot sequence: instalarProxy → refreshHeaderStatus → go('dashboard')

// =============================================================================
// LAYER 1: STORES (localStorage persistence)
// =============================================================================
import { getDB, saveDB, getSettings, saveSettings } from './stores/data.js';

// =============================================================================
// LAYER 2: ROUTER (SPA navigation)
// =============================================================================
import { go, toggleSidebar, VIEWS } from './router/index.js';

// =============================================================================
// LAYER 3: VIEWS (stubs — functional views created in Phase 03)
// =============================================================================
import { initDashboard } from './views/dashboard.js';
import { initEtapa1 } from './views/etapa1.js';
import { initEtapa2 } from './views/etapa2.js';
import { initEtapa3 } from './views/etapa3.js';
import { initBanco } from './views/banco.js';
import { initPlanilha } from './views/planilha.js';
import { initConfig } from './views/config.js';
import { initAjuda } from './views/ajuda.js';

// =============================================================================
// LAYER 4: WIDGETS (reusable UI components)
// =============================================================================
import { toast } from './widgets/toast.js';
import { openModal, closeModal } from './widgets/modal.js';

// =============================================================================
// LAYER 5: UTILS (formatting, clipboard, header status)
// =============================================================================
import { copyText } from './utils/clipboard.js';
import { escapeHTML, onlyDigits } from './utils/string.js';
import { refreshHeaderStatus } from './utils/header.js';

// =============================================================================
// LAYER 6: PROXY (CORS proxy layer)
// =============================================================================
import { instalarProxy } from './proxy/index.js';

// =============================================================================
// POPULATE VIEWS REGISTRY
// Each init function assigns its route renderer to the VIEWS object.
// Matches original's progressive assignment pattern (RECON.md §4.4).
// =============================================================================
initDashboard();
initEtapa1();
initEtapa2();
initEtapa3();
initBanco();
initPlanilha();
initConfig();
initAjuda();

// =============================================================================
// GLOBAL EXPOSURE FOR INLINE onclick HANDLERS
// ES modules are module-scoped — inline onclick handlers in index.html
// require these functions on window. Matches original line 2128.
// 8 functions exposed: go, toggleSidebar, closeModal, copyText, escapeHTML,
// onlyDigits, toast, openModal
// =============================================================================
window.go = go;
window.toggleSidebar = toggleSidebar;
window.closeModal = closeModal;
window.copyText = copyText;
window.escapeHTML = escapeHTML;
window.onlyDigits = onlyDigits;
window.toast = toast;
window.openModal = openModal;

// =============================================================================
// BOOTSTRAP SEQUENCE
// Matches original lines 2089-2132 execution order.
//
// NOTE: The original's credential seeding function is intentionally OMITTED —
// the original hardcodes Cloudflare and SMS24h API credentials (RECON.md §5.10).
// The clone uses empty settings defaults: getSettings() returns {} when key
// is missing. Users configure their own tokens via the Config view (Plan 04).
// =============================================================================

// Step 1: Monkey-patch fetch for CORS proxy
// (skips on file:// protocol — RECON.md line 2113)
instalarProxy();

// Step 2: Update API status pills in header
refreshHeaderStatus();

// Step 3: Initial route render — loads Dashboard view
go('dashboard');
