/**
 * Craft Native Components for stx
 *
 * This module provides @craft-* directives that render native components
 * when running in a Craft environment, with HTML fallbacks for web browsers.
 *
 * @example
 * ```html
 * <@craft-button variant="primary" @click="handleClick">
 *   Click Me
 * </@craft-button>
 *
 * <@craft-text-input placeholder="Enter name" :value="name" @change="updateName" />
 *
 * <@craft-modal title="Settings" :open="showSettings">
 *   Modal content here
 * </@craft-modal>
 * ```
 */

export interface CraftComponentConfig {
  /**
   * Use native components when available (default: true)
   */
  preferNative?: boolean
  /**
   * CSS class prefix for fallback components
   */
  classPrefix?: string
  /**
   * Custom component overrides
   */
  components?: Record<string, CraftComponentDefinition>
}

export interface CraftComponentDefinition {
  /**
   * Native component type for Craft bridge
   */
  nativeType: string
  /**
   * HTML tag for web fallback
   */
  fallbackTag: string
  /**
   * Default CSS classes for fallback
   */
  fallbackClasses?: string
  /**
   * Props that map to native component
   */
  nativeProps?: string[]
  /**
   * Transform function for rendering
   */
  render?: (props: Record<string, unknown>, children: string) => string
}

/**
 * Built-in Craft component definitions
 */
