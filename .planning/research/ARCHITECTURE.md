# Architecture Research

**Domain:** Building Management System (BMS) Dashboard — client-side SPA with reverse-engineering workflow
**Researched:** 2026-06-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

The target system at laboratoriodebms.netlify.app is a **vanilla JavaScript SPA** (~2135 lines in a single HTML file) with no framework. The replica will be modularized into a layered architecture preserving identical behavior while enabling clean separation for the two-phase workflow (clone → rebrand).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (Phase 2: rebrand target)      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  styles/ │  │  fonts/  │  │  icons/  │  │  assets/ │  │  themes/ │ │
│  │  CSS     │  │  Google  │  │  Phosphor│  │  logos   │  │  dark/   │ │
│  │  vars    │  │  Poppins │  │  Icons   │  │  images  │  │  light   │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
├───────┴────────────────────────────────────────────────────────────────┤
│                        VIEW LAYER                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────────┐ │
│  │ Layout         │  │ Page Views     │  │ Shared Widgets            │ │
│  │ Sidebar        │  │ Dashboard      │  │ KpiCard, DataTable        │ │
│  │ Header         │  │ Equipment      │  │ ChartWrapper, StatusPill  │ │
│  │ ContentArea    │  │ Alarms         │  │ ToastContainer, Modal     │ │
│  │                │  │ Reports        │  │ ToggleSwitch, Slider      │ │
│  │                │  │ Settings       │  │ ThemeProvider             │ │
│  └───────┬────────┘  └───────┬────────┘  └─────────────┬─────────────┘ │
├──────────┴───────────────────┴─────────────────────────┴───────────────┤
│                        STATE LAYER                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────────┐ │
│  │ Router         │  │ Data Store     │  │ UI Store                   │ │
│  │ ROUTES[]       │  │ sensors[]      │  │ theme, sidebarOpen         │ │
│  │ go(route)      │  │ equipment[]    │  │ toastQueue                 │ │
│  │ VIEWS{}        │  │ alarms[]       │  │ modalState                 │ │
│  │ activeRoute    │  │ user           │  │ filters, sort              │ │
│  └───────┬────────┘  └───────┬────────┘  └─────────────┬─────────────┘ │
├──────────┴───────────────────┴─────────────────────────┴───────────────┤
│                        SERVICE LAYER                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────────┐ │
│  │ Mock Data Gen  │  │ API Services   │  │ Persistence                 │ │
│  │ createSensor() │  │ cloudflareApi  │  │ localStorage (getDB/saveDB) │ │
│  │ updateValues() │  │ smsApi         │  │ sessionStorage              │ │
│  │ setInterval()  │  │ brasilApi      │  │ export/import               │ │
│  └────────────────┘  └────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Router** | Maps URL hash/route → view render, updates nav active state, preserves scroll | `Router` class with `go(route)`, `ROUTES[]`, `views{}` |
| **DataStore** | Single source of truth for all business data (sensors, equipment, alarms, user) | Singleton with subscribe/unsubscribe observer pattern |
| **UiStore** | Transient UI state (theme, sidebar toggle, toast queue, modals, filters) | Lightweight singleton, no persistence except theme preference |
| **DataService** | Generates mock sensor/equipment data, simulates real-time updates via setInterval | Factory functions per data model, seeded random for reproducibility |
| **Persistence** | localStorage read/write with same key structure as original for clone parity | `getDB()`, `saveDB()` wrappers; export/import JSON backup |
| **View Functions** | Render HTML strings for each route (Dashboard, Equipment, Alarms, etc.) | Pure functions returning template strings, called by router |
| **Shared Widgets** | Reusable UI components (KPI card, data table, chart wrapper, toast, modal) | Factory functions taking config → returning HTML string + DOM setup |
| **ThemeProvider** | Applies CSS custom properties, swaps font links, manages dark/light mode | CSS-in-JS injection or `<style>` element manipulation |
| **Layout** | Structural UI (Sidebar, Header, ContentArea) that persists across route changes | Static DOM elements in index.html, updated imperatively |

## Recommended Project Structure

