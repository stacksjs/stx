/**
 * Diagnose an identifier a client script calls that will not exist in the browser.
 *
 * `packages/stx/src/composables/` exports 149 functions. Only 29 of them reach
 * the client runtime; the other 120 are module exports with no counterpart on
 * `window.stx`. They type-check, they autocomplete, and calling one from a
 * `<script client>` block throws `ReferenceError` — which used to take down the
 * whole page (fixed in the DOMContentLoaded handler, stacksjs/stx#1805).
 *
 * Containing the throw stops one bad name costing the document, but the author
 * still has to work out WHY a documented, exported, type-checking composable is
 * not defined. This turns that into a message at compile time naming the
 * identifier, the file, and the fix.
 *
 * Deliberately a warning, not a build failure. #1810 is a report of the dev
 * server aborting on one bad view with no filename; adding a second way to abort
 * the build would be solving one complaint by creating another.
 */

/**
 * Functions `composables/index.ts` exports that the client runtime does NOT
 * provide.
 *
 * Generated — `test/unresolved-identifiers.test.ts` recomputes it from the real
 * module surface and fails when this drifts, so it cannot silently rot the way
 * the auto-import list did (#1804).
 */
export const SERVER_ONLY_COMPOSABLES: readonly string[] = [
  'broadcast', 'calculateDistance', 'canNotify', 'clearCookies', 'clearFetchCache',
  'clearStorage', 'copyToClipboard', 'createShareableFile', 'getBatteryLevel', 'getCookie',
  'getCurrentPosition', 'getStorageKeys', 'getStorageSize', 'getVoices', 'hasBattery',
  'hasCameraPermission', 'hasGeolocationPermission', 'hasMicrophonePermission',
  'hasNotificationPermission', 'hasResizeObserver', 'hexToHsl', 'hexToRgb',
  'isBroadcastChannelSupported', 'isCharging', 'isDeviceMotionSupported',
  'isDeviceOrientationSupported', 'isEventSourceSupported', 'isEyeDropperSupported',
  'isInFullscreen', 'isMutationObserverSupported', 'isPermissionGranted',
  'isSpeechRecognitionSupported', 'isSpeechSynthesisSupported', 'isWakeLockSupported',
  'isWebSocketSupported', 'notify', 'parseCookies', 'pickColor', 'prefetch', 'removeCookie',
  'requestMediaPermissions', 'requestMotionPermission', 'requestNotificationPermission',
  'requestOrientationPermission', 'setCookie', 'share', 'shareCurrentPage', 'shareFiles',
  'shareText', 'shareURL', 'shareWithFallback', 'speak', 'stopSpeaking', 'toggleFullscreen',
  'useAsyncData', 'useAttributeObserver', 'useAutoLogout', 'useAutoWakeLock', 'useBattery',
  'useBreakpoint', 'useBroadcastChannel', 'useChannel', 'useChildListObserver', 'useClipboard',
  'useColorHistory', 'useConditionalWakeLock', 'useCookies', 'useCopySelection',
  'useDeviceMotion', 'useDeviceOrientation', 'useElementSize', 'useElementTextSelection',
  'useElementVisibility', 'useEventSource', 'useEyeDropper', 'useFavicon', 'useFullscreen',
  'useGeolocation', 'useGeolocationWatch', 'useHotkey', 'useIdle', 'useIdleState',
  'useInfiniteScroll', 'useIntersectionObserver', 'useIntersectionObserverMultiple',
  'useIsDesktop', 'useIsMobile', 'useIsTablet', 'useKeyPressed', 'useKeySequence',
  'useKeyboard', 'useLastActive', 'useLazyLoad', 'useMeta', 'useMouse', 'useMouseInElement',
  'useMutationObserver', 'useNetwork', 'useNotification', 'useOnline', 'useParallax',
  'usePermission', 'usePermissions', 'usePointer', 'usePost', 'useResizeObserver',
  'useResizeObserverMultiple', 'useSSE', 'useScroll', 'useSelectionPopup', 'useShare',
  'useSpeechRecognition', 'useSpeechSynthesis', 'useStorage', 'useTextObserver',
  'useTextSelection', 'useTitle', 'useVisibility', 'useWakeLock', 'useWindowSize'
]

const SERVER_ONLY = new Set(SERVER_ONLY_COMPOSABLES)

export interface UnresolvedIdentifier {
  /** The identifier as written. */
  name: string
  /** Human-readable explanation, including the fix. */
  message: string
}

/**
 * Find identifiers a script CALLS that resolve to nothing in the browser.
 *
 * Restricted to names we can name a cause for — exports of `composables/` with
 * no runtime counterpart. A broader "looks like a hook and is not in scope"
 * heuristic would fire on legitimate local helpers and app composables, and a
 * warning people learn to ignore is worse than no warning.
 *
 * @param source the script body, after imports have been transformed
 * @param provided names already in scope (runtime globals, locals, imports)
 */
export function findUnresolvedIdentifiers(
  source: string,
  provided: Iterable<string>,
): UnresolvedIdentifier[] {
  const inScope = provided instanceof Set ? provided : new Set(provided)
  const found = new Map<string, UnresolvedIdentifier>()

  // Only CALLED identifiers: a bare mention could be a property name, a string,
  // or a comment, none of which throw.
  for (const match of source.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = match[1]
    if (found.has(name) || inScope.has(name) || !SERVER_ONLY.has(name))
      continue
    // A local declaration or an explicit import shadows the framework name and
    // is the documented fix, so it must not warn.
    if (new RegExp(`(?:const|let|var|function|class)\\s+${name}\\b`).test(source))
      continue
    if (new RegExp(`import\\s[^;]*\\b${name}\\b[^;]*from`).test(source))
      continue

    found.set(name, {
      name,
      message:
        `"${name}" is exported by @stacksjs/stx/composables but is not available in the browser — `
        + 'it is a server-only module export, so this call throws ReferenceError at runtime. '
        + `Import it explicitly (import { ${name} } from '@stacksjs/stx/composables') so the `
        + 'bundler inlines it, or use a runtime equivalent from window.stx.',
    })
  }

  return [...found.values()]
}

/**
 * Report unresolved identifiers against a file, once each.
 *
 * Returns the diagnostics so callers can assert on them without capturing
 * console output.
 */
export function reportUnresolvedIdentifiers(
  source: string,
  provided: Iterable<string>,
  filePath: string,
): UnresolvedIdentifier[] {
  const unresolved = findUnresolvedIdentifiers(source, provided)
  for (const item of unresolved)
    console.warn(`[stx] ${filePath}: ${item.message}`)
  return unresolved
}
