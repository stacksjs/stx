/** Browser storage composables used by the generated client runtime. */
export const SIGNALS_STORAGE_RUNTIME = `  // Storage access is guarded end to end (stacksjs/stx#1793). Every one of
  // these can throw, and each throw took down the whole client script for the
  // page rather than just the composable:
  //
  //   getItem  - SecurityError in a sandboxed iframe or with storage disabled
  //   parse    - any non-JSON value already sitting at the key
  //   setItem  - QuotaExceededError, Safari private mode
  //
  // The parse fallback is deliberately LENIENT: a value that isn't JSON is
  // returned as the raw string rather than discarded for defaultValue. A key
  // that previously held a bare 'list' keeps reading back 'list' and is
  // rewritten as JSON on the next set, so migrating an existing key onto this
  // composable no longer needs the key to be renamed. This also matches
  // composables/use-storage.ts, whose default serializer already returns the
  // raw string on parse failure — the two implementations have to agree.
  function stxParseStored(raw, fallback, key, label) {
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); }
    catch (e) {
      console.warn('[stx] ' + label + ': "' + key + '" holds a value that is not JSON (' + String(raw).slice(0, 64) + '); using it as a raw string. Write it with the same composable to store it as JSON.');
      return raw;
    }
  }
  function stxStorageRead(store, key, fallback, label) {
    var raw;
    try { raw = store.getItem(key); }
    catch (e) {
      console.warn('[stx] ' + label + ': cannot read "' + key + '" (' + (e && e.message ? e.message : e) + '); using the default.');
      return fallback;
    }
    return stxParseStored(raw, fallback, key, label);
  }
  function stxStorageWrite(store, key, value, label) {
    try { store.setItem(key, JSON.stringify(value)); }
    catch (e) {
      console.warn('[stx] ' + label + ': cannot persist "' + key + '" (' + (e && e.message ? e.message : e) + '); the value stays in memory only.');
    }
  }

  function useLocalStorage(key, defaultValue) {
    var s = state(stxStorageRead(localStorage, key, defaultValue, 'useLocalStorage'));
    effect(function() {
      stxStorageWrite(localStorage, key, s(), 'useLocalStorage');
    });
    var handler = function(e) {
      // Fires from ANOTHER tab at an arbitrary later time, so an unguarded
      // parse here throws inside a window listener with a stack pointing at
      // the runtime rather than at the consumer.
      // storageArea is also matched so a sessionStorage write to the same key
      // name can't clobber this signal — useSessionStorage already filtered,
      // this side didn't. Synthetic events (tests) leave storageArea null and
      // are still accepted; real browsers always populate it.
      if (e.key === key && (!e.storageArea || e.storageArea === localStorage))
        s.set(stxParseStored(e.newValue, defaultValue, key, 'useLocalStorage'));
    };
    window.addEventListener('storage', handler);
    onDestroy(function() { window.removeEventListener('storage', handler); });
    return s;
  }

  // Mirror of useLocalStorage against sessionStorage. Strict-mode lint
  // already suggests this function name as the replacement for raw
  // window.sessionStorage access; this is the implementation that backs
  // that hint. Same JSON serialization, cross-tab sync via the 'storage'
  // event (filtered to sessionStorage's storageArea — localStorage events
  // share the same listener but fire from a different area).
  function useSessionStorage(key, defaultValue) {
    var s = state(stxStorageRead(sessionStorage, key, defaultValue, 'useSessionStorage'));
    effect(function() {
      stxStorageWrite(sessionStorage, key, s(), 'useSessionStorage');
    });
    var handler = function(e) {
      if (e.key === key && (!e.storageArea || e.storageArea === sessionStorage))
        s.set(stxParseStored(e.newValue, defaultValue, key, 'useSessionStorage'));
    };
    window.addEventListener('storage', handler);
    onDestroy(function() { window.removeEventListener('storage', handler); });
    return s;
  }`
