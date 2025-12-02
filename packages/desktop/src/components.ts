import type { ComponentProps } from './types'

/**
 * Native Components for Desktop Applications
 *
 * This module provides TypeScript wrappers for native UI components.
 * Components work in both browser (web-based) and desktop (native) environments.
 *
 * Categories:
 * - Input: Button, TextInput, Checkbox, RadioButton, Slider, ColorPicker, DatePicker, TimePicker, Autocomplete
 * - Display: Label, ImageView, ProgressBar, Avatar, Badge, Chip, Card, Tooltip, Toast
 * - Layout: ScrollView, SplitView, Accordion, Stepper, Modal, Tabs, Dropdown
 * - Data: ListView, Table, TreeView, DataGrid, Chart
 * - Advanced: Rating, CodeEditor, MediaPlayer, FileExplorer, WebView
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Button component properties
 */
export interface ButtonProps extends ComponentProps {
  text: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
}

/**
 * TextInput component properties
 */
export interface TextInputProps extends ComponentProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel'
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  required?: boolean
  autocomplete?: string
  label?: string
  error?: string
  hint?: string
}

/**
 * Checkbox component properties
 */
export interface CheckboxProps extends ComponentProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

/**
 * RadioButton component properties
 */
export interface RadioButtonProps extends ComponentProps {
  value: string
  name: string
  checked?: boolean
  onChange?: (value: string) => void
  label?: string
  disabled?: boolean
}

/**
 * Slider component properties
 */
export interface SliderProps extends ComponentProps {
  value?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  disabled?: boolean
  label?: string
  showValue?: boolean
}

/**
 * ProgressBar component properties
 */
export interface ProgressBarProps extends ComponentProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  indeterminate?: boolean
}

/**
 * Card component properties
 */
export interface CardProps extends ComponentProps {
  title?: string
  subtitle?: string
  content?: string
  image?: string
  footer?: string
  onClick?: () => void
  variant?: 'default' | 'outlined' | 'elevated'
}

/**
 * Badge component properties
 */
export interface BadgeProps extends ComponentProps {
  text: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
}

/**
 * Avatar component properties
 */
export interface AvatarProps extends ComponentProps {
  src?: string
  alt?: string
  name?: string
  size?: 'small' | 'medium' | 'large' | number
  shape?: 'circle' | 'square' | 'rounded'
}

/**
 * Tabs component properties
 */
export interface TabsProps extends ComponentProps {
  tabs: Array<{ label: string, value: string, disabled?: boolean }>
  activeTab?: string
  onChange?: (value: string) => void
  variant?: 'default' | 'pills' | 'underline'
}

/**
 * Dropdown component properties
 */
export interface DropdownProps extends ComponentProps {
  options: Array<{ label: string, value: string, disabled?: boolean }>
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
}

/**
 * Rating component properties
 */
export interface RatingProps extends ComponentProps {
  value?: number
  max?: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
  allowHalf?: boolean
}

/**
 * ColorPicker component properties
 */
export interface ColorPickerProps extends ComponentProps {
  value?: string
  onChange?: (color: string) => void
  disabled?: boolean
  label?: string
  format?: 'hex' | 'rgb' | 'hsl'
  showAlpha?: boolean
  presetColors?: string[]
}

/**
 * DatePicker component properties
 */
export interface DatePickerProps extends ComponentProps {
  value?: string | Date
  onChange?: (date: Date | null) => void
  min?: string | Date
  max?: string | Date
  disabled?: boolean
  label?: string
  placeholder?: string
  format?: string
  showClear?: boolean
}

/**
 * TimePicker component properties
 */
export interface TimePickerProps extends ComponentProps {
  value?: string
  onChange?: (time: string) => void
  disabled?: boolean
  label?: string
  format?: '12h' | '24h'
  step?: number
  min?: string
  max?: string
}

/**
 * Autocomplete component properties
 */
export interface AutocompleteProps extends ComponentProps {
  options: Array<{ label: string, value: string }>
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  onSearch?: (query: string) => void
  disabled?: boolean
  label?: string
  loading?: boolean
  minChars?: number
  maxResults?: number
}

/**
 * Label component properties
 */
export interface LabelProps extends ComponentProps {
  text: string
  htmlFor?: string
  required?: boolean
  size?: 'small' | 'medium' | 'large'
}

/**
 * ImageView component properties
 */
export interface ImageViewProps extends ComponentProps {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  fallback?: string
  loading?: 'eager' | 'lazy'
  onClick?: () => void
}

/**
 * Chip component properties
 */
export interface ChipProps extends ComponentProps {
  text: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  removable?: boolean
  onRemove?: () => void
  icon?: string
  onClick?: () => void
}

/**
 * Tooltip component properties
 */
export interface TooltipProps extends ComponentProps {
  text: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  children: string
}

/**
 * ScrollView component properties
 */
export interface ScrollViewProps extends ComponentProps {
  direction?: 'vertical' | 'horizontal' | 'both'
  showScrollbar?: boolean
  smooth?: boolean
  height?: string | number
  width?: string | number
  children: string
}

/**
 * SplitView component properties
 */
export interface SplitViewProps extends ComponentProps {
  direction?: 'horizontal' | 'vertical'
  sizes?: [number, number]
  minSizes?: [number, number]
  resizable?: boolean
  children: [string, string]
}

/**
 * Accordion component properties
 */
export interface AccordionProps extends ComponentProps {
  items: Array<{ title: string, content: string, disabled?: boolean }>
  multiple?: boolean
  defaultOpen?: number[]
}

/**
 * Stepper component properties
 */
export interface StepperProps extends ComponentProps {
  steps: Array<{ label: string, description?: string }>
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
  onStepClick?: (step: number) => void
}

/**
 * ModalComponent properties (different from modals.ts dialog)
 */
export interface ModalComponentProps extends ComponentProps {
  open?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  closable?: boolean
  onClose?: () => void
  children: string
  footer?: string
}

/**
 * ListView component properties
 */
export interface ListViewProps extends ComponentProps {
  items: Array<{ id: string, content: string, selected?: boolean }>
  selectable?: boolean
  multiSelect?: boolean
  onSelect?: (ids: string[]) => void
  emptyMessage?: string
}

/**
 * Table component properties
 */
export interface TableProps extends ComponentProps {
  columns: Array<{ key: string, label: string, width?: string, sortable?: boolean }>
  data: Array<Record<string, unknown>>
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (column: string) => void
}

/**
 * TreeView component properties
 */
export interface TreeViewProps extends ComponentProps {
  nodes: TreeNode[]
  expandedKeys?: string[]
  selectedKeys?: string[]
  checkable?: boolean
  onExpand?: (keys: string[]) => void
  onSelect?: (keys: string[]) => void
}

export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  icon?: string
  disabled?: boolean
}

/**
 * DataGrid component properties
 */
export interface DataGridProps extends ComponentProps {
  columns: Array<{ key: string, label: string, width?: string, sortable?: boolean, filterable?: boolean }>
  data: Array<Record<string, unknown>>
  pagination?: { page: number, pageSize: number, total: number }
  selectable?: boolean
  onPageChange?: (page: number) => void
  onSort?: (column: string, order: 'asc' | 'desc') => void
}

/**
 * Chart component properties
 */
export interface ChartProps extends ComponentProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  data: ChartData
  options?: ChartOptions
  width?: number | string
  height?: number | string
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
  }>
}

export interface ChartOptions {
  title?: string
  legend?: boolean
  animation?: boolean
}

/**
 * CodeEditor component properties
 */
export interface CodeEditorProps extends ComponentProps {
  value?: string
  language?: string
  theme?: 'light' | 'dark'
  lineNumbers?: boolean
  readOnly?: boolean
  onChange?: (value: string) => void
  height?: string | number
  tabSize?: number
  wordWrap?: boolean
}

/**
 * MediaPlayer component properties
 */
