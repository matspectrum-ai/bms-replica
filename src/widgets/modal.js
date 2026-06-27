// src/widgets/modal.js
// Generic modal dialog — overlay, HTML content injection, backdrop click close
// Matches original openModal/closeModal exactly (RECON.md lines 246-250, §5.1)
//
// Backdrop-click-to-close is handled by the inline onclick in index.html (Plan 01):
// <div id="modal-back" onclick="if(event.target===this)closeModal()">
// The event.target===this check ensures clicking the modal body does NOT close.
//
// No Escape key handler — matches original behavior.
// No close button in modal — callers provide their own.
// D-03: factory function (DOM-manipulating variant). D-04: same signatures as original.

/**
 * Opens the modal overlay and injects HTML content.
 *
 * @param {string} html - HTML content to inject into modal body
 */
export function openModal(html) {
  const body = document.getElementById('modal-body');
  if (!body) return;

  body.innerHTML = html;
  document.getElementById('modal-back').classList.remove('hidden');
}

/**
 * Hides the modal overlay.
 */
export function closeModal() {
  const back = document.getElementById('modal-back');
  if (!back) return;

  back.classList.add('hidden');
}
