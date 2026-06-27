// src/utils/header.js — Header status pill refresh
// Source: RECON.md §5.1 refreshHeaderStatus() (lines 223-235)
// Matches original function signature exactly per D-04.
//
// Called by: saveSettings() (side effect), bootstrap sequence
// Reads settings via getSettings(), updates #cf-status and #sms-status pills.
// Null-checks DOM elements — silently skips if header not in DOM (testing).

import { getSettings } from '../stores/data.js';

/**
 * Update Cloudflare and SMS24h status pills in the header.
 * Reads settings from localStorage, updates pill classes and text.
 * Null-checks DOM elements — silently skips if header not in DOM.
 */
export function refreshHeaderStatus() {
  // Guard: skip if DOM is not available (Node.js test environment)
  if (typeof document === 'undefined') return;

  const s = getSettings();

  const cf = document.getElementById('cf-status');
  if (cf) {
    if (s.cf_token && s.cf_account) {
      cf.className = 'pill done';
      cf.textContent = '☁️ Cloudflare OK';
    } else {
      cf.className = 'pill danger';
      cf.textContent = '⚠️ Cloudflare';
    }
  }

  const sm = document.getElementById('sms-status');
  if (sm) {
    if (s.sms_key) {
      sm.className = 'pill done';
      sm.textContent = '📱 SMS24h OK';
    } else {
      sm.className = 'pill danger';
      sm.textContent = '⚠️ SMS24h';
    }
  }
}
