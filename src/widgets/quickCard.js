// src/widgets/quickCard.js
// Quick-action card widget — icon, title, desc, route navigation, color variant
// Matches original quickCard() exactly (RECON.md lines 375-386, §5.2)
//
// Pure factory function — takes config, returns HTML string with inline onclick.
// The onclick uses the global go() function (exposed to window by main.js).
// D-03: pure factory function. D-04: same signature as original.

/**
 * Creates a clickable quick-action card that navigates to a route.
 *
 * @param {string} icon - Emoji icon to display
 * @param {string} title - Card title
 * @param {string} desc - Card description/subtitle
 * @param {string} route - Target route name (passed to go())
 * @param {string} color - icon-cube color variant
 * @returns {string} HTML string for a clickable glass card
 */
export function quickCard(icon, title, desc, route, color) {
  return `
    <div class="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform cursor-pointer"
         onclick="go('${route}')">
      <div class="icon-cube ${color}" style="width:44px;height:44px;font-size:20px">${icon}</div>
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm text-slate-400">${desc}</div>
      </div>
    </div>
  `;
}
