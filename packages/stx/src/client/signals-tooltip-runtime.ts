/** Tooltip delegation used by the generated client runtime. */
export const SIGNALS_TOOLTIP_RUNTIME = `  // ── Tooltip runtime ─────────────────────────────────────────────
  (function() {
    var tip = null;
    function createTip() {
      tip = document.createElement('div');
      tip.id = 'stx-tooltip';
      tip.style.cssText = 'position:absolute;z-index:999999;pointer-events:none;background:#1f2937;color:#fff;font-size:12px;line-height:1.4;padding:6px 10px;border-radius:6px;max-width:250px;word-wrap:break-word;opacity:0;transition:opacity 0.15s ease;white-space:pre-wrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
      document.body.appendChild(tip);
    }
    function show(el) {
      if (!tip) createTip();
      var text = el.getAttribute('x-tooltip');
      if (!text) return;
      tip.textContent = text;
      tip.style.display = 'block';
      tip.style.opacity = '0';
      var pos = el.getAttribute('x-tooltip-position') || 'top';
      var rect = el.getBoundingClientRect();
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      var sx = window.scrollX;
      var sy = window.scrollY;
      var left, top;
      if (pos === 'bottom') { left = rect.left + rect.width / 2 - tw / 2; top = rect.bottom + 8; }
      else if (pos === 'left') { left = rect.left - tw - 8; top = rect.top + rect.height / 2 - th / 2; }
      else if (pos === 'right') { left = rect.right + 8; top = rect.top + rect.height / 2 - th / 2; }
      else { left = rect.left + rect.width / 2 - tw / 2; top = rect.top - th - 8; if (top < 0) { top = rect.bottom + 8; } }
      if (left < 4) left = 4;
      if (left + tw > window.innerWidth - 4) left = window.innerWidth - tw - 4;
      tip.style.left = (left + sx) + 'px';
      tip.style.top = (top + sy) + 'px';
      tip.style.opacity = '1';
    }
    function hide() { if (tip) { tip.style.opacity = '0'; setTimeout(function() { if (tip) tip.style.display = 'none'; }, 150); } }
    document.addEventListener('mouseover', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) show(el); });
    document.addEventListener('mouseout', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) hide(); });
    document.addEventListener('focusin', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) show(el); });
    document.addEventListener('focusout', function(e) { var el = e.target.closest('[x-tooltip]'); if (el) hide(); });
  })();
`
