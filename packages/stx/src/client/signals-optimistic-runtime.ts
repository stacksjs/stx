/** Optimistic state overlay used by the generated client runtime. */
export const SIGNALS_OPTIMISTIC_RUNTIME = `  // ==========================================================================
  // Optimistic State (useOptimistic) — stacksjs/stx#1742
  // ==========================================================================
  // Mirrors signals-api.ts useOptimistic. Shows base + pending actions while an
  // async action is in flight; the overlay is discarded the moment base changes
  // (server confirmed). Returns [optimistic, addOptimistic]. addOptimistic
  // returns a settle() to roll back; pass a promise as the 2nd arg to auto-settle.
  function useOptimistic(base, reducer) {
    var readBase = (typeof base === 'function') ? base : function() { return base; };
    var pending = state([]);
    var optimistic = derived(function() {
      return pending().reduce(function(acc, entry) { return reducer(acc, entry.action); }, readBase());
    });
    var primed = false;
    effect(function() {
      readBase(); // track base only
      if (!primed) { primed = true; return; }
      if (peek(function() { return pending().length; })) pending.set([]);
    });
    function addOptimistic(action, settleWhen) {
      var entry = { action: action };
      pending.set(pending().concat([entry]));
      var settle = function() {
        var next = pending().filter(function(e) { return e !== entry; });
        if (next.length !== pending().length) pending.set(next);
      };
      if (settleWhen && typeof settleWhen.then === 'function') {
        Promise.resolve(settleWhen).then(settle, settle);
      }
      return settle;
    }
    return [optimistic, addOptimistic];
  }
`
