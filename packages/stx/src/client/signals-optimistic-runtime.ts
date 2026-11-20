/** Optimistic state overlay used by the generated client runtime. */
export const SIGNALS_OPTIMISTIC_RUNTIME = `  // ==========================================================================
  // Optimistic State (useOptimistic) — stacksjs/stx#1742
  // ==========================================================================
  // Mirrors signals-api.ts useOptimistic. Shows base + pending actions while an
  // async action is in flight. A lone unmanaged edit can settle when the base
  // changes. Overlapping edits settle independently.
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
      var entries = peek(pending);
      if (entries.length === 1 && entries[0].autoSettle) pending.set([]);
    });
    function addOptimistic(action, settleWhen) {
      var entries = peek(pending);
      entries.forEach(function(edit) { edit.autoSettle = false; });
      var entry = { action: action, autoSettle: settleWhen === undefined && entries.length === 0 };
      pending.set(entries.concat([entry]));
      var settle = function(commit) {
        var current = peek(pending);
        if (!current.includes(entry)) return;
        batch(function() {
          pending.set(current.filter(function(edit) { return edit !== entry; }));
          if (commit) commit();
        });
      };
      if (settleWhen) {
        var complete = function() { settle(); };
        Promise.resolve(settleWhen).then(complete, complete);
      }
      return settle;
    }
    return [optimistic, addOptimistic];
  }
`
