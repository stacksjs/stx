/** Reactive class binding for the generated client runtime. */
export const SIGNALS_CLASS_RUNTIME = `  function bindClass(el, expr, passedScope = componentScope, isVisible) {
    const originalClasses = el.className;
    const capturedScope = mergeTemplateScopes(globalHelpers, passedScope, (findElementScope(el) || {}));
    const keys = Object.keys(capturedScope);

    // Pre-compile — only the names the expression mentions (see
    // __stxCompileScoped: reading every signal subscribed the class binding to
    // every signal on the page), and only valid JS identifiers.
    const mentioned = new Set(__stxNamesIn(expr));
    const safeKeys = keys.filter(k => mentioned.has(k) && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k));
    let fn;
    try {
      fn = __stxCompile(safeKeys, 'return ' + expr);
    } catch (e) {
      console.warn('[STX] bindClass compile error:', expr, e);
      return;
    }

    effect(() => {
      if (isVisible && !isVisible()) return;
      // Subscribe to signals by reading them, establishing reactive deps.
      // But pass RAW scope values to the fn so call-expressions like
      // activeTab() === 'overview' work — if we passed unwrapped values,
      // the fn would try to invoke a primitive and throw.
      for (let i = 0; i < safeKeys.length; i++) {
        const v = capturedScope[safeKeys[i]];
        if (v && typeof v === 'function' && (v._isSignal || v._isDerived)) {
          v();
        }
      }

      let value;
      try {
        // First pass: auto-unwrap proxy — handles expressions that read
        // signals as primitives (e.g. { 'active': count > 5 } where count
        // is a signal).
        const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
        value = fn.apply(null, safeKeys.map(k => unwrapScope[k]));
      } catch (e1) {
        // Retry with raw scope — handles call-expressions like activeTab()
        // that need the signal function to remain callable.
        try {
          value = fn.apply(null, safeKeys.map(k => capturedScope[k]));
        } catch (e2) {
          reportUnknownBinding(e2, expr, capturedScope, el);
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Class expression error:', expr, e2);
          value = '';
        }
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Object form { "cls-a cls-b": cond } — keys may contain multiple
        // whitespace-separated classes; classList.add/remove can't accept
        // those as a single token (throws DOMException), so split each key.
        Object.keys(value).forEach(cls => {
          const tokens = cls.split(/\\s+/).filter(Boolean);
          if (value[cls]) tokens.forEach(t => el.classList.add(t));
          else tokens.forEach(t => el.classList.remove(t));
        });
      }
else if (Array.isArray(value)) {
        var _clsArr = [originalClasses, value.filter(Boolean).join(' ')].filter(Boolean).join(' ');
        if (typeof el.className === 'string') el.className = _clsArr; else el.setAttribute('class', _clsArr);
      }
else {
        var _clsStr = [originalClasses, value || ''].filter(Boolean).join(' ');
        if (typeof el.className === 'string') el.className = _clsStr; else el.setAttribute('class', _clsStr);
      }
    });
  }
`
