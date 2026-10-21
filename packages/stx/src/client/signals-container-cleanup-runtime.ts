/** SPA container cleanup used by the generated client runtime. */
export const SIGNALS_CONTAINER_CLEANUP_RUNTIME = `  // ==========================================================================
  // Container Cleanup (for SPA navigation)
  // ==========================================================================

  function cleanupContainer(container) {
    if (!container) return;

    // Clear pending mount callbacks from the departing page
    mountCallbacks.length = 0;

    // Reset componentScope — clear old page variables to prevent scope leaking
    // between SPA navigations. Preserve $refs and re-apply shell-level scope
    // from persistent elements (sidebar, nav) that live outside the container.
    var preservedRefs = componentScope.$refs || {};
    componentScope = { $refs: preservedRefs };
    // Re-apply scope from shell elements (outside the swap container)
    var shellElements = document.querySelectorAll('[data-stx-content] ~ *');
    document.querySelectorAll('body > *').forEach(function(el) {
      if (el === container) return;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.__stx_scope) assignTemplateScope(componentScope, el.__stx_scope);
    });

    // 1-2. Every descendant, then the container: cancel pending island
    // hydration (#1746), fire destroy hooks, dispose effects. Shared with
    // :for row removal and template :if hide so all three release the same
    // trackers, including the row and branch ones added for #1954.
    disposeSubtreeEffects(container);
    // Clear __stx_scope so _handleStxLoad's processElement guard doesn't skip it
    container.__stx_scope = null;

    // 3. Clean up scopes registered on departing components. Routed
    // through disposeSubtreeScopes so the same walk runs for SPA
    // navigation and for :if/:for-driven unmount (see #1727).
    disposeSubtreeScopes(container);

    // 4. Reclaim entries the container walk can't see — components rendered
    // outside the swap container, or already detached before step 3 ran its
    // querySelectorAll. Without this the registry grew every navigation (#1775).
    sweepOrphanedScopes();
  }
`
