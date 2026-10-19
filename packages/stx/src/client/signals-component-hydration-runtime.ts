/** Component-scope hydration helpers for the generated client runtime. */
export const SIGNALS_COMPONENT_HYDRATION_RUNTIME = `  /*
   * Run a component setup for one clone. The compiled setup finds its root by
   * the template's scope id, so the clone answers to that id while it runs,
   * and the scope it registers is moved to the clone's own id afterwards.
   */
  function runClonedComponentSetup(setup, root) {
    var scopeId = root.getAttribute('data-stx-scope');
    var originalScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
    if (!scopeId || !originalScopeId) return;

    root.setAttribute('data-stx-scope', originalScopeId);
    // The setup finds its root by id, which a detached clone cannot answer
    // to: rows a :for builds inside a component's closed :if are set up
    // before the :if puts them in the document, and found nothing, so they
    // never read a prop. Hand the root over (utils.ts reads it).
    var previousSetupRoot = window.__STX_SETUP_ROOT__;
    window.__STX_SETUP_ROOT__ = root;
    try {
      setup();
      var registeredScope = window.stx._scopes && (window.stx._scopes[originalScopeId] || window.stx._scopes[scopeId]);
      if (registeredScope && originalScopeId !== scopeId) {
        delete window.stx._scopes[originalScopeId];
        window.stx._scopes[scopeId] = registeredScope;
      }
    }
    catch (e) {
      console.error('[stx] cloned component setup error:', e);
    }
    finally {
      window.__STX_SETUP_ROOT__ = previousSetupRoot;
      root.setAttribute('data-stx-scope', scopeId);
    }
  }

  function hydrateComponentScopes(nodes, callerScope) {
    var roots = [];
    var scripts = [];
    forEachGroupElement(nodes, function(node, insideTemplateContent) {
      // A template's content is inert source material. Remapping must traverse
      // it, but setup and event hydration belong to the live clones inserted by
      // bindIf/bindFor, where the correct iteration scope is available.
      if (insideTemplateContent) return;
      if (node.hasAttribute && node.hasAttribute('data-stx-scope')) roots.push(node);
      if (node.tagName === 'SCRIPT' && node.hasAttribute('data-stx-scoped')) scripts.push(node);
    });
    if (!roots.length) return;

    function hasPendingStructuralAncestor(root) {
      var cursor = root && root.parentElement;
      while (cursor && cursor.nodeType === Node.ELEMENT_NODE) {
        if (cursor.hasAttribute('@for')
          || cursor.hasAttribute(':for')
          || cursor.hasAttribute('x-for')
          || cursor.hasAttribute('@if')
          || cursor.hasAttribute(':if')
          || cursor.hasAttribute('x-if')
          || cursor.hasAttribute('@else-if')
          || cursor.hasAttribute(':else-if')
          || cursor.hasAttribute('x-else-if')
          || cursor.hasAttribute('@else')
          || cursor.hasAttribute(':else')
          || cursor.hasAttribute('x-else'))
          return true;
        cursor = cursor.parentElement;
      }
      return false;
    }

    // Scripts cloned from template.content are inert in browsers. Compile each
    // distinct component setup body once, then run that cached function for
    // every loop instance. Temporarily restoring the template's original scope
    // id lets existing compiled setup code locate the correct root without
    // rewriting and reparsing the full script for every row.
    scripts.forEach(function(old) {
      var text = old.textContent || '';
      var pendingRoots = roots.filter(function(root) {
        var scopeId = root.getAttribute('data-stx-scope');
        var originalScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
        return scopeId
          && originalScopeId
          && text.indexOf(originalScopeId) !== -1
          && !hasPendingStructuralAncestor(root)
          && !(window.stx._scopes && window.stx._scopes[scopeId]);
      });
      if (!pendingRoots.length) return;

      var setup = __forComponentSetupFactories.get(text);
      if (!setup) {
        try {
          setup = new Function(text);
          __forComponentSetupFactories.set(text, setup);
        }
        catch (e) {
          console.error('[stx] cloned component setup compile error:', e);
          return;
        }
      }

      pendingRoots.forEach(function(root) { runClonedComponentSetup(setup, root); });

      // A component that is itself a structural source still needs its setup
      // sibling when bindFor/bindIf turns that source into a clone template.
      // Final row instances have no structural attribute and can discard it.
      var isStructuralSource = pendingRoots.some(function(root) {
        return root.hasAttribute('@for')
          || root.hasAttribute(':for')
          || root.hasAttribute('x-for')
          || root.hasAttribute('@if')
          || root.hasAttribute(':if')
          || root.hasAttribute('x-if');
      });
      if (!isStructuralSource && old.parentNode) old.parentNode.removeChild(old);
    });

    /*
     * A host with no script elements. A native screen's setup scripts are
     * compiled out of the tree, so a clone a :for or :if builds carries none
     * to copy, and every row after the template rendered with no scope at
     * all: no props, no state, no handlers. The native bundle registers each
     * component's setup by its compiled scope id instead, and a clone is set
     * up from that the same way a cloned script would set it up here.
     */
    var registeredSetups = window.__stx_componentSetups;
    if (registeredSetups) {
      roots.forEach(function(root) {
        // A :for clone carries a remapped id beside the template's; an :if
        // clone keeps the template's id, whose scope the source reclaimed.
        var scopeId = root.getAttribute('data-stx-scope');
        var originalScopeId = root.getAttribute('data-stx-template-scope') || scopeId;
        if (!scopeId || hasPendingStructuralAncestor(root) || (window.stx._scopes && window.stx._scopes[scopeId])) return;
        var setup = registeredSetups[originalScopeId];
        if (typeof setup === 'function') runClonedComponentSetup(setup, root);
      });
    }

    roots.forEach(function(root) {
      // Still inside a conditional or loop this walk has not bound: the
      // directive decides whether the component is on the page at all, and
      // hydrates it through this same function when it is. Mounting it from
      // here is what ran a hidden pane's onMount when an enclosing :if opened
      // (stacksjs/stx#2071): the walk reached the pane's root while the pane's
      // own :if was still an attribute, so its condition was never asked. The
      // setup half above already leaves these roots alone.
      if (hasPendingStructuralAncestor(root)) return;
      var scopeId = root.getAttribute('data-stx-scope');
      var scopeVars = scopeId && window.stx._scopes && window.stx._scopes[scopeId];
      var resolvedCallerScope = resolveComponentCallerScope(root, callerScope);
      root.__stx_parent_scope = resolvedCallerScope;
      bindParentComponentProps(root, resolvedCallerScope);
      if (!scopeVars) return;
      if (root.__stx_disposers) {
        // Bound already, by the page's scope walk: a component behind a false
        // :if in a PARTIAL is in the list that walk collects, and is detached
        // by the time it is reached, so it was bound and its mount deferred
        // (stacksjs/stx#2036). Showing the branch is that mount. Without this
        // the component rendered and its onMount never ran at all.
        if (scopeVars.__mountCallbacks && !scopeVars.__mounted && !scopeVars.__suspended && root.isConnected) {
          scopeVars.__el = root;
          scopeVars.__mounted = true;
          runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
        }
        return;
      }
      scopeVars.__el = root;
      var childScope = { ...resolvedCallerScope, ...scopeVars };
      root.__stx_disposers = trackEffects(function() {
        processElement(root, childScope);
      });
      if (scopeVars.__mountCallbacks && !scopeVars.__mounted) {
        scopeVars.__mounted = true;
        runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars));
      }
    });
  }
`
