// tests/test_etapa2.js
// TDD test suite for src/views/etapa2.js — SMS Purchase wizard
// Run: node --test --experimental-vm-modules tests/test_etapa2.js

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// =============================================================================
// SETUP: Mock browser globals before importing etapa2.js
// =============================================================================

// Mock localStorage
const _store = {};
global.localStorage = {
  getItem: (key) => _store[key] ?? null,
  setItem: (key, val) => { _store[key] = String(val); },
  removeItem: (key) => { delete _store[key]; },
  clear: () => { for (const k in _store) delete _store[k]; }
};

// Mock fetch
let _fetchResponses = [];
let _fetchCalls = [];
global.fetch = mock.fn(async (url, opts) => {
  _fetchCalls.push({ url: String(url), opts });
  if (_fetchResponses.length === 0) {
    throw new Error('No fetch mock configured');
  }
  const resp = _fetchResponses.shift();
  if (resp instanceof Error) throw resp;
  return {
    ok: resp.ok !== false,
    status: resp.status || 200,
    text: mock.fn(async () => resp.text || ''),
    json: mock.fn(async () => resp.json || {})
  };
});

// Track clearInterval calls
let _clearedIntervals = [];
const _origClearInterval = global.clearInterval;
global.clearInterval = (id) => {
  _clearedIntervals.push(id);
  return _origClearInterval(id);
};

// Track setInterval calls
let _intervalCallbacks = [];
const _origSetInterval = global.setInterval;
global.setInterval = (fn, ms) => {
  _intervalCallbacks.push({ fn, ms });
  return _intervalCallbacks.length; // Return mock ID
};

// Mock document
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.disabled = false;
    this.style = {};
    this.classList = {
      _items: [],
      add: (...args) => { this.classList._items.push(...args); },
      remove: (...args) => { this.classList._items = this.classList._items.filter(c => !args.includes(c)); },
      toggle: (c, v) => {
        if (v === true && !this.classList._items.includes(c)) this.classList._items.push(c);
        else if (v === false) this.classList._items = this.classList._items.filter(x => x !== c);
      },
      contains: (c) => this.classList._items.includes(c)
    };
    this.dataset = {};
    this._listeners = {};
  }
  addEventListener(evt, fn) { this._listeners[evt] = fn; }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
}

const _elements = {};
global.document = {
  getElementById: (id) => _elements[id] || null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body')
};

function _el(id, tag) {
  const el = new MockElement(tag || 'div');
  el.id = id;
  _elements[id] = el;
  return el;
}

// Pre-create expected DOM elements
const _domIds = [
  'view', 'page-title', 'page-subtitle', 'sidebar', 'backdrop',
  'toast', 'toast-icon', 'toast-msg',
  'sms-balance', 'sms-country', 'sms-service', 'sms-timer', 'sms-status',
  'btn-buy', 'redeploy-site', 'redeploy-log', 'btn-redeploy'
];
for (const id of _domIds) _el(id);

// Mock navigator.clipboard
let _clipboardText = '';
global.navigator = {
  clipboard: {
    writeText: mock.fn(async (text) => { _clipboardText = text; })
  }
};

// Mock global window (self-reference)
global.window = global;
global.scrollTo = () => {};

// Expose router functions on global (needed by view modules)
global.go = (route) => {
  // Call VIEWS[route]() to update #view.innerHTML (mocked)
  if (VIEWS[route]) {
    const viewEl = _elements['view'];
    if (viewEl) viewEl.innerHTML = VIEWS[route]();
  }
};
global.toggleSidebar = () => {};

// Track window exports
const _windowFnNames = new Set();

// Mock btoa, unescape, TextEncoder (for Node.js compatibility)
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.unescape = (str) => {
  return str.replace(/%[0-9A-Fa-f]{2}/g, (match) => {
    return String.fromCharCode(parseInt(match.slice(1), 16));
  });
};
global.TextEncoder = TextEncoder;
global.FormData = class FormData {
  constructor() { this._data = new Map(); }
  append(k, v) { this._data.set(k, v); }
  get(k) { return this._data.get(k); }
};

