/** Scope lookup and expression evaluation for the generated client runtime. */
export const SIGNALS_EXPRESSION_RUNTIME = `  // Setup accessors refer to lexical variables assigned after mounting. Scope
  // copies preserve those accessors so rows and event closures do not freeze
  // their setup-time values. Data properties retain ordinary spread semantics.
  function assignTemplateScope(target, ...sources) {
    if (target === componentScope) __stxScopeGen++;
    for (var source of sources) {
      if (!source) continue;
      for (var key of Object.keys(source)) {
        var descriptor = Object.getOwnPropertyDescriptor(source, key);
        descriptor.configurable = true;
        if ('value' in descriptor) descriptor.writable = true;
        Object.defineProperty(target, key, descriptor);
      }
    }
    return target;
  }
  // The page-wide compatibility scope is rewritten as each component mounts:
  // every name a component declares is assigned into it, so by the end it holds
  // the LAST instance's. A scope merged earlier kept the names of its own
  // moment (a copy froze them), and a handler or binding that runs later relies
  // on that: three instances of one component each press their own button. A
  // view reads its sources live, so it is handed a snapshot of this one, taken
  // once per rewrite rather than once per merge.
  let __stxScopeGen = 0;
  let __stxSnapshot = { source: null, generation: -1, copy: null };
  function snapshotOfPageScope() {
    if (__stxSnapshot.source !== componentScope || __stxSnapshot.generation !== __stxScopeGen) {
      __stxSnapshot = { source: componentScope, generation: __stxScopeGen, copy: assignTemplateScope({}, componentScope) };
    }
    return __stxSnapshot.copy;
  }
  // A merged scope is a LAYERED VIEW over its sources, never a copy of them.
  //
  // Every binding, listener and conditional of every row took its own copy of
  // the whole page scope - globals, every component's names, the row's - and a
  // page with a few hundred names paid about 75 microseconds for each: 2,300
  // copies to draw 60 rows of a to-do list, 90% of the time it took. The view
  // costs one small object and a proxy, so the price of a merge no longer grows
  // with the size of the page. Later sources shadow earlier ones, as they did;
  // a write, a defineProperty or a delete lands on the view's own layer and
  // never reaches a source. Sources stay live, so a name registered after the
  // view was made is visible through it (a copy froze the names of its moment).
  const __STX_LAYERS = Symbol('stx.layers');
  const __STX_HIDDEN = Symbol('stx.hidden');
  const __stxIsEnumerable = Object.prototype.propertyIsEnumerable;
  // The layer that holds name, or null: the view's own properties first, then
  // the sources from last to first. A deleted name is found nowhere.
  function __stxLayerOf(own, name) {
    const hidden = own[__STX_HIDDEN];
    if (hidden !== undefined && hidden.has(name)) return null;
    if (__stxIsEnumerable.call(own, name)) return own;
    const layers = own[__STX_LAYERS];
    for (let i = layers.length - 1; i >= 0; i--) {
      if (__stxIsEnumerable.call(layers[i], name)) return layers[i];
    }
    return null;
  }
  const __stxScopeHandler = {
    get(own, name) {
      if (typeof name === 'symbol') return own[name];
      const layer = __stxLayerOf(own, name);
      return layer === null ? own[name] : layer[name];
    },
    has(own, name) {
      if (typeof name === 'symbol') return name in own;
      return __stxLayerOf(own, name) !== null || name in own;
    },
    set(own, name, value) {
      if (typeof name !== 'symbol' && own[__STX_HIDDEN] !== undefined) own[__STX_HIDDEN].delete(name);
      own[name] = value;
      return true;
    },
    defineProperty(own, name, descriptor) {
      if (typeof name !== 'symbol' && own[__STX_HIDDEN] !== undefined) own[__STX_HIDDEN].delete(name);
      return Reflect.defineProperty(own, name, descriptor);
    },
    deleteProperty(own, name) {
      delete own[name];
      if (typeof name !== 'symbol' && __stxLayerOf(own, name) !== null) {
        if (own[__STX_HIDDEN] === undefined) Object.defineProperty(own, __STX_HIDDEN, { value: new Set(), configurable: true });
        own[__STX_HIDDEN].add(name);
      }
      return true;
    },
    ownKeys(own) {
      const keys = new Set();
      const layers = own[__STX_LAYERS];
      for (let i = 0; i < layers.length; i++) {
        const names = Object.keys(layers[i]);
        for (let k = 0; k < names.length; k++) keys.add(names[k]);
      }
      const mine = Object.keys(own);
      for (let k = 0; k < mine.length; k++) keys.add(mine[k]);
      const hidden = own[__STX_HIDDEN];
      if (hidden !== undefined) hidden.forEach(function(name) { keys.delete(name); });
      return Array.from(keys);
    },
    getOwnPropertyDescriptor(own, name) {
      if (typeof name === 'symbol') return Reflect.getOwnPropertyDescriptor(own, name);
      const layer = __stxLayerOf(own, name);
      if (layer === null) return undefined;
      const descriptor = Object.getOwnPropertyDescriptor(layer, name);
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      return descriptor;
    },
  };
  function mergeTemplateScopes(...sources) {
    return assignTemplateScope({}, ...sources);
  }
  // The view, for the hot paths that only READ the result (see above).
  function layerTemplateScopes(...sources) {
    const layers = [];
    for (let i = 0; i < sources.length; i++) {
      let source = sources[i];
      if (!source) continue;
      if (source === componentScope) source = snapshotOfPageScope();
      const inner = source[__STX_LAYERS];
      // A view made of views stays one level deep: take its layers and its own
      // properties as layers of the new one. A view with deleted names cannot
      // be taken apart (the layers beneath still hold them), so it is a layer.
      if (inner !== undefined && source[__STX_HIDDEN] === undefined) {
        const ownLayer = __stxOwnOf.get(source);
        for (let k = 0; k < inner.length; k++) layers.push(inner[k]);
        layers.push(ownLayer);
      }
      else layers.push(source);
    }
    const own = {};
    Object.defineProperty(own, __STX_LAYERS, { value: layers, configurable: true });
    const view = new Proxy(own, __stxScopeHandler);
    __stxOwnOf.set(view, own);
    return view;
  }
  // The own layer of a view, to read through it when a view is a source.
  const __stxOwnOf = new WeakMap();

  let componentScope = { $refs: {} };

  // Current element being processed (for scope lookup)
  let currentElement = null;

  function findElementScope(el) {
    let current = el;
    while (current && current !== document) {
      // Explicit element-local mounts own their scope, ahead of a registry.
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
      var baseScope = mergeTemplateScopes(globalHelpers, componentScope, (elementScope || {}), extraScope);

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
      reportUnknownBinding(e, expr, baseScope || {}, el || currentElement);
      if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) console.warn('[STX] Expression error:', expr, e);
      return '';
    }
  }
`
