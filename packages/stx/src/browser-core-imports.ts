/**
 * The names stx auto-imports into a client script from `@stacksjs/browser`.
 *
 * Its own module, importing nothing, because two things read it: the injector
 * in `client-script.ts` and the declaration emitter in `stx-virtual-ts.ts`.
 * Keeping it in `client-script.ts` made the second import reach across a
 * module that pulls in most of the package - and in the chunked build the
 * declarations silently stopped being emitted, so the checker went back to
 * reporting `debounce` and `useTimeoutFn` as typos. A leaf has no order to get
 * wrong.
 */
export const BROWSER_CORE_IMPORTS: readonly string[] = [
  // Browser Query Builder - only symbols truly unique to @stacksjs/browser
  'browserQuery', 'BrowserQueryBuilder', 'BrowserQueryError',
  'browserAuth', 'configureBrowser', 'getBrowserConfig',
  'createBrowserDb', 'createBrowserModel', 'isBrowser',
  // Browser utilities promised by the Stacks browser auto-import manifest
  'debounce', 'throttle', 'retry', 'sleep', 'wait', 'delay', 'waitUntil', 'waitWhile',
  'lazy', 'clamp', 'rand', 'readableSize',
  // Stacks composables that are not part of the STX-native runtime
  'useActiveElement', 'useDocumentVisibility', 'useIntervalFn', 'useTimeoutFn',
]