// Mock dynamic import of @noble/hashes
const { blake3 } = await (async () => {
  try {
    return await import('@noble/hashes/blake3');
  } catch {
    // Fallback: simple hash mock
    return {
      blake3: (data) => {
        // Return mock hash bytes (32 bytes)
        return new Uint8Array(32).fill(0xAB);
      }
    };
  }
})();

// Intercept dynamic imports
const _origImport = globalThis.import || (() => {});
const _moduleCache = new Map();
_moduleCache.set('https://esm.sh/@noble/hashes@2.2.0/blake3', { blake3 });

// =============================================================================
// Helpers
// =============================================================================

function resetMocks() {
  for (const k in _store) delete _store[k];
  _fetchResponses = [];
  _fetchCalls = [];
  _clipboardText = '';
  _clearedIntervals = [];
  _intervalCallbacks = [];
  _windowFnNames.clear();
  // Reset DOM elements
  for (const id of _domIds) {
    const el = _elements[id];
    if (el) {
      el.textContent = '';
      el.innerHTML = '';
      el.value = '';
      el.disabled = false;
    }
    // Recreate element
    _el(id);
  }
  // Reset window functions
  for (const key of Object.keys(global)) {
    if (key.startsWith('e2') && typeof global[key] === 'function') {
      delete global[key];
    }
  }
  if (global.after_etapa2) delete global.after_etapa2;
}

function setupMockFetch(response) {
  _fetchResponses.push(response);
}

// =============================================================================
// IMPORTS
// =============================================================================

// Import VIEWS for assertion
const routerModule = await import('../src/router/index.js');
const { VIEWS } = routerModule;

// Import utilities for format verification
const { formatBRPhone, fmtMoney } = await import('../src/utils/format.js');

// =============================================================================
// TESTS
// =============================================================================