export const CRAFT_COMPONENTS: Record<string, CraftComponentDefinition> = {
  // Input Components
  button: {
    nativeType: 'craft-button',
    fallbackTag: 'button',
    fallbackClasses: 'craft-button',
    nativeProps: ['variant', 'size', 'disabled', 'loading'],
  },
  'text-input': {
    nativeType: 'craft-text-input',
    fallbackTag: 'input',
    fallbackClasses: 'craft-text-input',
    nativeProps: ['placeholder', 'value', 'type', 'disabled', 'readonly'],
  },
  textarea: {
    nativeType: 'craft-textarea',
    fallbackTag: 'textarea',
    fallbackClasses: 'craft-textarea',
    nativeProps: ['placeholder', 'value', 'rows', 'disabled', 'readonly'],
  },
  checkbox: {
    nativeType: 'craft-checkbox',
    fallbackTag: 'input',
    fallbackClasses: 'craft-checkbox',
    nativeProps: ['checked', 'disabled', 'label'],
    render: (props, children) => {
      const checked = props.checked ? 'checked' : ''
      const disabled = props.disabled ? 'disabled' : ''
      return `<label class="craft-checkbox-wrapper">
        <input type="checkbox" class="craft-checkbox" ${checked} ${disabled}>
        <span class="craft-checkbox-label">${children || props.label || ''}</span>
      </label>`
    },
  },
  radio: {
    nativeType: 'craft-radio',
    fallbackTag: 'input',
    fallbackClasses: 'craft-radio',
    nativeProps: ['checked', 'disabled', 'name', 'value', 'label'],
  },
  select: {
    nativeType: 'craft-select',
    fallbackTag: 'select',
    fallbackClasses: 'craft-select',
    nativeProps: ['value', 'disabled', 'options', 'placeholder'],
  },
  slider: {
    nativeType: 'craft-slider',
    fallbackTag: 'input',
    fallbackClasses: 'craft-slider',
    nativeProps: ['value', 'min', 'max', 'step', 'disabled'],
    render: (props, _children) => {
      const min = props.min ?? 0
      const max = props.max ?? 100
      const step = props.step ?? 1
      const value = props.value ?? 50
      const disabled = props.disabled ? 'disabled' : ''
      return `<input type="range" class="craft-slider" min="${min}" max="${max}" step="${step}" value="${value}" ${disabled}>`
    },
  },

  // Display Components
  label: {
    nativeType: 'craft-label',
    fallbackTag: 'span',
    fallbackClasses: 'craft-label',
    nativeProps: ['text', 'for'],
  },
  badge: {
    nativeType: 'craft-badge',
    fallbackTag: 'span',
    fallbackClasses: 'craft-badge',
    nativeProps: ['variant', 'size'],
  },
  avatar: {
    nativeType: 'craft-avatar',
    fallbackTag: 'div',
    fallbackClasses: 'craft-avatar',
    nativeProps: ['src', 'alt', 'size', 'fallback'],
    render: (props, _children) => {
      const size = props.size || 40
      const src = props.src as string
      const alt = String(props.alt || '')
      const fallback = props.fallback || (alt ? alt.charAt(0).toUpperCase() : '?')
      if (src) {
        return `<img class="craft-avatar" src="${src}" alt="${alt}" style="width:${size}px;height:${size}px;border-radius:50%">`
      }
      return `<div class="craft-avatar craft-avatar-fallback" style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center">${fallback}</div>`
    },
  },
  progress: {
    nativeType: 'craft-progress',
    fallbackTag: 'div',
    fallbackClasses: 'craft-progress',
    nativeProps: ['value', 'max', 'variant'],
    render: (props, _children) => {
      const value = Number(props.value) || 0
      const max = Number(props.max) || 100
      const percent = Math.min(100, Math.max(0, (value / max) * 100))
      return `<div class="craft-progress"><div class="craft-progress-bar" style="width:${percent}%"></div></div>`
    },
  },
  spinner: {
    nativeType: 'craft-spinner',
    fallbackTag: 'div',
    fallbackClasses: 'craft-spinner',
    nativeProps: ['size'],
    render: (props, _children) => {
      const size = props.size || 24
      return `<div class="craft-spinner" style="width:${size}px;height:${size}px"></div>`
    },
  },

  // Layout Components
  card: {
    nativeType: 'craft-card',
    fallbackTag: 'div',
    fallbackClasses: 'craft-card',
    nativeProps: ['title', 'subtitle', 'variant'],
  },
  modal: {
    nativeType: 'craft-modal',
    fallbackTag: 'dialog',
    fallbackClasses: 'craft-modal',
    nativeProps: ['open', 'title', 'closable', 'size'],
    render: (props, children) => {
      const open = props.open ? 'open' : ''
      const title = props.title || ''
      return `<dialog class="craft-modal" ${open}>
        <div class="craft-modal-content">
          ${title ? `<div class="craft-modal-header"><h2>${title}</h2></div>` : ''}
          <div class="craft-modal-body">${children}</div>
        </div>
      </dialog>`
    },
  },
  tabs: {
    nativeType: 'craft-tabs',
    fallbackTag: 'div',
    fallbackClasses: 'craft-tabs',
    nativeProps: ['activeTab', 'tabs'],
  },
  accordion: {
    nativeType: 'craft-accordion',
    fallbackTag: 'details',
    fallbackClasses: 'craft-accordion',
    nativeProps: ['open', 'title'],
    render: (props, children) => {
      const open = props.open ? 'open' : ''
      const title = props.title || 'Details'
      return `<details class="craft-accordion" ${open}>
        <summary class="craft-accordion-header">${title}</summary>
        <div class="craft-accordion-content">${children}</div>
      </details>`
    },
  },
  divider: {
    nativeType: 'craft-divider',
    fallbackTag: 'hr',
    fallbackClasses: 'craft-divider',
    nativeProps: ['orientation', 'variant'],
  },

  // Data Components
  table: {
    nativeType: 'craft-table',
    fallbackTag: 'table',
    fallbackClasses: 'craft-table',
    nativeProps: ['columns', 'rows', 'sortable', 'selectable'],
  },
  list: {
    nativeType: 'craft-list',
    fallbackTag: 'ul',
    fallbackClasses: 'craft-list',
    nativeProps: ['items', 'selectable'],
  },
  tree: {
    nativeType: 'craft-tree',
    fallbackTag: 'div',
    fallbackClasses: 'craft-tree',
    nativeProps: ['nodes', 'expandable', 'selectable'],
  },

  // Feedback Components
  alert: {
    nativeType: 'craft-alert',
    fallbackTag: 'div',
    fallbackClasses: 'craft-alert',
    nativeProps: ['variant', 'title', 'dismissible'],
    render: (props, children) => {
      const variant = props.variant || 'info'
      const title = props.title || ''
      return `<div class="craft-alert craft-alert-${variant}" role="alert">
        ${title ? `<div class="craft-alert-title">${title}</div>` : ''}
        <div class="craft-alert-content">${children}</div>
      </div>`
    },
  },
  toast: {
    nativeType: 'craft-toast',
    fallbackTag: 'div',
    fallbackClasses: 'craft-toast',
    nativeProps: ['variant', 'duration', 'position'],
  },
  tooltip: {
    nativeType: 'craft-tooltip',
    fallbackTag: 'span',
    fallbackClasses: 'craft-tooltip',
    nativeProps: ['content', 'position'],
    render: (props, children) => {
      const content = props.content || ''
      const position = props.position || 'top'
      return `<span class="craft-tooltip" data-tooltip="${content}" data-position="${position}">${children}</span>`
    },
  },

  // Navigation Components
  menu: {
    nativeType: 'craft-menu',
    fallbackTag: 'nav',
    fallbackClasses: 'craft-menu',
    nativeProps: ['items', 'orientation'],
  },
  breadcrumb: {
    nativeType: 'craft-breadcrumb',
    fallbackTag: 'nav',
    fallbackClasses: 'craft-breadcrumb',
    nativeProps: ['items', 'separator'],
  },
  pagination: {
    nativeType: 'craft-pagination',
    fallbackTag: 'nav',
    fallbackClasses: 'craft-pagination',
    nativeProps: ['total', 'page', 'pageSize'],
  },

  // Advanced Components
  'code-editor': {
    nativeType: 'craft-code-editor',
    fallbackTag: 'textarea',
    fallbackClasses: 'craft-code-editor',
    nativeProps: ['value', 'language', 'theme', 'readonly', 'lineNumbers'],
  },
  'file-browser': {
    nativeType: 'craft-file-browser',
    fallbackTag: 'div',
    fallbackClasses: 'craft-file-browser',
    nativeProps: ['path', 'showHidden', 'selectable'],
  },
  'color-picker': {
    nativeType: 'craft-color-picker',
    fallbackTag: 'input',
    fallbackClasses: 'craft-color-picker',
    nativeProps: ['value', 'format'],
    render: (props, _children) => {
      const value = props.value || '#000000'
      return `<input type="color" class="craft-color-picker" value="${value}">`
    },
  },
  'date-picker': {
    nativeType: 'craft-date-picker',
    fallbackTag: 'input',
    fallbackClasses: 'craft-date-picker',
    nativeProps: ['value', 'min', 'max', 'format'],
    render: (props, _children) => {
      const value = props.value || ''
      const min = props.min || ''
      const max = props.max || ''
      return `<input type="date" class="craft-date-picker" value="${value}" min="${min}" max="${max}">`
    },
  },
  'time-picker': {
    nativeType: 'craft-time-picker',
    fallbackTag: 'input',
    fallbackClasses: 'craft-time-picker',
    nativeProps: ['value', 'min', 'max', 'step'],
    render: (props, _children) => {
      const value = props.value || ''
      return `<input type="time" class="craft-time-picker" value="${value}">`
    },
  },
}

