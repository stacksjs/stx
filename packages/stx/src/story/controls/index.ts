/**
 * STX Story - Built-in control components
 * Renders HTML for prop editing controls
 */

import type { ControlConfig } from '../types'

type ControlOption = string | { value: any, label: string }

/**
 * Normalize options to array format
 */
function normalizeOptions(options: ControlConfig['options']): ControlOption[] {
  if (!options)
    return []
  if (Array.isArray(options))
    return options
  // Handle Record<string, string>
  return Object.entries(options).map(([value, label]) => ({ value, label }))
}

/**
 * Render a control component as HTML
 */
export function renderControl(
  config: ControlConfig,
  value: any,
  onChange: string,
): string {
  const { type, title } = config

  switch (type) {
    case 'text':
      return renderTextControl(title || '', value, onChange)
    case 'number':
      return renderNumberControl(title || '', value, onChange, config)
    case 'boolean':
      return renderCheckboxControl(title || '', value, onChange)
    case 'select':
      return renderSelectControl(title || '', value, onChange, config)
    case 'radio':
      return renderRadioControl(title || '', value, onChange, config)
    case 'color':
      return renderColorControl(title || '', value, onChange)
    case 'textarea':
      return renderTextareaControl(title || '', value, onChange)
    case 'slider':
      return renderSliderControl(title || '', value, onChange, config)
    case 'json':
      return renderJsonControl(title || '', value, onChange)
    case 'date':
      return renderDateControl(title || '', value, onChange)
    case 'buttongroup':
      return renderButtonGroupControl(title || '', value, onChange, config)
    default:
      return renderTextControl(title || '', value, onChange)
  }
}

/**
 * Text input control
 */
export function renderTextControl(title: string, value: string, onChange: string): string {
  return `
    <div class="stx-control stx-control-text">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <input
        type="text"
        class="stx-control-input"
        value="${escapeHtml(String(value || ''))}"
        onchange="${onChange}"
      />
    </div>
  `
}

/**
 * Number input control
 */
export function renderNumberControl(
  title: string,
  value: number,
  onChange: string,
  config: ControlConfig,
): string {
  const min = config.min !== undefined ? `min="${config.min}"` : ''
  const max = config.max !== undefined ? `max="${config.max}"` : ''
  const step = config.step !== undefined ? `step="${config.step}"` : ''

  return `
    <div class="stx-control stx-control-number">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <input
        type="number"
        class="stx-control-input"
        value="${value ?? 0}"
        ${min} ${max} ${step}
        onchange="${onChange}"
      />
    </div>
  `
}

/**
 * Checkbox control
 */
export function renderCheckboxControl(title: string, value: boolean, onChange: string): string {
  const checked = value ? 'checked' : ''

  return `
    <div class="stx-control stx-control-checkbox">
      <label class="stx-control-label">
        <input
          type="checkbox"
          class="stx-control-checkbox-input"
          ${checked}
          onchange="${onChange}"
        />
        <span>${escapeHtml(title)}</span>
      </label>
    </div>
  `
}

/**
 * Select dropdown control
 */
export function renderSelectControl(
  title: string,
  value: any,
  onChange: string,
  config: ControlConfig,
): string {
  const options = normalizeOptions(config.options)
  const optionsHtml = options
    .map((opt: ControlOption) => {
      const optValue = typeof opt === 'object' ? opt.value : opt
      const optLabel = typeof opt === 'object' ? opt.label : opt
      const selected = optValue === value ? 'selected' : ''
      return `<option value="${escapeHtml(String(optValue))}" ${selected}>${escapeHtml(String(optLabel))}</option>`
    })
    .join('')

  return `
    <div class="stx-control stx-control-select">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <select class="stx-control-input" onchange="${onChange}">
        ${optionsHtml}
      </select>
    </div>
  `
}

/**
 * Radio button group control
 */
export function renderRadioControl(
  title: string,
  value: any,
  onChange: string,
  config: ControlConfig,
): string {
  const options = normalizeOptions(config.options)
  const name = `radio-${title.toLowerCase().replace(/\s+/g, '-')}`

  const optionsHtml = options
    .map((opt: ControlOption) => {
      const optValue = typeof opt === 'object' ? opt.value : opt
      const optLabel = typeof opt === 'object' ? opt.label : opt
      const checked = optValue === value ? 'checked' : ''
      return `
        <label class="stx-control-radio-option">
          <input
            type="radio"
            name="${name}"
            value="${escapeHtml(String(optValue))}"
            ${checked}
            onchange="${onChange}"
          />
          <span>${escapeHtml(String(optLabel))}</span>
        </label>
      `
    })
    .join('')

  return `
    <div class="stx-control stx-control-radio">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <div class="stx-control-radio-group">
        ${optionsHtml}
      </div>
    </div>
  `
}

