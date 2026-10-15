/** Alert and confirm dialog helpers used by the generated client runtime. */
export const SIGNALS_DIALOG_RUNTIME = `  // ── Alert & Confirm dialogs ─────────────────────────────────────
  // Styled replacements for window.alert() and window.confirm().
  // Both return Promises and render into a temporary modal overlay.

  var _dialogId = 0;

  // Modality - the scroll lock, the inert page behind, the one Escape and the
  // one Tab trap - comes from the overlay stack above, which these dialogs
  // share with every other overlay on the page (#1998, stacksjs/stx#2057).

  /** Dialogs animate unless the reader asked them not to (#1998 item 5). */
  function _dialogReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    catch (_e) {
      return false;
    }
  }
  var _dialogIcons = {
    info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    question: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function _createDialog(message, options, isConfirm) {
    var opts = options || {};
    var type = opts.type || (isConfirm ? 'question' : 'info');
    var title = opts.title || '';
    var confirmText = opts.confirmText || 'OK';
    var cancelText = opts.cancelText || 'Cancel';
    var id = 'stx-dialog-' + (++_dialogId);
    // Resolve dark from what the APP decided, not only from the OS. stx's own
    // color-mode boot writes a class (default 'dark') and/or an attribute
    // (e.g. data-theme) onto <html>, so an app pinned to light on a dark OS used
    // to get a dark dialog over a light page. An explicit opts.dark wins over
    // both, and the media query stays as the last resort. See #1875.
    var isDark = _resolveDark(opts.dark);
    var bg = isDark ? '#1f2937' : '#ffffff';
    var textColor = isDark ? '#f3f4f6' : '#1f2937';
    var subColor = isDark ? '#9ca3af' : '#6b7280';
    var icon = _dialogIcons[type] || _dialogIcons.info;

    return new Promise(function(resolve) {
      // Inline transitions cannot be reached by a stylesheet media query, so the
      // preference is read here instead (#1998 item 5). One matchMedia probe
      // rather than usePreferredReducedMotion(): that returns a signal with a
      // change listener, and an imperative dialog that reads the value once at
      // open time would leak one listener per call.
      var still = _dialogReducedMotion();
      var fade = still ? '' : 'transition:opacity 0.2s ease;';
      var scale = still ? '' : 'transition:transform 0.2s ease;';

      var backdrop = document.createElement('div');
      backdrop.id = id;
      backdrop.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);opacity:' + (still ? '1' : '0') + ';' + fade + 'font-family:system-ui,-apple-system,sans-serif';
      backdrop.setAttribute('role', 'alertdialog');
      backdrop.setAttribute('aria-modal', 'true');

      var panel = document.createElement('div');
      panel.style.cssText = 'max-width:24rem;width:calc(100% - 2rem);border-radius:0.75rem;padding:1.5rem;background:' + bg + ';color:' + textColor + ';box-shadow:0 20px 60px rgba(0,0,0,0.3);transform:scale(' + (still ? '1' : '0.95') + ');' + scale + 'text-align:center';

      var iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:1rem';
      iconDiv.innerHTML = icon;
      panel.appendChild(iconDiv);

      if (title) {
        var titleEl = document.createElement('h3');
        titleEl.id = id + '-title';
        titleEl.style.cssText = 'margin:0 0 0.5rem;font-size:1.125rem;font-weight:600';
        titleEl.textContent = title;
        panel.appendChild(titleEl);
        // role=alertdialog was announced with no accessible name at all.
        backdrop.setAttribute('aria-labelledby', titleEl.id);
      }

      var msgEl = document.createElement('p');
      msgEl.id = id + '-message';
      msgEl.style.cssText = 'margin:0 0 1.25rem;font-size:0.875rem;line-height:1.5;color:' + subColor;
      msgEl.textContent = message;
      panel.appendChild(msgEl);
      backdrop.setAttribute('aria-describedby', msgEl.id);
      if (!title)
        backdrop.setAttribute('aria-label', message);

      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:0.75rem;justify-content:center';

      // Captured before the dialog steals focus, so it can be handed back on
      // close. Without this a keyboard or screen-reader user is dropped at the
      // top of the document every time a dialog closes.
      var previouslyFocused = document.activeElement;
      var closed = false;

      function cleanup(result) {
        // Guarded: the escape handler used to be able to fire after a button had
        // already closed the dialog, because the listener outlived it.
        if (closed) return;
        closed = true;

        // The fade is 200ms and resolve() is immediate, so for those 200ms a
        // full-viewport element at z-index 999999 was still hit-testing at the
        // centre of the screen - after the caller's await had already returned
        // (#1998 item 6). Fading out is right; swallowing clicks is not.
        backdrop.style.pointerEvents = 'none';
        backdrop.style.opacity = '0';
        if (!still) panel.style.transform = 'scale(0.95)';
        setTimeout(function() { backdrop.remove(); }, still ? 0 : 200);

        // Out of the stack BEFORE resolving, so a caller that opens another
        // dialog the moment this one answers does not land under a backdrop
        // that is still fading. That also unlocks the page and clears inert
        // when this was the last overlay, hands modality back to the one
        // underneath when it was not, and gives focus back to the opener.
        overlays.close(id);
        resolve(result);
      }

      // Declared out here rather than inside the branch: the focus decision
      // below needs to know whether a Cancel button exists at all.
      var cancelBtn = null;
      if (isConfirm) {
        cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = 'padding:0.5rem 1.25rem;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;border:1px solid ' + (isDark ? '#374151' : '#d1d5db') + ';background:transparent;color:' + textColor + ';transition:background 0.15s';
        cancelBtn.onmouseover = function() { this.style.background = isDark ? '#374151' : '#f3f4f6'; };
        cancelBtn.onmouseout = function() { this.style.background = 'transparent'; };
        cancelBtn.onclick = function() { cleanup(false); };
        btnRow.appendChild(cancelBtn);
      }

      var okBtn = document.createElement('button');
      okBtn.textContent = confirmText;
      var btnColor = type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#5672cd';
      okBtn.style.cssText = 'padding:0.5rem 1.25rem;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;border:none;background:' + btnColor + ';color:#fff;transition:opacity 0.15s';
      okBtn.onmouseover = function() { this.style.opacity = '0.9'; };
      okBtn.onmouseout = function() { this.style.opacity = '1'; };
      okBtn.onclick = function() { cleanup(isConfirm ? true : undefined); };
      btnRow.appendChild(okBtn);

      panel.appendChild(btnRow);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);

      // Animate in
      if (!still) {
        void backdrop.offsetHeight;
        backdrop.style.opacity = '1';
        panel.style.transform = 'scale(1)';
      }


      /*
       * Initial focus, which was an unconditional okBtn.focus() (#1998 item 3).
       *
       * type: 'error' already paints that button red, so the API knows the
       * action is destructive - and still handed it the keyboard, where a stray
       * Enter or Space confirmed the delete. An error-type confirm now defaults
       * to Cancel, and defaultFocus overrides either way.
       *
       * An alert has only one button, so it keeps it: there is nothing
       * destructive to land on and focus has to go somewhere inside the trap.
       */
      var focusTarget = okBtn;
      if (isConfirm && cancelBtn) {
        var want = opts.defaultFocus;
        if (want === 'cancel' || (!want && type === 'error')) focusTarget = cancelBtn;
        else if (want === 'confirm') focusTarget = okBtn;
      }

      // Onto the overlay stack, which locks the page, makes it inert behind
      // this backdrop, traps Tab inside the panel and answers Escape for
      // whichever dialog is on top - so one Escape answers one dialog
      // (#1998 item 4) and a component Dialog underneath stays open.
      overlays.open(id, {
        panel: panel,
        root: backdrop,
        initialFocus: focusTarget,
        opener: previouslyFocused,
        onEscape: function() { cleanup(isConfirm ? false : undefined); }
      });
    });
  }

  function stxAlert(message, options) {
    return _createDialog(message, options, false);
  }

  function stxConfirm(message, options) {
    return _createDialog(message, options, true);
  }
`
