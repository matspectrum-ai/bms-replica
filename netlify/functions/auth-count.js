/**
 * netlify/functions/auth-count.js
 * GET handler — returns current account count for frontend to decide
 * register vs waitlist display per D-05.
 *
 * @module auth-count
 */

const { readJSON } = require('./_shared/data');

const MAX_ACCOUNTS = 2;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

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

  try {
    const accounts = readJSON('accounts.json') || [];
    const count = accounts.length;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        count,
        limit: MAX_ACCOUNTS,
        canRegister: count < MAX_ACCOUNTS
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
