/** DevTools introspection used by the generated client runtime. */
export const SIGNALS_DEVTOOLS_RUNTIME = `  // ==========================================================================
  // DevTools introspection (stacksjs/stx#1747, Phase 1)
  // ==========================================================================
  // A read-only, console-usable inspector wired to the live runtime — no manual
  // registration. Reads signal values via peek() so inspecting never subscribes
  // the active effect (i.e. it can't pollute the reactive graph).
  function __stxDevtoolsClassify(sv) {
    var out = { signals: {}, derived: {}, stores: {}, values: {}, methods: [] };
    if (!sv || typeof sv !== 'object') return out;
    Object.keys(sv).forEach(function(k) {
      if (k.indexOf('__') === 0 || k === '$el' || k === '$refs' || k === '$props') return;
      var v = sv[k];
      try {
        if (typeof v === 'function' && v._isSignal) out.signals[k] = peek(function() { return v(); });
        else if (typeof v === 'function' && v._isDerived) out.derived[k] = peek(function() { return v(); });
        else if (v && v._isStxStore) out.stores[k] = '[store]';
        else if (typeof v === 'function') out.methods.push(k);
        else out.values[k] = v;
      }
      catch (e) { out.values[k] = '[unreadable]'; }
    });
    return out;
  }
  window.__stxDevtools = {
    version: 4,
    // ── Phase 2: reactivity instrumentation (dev-mode, opt-in) ──
    // Turn counting on/off. OFF by default so the runtime stays zero-overhead
    // until a devtools session asks for it.
    enable: function() { __stxDevtoolsTracking = true; },
    disable: function() { __stxDevtoolsTracking = false; },
    tracking: function() { return __stxDevtoolsTracking; },
    // Global tallies since the last reset: total signal changes + effect re-runs.
    stats: function() {
      return { signalSets: __stxDevtoolsStats.signalSets, effectRuns: __stxDevtoolsStats.effectRuns, tracking: __stxDevtoolsTracking };
    },
    resetStats: function() { __stxDevtoolsStats.signalSets = 0; __stxDevtoolsStats.effectRuns = 0; __stxDevtoolsIfTrace.length = 0; __stxDevtoolsQueries.length = 0; __stxDevtoolsMutations.length = 0; },
    // Phase 3: structured :if decision trace — which branch each reactive
    // @if/v-if/:if chain picked, newest last. Recorded only while tracking.
    ifTrace: function() { return __stxDevtoolsIfTrace.slice(); },
    // Phase 3: data-layer query timeline — { source, url, method, status, ok, ms }
    // for each useFetch/useQuery/useMutation request, newest last.
    queries: function() { return __stxDevtoolsQueries.slice(); },
    // Phase 4: state-change log — each recorded signal mutation { name, scope,
    // prev, next }, newest last. Resolves each signal id to its name + owning
    // scope/store at query time, so the buffer itself holds no live references.
    mutations: function() {
      var nameById = {};
      function index(container, label) {
        if (!container || typeof container !== 'object') return;
        Object.keys(container).forEach(function(k) {
          if (k.indexOf('__') === 0) return;
          var v = container[k];
          if (typeof v === 'function' && v._stxSignalId) nameById[v._stxSignalId] = { name: k, scope: label };
        });
      }
      var scopes = (window.stx && window.stx._scopes) || {};
      Object.keys(scopes).forEach(function(id) { index(scopes[id], id); });
      if (window.stx && window.stx._stores && typeof window.stx._stores.forEach === 'function')
        window.stx._stores.forEach(function(s, id) { index(s, 'store:' + id); });
      return __stxDevtoolsMutations.map(function(m) {
        var info = nameById[m.sid];
        return { name: info ? info.name : '(anonymous)', scope: info ? info.scope : null, prev: m.prev, next: m.next };
      });
    },
    // Reactive graph: per scope, each signal/derived with its current value, how
    // many times it was set (when tracking), and how many effects subscribe to
    // it (the dependency edges — "which effects read this signal", as a count).
    graph: function() {
      var out = [];
      var scopes = (window.stx && window.stx._scopes) || {};
      Object.keys(scopes).forEach(function(scopeId) {
        var sv = scopes[scopeId];
        if (!sv || typeof sv !== 'object') return;
        var nodes = [];
        Object.keys(sv).forEach(function(k) {
          if (k.indexOf('__') === 0 || k === '$el' || k === '$refs' || k === '$props') return;
          var v = sv[k];
          if (typeof v === 'function' && (v._isSignal || v._isDerived)) {
            nodes.push({
              name: k,
              type: v._isDerived ? 'derived' : 'signal',
              value: peek(function() { return v(); }),
              setCount: v._setCount || 0,
              subscribers: (v._effects && typeof v._effects.size === 'number') ? v._effects.size : 0
            });
          }
        });
        if (nodes.length) out.push({ scopeId: scopeId, nodes: nodes });
      });
      return out;
    },
    // Component tree from [data-stx-scope] elements, nested by DOM ancestry.
    tree: function() {
      var byEl = new Map();
      var roots = [];
      var nodes = document.querySelectorAll('[data-stx-scope]');
      Array.prototype.forEach.call(nodes, function(el) {
        byEl.set(el, { scopeId: el.getAttribute('data-stx-scope'), tag: (el.tagName || '').toLowerCase(), children: [], el: el });
      });
      Array.prototype.forEach.call(nodes, function(el) {
        var node = byEl.get(el);
        var p = el.parentElement;
        while (p && !byEl.has(p)) p = p.parentElement;
        if (p) byEl.get(p).children.push(node); else roots.push(node);
      });
      function clean(n) { return { scopeId: n.scopeId, tag: n.tag, children: n.children.map(clean) }; }
      return roots.map(clean);
    },
    // Signals / derived / stores / methods / plain values for a scope id.
    scope: function(scopeId) {
      var sv = (window.stx && window.stx._scopes) ? window.stx._scopes[scopeId] : null;
      return sv ? __stxDevtoolsClassify(sv) : null;
    },
    // The nearest enclosing scope's inspection for a DOM element.
    inspect: function(el) {
      var s = el;
      while (s && !(s.getAttribute && s.getAttribute('data-stx-scope'))) s = s.parentElement;
      return s ? this.scope(s.getAttribute('data-stx-scope')) : null;
    },
    // All registered stores by id.
    stores: function() {
      var out = {};
      var reg = window.stx && window.stx._stores;
      if (reg && typeof reg.forEach === 'function') reg.forEach(function(v, k) { out[k] = true; });
      return out;
    },
    // One store's state — its state signals / getters (derived) / plain values /
    // actions (methods). A store is just an object of those, so the same
    // classifier as scope() works (values read via peek — no graph pollution).
    store: function(id) {
      var reg = window.stx && window.stx._stores;
      var s = reg && typeof reg.get === 'function' ? reg.get(id) : null;
      return s ? __stxDevtoolsClassify(s) : null;
    },
  };
`
