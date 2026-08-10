// ============================================================
// STX Core Exports
// Note: Some modules have overlapping exports. If you need specific
// items, import directly from the module (e.g., import { x } from 'stx/reactivity')
// ============================================================

// Explicit re-exports to resolve wildcard ambiguities
export { type BuildResult } from './build-optimizer'
// Exported for servers as well as the static build: SSR inlines the runtime
// once per *request*, which is the same waste in a worse form.
export { EXTERNALIZED_ASSET_DIR, externalizeHtml, externalizeSharedAssets, type ExternalizedAsset, type ExternalizeHtmlResult, type ExternalizeResult } from './build-externalize'
export { type ComponentInstance } from './reactivity'
export { type HydrationOptions } from './hydration'
// `CookieOptions` is the user-facing type for the `useCookie()` composable —
// the most common consumer path. The route-middleware module (re-exported from
// stx-router) and the SSR module each have their own internal `CookieOptions`
// shapes with different field sets; those are kept private to their modules
// to avoid silently shadowing the user-facing one. Surfaced by stacksjs/stx#1707.
export { type CookieOptions } from './composables/use-cookie'
// Storage composables were reachable ONLY via the './composables' subpath, so
// `import { useLocalStorage } from '@stacksjs/stx'` failed with TS2614 while
// `state`/`derived` imported fine — and a `functions/` composable (which the
// docs recommend for anything with persistence) had to reach for the subpath,
// where the same identifier used to return a different shape. See #1797.
export {
  clearStorage,
  getStorageKeys,
  getStorageSize,
  type StorageRef,
  type StorageType,
  useLocalStorage,
  useSessionStorage,
  useStorage,
  type UseStorageOptions,
} from './composables/use-storage'
// View composers were unreachable: `runComposers` is wired into the render
// pipeline (process.ts:1206) and runs on every render, but the two functions that
// PUT anything in the registry were never exported, so the registry was always
// empty and the whole layer was dead weight. The module's own docblock tells you
// to `import { composer } from 'stx'`, which threw. The existing test suite
// imported from './view-composers' directly, so nothing exercised the public
// surface and the gap stayed invisible. See #1860.
export {
  clearComposers,
  composer,
  composerPattern,
  runComposers,
  type ViewComposerCallback,
} from './view-composers'
// useForm and the `v` validator builder shipped unreachable: the module's
// docblock says `import { useForm, v } from 'stx'` (forms-validation.ts:9),
// and that import threw. process.ts reached the module lazily for directive
// processing only, so the form primitive itself had no way in. See #1856.
//
// `defineForm` is the deprecated pre-#1843 spelling, exported alongside so an
// app does not have to rename in the same release it upgrades in.
export {
  defineForm,
  useForm,
  v,
  Validator,
  type ValidatorFn,
  type AsyncValidatorFn,
  type ValidatorRule,
  type FieldState,
  type FormState,
} from './forms-validation'
export { formatSize, getTotalSize } from './deploy'
export { type ImageRenderResult, type ImageVariant, type ProcessedImage, clearImageCache, getFallbackVariant, getMimeType, groupVariantsByFormat, optimizeImage, processImage } from './image-optimization'
export { type AnalysisResult } from './analyzer'
export { type AnalyzeOptions, type ChunkInfo } from './production-build'
// generateReport moved to stx/visual-testing
export { fileExists } from './utils'
// `CompressionOptions` is declared twice — the response compressor's options
// (`./compression`, what a server tunes) and the production build's
// (`./production-build`). A wildcard collision exports NEITHER, so the
// user-facing one is named explicitly here; the build's is reachable from the
// `stx/production-build` subpath.
export { type CompressionOptions } from './compression'
export { type StreamingConfig } from './types'
export { type Middleware } from './ssr'

// Re-export the Icon-collection preloader so dev servers (e.g.
// bun-plugin-stx/serve) can warm the @iconify/json cache at boot. Without
// it the IconBuiltin returns a "collection not loaded" placeholder on
// the first render of every page after server start.
export { preloadIconCollection } from './builtins'

// Core functionality - these are the primary modules
export * from './reactivity'
export * from './head'
export * from './page-response'
export * from './route-middleware'
export * from './runtime'
export * from './forms'