export interface MediaPlayerProps extends ComponentProps {
  src: string
  type?: 'video' | 'audio'
  poster?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  width?: string | number
  height?: string | number
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

/**
 * FileExplorer component properties
 */
export interface FileExplorerProps extends ComponentProps {
  files: FileNode[]
  viewMode?: 'list' | 'grid'
  showHidden?: boolean
  selectable?: boolean
  onSelect?: (path: string) => void
  onOpen?: (path: string) => void
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: Date
  icon?: string
}

/**
 * WebView component properties
 */
export interface WebViewProps extends ComponentProps {
  url: string
  width?: string | number
  height?: string | number
  sandbox?: boolean
  allowScripts?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate unique ID for components
 */
function generateId(prefix: string = 'stx'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Build class string from props
 */
function buildClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Build style string from object
 */
function buildStyles(styles: Record<string, string> | undefined): string {
  if (!styles) return ''
  return Object.entries(styles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ')
}

// =============================================================================
// Input Components
// =============================================================================

/**
 * Create a Button component
 */
export function createButton(props: ButtonProps): string {
  const {
    text,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    id = generateId('btn'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-button',
    `stx-button--${variant}`,
    `stx-button--${size}`,
    disabled && 'stx-button--disabled',
    loading && 'stx-button--loading',
    className,
  )

  const styleStr = buildStyles(style)
  const iconHtml = icon ? `<span class="stx-button-icon">${icon}</span>` : ''
  const loadingHtml = loading ? '<span class="stx-button-spinner"></span>' : ''

  const content = iconPosition === 'left'
    ? `${iconHtml}${loadingHtml}<span class="stx-button-text">${escapeHtml(text)}</span>`
    : `<span class="stx-button-text">${escapeHtml(text)}</span>${iconHtml}${loadingHtml}`

  return `<button id="${id}" class="${classes}" ${disabled || loading ? 'disabled' : ''} ${styleStr ? `style="${styleStr}"` : ''}>${content}</button>`
}

/**
 * Create a TextInput component
 */
export function createTextInput(props: TextInputProps): string {
  const {
    value = '',
    placeholder = '',
    type = 'text',
    disabled = false,
    readonly = false,
    maxLength,
    minLength,
    pattern,
    required = false,
    autocomplete,
    label,
    error,
    hint,
    id = generateId('input'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-input',
    error && 'stx-input--error',
    disabled && 'stx-input--disabled',
    className,
  )

  const styleStr = buildStyles(style)
  const attrs = [
    `type="${type}"`,
    `id="${id}"`,
    `class="${classes}"`,
    value && `value="${escapeHtml(value)}"`,
    placeholder && `placeholder="${escapeHtml(placeholder)}"`,
    disabled && 'disabled',
    readonly && 'readonly',
    required && 'required',
    maxLength && `maxlength="${maxLength}"`,
    minLength && `minlength="${minLength}"`,
    pattern && `pattern="${escapeHtml(pattern)}"`,
    autocomplete && `autocomplete="${autocomplete}"`,
    styleStr && `style="${styleStr}"`,
  ].filter(Boolean).join(' ')

  let html = ''
  if (label) {
    html += `<label class="stx-input-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<input ${attrs} />`
  if (error) {
    html += `<div class="stx-input-error">${escapeHtml(error)}</div>`
  }
  else if (hint) {
    html += `<div class="stx-input-hint">${escapeHtml(hint)}</div>`
  }

  return `<div class="stx-input-wrapper">${html}</div>`
}

/**
 * Create a Checkbox component
 */
export function createCheckbox(props: CheckboxProps): string {
  const {
    checked = false,
    label,
    disabled = false,
    indeterminate = false,
    id = generateId('checkbox'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-checkbox', disabled && 'stx-checkbox--disabled', className)
  const styleStr = buildStyles(style)

  const inputAttrs = [
    'type="checkbox"',
    `id="${id}"`,
    checked && 'checked',
    disabled && 'disabled',
    indeterminate && 'data-indeterminate="true"',
  ].filter(Boolean).join(' ')

  return `
    <label class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>
      <input ${inputAttrs} />
      <span class="stx-checkbox-box"></span>
      ${label ? `<span class="stx-checkbox-label">${escapeHtml(label)}</span>` : ''}
    </label>
  `
}

/**
 * Create a Slider component
 */
export function createSlider(props: SliderProps): string {
  const {
    value = 50,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    label,
    showValue = true,
    id = generateId('slider'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-slider', disabled && 'stx-slider--disabled', className)
  const styleStr = buildStyles(style)

  const inputAttrs = [
    'type="range"',
    `id="${id}"`,
    `value="${value}"`,
    `min="${min}"`,
    `max="${max}"`,
    `step="${step}"`,
    disabled && 'disabled',
  ].filter(Boolean).join(' ')

  let html = ''
  if (label) {
    html += `<label class="stx-slider-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<div class="stx-slider-track"><input ${inputAttrs} /></div>`
  if (showValue) {
    html += `<span class="stx-slider-value">${value}</span>`
  }

  return `<div class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

// =============================================================================
// Display Components
// =============================================================================

/**
 * Create a ProgressBar component
 */
export function createProgressBar(props: ProgressBarProps): string {
  const {
    value,
    max = 100,
    variant = 'default',
    size = 'medium',
    showLabel = false,
    indeterminate = false,
    id = generateId('progress'),
    className,
    style,
  } = props

  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const classes = buildClasses(
    'stx-progress',
    `stx-progress--${variant}`,
    `stx-progress--${size}`,
    indeterminate && 'stx-progress--indeterminate',
    className,
  )
  const styleStr = buildStyles(style)

  return `
    <div id="${id}" class="${classes}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" ${styleStr ? `style="${styleStr}"` : ''}>
      <div class="stx-progress-bar" style="width: ${indeterminate ? '100%' : `${percentage}%`}"></div>
      ${showLabel ? `<span class="stx-progress-label">${Math.round(percentage)}%</span>` : ''}
    </div>
  `
}

/**
 * Create a Badge component
 */
export function createBadge(props: BadgeProps): string {
  const {
    text,
    variant = 'default',
    size = 'medium',
    id = generateId('badge'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-badge',
    `stx-badge--${variant}`,
    `stx-badge--${size}`,
    className,
  )
  const styleStr = buildStyles(style)

  return `<span id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${escapeHtml(text)}</span>`
}

/**
 * Create an Avatar component
 */
export function createAvatar(props: AvatarProps): string {
  const {
    src,
    alt = '',
    name,
    size = 'medium',
    shape = 'circle',
    id = generateId('avatar'),
    className,
    style,
  } = props

  const sizeClass = typeof size === 'number' ? '' : `stx-avatar--${size}`
  const sizeStyle = typeof size === 'number' ? `width: ${size}px; height: ${size}px;` : ''

  const classes = buildClasses('stx-avatar', sizeClass, `stx-avatar--${shape}`, className)
  const combinedStyle = [sizeStyle, buildStyles(style)].filter(Boolean).join(' ')

  // Generate initials from name
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : ''

  if (src) {
    return `<div id="${id}" class="${classes}" ${combinedStyle ? `style="${combinedStyle}"` : ''}>
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="stx-avatar-img" />
    </div>`
  }

  return `<div id="${id}" class="${classes}" ${combinedStyle ? `style="${combinedStyle}"` : ''}>
    <span class="stx-avatar-initials">${initials}</span>
  </div>`
}

/**
 * Create a Card component
 */
export function createCard(props: CardProps): string {
  const {
    title,
    subtitle,
    content,
    image,
    footer,
    variant = 'default',
    id = generateId('card'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-card', `stx-card--${variant}`, className)
  const styleStr = buildStyles(style)

  let html = ''
  if (image) {
    html += `<div class="stx-card-image"><img src="${escapeHtml(image)}" alt="" /></div>`
  }
  html += '<div class="stx-card-body">'
  if (title) {
    html += `<h3 class="stx-card-title">${escapeHtml(title)}</h3>`
  }
  if (subtitle) {
    html += `<p class="stx-card-subtitle">${escapeHtml(subtitle)}</p>`
  }
  if (content) {
    html += `<div class="stx-card-content">${escapeHtml(content)}</div>`
  }
  html += '</div>'
  if (footer) {
    html += `<div class="stx-card-footer">${escapeHtml(footer)}</div>`
  }

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

// =============================================================================
// Layout Components
// =============================================================================

/**
 * Create a Tabs component
 */
export function createTabs(props: TabsProps): string {
  const {
    tabs,
    activeTab,
    variant = 'default',
    id = generateId('tabs'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-tabs', `stx-tabs--${variant}`, className)
  const styleStr = buildStyles(style)

  const tabsHtml = tabs.map((tab, index) => {
    const isActive = activeTab ? tab.value === activeTab : index === 0
    const tabClasses = buildClasses(
      'stx-tab',
      isActive && 'stx-tab--active',
      tab.disabled && 'stx-tab--disabled',
    )
    return `<button class="${tabClasses}" data-value="${escapeHtml(tab.value)}" ${tab.disabled ? 'disabled' : ''} role="tab" aria-selected="${isActive}">${escapeHtml(tab.label)}</button>`
  }).join('')

  return `<div id="${id}" class="${classes}" role="tablist" ${styleStr ? `style="${styleStr}"` : ''}>${tabsHtml}</div>`
}

/**
 * Create a Dropdown/Select component
 */
export function createDropdown(props: DropdownProps): string {
  const {
    options,
    value,
    placeholder = 'Select...',
    disabled = false,
    id = generateId('dropdown'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-dropdown', disabled && 'stx-dropdown--disabled', className)
  const styleStr = buildStyles(style)

  const optionsHtml = options.map(opt => {
    const selected = opt.value === value ? 'selected' : ''
    const disabledAttr = opt.disabled ? 'disabled' : ''
    return `<option value="${escapeHtml(opt.value)}" ${selected} ${disabledAttr}>${escapeHtml(opt.label)}</option>`
  }).join('')

  const placeholderOption = value ? '' : `<option value="" disabled selected>${escapeHtml(placeholder)}</option>`

  return `<select id="${id}" class="${classes}" ${disabled ? 'disabled' : ''} ${styleStr ? `style="${styleStr}"` : ''}>${placeholderOption}${optionsHtml}</select>`
}

// =============================================================================
// Advanced Components
// =============================================================================

/**
 * Create a Rating component
 */
export function createRating(props: RatingProps): string {
  const {
    value = 0,
    max = 5,
    readonly = false,
    size = 'medium',
    allowHalf = false,
    id = generateId('rating'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-rating',
    `stx-rating--${size}`,
    readonly && 'stx-rating--readonly',
    className,
  )
  const styleStr = buildStyles(style)

  let starsHtml = ''
  for (let i = 1; i <= max; i++) {
    const filled = i <= value
    const halfFilled = allowHalf && i - 0.5 === value
    const starClass = filled ? 'stx-star--filled' : halfFilled ? 'stx-star--half' : ''
    starsHtml += `<span class="stx-star ${starClass}" data-value="${i}">★</span>`
  }

  return `<div id="${id}" class="${classes}" role="slider" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" ${styleStr ? `style="${styleStr}"` : ''}>${starsHtml}</div>`
}

/**
 * Create a RadioButton component
 */
export function createRadioButton(props: RadioButtonProps): string {
  const {
    value,
    name,
    checked = false,
    label,
    disabled = false,
    id = generateId('radio'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-radio', disabled && 'stx-radio--disabled', className)
  const styleStr = buildStyles(style)

  const inputAttrs = [
    'type="radio"',
    `id="${id}"`,
    `name="${escapeHtml(name)}"`,
    `value="${escapeHtml(value)}"`,
    checked && 'checked',
    disabled && 'disabled',
  ].filter(Boolean).join(' ')

  return `
    <label class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>
      <input ${inputAttrs} />
      <span class="stx-radio-circle"></span>
      ${label ? `<span class="stx-radio-label">${escapeHtml(label)}</span>` : ''}
    </label>
  `
}

/**
 * Create a ColorPicker component
 */
export function createColorPicker(props: ColorPickerProps): string {
  const {
    value = '#3498db',
    disabled = false,
    label,
    presetColors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#1abc9c', '#34495e', '#000000'],
    id = generateId('color'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-color-picker', disabled && 'stx-color-picker--disabled', className)
  const styleStr = buildStyles(style)

  let html = ''
  if (label) {
    html += `<label class="stx-color-picker-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<div class="stx-color-picker-input">
    <input type="color" id="${id}" value="${escapeHtml(value)}" ${disabled ? 'disabled' : ''} />
    <span class="stx-color-picker-value">${escapeHtml(value)}</span>
  </div>`

  if (presetColors.length > 0) {
    html += '<div class="stx-color-picker-presets">'
    for (const color of presetColors) {
      html += `<button class="stx-color-preset" style="background: ${escapeHtml(color)}" data-color="${escapeHtml(color)}" ${disabled ? 'disabled' : ''}></button>`
    }
    html += '</div>'
  }

  return `<div class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a DatePicker component
 */
export function createDatePicker(props: DatePickerProps): string {
  const {
    value,
    min,
    max,
    disabled = false,
    label,
    placeholder = 'Select date',
    showClear = true,
    id = generateId('date'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-date-picker', disabled && 'stx-date-picker--disabled', className)
  const styleStr = buildStyles(style)

  const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value || ''
  const minValue = min instanceof Date ? min.toISOString().split('T')[0] : min
  const maxValue = max instanceof Date ? max.toISOString().split('T')[0] : max

  const inputAttrs = [
    'type="date"',
    `id="${id}"`,
    dateValue && `value="${dateValue}"`,
    minValue && `min="${minValue}"`,
    maxValue && `max="${maxValue}"`,
    disabled && 'disabled',
    `placeholder="${escapeHtml(placeholder)}"`,
  ].filter(Boolean).join(' ')

  let html = ''
  if (label) {
    html += `<label class="stx-date-picker-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<div class="stx-date-picker-input">
    <input ${inputAttrs} />
    ${showClear && dateValue ? '<button class="stx-date-picker-clear" type="button">&times;</button>' : ''}
  </div>`

  return `<div class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a TimePicker component
 */
export function createTimePicker(props: TimePickerProps): string {
  const {
    value = '',
    disabled = false,
    label,
    step = 60,
    min,
    max,
    id = generateId('time'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-time-picker', disabled && 'stx-time-picker--disabled', className)
  const styleStr = buildStyles(style)

  const inputAttrs = [
    'type="time"',
    `id="${id}"`,
    value && `value="${escapeHtml(value)}"`,
    `step="${step}"`,
    min && `min="${escapeHtml(min)}"`,
    max && `max="${escapeHtml(max)}"`,
    disabled && 'disabled',
  ].filter(Boolean).join(' ')

  let html = ''
  if (label) {
    html += `<label class="stx-time-picker-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<input ${inputAttrs} class="stx-time-picker-input" />`

  return `<div class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create an Autocomplete component
 */
export function createAutocomplete(props: AutocompleteProps): string {
  const {
    options,
    value = '',
    placeholder = 'Search...',
    disabled = false,
    label,
    loading = false,
    id = generateId('autocomplete'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-autocomplete', disabled && 'stx-autocomplete--disabled', className)
  const styleStr = buildStyles(style)

  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : value

  let html = ''
  if (label) {
    html += `<label class="stx-autocomplete-label" for="${id}">${escapeHtml(label)}</label>`
  }
  html += `<div class="stx-autocomplete-input-wrapper">
    <input type="text" id="${id}" value="${escapeHtml(displayValue)}" placeholder="${escapeHtml(placeholder)}" ${disabled ? 'disabled' : ''} autocomplete="off" class="stx-autocomplete-input" />
    ${loading ? '<span class="stx-autocomplete-spinner"></span>' : ''}
  </div>`
  html += '<ul class="stx-autocomplete-list">'
  for (const opt of options) {
    html += `<li class="stx-autocomplete-item ${opt.value === value ? 'stx-autocomplete-item--selected' : ''}" data-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</li>`
  }
  html += '</ul>'

  return `<div class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a Label component
 */
export function createLabel(props: LabelProps): string {
  const {
    text,
    htmlFor,
    required = false,
    size = 'medium',
    id = generateId('label'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-label', `stx-label--${size}`, className)
  const styleStr = buildStyles(style)

  return `<label id="${id}" class="${classes}" ${htmlFor ? `for="${escapeHtml(htmlFor)}"` : ''} ${styleStr ? `style="${styleStr}"` : ''}>${escapeHtml(text)}${required ? '<span class="stx-label-required">*</span>' : ''}</label>`
}

/**
 * Create an ImageView component
 */
export function createImageView(props: ImageViewProps): string {
  const {
    src,
    alt = '',
    width,
    height,
    objectFit = 'cover',
    fallback,
    loading = 'lazy',
    id = generateId('image'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-image', className)
  const imageStyles: Record<string, string> = { objectFit }
  if (width) imageStyles.width = typeof width === 'number' ? `${width}px` : width
  if (height) imageStyles.height = typeof height === 'number' ? `${height}px` : height

  const combinedStyle = [buildStyles(imageStyles), buildStyles(style)].filter(Boolean).join('; ')
  const fallbackAttr = fallback ? `onerror="this.src='${escapeHtml(fallback)}'"` : ''

  return `<img id="${id}" class="${classes}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="${loading}" ${combinedStyle ? `style="${combinedStyle}"` : ''} ${fallbackAttr} />`
}

/**
 * Create a Chip component
 */
export function createChip(props: ChipProps): string {
  const {
    text,
    variant = 'default',
    size = 'medium',
    removable = false,
    icon,
    id = generateId('chip'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-chip',
    `stx-chip--${variant}`,
    `stx-chip--${size}`,
    className,
  )
  const styleStr = buildStyles(style)

  let html = ''
  if (icon) {
    html += `<span class="stx-chip-icon">${icon}</span>`
  }
  html += `<span class="stx-chip-text">${escapeHtml(text)}</span>`
  if (removable) {
    html += '<button class="stx-chip-remove" type="button">&times;</button>'
  }

  return `<span id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</span>`
}

/**
 * Create a Tooltip component
 */
export function createTooltip(props: TooltipProps): string {
  const {
    text,
    position = 'top',
    delay = 200,
    children,
    id = generateId('tooltip'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-tooltip-wrapper', className)
  const styleStr = buildStyles(style)

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''} data-tooltip="${escapeHtml(text)}" data-position="${position}" data-delay="${delay}">
    ${children}
    <span class="stx-tooltip stx-tooltip--${position}">${escapeHtml(text)}</span>
  </div>`
}

/**
 * Create a ScrollView component
 */
export function createScrollView(props: ScrollViewProps): string {
  const {
    direction = 'vertical',
    showScrollbar = true,
    smooth = true,
    height,
    width,
    children,
    id = generateId('scroll'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-scroll-view',
    `stx-scroll-view--${direction}`,
    !showScrollbar && 'stx-scroll-view--hide-scrollbar',
    smooth && 'stx-scroll-view--smooth',
    className,
  )

  const scrollStyles: Record<string, string> = {}
  if (height) scrollStyles.height = typeof height === 'number' ? `${height}px` : height
  if (width) scrollStyles.width = typeof width === 'number' ? `${width}px` : width

  const combinedStyle = [buildStyles(scrollStyles), buildStyles(style)].filter(Boolean).join('; ')

  return `<div id="${id}" class="${classes}" ${combinedStyle ? `style="${combinedStyle}"` : ''}>${children}</div>`
}

/**
 * Create a SplitView component
 */
export function createSplitView(props: SplitViewProps): string {
  const {
    direction = 'horizontal',
    sizes = [50, 50],
    resizable = true,
    children,
    id = generateId('split'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-split-view',
    `stx-split-view--${direction}`,
    resizable && 'stx-split-view--resizable',
    className,
  )
  const styleStr = buildStyles(style)

  const sizeUnit = direction === 'horizontal' ? 'width' : 'height'

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>
    <div class="stx-split-pane" style="${sizeUnit}: ${sizes[0]}%">${children[0]}</div>
    ${resizable ? '<div class="stx-split-divider"></div>' : ''}
    <div class="stx-split-pane" style="${sizeUnit}: ${sizes[1]}%">${children[1]}</div>
  </div>`
}

/**
 * Create an Accordion component
 */
export function createAccordion(props: AccordionProps): string {
  const {
    items,
    multiple = false,
    defaultOpen = [],
    id = generateId('accordion'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-accordion', className)
  const styleStr = buildStyles(style)

  let html = ''
  items.forEach((item, index) => {
    const isOpen = defaultOpen.includes(index)
    const itemClasses = buildClasses(
      'stx-accordion-item',
      isOpen && 'stx-accordion-item--open',
      item.disabled && 'stx-accordion-item--disabled',
    )
    html += `<div class="${itemClasses}" data-index="${index}">
      <button class="stx-accordion-header" ${item.disabled ? 'disabled' : ''} aria-expanded="${isOpen}" data-multiple="${multiple}">
        <span class="stx-accordion-title">${escapeHtml(item.title)}</span>
        <span class="stx-accordion-icon">▼</span>
      </button>
      <div class="stx-accordion-content" ${isOpen ? '' : 'hidden'}>
        ${escapeHtml(item.content)}
      </div>
    </div>`
  })

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a Stepper component
 */
export function createStepper(props: StepperProps): string {
  const {
    steps,
    currentStep,
    orientation = 'horizontal',
    id = generateId('stepper'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-stepper', `stx-stepper--${orientation}`, className)
  const styleStr = buildStyles(style)

  let html = ''
  steps.forEach((step, index) => {
    const stepClasses = buildClasses(
      'stx-step',
      index < currentStep && 'stx-step--completed',
      index === currentStep && 'stx-step--active',
    )
    html += `<div class="${stepClasses}" data-step="${index}">
      <div class="stx-step-indicator">
        ${index < currentStep ? '✓' : index + 1}
      </div>
      <div class="stx-step-content">
        <div class="stx-step-label">${escapeHtml(step.label)}</div>
        ${step.description ? `<div class="stx-step-description">${escapeHtml(step.description)}</div>` : ''}
      </div>
    </div>`
    if (index < steps.length - 1) {
      html += '<div class="stx-step-connector"></div>'
    }
  })

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a Modal component (as a component, not a dialog function)
 */
export function createModalComponent(props: ModalComponentProps): string {
  const {
    open = false,
    title,
    size = 'medium',
    closable = true,
    children,
    footer,
    id = generateId('modal'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-modal-component', `stx-modal-component--${size}`, className)
  const styleStr = buildStyles(style)

  if (!open) {
    return `<div id="${id}" class="${classes} stx-modal-component--hidden" ${styleStr ? `style="${styleStr}"` : ''}></div>`
  }

  let html = '<div class="stx-modal-component-overlay">'
  html += '<div class="stx-modal-component-dialog">'

  if (title || closable) {
    html += '<div class="stx-modal-component-header">'
    if (title) {
      html += `<h3 class="stx-modal-component-title">${escapeHtml(title)}</h3>`
    }
    if (closable) {
      html += '<button class="stx-modal-component-close">&times;</button>'
    }
    html += '</div>'
  }

  html += `<div class="stx-modal-component-body">${children}</div>`

  if (footer) {
    html += `<div class="stx-modal-component-footer">${footer}</div>`
  }

  html += '</div></div>'

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a ListView component
 */
export function createListView(props: ListViewProps): string {
  const {
    items,
    selectable = false,
    multiSelect = false,
    emptyMessage = 'No items',
    id = generateId('list'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-list-view',
    selectable && 'stx-list-view--selectable',
    multiSelect && 'stx-list-view--multi',
    className,
  )
  const styleStr = buildStyles(style)

  if (items.length === 0) {
    return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>
      <div class="stx-list-view-empty">${escapeHtml(emptyMessage)}</div>
    </div>`
  }

  let html = '<ul class="stx-list-view-items">'
  for (const item of items) {
    const itemClasses = buildClasses(
      'stx-list-view-item',
      item.selected && 'stx-list-view-item--selected',
    )
    html += `<li class="${itemClasses}" data-id="${escapeHtml(item.id)}" ${selectable ? 'tabindex="0"' : ''}>${item.content}</li>`
  }
  html += '</ul>'

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a Table component
 */
export function createTable(props: TableProps): string {
  const {
    columns,
    data,
    striped = false,
    bordered = false,
    hoverable = true,
    sortBy,
    sortOrder,
    id = generateId('table'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-table',
    striped && 'stx-table--striped',
    bordered && 'stx-table--bordered',
    hoverable && 'stx-table--hoverable',
    className,
  )
  const styleStr = buildStyles(style)

  let html = '<table>'
  html += '<thead><tr>'
  for (const col of columns) {
    const isSorted = col.key === sortBy
    const sortClass = isSorted ? `stx-table-sorted stx-table-sorted--${sortOrder}` : ''
    const sortable = col.sortable ? 'data-sortable="true"' : ''
    const widthStyle = col.width ? `style="width: ${col.width}"` : ''
    html += `<th class="${sortClass}" ${sortable} ${widthStyle} data-key="${escapeHtml(col.key)}">${escapeHtml(col.label)}${col.sortable ? '<span class="stx-table-sort-icon"></span>' : ''}</th>`
  }
  html += '</tr></thead>'

  html += '<tbody>'
  for (const row of data) {
    html += '<tr>'
    for (const col of columns) {
      const cellValue = row[col.key]
      html += `<td>${cellValue != null ? escapeHtml(String(cellValue)) : ''}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table>'

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Render a tree node recursively
 */
function renderTreeNode(node: TreeNode, expandedKeys: string[], selectedKeys: string[], checkable: boolean): string {
  const isExpanded = expandedKeys.includes(node.key)
  const isSelected = selectedKeys.includes(node.key)
  const hasChildren = node.children && node.children.length > 0

  const nodeClasses = buildClasses(
    'stx-tree-node',
    isSelected && 'stx-tree-node--selected',
    node.disabled && 'stx-tree-node--disabled',
  )

  let html = `<div class="${nodeClasses}" data-key="${escapeHtml(node.key)}">`
  html += '<div class="stx-tree-node-content">'

  if (hasChildren) {
    html += `<span class="stx-tree-toggle ${isExpanded ? 'stx-tree-toggle--expanded' : ''}">▶</span>`
  }
  else {
    html += '<span class="stx-tree-toggle-placeholder"></span>'
  }

  if (checkable) {
    html += `<input type="checkbox" class="stx-tree-checkbox" ${isSelected ? 'checked' : ''} ${node.disabled ? 'disabled' : ''} />`
  }

  if (node.icon) {
    html += `<span class="stx-tree-icon">${node.icon}</span>`
  }

  html += `<span class="stx-tree-label">${escapeHtml(node.label)}</span>`
  html += '</div>'

  if (hasChildren && isExpanded) {
    html += '<div class="stx-tree-children">'
    for (const child of node.children!) {
      html += renderTreeNode(child, expandedKeys, selectedKeys, checkable)
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}

/**
 * Create a TreeView component
 */
export function createTreeView(props: TreeViewProps): string {
  const {
    nodes,
    expandedKeys = [],
    selectedKeys = [],
    checkable = false,
    id = generateId('tree'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-tree-view', checkable && 'stx-tree-view--checkable', className)
  const styleStr = buildStyles(style)

  let html = ''
  for (const node of nodes) {
    html += renderTreeNode(node, expandedKeys, selectedKeys, checkable)
  }

  return `<div id="${id}" class="${classes}" role="tree" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a DataGrid component
 */
export function createDataGrid(props: DataGridProps): string {
  const {
    columns,
    data,
    pagination,
    selectable = false,
    id = generateId('datagrid'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-data-grid', selectable && 'stx-data-grid--selectable', className)
  const styleStr = buildStyles(style)

  let html = '<div class="stx-data-grid-table-wrapper">'
  html += '<table class="stx-data-grid-table">'
  html += '<thead><tr>'

  if (selectable) {
    html += '<th class="stx-data-grid-select-all"><input type="checkbox" /></th>'
  }

  for (const col of columns) {
    const widthStyle = col.width ? `style="width: ${col.width}"` : ''
    html += `<th ${widthStyle}>
      <div class="stx-data-grid-header-cell">
        <span>${escapeHtml(col.label)}</span>
        ${col.sortable ? '<button class="stx-data-grid-sort">⇅</button>' : ''}
        ${col.filterable ? '<button class="stx-data-grid-filter">⊻</button>' : ''}
      </div>
    </th>`
  }
  html += '</tr></thead>'

  html += '<tbody>'
  for (const row of data) {
    html += '<tr>'
    if (selectable) {
      html += '<td class="stx-data-grid-select"><input type="checkbox" /></td>'
    }
    for (const col of columns) {
      const cellValue = row[col.key]
      html += `<td>${cellValue != null ? escapeHtml(String(cellValue)) : ''}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table></div>'

  if (pagination) {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize)
    html += `<div class="stx-data-grid-pagination">
      <span class="stx-data-grid-page-info">Page ${pagination.page} of ${totalPages} (${pagination.total} items)</span>
      <div class="stx-data-grid-page-buttons">
        <button class="stx-data-grid-page-btn" ${pagination.page <= 1 ? 'disabled' : ''}>◀</button>
        <button class="stx-data-grid-page-btn" ${pagination.page >= totalPages ? 'disabled' : ''}>▶</button>
      </div>
    </div>`
  }

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a Chart component (placeholder for integration with charting library)
 */
export function createChart(props: ChartProps): string {
  const {
    type,
    data,
    options = {},
    width = '100%',
    height = 300,
    id = generateId('chart'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-chart', `stx-chart--${type}`, className)
  const chartStyles: Record<string, string> = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }
  const combinedStyle = [buildStyles(chartStyles), buildStyles(style)].filter(Boolean).join('; ')

  // Store data as JSON for JavaScript charting library to consume
  const chartData = JSON.stringify({ type, data, options })

  return `<div id="${id}" class="${classes}" style="${combinedStyle}" data-chart='${escapeHtml(chartData)}'>
    <div class="stx-chart-placeholder">
      ${options.title ? `<div class="stx-chart-title">${escapeHtml(options.title)}</div>` : ''}
      <div class="stx-chart-type">${type.charAt(0).toUpperCase() + type.slice(1)} Chart</div>
      <div class="stx-chart-info">${data.datasets.length} dataset(s), ${data.labels.length} labels</div>
    </div>
  </div>`
}

/**
 * Create a CodeEditor component
 */
export function createCodeEditor(props: CodeEditorProps): string {
  const {
    value = '',
    language = 'plaintext',
    theme = 'dark',
    lineNumbers = true,
    readOnly = false,
    height = 300,
    tabSize = 2,
    wordWrap = false,
    id = generateId('code'),
    className,
    style,
  } = props

  const classes = buildClasses(
    'stx-code-editor',
    `stx-code-editor--${theme}`,
    lineNumbers && 'stx-code-editor--line-numbers',
    readOnly && 'stx-code-editor--readonly',
    wordWrap && 'stx-code-editor--wrap',
    className,
  )

  const editorStyles: Record<string, string> = {
    height: typeof height === 'number' ? `${height}px` : height,
  }
  const combinedStyle = [buildStyles(editorStyles), buildStyles(style)].filter(Boolean).join('; ')

  const lines = value.split('\n')
  let codeHtml = ''

  if (lineNumbers) {
    codeHtml += '<div class="stx-code-editor-gutter">'
    for (let i = 1; i <= lines.length; i++) {
      codeHtml += `<div class="stx-code-editor-line-number">${i}</div>`
    }
    codeHtml += '</div>'
  }

  codeHtml += `<pre class="stx-code-editor-content"><code class="language-${escapeHtml(language)}">${escapeHtml(value)}</code></pre>`

  return `<div id="${id}" class="${classes}" style="${combinedStyle}" data-language="${escapeHtml(language)}" data-tab-size="${tabSize}">${codeHtml}</div>`
}

/**
 * Create a MediaPlayer component
 */
export function createMediaPlayer(props: MediaPlayerProps): string {
  const {
    src,
    type = 'video',
    poster,
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    width,
    height,
    id = generateId('media'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-media-player', `stx-media-player--${type}`, className)
  const mediaStyles: Record<string, string> = {}
  if (width) mediaStyles.width = typeof width === 'number' ? `${width}px` : width
  if (height) mediaStyles.height = typeof height === 'number' ? `${height}px` : height

  const combinedStyle = [buildStyles(mediaStyles), buildStyles(style)].filter(Boolean).join('; ')

  const mediaAttrs = [
    `id="${id}-media"`,
    `src="${escapeHtml(src)}"`,
    controls && 'controls',
    autoplay && 'autoplay',
    loop && 'loop',
    muted && 'muted',
    type === 'video' && poster && `poster="${escapeHtml(poster)}"`,
  ].filter(Boolean).join(' ')

  const mediaElement = type === 'video'
    ? `<video ${mediaAttrs}>Your browser does not support the video tag.</video>`
    : `<audio ${mediaAttrs}>Your browser does not support the audio tag.</audio>`

  return `<div id="${id}" class="${classes}" ${combinedStyle ? `style="${combinedStyle}"` : ''}>${mediaElement}</div>`
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Create a FileExplorer component
 */
export function createFileExplorer(props: FileExplorerProps): string {
  const {
    files,
    viewMode = 'list',
    showHidden = false,
    selectable = true,
    id = generateId('files'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-file-explorer', `stx-file-explorer--${viewMode}`, className)
  const styleStr = buildStyles(style)

  const filteredFiles = showHidden ? files : files.filter(f => !f.name.startsWith('.'))

  let html = ''
  if (viewMode === 'list') {
    html = '<table class="stx-file-explorer-list"><thead><tr><th>Name</th><th>Size</th><th>Modified</th></tr></thead><tbody>'
    for (const file of filteredFiles) {
      const icon = file.icon || (file.type === 'folder' ? '📁' : '📄')
      const size = file.type === 'file' ? formatFileSize(file.size) : ''
      const modified = file.modified ? file.modified.toLocaleDateString() : ''
      html += `<tr class="stx-file-explorer-item ${selectable ? 'stx-file-explorer-item--selectable' : ''}" data-path="${escapeHtml(file.path)}" data-type="${file.type}">
        <td><span class="stx-file-explorer-icon">${icon}</span>${escapeHtml(file.name)}</td>
        <td>${size}</td>
        <td>${modified}</td>
      </tr>`
    }
    html += '</tbody></table>'
  }
  else {
    html = '<div class="stx-file-explorer-grid">'
    for (const file of filteredFiles) {
      const icon = file.icon || (file.type === 'folder' ? '📁' : '📄')
      html += `<div class="stx-file-explorer-item ${selectable ? 'stx-file-explorer-item--selectable' : ''}" data-path="${escapeHtml(file.path)}" data-type="${file.type}">
        <div class="stx-file-explorer-icon">${icon}</div>
        <div class="stx-file-explorer-name">${escapeHtml(file.name)}</div>
      </div>`
    }
    html += '</div>'
  }

  return `<div id="${id}" class="${classes}" ${styleStr ? `style="${styleStr}"` : ''}>${html}</div>`
}

/**
 * Create a WebView component
 */
export function createWebView(props: WebViewProps): string {
  const {
    url,
    width = '100%',
    height = 400,
    sandbox = true,
    allowScripts = true,
    id = generateId('webview'),
    className,
    style,
  } = props

  const classes = buildClasses('stx-webview', className)
  const webviewStyles: Record<string, string> = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }
  const combinedStyle = [buildStyles(webviewStyles), buildStyles(style)].filter(Boolean).join('; ')

  const sandboxAttrs: string[] = []
  if (sandbox) {
    sandboxAttrs.push('allow-same-origin')
    if (allowScripts) {
      sandboxAttrs.push('allow-scripts')
    }
  }
  const sandboxAttr = sandbox ? `sandbox="${sandboxAttrs.join(' ')}"` : ''

  return `<iframe id="${id}" class="${classes}" src="${escapeHtml(url)}" style="${combinedStyle}" ${sandboxAttr} loading="lazy" frameborder="0"></iframe>`
}

// =============================================================================
// Component List
// =============================================================================

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

/**
 * CSS styles for all components
 */
export const COMPONENT_STYLES = `
/* Button */
.stx-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.stx-button--primary { background: #3498db; color: #fff; }
.stx-button--primary:hover { background: #2980b9; }
.stx-button--secondary { background: #6c757d; color: #fff; }
.stx-button--outline { background: transparent; border: 1px solid #3498db; color: #3498db; }
.stx-button--ghost { background: transparent; color: #3498db; }
.stx-button--destructive { background: #e74c3c; color: #fff; }
.stx-button--small { padding: 4px 8px; font-size: 12px; }
.stx-button--large { padding: 12px 24px; font-size: 16px; }
.stx-button--disabled { opacity: 0.5; cursor: not-allowed; }
.stx-button--loading { pointer-events: none; }
.stx-button-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Input */
.stx-input-wrapper { display: flex; flex-direction: column; gap: 4px; }
.stx-input-label { font-size: 14px; font-weight: 500; color: #333; }
.stx-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; transition: border-color 0.15s; }
.stx-input:focus { outline: none; border-color: #3498db; }
.stx-input--error { border-color: #e74c3c; }
.stx-input-error { font-size: 12px; color: #e74c3c; }
.stx-input-hint { font-size: 12px; color: #666; }

/* Checkbox */
.stx-checkbox { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.stx-checkbox input { display: none; }
.stx-checkbox-box { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; transition: all 0.15s; }
.stx-checkbox input:checked + .stx-checkbox-box { background: #3498db; border-color: #3498db; }
.stx-checkbox--disabled { opacity: 0.5; cursor: not-allowed; }

/* Progress */
.stx-progress { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; position: relative; }
.stx-progress-bar { height: 100%; background: #3498db; transition: width 0.3s; }
.stx-progress--success .stx-progress-bar { background: #27ae60; }
.stx-progress--warning .stx-progress-bar { background: #f39c12; }
.stx-progress--error .stx-progress-bar { background: #e74c3c; }
.stx-progress--indeterminate .stx-progress-bar { animation: progress-indeterminate 1.5s infinite; }
@keyframes progress-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

/* Badge */
.stx-badge { display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.stx-badge--default { background: #e0e0e0; color: #333; }
.stx-badge--primary { background: #3498db; color: #fff; }
.stx-badge--success { background: #27ae60; color: #fff; }
.stx-badge--warning { background: #f39c12; color: #fff; }
.stx-badge--error { background: #e74c3c; color: #fff; }

/* Avatar */
.stx-avatar { display: inline-flex; align-items: center; justify-content: center; background: #3498db; color: #fff; overflow: hidden; }
.stx-avatar--circle { border-radius: 50%; }
.stx-avatar--square { border-radius: 0; }
.stx-avatar--rounded { border-radius: 8px; }
.stx-avatar--small { width: 32px; height: 32px; font-size: 12px; }
.stx-avatar--medium { width: 40px; height: 40px; font-size: 14px; }
.stx-avatar--large { width: 56px; height: 56px; font-size: 18px; }
.stx-avatar-img { width: 100%; height: 100%; object-fit: cover; }

/* Card */
.stx-card { background: #fff; border-radius: 8px; overflow: hidden; }
.stx-card--outlined { border: 1px solid #e0e0e0; }
.stx-card--elevated { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.stx-card-image img { width: 100%; display: block; }
.stx-card-body { padding: 16px; }
.stx-card-title { margin: 0 0 4px; font-size: 18px; }
.stx-card-subtitle { margin: 0 0 8px; color: #666; font-size: 14px; }
.stx-card-footer { padding: 12px 16px; border-top: 1px solid #e0e0e0; }

/* Tabs */
.stx-tabs { display: flex; gap: 4px; border-bottom: 1px solid #e0e0e0; }
.stx-tab { padding: 8px 16px; border: none; background: none; cursor: pointer; color: #666; border-bottom: 2px solid transparent; transition: all 0.15s; }
.stx-tab:hover { color: #333; }
.stx-tab--active { color: #3498db; border-bottom-color: #3498db; }
.stx-tab--disabled { opacity: 0.5; cursor: not-allowed; }
.stx-tabs--pills { border-bottom: none; }
.stx-tabs--pills .stx-tab { border-radius: 20px; border-bottom: none; }
.stx-tabs--pills .stx-tab--active { background: #3498db; color: #fff; }

/* Dropdown */
.stx-dropdown { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: #fff; cursor: pointer; min-width: 150px; }
.stx-dropdown:focus { outline: none; border-color: #3498db; }
.stx-dropdown--disabled { opacity: 0.5; cursor: not-allowed; }

/* Rating */
.stx-rating { display: inline-flex; gap: 4px; }
.stx-star { color: #ddd; cursor: pointer; transition: color 0.15s; }
.stx-star--filled { color: #f1c40f; }
.stx-star--half { background: linear-gradient(90deg, #f1c40f 50%, #ddd 50%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stx-rating--readonly .stx-star { cursor: default; }
.stx-rating--small .stx-star { font-size: 16px; }
.stx-rating--medium .stx-star { font-size: 24px; }
.stx-rating--large .stx-star { font-size: 32px; }

/* Slider */
.stx-slider { display: flex; align-items: center; gap: 12px; }
.stx-slider-track { flex: 1; }
.stx-slider input[type="range"] { width: 100%; }
.stx-slider-value { min-width: 40px; text-align: right; font-size: 14px; }

/* Radio Button */
.stx-radio { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.stx-radio input { display: none; }
.stx-radio-circle { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 50%; position: relative; transition: all 0.15s; }
.stx-radio input:checked + .stx-radio-circle { border-color: #3498db; }
.stx-radio input:checked + .stx-radio-circle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; background: #3498db; border-radius: 50%; }
.stx-radio--disabled { opacity: 0.5; cursor: not-allowed; }

/* Color Picker */
.stx-color-picker { display: flex; flex-direction: column; gap: 8px; }
.stx-color-picker-input { display: flex; align-items: center; gap: 8px; }
.stx-color-picker-input input[type="color"] { width: 40px; height: 40px; border: none; cursor: pointer; }
.stx-color-picker-value { font-family: monospace; }
.stx-color-picker-presets { display: flex; gap: 4px; flex-wrap: wrap; }
.stx-color-preset { width: 24px; height: 24px; border: 2px solid transparent; border-radius: 4px; cursor: pointer; }
.stx-color-preset:hover { border-color: #333; }

/* Date/Time Picker */
.stx-date-picker, .stx-time-picker { display: flex; flex-direction: column; gap: 4px; }
.stx-date-picker-input, .stx-time-picker-input { display: flex; align-items: center; gap: 4px; }
.stx-date-picker-input input, .stx-time-picker-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.stx-date-picker-clear { background: none; border: none; cursor: pointer; font-size: 16px; }

/* Autocomplete */
.stx-autocomplete { position: relative; }
.stx-autocomplete-input-wrapper { position: relative; }
.stx-autocomplete-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.stx-autocomplete-spinner { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #3498db; border-radius: 50%; animation: spin 0.6s linear infinite; }
.stx-autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 6px; max-height: 200px; overflow-y: auto; display: none; z-index: 10; }
.stx-autocomplete:focus-within .stx-autocomplete-list { display: block; }
.stx-autocomplete-item { padding: 8px 12px; cursor: pointer; }
.stx-autocomplete-item:hover { background: #f5f5f5; }
.stx-autocomplete-item--selected { background: #e8f4fc; }

/* Label */
.stx-label { display: inline-block; font-weight: 500; }
.stx-label--small { font-size: 12px; }
.stx-label--medium { font-size: 14px; }
.stx-label--large { font-size: 16px; }
.stx-label-required { color: #e74c3c; margin-left: 2px; }

/* Image */
.stx-image { display: block; max-width: 100%; }

/* Chip */
.stx-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 16px; font-size: 13px; }
.stx-chip--default { background: #e0e0e0; color: #333; }
.stx-chip--primary { background: #e8f4fc; color: #3498db; }
.stx-chip--success { background: #e8f8f0; color: #27ae60; }
.stx-chip--warning { background: #fef5e7; color: #f39c12; }
.stx-chip--error { background: #fdebeb; color: #e74c3c; }
.stx-chip--small { padding: 2px 8px; font-size: 11px; }
.stx-chip--large { padding: 6px 16px; font-size: 15px; }
.stx-chip-remove { background: none; border: none; cursor: pointer; opacity: 0.6; padding: 0 2px; }
.stx-chip-remove:hover { opacity: 1; }

/* Tooltip */
.stx-tooltip-wrapper { position: relative; display: inline-block; }
.stx-tooltip { position: absolute; background: #333; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; z-index: 1000; }
.stx-tooltip-wrapper:hover .stx-tooltip { opacity: 1; visibility: visible; }
.stx-tooltip--top { bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; }
.stx-tooltip--bottom { top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; }
.stx-tooltip--left { right: 100%; top: 50%; transform: translateY(-50%); margin-right: 8px; }
.stx-tooltip--right { left: 100%; top: 50%; transform: translateY(-50%); margin-left: 8px; }

/* Scroll View */
.stx-scroll-view { overflow: auto; }
.stx-scroll-view--vertical { overflow-x: hidden; overflow-y: auto; }
.stx-scroll-view--horizontal { overflow-x: auto; overflow-y: hidden; }
.stx-scroll-view--hide-scrollbar::-webkit-scrollbar { display: none; }
.stx-scroll-view--hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.stx-scroll-view--smooth { scroll-behavior: smooth; }

/* Split View */
.stx-split-view { display: flex; }
.stx-split-view--horizontal { flex-direction: row; }
.stx-split-view--vertical { flex-direction: column; }
.stx-split-pane { overflow: auto; }
.stx-split-divider { background: #e0e0e0; flex-shrink: 0; }
.stx-split-view--horizontal .stx-split-divider { width: 4px; cursor: col-resize; }
.stx-split-view--vertical .stx-split-divider { height: 4px; cursor: row-resize; }
.stx-split-divider:hover { background: #3498db; }

/* Accordion */
.stx-accordion { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.stx-accordion-item { border-bottom: 1px solid #e0e0e0; }
.stx-accordion-item:last-child { border-bottom: none; }
.stx-accordion-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: none; border: none; cursor: pointer; font-size: 14px; }
.stx-accordion-header:hover { background: #f5f5f5; }
.stx-accordion-icon { transition: transform 0.2s; }
.stx-accordion-item--open .stx-accordion-icon { transform: rotate(180deg); }
.stx-accordion-content { padding: 0 16px 16px; }
.stx-accordion-item--disabled { opacity: 0.5; }
.stx-accordion-item--disabled .stx-accordion-header { cursor: not-allowed; }

/* Stepper */
.stx-stepper { display: flex; }
.stx-stepper--horizontal { flex-direction: row; align-items: flex-start; }
.stx-stepper--vertical { flex-direction: column; }
.stx-step { display: flex; align-items: center; }
.stx-stepper--vertical .stx-step { flex-direction: row; }
.stx-step-indicator { width: 32px; height: 32px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; flex-shrink: 0; }
.stx-step--completed .stx-step-indicator { background: #27ae60; color: #fff; }
.stx-step--active .stx-step-indicator { background: #3498db; color: #fff; }
.stx-step-content { margin-left: 12px; }
.stx-step-label { font-size: 14px; font-weight: 500; }
.stx-step-description { font-size: 12px; color: #666; }
.stx-step-connector { flex: 1; height: 2px; background: #e0e0e0; margin: 0 8px; min-width: 20px; }
.stx-stepper--vertical .stx-step-connector { width: 2px; height: 20px; margin: 8px 0 8px 15px; }

/* Modal Component */
.stx-modal-component--hidden { display: none; }
.stx-modal-component-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.stx-modal-component-dialog { background: #fff; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
.stx-modal-component--small .stx-modal-component-dialog { width: 300px; }
.stx-modal-component--medium .stx-modal-component-dialog { width: 500px; }
.stx-modal-component--large .stx-modal-component-dialog { width: 800px; }
.stx-modal-component--fullscreen .stx-modal-component-dialog { width: 100%; height: 100%; border-radius: 0; }
.stx-modal-component-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e0e0e0; }
.stx-modal-component-title { margin: 0; font-size: 18px; }
.stx-modal-component-close { background: none; border: none; font-size: 24px; cursor: pointer; opacity: 0.6; }
.stx-modal-component-close:hover { opacity: 1; }
.stx-modal-component-body { padding: 16px; overflow-y: auto; flex: 1; }
.stx-modal-component-footer { padding: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 8px; }

/* List View */
.stx-list-view { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.stx-list-view-items { list-style: none; margin: 0; padding: 0; }
.stx-list-view-item { padding: 12px 16px; border-bottom: 1px solid #e0e0e0; }
.stx-list-view-item:last-child { border-bottom: none; }
.stx-list-view--selectable .stx-list-view-item { cursor: pointer; }
.stx-list-view--selectable .stx-list-view-item:hover { background: #f5f5f5; }
.stx-list-view-item--selected { background: #e8f4fc; }
.stx-list-view-empty { padding: 24px; text-align: center; color: #666; }

/* Table */
.stx-table { overflow-x: auto; }
.stx-table table { width: 100%; border-collapse: collapse; }
.stx-table th, .stx-table td { padding: 12px; text-align: left; }
.stx-table th { font-weight: 600; background: #f5f5f5; }
.stx-table--bordered th, .stx-table--bordered td { border: 1px solid #e0e0e0; }
.stx-table--striped tbody tr:nth-child(even) { background: #f9f9f9; }
.stx-table--hoverable tbody tr:hover { background: #f5f5f5; }
.stx-table th[data-sortable] { cursor: pointer; }
.stx-table-sort-icon::after { content: '⇅'; margin-left: 4px; opacity: 0.3; }
.stx-table-sorted .stx-table-sort-icon::after { opacity: 1; }
.stx-table-sorted--asc .stx-table-sort-icon::after { content: '↑'; }
.stx-table-sorted--desc .stx-table-sort-icon::after { content: '↓'; }

/* Tree View */
.stx-tree-view { font-size: 14px; }
.stx-tree-node { padding-left: 20px; }
.stx-tree-node-content { display: flex; align-items: center; gap: 4px; padding: 4px; cursor: pointer; border-radius: 4px; }
.stx-tree-node-content:hover { background: #f5f5f5; }
.stx-tree-node--selected > .stx-tree-node-content { background: #e8f4fc; }
.stx-tree-node--disabled { opacity: 0.5; }
.stx-tree-toggle { width: 16px; cursor: pointer; transition: transform 0.2s; }
.stx-tree-toggle--expanded { transform: rotate(90deg); }
.stx-tree-toggle-placeholder { width: 16px; }
.stx-tree-children { padding-left: 8px; }

/* Data Grid */
.stx-data-grid { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.stx-data-grid-table-wrapper { overflow-x: auto; }
.stx-data-grid-table { width: 100%; border-collapse: collapse; }
.stx-data-grid-table th, .stx-data-grid-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
.stx-data-grid-table th { background: #f5f5f5; }
.stx-data-grid-header-cell { display: flex; align-items: center; gap: 8px; }
.stx-data-grid-sort, .stx-data-grid-filter { background: none; border: none; cursor: pointer; opacity: 0.5; }
.stx-data-grid-sort:hover, .stx-data-grid-filter:hover { opacity: 1; }
.stx-data-grid-pagination { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #e0e0e0; }
.stx-data-grid-page-buttons { display: flex; gap: 4px; }
.stx-data-grid-page-btn { padding: 4px 8px; border: 1px solid #e0e0e0; background: #fff; cursor: pointer; border-radius: 4px; }
.stx-data-grid-page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Chart */
.stx-chart { background: #f9f9f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.stx-chart-placeholder { text-align: center; padding: 20px; }
.stx-chart-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.stx-chart-type { font-size: 14px; color: #666; }
.stx-chart-info { font-size: 12px; color: #999; margin-top: 4px; }

/* Code Editor */
.stx-code-editor { display: flex; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; line-height: 1.5; overflow: hidden; border-radius: 8px; }
.stx-code-editor--dark { background: #1e1e1e; color: #d4d4d4; }
.stx-code-editor--light { background: #fff; color: #333; border: 1px solid #e0e0e0; }
.stx-code-editor-gutter { padding: 12px 8px; background: rgba(0,0,0,0.1); text-align: right; user-select: none; }
.stx-code-editor-line-number { color: #858585; }
.stx-code-editor-content { flex: 1; padding: 12px; overflow: auto; }
.stx-code-editor-content pre { margin: 0; }
.stx-code-editor--wrap .stx-code-editor-content { white-space: pre-wrap; word-wrap: break-word; }

/* Media Player */
.stx-media-player video, .stx-media-player audio { width: 100%; display: block; }
.stx-media-player--video { background: #000; }

/* File Explorer */
.stx-file-explorer { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.stx-file-explorer-list { width: 100%; border-collapse: collapse; }
.stx-file-explorer-list th { text-align: left; padding: 8px 12px; background: #f5f5f5; font-weight: 500; }
.stx-file-explorer-list td { padding: 8px 12px; border-top: 1px solid #e0e0e0; }
.stx-file-explorer-item--selectable { cursor: pointer; }
.stx-file-explorer-item--selectable:hover { background: #f5f5f5; }
.stx-file-explorer-icon { margin-right: 8px; }
.stx-file-explorer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; padding: 16px; }
.stx-file-explorer--grid .stx-file-explorer-item { text-align: center; padding: 12px; border-radius: 8px; }
.stx-file-explorer--grid .stx-file-explorer-icon { font-size: 32px; display: block; margin-bottom: 8px; }
.stx-file-explorer--grid .stx-file-explorer-name { font-size: 12px; word-break: break-all; }

/* WebView */
.stx-webview { border: none; display: block; }

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .stx-input-label { color: #eee; }
  .stx-input { background: #333; border-color: #555; color: #fff; }
  .stx-card { background: #2d2d2d; color: #fff; }
  .stx-card-subtitle { color: #aaa; }
  .stx-progress { background: #444; }
  .stx-dropdown { background: #333; border-color: #555; color: #fff; }
  .stx-accordion { border-color: #444; }
  .stx-accordion-item { border-color: #444; }
  .stx-accordion-header:hover { background: #333; }
  .stx-list-view { border-color: #444; }
  .stx-list-view-item { border-color: #444; }
  .stx-list-view--selectable .stx-list-view-item:hover { background: #333; }
  .stx-table th { background: #333; }
  .stx-table--bordered th, .stx-table--bordered td { border-color: #444; }
  .stx-tree-node-content:hover { background: #333; }
  .stx-data-grid { border-color: #444; }
  .stx-data-grid-table th, .stx-data-grid-table td { border-color: #444; }
  .stx-data-grid-table th { background: #333; }
  .stx-modal-component-dialog { background: #2d2d2d; color: #fff; }
  .stx-modal-component-header, .stx-modal-component-footer { border-color: #444; }
  .stx-file-explorer { border-color: #444; }
  .stx-file-explorer-list th { background: #333; }
  .stx-file-explorer-list td { border-color: #444; }
  .stx-autocomplete-list { background: #333; border-color: #444; }
  .stx-autocomplete-item:hover { background: #444; }
  .stx-chip--default { background: #444; color: #eee; }
  .stx-chip--primary { background: #1a3a52; }
  .stx-chip--success { background: #1a3a2a; }
  .stx-chip--warning { background: #3a2a1a; }
  .stx-chip--error { background: #3a1a1a; }
}
`
