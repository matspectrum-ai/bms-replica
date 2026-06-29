/**
 * netlify/functions/_shared/data.js
 * Persistent storage via Netlify Blobs — survives deploys and function restarts.
 * All readJSON/writeJSON are async.
 *
 * Admin credentials hardcoded per D-01.
 * @module _shared/data
 */

const { getStore } = require('@netlify/blobs');

const STORE = 'bms-data';

// Hardcoded admin (D-01)
const ADMIN = { username: 'admin', password: 'admin123', token: 'admin-token-bms-2026' };
function isAdminToken(token) { return token === ADMIN.token; }

async function _store() { return getStore(STORE); }

async function readJSON(key) {
  try {
    const store = await _store();
    const raw = await store.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

async function writeJSON(key, data) {
  const store = await _store();
  await store.set(key, JSON.stringify(data));
}

module.exports = { readJSON, writeJSON, ADMIN, isAdminToken };
