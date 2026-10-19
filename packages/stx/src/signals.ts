/**
 * STX Signals - Reactive State Management
 * =========================================
 *
 * This module re-exports the build-time signals API from signals-api.ts
 * and provides the client runtime string generators.
 *
 * @module signals
 */

import { state, derived, effect, batch, onMount, onDestroy, isSignal, isDerived, untrack, peek } from './signals-api'
import { runtimeDirectiveNamesLiteral, runtimeEventRegexLiteral, runtimeHandledXAttrsLiteral } from './runtime-globals'
import { createModelSignal } from './component-model'
import { readHydratedData, clearServerData } from './composables/use-fetch'
import { createKeptStore, indexedDbBackend } from './offline/kept-store'
import { createQueryCache, queryTargetMatches } from './offline/query-cache'
import { sharedRequest } from './shared-request'
import { SIGNALS_APPEARANCE_RUNTIME } from './client/signals-appearance-runtime'
import { signalsAuthoringRuntime } from './client/signals-authoring-runtime'
import { SIGNALS_BINDING_UTILS_RUNTIME } from './client/signals-binding-utils-runtime'
import { SIGNALS_CLOAK_RUNTIME, SIGNALS_PREAMBLE_RUNTIME } from './client/signals-bootstrap-runtime'
import { SIGNALS_CLASS_RUNTIME } from './client/signals-class-runtime'
import { SIGNALS_CONTEXT_RUNTIME } from './client/signals-context-runtime'
import { SIGNALS_COMPONENT_PROPS_RUNTIME } from './client/signals-component-props-runtime'
import { SIGNALS_COMPONENT_HYDRATION_RUNTIME } from './client/signals-component-hydration-runtime'
import { SIGNALS_COMPONENT_API_RUNTIME } from './client/signals-component-api-runtime'
import { SIGNALS_CONDITIONAL_CHAIN_RUNTIME } from './client/signals-conditional-chain-runtime'
import { SIGNALS_CONDITIONAL_COMPONENT_RUNTIME } from './client/signals-conditional-component-runtime'
import { SIGNALS_CONTAINER_CLEANUP_RUNTIME } from './client/signals-container-cleanup-runtime'
import { SIGNALS_COOKIE_RUNTIME } from './client/signals-cookie-runtime'
import { SIGNALS_DIALOG_RUNTIME } from './client/signals-dialog-runtime'
import { SIGNALS_DEVTOOLS_RUNTIME } from './client/signals-devtools-runtime'
import { SIGNALS_DOM_READY_RUNTIME } from './client/signals-dom-ready-runtime'
import { SIGNALS_DRAWER_RUNTIME } from './client/signals-drawer-runtime'
import { SIGNALS_EFFECT_RUNTIME } from './client/signals-effect-runtime'
import { SIGNALS_EVENT_SHORTHAND_RUNTIME } from './client/signals-event-shorthand-runtime'
import { SIGNALS_EXPRESSION_COMPILER_RUNTIME } from './client/signals-expression-compiler-runtime'
import { SIGNALS_EXPRESSION_RUNTIME } from './client/signals-expression-runtime'
import { SIGNALS_FETCH_TRANSPORT_RUNTIME } from './client/signals-fetch-transport-runtime'
import { signalsFetchRuntime } from './client/signals-fetch-runtime'
import { SIGNALS_FOR_RUNTIME } from './client/signals-for-runtime'
import { SIGNALS_GLOBALS_RUNTIME } from './client/signals-globals-runtime'
import { SIGNALS_HANDLER_RUNTIME } from './client/signals-handler-runtime'
import { SIGNALS_HEAD_RUNTIME } from './client/signals-head-runtime'
import { SIGNALS_HELPERS_RUNTIME } from './client/signals-helpers-runtime'
import { SIGNALS_HOST_RUNTIME } from './client/signals-host-runtime'
import { SIGNALS_HYDRATION_RUNTIME } from './client/signals-hydration-runtime'
import { SIGNALS_HYDRATION_AUDIT_RUNTIME } from './client/signals-hydration-audit-runtime'
import { SIGNALS_IF_CHAIN_RUNTIME } from './client/signals-if-chain-runtime'
import { SIGNALS_IF_RUNTIME } from './client/signals-if-runtime'
import { signalsKeptRuntime } from './client/signals-kept-runtime'
import { SIGNALS_LAZY_HYDRATION_RUNTIME } from './client/signals-lazy-hydration-runtime'
import { SIGNALS_LIFECYCLE_RUNTIME } from './client/signals-lifecycle-runtime'
import { SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME } from './client/signals-loop-component-remap-runtime'
import { SIGNALS_LOOP_CONDITIONAL_RUNTIME } from './client/signals-loop-conditional-runtime'
import { SIGNALS_LOOP_ROW_RUNTIME } from './client/signals-loop-row-runtime'
import { SIGNALS_MANIFEST_HYDRATION_RUNTIME } from './client/signals-manifest-hydration-runtime'
import { SIGNALS_MODEL_RUNTIME } from './client/signals-model-runtime'
import { SIGNALS_MOUNT_RUNTIME } from './client/signals-mount-runtime'
import { SIGNALS_NAVIGATION_RUNTIME } from './client/signals-navigation-runtime'
import { SIGNALS_OPTIMISTIC_RUNTIME } from './client/signals-optimistic-runtime'
import { SIGNALS_OVERLAY_RUNTIME } from './client/signals-overlay-runtime'
import { SIGNALS_QUERY_RUNTIME } from './client/signals-query-runtime'
import { signalsReactiveCoreBootstrapRuntime } from './client/signals-reactive-core-bootstrap-runtime'
import { SIGNALS_REACTIVE_RUNTIME } from './client/signals-reactive-runtime'
import { SIGNALS_PIPE_RUNTIME } from './client/signals-pipe-runtime'
import { signalsProcessElementRuntime } from './client/signals-process-element-runtime'
import { SIGNALS_PROXY_RUNTIME } from './client/signals-proxy-runtime'
import { signalsPublicApiRuntime } from './client/signals-public-api-runtime'
import { SIGNALS_REF_RUNTIME } from './client/signals-ref-runtime'
import { SIGNALS_SCOPE_DISPOSAL_RUNTIME } from './client/signals-scope-disposal-runtime'
import { SIGNALS_SCOPE_TRAVERSAL_RUNTIME } from './client/signals-scope-traversal-runtime'
import { SIGNALS_SHOW_RUNTIME } from './client/signals-show-runtime'
import { SIGNALS_SPA_LOAD_CONTROL_RUNTIME } from './client/signals-spa-load-control-runtime'
import { SIGNALS_SPA_LOAD_RUNTIME } from './client/signals-spa-load-runtime'
import { SIGNALS_STATE_RUNTIME } from './client/signals-state-runtime'
import { SIGNALS_STORE_REGISTRY_RUNTIME } from './client/signals-store-registry-runtime'
import { SIGNALS_STORAGE_RUNTIME } from './client/signals-storage-runtime'
import { SIGNALS_STYLE_RUNTIME } from './client/signals-style-runtime'
import { SIGNALS_SUSPENSE_RUNTIME } from './client/signals-suspense-runtime'
import { SIGNALS_TIMER_RUNTIME } from './client/signals-timer-runtime'
import { SIGNALS_TOOLTIP_RUNTIME } from './client/signals-tooltip-runtime'
import { SIGNALS_TOAST_RUNTIME } from './client/signals-toast-runtime'
import { SIGNALS_TRANSITION_GROUP_RUNTIME } from './client/signals-transition-group-runtime'
import { SIGNALS_WEBSOCKET_RUNTIME } from './client/signals-websocket-runtime'

