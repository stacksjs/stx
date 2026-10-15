/** TransitionGroup animation helpers for the generated client runtime. */
export const SIGNALS_TRANSITION_GROUP_RUNTIME = `  // ── <TransitionGroup> support (#1742) ────────────────────────────────────
  // Class-driven enter/leave + FLIP move animations for keyed :for lists whose
  // parent is a [data-stx-transition-group]. All helpers are self-contained and
  // guarded (no-ops off the happy path), and every transition has a timeout
  // fallback so a missed transitionend (or a layout-less environment) can't hang
  // a leaving node in the DOM. bindFor calls these only when the parent is a
  // group AND the group has already done its initial render (no enter on mount).
  function tgDurationMs(el) {
    try {
      var cs = (typeof getComputedStyle === 'function') ? getComputedStyle(el) : null;
      if (cs) {
        var raw = (cs.transitionDuration || '').split(',')[0].trim();
        var ms = raw.indexOf('ms') >= 0 ? parseFloat(raw) : parseFloat(raw) * 1000;
        if (ms > 0) return ms;
      }
    } catch (e) {}
    return 300;
  }
  function tgOnEnd(el, cb) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      try { el.removeEventListener('transitionend', finish); } catch (e) {}
      cb();
    }
    try { el.addEventListener('transitionend', finish); } catch (e) {}
    // Fallback: transitionend may never fire (no real layout, display:none,
    // a dropped event). Always converge.
    setTimeout(finish, tgDurationMs(el) + 60);
  }
  function tgRaf2(fn) {
    var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function(f) { return setTimeout(f, 16); };
    raf(function() { raf(fn); });
  }
  function tgEnter(el, name) {
    if (!el || el.nodeType !== 1 || !el.classList) return;
    el.classList.add(name + '-enter-from', name + '-enter-active');
    tgRaf2(function() {
      el.classList.remove(name + '-enter-from');
      el.classList.add(name + '-enter-to');
      tgOnEnd(el, function() { el.classList.remove(name + '-enter-active', name + '-enter-to'); });
    });
  }
  function tgLeave(el, name) {
    if (!el || el.nodeType !== 1 || !el.classList) return false;
    el.classList.add(name + '-leave-from', name + '-leave-active');
    tgRaf2(function() {
      el.classList.remove(name + '-leave-from');
      el.classList.add(name + '-leave-to');
      tgOnEnd(el, function() { if (el.parentNode) el.parentNode.removeChild(el); });
    });
    return true; // took over the DOM removal
  }
  function tgSnapshot(els) {
    var m = new Map();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el && el.nodeType === 1 && el.getBoundingClientRect) {
        try { m.set(el, el.getBoundingClientRect()); } catch (e) {}
      }
    }
    return m;
  }
  function tgFlip(els, first, name) {
    var moved = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.nodeType !== 1 || !first.has(el) || !el.getBoundingClientRect) continue;
      var last, f = first.get(el);
      try { last = el.getBoundingClientRect(); } catch (e) { continue; }
      var dx = f.left - last.left, dy = f.top - last.top;
      if (dx || dy) {
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        el.style.transitionDuration = '0s';
        moved.push(el);
      }
    }
    if (!moved.length) return;
    // Force reflow so the inverted transform is committed before we play it.
    if (els[0] && typeof els[0].offsetHeight === 'number') void els[0].offsetHeight;
    var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function(f) { return setTimeout(f, 16); };
    raf(function() {
      moved.forEach(function(el) {
        el.classList.add(name + '-move');
        el.style.transform = '';
        el.style.transitionDuration = '';
        tgOnEnd(el, function() { el.classList.remove(name + '-move'); el.style.transform = ''; el.style.transitionDuration = ''; });
      });
    });
  }
`
