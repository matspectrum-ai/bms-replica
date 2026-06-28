// src/auth/ip-gate.js — IP-based access control gate
// Plan: 07-02, Task 02-02
//
// Provides: checkIpAccess, requestAccess
//
// IP is detected server-side by the Netlify Function reading proxy headers
// (x-forwarded-for / client-ip). The client does NOT send its own IP.
//
// Design decisions:
//   - checkIpAccess() fails open on network errors (returns allowed:true)
//     so local development without netlify dev still works.
//   - No caching — checked on every page load for freshness.
//   - 5-second AbortController timeout prevents blocking app load.
//   - No dependency on session.js — IP check happens before login.
//
// Proxy compatibility: calls go to /.netlify/functions/* which are
// same-origin. The proxy layer (src/proxy/index.js) only rewrites
// cloudflare.com/sms24h.org URLs, so function calls are unaffected.

/**
 * Checks whether the current client IP is allowed to access the app.
 * Calls the ip-check Netlify Function (GET).
 *
 * Fail-open: returns {allowed: true, ip: 'offline'} on network errors
 * so local development without netlify dev still functions.
 *
 * @returns {Promise<{allowed: boolean, ip: string, error?: string}>}
 */
export async function checkIpAccess() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/.netlify/functions/ip-check', {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const body = await response.json();
      return { allowed: body.allowed, ip: body.ip };
    } else {
      return { allowed: false, ip: 'unknown', error: 'gate_error' };
    }
  } catch (e) {
    clearTimeout(timeout);
    // Fail-open on network error — IP gate should not block users
    // when the backend is unavailable (local dev, Netlify function outage)
    return { allowed: true, ip: 'offline' };
  }
}

/**
 * Submits an access request for a blocked IP.
 * Calls the ip-request Netlify Function (POST).
 *
 * @param {string} email — User's email for the access request
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function requestAccess(email) {
  try {
    const response = await fetch('/.netlify/functions/ip-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const body = await response.json();

    if (response.status === 201) {
      return { success: true, message: 'Solicitação enviada' };
    } else if (response.status === 400) {
      return { success: false, message: 'Email inválido' };
    } else {
      return { success: false, message: body.message || 'Erro ao enviar solicitação' };
    }
  } catch (e) {
    // Network error
    return { success: false, message: 'Erro de conexão' };
  }
}