export * from './signals-api'

// =============================================================================
// Client Runtime Generator
// =============================================================================

/**
 * Generates the browser runtime for STX signals.
 *
 * This runtime is automatically injected into pages that use signals.
 * It provides the full reactivity system and template binding.
 *
 * @returns Minified JavaScript runtime code
 */
export function generateSignalsRuntime(): string {
  // Strip `console.log(...)` calls before minification. They're useful in dev
  // (and the dev build keeps them via generateSignalsRuntimeDev), but in prod
  // they're noise — every nav fires ~15 log lines and they show up in
  // consumer DevTools. `console.warn` / `console.error` are preserved so
  // real problems still surface. See stacksjs/stx#1668 bug 8.
  //
  // Stripping happens OUTSIDE the try on purpose. It used to sit inside, with a
  // catch that returned generateSignalsRuntimeDev() — the raw, *unstripped*
  // source. So any failure in Bun.Transpiler silently shipped all ~40 log sites
  // to production, and the only symptom was a console full of `[stx] signal.set:`
  // in a consumer's DevTools with nothing to explain it. Minification is the
  // optional part; removing the logs is not. See #1873.
  const stripped = stripConsoleLog(generateSignalsRuntimeDev())

  // Use Bun.Transpiler for minification, then fix ASI edge cases. Bun.Transpiler
  // strips newlines but doesn't always insert semicolons at statement boundaries
  // like `}var` or `}let`. While Bun's parser handles these, browsers in strict
  // mode may reject them.
  try {
    const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true })
    let minified = transpiler.transformSync(stripped)
    // Insert semicolons at `}keyword` boundaries where ASI would have applied
    // with a newline but doesn't on a single line
    minified = minified.replace(/\}(var |let |const |function )/g, '};$1')
    return minified
  }
  catch {
    // Fallback: unminified but still stripped — larger, correct, and quiet.
    return stripped
  }
}

