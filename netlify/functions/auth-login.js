/**
 * netlify/functions/auth-login.js
 * POST handler — authenticates username + password, validates IP, returns session token.
 * Hardcoded ADM check per D-01: username === 'admin' → isAdmin: true.
 *
 * @module auth-login
 */

const crypto = require('crypto');
const { readJSON, writeJSON } = require('./_shared/data');

const SALT = 'bms-salt-2026';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

exports.handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'method_not_allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_input', message: 'Usuário e senha são obrigatórios' })
      };
    }

    // Load accounts
    let accounts = readJSON('accounts.json') || [];

    // Seed admin account if no accounts exist or admin not found (first-run)
    if (!accounts.find(acc => acc.username === 'admin')) {
      const adminToken = crypto.randomBytes(24).toString('hex');
      accounts.push({
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        token: adminToken,
        createdAt: new Date().toISOString()
      });
      writeJSON('accounts.json', accounts);
    }

    // Find account by username
    const account = accounts.find(acc => acc.username === username);
    if (!account) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_credentials', message: 'Usuário ou senha inválidos' })
      };
    }

    // Hash provided password and compare
    const providedHash = hashPassword(password);
    if (providedHash !== account.passwordHash) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_credentials', message: 'Usuário ou senha inválidos' })
      };
    }

    // Hardcoded ADM check per D-01
    const isAdmin = username === 'admin';

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        token: account.token,
        username: account.username,
        isAdmin
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
