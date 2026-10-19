/** Shared overlay stack and modal facade used by the generated client runtime. */
export const SIGNALS_OVERLAY_RUNTIME = `  // ── Overlay stack ─────────────────────────────────────────────────
  //
  // One stack for everything that takes over the page: stxAlert/stxConfirm,
  // the runtime modal and drawer, @stacksjs/components' Dialog and Drawer, and
  // anything an app draws itself (window.stx.overlays). Each of those used to
  // keep its own listener, its own scroll lock and its own idea of whether it
  // was on top, so with one open over another a single Escape closed both, two
  // Tab traps fought over focus, and the first to close unlocked the page under
  // the one still open (stacksjs/stx#2057; #1998 fixed the same thing for the
  // confirm dialogs alone).
  //
  // Only the topmost overlay answers Escape and owns Tab. The page is locked
  // from the first open to the last close. Focus moves into an overlay when it
  // opens and back to whatever opened it when it closes.
  //
  // A popup - a menu, a listbox, a popover - goes on the same stack as a
  // non-modal layer (modal: false). It takes Escape while it is on top, so one
  // Escape inside a dialog closes the menu and leaves the dialog, but it does
  // not lock the page, trap Tab or move focus: those follow the topmost MODAL
  // layer. Each popup used to listen for Escape on the document itself, and
  // whichever listener was registered first won.
  var _overlays = [];
  var _overlayScroll = null;
  var _overlayInerted = [];
  var _overlayListening = false;
  var _OVERLAY_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function _overlayTop() {
    return _overlays.length ? _overlays[_overlays.length - 1] : null;
  }

  // The layer that owns Tab and the page lock: the topmost modal one.
  function _overlayTopModal() {
    for (var i = _overlays.length - 1; i >= 0; i--) {
      if (_overlays[i].modal) return _overlays[i];
    }
    return null;
  }

  function _overlayIndex(id) {
    for (var i = 0; i < _overlays.length; i++) {
      if (_overlays[i].id === id) return i;
    }
    return -1;
  }

  // The panel is asked for, not held: a component's panel may not be rendered
  // yet on the frame it opens, and may be replaced while open.
  function _overlayPanel(entry) {
    var panel = entry && entry.panel;
    try {
      // A selector is looked up each time, like a function: the element it
      // names may be rendered after the overlay opens, or replaced while open.
      if (typeof panel === 'string') panel = document.querySelector(panel);
      else if (typeof panel === 'function') panel = panel();
    }
    catch (_e) { panel = null; }
    return panel || entry.root || null;
  }

  function _overlayShown(nodes) {
    return Array.prototype.filter.call(nodes, function(el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function _overlayFocusable(panel) {
    return _overlayShown(panel.querySelectorAll(_OVERLAY_FOCUSABLE));
  }

  // One listener for every overlay, in the bubble phase: a widget inside an
  // overlay that consumes Escape (a menu closing itself) calls preventDefault
  // and the overlay leaves it alone.
  function _overlayKey(e) {
    var top = _overlayTop();
    if (!top) return;
    if (e.key === 'Escape') {
      if (e.defaultPrevented || !top.onEscape) return;
      e.preventDefault();
      top.onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    var trap = _overlayTopModal();
    if (!trap) return;
    var panel = _overlayPanel(trap);
    if (!panel) return;
    var items = _overlayFocusable(panel);
    if (!items.length) {
      e.preventDefault();
      if (panel.focus) panel.focus();
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    if (!panel.contains(active)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
    else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Lock, listen and inert to match the stack after any change.
  function _overlaySync() {
    if (stxHost.isNative) {
      stxHost.syncOverlays(_overlays.map(function(entry) {
        return Object.assign({}, entry, { onRequestClose: function(event) {
          if (entry.onRequestClose) { entry.onRequestClose(event); return; }
          var reason = event && (event.reason || (event.nativeEvent && event.nativeEvent.reason));
          if (reason === 'backdrop') { if (entry.onBackdrop) entry.onBackdrop(); }
          else if (reason === 'back' || reason === 'escape') { if (entry.onEscape) entry.onEscape(); }
          else if (!!entry.onBackdrop === !!entry.onEscape) { if (entry.onEscape) entry.onEscape(); }
          else console.warn('[stx:overlays] Native dismissal was denied: this host must report reason=backdrop or reason=back to honor different closeOnBackdrop/closeOnEscape policies.');
        } });
      }));
      return;
    }
    for (var i = 0; i < _overlayInerted.length; i++) {
      try { _overlayInerted[i].inert = false; }
      catch (_e) { /* element may be gone */ }
    }
    _overlayInerted = [];

    var top = _overlayTop();
    var modal = _overlayTopModal();
    if (!modal && _overlayScroll) {
      document.body.style.overflow = _overlayScroll.body;
      document.documentElement.style.overflow = _overlayScroll.html;
      document.body.style.paddingRight = _overlayScroll.pad;
      _overlayScroll = null;
    }
    if (!top) {
      if (_overlayScroll) {
        document.body.style.overflow = _overlayScroll.body;
        document.documentElement.style.overflow = _overlayScroll.html;
        document.body.style.paddingRight = _overlayScroll.pad;
        _overlayScroll = null;
      }
      if (_overlayListening) {
        document.removeEventListener('keydown', _overlayKey);
        _overlayListening = false;
      }
      return;
    }

    if (modal && !_overlayScroll) {
      _overlayScroll = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow,
        pad: document.body.style.paddingRight
      };
      // The scrollbar's width comes back as padding, so the page does not jump
      // sideways when it disappears.
      var gap = window.innerWidth - document.documentElement.clientWidth;
      if (gap > 0) {
        var existing = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
        document.body.style.paddingRight = (existing + gap) + 'px';
      }
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    if (!_overlayListening) {
      document.addEventListener('keydown', _overlayKey);
      _overlayListening = true;
    }

    // An overlay given a z-index stacks by the order it opened in, not by
    // where it sits in the document: one lifted into the body early (a sheet
    // mounted before the sheet it later opens over) drew underneath. Set on
    // every change, so what stays open closes up when one under it closes. A
    // closed overlay keeps its last value, so it slides away above the one
    // it was over.
    for (var z = 0; z < _overlays.length; z++) {
      var layer = _overlays[z];
      if (typeof layer.zIndex === 'number' && layer.root && layer.root.style) layer.root.style.zIndex = String(layer.zIndex + z);
    }

    // inert, rather than aria-hidden, takes the page behind out of the tab
    // order and the accessibility tree together (#1998). Only behind an
    // overlay that is a child of the body element - one the runtime appended,
    // or one an app lifted there - or one opened inside such an overlay (a
    // dialog in a sheet's content). An overlay rendered inside the page's own
    // markup would go inert with the page; its Tab trap is what holds it.
    var root = _overlayInertRoot(modal);
    if (root) {
      var kids = document.body.children;
      for (var k = 0; k < kids.length; k++) {
        var kid = kids[k];
        if (kid === root || kid.inert) continue;
        try {
          kid.inert = true;
          _overlayInerted.push(kid);
        }
        catch (_e) { /* inert unsupported; the Tab trap still holds */ }
      }
    }
  }

  // The child of the body that keeps the rest of the page inert while this
  // modal layer is on top: its own root when that is in the body, or the
  // root of the open overlay it sits inside. A dialog opened from a sheet's
  // content is not itself in the body, and the page behind the sheet used to
  // come back to the keyboard and screen readers while it was up.
  function _overlayInertRoot(modal) {
    if (!modal) return null;
    var el = modal.root || _overlayPanel(modal);
    while (el && el.parentNode && el.parentNode !== document.body) el = el.parentNode;
    if (!el || el.parentNode !== document.body) return null;
    if (el === modal.root) return el;
    for (var i = 0; i < _overlays.length; i++) {
      if (_overlays[i] !== modal && _overlays[i].root === el) return el;
    }
    return null;
  }

  // The next chance to act, whichever comes first: rAF is suspended in a
  // background tab, so a timer races it.
  function _overlaySoon(callback) {
    var done = false;
    var once = function() {
      if (done) return;
      done = true;
      callback();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(once);
    setTimeout(once, 32);
  }

  // Retried, because focus() on an element that is not displayed yet is a
  // silent no-op. Stops once the overlay has closed.
  function _overlayFocusIn(entry, attempts) {
    if (_overlayIndex(entry.id) === -1) return;
    var target = null;
    try { target = typeof entry.initialFocus === 'function' ? entry.initialFocus() : entry.initialFocus; }
    catch (_e) { target = null; }
    var panel = _overlayPanel(entry);
    // An [autofocus] that is not shown (behind a :show, a player in a
    // dialog that is showing something else) cannot take focus: skipped, or
    // focus went nowhere and the panel's first control never got it.
    if (!target && panel) target = _overlayShown(panel.querySelectorAll('[autofocus]'))[0] || _overlayFocusable(panel)[0] || panel;
    if (target && target.focus) target.focus();
    if (target && document.activeElement === target) return;
    if (attempts > 0) _overlaySoon(function() { _overlayFocusIn(entry, attempts - 1); });
  }

  var overlays = {
    /**
     * Put an overlay on top. Calling it again for an open id updates its
     * options and nothing else, so it is safe from an effect that re-runs.
     *
     * options: modal (default true; false for a popup, which takes Escape
     * while on top but does not lock, trap or move focus), panel (an element,
     * a selector, or a function returning one; focus stays inside it), root (the overlay's outermost element, if it is not the panel),
     * zIndex (a base: the root's z-index becomes it plus the overlay's place
     * in the stack, so a later overlay draws over an earlier one wherever it
     * sits in the document), onEscape (leave out for one that must be answered), initialFocus
     * (element or function; defaults to [autofocus], then the first focusable,
     * then the panel), opener (where focus goes back; defaults to whatever had
     * it), restoreFocus (default true).
     */
    open: function(id, options) {
      var opts = options || {};
      var at = _overlayIndex(id);
      if (at !== -1) {
        var existing = _overlays[at];
        var updated = Object.assign({}, existing);
        for (var key in opts) {
          if (Object.prototype.hasOwnProperty.call(opts, key)) updated[key] = opts[key];
        }
        // A native presenter holds callbacks for the last accepted entry.
        // Do not mutate it until the replacement has passed host validation.
        _overlays[at] = updated;
        try { _overlaySync(); }
        catch (e) { _overlays[at] = existing; throw e; }
        return;
      }
      var isModal = opts.modal !== false;
      var entry = {
        id: id,
        modal: isModal,
        panel: opts.panel,
        root: opts.root || null,
        zIndex: typeof opts.zIndex === 'number' ? opts.zIndex : null,
        onEscape: opts.onEscape || null,
        onBackdrop: opts.onBackdrop || null,
        initialFocus: opts.initialFocus || null,
        // A popup hands focus back itself, to its own trigger, and only when
        // focus was inside it; a modal layer always does.
        restoreFocus: opts.restoreFocus !== undefined ? opts.restoreFocus !== false : isModal,
        opener: opts.opener !== undefined ? opts.opener : (stxHost.isNative ? null : document.activeElement),
        // Native Modal reports backdrop/back dismissal through the same host
        // event. Shared components supply the applicable dismissal policy.
        onRequestClose: opts.onRequestClose || null
      };
      _overlays.push(entry);
      try { _overlaySync(); }
      catch (e) { _overlays.splice(_overlays.indexOf(entry), 1); throw e; }
      // Synchronously first, so a caller that asserts focus straight after
      // opening sees it; then retried for a panel that is not displayed yet.
      // A popup keeps focus where its own keyboard handling puts it.
      if (!stxHost.isNative && (isModal || opts.initialFocus)) _overlayFocusIn(entry, 10);
    },
    /** Take an overlay off the stack, wherever it is in it. */
    close: function(id) {
      var at = _overlayIndex(id);
      if (at === -1) return;
      var wasTop = at === _overlays.length - 1;
      var entry = _overlays.splice(at, 1)[0];
      _overlaySync();
      // Only the overlay that had the keyboard gives it back. Closing one
      // underneath (its owner went away) must not pull focus out of the top.
      var opener = entry.opener;
      if (!stxHost.isNative && wasTop && entry.restoreFocus && opener && opener.isConnected !== false && typeof opener.focus === 'function') {
        try { opener.focus(); }
        catch (_e) { /* gone; nothing to give focus back to */ }
      }
    },
    /** Whether this overlay is the one that has the keyboard. */
    isTop: function(id) {
      var top = _overlayTop();
      return !!top && top.id === id;
    },
    /** Open overlay ids, outermost first. */
    list: function() {
      return _overlays.map(function(o) { return o.id; });
    }
  };

  // ── Modal system ──────────────────────────────────────────────────
  var modal = {
    open: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (!el) { console.warn('[stx:modal] Modal "' + id + '" not found'); return; }
      el.style.display = 'flex';
      // Force reflow then animate
      void el.offsetHeight;
      el.setAttribute('data-stx-modal-open', '');
      // The lock, Escape for the topmost and the Tab trap come from the
      // overlay stack, shared with every other overlay (stacksjs/stx#2057).
      // Each modal used to bind its own Escape and set body overflow itself,
      // so two open closed together and the first to close unlocked the page.
      overlays.open('stx-modal:' + id, {
        panel: el,
        onEscape: el.getAttribute('data-close-escape') !== 'false' ? function() { modal.close(id); } : null
      });
      if (el.getAttribute('data-close-backdrop') !== 'false') {
        el.onclick = function(e) { if (e.target === el) modal.close(id); };
      }
    },
    close: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (!el) return;
      el.removeAttribute('data-stx-modal-open');
      el.onclick = null;
      overlays.close('stx-modal:' + id);
      setTimeout(function() {
        if (!el.hasAttribute('data-stx-modal-open')) el.style.display = 'none';
      }, 200);
    },
    toggle: function(id) {
      var el = document.querySelector('[data-stx-modal="' + id + '"]');
      if (el && el.hasAttribute('data-stx-modal-open')) modal.close(id);
      else modal.open(id);
    }
  };
`
