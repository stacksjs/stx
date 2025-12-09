import type { ModalButton, ModalOptions, ModalResult } from './types'

/**
 * Modal Dialog Implementation
 *
 * Provides cross-platform modal dialog functionality.
 * Uses native dialogs when available, falls back to web-based modals.
 *
 * Features:
 * - Multiple dialog types (info, warning, error, success, question)
 * - Custom buttons with actions
 * - Promise-based API
 * - Keyboard support (Enter/Escape)
 * - Accessible by default
 */

// =============================================================================
// Types
// =============================================================================

interface ModalState {
  id: string
  options: ModalOptions
  resolve: (result: ModalResult) => void
  element?: HTMLElement
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Check if native dialog APIs are available
 */
function hasNativeDialogSupport(): boolean {
  // Future: Check for @stacksjs/zyte bindings
  return false
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

// =============================================================================
// Modal Manager
// =============================================================================

// Active modal stack
const activeModals: ModalState[] = []

/**
 * Generate a unique modal ID
 */
function generateModalId(): string {
  return `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get icon for modal type
 */
function getModalIcon(type: ModalOptions['type']): string {
  switch (type) {
    case 'info':
      return '&#x2139;'
    case 'warning':
      return '&#x26A0;'
    case 'error':
      return '&#x2716;'
    case 'success':
      return '&#x2714;'
    case 'question':
      return '&#x2753;'
    default:
      return '&#x2139;'
  }
}

/**
 * Get default buttons for modal type
 */
function getDefaultButtons(type: ModalOptions['type']): ModalButton[] {
  if (type === 'question') {
    return [
      { label: 'No', style: 'default' },
      { label: 'Yes', style: 'primary' },
    ]
  }
  return [{ label: 'OK', style: 'primary' }]
}

/**
 * Create modal HTML for web-based implementation
 */
function createModalHTML(state: ModalState): string {
  const { options } = state
  const icon = getModalIcon(options.type)
  const buttons = options.buttons || getDefaultButtons(options.type)
  const typeClass = options.type || 'info'

  let buttonsHtml = ''
  buttons.forEach((btn, index) => {
    const styleClass = btn.style === 'destructive' ? 'destructive' : btn.style === 'primary' ? 'primary' : 'default'
    const autoFocus = index === (options.defaultButton ?? buttons.length - 1) ? 'autofocus' : ''
    buttonsHtml += `<button class="stx-modal-btn ${styleClass}" data-index="${index}" ${autoFocus}>${btn.label}</button>`
  })

  return `
    <div class="stx-modal-overlay" data-modal-id="${state.id}">
      <div class="stx-modal ${typeClass}" role="dialog" aria-modal="true" aria-labelledby="${state.id}-title">
        <div class="stx-modal-icon">${icon}</div>
        <div class="stx-modal-content">
          ${options.title ? `<h2 id="${state.id}-title" class="stx-modal-title">${escapeHtml(options.title)}</h2>` : ''}
          <p class="stx-modal-message">${escapeHtml(options.message)}</p>
        </div>
        <div class="stx-modal-buttons">${buttonsHtml}</div>
      </div>
    </div>
  `
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
 * Close a modal and resolve with result
 */
function closeModal(state: ModalState, buttonIndex: number, cancelled: boolean = false): void {
  // Remove from active modals
  const index = activeModals.indexOf(state)
  if (index > -1) {
    activeModals.splice(index, 1)
  }

  // Remove DOM element if exists
  if (state.element && isBrowser()) {
    state.element.remove()
  }

  // Call button action if provided
  const buttons = state.options.buttons || getDefaultButtons(state.options.type)
  const button = buttons[buttonIndex]
  if (button?.action) {
    button.action()
  }

  // Resolve promise
  state.resolve({ buttonIndex, cancelled })
}

/**
 * Show a native modal dialog
 *
 * @param options - Modal configuration options
 * @returns Promise resolving to the modal result
 *
 * @example
 * ```typescript
 * const result = await showModal({
 *   title: 'Confirm Action',
 *   message: 'Are you sure you want to proceed?',
 *   type: 'question',
 *   buttons: [
 *     { label: 'Cancel', style: 'default' },
 *     { label: 'Confirm', style: 'primary' },
 *   ],
 * })
 *
 * if (result.buttonIndex === 1) {
 *   // User clicked Confirm
 * }
 * ```
 */
export async function showModal(options: ModalOptions): Promise<ModalResult> {
  const hasNative = hasNativeDialogSupport()
  const id = generateModalId()

  return new Promise((resolve) => {
    const state: ModalState = {
      id,
      options,
      resolve,
    }

    activeModals.push(state)

    if (hasNative) {
      // Future: Use native dialog
      console.log(`[stx-modal] Showing native modal: ${options.title || 'Modal'}`)
      // For now, immediately resolve
      setTimeout(() => {
        closeModal(state, options.defaultButton ?? 0, false)
      }, 0)
    }
    else if (isBrowser()) {
      // Web-based implementation
      try {
        const container = document.createElement('div')
        container.innerHTML = createModalHTML(state)
        const overlay = container.firstElementChild as HTMLElement

        if (!overlay) {
          // Fallback to console if DOM manipulation fails
          console.log(`[stx-modal] ${options.type?.toUpperCase() || 'INFO'}: ${options.title || 'Modal'}`)
          console.log(`[stx-modal] ${options.message}`)
          setTimeout(() => {
            closeModal(state, options.defaultButton ?? 0, false)
          }, 0)
          return
        }

        state.element = overlay

        try {
          document.body.appendChild(overlay)
        }
        catch {
          // Fallback to console if appendChild fails (e.g., in very-happy-dom)
          console.log(`[stx-modal] ${options.type?.toUpperCase() || 'INFO'}: ${options.title || 'Modal'}`)
          console.log(`[stx-modal] ${options.message}`)
          setTimeout(() => {
            closeModal(state, options.defaultButton ?? 0, false)
          }, 0)
          return
        }

        // Handle button clicks
        try {
          overlay.querySelectorAll('.stx-modal-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
              const index = Number.parseInt((btn as HTMLElement).dataset.index || '0', 10)
              closeModal(state, index, false)
            })
          })
        }
        catch {
          // Ignore querySelectorAll errors in very-happy-dom
        }

        // Handle overlay click (close on backdrop click)
        try {
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              const cancelIndex = options.cancelButton ?? 0
              closeModal(state, cancelIndex, true)
            }
          })
        }
        catch {
          // Ignore addEventListener errors
        }

        // Handle keyboard
        try {
          const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              const cancelIndex = options.cancelButton ?? 0
              closeModal(state, cancelIndex, true)
              document.removeEventListener('keydown', handleKeydown)
            }
            else if (e.key === 'Enter') {
              const defaultIndex = options.defaultButton ?? ((options.buttons || getDefaultButtons(options.type)).length - 1)
              closeModal(state, defaultIndex, false)
              document.removeEventListener('keydown', handleKeydown)
            }
          }
          document.addEventListener('keydown', handleKeydown)
        }
        catch {
          // Ignore keyboard event errors
        }

        // Focus first button
        try {
          const firstButton = overlay.querySelector('.stx-modal-btn[autofocus]') as HTMLElement
          if (firstButton) {
            firstButton.focus()
          }
        }
        catch {
          // Ignore focus errors
        }
      }
      catch {
        // Fallback to console if any DOM operation fails
        console.log(`[stx-modal] ${options.type?.toUpperCase() || 'INFO'}: ${options.title || 'Modal'}`)
        console.log(`[stx-modal] ${options.message}`)
        setTimeout(() => {
          closeModal(state, options.defaultButton ?? 0, false)
        }, 0)
      }
    }
    else {
      // Node.js environment - console fallback
      console.log(`[stx-modal] ${options.type?.toUpperCase() || 'INFO'}: ${options.title || 'Modal'}`)
      console.log(`[stx-modal] ${options.message}`)
      const buttons = options.buttons || getDefaultButtons(options.type)
      console.log(`[stx-modal] Buttons: ${buttons.map(b => b.label).join(', ')}`)

      // Auto-resolve with default button
      setTimeout(() => {
        closeModal(state, options.defaultButton ?? 0, false)
      }, 0)
    }
  })
}

/**
 * Show an info modal
 */
export async function showInfoModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'info' })
}

/**
 * Show a warning modal
 */
export async function showWarningModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'warning' })
}

/**
 * Show an error modal
 */
export async function showErrorModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'error' })
}

/**
 * Show a success modal
 */
export async function showSuccessModal(title: string, message: string): Promise<ModalResult> {
  return showModal({ title, message, type: 'success' })
}

/**
 * Show a question/confirmation modal
 */
export async function showQuestionModal(title: string, message: string): Promise<ModalResult> {
  return showModal({
    title,
    message,
    type: 'question',
    buttons: [
      { label: 'No', style: 'default' },
      { label: 'Yes', style: 'primary' },
    ],
    defaultButton: 1,
    cancelButton: 0,
  })
}

/**
 * Show a confirm dialog (alias for showQuestionModal)
 */
export async function confirm(message: string, title: string = 'Confirm'): Promise<boolean> {
  const result = await showQuestionModal(title, message)
  return result.buttonIndex === 1
}

/**
 * Show an alert dialog (single OK button)
 */
export async function alert(message: string, title: string = 'Alert'): Promise<void> {
  await showInfoModal(title, message)
}

/**
 * Show a prompt dialog with input field
 */
export async function prompt(message: string, defaultValue: string = '', title: string = 'Input'): Promise<string | null> {
  // This would need custom implementation for input field
  // For now, use console in Node.js or native prompt in browser
  if (isBrowser() && typeof window.prompt === 'function') {
    return window.prompt(message, defaultValue)
  }

  console.log(`[stx-modal] PROMPT: ${title}`)
  console.log(`[stx-modal] ${message}`)
  console.log(`[stx-modal] Default: ${defaultValue}`)

  // In Node.js, would need readline or similar
  return defaultValue
}

/**
 * Get number of active modals
 */
export function getActiveModalCount(): number {
  return activeModals.length
}

/**
 * Close all active modals
 */
export function closeAllModals(): void {
  // Close in reverse order (top-most first)
  while (activeModals.length > 0) {
    const state = activeModals[activeModals.length - 1]
    closeModal(state, 0, true)
  }
}

/**
 * CSS styles for web-based modals
 */
export const MODAL_STYLES = `
.stx-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: stx-modal-fade-in 0.15s ease-out;
}

@keyframes stx-modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.stx-modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: stx-modal-slide-up 0.2s ease-out;
}

@keyframes stx-modal-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (prefers-color-scheme: dark) {
  .stx-modal {
    background: #2d2d2d;
    color: #fff;
  }
}

.stx-modal-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.stx-modal.info .stx-modal-icon { color: #3498db; }
.stx-modal.warning .stx-modal-icon { color: #f39c12; }
.stx-modal.error .stx-modal-icon { color: #e74c3c; }
.stx-modal.success .stx-modal-icon { color: #27ae60; }
.stx-modal.question .stx-modal-icon { color: #9b59b6; }

.stx-modal-content {
  text-align: center;
  margin-bottom: 24px;
}

.stx-modal-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.stx-modal-message {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  .stx-modal-message { color: #aaa; }
}

.stx-modal-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.stx-modal-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, transform 0.1s;
}

.stx-modal-btn:hover {
  transform: translateY(-1px);
}

.stx-modal-btn:active {
  transform: translateY(0);
}

.stx-modal-btn.default {
  background: #e0e0e0;
  color: #333;
}

.stx-modal-btn.default:hover {
  background: #d0d0d0;
}

.stx-modal-btn.primary {
  background: #3498db;
  color: #fff;
}

.stx-modal-btn.primary:hover {
  background: #2980b9;
}

.stx-modal-btn.destructive {
  background: #e74c3c;
  color: #fff;
}

.stx-modal-btn.destructive:hover {
  background: #c0392b;
}

@media (prefers-color-scheme: dark) {
  .stx-modal-btn.default {
    background: #444;
    color: #fff;
  }
  .stx-modal-btn.default:hover {
    background: #555;
  }
}
`