/**
 * Color picker control
 */
export function renderColorControl(title: string, value: string, onChange: string): string {
  return `
    <div class="stx-control stx-control-color">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <div class="stx-control-color-wrapper">
        <input
          type="color"
          class="stx-control-color-input"
          value="${escapeHtml(value || '#000000')}"
          onchange="${onChange}"
        />
        <input
          type="text"
          class="stx-control-input stx-control-color-text"
          value="${escapeHtml(value || '#000000')}"
          onchange="${onChange}"
        />
      </div>
    </div>
  `
}

/**
 * Textarea control
 */
export function renderTextareaControl(title: string, value: string, onChange: string): string {
  return `
    <div class="stx-control stx-control-textarea">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <textarea
        class="stx-control-textarea-input"
        onchange="${onChange}"
      >${escapeHtml(String(value || ''))}</textarea>
    </div>
  `
}

/**
 * Slider control
 */
export function renderSliderControl(
  title: string,
  value: number,
  onChange: string,
  config: ControlConfig,
): string {
  const min = config.min ?? 0
  const max = config.max ?? 100
  const step = config.step ?? 1

  return `
    <div class="stx-control stx-control-slider">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <div class="stx-control-slider-wrapper">
        <input
          type="range"
          class="stx-control-slider-input"
          value="${value ?? min}"
          min="${min}"
          max="${max}"
          step="${step}"
          onchange="${onChange}"
          oninput="this.nextElementSibling.textContent = this.value"
        />
        <span class="stx-control-slider-value">${value ?? min}</span>
      </div>
    </div>
  `
}

/**
 * JSON editor control
 */
export function renderJsonControl(title: string, value: any, onChange: string): string {
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  return `
    <div class="stx-control stx-control-json">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <textarea
        class="stx-control-json-input"
        onchange="${onChange}"
      >${escapeHtml(jsonStr)}</textarea>
    </div>
  `
}

/**
 * Date input control
 */
export function renderDateControl(title: string, value: string, onChange: string): string {
  return `
    <div class="stx-control stx-control-date">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <input
        type="date"
        class="stx-control-input"
        value="${escapeHtml(value || '')}"
        onchange="${onChange}"
      />
    </div>
  `
}

/**
 * Get CSS styles for controls
 */
export function getControlStyles(): string {
  return `
    .stx-control {
      margin-bottom: 12px;
    }
    .stx-control-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary, #666);
      margin-bottom: 4px;
    }
    .stx-control-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 13px;
      background: var(--bg, #fff);
      color: var(--text, #333);
    }
    .stx-control-input:focus {
      outline: none;
      border-color: var(--primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    .stx-control-checkbox {
      display: flex;
      align-items: center;
    }
    .stx-control-checkbox label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .stx-control-checkbox-input {
      width: 16px;
      height: 16px;
    }
    .stx-control-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stx-control-radio-option {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .stx-control-color-wrapper {
      display: flex;
      gap: 8px;
    }
    .stx-control-color-input {
      width: 40px;
      height: 32px;
      padding: 2px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      cursor: pointer;
    }
    .stx-control-color-text {
      flex: 1;
    }
    .stx-control-textarea-input,
    .stx-control-json-input {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      background: var(--bg, #fff);
      color: var(--text, #333);
    }
    .stx-control-json-input {
      font-family: monospace;
      font-size: 12px;
    }
    .stx-control-slider-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stx-control-slider-input {
      flex: 1;
    }
    .stx-control-slider-value {
      min-width: 40px;
      text-align: right;
      font-size: 13px;
      color: var(--text-secondary, #666);
    }
  `
}

/**
 * Button group control
 */
export function renderButtonGroupControl(
  title: string,
  value: any,
  onChange: string,
  config: ControlConfig,
): string {
  const options = normalizeOptions(config.options)

  const buttonsHtml = options
    .map((opt: ControlOption) => {
      const optValue = typeof opt === 'object' ? opt.value : opt
      const optLabel = typeof opt === 'object' ? opt.label : opt
      const active = optValue === value ? 'active' : ''
      return `
        <button
          type="button"
          class="stx-control-btn-group-btn ${active}"
          data-value="${escapeHtml(String(optValue))}"
          onclick="${onChange}"
        >${escapeHtml(String(optLabel))}</button>
      `
    })
    .join('')

  return `
    <div class="stx-control stx-control-btn-group">
      <label class="stx-control-label">${escapeHtml(title)}</label>
      <div class="stx-control-btn-group-wrapper">
        ${buttonsHtml}
      </div>
    </div>
  `
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
