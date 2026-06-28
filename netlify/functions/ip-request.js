/**
 * netlify/functions/ip-request.js
 * POST handler — stores an access request (IP + email) for ADM review.
 * Blocked user provides their email; the function captures their IP automatically.
 * Per D-06: IPs não autorizados podem solicitar acesso ao ADM.
 *
 * @module ip-request
 */

const { readJSON, writeJSON } = require('./_shared/data');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Extracts the client IP from Netlify proxy headers.
 * Same logic as ip-check.js — duplicated for Lambda isolation.
 */
function extractClientIP(headers) {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const firstIP = forwarded.split(',')[0].trim();
    if (firstIP) return firstIP;
  }
  const clientIP = headers['client-ip'];
  if (clientIP) return clientIP;
  return '0.0.0.0';
}

/**
 * Basic email validation — must contain @.
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return email.includes('@');
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
    const clientIP = extractClientIP(event.headers || {});
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_email', message: 'Email inválido' })
      };
    }

    // Load and update access requests
    const requests = readJSON('access-requests.json') || [];
    requests.push({
      ip: clientIP,
      email,
      requestedAt: new Date().toISOString()
    });
    writeJSON('access-requests.json', requests);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Solicitação enviada ao administrador' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
