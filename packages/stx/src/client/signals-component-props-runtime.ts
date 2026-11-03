/** Parent-to-component reactive prop bindings for the generated client runtime. */
export const SIGNALS_COMPONENT_PROPS_RUNTIME = `  function bindParentComponentProps(el, callerScope) {
    if (!el || !el.getAttribute || el.__stx_parent_props_bound) return;
    var names = __stxWords(el.getAttribute('data-stx-parent-bindings') || '');
    if (!names.length) return;
    if (hasPendingLoopBoundary(el)) {
      preserveDeferredParentComponentProps(el);
      return;
    }
    var deferred = readDeferredParentComponentProps(el);
    var bindings = names.map(function(name) {
      var sourceName = ':' + name;
      var expression = el.hasAttribute(sourceName) ? el.getAttribute(sourceName) : deferred[name];
      return typeof expression === 'string'
        ? { name: name, sourceName: sourceName, expression: expression }
        : null;
    }).filter(Boolean);
    if (!bindings.length) return;
    el.__stx_parent_props_bound = true;
    var scope = layerTemplateScopes(globalHelpers, callerScope);

    bindings.forEach(function(binding) {
      var name = binding.name;
      var sourceName = binding.sourceName;
      var expression = binding.expression;
      effect(function() {
        var value;
        try {
          // Support both signal styles in forwarded props:
          //   :open="open" and :open="open()".
          // Auto-unwrap bare signals, but preserve a signal function when this
          // expression explicitly calls it or accesses its object API.
          var unwrapScope = createAutoUnwrapProxy(scope, function(prop) {
            if (typeof prop !== 'string') return false;
            return expressionCallsSignal(expression, prop)
              || expressionUsesSignalApi(expression, prop);
          });
          var fn = __stxCompileScoped(unwrapScope, [], 'return (' + expression + ')');
          value = fn(...__stxArgs(fn, unwrapScope));
          if (value && typeof value === 'function' && (value._isSignal || value._isDerived)) value = value();
        }
        catch (e) {
          reportUnknownBinding(e, expression, scope, el);
          if (!(e instanceof ReferenceError) && !(e instanceof TypeError))
            console.warn('[STX] Parent component prop error:', expression, e);
          value = undefined;
        }

        // Preserve native prop types; the DOM host reflects boolean presence
        // and serializes structured values at its own boundary.
        if (name.startsWith('aria-') && typeof value === 'boolean') {
          stxHost.setAttribute(el, name, String(value));
        }
        else if (value === null || value === undefined) {
          stxHost.removeAttribute(el, name);
        }
        else {
          stxHost.setAttribute(el, name, value);
        }
        // The component setup scope is already registered for normal and
        // cloned signal components. Update its prop signal directly so object
        // identity and synchronous Vue-like prop delivery do not depend on a
        // MutationObserver round trip through a serialized DOM attribute.
        // The attribute remains the public DOM reflection and observer fallback
        // for scopes that register after this binding pass.
        syncComponentPropSignal(el, name, value);
      });
      el.removeAttribute(sourceName);
      delete deferred[name];
    });
    if (Object.keys(deferred).length)
      el.setAttribute('data-stx-deferred-parent-bindings', JSON.stringify(deferred));
    else
      el.removeAttribute('data-stx-deferred-parent-bindings');
  }

  function resolveComponentCallerScope(el, pageScope) {
    return componentCallerScopeFrom(el && (el.parentElement || el.parentNode), pageScope);
  }

  // The caller scope for a component placed under \`current\`: the page's
  // scope, then every component scope around it, outermost first. A native
  // loop row binds before it is inserted, so it asks from its future parent.
  function componentCallerScopeFrom(current, pageScope) {
    var ancestors = [];
    while (current && current !== document) {
      if (current.getAttribute && current.hasAttribute('data-stx-scope'))
        ancestors.push(current.getAttribute('data-stx-scope'));
      current = current.parentElement || current.parentNode;
    }
    // Layered rather than copied: a copy of the page scope (hundreds of
    // names) per component instance was a fifth of mounting a list of rows.
    var sources = [pageScope];
    ancestors.reverse().forEach(function(scopeId) {
      var ancestorScope = window.stx._scopes && window.stx._scopes[scopeId];
      if (ancestorScope) sources.push(ancestorScope);
    });
    return layerTemplateScopes.apply(null, sources);
  }
`
