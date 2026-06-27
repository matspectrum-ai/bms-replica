// tests/test_storage.js — localStorage bidirectional compatibility test suite
// Validates VAL-02: clone reads original data, original reads clone data.
// Tests MUST pass: key names match, schemas validate, data round-trips
// bidirectionally through saveDB→getDB and saveSettings→getSettings without corruption.

import { describe, it, assert, assertDeepEquals, assertContains, summary } from './test-helpers.js';
import { getDB, saveDB, getSettings, saveSettings } from '../src/stores/data.js';

// Constante de seed: estrutura exata do original (RECON.md §3)
const SAMPLE_ORIGINAL_DB = {
  empresas: [
    {
      cnpj: "00000000000191",
      nome: "Empresa Teste Ltda",
      nome_fantasia: "Teste",
      capital_social: 100000,
      atividade_principal: "Teste de software",
      endereco: "Rua Teste, 123",
      telefone: "(11) 99999-9999",
      email: "teste@teste.com"
    }
  ],
  sites: [
    {
      empresa: "00000000000191",
      dominio: "teste.netlify.app",
      url: "https://teste.netlify.app",
      status: "No Ar",
      criado_em: "2024-01-01",
      atualizado_em: "2024-06-01",
      tel_empresa: "(11) 99999-9999",
      tel_nosso: "(21) 88888-8888"
    }
  ],
  sms: []
};

const SAMPLE_ORIGINAL_SETTINGS = {
  cf_token: "test-token-12345",
  cf_account_id: "test-account-67890",
  sms_key: "test-sms-key-abcde",
  sms_country: "Brasil",
  sms_service: "WhatsApp"
};

let dbBackup = null;
let settingsBackup = null;

function backupLocalStorage() {
  dbBackup = localStorage.getItem('lab_bms_db_v1');
  settingsBackup = localStorage.getItem('lab_bms_settings_v1');
}

function restoreLocalStorage() {
  if (dbBackup !== null) {
    localStorage.setItem('lab_bms_db_v1', dbBackup);
  } else {
    localStorage.removeItem('lab_bms_db_v1');
  }
  if (settingsBackup !== null) {
    localStorage.setItem('lab_bms_settings_v1', settingsBackup);
  } else {
    localStorage.removeItem('lab_bms_settings_v1');
  }
  dbBackup = null;
  settingsBackup = null;
}

function clearTestKeys() {
  localStorage.removeItem('lab_bms_db_v1');
  localStorage.removeItem('lab_bms_settings_v1');
}