// Core modules
export * from './env'
export { getPublicEnv, getPublicEnvDefine } from './public-env'
export * from './a11y'
export * from './analytics'
export * from './analyzer'
export * from './animation'
export * from './appearance-bootstrap'
export * from './assets'
export * from './app-shell'
export * from './async-components'
export * from './auth'
export * from './build'
export * from './build-assets'
export * from './build-id'
export * from './build-mode-detector'
export * from './build-optimizer'
export * from './broadcasting'
export * from './caching'
export * from './components'
export * from './component-library'
export * from './color-mode-boot'
export * from './config'
// craft-bridge, craft-compiler, craft-components, craft-ssr, native-build
// moved to stx/craft
export * from './csp'
export * from './custom-directives'
// database moved to stx/database
export * from './defer'
export * from './deploy'
export * from './compression'
export * from './dev-server'
export * from './document-shell'
export * from './fragment-container'
// DevTools entry points. Exported selectively rather than with a wildcard:
// devtools.ts also exports registerStore, which would collide with
// state-management's function of the same name. Their own docblock says
// `import { enableDevTools } from 'stx'`, and that import threw — so devtools
// could not be turned on from the package entry at all. See #1873.
export { disableDevTools, enableDevTools } from './devtools'
// composables.ts:161 documents `import { onUpdate } from 'stx'`; it was
// reachable only through the stx/composables subpath.
export { onUpdate } from './composables'
export * from './directive-api'
export * from './docs'
export * from './edge-runtime'
export * from './screenshot'
export * from './error-handling'
export * from './events'
export * from './expressions'
export * from './formatter'
export * from './heatmap'
export * from './hot-reload'
export * from './i18n'
export * from './includes'
export * from './init'
export * from './interactive'
export * from './keep-alive'
export * from './loops'
export * from './markdown'
export * from './middleware'
export * from './page-action'
export * from './parser'
export * from './manifest'
export * from './placeholder'
export * from './process'
export * from './production-build'
export * from './production-builder'
export * from './production-server'
export * from './release'
export * from './router'
export * from './scaffolding'
export * from './script-classifier'
export * from './seo'
export * from './serve'
// Where stx keeps its generated state (`.stx/` by default, configurable)
export * from './state-dir'
export * from './style-scoping'
export * from './template-compiler'
export * from './template-hydrator'
export * from './streaming'
export * from './suspense'
export * from './teleport'
export * from './transitions'
export * from './type-checker'
// Type-checking the TypeScript inside .stx script blocks, and the CLI behind
// `stx typecheck` (#1852). Distinct from ./type-checker, which is a bespoke
// checker for template EXPRESSIONS.
export * from './typecheck'
export * from './web-components'
export * from './virtual-scrolling'
export * from './partial-hydration'
export * from './hydration-runtime'
export * from './client'
export * from './loading-indicator'
export * from './reactive-bindings'
export * from './client-helpers'
export * from './client-script'
export * from './strip-literals'
export * from './component-hmr'
export * from './hydration'
// ssg moved to stx/ssg
export * from './ssr'
// State management — explicit exports to avoid conflicts with runtime.ts and reactivity.ts
export {
  createStore,
  defineStore,
  getStore,
  getStoreNames,
  hasStore,
  registerStoresClient,
  useStore,
} from './state-management'
export type { Store, StoreOptions, PersistOptions, DefineStoreOptions } from './state-management'
// visual-testing moved to stx/visual-testing
export * from './image-optimization'
export * from './media'
// bundle-analyzer moved to stx/bundle-analyzer
export * from './build-views'
export * from './signals'
export * from './spa-shell'

// Vue compatibility, server bindings, and JSX support
export * from './vue-template'
export { processServerBindings } from './server-bindings'
export { provide, inject, setGlobalProvide, defineEmits, defineExpose, defineSlots, nextTick, onErrorCaptured, handleError, useSlots, useAttrs, createProvideContext, generateCompositionRuntime } from './composition-api'
export type { StxComponentInstance, EmitFn } from './composition-api'
export { jsx, jsxs, jsxDEV, Fragment, renderToString, renderToStream, renderToDOM, Show, For, Portal, h } from './jsx-runtime'
export type { VNode } from './jsx-runtime'
export { createApp, createApp as createStxApp, defineCustomElement } from './app'
export type { StxApp, StxApp as App, StxAppPlugin, StxPluginInput, StxAppConfig } from './app'
export * from './dynamic-components'
export { definePlugin, pluginManager } from './plugin-system'
export type { StxPlugin, PluginContext, PluginSetupContext } from './plugin-system'

