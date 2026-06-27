// src/widgets/statCard.js
// KPI stat card widget — icon, label, formatted value, color variant
// Matches original statCard() exactly (RECON.md lines 368-374, §5.2)
//
// Pure factory function — takes config, returns HTML string. No DOM access, no side effects.
// Color variants: 'purple' (brand/default), 'cyan', 'green', 'amber'
// D-03: pure factory function. D-04: same signature as original.

/**
 * Creates a KPI stat card with icon-cube, formatted value, and label.
 *
 * @param {string} icon - Emoji icon to display
 * @param {string} label - Statistic label text
 * @param {number|string} value - The stat value (numbers formatted with pt-BR locale)
 * @param {string} color - icon-cube color variant (purple/cyan/green/amber)
 * @returns {string} HTML string for a glass stat card
 */
export function statCard(icon, label, value, color) {
  const formatted = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  return `
    <div class="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div class="icon-cube ${color}">${icon}</div>
      <div class="text-3xl font-extrabold mt-3">${formatted}</div>
      <div class="text-slate-400 text-sm">${label}</div>
    </div>
  `;
}
