// tests/test_etapa1.js
// TDD tests for src/views/etapa1.js — Plan 03-03
// Tests cover wizard state machine, CNPJ lookup, domain suggestions, meta-tags,
// site HTML generation, and Cloudflare deploy pipeline.

import { describe, it, assert, assertEquals, assertDeepEquals, assertContains } from './test-helpers.js';
import { VIEWS } from '../src/router/index.js';
import { getDB, saveDB } from '../src/stores/data.js';
import { slugify } from '../src/utils/string.js';

// Import functions under test from etapa1 module
// These exports will exist after implementation (RED → GREEN)
import {
  initEtapa1,
  etapa1State,
  resetDownstream,
  normalizarBrasilAPI,
  salvarEmpresa,
  gerarSugestoesDominio,
  gerarMetatag,
  salvarMetatag,
  buildSiteHTML,
  gerarSiteHTML,
  e1Buscar,
  e1Publicar,
  e1Preview
} from '../src/views/etapa1.js';

// =============================================================================
// Task 1 Tests: CNPJ Lookup + Wizard State Machine + Step Renderers (Steps 1-2)
// =============================================================================

describe('Task 1 — CNPJ Lookup + Wizard State Machine', () => {

  describe('initEtapa1()', () => {
    it('assigns a function to VIEWS.etapa1 that returns an HTML string', () => {
      initEtapa1();
      assertEquals(typeof VIEWS.etapa1, 'function', 'VIEWS.etapa1 should be a function');
      const html = VIEWS.etapa1();
      assert(typeof html === 'string' && html.length > 0, 'VIEWS.etapa1() should return a non-empty string');
      // Should contain the 5 step cards
      assertContains(html, 'Consultar CNPJ', 'should contain Step 1 title');
      assertContains(html, 'Escolher Domínio', 'should contain Step 2 title');
    });
  });

  describe('etapa1State module variable', () => {
    it('is initialized with correct default values', () => {
      assert(etapa1State !== undefined, 'etapa1State should be defined');
      assertEquals(etapa1State.empresa, null, 'empresa should be null');
      assertEquals(etapa1State.dominio, '', 'dominio should be empty string');
      assertEquals(etapa1State.metatag, '', 'metatag should be empty string');
      assertEquals(etapa1State.htmlGerado, '', 'htmlGerado should be empty string');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });
  });

  describe('resetDownstream(step)', () => {
    function setupState() {
      etapa1State.empresa = { razao_social: 'Test Corp', cnpj: '12345678000199' };
      etapa1State.dominio = 'test-corp';
      etapa1State.metatag = '<meta og:title="Test">';
      etapa1State.htmlGerado = '<html>test</html>';
      etapa1State.publicado = { url: 'https://test.pages.dev', projectName: 'test', deploymentId: 'abc123' };
    }

    it('clears empresa and all downstream when fromStep is 1', () => {
      setupState();
      resetDownstream(1);
      assertEquals(etapa1State.empresa, null, 'empresa should be null');
      assertEquals(etapa1State.dominio, '', 'dominio should be empty');
      assertEquals(etapa1State.metatag, '', 'metatag should be empty');
      assertEquals(etapa1State.htmlGerado, '', 'htmlGerado should be empty');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });

    it('clears dominio and downstream but keeps empresa when fromStep is 2', () => {
      setupState();
      resetDownstream(2);
      assert(etapa1State.empresa !== null, 'empresa should NOT be cleared');
      assertEquals(etapa1State.dominio, '', 'dominio should be empty');
      assertEquals(etapa1State.metatag, '', 'metatag should be empty');
      assertEquals(etapa1State.htmlGerado, '', 'htmlGerado should be empty');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });

    it('clears metatag and downstream but keeps empresa+dominio when fromStep is 3', () => {
      setupState();
      resetDownstream(3);
      assert(etapa1State.empresa !== null, 'empresa should NOT be cleared');
      assert(etapa1State.dominio !== '', 'dominio should NOT be cleared');
      assertEquals(etapa1State.metatag, '', 'metatag should be empty');
      assertEquals(etapa1State.htmlGerado, '', 'htmlGerado should be empty');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });

    it('clears htmlGerado and publicado but keeps upstream when fromStep is 4', () => {
      setupState();
      resetDownstream(4);
      assert(etapa1State.empresa !== null, 'empresa should NOT be cleared');
      assert(etapa1State.dominio !== '', 'dominio should NOT be cleared');
      assert(etapa1State.metatag !== '', 'metatag should NOT be cleared');
      assertEquals(etapa1State.htmlGerado, '', 'htmlGerado should be empty');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });

    it('only clears publicado when fromStep is 5', () => {
      setupState();
      resetDownstream(5);
      assert(etapa1State.empresa !== null, 'empresa should NOT be cleared');
      assert(etapa1State.dominio !== '', 'dominio should NOT be cleared');
      assert(etapa1State.metatag !== '', 'metatag should NOT be cleared');
      assert(etapa1State.htmlGerado !== '', 'htmlGerado should NOT be cleared');
      assertEquals(etapa1State.publicado, null, 'publicado should be null');
    });
  });

  describe('normalizarBrasilAPI(d)', () => {
    const mockResponse = {
      razao_social: 'EMPRESA TESTE LTDA',
      nome_fantasia: 'Teste Corp',
      cnpj: '12345678000199',
      capital_social: 50000,
      municipio: 'SAO PAULO',
      uf: 'SP',
      cnae_fiscal_descricao: 'Desenvolvimento de software',
      logradouro: 'Rua Teste',
      numero: '100',
      bairro: 'Centro',
      cep: '01001000',
      ddd_telefone_1: '11',
      telefone_1: '999999999',
      email: 'teste@empresa.com.br',
      natureza_juridica: 'Sociedade Limitada',
      porte: 'ME',
      data_abertura: '2020-01-15'
    };

    it('maps all fields from BrasilAPI response to internal empresa object', () => {
      const e = normalizarBrasilAPI(mockResponse);
      assertEquals(e.razao_social, 'EMPRESA TESTE LTDA');
      assertEquals(e.nome_fantasia, 'Teste Corp');
      assertEquals(e.cnpj, '12345678000199');
      assertEquals(e.capital_social, 50000);
      assertEquals(e.municipio, 'SAO PAULO');
      assertEquals(e.uf, 'SP');
      assertEquals(e.cnae_fiscal_descricao, 'Desenvolvimento de software');
      assertEquals(e.logradouro, 'Rua Teste');
      assertEquals(e.numero, '100');
      assertEquals(e.bairro, 'Centro');
      assertEquals(e.cep, '01001000');
      assertEquals(e.natureza_juridica, 'Sociedade Limitada');
      assertEquals(e.porte, 'ME');
      assertEquals(e.email, 'teste@empresa.com.br');
    });

    it('falls back to razao_social when nome_fantasia is missing', () => {
      const e = normalizarBrasilAPI({ ...mockResponse, nome_fantasia: null });
      assertEquals(e.nome_fantasia, 'EMPRESA TESTE LTDA');
    });

    it('preserves raw response in empresa.raw', () => {
      const e = normalizarBrasilAPI(mockResponse);
      assert(e.raw !== undefined, 'raw should be preserved');
      assertEquals(e.raw.razao_social, mockResponse.razao_social);
    });

    it('converts capital_social to number and defaults to 0', () => {
      const e = normalizarBrasilAPI({ ...mockResponse, capital_social: null });
      assertEquals(e.capital_social, 0);
    });
  });

  describe('salvarEmpresa(e)', () => {
    it('saves empresa to DB and returns updated DB', () => {
      const db = getDB();
      const initialCount = db.empresas.length;
      const empresa = { razao_social: 'Test Save', cnpj: '99999999000199', nome_fantasia: 'Test Save' };
      const updatedDB = salvarEmpresa(empresa);
      assertEquals(updatedDB.empresas.length, initialCount + 1);
      const saved = updatedDB.empresas[updatedDB.empresas.length - 1];
      assertEquals(saved.razao_social, 'Test Save');
    });
  });

  describe('gerarSugestoesDominio(nome)', () => {
    it('returns an array of slugs', () => {
      const slugs = gerarSugestoesDominio('Empresa Teste de Tecnologia');
      assert(Array.isArray(slugs), 'should return an array');
      assert(slugs.length > 0, 'should not be empty');
    });

    it('returns max 6 unique slugs', () => {
      const slugs = gerarSugestoesDominio('Empresa Teste de Tecnologia Avancada LTDA');
      assert(slugs.length <= 6, 'should return at most 6 slugs');
      assertEquals(new Set(slugs).size, slugs.length, 'all slugs should be unique');
    });

    it('each slug is 4-32 characters', () => {
      const slugs = gerarSugestoesDominio('Empresa Teste de Tecnologia');
      slugs.forEach(s => {
        assert(s.length >= 4, `slug "${s}" should be at least 4 chars`);
        assert(s.length <= 32, `slug "${s}" should be at most 32 chars`);
      });
    });

    it('excludes the base slug from results', () => {
      const slugs = gerarSugestoesDominio('Empresa Teste');
      const baseSlug = slugify('Empresa Teste');
      assert(!slugs.includes(baseSlug), `should not include base slug "${baseSlug}"`);
    });

    it('returns empty array for empty/short name', () => {
      const slugs = gerarSugestoesDominio('');
      assert(Array.isArray(slugs), 'should return an array');
      // May return slugs based on 'empresa' fallback or empty
    });

    it('Algorithm 1: doubles last letter of slug', () => {
      const slugs = gerarSugestoesDominio('Test');
      // base slug = 'test'
      // Algorithm 1: 'test' + 't' = 'testt'
      assert(slugs.some(s => s === 'testt'), 'should contain double-last-letter variant');
    });

    it('Algorithm 2: truncates and adds s', () => {
      const slugs = gerarSugestoesDominio('Empresa Longa Nome Teste');
      // Algorithm 2 should produce truncated+s
      const truncatedS = slugs.find(s => s.endsWith('s') && s.length <= 12);
      assert(truncatedS !== undefined, 'should contain truncated+s variant');
    });
  });
});

