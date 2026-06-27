// src/widgets/stepBox.js
// Wizard step card widget — number/checkmark, icon, title, done state, body HTML
// Matches original stepBox() exactly (RECON.md lines 428-440, §5.1)
//
// Pure factory function — takes config, returns HTML string. No DOM access, no side effects.
// D-03: pure factory function. D-04: same signature as original.

/**
 * Creates a wizard step card with step number, icon, title, and body.
 *
 * @param {number} n - Step number (1-5)
 * @param {string} ico - Emoji icon for the step
 * @param {string} title - Step title text
 * @param {boolean} done - Whether step is complete (shows ✓ and "Concluído" pill)
 * @param {string} body - HTML content for the step body
 * @param {boolean} [disabled=false] - Whether step is locked (adds .disabled class)
 * @returns {string} HTML string for a step card
 */
export function stepBox(n, ico, title, done, body, disabled = false) {
  const doneClass = done ? ' done' : '';
  const disabledClass = disabled ? ' disabled' : '';
  return `
    <div class="glass step-card mb-4${doneClass}${disabledClass}">
      <div class="step-num">${done ? '✓' : n}</div>
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">${ico}</span>
        <span class="font-display font-bold">${title}</span>
        ${done ? '<span class="pill done">Concluído</span>' : ''}
      </div>
      <div>${body}</div>
    </div>
  `;
}