```
bms-replica/
├── index.html                  # Shell HTML: sidebar, header, content area, modals
├── package.json                # Vite + dev dependencies
├── vite.config.js              # ES module bundling, Tailwind plugin
├── tailwind.config.js          # Design tokens, brand colors
│
├── src/
│   ├── main.js                 # App bootstrap: init stores, router, first render
│   │
│   ├── router/
│   │   ├── index.js            # Router class: go(), getRoute(), navigate()
│   │   └── routes.js           # ROUTES[] array: {name, path, title, subtitle, icon}
│   │
│   ├── views/                  # Page-level view functions (one per route)
│   │   ├── Dashboard.js        # KPI cards grid, system status overview
│   │   ├── Equipment.js        # Equipment list, controls (on/off, setpoints)
│   │   ├── Alarms.js           # Alarm table, threshold config, notification history
│   │   ├── Reports.js          # Charts, energy consumption, export
│   │   └── Settings.js         # User preferences, thresholds, profile
│   │
│   ├── widgets/                # Reusable shared UI components
│   │   ├── KpiCard.js          # Stat card: icon, label, value, trend indicator
│   │   ├── DataTable.js        # Table with sort, filter, pagination
│   │   ├── ChartWrapper.js     # Chart container with loading state, resize observer
│   │   ├── StatusPill.js       # Badge: online/offline/warning/critical
│   │   ├── Toast.js            # Notification toast: success, error, warning, info
│   │   ├── Modal.js            # Generic modal with backdrop
│   │   ├── ToggleSwitch.js     # On/off toggle for equipment control
│   │   ├── Slider.js           # Setpoint slider with value display
│   │   └── Breadcrumb.js       # Navigation breadcrumb (future use)
│   │
│   ├── layout/                 # Layout shell components
│   │   ├── Sidebar.js          # Navigation sidebar: logo, nav links, footer
│   │   ├── Header.js           # Top bar: page title, user avatar, theme toggle
│   │   └── ContentArea.js      # Main content wrapper (view injection target)
│   │
│   ├── stores/                 # State management
│   │   ├── DataStore.js        # Business data: sensors, equipment, alarms, user
│   │   ├── UiStore.js          # UI state: theme, sidebar, toasts, modals
│   │   └── createStore.js      # Generic store factory: getState, setState, subscribe
│   │
│   ├── services/               # Data generation and API abstraction
│   │   ├── MockData.js         # Generators: createSensor(), createEquipment(), etc.
│   │   ├── DataSimulator.js    # setInterval-based real-time sensor updates
│   │   ├── alarmEngine.js      # Threshold evaluation, alarm state transitions
│   │   └── api/                # External API wrappers (BrasilAPI, Cloudflare, SMS24h)
│   │       ├── index.js        # API client factory
│   │       ├── brasilApi.js    # CNPJ lookup
│   │       ├── cloudflare.js   # Cloudflare Pages deployment
│   │       └── smsApi.js       # SMS24h number purchase
│   │
│   ├── persistence/            # Local storage management
│   │   ├── index.js            # getDB(), saveDB(), getSettings(), saveSettings()
│   │   └── backup.js           # Export/import JSON backup
│   │
│   ├── utils/                  # Pure utility functions
│   │   ├── format.js           # formatNumber(), formatDate(), formatCNPJ()
│   │   ├── dom.js              # query(), create(), on(), delegate()
│   │   ├── random.js           # Seeded random, randomInRange(), randomChoice()
│   │   └── slug.js             # slugify(), onlyDigits()
│   │
│   └── styles/                 # All CSS (Phase 2 rebrand swaps these files)
│       ├── theme.css           # CSS custom properties (:root)
│       ├── base.css            # Reset, typography, layout utilities
│       ├── components.css      # Shared component styles (cards, tables, pills)
│       ├── animations.css      # Keyframes: fadeIn, slideUp, float, spin, pulse
│       └── responsive.css      # Media queries, breakpoints
│
├── public/
│   ├── fonts/                  # Self-hosted fonts (Phase 2: Poppins/Montserrat)
│   ├── icons/                  # Phosphor Icons or Material Symbols SVGs
│   └── favicon.svg
│
└── .planning/                  # GSD project management (committed separately)
```

### Structure Rationale

