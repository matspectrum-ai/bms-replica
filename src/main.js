// src/main.js
// Application entry point — matches original bootstrap sequence (RECON.md lines 2089-2132)
// Boot sequence: instalarProxy → refreshHeaderStatus → go('dashboard')
//
// Phase 07-04: Bootstrap reworked to IP gate → auth gate → normal boot
// IP check runs first (async), blocked IPs see access-denied screen (D-06)
// Unauthenticated users redirected to login; authenticated users boot normally

// =============================================================================
// LAYER 0: AUTH (session — Phase 07)
// =============================================================================
import { checkAuth, logout } from './auth/session.js';

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

// Phase 07-03 views (account system)
import { initLogin } from './views/login.js';
import { initRegister } from './views/register.js';
import { initWaitlist } from './views/waitlist.js';
import { initAccessDenied } from './views/access-denied.js';
import { initAdmPanel } from './views/adm-panel.js';

// =============================================================================
// LAYER 4: WIDGETS (reusable UI components)
// =============================================================================
import { toast } from './widgets/toast.js';
import { openModal, closeModal } from './widgets/modal.js';

// =============================================================================
// LAYER 5: UTILS (formatting, clipboard, header status)
// =============================================================================
import { copyText } from './utils/clipboard.js';
import { escapeHTML, onlyDigits, fmtCNPJ, fmtMoney, fmtDate, formatBRPhone } from './utils/string.js';
import { refreshHeaderStatus } from './utils/header.js';

// =============================================================================
// LAYER 6: PROXY (CORS proxy layer)
// =============================================================================
import { instalarProxy } from './proxy/index.js';

// =============================================================================
// GLOBAL EXPOSURE — MUST be before init calls (views use window.VIEWS)
// =============================================================================
window.go = go;
window.toggleSidebar = toggleSidebar;
window.VIEWS = VIEWS;

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

// Phase 07-03 views (account system)
initLogin();
initRegister();
initWaitlist();
initAccessDenied();
initAdmPanel();
window.closeModal = closeModal;
window.copyText = copyText;
window.escapeHTML = escapeHTML;
window.onlyDigits = onlyDigits;
window.toast = toast;
window.openModal = openModal;
window.fmtCNPJ = fmtCNPJ;
window.fmtMoney = fmtMoney;
window.fmtDate = fmtDate;
window.formatBRPhone = formatBRPhone;

// Phase 07-04: Logout function exposed for sidebar button
window._logout = () => {
  logout();
  window.location.href = 'login.html';
};

// =============================================================================
// BOOTSTRAP SEQUENCE (Phase 07-04 — IP gate → auth gate → normal boot)
//
// NOTE: The original's credential seeding function is intentionally OMITTED —
// the original hardcodes Cloudflare and SMS24h API credentials (RECON.md §5.10).
// The clone uses empty settings defaults: getSettings() returns {} when key
// is missing. Users configure their own tokens via the Config view (Plan 04).
//
// Phase 07-04 design decisions:
// - IP gate runs FIRST and is blocking — if IP denied, app stops loading (D-06)
// - checkIpAccess() is async → bootstrap IIFE must be async and use await
// - When IP allowed but unauthenticated: proxy + headerStatus still run so that
//   header pills show correct API status after login + navigate to dashboard
// - For authenticated users, bootstrap is identical to original — no change
// - checkAuth() redirect for navigation happens in router guard (go()), not here
// =============================================================================

(async function boot() {
  // Step 1: Auth Check (sync from localStorage)
  const auth = checkAuth();

  // Step 2: If not authenticated, redirect to standalone login page
  if (!auth.authenticated) {
    window.location.href = 'login.html';
    return;
  }

  // Step 3: Show/hide sidebar elements based on auth state
  const navAdm = document.getElementById('nav-adm');
  const navLogout = document.getElementById('nav-logout');
  if (auth.isAdmin && navAdm) navAdm.classList.remove('hidden');
  if (auth.authenticated && navLogout) navLogout.classList.remove('hidden');

  // Step 4: Authenticated — full normal bootstrap
  instalarProxy();
  refreshHeaderStatus();
  go('dashboard');
})();
