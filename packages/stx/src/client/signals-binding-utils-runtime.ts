/** DOM binding helpers shared by generated client directives. */
export const SIGNALS_BINDING_UTILS_RUNTIME = `  // Minimal attribute-only pass for the host element of a deferred subtree.
  // The full walk happens on children via processElement.
  function processAttributesOnly(el, scope) {
    // Just call processElement but mark it as already visited to prevent
    // infinite recursion via the stx-hydrate check below.
    el.__stx_hydrated = true;
    processElement(el, scope);
  }

  function isForDirectiveExpression(expr) {
    return typeof expr === 'string'
      && /^\\s*\\(?\\s*\\w+(?:\\s*,\\s*\\w+)?\\s*\\)?\\s+(?:in|of)\\s+.+\\s*$/.test(expr);
  }

  function getElementAttributes(el) {
    if (!el || !el.attributes) return [];
    return Array.from(el.attributes).map(function(attr) {
      // Browser DOM exposes Attr records through NamedNodeMap. HappyDOM and
      // other standards-oriented DOM implementations may expose Map entries
      // for cloned nodes instead. Normalize both shapes so reactive nodes
      // created by :for hydrate exactly like their browser counterparts.
      if (Array.isArray(attr)) return { name: attr[0], value: attr[1] };
      return attr;
    });
  }

  function getModelBinding(el) {
    if (!el || !el.attributes) return null;
    var prefixes = ['x-model', ':model', '@model'];
    var attrs = getElementAttributes(el);
    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i] && attrs[i].name;
      if (!name) continue;
      for (var j = 0; j < prefixes.length; j++) {
        if (name === prefixes[j] || name.indexOf(prefixes[j] + '.') === 0)
          return { name: name, expression: attrs[i].value };
      }
    }
    return null;
  }

  function readDeferredParentComponentProps(el) {
    var serialized = el.getAttribute('data-stx-deferred-parent-bindings');
    if (!serialized) return {};
    try {
      var parsed = JSON.parse(serialized);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch (e) {
      return {};
    }
  }

  function preserveDeferredParentComponentProps(el) {
    var names = (el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/).filter(Boolean);
    if (!names.length) return;
    var deferred = readDeferredParentComponentProps(el);
    names.forEach(function(name) {
      var sourceName = ':' + name;
      if (el.hasAttribute(sourceName))
        deferred[name] = el.getAttribute(sourceName);
    });
    if (Object.keys(deferred).length)
      el.setAttribute('data-stx-deferred-parent-bindings', JSON.stringify(deferred));
  }

  function hasPendingLoopBoundary(el) {
    var loopBoundary = el;
    while (loopBoundary && loopBoundary !== document) {
      var loopExpression = loopBoundary.getAttribute && (
        loopBoundary.getAttribute('@for')
        || loopBoundary.getAttribute(':for')
        || loopBoundary.getAttribute('x-for')
      );
      if (loopExpression && isForDirectiveExpression(loopExpression))
        return true;
      loopBoundary = loopBoundary.parentElement || loopBoundary.parentNode;
    }
    return false;
  }

  function hasPendingAncestorLoopBoundary(el) {
    var loopBoundary = el && (el.parentElement || el.parentNode);
    while (loopBoundary && loopBoundary !== document) {
      var loopExpression = loopBoundary.getAttribute && (
        loopBoundary.getAttribute('@for')
        || loopBoundary.getAttribute(':for')
        || loopBoundary.getAttribute('x-for')
      );
      if (loopExpression && isForDirectiveExpression(loopExpression))
        return true;
      loopBoundary = loopBoundary.parentElement || loopBoundary.parentNode;
    }
    return false;
  }

  function syncComponentPropSignal(el, name, value) {
    if (!el || !el.getAttribute || value === undefined) return;
    var scopeId = el.getAttribute('data-stx-scope');
    var scopeVars = scopeId && window.stx._scopes && window.stx._scopes[scopeId];
    var camelName = name.replace(/-([a-z0-9])/g, function(_, character) {
      return character.toUpperCase();
    });
    // useReactiveProp signals are often intentionally aliased inside the
    // child, for example liveClosable = useReactiveProp('closable', true).
    // The public prop name therefore cannot be inferred from the variable
    // name exported by the component scope. Keep an element-owned registry as
    // the canonical bridge, with the scope lookup retained for older output.
    var propSignals = el.__stx_reactive_prop_signals;
    var propSignal = propSignals && (propSignals[name] || propSignals[camelName]);
    if (!propSignal && scopeVars)
      propSignal = scopeVars[name] || scopeVars[camelName];
    var directValues = el.__stx_direct_prop_values || (el.__stx_direct_prop_values = {});
    var directValue = {
      raw: el.hasAttribute(name) ? el.getAttribute(name) : null,
      value: value,
    };
    directValues[name] = directValue;
    directValues[camelName] = directValue;
    // The parent binding can run before child setup. Keep the typed value
    // even then: JSON attributes cannot retain validators or other callbacks.
    if (!propSignal || !propSignal._isSignal || typeof propSignal.set !== 'function') return;
    // This runs inside the parent binding effect. Reading the child prop
    // signal normally would subscribe that effect to its own output. Parent
    // expressions that return a fresh array or object would then recurse:
    // syncing the child retriggers the parent, which creates another value.
    // Compare without dependency tracking so the effect only follows the
    // caller-owned signals used by the binding expression.
    if (!Object.is(peek(function() { return propSignal(); }), value))
      propSignal.set(value);
  }
`
