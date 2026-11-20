/** Vue-compatible reactive helpers used by the generated client runtime. */
import { canWrapReactive, createReactiveProxy, isLockedReactiveProperty } from '../reactive-target'

export const SIGNALS_REACTIVE_RUNTIME = `  // Vue-compat aliases
  var ref = state;
  var reactive = (${createReactiveProxy.toString()})(
    ${canWrapReactive.toString()},
    ${isLockedReactiveProperty.toString()},
    function() { return !!activeEffect; },
    function() {
      var subscribers = new Set();
      return {
        track: function() { dependencyTracker.track(activeEffect, subscribers); },
        notify: function() { notifySubscribers(subscribers); }
      };
    },
    batch
  );
  var computed = derived;
  var watchEffect = function(fn) { return effect(fn); };`
