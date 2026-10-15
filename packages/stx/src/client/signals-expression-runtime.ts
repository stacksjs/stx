/** Scope lookup and expression evaluation for the generated client runtime. */
export const SIGNALS_EXPRESSION_RUNTIME = `  let componentScope = { $refs: {} };

  // Current element being processed (for scope lookup)
  let currentElement = null;

  function findElementScope(el) {
    let current = el;
    while (current && current !== document) {
      // Check element-local scope first (from stx.mount())
      if (current.__stx_scope) {
        return current.__stx_scope;
      }
      if (current.hasAttribute && current.hasAttribute('data-stx-scope')) {
        const scopeId = current.getAttribute('data-stx-scope');
        if (window.stx._scopes && window.stx._scopes[scopeId]) {
          return window.stx._scopes[scopeId];
        }
      }
      current = current.parentElement || current.parentNode;
    }
    return null;
  }

  function toValue(expr, el, enableAutoUnwrap = true, extraScope = {}) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return expr;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const baseScope = { ...globalHelpers, ...componentScope, ...(elementScope || {}), ...extraScope };

      // Check for pipe syntax (Feature #2)
      const pipeResult = parsePipeExpression(expr, baseScope);
      if (pipeResult) {
        // Use auto-unwrap proxy for pipe expressions
        const unwrapScope = enableAutoUnwrap
          ? createAutoUnwrapProxy(baseScope, function(prop) {
              if (typeof prop !== 'string') return false;
              return expressionCallsSignal(expr, prop)
                || expressionUsesSignalApi(expr, prop);
            })
          : baseScope;
        const piped = executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope);
        return (piped && typeof piped === 'function' && (piped._isSignal || piped._isDerived)) ? piped() : piped;
      }

      // Use auto-unwrap proxy if enabled (Feature #1)
      const scope = enableAutoUnwrap
        ? createAutoUnwrapProxy(baseScope, function(prop) {
            if (typeof prop !== 'string') return false;
            return expressionCallsSignal(expr, prop)
              || expressionUsesSignalApi(expr, prop);
          })
        : baseScope;
      const fn = __stxCompileScoped(baseScope, [], 'return ' + expr);
      const result = fn(...__stxArgs(fn, scope));
      // Post-eval unwrap — see evalAttrExpr note for the reason.
      return (result && typeof result === 'function' && (result._isSignal || result._isDerived)) ? result() : result;
    }
catch (e) {
      if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expr, e);
      return '';
    }
  }
`
