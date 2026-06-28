/**
 * netlify/functions/_shared/data.js
 * Shared data access layer — uses Netlify Blobs for cross-function persistence.
 * Admin credentials hardcoded per D-01.
 *
 * @module _shared/data
 */

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'bms-data';

// Hardcoded admin (D-01)
const ADMIN = {
  username: 'admin',
  password: 'admin123',
  token: 'admin-token-bms-2026'
};

function isAdminToken(token) {
  return token === ADMIN.token;
}

async function _store() {
  return getStore(STORE_NAME);
}

async function readJSON(key) {
  try {
    const store = await _store();
    const raw = await store.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

async function writeJSON(key, data) {
  const store = await _store();
  await store.set(key, JSON.stringify(data));
}

module.exports = { readJSON, writeJSON, ADMIN, isAdminToken };