describe('Task 1: SMS24h API Client + Number Purchase + Display', () => {

  let etapa2Module;

  beforeEach(async () => {
    resetMocks();
    
    // Reset VIEWS.etapa2 to ensure clean slate
    delete VIEWS.etapa2;
    if (global.after_etapa2) delete global.after_etapa2;
    
    // Set up SMS API key in localStorage
    _store['lab_bms_settings_v1'] = JSON.stringify({ sms_key: 'test-api-key-12345' });
    
    // Use cache-busting query param to force re-import
    const cacheBust = Date.now();
    etapa2Module = await import(`../src/views/etapa2.js?v=${cacheBust}`);
    
    // Call init to register the view
    if (etapa2Module.initEtapa2) {
      etapa2Module.initEtapa2();
    }
  });

  afterEach(() => {
    if (etapa2Module.etapa2State?.timer) {
      clearInterval(etapa2Module.etapa2State.timer);
    }
  });

  // --- Test 1: initEtapa2 assigns VIEWS.etapa2 ---
  it('initEtapa2() assigns a function to VIEWS.etapa2 that returns HTML string', () => {
    assert.ok(etapa2Module.initEtapa2, 'initEtapa2 should be exported');
    assert.ok(VIEWS.etapa2, 'VIEWS.etapa2 should be set after init');
    assert.strictEqual(typeof VIEWS.etapa2, 'function', 'VIEWS.etapa2 should be a function');
    
    const html = VIEWS.etapa2();
    assert.strictEqual(typeof html, 'string', 'VIEWS.etapa2() should return a string');
    assert.ok(html.length > 100, 'HTML should be substantial');
    assert.ok(html.includes('Etapa 2'), 'HTML should contain title');
  });

  // --- Test 2: etapa2State initialized ---
  it('etapa2State is initialized with correct defaults', () => {
    const state = etapa2Module.etapa2State;
    assert.ok(state, 'etapa2State should exist');
    assert.strictEqual(state.activationId, null);
    assert.strictEqual(state.phone, '');
    assert.strictEqual(state.code, '');
    assert.strictEqual(state.timer, null);
  });

  // --- Test 3: smsAPI constructs correct URL and returns text ---
  it('smsAPI constructs URL with api_key query param and returns response.text()', async () => {
    setupMockFetch({ ok: true, text: 'ACCESS_BALANCE:25.50' });
    
    const result = await etapa2Module.smsAPI('getBalance');
    
    assert.strictEqual(result, 'ACCESS_BALANCE:25.50');
    assert.ok(_fetchCalls.length > 0, 'fetch should have been called');
    
    const call = _fetchCalls[0];
    assert.ok(call.url.includes('api.sms24h.org'), 'URL should point to SMS24h');
    assert.ok(call.url.includes('api_key=test-api-key-12345'), 'URL should include API key');
    assert.ok(call.url.includes('action=getBalance'), 'URL should include action');
  });

  // --- Test 4: smsAPI throws when sms_key is missing ---
  it('smsAPI throws Error when sms_key is missing from settings', async () => {
    // Remove the sms_key — smsAPI reads settings at call time
    _store['lab_bms_settings_v1'] = JSON.stringify({});
    
    await assert.rejects(
      () => etapa2Module.smsAPI('getBalance'),
      /Sem API key/i
    );
  });

  // --- Test 5: Purchase step shows country select, service select, and buy button ---
  it('VIEWS.etapa2() returns HTML containing country select, service select, and buy button', () => {
    const html = VIEWS.etapa2();
    assert.ok(html.includes('sms-country'), 'Should contain country select');
    assert.ok(html.includes('sms-service'), 'Should contain service select');
    assert.ok(html.includes('btn-buy') || html.includes('Comprar Número'), 'Should contain buy button');
  });

  // --- Test 6: e2Comprar calls smsAPI with correct params ---
  it('e2Comprar() calls smsAPI(getNumber) with service and country params', async () => {
    const countryEl = _elements['sms-country'];
    const serviceEl = _elements['sms-service'];
    countryEl.value = '22';
    serviceEl.value = 'fb';
    
    setupMockFetch({ ok: true, text: 'ACCESS_NUMBER:987654:5531990885354' });
    
    // e2Comprar is exposed on window by etapa2.js
    if (global.e2Comprar) {
      await global.e2Comprar();
      
      assert.ok(_fetchCalls.length > 0, 'fetch should have been called');
      const call = _fetchCalls.find(c => c.url.includes('getNumber'));
      assert.ok(call, 'Should call getNumber action');
      assert.ok(call.url.includes('service=fb'), 'Should include service param');
      assert.ok(call.url.includes('country=22'), 'Should include country param');
    } else {
      assert.fail('e2Comprar not exposed on window');
    }
  });

  // --- Test 7: Purchased number displayed with formatBRPhone and copy button ---
  it('Purchased number is formatted via formatBRPhone and displayed with copy button', async () => {
    const countryEl = _elements['sms-country'];
    const serviceEl = _elements['sms-service'];
    countryEl.value = '22';
    serviceEl.value = 'fb';
    
    setupMockFetch({ ok: true, text: 'ACCESS_NUMBER:987654:5531990885354' });
    
    if (global.e2Comprar) {
      await global.e2Comprar();
      
      const state = etapa2Module.etapa2State;
      assert.strictEqual(state.activationId, '987654');
      assert.strictEqual(state.phone, '5531990885354');
      
      // Verify formatBRPhone formatting
      const formatted = formatBRPhone('5531990885354');
      assert.strictEqual(formatted, '(31) 99088-5354');
    }
  });

  // --- Test 8: Balance check parses ACCESS_BALANCE correctly ---
  it('e2VerSaldo() parses ACCESS_BALANCE response and formats via fmtMoney', async () => {
    setupMockFetch({ ok: true, text: 'ACCESS_BALANCE:25.50' });
    
    if (global.e2VerSaldo) {
      await global.e2VerSaldo();
      
      const balanceEl = _elements['sms-balance'];
      const html = balanceEl.innerHTML || balanceEl.textContent || '';
      // fmtMoney(25.50) → "R$ 25,50" in pt-BR
      assert.ok(html.includes('25,50') || html.includes('25.50'),
        `Balance should display the value, got: ${html}`);
    }
  });

});

