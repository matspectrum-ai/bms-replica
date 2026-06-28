// _shared/data.js — uses environment variables for shared state
const ADMIN = { username: 'admin', password: 'admin123', token: 'admin-token-bms-2026' };
function isAdminToken(token) { return token === ADMIN.token; }
function readJSON() { return null; } // deprecated — use env vars
function writeJSON() {} // deprecated
module.exports = { readJSON, writeJSON, ADMIN, isAdminToken };
