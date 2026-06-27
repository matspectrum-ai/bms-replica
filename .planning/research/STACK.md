# Stack Research

**Domain:** BMS (Building Management System) Dashboard via Front-End Reverse Engineering
**Researched:** 2026-06-27
**Confidence:** HIGH

## Executive Summary

The original target is a Netlify-hosted SPA at `laboratoriodebms.netlify.app` — a client-side application with all data generated locally (mock data via `Math.random()`, `setInterval`, etc.). The project requires: (1) black-box reverse engineering of the original front-end, (2) functional clone using the detected framework, and (3) subsequent rebranding with new visual identity. The stack must support real-time data simulation, multi-route dashboards, charting, data tables, alarm systems, and easy CSS rebranding.

**Primary recommendation:** React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4, with Zustand for state management and Recharts for charting. If the original is detected as Vue, pivot to Vue 3.5 + Pinia + ECharts while keeping Vite + Tailwind. The choice of React as default is based on: (a) 72% of Netlify SPAs use React, (b) Recharts (React-native, D3-backed) is the best charting library for dashboard UX, (c) Zustand has zero boilerplate and built-in Redux DevTools for reverse-engineering state inspection.

## Recommended Stack

### Core Framework (Primary — React)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.7 | UI library | Most probable framework on the original; 72% of Netlify SPAs use React; React 19 brings native Suspense for data loading, improved concurrent rendering, and the `use()` hook — ideal for real-time dashboards with streaming mock data |
| React DOM | 19.2.7 | DOM renderer | Synchronized with React 19; required for `createRoot` API |
| TypeScript | 6.0.3 | Type safety | TypeScript 6 adds native type-stripping in Node, improved inference; essential for reverse engineering — types document discovered data structures and prevent regressions during rebrand |
| Vite | 8.1.0 | Build tool & dev server | Rolldown-powered bundler with sub-second HMR; Vite 8 is the new major with enhanced plugin API and native CSS modules support; zero-config for React + TypeScript + Tailwind |

### Core Framework (Fallback — Vue)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vue | 3.5.39 | UI framework | If the original is detected as Vue (less likely but possible); Vue 3.5 has Composition API, `<script setup>`, and excellent TypeScript support |
| Pinia | 3.0.4 | State management (Vue) | Official Vue store; 3.x is the latest major with full TypeScript inference and devtools; replaces Vuex as the standard |

### Routing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-router-dom | 7.18.0 | Client-side routing (React) | React Router v7 is the current major; file-based routing, layout routes, data loaders; the original has multiple routes (Início, Etapas, Dados, Sistema) — RR v7 layout routes map perfectly to sidebar + content area pattern |
| vue-router | 4.5.x | Client-side routing (Vue) | Use only if the original is Vue; pairs with Pinia for route guards |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 5.0.14 | Global state (React) | **Zero boilerplate.** No providers, no action types, no reducers. Just `create((set) => ({...}))`. Perfect for real-time dashboards: `subscribeWithSelector` middleware allows components to react to specific state slices without full re-renders. Built-in `persist` middleware maps directly to the project requirement for localStorage persistence. Built-in Redux DevTools support — critical for reverse-engineering state inspection and debugging. 1.1 kB min+gzip. |
| Immer | 11.1.8 | Immutable state updates | Used internally by Zustand's `immer` middleware; enables mutative syntax for deeply nested state (sensor objects, alarm arrays) while maintaining immutability; 45M weekly downloads — battle-tested |

