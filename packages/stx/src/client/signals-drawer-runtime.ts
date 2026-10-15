/** Drawer controls used by the generated client runtime. */
export const SIGNALS_DRAWER_RUNTIME = `  // ── Drawer system ───────────────────────────────────────────────
  // Same pattern as modal but slides from a side
  var drawer = {
    open: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (!el) { console.warn('[stx:drawer] Drawer "' + id + '" not found'); return; }
      el.style.display = 'flex';
      // Force reflow then animate
      void el.offsetHeight;
      el.setAttribute('data-stx-drawer-open', '');
      // The lock, Escape for the topmost and the Tab trap come from the
      // overlay stack, shared with every other overlay (stacksjs/stx#2057).
      // Each drawer used to bind its own Escape and set body overflow itself,
      // so two open closed together and the first to close unlocked the page.
      overlays.open('stx-drawer:' + id, {
        panel: el,
        onEscape: el.getAttribute('data-close-escape') !== 'false' ? function() { drawer.close(id); } : null
      });
      if (el.getAttribute('data-close-backdrop') !== 'false') {
        el.onclick = function(e) { if (e.target === el) drawer.close(id); };
      }
    },
    close: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (!el) return;
      el.removeAttribute('data-stx-drawer-open');
      el.onclick = null;
      overlays.close('stx-drawer:' + id);
      setTimeout(function() {
        if (!el.hasAttribute('data-stx-drawer-open')) el.style.display = 'none';
      }, 300);
    },
    toggle: function(id) {
      var el = document.querySelector('[data-stx-drawer="' + id + '"]');
      if (el && el.hasAttribute('data-stx-drawer-open')) drawer.close(id);
      else drawer.open(id);
    }
  };
`