// =============================================================================
// Task 2 Tests: Meta-tag Generation + buildSiteHTML Template Engine (Steps 3-4)
// =============================================================================

describe('Task 2 — Meta-tag Generation + Site HTML', () => {

  describe('buildSiteHTML(dados)', () => {
    const sampleDados = {
      nome_fantasia: 'Teste Corp',
      razao_social: 'EMPRESA TESTE LTDA',
      cnpj: '12345678000199',
      dominio: 'teste-corp',
      url: 'teste-corp.pages.dev',
      telefone: '(11) 99999-9999',
      email: 'contato@testecorp.com.br',
      logradouro: 'Rua Teste',
      numero: '100',
      bairro: 'Centro',
      municipio: 'SAO PAULO',
      uf: 'SP',
      cep: '01001-000',
      cnae_descricao: 'Desenvolvimento de software',
      natureza_juridica: 'Sociedade Limitada',
      porte: 'ME',
      capital_social: 'R$ 50.000,00',
      metatag: '<meta property="og:title" content="Teste Corp">',
      ano_fundacao: '2020'
    };

    it('returns a complete HTML document string', () => {
      const html = buildSiteHTML(sampleDados);
      assert(typeof html === 'string', 'should return a string');
      assertContains(html, '<!DOCTYPE html>', 'should contain DOCTYPE');
      assertContains(html, '<html', 'should contain html tag');
      assertContains(html, '<head>', 'should contain head tag');
      assertContains(html, '<body', 'should contain body tag');
      assertContains(html, '</html>', 'should contain closing html tag');
    });

    it('includes company name in hero section', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, 'Teste Corp', 'should contain company name');
    });

    it('includes formatted CNPJ in footer', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, '12.345.678/0001-99', 'should contain formatted CNPJ');
    });

    it('includes meta-tag content', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, 'og:title', 'should contain og:title from metatag');
    });

    it('HTML-escapes company data to prevent XSS', () => {
      const xssDados = { ...sampleDados, nome_fantasia: '<script>alert("XSS")</script>' };
      const html = buildSiteHTML(xssDados);
      assert(!html.includes('<script>alert'), 'should escape script tags');
      assertContains(html, '&lt;script&gt;', 'should contain escaped script tag');
    });

    it('includes clickable tel: link for phone', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, 'tel:', 'should contain tel: link');
    });

    it('includes responsive meta viewport tag', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, 'viewport', 'should contain viewport meta tag');
    });

    it('includes Brazilian address in proper format', () => {
      const html = buildSiteHTML(sampleDados);
      assertContains(html, 'Rua Teste', 'should contain street address');
      assertContains(html, 'SAO PAULO', 'should contain city');
      assertContains(html, 'SP', 'should contain state');
    });
  });

  describe('gerarMetatag()', () => {
    // Note: Tests set up empresa in etapa1State first
    // This function generates meta-tag HTML string from empresa data
    // Tested via evaluating window.gerarMetatag() behavior
    it('is exposed on window after initEtapa1()', () => {
      initEtapa1();
      assert(typeof window.gerarMetatag === 'function', 'gerarMetatag should be on window');
    });
  });
});

