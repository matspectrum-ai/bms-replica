/**
 * netlify/functions/ip-check.js
 * GET handler — reads client IP from proxy headers, checks against IP allowlist.
 * Called by frontend on every page load per D-06.
 * Empty allowlist (first-run / local dev) grants access to all.
 *
 * @module ip-check
 */

const { readJSON } = require('./_shared/data');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Extracts the client IP from Netlify proxy headers.
 *
 * Priority:
 * 1. x-forwarded-for: take the first IP before any comma (client origin behind proxies)
 * 2. client-ip: Netlify-specific header
 * 3. '0.0.0.0' fallback (local dev safety — always passes allowlist check)
 *
 * @param {object} headers - Event headers object
 * @returns {string} Client IP address
 */
function extractClientIP(headers) {
  // x-forwarded-for: "client, proxy1, proxy2"
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const firstIP = forwarded.split(',')[0].trim();
    if (firstIP) return firstIP;
  }

  // Netlify-specific
  const clientIP = headers['client-ip'];
  if (clientIP) return clientIP;

  // Local dev safety fallback
  return '0.0.0.0';
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

  try {
    const clientIP = extractClientIP(event.headers || {});

    // Load IP allowlist
    const ips = readJSON('ips.json') || [];

    // Empty allowlist → allow all (first-run / local dev mode)
    if (ips.length === 0) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ allowed: true, ip: clientIP })
      };
    }

    // Check if IP is in allowlist
    const isAllowed = ips.some(entry => entry.ip === clientIP);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ allowed: isAllowed, ip: clientIP })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal_error', message: err.message })
    };
  }
};
