/** Reactive visibility binding for the generated client runtime. */
export const SIGNALS_SHOW_RUNTIME = `  function bindShow(el, expr, passedScope = componentScope, attrName = '@show') {
    if (el.__stx_show_bound) return;
    el.__stx_show_bound = true;

    const capturedScope = mergeTemplateScopes(globalHelpers, passedScope, (findElementScope(el) || {}));

    // Check if the expression is a simple signal reference (most common case for :show)
    const directSignal = capturedScope[expr];
    if (directSignal && directSignal._isSignal) {
      // Fast path: directly subscribe to the signal — guaranteed reactive
      effect(() => {
        const value = directSignal();

        stxHost.setVisible(el, !!value);
      });
    } else {
      // Complex expression path — use createAutoUnwrapProxy with fallback,
      // matching the retry pattern in evalAttrExpr. This ensures call
      // expressions like !recording() work: the proxy auto-unwraps
      // signals on property access, so recording remains a callable
      // signal function (not unwrapped to its boolean value).
      effect(() => {
        var value;
        try {
          var unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
          var fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
          value = fn(...__stxArgs(fn, unwrapScope));
        } catch (e1) {
          // Retry without unwrapping — handles edge cases where the proxy
          // interferes with certain expression patterns
          try {
            var fn2 = __stxCompileScoped(capturedScope, [], 'return ' + expr);
            value = fn2(...__stxArgs(fn2, capturedScope));
          } catch (e2) {
            // Suppress ReferenceError/TypeError during async init — a signal
            // or object may not be ready yet on the first effect run, and
            // the next pass will re-evaluate once data arrives.
            if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Show expression error:', expr, e2);
            stxHost.setVisible(el, false);
            return;
          }
        }
        var wasVisible = stxHost.setVisible(el, !!value);
        // When transitioning from hidden to visible, stamp the element so
        // @click handlers can ignore clicks from the same frame (prevents
        // modal backdrop from catching the click that opened the modal)
        if (value && !wasVisible) {
          el.__stx_shown_at = performance.now();
        }
      });
    }
    el.removeAttribute(attrName);
  }
`
