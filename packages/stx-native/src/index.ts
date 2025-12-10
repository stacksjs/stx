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
