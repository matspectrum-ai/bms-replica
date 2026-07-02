/**
 * netlify/functions/_shared/data.js
 * Reads from Netlify env vars (persist across deploys).
 * Writes to _synced in-memory (persisted manually via `netlify env:set`).
 *
 * readJSON checks _synced first, then falls back to env var.
 *
 * Env var naming: BMS_{KEY} (e.g., BMS_IPS, BMS_ACCOUNTS, BMS_WAITLIST)
 * Admin credentials hardcoded per D-01.
 *
 * @module _shared/data
 */

const ADMIN = { username: 'admin', password: 'admin123', token: 'admin-token-bms-2026' };
function isAdminToken(token) { return token === ADMIN.token; }

let _synced = {};

function readJSON(key) {
  if (key in _synced) return _synced[key];
  try {
    const raw = process.env['BMS_' + key.toUpperCase()];
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function writeJSON(key, data) {
  _synced[key] = data;
}

module.exports = { readJSON, writeJSON, ADMIN, isAdminToken };
