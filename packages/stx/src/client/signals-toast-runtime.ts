/** Toast notification helpers used by the generated client runtime. */
export const SIGNALS_TOAST_RUNTIME = `  // ==========================================================================
  // Toast notification system
  // ==========================================================================

  var _toastId = 0;
  var _toastIcons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  var _toastColors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb',
    warning: '#d97706'
  };

  function _getToastContainer() {
    return document.getElementById('stx-toast-container');
  }

  function _getToastAnimClass(container) {
    if (!container) return { inAnim: 'stx-toast-in', outAnim: 'stx-toast-out' };
    var pos = container.getAttribute('data-stx-toast-position') || 'top-right';
    if (pos.indexOf('left') !== -1) return { inAnim: 'stx-toast-in-left', outAnim: 'stx-toast-out-left' };
    if (pos.indexOf('center') !== -1) return { inAnim: 'stx-toast-in-center', outAnim: 'stx-toast-out-center' };
    return { inAnim: 'stx-toast-in', outAnim: 'stx-toast-out' };
  }

  function removeToast(id) {
    var el = document.getElementById('stx-toast-' + id);
    if (!el) return;
    var container = _getToastContainer();
    var anims = _getToastAnimClass(container);
    el.style.animation = anims.outAnim + ' 0.3s ease forwards';
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }

  /*
   * Is the APP in dark mode, not just the OS?
   *
   * stx's own color-mode boot writes a class (default 'dark') and/or an
   * attribute (data-theme / data-color-mode) onto <html>, so an app pinned to
   * light on a dark OS must not get a dark overlay over a light page. An
   * explicit override wins over both, and the media query is the last resort.
   *
   * One function rather than the resolution inlined per surface. #1875 fixed
   * this at the two dialog call sites, and toast kept the OS-only version and
   * shipped the exact bug #1875 describes; that is what a per-call-site fix
   * costs. See #1912.
   */
  function _resolveDark(override) {
    if (override != null)
      return !!override;

    var root = document.documentElement;
    if (root.classList.contains('dark'))
      return true;

    var attr = root.getAttribute('data-theme') || root.getAttribute('data-color-mode');
    if (attr === 'dark')
      return true;
    if (attr === 'light')
      return false;

    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function addToast(type, message, options) {
    var container = _getToastContainer();
    if (!container) {
      console.warn('[stx:toast] No <StxToast /> container found. Add <StxToast /> to your layout.');
      return -1;
    }
    var opts = options || {};
    var duration = opts.duration !== undefined ? opts.duration : 3000;
    var id = ++_toastId;
    var maxToasts = parseInt(container.getAttribute('data-stx-toast-max') || '5', 10);

    /*
     * A semantic id replaces its own toast in place (stacksjs/stx#1913).
     *
     * Without it, a persistent 'Publishing...' toast and the call that clears
     * it on completion have to thread the numeric return value between two
     * different functions by hand, which is the state management the primitive
     * exists to remove. With an id of 'publish' the second call simply replaces
     * the first, and toast.dismiss('publish') ends it.
     */
    var key = opts.id != null ? String(opts.id) : '';
    if (key) {
      var prior = container.querySelector('[data-stx-toast-key="' + key.replace(/\"/g, '') + '"]');
      // Removed outright rather than through removeToast, which animates for
      // 300ms first. This is a REPLACEMENT, not a dismissal: animating the old
      // one out while the new one animates in shows both at once, in the same
      // slot, which is exactly the flicker a keyed toast exists to avoid.
      if (prior && prior.parentNode)
        prior.parentNode.removeChild(prior);
    }

    // Enforce max toasts — remove oldest
    var existing = container.querySelectorAll('[data-stx-toast]');
    while (existing.length >= maxToasts && existing.length > 0) {
      var oldId = existing[0].getAttribute('data-stx-toast');
      removeToast(oldId);
      existing = container.querySelectorAll('[data-stx-toast]');
    }

    var anims = _getToastAnimClass(container);
    var borderColor = _toastColors[type] || _toastColors.info;
    var icon = _toastIcons[type] || _toastIcons.info;
    var isDark = _resolveDark(opts.dark);
    var bg = isDark ? '#1f2937' : '#ffffff';
    var textColor = isDark ? '#f3f4f6' : '#1f2937';
    var shadow = isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)';

    var el = document.createElement('div');
    el.id = 'stx-toast-' + id;
    el.setAttribute('data-stx-toast', String(id));
    if (key)
      el.setAttribute('data-stx-toast-key', key);
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.style.cssText = 'pointer-events:auto;display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;border-radius:0.5rem;border-left:4px solid ' + borderColor + ';background:' + bg + ';color:' + textColor + ';box-shadow:' + shadow + ';animation:' + anims.inAnim + ' 0.3s ease;font-family:system-ui,-apple-system,sans-serif;font-size:0.875rem;line-height:1.4;max-width:100%';

    var iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'flex-shrink:0;display:flex;align-items:center;margin-top:1px';
    iconSpan.innerHTML = icon;

    /*
     * Title above message, when one is given (#1913).
     *
     * Collapsing the two into one string loses the hierarchy that makes a toast
     * scannable, and every one of the 16 call sites in the reporting app passed
     * a title. A wrapper is used only when there IS a title, so the untitled
     * shape renders exactly as it did.
     */
    var msgSpan = document.createElement(opts.title ? 'div' : 'span');
    msgSpan.style.cssText = 'flex:1;word-wrap:break-word';

    if (opts.title) {
      var titleEl = document.createElement('div');
      titleEl.setAttribute('data-stx-toast-title', '');
      titleEl.style.cssText = 'font-weight:600;margin-bottom:0.125rem';
      titleEl.textContent = opts.title;
      msgSpan.appendChild(titleEl);

      var bodyEl = document.createElement('div');
      bodyEl.style.cssText = 'opacity:0.9';
      bodyEl.textContent = message;
      msgSpan.appendChild(bodyEl);
    }
    else {
      msgSpan.textContent = message;
    }

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.style.cssText = 'flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;color:' + (isDark ? '#9ca3af' : '#6b7280') + ';font-size:1.125rem;line-height:1;display:flex;align-items:center';
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>';
    closeBtn.onclick = function() { removeToast(id); };

    el.appendChild(iconSpan);
    el.appendChild(msgSpan);
    el.appendChild(closeBtn);
    container.appendChild(el);

    if (duration > 0) {
      setTimeout(function() { removeToast(id); }, duration);
    }

    return id;
  }

  var toast = {
    success: function(message, options) { return addToast('success', message, options); },
    error: function(message, options) { return addToast('error', message, options); },
    info: function(message, options) { return addToast('info', message, options); },
    warning: function(message, options) { return addToast('warning', message, options); },
    dismiss: function(id) {
      if (id !== undefined) {
        // A string id is the semantic key the caller passed; a number is the
        // handle addToast returned. Both dismiss, so a caller does not have to
        // know which kind it is holding (#1913).
        if (typeof id === 'string') {
          var c = _getToastContainer();
          var match = c && c.querySelector('[data-stx-toast-key="' + id.replace(/\"/g, '') + '"]');
          if (match)
            removeToast(match.getAttribute('data-stx-toast'));
          return;
        }
        removeToast(id);
        return;
      }
      var container = _getToastContainer();
      if (!container) return;
      var all = container.querySelectorAll('[data-stx-toast]');
      for (var i = 0; i < all.length; i++) {
        var tid = all[i].getAttribute('data-stx-toast');
        removeToast(tid);
      }
    }
  };`
