/** Suspense boundary binding for the generated client runtime. */
export const SIGNALS_SUSPENSE_RUNTIME = `  // <Suspense> boundary (#1742). Aggregates the loading/error state of every
  // descendant suspense query (useQuery/useFetch with { suspense: true }) for
  // which this is the nearest [data-stx-suspense] ancestor, and toggles three
  // regions accordingly: [data-stx-suspense-fallback] while any query is loading,
  // [data-stx-suspense-error] when one errors, [data-stx-suspense-content]
  // once all resolve. With no suspense queries inside, content shows immediately.
  function bindSuspense(el, scope) {
    if (el.__stx_suspense_bound) return;
    el.__stx_suspense_bound = true;

    var fallbackEl = el.querySelector('[data-stx-suspense-fallback]');
    var errorEl = el.querySelector('[data-stx-suspense-error]');
    var contentEl = el.querySelector('[data-stx-suspense-content]') || el;

    // Claim the descendant queries this boundary owns. closest() returns the
    // DEEPEST [data-stx-suspense] ancestor, so nested boundaries don't steal
    // each other's queries.
    var claimed = suspenseRegistry().filter(function(entry) {
      return entry.el && el.contains(entry.el) && entry.el.closest('[data-stx-suspense]') === el;
    });

    var anyLoading = derived(function() {
      for (var i = 0; i < claimed.length; i++) {
        if (claimed[i].loading && claimed[i].loading()) return true;
      }
      return false;
    });
    var firstError = derived(function() {
      for (var i = 0; i < claimed.length; i++) {
        var err = claimed[i].error ? claimed[i].error() : null;
        if (err) return err;
      }
      return null;
    });

    function setHidden(node, hidden) {
      if (!node || node === el) return;
      if (hidden) node.setAttribute('hidden', '');
      else node.removeAttribute('hidden');
    }

    effect(function() {
      var err = firstError();
      var loading = anyLoading();
      if (err && errorEl) {
        setHidden(errorEl, false); setHidden(fallbackEl, true); setHidden(contentEl, true);
      } else if (loading) {
        setHidden(fallbackEl, false); setHidden(contentEl, true); setHidden(errorEl, true);
      } else {
        setHidden(contentEl, false); setHidden(fallbackEl, true); setHidden(errorEl, true);
      }
    });

    // Bind the content subtree (inline :if / {{ }} / @click etc.). Nested
    // component scopes are still processed independently by the scope loop.
    var contentRoot = (contentEl === el) ? el : contentEl;
    Array.from(contentRoot.childNodes).forEach(function(child) { processElement(child, scope); });
  }
`
