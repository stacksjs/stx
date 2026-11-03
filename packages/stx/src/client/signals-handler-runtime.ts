/** Signal-aware event expression handling for the generated client runtime. */
export const SIGNALS_HANDLER_RUNTIME = `  // Each answer depends only on the expression and the name, and each is a
  // regular expression built for the pair: asked for every signal a binding
  // or prop reads, so it is kept (and a name the expression does not hold
  // is answered without one).
  const __stxSignalPatterns = new Map();
  function rememberedSignalPattern(kind, expression, name, test) {
    if (expression.indexOf(name) === -1) return false;
    var key = kind + '\\u0001' + name + '\\u0001' + expression;
    var known = __stxSignalPatterns.get(key);
    if (known === undefined) {
      if (__stxSignalPatterns.size >= 5000) __stxSignalPatterns.clear();
      known = test(expression, name);
      __stxSignalPatterns.set(key, known);
    }
    return known;
  }

  function expressionUsesSignalApi(expression, name) {
    return rememberedSignalPattern('api', expression, name, function(text, signalName) {
      return expressionUsesSignalMethod(text, signalName) || expressionUsesSignalValue(text, signalName);
    });
  }

  function expressionUsesSignalMethod(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\.\\\\s*(?:set|update|subscribe|toggle|input|change)\\\\s*\\\\(').test(expression);
  }

  function expressionUsesSignalValue(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\.\\\\s*value\\\\b').test(expression);
  }

  function expressionCallsSignal(expression, name) {
    return rememberedSignalPattern('call', expression, name, expressionCallsSignalNow);
  }

  function expressionCallsSignalNow(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\(').test(expression);
  }

  // What an expression does with a signal it names: calls it, calls one of
  // its methods, reads its .value, or none of these. It depends only on the
  // expression and the name, so it is worked out once: three regular
  // expressions were built for every signal an expression read, every time
  // it ran.
  const __stxSignalUse = new Map();
  function expressionSignalUse(expression, name) {
    let uses = __stxSignalUse.get(expression);
    if (uses === undefined) {
      if (__stxSignalUse.size >= 5000) __stxSignalUse.clear();
      uses = new Map();
      __stxSignalUse.set(expression, uses);
    }
    let use = uses.get(name);
    if (use === undefined) {
      use = expression.indexOf(name) === -1 ? 0
        : expressionCallsSignal(expression, name) || expressionUsesSignalMethod(expression, name) ? 1
          : expressionUsesSignalValue(expression, name) ? 2 : 0;
      uses.set(name, use);
    }
    return use;
  }

  function expressionKeepsSignal(expression, prop, signal) {
    if (typeof prop !== 'string') return false;
    const use = expressionSignalUse(expression, prop);
    if (use === 1) return true;
    if (use === 0) return false;
    // A :for item is itself represented by a signal. If that item's value
    // is an object with a real value field, item.value means the field,
    // not the signal wrapper API. Primitive signals still support
    // count.value, matching the explicit ref syntax.
    try {
      var currentValue = signal();
      return !(currentValue && typeof currentValue === 'object'
        && Object.prototype.hasOwnProperty.call(currentValue, 'value'));
    }
    catch (e) {
      return true;
    }
  }

  function createExpressionAutoUnwrapProxy(scope, expression) {
    return createExpressionUnwrapProxy(scope, expression);
  }

  function executeHandler(expr, event, el) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      // Layered, not copied: a merge copied every name in scope on each event.
      const scope = layerTemplateScopes(globalHelpers, componentScope, (elementScope || {}));

      // Check for shorthand syntax (Feature #8)
      const shorthandFn = parseEventShorthand(expr, scope);
      if (shorthandFn) {
        shorthandFn(event);
        return;
      }

      // Loop items arrive as signals (see createItemElements). Unwrap them for
      // the same reason the inline @event path does: \`item.value\` in a handler
      // means the item's field, not the signal API.
      // Only the names the handler mentions are read: a page's scope holds hundreds.
      const handlerScope = {};
      __stxNamesIn(expr).forEach(function(k) {
        if (!(k in scope)) return;
        const v = scope[k];
        handlerScope[k] = (v && typeof v === 'function' && v._isStxLoopItem) ? v() : v;
      });
      const fn = __stxCompileScoped(handlerScope, ['$event'], expr);
      fn(...__stxArgs(fn, handlerScope), event);
    }
catch (e) {
      // Event handlers fire on user interaction, not reactive re-runs — there's no
      // async-hydration race to silence. Surfacing TypeError/ReferenceError is what
      // turns "@click does nothing, no warning" into a 5-second debug. See #1694.
      console.warn('[STX] Handler error:', expr, e);
    }
  }
`
