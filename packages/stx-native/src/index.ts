/**
 * STX Native
 *
 * Compile STX templates to native iOS/Android UI components.
 * Similar to React Native, but with STX's familiar HTML-like syntax
 * and Headwind (Tailwind) utility classes.
 *
 * @example
 * ```typescript
 * import { compile, render } from 'stx-native'
 *
 * // Compile STX template to IR
 * const ir = await compile('./app.stx')
 *
 * // Render to platform (handled by native runtime)
 * await render(ir)
 * ```
 */

// Compiler exports
export * from './compiler/ir'
export * from './compiler/headwind-to-style'
export * from './compiler/parser'

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
