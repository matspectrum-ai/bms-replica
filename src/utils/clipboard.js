// src/utils/clipboard.js — Clipboard copy with toast feedback
// Source: RECON.md §5.1 copyText() (lines 275-278)
// Matches original function signature exactly per D-04.
//
// Copies text to system clipboard via navigator.clipboard.writeText.
// Shows toast notification on success. Called from 30+ inline onclick handlers
// across all views (copies domains, meta-tags, URLs, phone numbers, PDF fields).
//
// Note: The original does NOT catch clipboard errors — preserving this behavior.
// The Clipboard API requires secure context (HTTPS or localhost).

import { toast } from '../widgets/toast.js';

/**
 * Copies text to clipboard and shows toast notification on success.
 * Returns early for null/empty input — no toast shown.
 * @param {string} t - Text to copy to clipboard
 * @param {string} [msg='Copiado!'] - Toast message on success
 */
export function copyText(t, msg) {
  if (!t) return;
  navigator.clipboard.writeText(t).then(() => toast(msg || 'Copiado!', '\u{1F4CB}')); // 📋
}