/**
 * CSS styles for Craft component fallbacks
 */
export const CRAFT_COMPONENT_STYLES = `
<style id="craft-component-styles">
/* Craft Component Base Styles */
.craft-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--craft-primary, #3b82f6);
  color: white;
}
.craft-button:hover { opacity: 0.9; }
.craft-button:disabled { opacity: 0.5; cursor: not-allowed; }
.craft-button-secondary { background: var(--craft-secondary, #6b7280); }
.craft-button-outline { background: transparent; border: 1px solid currentColor; color: var(--craft-primary, #3b82f6); }

.craft-text-input, .craft-textarea, .craft-select {
  padding: 8px 12px;
  border: 1px solid var(--craft-border, #d1d5db);
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  background: var(--craft-bg, #fff);
  color: var(--craft-text, #1f2937);
  transition: border-color 0.2s ease;
}
.craft-text-input:focus, .craft-textarea:focus, .craft-select:focus {
  outline: none;
  border-color: var(--craft-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.craft-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.craft-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.craft-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  cursor: pointer;
}

.craft-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: var(--craft-primary, #3b82f6);
  color: white;
}

.craft-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--craft-secondary, #6b7280);
  color: white;
  font-weight: 600;
  overflow: hidden;
}
.craft-avatar img { width: 100%; height: 100%; object-fit: cover; }

.craft-progress {
  width: 100%;
  height: 8px;
  background: var(--craft-border, #e5e7eb);
  border-radius: 4px;
  overflow: hidden;
}
.craft-progress-bar {
  height: 100%;
  background: var(--craft-primary, #3b82f6);
  transition: width 0.3s ease;
}

.craft-spinner {
  border: 2px solid var(--craft-border, #e5e7eb);
  border-top-color: var(--craft-primary, #3b82f6);
  border-radius: 50%;
  animation: craft-spin 0.8s linear infinite;
}
@keyframes craft-spin { to { transform: rotate(360deg); } }

.craft-card {
  background: var(--craft-bg, #fff);
  border: 1px solid var(--craft-border, #e5e7eb);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.craft-modal {
  border: none;
  border-radius: 12px;
  padding: 0;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.craft-modal::backdrop { background: rgba(0,0,0,0.5); }
.craft-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--craft-border, #e5e7eb);
}
.craft-modal-header h2 { margin: 0; font-size: 18px; }
.craft-modal-body { padding: 20px; }

.craft-accordion {
  border: 1px solid var(--craft-border, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
}
.craft-accordion-header {
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 500;
  background: var(--craft-bg-secondary, #f9fafb);
}
.craft-accordion-content { padding: 16px; }

.craft-divider {
  border: none;
  border-top: 1px solid var(--craft-border, #e5e7eb);
  margin: 16px 0;
}

.craft-alert {
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid;
}
.craft-alert-info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
.craft-alert-success { background: #f0fdf4; border-color: #22c55e; color: #166534; }
.craft-alert-warning { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
.craft-alert-error { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
.craft-alert-title { font-weight: 600; margin-bottom: 4px; }

.craft-tooltip {
  position: relative;
  cursor: help;
}
.craft-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: #1f2937;
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.craft-tooltip:hover::after { opacity: 1; }

.craft-table {
  width: 100%;
  border-collapse: collapse;
}
.craft-table th, .craft-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--craft-border, #e5e7eb);
}
.craft-table th { font-weight: 600; background: var(--craft-bg-secondary, #f9fafb); }

.craft-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.craft-list li {
  padding: 12px;
  border-bottom: 1px solid var(--craft-border, #e5e7eb);
}
.craft-list li:last-child { border-bottom: none; }

.craft-code-editor {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  resize: vertical;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .craft-text-input, .craft-textarea, .craft-select, .craft-card {
    background: #1f2937;
    color: #f3f4f6;
    border-color: #374151;
  }
  .craft-modal {
    background: #1f2937;
    color: #f3f4f6;
  }
  .craft-accordion-header { background: #374151; }
  .craft-table th { background: #374151; }
}
</style>
`

