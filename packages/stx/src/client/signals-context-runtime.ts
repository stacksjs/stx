/** Computed helpers and component value sharing for the client runtime. */
export const SIGNALS_CONTEXT_RUNTIME = `  // ==========================================================================
  // Public API
  // ==========================================================================

  // ==========================================================================
  // $: Computed Shorthand Support (Feature #7)
  // ==========================================================================

  // Helper function for $: reactive declarations (transformed by compiler)
  // Usage: $computed(() => count * 2) is shorthand for derived()
  function $computed(fn) {
    return derived(fn);
  }

  // Helper for watching a value with auto-unwrap
  function $watch(deps, fn) {
    effect(() => {
      // Access all dependencies to track them
      const values = Array.isArray(deps) ? deps.map(d => {
        if (typeof d === 'function' && (d._isSignal || d._isDerived)) return d();
        return d;
      }) : (typeof deps === 'function' && (deps._isSignal || deps._isDerived)) ? [deps()] : [deps];

      fn(...values);
    });
  }

  // provide() — share values across components (like Vue's provide/inject)
  // Usage: provide('Modal', Modal) — makes Modal accessible in all components
  //
  // inject() was auto-imported but implemented nowhere, so half of the pair
  // worked: provide() succeeded and the failure surfaced only in the consumer
  // (#1804). Values are recorded in a private registry as well as on window,
  // because the global write collides with native properties — provide('name',
  // x) lands on window.name, which the browser coerces to a string.
  var __stxProvided = Object.create(null);

  function provide(name, value) {
    __stxProvided[name] = value;
    window[name] = value;
  }

  function inject(name, defaultValue) {
    if (name in __stxProvided) return __stxProvided[name];
    if (name in window) return window[name];
    return defaultValue;
  }
`
