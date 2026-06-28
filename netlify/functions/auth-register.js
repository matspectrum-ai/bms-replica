/**
 * netlify/functions/auth-register.js
 * POST handler — registers a new account with username + password hash.
 * Enforces max 2 account limit per D-05.
 *
 * @module auth-register
 */

const crypto = require('crypto');
const { readJSON, writeJSON } = require('./_shared/data');

const SALT = 'bms-salt-2026';
const MAX_ACCOUNTS = 2;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function generateToken() {
  return 'token_' + crypto.randomBytes(24).toString('hex');
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

    // Validate username and password
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_input', message: 'Usuário e senha são obrigatórios' })
      };
    }

    if (username.length < 3 || username.length > 30) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_input', message: 'Usuário deve ter entre 3 e 30 caracteres' })
      };
    }

    if (password.length < 1 || password.length > 100) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_input', message: 'Senha inválida' })
      };
    }

    // Load existing accounts
    const accounts = readJSON('accounts.json') || [];

    // Enforce max 2 account limit (D-05)
    if (accounts.length >= MAX_ACCOUNTS) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'account_limit_reached', message: 'Máximo de 2 contas atingido' })
      };
    }

    // Check if username already exists
    if (accounts.some(acc => acc.username === username)) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'username_taken', message: 'Este nome de usuário já está em uso' })
      };
    }

    // Hash password and generate token
    const passwordHash = hashPassword(password);
    const token = generateToken();

    // Create account
    const account = {
      username,
      passwordHash,
      token,
      createdAt: new Date().toISOString()
    };

    accounts.push(account);
    writeJSON('accounts.json', accounts);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ token, username })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
