/**
 * `@stacksjs/stx/native`: stx templates as native iOS/Android screens.
 *
 * A `.stx` screen compiles to a JavaScriptCore bundle that Craft renders with
 * UIKit (and Android views): the template becomes data, its expressions and
 * handlers real functions, and every render re-evaluates them on the device.
 *
 * @example
 * ```ts
 * import { compileNativeBundle } from '@stacksjs/stx/native'
 *
 * const { outFile, diagnostics } = await compileNativeBundle({
 *   screens: { Today: 'resources/native/Today.stx' },
 *   initialScreen: 'Today',
 *   minify: true,
 *   outFile: 'dist/native-screen.js',
 * })
 * ```
 *
 * From the command line: `stx native compile --format bundle --output native-screen.js`.
 */

// Compiler exports
export * from './compiler/ir'
export * from './compiler/headwind-to-style'
export * from './compiler/parser'
export * from './compiler/html-to-ir'
export * from './compiler/client-script'
export * from './compiler/render-screen'
export * from './compiler/bundle'
export * from './compiler/icons'
export * from './cli'
export type * from './runtime/craft'
export * from './runtime/shared-screen'

// Bridge exports
export * from './bridge/protocol'

// Component exports
export * from './components/primitives'

// Re-export types
export type {
  STXNode,
  STXStyle,
  STXDocument,
  STXComponentType,
  STXEventType,
} from './compiler/ir'

export type {
  ViewProps,
  TextProps,
  ButtonProps,
  ImageProps,
  TextInputProps,
  ScrollViewProps,
  FlatListProps,
  ModalProps,
  SwitchProps,
  SliderProps,
} from './components/primitives'

// Parser exports
export {
  parseSTX,
  parseSTXToNode,
  compileSTX,
  compileSTXFiles,
  mapToNativeComponent,
  transformToNativeComponents,
} from './compiler/parser'

export type { Token, TokenType } from './compiler/parser'

// Hot Reload exports
export {
  getHotReloadClient,
  getErrorOverlay,
  initHotReload,
  HotReloadClient,
  ErrorOverlay,
} from './hot-reload/client'

export type {
  HotReloadMessage,
  HotReloadState,
  HotReloadCallback,
  ErrorOverlayOptions,
} from './hot-reload/client'

// Runtime exports
export {
  getRuntime,
  startRuntime,
  render,
  setState,
  getState,
  STXRuntime,
} from './runtime/index'

export type { RuntimeConfig } from './runtime/index'