/**
 * Strips every `console.log(...)` call site from the source, replacing each
 * with `0` (a valid no-op expression statement). Preserves `console.warn` and
 * `console.error` — those signal real problems and should still reach the
 * consumer's DevTools. String contents are respected so a literal `(` or `)`
 * inside a logged message doesn't confuse the paren matcher.
 */
function stripConsoleLog(src: string): string {
  const out: string[] = []
  let i = 0
  const needle = 'console.log('
  while (i < src.length) {
    const hit = src.indexOf(needle, i)
    if (hit === -1) {
      out.push(src.slice(i))
      break
    }
    out.push(src.slice(i, hit))
    // Walk past the call, respecting nested parens and string literals.
    let depth = 1
    let j = hit + needle.length
    while (j < src.length && depth > 0) {
      const c = src[j]
      if (c === '"' || c === '\'' || c === '`') {
        const quote = c
        j++
        while (j < src.length && src[j] !== quote) {
          if (src[j] === '\\')
            j++ // skip escaped char
          j++
        }
        j++ // skip closing quote
        continue
      }
      if (c === '(') depth++
      else if (c === ')') depth--
      j++
    }
    out.push('0')
    i = j
  }
  return out.join('')
}

/**
 * Generates readable (non-minified) runtime for development.
 *
 * @returns Human-readable JavaScript runtime code
 */
