/**
 * netlify/functions/accounts-list.js
 * ADM-only GET handler — returns all registered accounts (sanitized).
 * Never exposes passwordHash or token to admins per D-01, T-07-03.
 *
 * @module accounts-list
 */

const { readJSON } = require('./_shared/data');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Authenticates the request as ADM.
 * Checks Bearer token in Authorization header against the admin account.
 *
 * @returns {{ isAdmin: boolean, error?: object }} Authentication result
 */
function authenticateAdmin(event) {
  const authHeader = event.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: { code: 401, body: { error: 'unauthorized', message: 'Token não fornecido' } } };
  }

  const token = authHeader.slice(7);

  const accounts = readJSON('accounts.json') || [];
  const account = accounts.find(acc => acc.token === token);

  if (!account || account.username !== 'admin') {
    return { isAdmin: false, error: { code: 403, body: { error: 'admin_only', message: 'Apenas o administrador pode visualizar as contas' } } };
  }

  return { isAdmin: true };
}

exports.handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'method_not_allowed' })
    };
  }

  // Authenticate — ADM only
  const auth = authenticateAdmin(event);
  if (!auth.isAdmin) {
    return {
      statusCode: auth.error.code,
      headers: CORS_HEADERS,
      body: JSON.stringify(auth.error.body)
    };
  }

  try {
    const accounts = readJSON('accounts.json') || [];

    // Sanitize: NEVER expose passwordHash or token (T-07-03)
    const sanitized = accounts.map(acc => ({
      username: acc.username,
      createdAt: acc.createdAt,
      isAdmin: acc.username === 'admin'
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ accounts: sanitized })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
