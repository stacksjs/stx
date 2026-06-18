/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
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

interface CraftSidebarItem {
  id: string
  label: string
  icon?: string
  badge?: string
  tintColor?: string
}

interface CraftSidebarSection {
  id: string
  header?: string
  title?: string
  items: CraftSidebarItem[]
}

interface CraftSidebarConfig {
  id: string
  variant: string
  material: string
  backgroundEffect: string
  allowsVibrancy: boolean
  materialOpacity: number
  materialDarkOpacity?: number
  minWidth?: number
  maxWidth?: number
  canCollapse: boolean
  searchPlaceholder?: string
  selectedItem?: string
  sections: CraftSidebarSection[]
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
  sidebar: {
    nativeType: 'craft-sidebar',
    fallbackTag: 'aside',
    fallbackClasses: 'craft-sidebar craft-sidebar-tahoe',
    nativeProps: [
      'id',
      'variant',
      'material',
      'backgroundEffect',
      'allowsVibrancy',
      'materialOpacity',
      'materialDarkOpacity',
      'minWidth',
      'maxWidth',
      'canCollapse',
      'searchPlaceholder',
      'selectedItem',
      'sections',
    ],
    render: renderCraftSidebar,
  },
  'sidebar-section': {
    nativeType: 'craft-sidebar-section',
    fallbackTag: 'section',
    fallbackClasses: 'craft-sidebar-section',
    nativeProps: ['id', 'title', 'header'],
    render: renderCraftSidebarSection,
  },
  'sidebar-item': {
    nativeType: 'craft-sidebar-item',
    fallbackTag: 'button',
    fallbackClasses: 'craft-sidebar-item',
    nativeProps: ['id', 'label', 'icon', 'badge', 'tintColor'],
    render: renderCraftSidebarItem,
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

.craft-sidebar {
  --craft-sidebar-width: 286px;
  --craft-sidebar-bg: rgba(255, 255, 255, 0.68);
  --craft-sidebar-border: rgba(255, 255, 255, 0.62);
  --craft-sidebar-shadow: 0 24px 70px rgba(15, 23, 42, 0.22), 0 1px 0 rgba(255, 255, 255, 0.72) inset;
  --craft-sidebar-text: rgba(24, 24, 27, 0.86);
  --craft-sidebar-muted: rgba(63, 63, 70, 0.62);
  --craft-sidebar-hover: rgba(255, 255, 255, 0.42);
  --craft-sidebar-selected: rgba(10, 132, 255, 0.86);
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--craft-sidebar-width);
  min-width: var(--craft-sidebar-width);
  height: 100vh;
  padding: 58px 10px 12px;
  color: var(--craft-sidebar-text);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)),
    var(--craft-sidebar-bg);
  border: 1px solid var(--craft-sidebar-border);
  border-radius: 18px;
  box-shadow: var(--craft-sidebar-shadow);
  backdrop-filter: blur(34px) saturate(180%);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  overflow: hidden;
  user-select: none;
}
.craft-sidebar::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 0%, rgba(255,255,255,0.68), transparent 32%),
    linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.30) 42%, transparent 58%);
  mix-blend-mode: screen;
  opacity: 0.72;
}
.craft-sidebar[data-native-active="true"] { display: none; }
.craft-sidebar-search {
  position: relative;
  z-index: 1;
  margin: 0 0 12px;
}
.craft-sidebar-search input {
  width: 100%;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.34);
  color: inherit;
  font: inherit;
  font-size: 13px;
  outline: none;
}
.craft-sidebar-section {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
}
.craft-sidebar-section-title {
  padding: 0 8px 5px;
  color: var(--craft-sidebar-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.craft-sidebar-item {
  width: calc(100% - 4px);
  min-height: 28px;
  margin: 1px 2px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: default;
}
.craft-sidebar-item:hover { background: var(--craft-sidebar-hover); }
.craft-sidebar-item[data-selected="true"] {
  color: white;
  background: var(--craft-sidebar-selected);
  box-shadow: 0 1px 0 rgba(255,255,255,0.22) inset, 0 8px 18px rgba(10, 132, 255, 0.22);
}
.craft-sidebar-item-icon {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  opacity: 0.82;
  overflow: hidden;
  color: transparent;
}
.craft-sidebar-item-icon::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 4px;
  background: var(--craft-sidebar-icon-color, rgba(63, 63, 70, 0.62));
  box-shadow: 0 1px 0 rgba(255,255,255,0.24) inset;
}
.craft-sidebar-item-icon[data-icon*="circle"]::before {
  inset: 4px;
  border-radius: 999px;
}
.craft-sidebar-item[data-selected="true"] .craft-sidebar-item-icon::before {
  background: rgba(255, 255, 255, 0.9);
}
.craft-sidebar-item-label {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.craft-sidebar-item-badge {
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  color: var(--craft-sidebar-muted);
  font-size: 10px;
  font-weight: 700;
  text-align: center;
}
.craft-sidebar-item[data-selected="true"] .craft-sidebar-item-badge {
  color: white;
  background: rgba(255, 255, 255, 0.24);
}

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
  .craft-sidebar {
    --craft-sidebar-bg: rgba(24, 24, 27, 0.58);
    --craft-sidebar-border: rgba(255, 255, 255, 0.12);
    --craft-sidebar-shadow: 0 26px 74px rgba(0, 0, 0, 0.44), 0 1px 0 rgba(255, 255, 255, 0.11) inset;
    --craft-sidebar-text: rgba(244, 244, 245, 0.92);
    --craft-sidebar-muted: rgba(212, 212, 216, 0.58);
    --craft-sidebar-hover: rgba(255, 255, 255, 0.10);
  }
  .craft-sidebar-search input {
    border-color: rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.08);
  }
}
</style>
`

export const CRAFT_COMPONENT_RUNTIME = `
<script id="craft-component-runtime">
(function() {
  if (window.__stxCraftComponentRuntime) return;
  window.__stxCraftComponentRuntime = true;

  function parseConfig(sidebar) {
    var id = sidebar.getAttribute('data-craft-sidebar-id');
    var script = id && document.querySelector('script[data-craft-sidebar-config="' + id + '"]');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent || '{}');
    } catch (error) {
      console.warn('[stx] Invalid Craft sidebar config', error);
      return null;
    }
  }

  function getNativeUI() {
    if (!window.craft) return null;
    var hasNativeHost = window.craft.isCraft?.() ||
      !!(window.webkit?.messageHandlers?.craft || window.CraftBridge || window.craftIPC);
    if (!hasNativeHost) return null;
    return window.craft.nativeUI || window.craft.components;
  }

  function initializeSidebar(sidebar) {
    if (sidebar.dataset.craftInitialized === 'true') return;
    if (sidebar.dataset.native === 'false') return;

    var nativeUI = getNativeUI();
    if (!nativeUI || typeof nativeUI.createSidebar !== 'function') return;

    var config = parseConfig(sidebar);
    if (!config) return;

    try {
      var nativeConfig = Object.assign({}, config);
      delete nativeConfig.sections;
      var nativeSidebar = nativeUI.createSidebar(nativeConfig);
      if (nativeSidebar && config.sections) {
        config.sections.forEach(function(section) {
          if (nativeSidebar.addSection) nativeSidebar.addSection(section);
        });
      }
      if (nativeSidebar && config.selectedItem && nativeSidebar.setSelectedItem) {
        nativeSidebar.setSelectedItem(config.selectedItem);
      }
      if (nativeSidebar && nativeSidebar.onSelect) {
        nativeSidebar.onSelect(function(itemId) {
          sidebar.dispatchEvent(new CustomEvent('craft-sidebar:select', {
            bubbles: true,
            detail: { itemId: itemId, sidebarId: config.id }
          }));
        });
      }
      sidebar.dataset.craftInitialized = 'true';
      sidebar.dataset.nativeActive = 'true';
      window.__stxCraftNativeSidebars = window.__stxCraftNativeSidebars || {};
      window.__stxCraftNativeSidebars[config.id] = nativeSidebar;
    } catch (error) {
      sidebar.dataset.nativeError = error.message || 'unknown';
      console.warn('[stx] Failed to create native Craft sidebar', error);
    }
  }

  function initializeCraftComponents() {
    document.querySelectorAll('[data-craft-native-sidebar]').forEach(initializeSidebar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCraftComponents);
  } else {
    initializeCraftComponents();
  }
  window.addEventListener('craft:ready', initializeCraftComponents);
  document.addEventListener('craft:nativeui:ready', initializeCraftComponents);
})();
</script>
`

/**
 * Parse @craft-* component directives from stx template
 */
export function processCraftComponents(
  content: string,
  config: CraftComponentConfig = {},
): string {
  const { classPrefix = 'craft' } = config

  // Inject styles/runtime if not already present
  if (!content.includes('craft-component-styles')) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${CRAFT_COMPONENT_STYLES}\n</head>`)
    }
