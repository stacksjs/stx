/** Signal-aware event expression handling for the generated client runtime. */
export const SIGNALS_HANDLER_RUNTIME = `  function expressionUsesSignalApi(expression, name) {
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return expressionUsesSignalMethod(expression, name)
      || expressionUsesSignalValue(expression, name);
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
    var escapedName = name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
    return new RegExp('(?:^|[^\\\\w$])' + escapedName + '\\\\s*\\\\(').test(expression);
  }

  function createExpressionAutoUnwrapProxy(scope, expression) {
    return createAutoUnwrapProxy(scope, function(prop, signal) {
      if (typeof prop !== 'string') return false;
      if (expressionCallsSignal(expression, prop) || expressionUsesSignalMethod(expression, prop))
        return true;
      if (!expressionUsesSignalValue(expression, prop))
        return false;

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
    });
  }

  function executeHandler(expr, event, el) {
    try {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expr.trim())) {
        return;
      }
      // First try component-level scope
      const elementScope = findElementScope(el || currentElement);
      const scope = mergeTemplateScopes(globalHelpers, componentScope, (elementScope || {}));

      // Check for shorthand syntax (Feature #8)
      const shorthandFn = parseEventShorthand(expr, scope);
      if (shorthandFn) {
        shorthandFn(event);
        return;
      }

      // Loop items arrive as signals (see createItemElements). Unwrap them for
      // the same reason the inline @event path does: \`item.value\` in a handler
      // means the item's field, not the signal API.
      const handlerScope = {};
      Object.keys(scope).forEach(function(k) {
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
