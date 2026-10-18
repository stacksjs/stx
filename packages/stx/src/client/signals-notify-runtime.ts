/** Change notification shared by state, derived and reactive objects in the client runtime. */
export const SIGNALS_NOTIFY_RUNTIME = `  // ==========================================================================
  // Notify
  // ==========================================================================

  // Gather the effects a change reaches, walking through derived values.
  function collectSubscribers(subscribers, into) {
    subscribers.forEach(function(sub) {
      if (sub._stxCollect) sub._stxCollect(into);
      else into.add(sub);
    });
  }

  // Two phases: mark every derived value on the way stale and gather the
  // effects reached, then run each once. Running them as found ran an effect
  // that reads a signal both directly and through a derived twice for one
  // change, the first time against the derived's old value.
  function notifySubscribers(subscribers) {
    if (isBatching) {
      collectSubscribers(subscribers, pendingEffects);
      return;
    }
    const reached = new Set();
    collectSubscribers(subscribers, reached);
    reached.forEach(function(e) { e(); });
  }
`