/**
 * Parse @craft-* component directives from stx template
 */
export function processCraftComponents(
  content: string,
  config: CraftComponentConfig = {},
): string {
  const { classPrefix = 'craft' } = config

  // Inject styles if not already present
  if (!content.includes('craft-component-styles')) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${CRAFT_COMPONENT_STYLES}\n</head>`)
    } else if (content.includes('<style>')) {
      content = content.replace('<style>', `${CRAFT_COMPONENT_STYLES}\n<style>`)
    } else {
      content = CRAFT_COMPONENT_STYLES + content
    }
  }

  // Process self-closing @craft-* tags: <@craft-button ... />
  content = content.replace(
    /<@craft-(\w+[-\w]*)\s*([^>]*?)\/>/g,
    (match, componentName, propsStr) => {
      return renderCraftComponent(componentName, propsStr, '', config, classPrefix)
    },
  )

  // Process @craft-* tags with children: <@craft-button>...</@craft-button>
  content = content.replace(
    /<@craft-(\w+[-\w]*)\s*([^>]*)>([\s\S]*?)<\/@craft-\1>/g,
    (match, componentName, propsStr, children) => {
      return renderCraftComponent(componentName, propsStr, children.trim(), config, classPrefix)
    },
  )

  return content
}

/**
 * Render a single Craft component
 */
function renderCraftComponent(
  componentName: string,
  propsStr: string,
  children: string,
  config: CraftComponentConfig,
  classPrefix: string,
): string {
  const componentDef = config.components?.[componentName] || CRAFT_COMPONENTS[componentName]

  if (!componentDef) {
    console.warn(`[stx] Unknown Craft component: @craft-${componentName}`)
    return `<div class="${classPrefix}-unknown" data-component="${componentName}">${children}</div>`
  }

  // Parse props from the attribute string
  const props = parseProps(propsStr)

  // Add default classes
  const classes = [componentDef.fallbackClasses || `${classPrefix}-${componentName}`]
  if (props.class) {
    classes.push(props.class as string)
    delete props.class
  }

  // Use custom render function if available
  if (componentDef.render) {
    return componentDef.render(props, children)
  }

  // Build attribute string
  const attrs = buildAttributes(props, componentDef, classes)

  // Self-closing tags
  const selfClosing = ['input', 'hr', 'br', 'img'].includes(componentDef.fallbackTag)

  if (selfClosing) {
    return `<${componentDef.fallbackTag} ${attrs}>`
  }

  return `<${componentDef.fallbackTag} ${attrs}>${children}</${componentDef.fallbackTag}>`
}

/**
 * Parse props from attribute string
 */
function parseProps(propsStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  // Match various attribute patterns
  // Regular: name="value"
  // Binding: :name="expression"
  // Event: @event="handler"
  // Boolean: disabled
  const attrPattern = /(?::|@)?(\w+[-\w]*)(?:="([^"]*)")?/g

  let match
  while ((match = attrPattern.exec(propsStr)) !== null) {
    const [full, name, value] = match
    if (full.startsWith(':')) {
      // Vue-style binding - keep as-is for now
      props[name] = value
    } else if (full.startsWith('@')) {
      // Event handler - convert to on* attribute
      props[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = value
    } else if (value === undefined) {
      // Boolean attribute
      props[name] = true
    } else {
      props[name] = value
    }
  }

  return props
}

/**
 * Build HTML attribute string
 */
function buildAttributes(
  props: Record<string, unknown>,
  componentDef: CraftComponentDefinition,
  classes: string[],
): string {
  const attrs: string[] = []

  // Add class
  attrs.push(`class="${classes.join(' ')}"`)

  // Add data attribute for native component type
  attrs.push(`data-craft="${componentDef.nativeType}"`)

  // Add other props as attributes
  for (const [key, value] of Object.entries(props)) {
    if (value === true) {
      attrs.push(key)
    } else if (value !== false && value !== undefined && value !== null) {
      // Escape quotes in value
      const escaped = String(value).replace(/"/g, '&quot;')
      attrs.push(`${key}="${escaped}"`)
    }
  }

  return attrs.join(' ')
}

/**
 * Register a custom Craft component
 */
export function registerCraftComponent(
  name: string,
  definition: CraftComponentDefinition,
): void {
  CRAFT_COMPONENTS[name] = definition
}

/**
 * Get all registered Craft components
 */
export function getCraftComponents(): Record<string, CraftComponentDefinition> {
  return { ...CRAFT_COMPONENTS }
}

const craftComponents: {
  CRAFT_COMPONENTS: typeof CRAFT_COMPONENTS
  CRAFT_COMPONENT_STYLES: string
  processCraftComponents: typeof processCraftComponents
  registerCraftComponent: typeof registerCraftComponent
  getCraftComponents: typeof getCraftComponents
} = {
  CRAFT_COMPONENTS,
  CRAFT_COMPONENT_STYLES,
  processCraftComponents,
  registerCraftComponent,
  getCraftComponents,
}

export default craftComponents
