/** Kept-state and cached-query helpers used by the generated client runtime. */
export function signalsKeptRuntime(
  createKeptStoreSource: string,
  indexedDbBackendSource: string,
  createQueryCacheSource: string,
  queryTargetMatchesSource: string,
  sharedRequestSource: string,
): string {
  return `  // One request for every caller that wants the same answer: run joins one
  // in flight, fresh waits one out and asks again, latest replaces a request
  // counter. See shared-request.ts; cached queries are built on it.
  var sharedRequest = (${sharedRequestSource});

  // A value kept between visits, for a phone app between launches: the tab a
  // user opens right after starting the app draws last time's data at once
  // and the fresh answer replaces it. Kept under stx:kept:, in a scope such as
  // the signed-in account, so one person's data is never shown to another. A
  // scope of false, null or '' keeps nothing (a plain state), for a page or a
  // visitor that should not leave data behind; no scope at all uses the one
  // given to setKeptScope. forgetKeptState(scope) removes a scope's values, or
  // every kept value.
  //
  // Stored by the kept store (offline/kept-store.ts): small values in
  // localStorage, readable on the first draw, large ones in IndexedDB, written
  // off the critical path and read back asynchronously. Values kept before it
  // are read where they are.
  var STX_KEPT_PREFIX = 'stx:kept:';
  var __stxKept = (${createKeptStoreSource})(undefined, ${indexedDbBackendSource});
  var __stxQueries = (${createQueryCacheSource})({ state: state, kept: __stxKept, prefix: STX_KEPT_PREFIX, matches: ${queryTargetMatchesSource}, sharedRequest: sharedRequest });
  function stxKeptPrefix(scope) {
    return STX_KEPT_PREFIX + (scope === undefined || scope === null || scope === '' ? '' : String(scope) + ':');
  }
  function keptState(name, initialValue, options) {
    var scope = options ? options.scope : undefined;
    if (scope === undefined) scope = __stxQueries.scope();
    if (scope === false || scope === null || scope === '') return state(initialValue);
    var key = stxKeptPrefix(scope) + name;
    var hit = __stxKept.peek(key);
    var s = state(hit ? hit.value : initialValue);
    var restored = {};
    var touched = false;
    s.subscribe(function(value) {
      if (value === restored) return;
      touched = true;
      __stxKept.set(key, value);
    });
    // Large values are kept where only an asynchronous read reaches: they
    // arrive a moment later, unless the screen set its own first.
    if (!hit) {
      __stxKept.load(key).then(function(found) {
        if (!found || touched) return;
        restored = found.value;
        s.set(found.value);
      });
    }
    return s;
  }
  function forgetKeptState(scope) {
    return __stxKept.forget(stxKeptPrefix(scope));
  }
  // The account kept state and cached queries belong to when they name none.
  function setKeptScope(scope) {
    __stxQueries.setScope(scope);
  }
  // Finish writing what is kept (before signing out, or in a test).
  function flushKeptState() {
    return __stxKept.flush();
  }
  // A query kept per account and refreshed behind: see offline/query-cache.ts.
  function cachedQuery(key, options) {
    return __stxQueries.cachedQuery(key, options);
  }
`
}
