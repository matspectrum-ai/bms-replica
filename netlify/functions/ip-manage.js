/**
 * netlify/functions/ip-manage.js
 * ADM-only CRUD for the IP allowlist — list/add/remove IPs.
 * Token-authenticated: only the hardcoded 'admin' account can manage IPs (D-01, D-02).
 *
 * @module ip-manage
 */

const { readJSON, writeJSON } = require('./_shared/data');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Validates IPv4 format.
 */
function isValidIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

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

  const token = authHeader.slice(7); // Remove 'Bearer '

  const accounts = readJSON('accounts.json') || [];
  const account = accounts.find(acc => acc.token === token);

  // Must be the hardcoded admin account per D-01
  if (!account || account.username !== 'admin') {
    return { isAdmin: false, error: { code: 403, body: { error: 'admin_only', message: 'Apenas o administrador pode gerenciar IPs' } } };
  }

  return { isAdmin: true };
}

exports.handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Authenticate — all handlers require ADM
  const auth = authenticateAdmin(event);
  if (!auth.isAdmin) {
    return {
      statusCode: auth.error.code,
      headers: CORS_HEADERS,
      body: JSON.stringify(auth.error.body)
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // List all IPs
      const ips = readJSON('ips.json') || [];
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ips })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, ip, label } = body;

      if (!action) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'missing_action', message: 'Ação é obrigatória (add ou remove)' })
        };
      }

      const ips = readJSON('ips.json') || [];

      if (action === 'add') {
        // Validate IP format
        if (!ip || !isValidIPv4(ip)) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'invalid_ip', message: 'Formato de IP inválido' })
          };
        }

        // Check for duplicate
        if (ips.some(entry => entry.ip === ip)) {
          return {
            statusCode: 409,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'duplicate_ip', message: 'Este IP já está na lista' })
          };
        }

        // Add IP
        ips.push({
          ip,
          label: label || '',
          addedBy: 'admin',
          addedAt: new Date().toISOString()
        });

        writeJSON('ips.json', ips);

        return {
          statusCode: 201,
          headers: CORS_HEADERS,
          body: JSON.stringify({ ips })
        };
      }

      if (action === 'remove') {
        if (!ip) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'missing_ip', message: 'IP é obrigatório para remoção' })
          };
        }

        // Filter out the IP
        const updated = ips.filter(entry => entry.ip !== ip);
        writeJSON('ips.json', updated);

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ ips: updated })
        };
      }

      // Invalid action
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_action', message: 'Ação deve ser add ou remove' })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'method_not_allowed' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