### Charting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Recharts | 3.9.0 | Chart library (React) | **Best React charting library for dashboards.** Built on D3 internally but exposes a fully declarative React component API. `<LineChart>`, `<BarChart>`, `<AreaChart>`, `<PieChart>`, `<RadarChart>` — each composed of independent sub-components (`<XAxis>`, `<Tooltip>`, `<Legend>`, `<CartesianGrid>`). 3.9 is the latest major with improved TypeScript types and accessibility. 1.6M weekly downloads. SVG-based = easy CSS customization for rebranding. Supports real-time data via React state updates — every `setState` triggers re-render with smooth transitions. |
| ECharts | 6.1.0 | Chart library (fallback, Vue) | Apache ECharts v6 is the best option if the original uses Vue (via `vue-echarts` wrapper). Canvas-based for high performance with 10K+ data points. Superior for: gauge charts (sensor readings), heatmaps (energy consumption), candlestick (if needed), and real-time streaming line charts. Heavier than Recharts (~1MB full build vs Recharts' tree-shakeable modules). Use ONLY if the original is Vue or uses ECharts. |
| d3 (D3.js) | 7.9.0 | Low-level visualization | Recharts' internal dependency. Do NOT use D3 directly for this project — Recharts wraps it with a declarative React API. Direct D3 would require imperative DOM manipulation that conflicts with React's virtual DOM, doubling development time with no benefit. Only use D3 directly if the original has custom D3 visualizations that Recharts cannot replicate. |

### Data Tables

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tanstack/react-table | 8.21.3 | Headless data table (React) | **Industry standard.** Headless (bring your own markup) = full control over styling with Tailwind. Built-in: sorting, filtering, pagination, row selection, column resizing, virtualization (via `@tanstack/react-virtual`). Perfect for the "Planilha" (spreadsheet) and "Banco de Empresas" (company database) sections. 2.3M weekly downloads. 8.x is stable, lightweight (~14 kB gzip). |

### Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | 4.3.1 | Utility-first CSS framework | **Pre-selected by project constraints.** Tailwind v4 is a complete rewrite with the new `@theme` directive, CSS-first configuration (no `tailwind.config.js` required), and automatic content detection. Design tokens via CSS custom properties make rebranding trivial — change a few CSS variables and every component updates. The Oxide engine (Rust-powered) provides sub-millisecond compilation. 100M+ weekly downloads. |

### Icons

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @phosphor-icons/react | 2.1.10 | Icon library (React) | **Pre-selected by project requirements (BRAND-05).** 9,000+ icons in 6 weights (thin, light, regular, bold, fill, duotone). Tree-shakeable — each icon is a separate React component. Supports `IconContext.Provider` for global styling (perfect for rebranding: change color/size/weight in one place). MIT license. 1.7M weekly downloads. |

### Animation (Rebrand Phase)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| framer-motion | 12.42.0 | Animation library | Now called "Motion" (rebranded from Framer Motion). Import from `motion/react`. GPU-accelerated via WAAPI. Required for BRAND-06 (micro-animações): layout animations, enter/exit transitions, `whileHover`/`whileTap` gestures, spring physics. Use ONLY in the rebrand phase — do not add animations to the functional clone (the clone must be pixel-perfect first). 31M weekly downloads. |
| @formkit/auto-animate | 1.0.0 | Zero-config animations | Lightweight alternative for simple list animations, auto-height transitions. Use for list reordering in data tables if framer-motion feels heavy. |

### Utilities

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| dayjs | 1.11.21 | Date/time manipulation | 2 kB alternative to Moment.js. Immutable, chainable, i18n support (Portuguese locale available — `dayjs/locale/pt-br`). Required for timestamp formatting in alarm logs, sensor data history, and report generation. 39M weekly downloads. |

### Reverse Engineering Toolkit

| Tool | Category | Purpose |
|------|----------|---------|
| Chrome DevTools — Elements | Browser built-in | Extract DOM tree, CSS classes, component hierarchy; inspect element attributes (data-testid, aria-labels) to infer component structure |
| Chrome DevTools — Sources | Browser built-in | Analyze minified JS bundles; set breakpoints on state mutations; use "Pretty Print" to deobfuscate; search for `Math.random`, `setInterval`, `localStorage.setItem` to find mock data generation |
| Chrome DevTools — Network | Browser built-in | Capture all XHR/Fetch requests (even if they return mock data); extract request/response schemas; identify API endpoint patterns |
| Chrome DevTools — Application | Browser built-in | Extract localStorage keys/values, sessionStorage, IndexedDB, cookies; document all persisted state structures |
| React DevTools | Browser extension | If the original uses React: inspect component tree, props, hooks, context values; critical for understanding data flow without source code |
| Redux DevTools | Browser extension | Works with Zustand's `devtools` middleware in our clone; also detects Redux if the original uses it |
| Wappalyzer | Browser extension | Quick framework/library detection (React, Vue, Chart.js, D3, etc.); identifies build tools and CDN usage |
| Lighthouse | Chrome built-in | Performance baseline; capture bundle size, render metrics, accessibility — used for bundle size validation (VAL-04: ≤20% of original) |

## Installation

```bash
# === React Stack (Primary) ===

# Core
npm install react@19.2.7 react-dom@19.2.7

# Build tool
npm install -D vite@8.1.0 typescript@6.0.3 @vitejs/plugin-react

# Routing
npm install react-router-dom@7.18.0

# Styling
npm install -D tailwindcss@4.3.1 @tailwindcss/vite

# State management
npm install zustand@5.0.14 immer@11.1.8

# Charting
npm install recharts@3.9.0

# Data tables
npm install @tanstack/react-table@8.21.3

# Icons
npm install @phosphor-icons/react@2.1.10

# Animation (Rebrand phase only — omit during clone phase)
npm install framer-motion@12.42.0

# Utilities
npm install dayjs@1.11.21


# === Vue Stack (Fallback — only if original uses Vue) ===

# Core
npm install vue@3.5.39

# Build tool
npm install -D vite@8.1.0 typescript@6.0.3 @vitejs/plugin-vue

# Routing
npm install vue-router@4.5.1

# State management
npm install pinia@3.0.4

# Charting (Vue — ECharts via vue-echarts)
npm install echarts@6.1.0 vue-echarts

# Styling, tables, icons, utilities — same as React stack
npm install -D tailwindcss@4.3.1 @tailwindcss/vite
npm install @tanstack/vue-table @phosphor-icons/vue dayjs@1.11.21 framer-motion@12.42.0
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 | Vue 3.5 | Vue is a valid fallback ONLY if the original uses Vue. React has better chart ecosystem (Recharts) and state management (Zustand) for dashboard use cases |
| State | Zustand 5 | Redux Toolkit 2.12 | RTK is excellent but overkill for a client-side-only app with mock data. Boilerplate (slices, actions, reducers, selectors, Provider) adds ~30% more code vs Zustand's `create()`. RTK's RTK Query is irrelevant here (no API to fetch). Use RTK only if the original uses Redux |
| State (Vue) | Pinia 3 | Vuex 4 | Vuex is deprecated; Pinia is the official recommendation from the Vue core team |
| Charts | Recharts 3.9 | Chart.js 4.5.1 | Chart.js is canvas-based (harder to style with CSS for rebranding). Lacks the declarative React component composition that Recharts offers. Chart.js requires imperative `new Chart(ctx, config)` — anti-pattern in React |
| Charts | Recharts 3.9 | D3.js 7.9 | D3 is a low-level visualization library, not a charting library. Building a BMS dashboard from scratch with D3 would require reinventing axes, tooltips, legends, responsive containers — months of work already done by Recharts. Use D3 only if the original has custom D3 visualizations |
| Charts (heavy data) | ECharts 6.1 | Recharts 3.9 | ECharts handles 100K+ data points with WebGL acceleration; Recharts (SVG) degrades past 5K points. But this project uses mock data with limited points — SVG is better (sharper, CSS-stylable) |
| Charts | Victory 37.3 | Recharts 3.9 | Victory has 6x fewer weekly downloads (275K vs 1.6M), slower release cadence, and a less intuitive API for dashboards. Use only if the original uses Victory |
| Tables | @tanstack/react-table 8 | Material UI DataGrid | MUI DataGrid is heavy (~300 kB), opinionated styling (hard to rebrand with Tailwind), and commercial-licensed for advanced features. TanStack Table is headless, lightweight, and fully customizable |
| Build tool | Vite 8 | Create React App (CRA) | CRA is officially deprecated/unmaintained since 2025. No updates, no React 19 support, slow Webpack builds. Vite is 10-100x faster |
| CSS | Tailwind CSS 4 | CSS Modules / styled-components | Tailwind is pre-selected. CSS-in-JS libraries add runtime cost and complicate rebranding (scattered style values). Tailwind's design token system centralizes all colors/spacing/fonts |
| Icons | Phosphor 2.1 | Lucide React / Heroicons | Phosphor has 6 weight variants (critical for the duotone/glassmorphism aesthetic in BRAND-04), 9,000+ icons, and IconContext for global theming during rebrand. Lucide and Heroicons have far fewer icons and no weight variants |
| Date utility | dayjs 1.11 | date-fns / luxon | dayjs is 2 kB (smallest), has Moment.js-compatible API (familiar to most devs), and includes Portuguese locale (`pt-br`). date-fns v3 is tree-shakeable but heavier for common operations |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially dead — no maintenance since 2025, no React 19 support, Webpack-only, 10-100x slower than Vite | Vite 8 |
| Redux (core, without Toolkit) | Manual action types, switch-case reducers, manual store configuration — 4x more boilerplate than Zustand for zero benefit in a mock-data SPA | Zustand 5 (React) or Pinia 3 (Vue) |
| Moment.js | 66 kB, mutable API (source of bugs), officially in maintenance mode. Its own docs recommend alternatives | dayjs 1.11 |
| styled-components / Emotion | Runtime CSS-in-JS adds bundle weight and makes Tailwind-based rebranding harder (design tokens scattered across components) | Tailwind CSS 4 |
| Bootstrap / Material UI | Opinionated component libraries with baked-in design that conflicts with the rebrand goal. MUI's theming system is complex and not compatible with Tailwind | Tailwind CSS 4 + headless components |
| jQuery | No — this is a modern SPA. The original may or may not use jQuery, but our clone will not | React or Vue |
| Webpack (standalone) | 10x slower builds, complex configuration; Vite has overtaken it as the standard | Vite 8 |
| D3.js (direct) | For charting needs covered by Recharts/ECharts, direct D3 is a massive time sink with no UX benefit | Recharts (React) or ECharts (Vue) |
| React Context for global state | Context causes full-tree re-renders on every value change — catastrophic for real-time dashboards updating every 1-2 seconds | Zustand 5 (selective subscriptions) |
| Svelte / Solid / Angular | Not relevant — the constraint is "same framework as original"; these are far less likely than React or Vue on Netlify | React 19 (default) or Vue 3.5 (fallback) |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react@19.2.7 | react-dom@19.2.7 | Must match exactly — both from the same monorepo release |
| react@19.2.7 | react-router-dom@7.18.0 | RR v7 fully supports React 19, including `use()` hook integration |
| react@19.2.7 | recharts@3.9.0 | Recharts 3.x supports React 18+; verify Recharts peer dep if React 19 issues arise |
| react@19.2.7 | zustand@5.0.14 | Zustand 5 works with React 18+; uses `useSyncExternalStore` under the hood |
| tailwindcss@4.3.1 | @tailwindcss/vite (latest) | Tailwind v4 requires the Vite plugin for integration (no PostCSS config needed) |
| vite@8.1.0 | @vitejs/plugin-react (latest) | Official React plugin for Vite; enables React Fast Refresh |
| typescript@6.0.3 | react@19.2.7 | TS 6 has full React 19 type support including `use()`, `useOptimistic`, `useActionState` |
| framer-motion@12.42.0 | react@19.2.7 | Import from `motion/react` (not `framer-motion`) for the latest API |
| zustand@5.0.14 | immer@11.1.8 | Via `zustand/middleware/immer` — enables mutable state updates |
| @tanstack/react-table@8.21.3 | react@19.2.7 | Framework-agnostic core + React adapter; 8.x is the stable major line |
| echarts@6.1.0 | vue@3.5.39 | Via `vue-echarts` wrapper (only in Vue fallback) |

## Stack Decision Matrix

The final stack depends on **Phase 1 (RECON)** findings. Use this decision matrix:

| RECON Finding | Framework | State Mgmt | Charts | Routing |
|---------------|-----------|------------|--------|---------|
| React detected | React 19.2.7 | Zustand 5.0.14 | Recharts 3.9.0 | react-router-dom 7.18.0 |
| React + Redux detected | React 19.2.7 | Redux Toolkit 2.12.0 (match original) | Recharts 3.9.0 | react-router-dom 7.18.0 |
| Vue detected | Vue 3.5.39 | Pinia 3.0.4 | ECharts 6.1.0 + vue-echarts | vue-router 4.5.x |
| No framework (vanilla JS) | React 19.2.7 (best for rebuild) | Zustand 5.0.14 | Recharts 3.9.0 | react-router-dom 7.18.0 |
| Chart.js detected in original | Any (above) | Any (above) | Chart.js 4.5.1 (match original) + react-chartjs-2 wrapper | Any (above) |

**Always apply regardless of framework:** Tailwind CSS 4.3.1, Vite 8.1.0, TypeScript 6.0.3, dayjs 1.11.21, @phosphor-icons/react 2.1.10, @tanstack/react-table 8.21.3

## Sources

- [npm: react@19.2.7] — https://www.npmjs.com/package/react — HIGH confidence (official registry, published 25 days ago)
- [npm: vue@3.5.39] — https://www.npmjs.com/package/vue — HIGH confidence (official registry, published 2 days ago)
- [npm: tailwindcss@4.3.1] — https://www.npmjs.com/package/tailwindcss — HIGH confidence (official registry, published 14 days ago)
- [npm: zustand@5.0.14] — https://www.npmjs.com/package/zustand — HIGH confidence (official registry, 36M weekly downloads)
- [npm: recharts@3.9.0] — https://www.npmjs.com/package/recharts — HIGH confidence (official registry, published 4 days ago)
- [npm: echarts@6.1.0] — https://www.npmjs.com/package/echarts — HIGH confidence (official registry, Apache project)
- [npm: chart.js@4.5.1] — https://www.npmjs.com/package/chart.js — HIGH confidence (official registry, published 8 months ago)
- [npm: d3@7.9.0] — https://www.npmjs.com/package/d3 — HIGH confidence (official registry, published 2 years ago — mature/stable)
- [npm: react-router-dom@7.18.0] — https://www.npmjs.com/package/react-router-dom — HIGH confidence (official registry, published 11 days ago)
- [npm: pinia@3.0.4] — https://www.npmjs.com/package/pinia — HIGH confidence (official registry, Vue core team)
- [npm: @reduxjs/toolkit@2.12.0] — https://www.npmjs.com/package/@reduxjs/toolkit — HIGH confidence (official registry)
- [npm: @tanstack/react-table@8.21.3] — https://www.npmjs.com/package/@tanstack/react-table — HIGH confidence (official registry)
- [npm: framer-motion@12.42.0] — https://www.npmjs.com/package/framer-motion — HIGH confidence (official registry, published 2 days ago)
- [npm: vite@8.1.0] — https://www.npmjs.com/package/vite — HIGH confidence (official registry, published 4 days ago)
- [npm: typescript@6.0.3] — https://www.npmjs.com/package/typescript — HIGH confidence (official registry, Microsoft)
- [npm: @phosphor-icons/react@2.1.10] — https://www.npmjs.com/package/@phosphor-icons/react — HIGH confidence (official registry)
- [npm: immer@11.1.8] — https://www.npmjs.com/package/immer — HIGH confidence (official registry)
- [npm: dayjs@1.11.21] — https://www.npmjs.com/package/dayjs — HIGH confidence (official registry)
- [npm: victory@37.3.6] — https://www.npmjs.com/package/victory — MEDIUM confidence (considered alternative, not recommended)
- [Web: laboratoriodebms.netlify.app] — https://laboratoriodebms.netlify.app/ — MEDIUM confidence (original site fetched, content analyzed; stack detection requires DevTools — deferred to RECON phase)

---

*Stack research for: BMS Dashboard Reverse Engineering*
*Researched: 2026-06-27*
*All npm versions verified against registry as of research date*
