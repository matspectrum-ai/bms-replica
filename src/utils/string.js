// src/utils/string.js — String manipulation utilities
// Source: RECON.md §5.9 (onlyDigits, slugify, escapeHTML)
// Matches original function signatures exactly per D-04.
//
// All functions are PURE — no side effects, no DOM access, no localStorage.
// These are used across every view and by inline onclick handlers in generated HTML.

/**
 * Removes all non-digit characters from a string.
 * @param {string} s - Input string with any formatting
 * @returns {string} String containing only digits (0-9), empty string for null
 */
export function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

/**
 * Creates a URL-friendly slug from text.
 * Converts to lowercase, normalizes accents (NFD), removes punctuation,
 * truncates to 28 chars. Falls back to 'empresa' if empty/null.
 * @param {string} s - Text to slugify (e.g., company name)
 * @returns {string} URL-friendly slug, max 28 chars, or 'empresa' fallback
 */
export function slugify(s) {
  if (!s) return 'empresa';
  let r = s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 28);
  return r || 'empresa';
}

/**
 * Escapes HTML special characters to prevent XSS.
 * Escapes 5 entities: & < > " ' — matches original (not full OWASP set).
 * @param {string} s - Text to escape
 * @returns {string} HTML-safe string with special chars replaced by entities
 */
export function escapeHTML(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
