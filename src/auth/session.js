// src/auth/session.js — Authentication session management
// Plan: 07-02, Task 02-01
//
// Provides: login, logout, checkAuth, getToken, isAdmin
//
// Session token is stored in localStorage under key 'bms_session' (D-04).
// Token is validated on login only — no server-side revalidation on checkAuth().
// No token expiration in beta — session lives until logout or localStorage clear.
//
// Follows existing codebase patterns from src/stores/data.js:
//   - localStorage access with try/catch for QuotaExceededError
//   - ES module exports, no side effects on import
//   - STORAGE_KEY constant pattern

const SESSION_KEY = 'bms_session';

/**
 * Authenticates user via the auth-login Netlify Function.
 * On success, stores {token, username, isAdmin} in localStorage.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, username?: string, isAdmin?: boolean, error?: string}>}
 */
export async function login(username, password) {
  try {
    const response = await fetch('/.netlify/functions/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const body = await response.json();

    if (response.ok) {
      const session = {
        token: body.token,
        username: body.username,
        isAdmin: body.isAdmin || false
      };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        // QuotaExceededError — data layer pattern from stores/data.js
        console.error('localStorage quota exceeded in login', e);
      }
      return { success: true, username: body.username, isAdmin: session.isAdmin };
    } else {
      return { success: false, error: body.error || 'invalid_credentials' };
    }
  } catch (e) {
    // Network error (fetch failed)
    return { success: false, error: 'network_error' };
  }
}

/**
 * Removes session token from localStorage.
 * Synchronous, no return value.
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Reads session state from localStorage synchronously.
 * No network call — reads token stored by login().
 *
 * @returns {{authenticated: boolean, username: string|null, isAdmin: boolean, token: string|null}}
 */
export function checkAuth() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return { authenticated: false, username: null, isAdmin: false, token: null };
    }
    const session = JSON.parse(raw);
    if (!session || !session.token) {
      return { authenticated: false, username: null, isAdmin: false, token: null };
    }
    return {
      authenticated: true,
      username: session.username,
      isAdmin: !!session.isAdmin,
      token: session.token
    };
  } catch (e) {
    // Corrupted localStorage or JSON parse error
    return { authenticated: false, username: null, isAdmin: false, token: null };
  }
}

/**
 * Convenience wrapper — returns the session token string.
 * @returns {string|null}
 */
export function getToken() {
  return checkAuth().token;
}

/**
 * Convenience wrapper — returns whether current user is admin.
 * @returns {boolean}
 */
export function isAdmin() {
  return checkAuth().isAdmin;
}
