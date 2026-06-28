const crypto = require('crypto');
const { readJSON, writeJSON } = require('./_shared/data');
const SALT = 'bms-salt-2026';
const MAX = 2;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
function hashPw(pw) { return crypto.createHash('sha256').update(pw + SALT).digest('hex'); }

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password || username.length < 3 || username.length > 30) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_input' }) };

    const accounts = await readJSON('accounts') || [];
    if (accounts.length >= MAX) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'account_limit_reached' }) };
    if (accounts.some(a => a.username === username)) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'username_taken' }) };

    const account = { username, passwordHash: hashPw(password), token: 'token_' + crypto.randomBytes(24).toString('hex'), createdAt: new Date().toISOString() };
    accounts.push(account);
    await writeJSON('accounts', accounts);
    return { statusCode: 201, headers: CORS, body: JSON.stringify({ token: account.token, username }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'internal_error', message: e.message }) };
  }
};