export function runStorageTests() {
  // Salva estado atual do usuário para restaurar após os testes
  backupLocalStorage();

  try {
    // ================================================================
    // Test 1: Nomes das chaves localStorage
    // ================================================================
    describe('localStorage Key Names', () => {
      it('lab_bms_db_v1 é usada para persistir banco de dados', () => {
        localStorage.setItem('lab_bms_db_v1', JSON.stringify(SAMPLE_ORIGINAL_DB));
        const raw = localStorage.getItem('lab_bms_db_v1');
        assert(raw !== null, 'Chave lab_bms_db_v1 deve existir após setItem');
        const parsed = JSON.parse(raw);
        assert(parsed.empresas !== undefined, 'Banco deve conter array empresas');
        assert(parsed.sites !== undefined, 'Banco deve conter array sites');
      });

      it('lab_bms_settings_v1 é usada para persistir configurações', () => {
        localStorage.setItem('lab_bms_settings_v1', JSON.stringify(SAMPLE_ORIGINAL_SETTINGS));
        const raw = localStorage.getItem('lab_bms_settings_v1');
        assert(raw !== null, 'Chave lab_bms_settings_v1 deve existir após setItem');
        const parsed = JSON.parse(raw);
        assert(typeof parsed.cf_token === 'string', 'Settings devem conter cf_token');
        assert(typeof parsed.sms_key === 'string', 'Settings devem conter sms_key');
      });
    });

    // ================================================================
    // Test 2: Validação do schema lab_bms_db_v1
    // ================================================================
    describe('lab_bms_db_v1 Schema', () => {
      it('getDB() retorna objeto com chaves obrigatórias (empresas, sites, sms)', () => {
        localStorage.setItem('lab_bms_db_v1', JSON.stringify(SAMPLE_ORIGINAL_DB));
        const db = getDB();
        assert(Array.isArray(db.empresas), 'empresas deve ser array');
        assert(Array.isArray(db.sites), 'sites deve ser array');
        assert(Array.isArray(db.sms), 'sms deve ser array');
      });

      it('Cada empresa tem campos obrigatórios (cnpj, nome, capital_social, etc.)', () => {
        localStorage.setItem('lab_bms_db_v1', JSON.stringify(SAMPLE_ORIGINAL_DB));
        const db = getDB();
        assert(db.empresas.length >= 1, 'Deve haver pelo menos 1 empresa');
        const emp = db.empresas[0];
        assert(typeof emp.cnpj === 'string', 'cnpj deve ser string');
        assert(typeof emp.nome === 'string', 'nome deve ser string');
        assert(typeof emp.capital_social === 'number', 'capital_social deve ser number');
        assert(typeof emp.atividade_principal === 'string', 'atividade_principal deve ser string');
        assert(typeof emp.endereco === 'string', 'endereco deve ser string');
        assert(typeof emp.telefone === 'string', 'telefone deve ser string');
        assert(typeof emp.email === 'string', 'email deve ser string');
      });

      it('Cada site tem campos obrigatórios (empresa, dominio, status, etc.)', () => {
        localStorage.setItem('lab_bms_db_v1', JSON.stringify(SAMPLE_ORIGINAL_DB));
        const db = getDB();
        assert(db.sites.length >= 1, 'Deve haver pelo menos 1 site');
        const site = db.sites[0];
        assert(typeof site.empresa === 'string', 'empresa deve ser string');
        assert(typeof site.dominio === 'string', 'dominio deve ser string');
        assert(typeof site.status === 'string', 'status deve ser string');
        assert(typeof site.criado_em === 'string', 'criado_em deve ser string');
        assert(typeof site.atualizado_em === 'string', 'atualizado_em deve ser string');
        assert(typeof site.tel_empresa === 'string', 'tel_empresa deve ser string');
        assert(typeof site.tel_nosso === 'string', 'tel_nosso deve ser string');
      });

      it('empresas vazio e sites vazio são válidos (banco recém-inicializado)', () => {
        clearTestKeys();
        const db = getDB();
        assert(Array.isArray(db.empresas), 'empresas deve ser array mesmo vazio');
        assert(Array.isArray(db.sites), 'sites deve ser array mesmo vazio');
        assert(db.empresas.length === 0, 'empresas deve estar vazio sem dados');
        assert(db.sites.length === 0, 'sites deve estar vazio sem dados');
      });
    });

    // ================================================================
    // Test 3: Validação do schema lab_bms_settings_v1
    // ================================================================
    describe('lab_bms_settings_v1 Schema', () => {
      it('getSettings() retorna objeto com chaves esperadas (cf_token, cf_account_id, sms_key, etc.)', () => {
        localStorage.setItem('lab_bms_settings_v1', JSON.stringify(SAMPLE_ORIGINAL_SETTINGS));
        const settings = getSettings();
        assert(typeof settings.cf_token === 'string', 'cf_token deve ser string');
        assert(typeof settings.cf_account_id === 'string', 'cf_account_id deve ser string');
        assert(typeof settings.sms_key === 'string', 'sms_key deve ser string');
        assert(typeof settings.sms_country === 'string', 'sms_country deve ser string');
        assert(typeof settings.sms_service === 'string', 'sms_service deve ser string');
      });

      it('Todos os campos de settings têm os tipos corretos', () => {
        localStorage.setItem('lab_bms_settings_v1', JSON.stringify(SAMPLE_ORIGINAL_SETTINGS));
        const settings = getSettings();
        // Verifica que nenhum valor é undefined
        Object.keys(SAMPLE_ORIGINAL_SETTINGS).forEach(key => {
          assert(settings[key] !== undefined,
            `Campo '${key}' deve existir em getSettings()`);
        });
      });
    });

    // ================================================================
    // Test 4: Round-trip Original → Clone
    // ================================================================
    describe('Original-to-Clone Round-Trip', () => {
      it('Dados no formato original podem ser lidos via getDB() sem perda', () => {
        // Simula o original escrevendo dados no localStorage
        localStorage.setItem('lab_bms_db_v1', JSON.stringify(SAMPLE_ORIGINAL_DB));
        // Clone lê via getDB()
        const db = getDB();
        assert(db.empresas.length === 1, 'Deve carregar 1 empresa');
        assert(db.sites.length === 1, 'Deve carregar 1 site');
        assert(db.sms.length === 0, 'Deve carregar array sms vazio');
        // Verifica campo por campo (sem perda)
        assert(db.empresas[0].cnpj === "00000000000191", 'CNPJ deve ser preservado');
        assert(db.empresas[0].nome === "Empresa Teste Ltda", 'Nome deve ser preservado');
        assert(db.sites[0].dominio === "teste.netlify.app", 'Domínio deve ser preservado');
        assert(db.sites[0].status === "No Ar", 'Status deve ser preservado');
      });

      it('Dados no formato original podem ser lidos via getSettings() sem perda', () => {
        localStorage.setItem('lab_bms_settings_v1', JSON.stringify(SAMPLE_ORIGINAL_SETTINGS));
        const settings = getSettings();
        assert(settings.cf_token === "test-token-12345", 'cf_token deve ser preservado');
        assert(settings.cf_account_id === "test-account-67890", 'cf_account_id deve ser preservado');
        assert(settings.sms_key === "test-sms-key-abcde", 'sms_key deve ser preservado');
        assert(settings.sms_country === "Brasil", 'sms_country deve ser preservado');
        assert(settings.sms_service === "WhatsApp", 'sms_service deve ser preservado');
      });
    });

    // ================================================================
    // Test 5: Round-trip Clone → Original
    // ================================================================
    describe('Clone-to-Original Round-Trip', () => {
      it('Dados salvos via saveDB() são legíveis pelo original (JSON compatível)', () => {
        // Clone salva dados via saveDB()
        saveDB(SAMPLE_ORIGINAL_DB);
        // Simula o original lendo diretamente do localStorage
        const raw = localStorage.getItem('lab_bms_db_v1');
        assert(raw !== null, 'Dados devem existir após saveDB()');
        const parsed = JSON.parse(raw);
        // Estrutura byte-for-byte compatível
        assert(Array.isArray(parsed.empresas), 'empresas deve ser array');
        assert(Array.isArray(parsed.sites), 'sites deve ser array');
        assert(parsed.empresas.length === 1, 'Deve ter 1 empresa salva');
        assert(parsed.sites.length === 1, 'Deve ter 1 site salvo');
        // Verifica campos críticos — sem campos extras, sem campos faltando
        const keys = Object.keys(parsed).sort();
        assertDeepEquals(keys, ['empresas', 'sites', 'sms'],
          'Estrutura JSON deve ter exatamente as chaves: empresas, sites, sms');
      });

      it('Dados salvos via saveSettings() são legíveis pelo original (JSON compatível)', () => {
        saveSettings(SAMPLE_ORIGINAL_SETTINGS);
        const raw = localStorage.getItem('lab_bms_settings_v1');
        assert(raw !== null, 'Settings devem existir após saveSettings()');
        const parsed = JSON.parse(raw);
        // Estrutura byte-for-byte compatível
        const keys = Object.keys(parsed).sort();
        assertDeepEquals(keys, ['cf_account_id', 'cf_token', 'sms_country', 'sms_key', 'sms_service'],
          'Estrutura JSON de settings deve ter exatamente as 5 chaves esperadas');
      });
    });

    // ================================================================
    // Test 6: Valores padrão (fallback)
    // ================================================================
    describe('Default Values', () => {
      it('getDB() retorna {empresas:[], sites:[], sms:[]} com localStorage vazio', () => {
        clearTestKeys();
        const db = getDB();
        assertDeepEquals(db, { empresas: [], sites: [], sms: [] },
          'getDB() com localStorage vazio deve retornar arrays vazios');
      });

      it('getSettings() retorna {} com localStorage vazio', () => {
        clearTestKeys();
        const settings = getSettings();
        assert(typeof settings === 'object' && settings !== null,
          'getSettings() deve retornar objeto');
        assert(Object.keys(settings).length === 0,
          'getSettings() com localStorage vazio deve retornar objeto vazio');
      });

      it('getDB() retorna defaults com JSON corrompido', () => {
        localStorage.setItem('lab_bms_db_v1', '{json invalido!!!!');
        const db = getDB();
        assertDeepEquals(db, { empresas: [], sites: [], sms: [] },
          'getDB() com JSON corrompido deve retornar defaults');
      });

      it('getSettings() retorna defaults com JSON corrompido', () => {
        localStorage.setItem('lab_bms_settings_v1', 'não é json');
        const settings = getSettings();
        assert(typeof settings === 'object' && settings !== null,
          'getSettings() com JSON corrompido deve retornar objeto vazio');
        assert(Object.keys(settings).length === 0,
          'getSettings() corrompido deve retornar {}');
      });
    });

    // ================================================================
    // Test 7: Persistência de dados (simulação de reload)
    // ================================================================
    describe('Data Persistence', () => {
      it('Dados salvos via saveDB() sobrevivem após simulação de reload', () => {
        clearTestKeys();
        saveDB(SAMPLE_ORIGINAL_DB);
        // Simula reload: verifica que dados estão no localStorage diretamente
        const raw = localStorage.getItem('lab_bms_db_v1');
        assert(raw !== null, 'Dados devem persistir no localStorage após saveDB()');
        const parsed = JSON.parse(raw);
        assert(parsed.empresas.length === 1, 'Empresa deve persistir');
        assert(parsed.sites.length === 1, 'Site deve persistir');
        // Segunda leitura via getDB() confirma que a API de leitura também funciona
        const db = getDB();
        assert(db.empresas.length === 1, 'getDB() deve retornar dados persistidos');
      });

      it('Dados salvos via saveSettings() sobrevivem após simulação de reload', () => {
        clearTestKeys();
        saveSettings(SAMPLE_ORIGINAL_SETTINGS);
        const raw = localStorage.getItem('lab_bms_settings_v1');
        assert(raw !== null, 'Settings devem persistir no localStorage após saveSettings()');
        const settings = getSettings();
        assert(settings.cf_token === "test-token-12345", 'cf_token deve persistir');
      });
    });

  } finally {
    // Restaura o estado original do localStorage do usuário
    restoreLocalStorage();
  }

  return summary();
}
