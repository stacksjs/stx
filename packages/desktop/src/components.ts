import type { ComponentProps } from './types'

/**
 * Native Components for Desktop Applications
 *
 * This module provides TypeScript wrappers for the 35 native components
 * available in the Zyte framework.
 *
 * Components are organized into categories:
 * - Input: Button, TextInput, Checkbox, RadioButton, Slider, ColorPicker, DatePicker, TimePicker, Autocomplete
 * - Display: Label, ImageView, ProgressBar, Avatar, Badge, Chip, Card, Tooltip, Toast
 * - Layout: ScrollView, SplitView, Accordion, Stepper, Modal, Tabs, Dropdown
 * - Data: ListView, Table, TreeView, DataGrid, Chart
 * - Advanced: Rating, CodeEditor, MediaPlayer, FileExplorer, WebView
 */

/**
 * Button component properties
 */
export interface ButtonProps extends ComponentProps {
  text: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

/**
 * TextInput component properties
 */
export interface TextInputProps extends ComponentProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  type?: 'text' | 'password' | 'email' | 'number'
  disabled?: boolean
}

/**
 * Checkbox component properties
 */
export interface CheckboxProps extends ComponentProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

/**
 * Note: Full component implementations would go here
 * For now, we're providing type definitions and placeholders
 */

/**
 * Create a Button component
 */
export function createButton(props: ButtonProps): string {
  console.warn('Button component not yet implemented', props)
  return `<button>${props.text}</button>`
}

/**
 * Create a TextInput component
 */
export function createTextInput(props: TextInputProps): string {
  console.warn('TextInput component not yet implemented', props)
  return '<input type="text" />'
}

/**
 * Create a Checkbox component
 */
export function createCheckbox(props: CheckboxProps): string {
  console.warn('Checkbox component not yet implemented', props)
  return '<input type="checkbox" />'
}

/**
 * List of all 35 available components
 */
export const AVAILABLE_COMPONENTS = [
  // Input Components (9)
  'Button',
  'TextInput',
  'Checkbox',
  'RadioButton',
  'Slider',
  'ColorPicker',
  'DatePicker',
  'TimePicker',
  'Autocomplete',

  // Display Components (9)
  'Label',
  'ImageView',
  'ProgressBar',
  'Avatar',
  'Badge',
  'Chip',
  'Card',
  'Tooltip',
  'Toast',

  // Layout Components (7)
  'ScrollView',
  'SplitView',
  'Accordion',
  'Stepper',
  'Modal',
  'Tabs',
  'Dropdown',

  // Data Components (5)
  'ListView',
  'Table',
  'TreeView',
  'DataGrid',
  'Chart',

  // Advanced Components (5)
  'Rating',
  'CodeEditor',
  'MediaPlayer',
  'FileExplorer',
  'WebView',
] as const

export type ComponentName = typeof AVAILABLE_COMPONENTS[number]