- **`src/views/`**: Each route gets one file. Page views are isolated — changing one won't break another. Follows original's `VIEWS[route]()` pattern.
- **`src/widgets/`**: Shared UI primitives used across multiple views. Each widget is a factory function: creates DOM, returns an API for updates. This is how the original builds statCard(), quickCard(), stepBox().
- **`src/stores/`**: Centralized state avoids the original's scattered global variables (`etapa1State`, `etapa2State`). Observer pattern enables reactive updates without a framework.
- **`src/services/`**: All side effects live here. MockData.js generates data (pure functions), DataSimulator.js handles timing (setInterval), api/ wraps external calls. Swappable — replace MockData with real API later.
- **`src/styles/`**: **This is the Phase 2 boundary.** All visual identity (colors, fonts, spacing, shadows) defined as CSS variables. Rebrand = swap these files, don't touch JS.
- **`src/persistence/`**: Isolates localStorage access. Key names must match original for clone phase parity.
- **`public/`**: Static assets. Phase 2 replaces fonts, icons, and logos here.

## Architectural Patterns

### Pattern 1: VIEWS Registry (Router Pattern)

**What:** Each route maps to a view function in a central registry. The router calls `VIEWS[route](state)` to get HTML, then injects it into the content area. This is the original system's exact pattern.

**When to use:** Every route in the app uses this. The original calls `document.getElementById('view').innerHTML = VIEWS[route]()`. The replica does the same but with the state passed in.

**Trade-offs:** Simple, predictable, easy to reverse-engineer. Downsides: full re-render on navigation (no VDOM diffing), but for a dashboard this is acceptable since navigation events are infrequent.

**Example:**
```javascript
// src/router/index.js
import { ROUTES } from './routes.js';
import { dataStore } from '../stores/DataStore.js';
import { uiStore } from '../stores/UiStore.js';

export const router = {
  go(route) {
    if (!ROUTES[route]) route = 'dashboard';
    const viewFn = ROUTES[route].view;
    const state = { data: dataStore.getState(), ui: uiStore.getState() };
    document.getElementById('view').innerHTML = viewFn(state);
    this.updateNav(route);
    this.updateHeader(ROUTES[route]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    uiStore.setState({ activeRoute: route, sidebarOpen: false });
  },

  updateNav(route) {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  },

  updateHeader({ title, subtitle }) {
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-subtitle').textContent = subtitle;
  }
};
```

### Pattern 2: Observable Store (State Management)

**What:** A simple pub/sub store. Components subscribe to state changes via `store.subscribe(callback)`. When state updates, all subscribers are notified. This replaces the original's scattered global mutable state.

**When to use:** All business data (DataStore) and UI state (UiStore). Every view and widget that needs reactive updates subscribes to the relevant store.

**Trade-offs:** Cleaner than global variables, but subscribers must manually check which part of state changed since there's no selector system. Fine for this scale (~50 data points, ~8 views).

**Example:**
```javascript
// src/stores/createStore.js
export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState() { return state; },
    setState(partial) {
      state = { ...state, ...partial };
      listeners.forEach(fn => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn); // unsubscribe
    }
  };
}

// src/stores/DataStore.js
import { createStore } from './createStore.js';

export const dataStore = createStore({
  sensors: [],
  equipment: [],
  alarms: [],
  user: null,
  systemStatus: 'online'
});
```

### Pattern 3: Widget Factory Functions

**What:** Reusable UI pieces are factory functions that take a config object, return an HTML string, and optionally attach event listeners or start timers. This mirrors the original's `statCard()`, `quickCard()`, `stepBox()` helper functions.

**When to use:** Any UI element that appears in multiple views (KPI cards, data tables, status pills, toasts).

**Trade-offs:** No true component lifecycle (mount/unmount). Cleanup must be manual. But simple and framework-free — perfect for a clone that must match original behavior closely.

**Example:**
```javascript
// src/widgets/KpiCard.js
export function KpiCard({ icon, label, value, trend, color = 'blue' }) {
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  const trendClass = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400';

  return `
    <div class="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div class="icon-cube ${color}">${icon}</div>
      <div class="text-3xl font-extrabold mt-3">
        ${value}
        <span class="${trendClass} text-lg ml-1">${trendArrow} ${Math.abs(trend)}%</span>
      </div>
      <div class="text-gray-400 text-sm">${label}</div>
    </div>
  `;
}
```

### Pattern 4: CSS Custom Properties Theming

**What:** All visual properties (colors, fonts, spacing, shadows, border-radius) are defined as CSS custom properties on `:root`. The ThemeProvider toggles class names on `<html>` to switch themes. Phase 2 rebrand only modifies these variables and the font imports.

**When to use:** Every visual element in the app references CSS variables, never hardcoded colors. This is the architecture's most critical decision for enabling the two-phase workflow.