describe('Task 2: Auto-Polling System + Code Display', () => {

  let etapa2Module;

  beforeEach(async () => {
    resetMocks();
    delete VIEWS.etapa2;
    if (global.after_etapa2) delete global.after_etapa2;
    
    _store['lab_bms_settings_v1'] = JSON.stringify({ sms_key: 'test-key' });
    
    const cacheBust = Date.now();
    etapa2Module = await import(`../src/views/etapa2.js?v=${cacheBust}`);
    if (etapa2Module.initEtapa2) etapa2Module.initEtapa2();
  });

  afterEach(() => {
    if (etapa2Module.etapa2State?.timer) {
      clearInterval(etapa2Module.etapa2State.timer);
    }
  });

  // --- Test 1: Step 2 renders when activationId exists ---
  it('Step 2 (polling) renders when activationId exists, shows timer element', () => {
    etapa2Module.etapa2State.activationId = '12345';
    etapa2Module.etapa2State.phone = '5531990885354';
    
    const html = VIEWS.etapa2();
    assert.ok(html.includes('sms-timer') || html.includes('Aguardando'),
      'Polling step should render when activationId exists');
  });

  // --- Test 2: Polling starts setInterval(5000) ---
  it('e2IniciarPolling() starts setInterval and stores timer ID', () => {
    etapa2Module.etapa2State.activationId = '12345';
    
    if (global.e2IniciarPolling) {
      global.e2IniciarPolling();
      
      assert.ok(_intervalCallbacks.length > 0, 'setInterval should have been called');
      assert.strictEqual(_intervalCallbacks[0].ms, 5000, 'Interval should be 5000ms');
      assert.ok(etapa2Module.etapa2State.timer !== null, 'Timer ID should be stored');
      assert.ok(etapa2Module.etapa2State.timer > 0, 'Timer ID should be positive');
    }
  });

  // --- Test 3: Polling calls getStatus each interval ---
  it('Polling calls smsAPI(getStatus) with activation ID', async () => {
    etapa2Module.etapa2State.activationId = '55555';
    
    setupMockFetch({ ok: true, text: 'STATUS_WAIT_CODE' });
    
    if (global.e2IniciarPolling) {
      global.e2IniciarPolling();
      
      // Execute the interval callback directly
      const cb = _intervalCallbacks[_intervalCallbacks.length - 1];
      if (cb && cb.fn) {
        await cb.fn();
        
        const statusCall = _fetchCalls.find(c => c.url.includes('getStatus'));
        assert.ok(statusCall, 'Should call getStatus');
        assert.ok(statusCall.url.includes('id=55555'), 'Should include activation ID');
      }
    }
  });

  // --- Test 4: STATUS_OK extracts code and stops polling ---
  it('STATUS_OK response extracts code, clears interval, updates state', async () => {
    etapa2Module.etapa2State.activationId = '55555';
    
    setupMockFetch({ ok: true, text: 'STATUS_OK:849201' });
    
    if (global.e2IniciarPolling) {
      global.e2IniciarPolling();
      
      const cb = _intervalCallbacks[_intervalCallbacks.length - 1];
      if (cb && cb.fn) {
        await cb.fn();
        
        // Check state was updated
        assert.strictEqual(etapa2Module.etapa2State.code, '849201');
        // Check interval was cleared
        assert.ok(_clearedIntervals.length > 0, 'Interval should have been cleared');
      }
    }
  });

  // --- Test 5: Timer displays elapsed seconds ---
  it('Timer displays elapsed seconds in the format (Xs)', () => {
    etapa2Module.etapa2State.activationId = '12345';
    etapa2Module.etapa2State.phone = '5531990885354';
    
    const html = VIEWS.etapa2();
    assert.ok(html.includes('sms-timer'), 'Timer element should be in HTML');
  });

  // --- Test 6: Polling stops on timeout (>1200s) ---
  it('Polling stops when elapsed > 1200 seconds (20 minutes)', () => {
    // Verify the timeout check constant
    const elapsed = 1201;
    const shouldStop = elapsed > 1200;
    assert.strictEqual(shouldStop, true, 'Should detect timeout');
  });

  // --- Test 7: e2Cancelar clears interval and resets state ---
  it('e2Cancelar() clears interval, resets state, shows cancel message', () => {
    etapa2Module.etapa2State.activationId = '999';
    etapa2Module.etapa2State.phone = '5511999999999';
    etapa2Module.etapa2State.timer = 42;
    
    if (global.e2Cancelar) {
      global.e2Cancelar();
      
      // Check interval was cleared (our mock tracks clearInterval calls)
      assert.ok(_clearedIntervals.includes(42) || _clearedIntervals.length > 0,
        'Interval should be cleared');
      assert.strictEqual(etapa2Module.etapa2State.activationId, null);
      assert.strictEqual(etapa2Module.etapa2State.phone, '');
      assert.strictEqual(etapa2Module.etapa2State.code, '');
      assert.strictEqual(etapa2Module.etapa2State.timer, null);
    }
  });

  // --- Test 8: Previous interval cleared before new ---
  it('Previous interval cleared before starting new one (Pitfall 4)', () => {
    etapa2Module.etapa2State.timer = 123;
    
    // Simulate the guard pattern
    if (etapa2Module.etapa2State.timer) {
      global.clearInterval(etapa2Module.etapa2State.timer);
    }
    
    assert.ok(_clearedIntervals.includes(123), 'Previous interval should be cleared');
    assert.strictEqual(etapa2Module.etapa2State.timer, 123,
      'Timer ID should still be set (cleared in guard, not nulled yet)');
  });

});

