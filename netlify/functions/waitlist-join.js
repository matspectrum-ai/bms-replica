/**
 * netlify/functions/waitlist-join.js
 * POST handler — stores email in waitlist JSON when account limit reached (D-05).
 *
 * @module waitlist-join
 */

const { readJSON, writeJSON } = require('./_shared/data');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Basic email validation — must contain @ and a dot after the @ sign.
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return false;
  const domainPart = email.slice(atIndex + 1);
  return domainPart.includes('.');
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
    const { email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_email', message: 'Email inválido' })
      };
    }

    // Load and update waitlist
    const waitlist = readJSON('waitlist.json') || [];
    waitlist.push({
      email,
      requestedAt: new Date().toISOString()
    });
    writeJSON('waitlist.json', waitlist);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Adicionado à lista de espera' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