**Trade-offs:** More verbose CSS (always writing `var(--color)`). But enables full visual rebrand without touching a single line of JS — exactly what Phase 2 needs.

**Example:**
```css
/* Phase 1: Clone theme (matches original's dark navy + indigo) */
:root {
  --bg: #0b1020;
  --bg-secondary: #0f172a;
  --card: #111a36;
  --card-secondary: #1a2348;
  --border: rgba(255,255,255,0.08);
  --text: #e6e9f5;
  --text-muted: #9aa3c7;
  --accent: #6366f1;
  --accent-secondary: #22d3ee;
  --accent-tertiary: #a855f7;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --font-display: 'Sora', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius: 16px;
  --shadow: 0 6px 0 #312e81;
}

/* Phase 2: Rebrand theme (emerald green + burnt orange) */
:root {
  --bg: #0a1a0f;
  --bg-secondary: #0d2414;
  --card: #15331e;
  --card-secondary: #1d4228;
  --border: rgba(255,255,255,0.08);
  --text: #e8f5e9;
  --text-muted: #a5d6a7;
  --accent: #059669;          /* emerald green */
  --accent-secondary: #d97706; /* burnt orange */
  --accent-tertiary: #7c3aed;  /* violet (kept for variety) */
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --font-display: 'Poppins', sans-serif;
  --font-body: 'Poppins', sans-serif;
  --radius: 20px;
  --shadow: 0 8px 0 #064e3b;
}
```

## Data Flow

### Real-Time Sensor Data Flow

```
┌─────────────────┐
│ DataSimulator    │  setInterval(updateAll, 3000)
│ (setInterval)    │
└────────┬────────┘
         │ updateValues(sensors, equipment)
         ↓
┌─────────────────┐
│ MockData.js      │  mutate: temp += random(-0.5, +0.5)
│ (data generation)│          power += random(-2, +2)
└────────┬────────┘
         │ dataStore.setState({ sensors: updated, equipment: updated })
         ↓
┌─────────────────┐
│ DataStore        │  Notify all subscribers
│ (state)          │
└────────┬────────┘
         │ subscribe callback fires
         ↓
┌─────────────────┐
│ alarmEngine.js   │  Check thresholds: temp > 40°C? → create alarm
│ (threshold eval)│  Equipment offline > 30s? → critical alarm
└────────┬────────┘
         │ dataStore.setState({ alarms: [...alarms, newAlarm] })
         ↓
┌─────────────────┐
│ Views / Widgets  │  Re-render: KpiCard updates values
│ (presentation)   │           DataTable updates rows
│                   │           Toast shows new alarm
└─────────────────┘
```

### User Action Flow

```
┌──────────────┐
│ User clicks   │  e.g., "Turn On Equipment #3"
│ "ON" toggle   │
└──────┬───────┘
       │ onClick handler
       ↓
┌──────────────┐
│ UiStore       │  setState({ pendingAction: 'eq3-on' })
│ (optimistic)  │  Immediate visual feedback (toggle flips)
└──────┬───────┘
       │ dataStore.setState({ equipment: updatedList })
       ↓
┌──────────────┐
│ DataStore     │  Equipment #3 status = 'on'
│               │  Persist to localStorage
└──────┬───────┘
       │ subscribers notified
       ↓
┌──────────────┐
│ Toast widget  │  "Equipment #3 activated" toast
│ View re-render│  DataTable row updates status pill
└──────────────┘
```

### Mock Data → State → Component Binding

```
src/services/MockData.js          # Pure generators: createSensor(id), createEquipment(id)
    ↓
src/services/DataSimulator.js     # Timing layer: setInterval, initial seed
    ↓
src/stores/DataStore.js           # Centralized state with subscribe pattern
    ↓ (subscribers:)
src/views/Dashboard.js            # Renders KPI cards with live values
src/widgets/DataTable.js          # Renders equipment table, subscribes for row updates
src/views/Alarms.js               # Renders alarm list, subscribes for new alarms
```

### Key Data Flows