export function generateSignalsRuntimeDev(): string {
  return `${SIGNALS_PREAMBLE_RUNTIME}${SIGNALS_HOST_RUNTIME}
${signalsReactiveCoreBootstrapRuntime(SIGNALS_CLOAK_RUNTIME, SIGNALS_EXPRESSION_COMPILER_RUNTIME, SIGNALS_FETCH_TRANSPORT_RUNTIME)}

${SIGNALS_HELPERS_RUNTIME}
${SIGNALS_PROXY_RUNTIME}
${SIGNALS_PIPE_RUNTIME}
${SIGNALS_STATE_RUNTIME}
${SIGNALS_EFFECT_RUNTIME}
${SIGNALS_LIFECYCLE_RUNTIME}
${SIGNALS_WEBSOCKET_RUNTIME}
${signalsFetchRuntime(readHydratedData.toString(), clearServerData.toString())}
${SIGNALS_REF_RUNTIME}
${SIGNALS_NAVIGATION_RUNTIME}
${SIGNALS_QUERY_RUNTIME}
${SIGNALS_OPTIMISTIC_RUNTIME}
  // ==========================================================================
  // Template Binding
  // ==========================================================================

${SIGNALS_EXPRESSION_RUNTIME}
${SIGNALS_EVENT_SHORTHAND_RUNTIME}
${SIGNALS_HANDLER_RUNTIME}
${SIGNALS_LAZY_HYDRATION_RUNTIME}
${SIGNALS_BINDING_UTILS_RUNTIME}
${SIGNALS_COMPONENT_PROPS_RUNTIME}
${SIGNALS_CONDITIONAL_COMPONENT_RUNTIME}
${SIGNALS_MANIFEST_HYDRATION_RUNTIME}
${signalsProcessElementRuntime(runtimeDirectiveNamesLiteral(), runtimeEventRegexLiteral(), runtimeHandledXAttrsLiteral())}

${SIGNALS_SUSPENSE_RUNTIME}
${SIGNALS_SHOW_RUNTIME}
${SIGNALS_MODEL_RUNTIME}
${SIGNALS_CLASS_RUNTIME}
${SIGNALS_STYLE_RUNTIME}
${SIGNALS_TRANSITION_GROUP_RUNTIME}
${SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME}
${SIGNALS_COMPONENT_HYDRATION_RUNTIME}
${SIGNALS_LOOP_ROW_RUNTIME}
${SIGNALS_FOR_RUNTIME}
${SIGNALS_LOOP_CONDITIONAL_RUNTIME}
${SIGNALS_CONDITIONAL_CHAIN_RUNTIME}
${SIGNALS_IF_CHAIN_RUNTIME}
${SIGNALS_IF_RUNTIME}
${SIGNALS_CONTEXT_RUNTIME}
${SIGNALS_TIMER_RUNTIME}
${SIGNALS_APPEARANCE_RUNTIME}
${SIGNALS_REACTIVE_RUNTIME}

${SIGNALS_STORAGE_RUNTIME}

${signalsKeptRuntime(createKeptStore.toString(), indexedDbBackend.toString(), createQueryCache.toString(), queryTargetMatches.toString(), sharedRequest.toString())}
${SIGNALS_COOKIE_RUNTIME}
${signalsAuthoringRuntime(createModelSignal.toString())}
${SIGNALS_HEAD_RUNTIME}
${SIGNALS_TOAST_RUNTIME}

${SIGNALS_OVERLAY_RUNTIME}
${SIGNALS_DIALOG_RUNTIME}
${SIGNALS_DRAWER_RUNTIME}
${SIGNALS_TOOLTIP_RUNTIME}
${SIGNALS_HYDRATION_RUNTIME}
${signalsPublicApiRuntime(SIGNALS_COMPONENT_API_RUNTIME)}

${SIGNALS_STORE_REGISTRY_RUNTIME}

${SIGNALS_MOUNT_RUNTIME}
  });

${SIGNALS_GLOBALS_RUNTIME}
${SIGNALS_DEVTOOLS_RUNTIME}
${SIGNALS_DOM_READY_RUNTIME}
${SIGNALS_SCOPE_DISPOSAL_RUNTIME}
${SIGNALS_HYDRATION_AUDIT_RUNTIME}
${SIGNALS_CONTAINER_CLEANUP_RUNTIME}
${SIGNALS_SPA_LOAD_CONTROL_RUNTIME}
${SIGNALS_SPA_LOAD_RUNTIME}
${SIGNALS_SCOPE_TRAVERSAL_RUNTIME}
})();
`
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  state,
  derived,
  effect,
  batch,
  onMount,
  onDestroy,
  isSignal,
  isDerived,
  untrack,
  peek,
  generateSignalsRuntime,
  generateSignalsRuntimeDev
}
