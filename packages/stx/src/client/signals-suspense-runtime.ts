/** Suspense boundary binding for the generated client runtime. */
export const SIGNALS_SUSPENSE_RUNTIME = `  // <Suspense> boundary (#1742). Aggregates the loading/error state of every
  // descendant suspense query (useQuery/useFetch with { suspense: true }) and
  // useAsyncData reads in its template content, then toggles three
  // regions accordingly: [data-stx-suspense-fallback] while any query is loading,
  // [data-stx-suspense-error] when one errors, [data-stx-suspense-content]
  // once all resolve. With no suspense queries inside, content shows immediately.
  function trackAsyncDataRead(signal, loading, error) {
    suspenseSourcesCreated = true;
    var entry = { loading: loading, error: error };
    function record() {
      if (activeSuspenseReads) activeSuspenseReads.add(entry);
    }
    return new Proxy(signal, {
      apply: function(target, receiver, args) {
        record();
        return Reflect.apply(target, receiver, args);
      },
      get: function(target, key, receiver) {
        if (key === 'value') record();
        return Reflect.get(target, key, receiver);
      }
    });
  }

  function nearestSuspenseBoundary(node) {
    var el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el || !el.closest) return null;
    var boundary = el.closest('[data-stx-suspense]');
    if (!boundary) return null;
    var content = el.closest('[data-stx-suspense-content]');
    return content && content.parentElement === boundary ? boundary : null;
  }

  function suspenseReadState(boundary) {
    return boundary.__stx_async_reads || (boundary.__stx_async_reads = {
      readers: new Map(), changed: state(0), observer: null
    });
  }

  function updateSuspenseReads(boundary, reader, node, reads) {
    var observed = suspenseReadState(boundary);
    var before = observed.readers.get(reader);
    if (!reads || !reads.size) {
      if (!observed.readers.delete(reader)) return;
      if (!observed.readers.size && observed.observer) {
        observed.observer.disconnect();
        observed.observer = null;
      }
    } else {
      var attached = nearestSuspenseBoundary(node) === boundary;
      if (before && before.attached === attached && sameSuspenseReads(before.reads, reads)) return;
      observed.readers.set(reader, { node: node, reads: reads, attached: attached });
      // Single-element conditionals retain their effects across detach/attach.
      // Keep the last reads, but exclude their requests while the branch is away.
      if (!observed.observer && typeof MutationObserver === 'function') {
        observed.observer = new MutationObserver(function() {
          var changed = false;
          observed.readers.forEach(function(entry) {
            var attached = nearestSuspenseBoundary(entry.node) === boundary;
            if (attached !== entry.attached) {
              entry.attached = attached;
              changed = true;
            }
          });
          if (changed) observed.changed.trigger();
        });
        observed.observer.observe(boundary, { childList: true, subtree: true });
      }
    }
    observed.changed.trigger();
  }

  // Setup can register before its DOM is attached. Mount or a new boundary
  // gets another chance to claim those entries.
  var pendingSuspenseEntries = new Set();

  function registerSuspense(loading, error) {
    var node = window.__STX_CURRENT_ELEMENT__;
    if (!node) return;
    var entry = { loading: loading, error: error };
    var reads = new Set([entry]);
    var boundary = null;
    function attach() {
      var next = nearestSuspenseBoundary(node);
      if (boundary && boundary !== next) updateSuspenseReads(boundary, entry, node, null);
      boundary = next;
      if (!boundary) {
        pendingSuspenseEntries.add(attach);
        return;
      }
      pendingSuspenseEntries.delete(attach);
      updateSuspenseReads(boundary, entry, node, reads);
    }
    attach();
    onMount(attach);
    onDestroy(function() {
      pendingSuspenseEntries.delete(attach);
      if (boundary) updateSuspenseReads(boundary, entry, node, null);
      boundary = null;
    });
  }

  function bindSuspense(el, scope, bindContent = true) {
    if (el.__stx_suspense_bound) return;
    el.__stx_suspense_bound = true;

    var regions = Array.from(el.children);
    var fallbackEl = regions.find(function(child) { return child.hasAttribute('data-stx-suspense-fallback'); });
    var errorEl = regions.find(function(child) { return child.hasAttribute('data-stx-suspense-error'); });
    var contentEl = regions.find(function(child) { return child.hasAttribute('data-stx-suspense-content'); }) || el;

    Array.from(pendingSuspenseEntries).forEach(function(attach) { attach(); });

    var asyncReads = suspenseReadState(el);
    var sources = derived(function() {
      asyncReads.changed();
      var entries = new Set();
      asyncReads.readers.forEach(function(reader) {
        if (reader.attached) reader.reads.forEach(function(entry) { entries.add(entry); });
      });
      return Array.from(entries);
    });
    var anyLoading = derived(function() {
      return sources().some(function(entry) { return entry.loading && entry.loading(); });
    });
    var firstError = derived(function() {
      for (var entry of sources()) {
        var error = entry.error && entry.error();
        if (error) return error;
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
    if (bindContent) {
      Array.from(contentEl.childNodes).forEach(function(child) { processElement(child, scope); });
    }
  }

  // Boundaries in a static layout may never be reached by a scope walk.
  function bindUnclaimedSuspense(root, scope) {
    root.querySelectorAll('[data-stx-suspense]').forEach(function(el) {
      if (el.__stx_suspense_bound) return;
      for (var node = el; node; node = node.parentElement) {
        if (node.hasAttribute('stx-hydrate') && !node.__stx_hydrated) return;
      }
      var previous = el.__stx_disposers;
      var dispose = trackEffects(function() { bindSuspense(el, scope, false); });
      el.__stx_disposers = function() {
        if (previous) previous();
        dispose();
      };
    });
  }
`
