import { SIGNALS_NOTIFY_RUNTIME } from './signals-notify-runtime'

export function signalsReactiveCoreBootstrapRuntime(
  cloakRuntime: string,
  expressionCompilerRuntime: string,
  fetchTransportRuntime: string,
): string {
  return `${cloakRuntime}  // ==========================================================================
  // Reactive Core
  // ==========================================================================

${expressionCompilerRuntime}
  let activeEffect = null;
  const effectStack = [];
  const pendingEffects = new Set();
  let isBatching = false;
${SIGNALS_NOTIFY_RUNTIME}

  // DevTools Phase 2 (#1747): dev-mode reactivity instrumentation. OFF by
  // default — even in the dev runtime — so set()/effect-run stay zero-overhead
  // until window.__stxDevtools.enable() turns counting on. The reactive graph
  // (each signal's subscriber set) is always available via the _effects handle.
  var __stxDevtoolsTracking = false;
  var __stxDevtoolsStats = { signalSets: 0, effectRuns: 0 };
  var __stxEffectId = 0;
  // Phase 3 (#1747): bounded trace buffers, recorded only while tracking.
  var __stxDevtoolsIfTrace = [];
  var __stxDevtoolsQueries = [];
  var __stxDevtoolsMutations = []; // state-change log (signal id + prev/next)
  var __stxSignalId = 0;
  function __stxDevtoolsNow() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function __stxDevtoolsRecordIf(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsIfTrace.push(rec); if (__stxDevtoolsIfTrace.length > 100) __stxDevtoolsIfTrace.shift(); }
  function __stxDevtoolsRecordQuery(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsQueries.push(rec); if (__stxDevtoolsQueries.length > 100) __stxDevtoolsQueries.shift(); }
${fetchTransportRuntime}
  let activeDisposers = null; // Array | null — when non-null, effects auto-register their dispose fn
  const targetMap = new WeakMap();`
}

