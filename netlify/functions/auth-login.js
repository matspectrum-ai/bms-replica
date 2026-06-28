const crypto = require('crypto');
const { readJSON, ADMIN } = require('./_shared/data');
const SALT = 'bms-salt-2026';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function hashPassword(pw) { return crypto.createHash('sha256').update(pw + SALT).digest('hex'); }

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_input' }) };

    // Hardcoded admin (D-01) — no async I/O
    if (username === ADMIN.username && password === ADMIN.password) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: ADMIN.token, username: ADMIN.username, isAdmin: true }) };
    }

    // Regular user
    const accounts = await readJSON('accounts') || [];
    const account = accounts.find(acc => acc.username === username);
    if (!account) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'invalid_credentials' }) };
    if (hashPassword(password) !== account.passwordHash) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'invalid_credentials' }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: account.token, username: account.username, isAdmin: false }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'internal_error', message: e.message }) };
  }
};