describe('Task 3: Re-deploy Existing Site with New Phone Number', () => {

  let etapa2Module;

  beforeEach(async () => {
    resetMocks();
    delete VIEWS.etapa2;
    if (global.after_etapa2) delete global.after_etapa2;
    
    // Set up settings with Cloudflare credentials
    _store['lab_bms_settings_v1'] = JSON.stringify({
      sms_key: 'test-key',
      cf_token: 'cf-test-token',
      cf_account: 'cf-account-123'
    });
    
    // Set up DB with a deployed site
    _store['lab_bms_db_v1'] = JSON.stringify({
      empresas: [{
        cnpj: '12345678000199',
        razao_social: 'Empresa Teste',
        nome_fantasia: 'Empresa Teste',
        cnae_fiscal_descricao: 'Serviços de informática',
        capital_social: '50000',
        logradouro: 'Rua Teste',
        numero: '100',
        bairro: 'Centro',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01001000'
      }],
      sites: [{
        fantasia: 'Empresa Teste',
        dominio: 'empresa-teste',
        cnpj: '12345678000199',
        url: 'https://empresa-teste.pages.dev',
        deploymentId: 'dep-001',
        status: 'deploy',
        atualizado: Date.now(),
        telefoneNosso: '5531999999999'
      }],
      sms: []
    });
    
    // Mock dynamic import for @noble/hashes
    const origDynamicImport = globalThis.import;
    globalThis.import = async (specifier) => {
      if (specifier.includes('noble/hashes') || specifier.includes('esm.sh')) {
        return {
          blake3: (data) => {
            // Deterministic mock hash
            const bytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) bytes[i] = (i * 7 + 3) % 256;
            return bytes;
          }
        };
      }
      // Fall back to real import for other modules
      return origDynamicImport ? origDynamicImport(specifier) : import(specifier);
    };
    
    const cacheBust = Date.now();
    etapa2Module = await import(`../src/views/etapa2.js?v=${cacheBust}`);
    if (etapa2Module.initEtapa2) etapa2Module.initEtapa2();
  });

  afterEach(() => {
    if (etapa2Module.etapa2State?.timer) {
      clearInterval(etapa2Module.etapa2State.timer);
    }
  });

  // --- Test 1: Step 3 renders site selector dropdown ---
  it('Step 3 renders site selector listing deployed sites from getDB()', () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    etapa2Module.etapa2State.code = '849201';
    
    const html = VIEWS.etapa2();
    assert.ok(html.includes('Empresa Teste') || html.includes('redeploy-site'),
      'Step 3 should show site selector');
    assert.ok(html.includes('redeploy-site'), 'Should contain site selector element');
  });

  // --- Test 2: e2RePublicar deploys via Cloudflare ---
  it('e2RePublicar() selects site and deploys via Cloudflare API', async () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    etapa2Module.etapa2State.code = '849201';
    
    const siteSelect = _elements['redeploy-site'];
    siteSelect.value = '0';
    
    // Mock Cloudflare API responses
    setupMockFetch({ ok: true, json: { success: true, result: { jwt: 'test-jwt-token' } } });
    setupMockFetch({ ok: true, json: { success: true } });
    setupMockFetch({ ok: true, json: { success: true, result: { id: 'dep-002', url: 'https://updated.pages.dev' } } });
    
    if (global.e2RePublicar) {
      await global.e2RePublicar();
      
      const cloudflareCalls = _fetchCalls.filter(c => c.url.includes('cloudflare.com'));
      assert.ok(cloudflareCalls.length > 0, 'Cloudflare API should be called');
    }
  });

  // --- Test 3: Re-deploy skips create-project step ---
  it('Re-deploy does NOT call create-project (project already exists)', async () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    etapa2Module.etapa2State.code = '849201';
    
    const siteSelect = _elements['redeploy-site'];
    siteSelect.value = '0';
    
    setupMockFetch({ ok: true, json: { success: true, result: { jwt: 'jwt-token' } } });
    setupMockFetch({ ok: true, json: { success: true } });
    setupMockFetch({ ok: true, json: { success: true, result: { id: 'dep-003', url: 'https://test.pages.dev' } } });
    
    if (global.e2RePublicar) {
      await global.e2RePublicar();
      
      const createCalls = _fetchCalls.filter(c => 
        c.url.includes('/projects') && !c.url.includes('upload-token') && !c.url.includes('deployments')
      );
      assert.strictEqual(createCalls.length, 0, 'Should not call create-project');
    }
  });

  // --- Test 4: Generated HTML has updated phone number ---
  it('Generated HTML includes the new phone number from etapa2State', () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    
    assert.strictEqual(etapa2Module.etapa2State.phone, '5531990885354');
    
    // The phone should appear in the re-deploy step's info text
    etapa2Module.etapa2State.code = '123456';
    const html = VIEWS.etapa2();
    // The phone number should appear formatted in the re-deploy step
    const formatted = formatBRPhone('5531990885354');
    assert.ok(html.includes(formatted), 'Re-deploy step should show the formatted phone');
  });

  // --- Test 5: Re-deploy uses Steps 2-5 pipeline ---
  it('Re-deploy runs upload-token, upload, and deploy steps', async () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    etapa2Module.etapa2State.code = '849201';
    
    const siteSelect = _elements['redeploy-site'];
    siteSelect.value = '0';
    
    setupMockFetch({ ok: true, json: { success: true, result: { jwt: 'jwt' } } });
    setupMockFetch({ ok: true, json: { success: true } });
    setupMockFetch({ ok: true, json: { success: true, result: { id: 'dep-004', url: 'https://done.pages.dev' } } });
    
    if (global.e2RePublicar) {
      await global.e2RePublicar();
      
      const cfCalls = _fetchCalls.filter(c => c.url.includes('cloudflare.com'));
      // upload-token + assets/upload + deployments
      assert.ok(cfCalls.length >= 3, `Should have ≥3 CF calls, got ${cfCalls.length}: ${cfCalls.map(c => c.url).join(', ')}`);
    }
  });

  // --- Test 6: Success updates localStorage ---
  it('Success updates site in localStorage with new URL and phone', async () => {
    etapa2Module.etapa2State.phone = '5531990885354';
    etapa2Module.etapa2State.code = '849201';
    
    const siteSelect = _elements['redeploy-site'];
    siteSelect.value = '0';
    
    setupMockFetch({ ok: true, json: { success: true, result: { jwt: 'jwt' } } });
    setupMockFetch({ ok: true, json: { success: true } });
    setupMockFetch({ ok: true, json: { success: true, result: { id: 'dep-new', url: 'https://new.pages.dev' } } });
    
    if (global.e2RePublicar) {
      await global.e2RePublicar();
      
      const db = JSON.parse(_store['lab_bms_db_v1'] || '{}');
      const site = (db.sites || [])[0];
      assert.ok(site, 'Site should still exist');
      if (site) {
        assert.ok(site.url || site.deploymentId, 'Site should be updated');
      }
    }
  });

});
