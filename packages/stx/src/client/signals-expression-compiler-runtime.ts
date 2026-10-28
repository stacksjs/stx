/** Cached expression compilation helpers for the generated client runtime. */
export const SIGNALS_EXPRESSION_COMPILER_RUNTIME = `  // Compiled expression functions, by parameter list and body. A binding was
  // compiled with new Function on every evaluation: a page with a few hundred
  // names in scope rebuilt a function of a few hundred parameters for every
  // binding of every row, every time a row re-rendered. Opening a 386-message
  // conversation took seven seconds in WebKit, the window frozen meanwhile.
  // A Function built this way closes over nothing, so one can be reused.
  const __stxCompiled = new Map();
  function reportUnknownBinding(error, expression, scope, node) {
    // Native setup names are final by hydration. Undefined values and async
    // object paths are not missing identifiers; the host distinguishes them.
    if (!stxHost.reportBindingError) return;
    try { stxHost.reportBindingError(error, expression, scope, node); }
    catch (diagnosticError) { /* Diagnostics must never break a binding. */ }
  }
  function __stxCompile(params, body) {
    const key = params.join(',') + '\\x01' + body;
    let fn = __stxCompiled.get(key);
    if (!fn) {
      fn = new Function(...params, body);
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
    for (let i = 0; i < names.length; i++) {
      if (Object.prototype.propertyIsEnumerable.call(scope, names[i])) keys.push(names[i]);
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