1. **Sensor Telemetry Flow:** DataSimulator (setInterval 3s) → MockData.updateValues() → DataStore.setState() → all subscribed views re-render with new numbers.
2. **Alarm Lifecycle:** alarmEngine evaluates DataStore state on each update → creates alarm if threshold exceeded → DataStore.setState() → Alarms view renders new row, Toast widget shows notification, status pill in header updates count.
3. **User Preference Flow:** User changes theme → UiStore.setState({ theme: 'light' }) → ThemeProvider reads UiStore → updates `<html>` class and CSS variables → all components re-style via CSS inheritance.
4. **Persistence Flow:** Any DataStore.setState() → after successful update → Persistence.saveDB(dataStore.getState()) → localStorage. On app start: Persistence.getDB() → DataStore.setState(loadedData).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Original (~8 views, ~50 sensors) | Vanilla JS with innerHTML is sufficient. No build step needed for the original (CDN Tailwind). |
| Phase 1 Replica | Same data volume but modularized. Vite bundler for dev experience. ES modules for code organization. |
| Phase 2 Rebrand | No data/performance changes. Only CSS variable swaps, font replacements, layout adjustments. |
| Future: real backend | Swap `src/services/MockData.js` → `src/services/ApiClient.js`. Rest of architecture unchanged — stores and views don't know where data comes from. |

### Scaling Priorities

1. **First bottleneck:** innerHTML full re-render on every state update. For ~50 sensors updating every 3 seconds, this is fine (dashboard tables of <100 rows). If data grows to 1000+ sensors, switch to targeted DOM updates (only update changed cells).
2. **Second bottleneck:** localStorage capacity (~5MB). Current data model (companies, sites, settings) fits easily. If sensor history grows, switch to IndexedDB for time-series data.
3. **Third bottleneck:** Single-threaded data generation. If simulation gets complex (1000+ sensors with physics models), move DataSimulator to a Web Worker.

## Anti-Patterns

### Anti-Pattern 1: Scattered Global State

**What people do:** The original uses scattered global variables (`etapa1State`, `etapa2State`, mutations anywhere). This makes data flow hard to trace.

**Why it's wrong:** Hard to debug, hard to persist, impossible to unit test individual parts. State changes from any function — you can't know who changed what.

**Do this instead:** Single DataStore with setState() and subscribe(). Every state mutation goes through the store. Console.log in setState() during development to trace data flow.

### Anti-Pattern 2: Mixing Data Generation with Presentation

**What people do:** Generating random data inline in view functions. The original does `const totalEmp = db.empresas.length` directly in VIEWS.dashboard().

**Why it's wrong:** Can't test views with known data. Can't swap data source. Views become bloated with business logic.

**Do this instead:** Separate services/ for data generation, stores/ for state, views/ for rendering data they receive. Views should be pure-ish: `viewFn(state) → HTML string`.

### Anti-Pattern 3: Hardcoding Visual Identity in JS

**What people do:** Inline styles, hardcoded color hex values in JavaScript (`color: '#6366f1'`), icon paths as strings in JS.

**Why it's wrong:** Makes Phase 2 rebrand a nightmare — must search-and-replace across all JS files. Easy to miss a hardcoded color, creating visual inconsistency.

**Do this instead:** All visual properties come from CSS. JS only toggles CSS classes. Icons referenced by CSS class names, not inline SVGs. This keeps the Phase 2 boundary clean at `src/styles/` and `public/`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| BrasilAPI (CNPJ) | `fetch()` → normalize → save to DataStore | Phase 1 clone: keep original behavior. Wrap in api/brasilApi.js |
| Cloudflare Pages API | `fetch()` with Bearer token → upload → deploy | Phase 1 clone: keep. Requires user-configured API token in Settings |
| SMS24h API | `fetch()` with API key → purchase number | Phase 1 clone: keep. Requires user-configured API key |
| Google Fonts | `<link>` in HTML → CSS variable for font-family | Phase 1: Inter + Sora. Phase 2: Poppins or Montserrat (swap link) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| services/ → stores/ | Direct function calls (services write to stores) | Services don't depend on stores; stores don't know about services. Orchestrator (main.js) wires them. |
| stores/ → views/ | Subscribe pattern (views subscribe to stores) | Views never mutate stores directly. They call action functions that mutate stores. |
| views/ → widgets/ | Function calls (views compose widgets) | Widgets receive data as parameters, return HTML strings. No widget-to-widget communication. |
| router → views | Router calls view function with state, injects result into DOM | One-way: router → view. Views don't know about router (except for navigation links). |

## Phase Architecture: Clone vs Rebrand

### What Changes Between Phases