else if (content.includes('<style>')) {
      content = content.replace('<style>', `${CRAFT_COMPONENT_STYLES}\n<style>`)
    }
else {
      content = CRAFT_COMPONENT_STYLES + content
    }
  }
  if (!content.includes('craft-component-runtime')) {
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${CRAFT_COMPONENT_RUNTIME}\n</body>`)
    }
else {
      content += CRAFT_COMPONENT_RUNTIME
    }
  }

  // Process sidebar containers before generic self-closing tags so nested
  // @craft-sidebar-item nodes can be collected into the native config.
  content = content.replace(
    /<@craft-sidebar\s*([^>]*)>([\s\S]*?)<\/@craft-sidebar>/g,
    // eslint-disable-next-line pickier/no-unused-vars
    (match, propsStr, children) => {
      return renderCraftComponent('sidebar', propsStr, children.trim(), config, classPrefix)
    },
  )

  content = content.replace(
    /<@craft-sidebar\s*([^>]*?)\/>/g,
    // eslint-disable-next-line pickier/no-unused-vars
    (match, propsStr) => {
      return renderCraftComponent('sidebar', propsStr, '', config, classPrefix)
    },
  )

  // Process self-closing @craft-* tags: <@craft-button ... />
  content = content.replace(
    /<@craft-(\w+[-\w]*)\s*([^>]*?)\/>/g,
    // eslint-disable-next-line pickier/no-unused-vars
    (match, componentName, propsStr) => {
      return renderCraftComponent(componentName, propsStr, '', config, classPrefix)
    },
  )

  // Process @craft-* tags with children: <@craft-button>...</@craft-button>
  content = content.replace(
    /<@craft-(\w+[-\w]*)\s*([^>]*)>([\s\S]*?)<\/@craft-\1>/g,
    // eslint-disable-next-line pickier/no-unused-vars
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
    props.__fallbackClasses = classes.join(' ')
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
  const attrPattern = /(?::|@)?(\w+[-\w]*)(?:=(?:"([^"]*)"|'([^']*)'))?/g

  let match
  while ((match = attrPattern.exec(propsStr)) !== null) {
    const [full, name, doubleQuoted, singleQuoted] = match
    const value = doubleQuoted ?? singleQuoted
    if (full.startsWith(':')) {
      // Vue-style binding - keep as-is for now
      props[name] = value
    }
else if (full.startsWith('@')) {
      // Event handler - convert to on* attribute
      props[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = value
    }
else if (value === undefined) {
      // Boolean attribute
      props[name] = true
    }
else {
      props[name] = value
    }
  }

  return props
}

function renderCraftSidebar(props: Record<string, unknown>, children: string): string {
  const id = normalizeId(String(props.id || `craft-sidebar-${hashString(children || JSON.stringify(props))}`))
  const sections = normalizeSidebarSections(props.sections) || extractSidebarSections(children)
  const selectedItem = String(props.selectedItem || props.selected || sections[0]?.items[0]?.id || '')
  const config: CraftSidebarConfig = {
    id,
    variant: String(props.variant || 'desktop'),
    material: String(props.material || 'sidebar'),
    backgroundEffect: String(props.backgroundEffect || 'shimmer'),
    allowsVibrancy: props.allowsVibrancy !== false && props.allowsVibrancy !== 'false',
    materialOpacity: Number(props.materialOpacity ?? 0.68),
    materialDarkOpacity: props.materialDarkOpacity === undefined ? undefined : Number(props.materialDarkOpacity),
    minWidth: props.minWidth === undefined ? 240 : Number(props.minWidth),
    maxWidth: props.maxWidth === undefined ? 340 : Number(props.maxWidth),
    canCollapse: props.canCollapse !== false && props.canCollapse !== 'false',
    searchPlaceholder: props.searchPlaceholder ? String(props.searchPlaceholder) : undefined,
    selectedItem,
    sections,
  }
  const fallbackClasses = String(props.__fallbackClasses || 'craft-sidebar craft-sidebar-tahoe')
  const width = Number(props.width || props.sidebarWidth || 286)
  const native = props.native === false || props.native === 'false' ? 'false' : 'true'
  const search = config.searchPlaceholder
    ? `<div class="craft-sidebar-search"><input type="search" placeholder="${escapeHtml(config.searchPlaceholder)}"></div>`
    : ''
  const sectionHtml = sections.length
    ? sections.map(section => renderSidebarSectionFallback(section, selectedItem)).join('')
    : children

  return `<aside class="${escapeAttribute(fallbackClasses)}" data-craft="craft-sidebar" data-craft-native-sidebar data-craft-sidebar-id="${escapeAttribute(id)}" data-native="${native}" style="--craft-sidebar-width:${width}px">
  ${search}
  ${sectionHtml}
</aside>
<script type="application/json" data-craft-sidebar-config="${escapeAttribute(id)}">${escapeScriptJson(config)}</script>`
}

function renderCraftSidebarSection(props: Record<string, unknown>, children: string): string {
  const title = String(props.header || props.title || '')
  return `<section class="craft-sidebar-section" data-craft="craft-sidebar-section" data-section-id="${escapeAttribute(String(props.id || 'section'))}">
    ${title ? `<div class="craft-sidebar-section-title">${escapeHtml(title)}</div>` : ''}
    ${children}
  </section>`
}

function renderCraftSidebarItem(props: Record<string, unknown>, children: string): string {
  const item: CraftSidebarItem = {
    id: String(props.id || normalizeId(String(props.label || children || 'item'))),
    label: String(props.label || children || ''),
    icon: props.icon ? String(props.icon) : undefined,
    badge: props.badge ? String(props.badge) : undefined,
    tintColor: props.tintColor ? String(props.tintColor) : undefined,
  }
  return renderSidebarItemFallback(item, String(props.selected || '') === 'true')
}

function extractSidebarSections(children: string): CraftSidebarSection[] {
  const sections: CraftSidebarSection[] = []
  const sectionPattern = /<@craft-sidebar-section\s*([^>]*?)(?:\/>|>([\s\S]*?)<\/@craft-sidebar-section>)/g
  let sectionMatch: RegExpExecArray | null

  while ((sectionMatch = sectionPattern.exec(children)) !== null) {
    const props = parseProps(sectionMatch[1] || '')
    const body = sectionMatch[2] || ''
    const id = String(props.id || normalizeId(String(props.header || props.title || `section-${sections.length + 1}`)))
    const header = String(props.header || props.title || id)
    const items = extractSidebarItems(body)
    sections.push({ id, header, title: header, items })
  }

  return sections
}

function extractSidebarItems(content: string): CraftSidebarItem[] {
  const items: CraftSidebarItem[] = []
  const itemPattern = /<@craft-sidebar-item\s*([^>]*?)(?:\/>|>([\s\S]*?)<\/@craft-sidebar-item>)/g
  let itemMatch: RegExpExecArray | null

  while ((itemMatch = itemPattern.exec(content)) !== null) {
    const props = parseProps(itemMatch[1] || '')
    const label = String(props.label || (itemMatch[2] || '').replace(/<[^>]*>/g, '').trim())
    const id = String(props.id || normalizeId(label || `item-${items.length + 1}`))
    items.push({
      id,
      label,
      icon: props.icon ? String(props.icon) : undefined,
      badge: props.badge ? String(props.badge) : undefined,
      tintColor: props.tintColor ? String(props.tintColor) : undefined,
    })
  }

  return items
}

function normalizeSidebarSections(value: unknown): CraftSidebarSection[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value as CraftSidebarSection[]
  if (typeof value !== 'string') return undefined
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as CraftSidebarSection[] : undefined
  }
  catch {
    return undefined
  }
}

function renderSidebarSectionFallback(section: CraftSidebarSection, selectedItem: string): string {
  const title = section.header || section.title || section.id
  return `<section class="craft-sidebar-section" data-section-id="${escapeAttribute(section.id)}">
    <div class="craft-sidebar-section-title">${escapeHtml(title)}</div>
    ${section.items.map(item => renderSidebarItemFallback(item, item.id === selectedItem)).join('')}
  </section>`
}

function renderSidebarItemFallback(item: CraftSidebarItem, selected: boolean): string {
  const iconStyle = item.tintColor ? ` style="--craft-sidebar-icon-color:${escapeAttribute(item.tintColor)}"` : ''
  return `<button class="craft-sidebar-item" type="button" data-item-id="${escapeAttribute(item.id)}" data-selected="${selected ? 'true' : 'false'}">
    ${item.icon ? `<span class="craft-sidebar-item-icon" data-icon="${escapeAttribute(item.icon)}"${iconStyle}></span>` : ''}
    <span class="craft-sidebar-item-label">${escapeHtml(item.label)}</span>
    ${item.badge ? `<span class="craft-sidebar-item-badge">${escapeHtml(item.badge)}</span>` : ''}
  </button>`
}

function normalizeId(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '')
  return normalized || 'craft-sidebar'
}

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function escapeScriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
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
    }
else if (value !== false && value !== undefined && value !== null) {
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
  CRAFT_COMPONENT_RUNTIME: string
  processCraftComponents: typeof processCraftComponents
  registerCraftComponent: typeof registerCraftComponent
  getCraftComponents: typeof getCraftComponents
} = {
  CRAFT_COMPONENTS,
  CRAFT_COMPONENT_STYLES,
  CRAFT_COMPONENT_RUNTIME,
  processCraftComponents,
  registerCraftComponent,
  getCraftComponents,
}

export default craftComponents
