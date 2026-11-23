/** Cached expression compilation helpers for the generated client runtime. */
export const SIGNALS_EXPRESSION_COMPILER_RUNTIME = `  // Compiled expression functions, by parameter list and body. A binding was
  // compiled with new Function on every evaluation: a page with a few hundred
  // names in scope rebuilt a function of a few hundred parameters for every
  // binding of every row, every time a row re-rendered. Opening a 386-message
  // conversation took seven seconds in WebKit, the window frozen meanwhile.
  // A Function built this way closes over nothing, so one can be reused.
  const __stxCompiled = new Map();
  function __stxRunCompiled(entry, scope, args, receiver) {
    if (!entry) throw new Error('[stx:csp] Missing precompiled expression; compile the template before hydration');
    var frame = new Proxy(scope, {
      get: function(target, name) { return name in target ? target[name] : entry.globals[name].get(); },
      set: function(target, name, value) {
        if (name in target) target[name] = value;
        else entry.globals[name].set(value);
        return true;
      }
    });
    return entry.run.call(receiver, frame, args, function(name) {
      return name in scope ? typeof scope[name] : entry.globals[name].type();
    });
  }
  function __stxCompiledHandler(expression, scope, event, names, assignment) {
    var values = Object.create(null);
    names.forEach(function(name) {
      var value = scope[name];
      values[name] = value && typeof value === 'function' && (value._isSignal || value._isDerived)
        && (assignment || value._isStxLoopItem || (!expressionCallsSignal(expression, name) && !expressionUsesSignalApi(expression, name))) ? value() : value;
    });
    values.$event = event;
    var result = __stxRunCompiled(window.__STX_CSP__.expressions[expression], values, [scope, event], window);
    if (assignment) names.forEach(function(name) {
      var signal = scope[name];
      if (signal && signal._isSignal && values[name] !== signal()) signal.set(values[name]);
    });
    return result;
  }
  if (window.__STX_CSP__) window.__STX_CSP__.run = function(key, scope, args, receiver) {
    return __stxRunCompiled(window.__STX_CSP__.expressions[key], scope, args || [], receiver);
  };
  function reportUnknownBinding(error, expression, scope, node) {
    // Native setup names are final by hydration. Undefined values and async
    // object paths are not missing identifiers; the host distinguishes them.
    try {
      if (stxHost.reportBindingError) stxHost.reportBindingError(error, expression, scope, node);
    }
    catch (diagnosticError) { /* Diagnostics must never break a binding. */ }
  }
  function __stxCompile(params, body) {
    const csp = window.__STX_CSP__;
    const key = (csp ? 'csp:' : '') + params.join(',') + '\\x01' + body;
    let fn = __stxCompiled.get(key);
    if (!fn) {
      if (csp) {
        const entry = csp.expressions[body];
        if (!entry) throw new Error('[stx:csp] Uncompiled binding: ' + body);
        fn = function() {
          'use strict';
          var values = Object.create(null);
          for (var i = 0; i < params.length; i++) values[params[i]] = arguments[i];
          return __stxRunCompiled(entry, values, arguments, this);
        };
      }
      else fn = new Function(...params, body);
      // Bounded: expressions are finite per page, but SPA navigation adds more.
      if (__stxCompiled.size >= 5000) __stxCompiled.clear();
      __stxCompiled.set(key, fn);
    }
    return fn;
  }

  // The names an expression mentions, by its text.
  const __stxIdentifiers = new Map();
  function __stxNamesIn(body) {
    let names = __stxIdentifiers.get(body);
    if (!names) {
      names = Array.from(new Set(body.match(/[A-Za-z_$][\\w$]*/g) || []));
      if (__stxIdentifiers.size >= 5000) __stxIdentifiers.clear();
      __stxIdentifiers.set(body, names);
    }
    return names;
  }

  // Compile an expression over just the names in scope it mentions.
  //
  // It was compiled over every name in scope and called with every value,
  // read through the auto-unwrap proxy. Reading a signal subscribes the
  // running effect, so every binding depended on every signal on the page:
  // changing one unrelated value re-ran every binding of every row. The proxy
  // also tested each signal against the expression with fresh regexes. Now an
  // expression sees, reads and subscribes to what it names; a mention inside
  // a string only widens that, never narrows it.
  function __stxCompileScoped(scope, extraParams, body) {
    const keys = [];
    const names = __stxNamesIn(body);
    // A layered view answers from its layers directly: through the proxy,
    // each name cost a trap and a fresh property descriptor.
    const own = __stxOwnOf.get(__stxUnwrapTargetOf.get(scope) || scope);
    for (let i = 0; i < names.length; i++) {
      if (own !== undefined ? __stxLayerOf(own, names[i]) !== null : Object.prototype.propertyIsEnumerable.call(scope, names[i])) keys.push(names[i]);
    }
    const fn = __stxCompile(extraParams.length ? keys.concat(extraParams) : keys, body);
    // The cache keys on the parameter list, so a function always has these keys.
    fn.__stxKeys = keys;
    return fn;
  }

  function __stxArgs(fn, scope) {
    const keys = fn.__stxKeys;
    const args = new Array(keys.length);
    for (let i = 0; i < keys.length; i++) args[i] = scope[keys[i]];
    return args;
  }
`
