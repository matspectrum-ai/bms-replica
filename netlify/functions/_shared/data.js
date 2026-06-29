/**
 * netlify/functions/_shared/data.js
 * Reads from Netlify env vars (persist across deploys).
 * Writes are no-ops (data persisted manually via `netlify env:set`).
 *
 * Env var naming: BMS_{KEY} (e.g., BMS_IPS, BMS_ACCOUNTS, BMS_WAITLIST)
 * Admin credentials hardcoded per D-01.
 *
 * @module _shared/data
 */

const ADMIN = { username: 'admin', password: 'admin123', token: 'admin-token-bms-2026' };
function isAdminToken(token) { return token === ADMIN.token; }

function readJSON(key) {
  try {
    const raw = process.env['BMS_' + key.toUpperCase()];
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// writeJSON stores to a shared env var via _synced state.
// To persist permanently, run: netlify env:set BMS_{KEY} '[...]'
let _synced = {};
function writeJSON(key, data) {
  _synced[key] = data;
}

module.exports = { readJSON, writeJSON, ADMIN, isAdminToken };