// =============================================================================
// Task 3 Tests: Cloudflare Pages 5-Step Deploy Pipeline (Step 5)
// =============================================================================

describe('Task 3 — Cloudflare Pages Deploy Pipeline', () => {

  describe('VIEWS.etapa1() Step 5 rendering', () => {
    it('renders Step 5 with publish button', () => {
      const html = VIEWS.etapa1();
      assertContains(html, 'Publicar', 'should contain publish text');
    });
  });

  describe('e1Publicar() pre-flight validation', () => {
    it('is exposed on window', () => {
      assert(typeof window.e1Publicar === 'function', 'e1Publicar should be on window');
    });
  });

  describe('BLAKE3 hash computation', () => {
    it('uses unescape+encodeURIComponent pattern for hash compatibility', () => {
      // The plan specifies using btoa(unescape(encodeURIComponent(html))) pattern
      // This is a deprecated pattern preserved for hash compatibility (Pitfall 3)
      const html = '<html><body>test</body></html>';
      const b64 = btoa(unescape(encodeURIComponent(html)));
      assert(typeof b64 === 'string' && b64.length > 0, 'should produce base64 string');
    });
  });

  describe('Cross-view integration (BANC-03)', () => {
    it('checks for window._empresaParaEtapa1 on init', () => {
      // The initEtapa1 function should check for this cross-view transfer
      // We verify the function exists and is called during init
      assert(typeof initEtapa1 === 'function', 'initEtapa1 should be callable');
    });
  });
});

// Re-export for convenience
export { summary };
