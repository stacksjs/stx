/** Manifest-driven browser and native hydration for the generated client runtime. */
export const SIGNALS_MANIFEST_HYDRATION_RUNTIME = `  /**
   * Bind what the server said carries a binding, instead of looking for it.
   *
   * The walk exists because the runtime does not know where the bindings are.
   * The server does -- it rendered them -- so when it ships that list the
   * runtime stops searching: resolve each id, bind that element, never touch
   * its children. An element with no bindings is never visited at all.
   *
   * This is the piece a native host needs. A view hierarchy has no attributes
   * to read and no selector to match, so discovery cannot happen there; handed
   * the list, it does not have to. On the DOM the ids resolve by attribute,
   * which is one query per entry rather than a full traversal.
   *
   * Absent a manifest nothing changes: the walk is still the default, and a
   * page that ships no list hydrates exactly as it did.
   */
  function processFromManifest(root, scope, manifest, resolvedNodes) {
    // Arrays have an entries() method too. Prefer the array itself before
    // accepting the compiled document shape { entries: [...] }.
    var entries = Array.isArray(manifest)
      ? manifest
      : (manifest && Array.isArray(manifest.entries) ? manifest.entries : null);
    if (!entries || !entries.length || (!root && !resolvedNodes)) return false;
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var id = entry && entry.id;
      if (id === undefined || id === null) continue;
      // Native compilation already has stable handles for every manifest id.
      // Accept those handles directly so a non-DOM host never needs selectors
      // or an attribute walk. The browser keeps its existing lookup fallback.
      var node = resolvedNodes
        ? (typeof resolvedNodes.get === 'function' ? resolvedNodes.get(id) : resolvedNodes[id])
        : null;
      if (!node && root) {
        node = root.getAttribute && root.getAttribute('data-stx-b') === String(id)
          ? root
          : (root.querySelector ? root.querySelector('[data-stx-b="' + id + '"]') : null);
      }
      if (!node) continue;
      // A structural binding can detach its source before a later manifest
      // entry reaches one of that source's children. Native handles expose
      // this state directly; do not register effects or handlers for a view
      // that no longer exists in the host tree. Browser hydration keeps its
      // existing behaviour because it does not pass resolvedNodes here.
      if (resolvedNodes && node.__stxId !== undefined && node.isConnected === false) continue;
      if (resolvedNodes && node.hasAttribute && node.hasAttribute('data-stx-scope')
        && !hasPendingLoopBoundary(node)) {
        node.__stx_parent_scope = resolveComponentCallerScope(node, scope);
        bindParentComponentProps(node, node.__stx_parent_scope);
      }
      processElement(node, scope, true);
    }
    return true;
  }

  // Bind a precompiled host tree without waiting for DOMContentLoaded. Native
  // passes its manifest id to node-handle table; browser hydration continues
  // through the document-ready path below. The same state, effect, expression,
  // event and host implementations are used by both.
  function hydrateHost(root, setup, manifest, resolvedNodes) {
    var mountStart = mountCallbacks.length;
    var destroyStart = destroyCallbacks.length;
    var outerSink = activeDestroySink;
    activeDestroySink = null;
    var values;
    try { values = typeof setup === 'function' ? setup() : setup; }
    finally { activeDestroySink = outerSink; }
    var localMountHooks = mountCallbacks.splice(mountStart);
    var localDestroyHooks = destroyCallbacks.splice(destroyStart);
    var scope = Object.assign({ $refs: {} }, values || {});
    var disposeEffects = trackEffects(function() {
      processFromManifest(root, scope, manifest, resolvedNodes);
    });
    runMountCallbacks(localMountHooks, localDestroyHooks);
    var mounted = true;
    return function disposeHost() {
      if (!mounted) return;
      mounted = false;
      disposeEffects();
      var hooks = localDestroyHooks.splice(0, localDestroyHooks.length);
      for (var i = 0; i < hooks.length; i++) {
        try { hooks[i](); }
        catch (e) { console.warn('[stx] native destroy error:', e); }
      }
    };
  }
`
