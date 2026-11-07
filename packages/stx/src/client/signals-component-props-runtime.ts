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
    if (el && el.__stx_slot_scope) return el.__stx_slot_scope;
    if (el && el.__stx_for_scope) return el.__stx_for_scope;
    return projectedSlotCallerScope(el, pageScope) || componentCallerScopeFrom(el && (el.parentElement || el.parentNode), pageScope);
  }

  function projectedSlotCallerScope(el, pageScope) {
    if (el && el.__stx_row_scope) return el.__stx_row_scope;
    if (el && el.__stx_page_scope) return layerTemplateScopes(el.__stx_page_scope, pageScope);
    if (el && el.__stx_scope && !el.hasAttribute('data-stx-scope')) return el.__stx_scope;
    var owner = el && el.getAttribute && el.getAttribute('data-stx-slot-owner');
    if (!owner) return null;
    var receiver = el.parentElement || el.parentNode;
    while (receiver && receiver !== document) {
      if (receiver.__stx_row_scope) return receiver.__stx_row_scope;
      if (receiver.__stx_page_scope) return layerTemplateScopes(receiver.__stx_page_scope, pageScope);
      // A routed page or keyed row can replace the caller inside a persistent shell.
      if (receiver.__stx_scope && !receiver.hasAttribute('data-stx-scope')) return receiver.__stx_scope;
      if (receiver.getAttribute && (receiver.getAttribute('data-stx-template-scope') || receiver.getAttribute('data-stx-scope')) === owner)
        return receiver.__stx_parent_scope || componentCallerScopeFrom(receiver.parentElement || receiver.parentNode, pageScope);
      receiver = receiver.parentElement || receiver.parentNode;
    }
    return null;
  }

  // The caller scope for a component placed under \`current\`: the page's
  // scope, then every component scope around it, outermost first. A native
  // loop row binds before it is inserted, so it asks from its future parent.
  function componentCallerScopeFrom(current, pageScope) {
    var ancestors = [];
    var projected = null;
    while (current && current !== document) {
      if (current.getAttribute && current.hasAttribute('data-stx-scope'))
        ancestors.push(current.getAttribute('data-stx-scope'));
      projected = projectedSlotCallerScope(current, pageScope);
      if (projected) break;
      current = current.parentElement || current.parentNode;
    }
    // Layered rather than copied: a copy of the page scope (hundreds of
    // names) per component instance was a fifth of mounting a list of rows.
    var sources = [projected || pageScope];
    ancestors.reverse().forEach(function(scopeId) {
      var ancestorScope = window.stx._scopes && window.stx._scopes[scopeId];
      if (ancestorScope) sources.push(ancestorScope);
    });
    return layerTemplateScopes.apply(null, sources);
  }
`
