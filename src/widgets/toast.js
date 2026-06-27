// src/widgets/toast.js
// Toast notification widget — bottom-center, emoji icon, auto-dismiss 3s
// Matches original toast() exactly (RECON.md lines 237-244, §5.1)
//
// Single toast slot design: new toasts replace old ones, timer is reset.
// D-03: factory function (DOM-manipulating variant). D-04: same signature as original.

let _tt = null;

/**
 * Shows a toast notification at bottom-center.
 * Cancels any active toast and replaces it with a new one.
 *
 * @param {string} msg - Message text to display
 * @param {string} [icon='✅'] - Emoji icon to show
 */
export function toast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  if (!t) return;

  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('hidden');

  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.add('hidden'), 3000);
}
