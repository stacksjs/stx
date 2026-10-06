/**
 * The names the engine binds for a `<script server>` block, in a module that
 * imports nothing.
 *
 * Two readers need the list: the server-script executor in
 * `variable-extractor.ts`, which uses it as its parameter list, and the
 * checkers (`stx typecheck` and the editor plugin), which use it to decide what
 * `import { … } from 'stx'` really provides in a server block. The editor
 * plugin is bundled into the VS Code extension, so it must not reach this list
 * through `variable-extractor.ts` and drag the server runtime in with it.
 *
 * @module engine-bindings
 */

/**
 * The runtime bindings the engine hands a `<script server>` block as function
 * parameters, in the order the parameters are declared.
 *
 * This drives the `new Function` parameter list rather than sitting beside it,
 * because the two must not drift: the value list below it is positional, so a
 * name added in one place and not the other silently rebinds every argument
 * after it.
 *
 * It is also the set a `from 'stx'` import must not redeclare. A server script
 * writing the documented `import { defineProps } from 'stx'` was rewritten to
 * `const { defineProps } = await import('stx')`, and that `const` shadows the
 * parameter of the same name. The package's own `defineProps` reads
 * `globalThis.__STX_CURRENT_PROPS__`, which nothing on the server path ever
 * sets — so props came back `{}` and every component rendered empty.
 *
 * It went unnoticed because `stx` does not resolve inside this repo (the
 * published package is `@stacksjs/stx`; the root `stx` is private), so the
 * generated `await import('stx')` rejected and the shadowing binding was never
 * created. The failure needed a real install to appear.
 */
export const STX_ENGINE_BINDING_NAMES = [
  'module', 'exports', 'require', 'props', '$props', '$bool', '$num', 'defineProps', 'withDefaults',
  'defineClientPayload', 'useServerData', 'useRuntimeConfig', 'useServerRuntimeConfig',
  'state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy',
  'definePageMeta', 'useRoute', 'useRouter', 'useHead', 'useSeoMeta',
  // Deciding the response. Engine bindings rather than per-host context keys
  // because four hosts run server scripts and three of them had forgotten:
  // `setResponseStatus(404)` threw a ReferenceError *inside the script's own
  // IIFE*, taking every other binding in the file down with it, so the page
  // rendered its empty branch and read as a correct answer. A host that wants
  // the calls routed somewhere of its own still overrides them through the
  // context, which is appended after these. See page-response.ts.
  'setResponseStatus', 'setResponseHeader', 'notFound',
  'ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick',
  'defineEmits', 'defineExpose', 'defineSlots', 'provide', 'inject', 'useColorMode', 'useDark',
  'useMediaQuery', 'useScrollLock', 'usePreferredDark', 'usePreferredLight', 'usePreferredReducedMotion', 'usePreferredContrast',
  'window', 'document', 'console', 'confirm', 'alert', 'fetch',
  'params',
] as const