| Layer | Phase 1 (Clone) | Phase 2 (Rebrand) |
|-------|-----------------|-------------------|
| `src/styles/` | Original navy+indigo theme, Inter+Sora fonts, 16px radius | Emerald green+burnt orange, Poppins/Montserrat, 20px radius, glassmorphism cards |
| `public/fonts/` | Inter, Sora (Google Fonts CDN) | Poppins or Montserrat (self-hosted) |
| `public/icons/` | Emoji-based icons from original | Phosphor Icons or Material Symbols SVG |
| `public/favicon.svg` | Original lab emoji | New logo |
| `src/views/` | **No changes** — identical markup structure | **No changes** — behavior stays identical |
| `src/widgets/` | **No changes** | **No changes** |
| `src/stores/` | **No changes** | **No changes** |
| `src/services/` | **No changes** | **No changes** |

### A/B Testing Architecture

The architecture supports running clone and rebrand side-by-side for validation (VAL-01):

```javascript
// During test mode, append ?theme=rebrand to URL
const params = new URLSearchParams(window.location.search);
const theme = params.get('theme') || 'clone';
document.documentElement.setAttribute('data-theme', theme);

// Load corresponding CSS
if (theme === 'rebrand') {
  import('./styles/rebrand.css');
} else {
  import('./styles/clone.css');
}
```

## Build Order

Based on dependency analysis, the recommended component build order:

```
Phase 1 — Foundation (no visual output, pure logic)
  1. src/utils/          # format(), dom(), random(), slug()
  2. src/stores/         # createStore(), DataStore, UiStore
  3. src/persistence/     # getDB(), saveDB(), backup
  4. src/services/        # MockData, DataSimulator, alarmEngine
        ↓
Phase 2 — Shell (visual output, no data)
  5. index.html           # Static shell: sidebar skeleton, header, content area
  6. src/styles/          # theme.css, base.css, components.css, animations.css
  7. src/layout/          # Sidebar, Header, ContentArea (static structure)
        ↓
Phase 3 — Routing (navigation works)
  8. src/router/          # Router class, routes.js, go() function
        ↓
Phase 4 — Shared Widgets (reusable across pages)
  9. src/widgets/         # KpiCard, DataTable, ChartWrapper, StatusPill,
                           # Toast, Modal, ToggleSwitch, Slider
        ↓
Phase 5 — Page Views (one per route, in dependency order)
  10. src/views/Dashboard.js    # Depends on: KpiCard, StatusPill, DataStore
  11. src/views/Alarms.js       # Depends on: DataTable, Toast, DataStore
  12. src/views/Equipment.js    # Depends on: DataTable, ToggleSwitch, Slider
  13. src/views/Reports.js      # Depends on: ChartWrapper, DataTable
  14. src/views/Settings.js     # Depends on: ToggleSwitch, Slider, Modal
        ↓
Phase 6 — Integration & Polish
  15. src/main.js               # Bootstrap: wire services → stores → router → first render
  16. Full integration test     # Verify all routes, data flow, persistence
```

**Why this order:**
- Foundation modules (utils, stores) have zero dependencies on other modules — they're the leaves in the dependency tree.
- The shell (HTML + CSS + layout) must exist before any page views can render into it.
- Routing must work before page views — views are called by the router.
- Shared widgets come before page views because pages compose widgets.
- Each page view builds on widgets already created, ordered by increasing complexity.
- Integration comes last to wire everything together once all pieces exist.

## Sources

- **Target system source code analysis:** Full HTML source (~2135 lines) of laboratoriodebms.netlify.app via WebFetch. Architecture: vanilla JS SPA, custom routing, localStorage state, CSS variables theming, Tailwind CSS CDN. (MEDIUM confidence — direct source inspection)
- **Vanilla JS patterns:** Patterns.dev — Module, Observer, Singleton, Factory patterns for vanilla JavaScript applications. (HIGH confidence — well-established patterns)
- **BMS/SCADA architecture:** Domain knowledge on industrial monitoring dashboards — layered architecture (data acquisition → state → presentation), real-time update patterns via polling. (MEDIUM confidence — synthesized from general SCADA/MES dashboard patterns)
- **Two-phase workflow:** Architectural separation of concerns — CSS custom properties as theming boundary, presentation layer as rebrand target. (HIGH confidence — standard design system practice)
- **Vite documentation:** ES module bundling, Tailwind CSS integration, static asset handling for vanilla JS projects. (HIGH confidence — official tooling)

---
*Architecture research for: BMS Replica — reverse-engineered Building Management System dashboard*
*Researched: 2026-06-27*