// These modules are exported first to establish their types
export * from './render'
export { extractClassNames, generateCrosswindCSS, getCrosswindServeAsset, injectCrosswindCSS } from './dev-server/crosswind'

// One crosswind merge shared by every render path (#1867)
export { deepMergeThemes, mergeCrosswindConfig, type MergedCrosswindConfig } from './crosswind-config'

// Dev-mode invalidation for the store/composable bundles (#1877)
export { clearStoreCache, getStoreScript } from './store-loader'
export { clearComposableCache } from './composable-loader'

// Generated union of layouts on disk (#1879)
export { discoverLayoutNames, generateLayoutTypes, LAYOUT_TYPES_FILE, renderLayoutTypes } from './layout-types'

// Typed route paths (#1887). Without this export the generated augmentation is
// dangling again, for exactly the reason `stx/routes` was.
export {
  $path,
  type CheckHref,
  type KnownRoutes,
  type RouteHref,
  type RouteParams,
  type RoutePath,
  type RoutePattern,
  type RoutePatternUsedAsHref,
  type UnknownRoute,
} from './route-types'
export { runDoctor, formatDoctorReport, findPantryPackage } from './doctor'
export type { DoctorCheck, DoctorReport, DoctorOptions, CheckStatus } from './doctor'
export {
  applyTranslations,
  buildAlternateLinks,
  buildLangPickerScript,
  buildStaticSite,
  defineSiteConfig,
  generateRobots,
  generateSitemap,
  // injectRouterScript intentionally NOT re-exported here — it would collide
  // with the canonical runtime-injection one (re-exported via `./render` →
  // `./process` → `./runtime-injection`). The site-builder version hardcodes
  // `container:'body'` for static-site builds and would silently override
  // the dev-server's main-container injection. Static-site callers should
  // import it directly from '@stacksjs/stx/site-builder' or the explicit
  // module path if needed.
  injectSeo,
  injectThemeBootstrap,
  localizePath,
  resolveI18n,
  stripLocalePrefix,
  translate,
  type BuildOptions,
  type BuildResult as SiteBuildResult,
  type PageMeta,
  type ResolvedI18n,
  type RouterOptions,
  type SiteConfig,
  type SiteI18nOptions,
  type SiteRouterOptions,
  type SiteSeo,
  type SiteSocial,
  type SiteThemeOptions,
  type SitemapEntry,
  type ThemeOptions,
} from './site-builder'
export * from './utils'
export * from './slots'

// Testing module - has overlapping 'render' export with ssr
// Import from stx/testing directly if needed
// export * from './testing'

// Server components - has overlapping exports (RenderResult, clearComponentCache)
// Import from stx/server-components directly if needed
// export * from './server-components'

// stx-strict footgun linter (stacksjs/stx#1744)
export { lintStxStrict } from './strict-lint'
export type { StxStrictDiagnostic, StxStrictOptions, StxStrictRuleId } from './strict-lint'

// Types module - note: PropType is also in props, import from stx/props if needed
export * from './types'

// Props module — surfaces the user-facing typed-props API (stacksjs/stx#1740).
// Selective re-export avoids overlap with `./types`' string-union `PropType`
// (different shape) and `./composition-api`'s `defineEmits` / `EmitFn` (the
// canonical events API — props.ts has dead duplicates kept only for
// internal back-compat). For `PropType<T>` (constructor union) and the props
// flavour of `defineEmits` / `EmitFn`, import from 'stx/props' directly.
export {
  arrayOf,
  defineProps,
  definePropsWithValidation,
  oneOf,
  optional,
  processComponentProps,
  prop,
  required,
  shape,
  validated,
  withDefaults,
} from './props'
export type {
  ExtractPropTypes,
  PropOptions,
  PropsDefinition,
  PropValidationError,
  PropValidationResult,
} from './props'

// Default export for the stx module
export default {}
export { isMarkdownPath, type MarkdownRenderer, type MarkdownView, protectCodeBlocks, renderMarkdownView } from './markdown-view'
