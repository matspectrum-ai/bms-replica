// src/widgets/pill.js
// Status pill/badge widget — label, 5 color variants
// Matches original .pill CSS system (RECON.md §6.2.4, lines 76-81)
//
// Pure factory function — takes config, returns HTML string. No DOM access, no side effects.
// Although not a standalone function in the original source, the .pill pattern is used
// extensively across all views — extracted as a reusable widget per RESEARCH.md guidance.
// D-03: pure factory function.

const VALID_VARIANTS = ['ok', 'todo', 'doing', 'done', 'danger'];

/**
 * Creates a status pill/badge.
 *
 * @param {string} label - The text label for the pill
 * @param {string} [variant='todo'] - Color variant: ok, todo, doing, done, danger
 * @returns {string} HTML string for a .pill span
 */
export function pill(label, variant = 'todo') {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'todo';
  return `<span class="pill ${safeVariant}">${label}</span>`;
}
