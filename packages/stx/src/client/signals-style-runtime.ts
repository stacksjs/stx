/** Reactive style binding for the generated client runtime. */
export const SIGNALS_STYLE_RUNTIME = `  function bindStyle(el, expr, passedScope = componentScope, isVisible) {
    // Capture scope at setup time - use passed scope to preserve context
    const capturedScope = mergeTemplateScopes(globalHelpers, passedScope, (findElementScope(el) || {}));

    const evalExpr = () => {
      // Mirror bindClass: first try the auto-unwrap proxy (so an expression
      // like { active: count > 5 } reads signals as primitives), then retry
      // with the raw scope so call-syntax expressions like
      // { color: theme() } still work — the proxy unwraps signals to
      // values, which would make theme() try to call a primitive and
      // throw TypeError.
      try {
        const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
        const fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
        return fn(...__stxArgs(fn, unwrapScope));
      }
catch (e1) {
        try {
          const fn2 = __stxCompileScoped(capturedScope, [], 'return ' + expr);
          return fn2(...__stxArgs(fn2, capturedScope));
        }
catch (e2) {
          reportUnknownBinding(e2, expr, capturedScope, el);
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Style expression error:', expr, e2);
          return {};
        }
      }
    };

    effect(() => {
      if (isVisible && !isVisible()) return;
      const value = evalExpr();
      stxHost.setStyle(el, value, true);
    });
  }
`
