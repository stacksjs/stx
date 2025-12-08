import type { AlertOptions, ToastOptions } from './types'

/**
 * Alert / Toast Notification Implementation
 *
 * Provides cross-platform notification functionality.
 * Uses native notifications when available, falls back to web-based toasts.
 *
 * Features:
 * - Multiple notification types (info, success, warning, error)
 * - Configurable position and duration
 * - Auto-dismiss with optional manual close
 * - Queue management for multiple notifications
 * - Click handlers
 */

// =============================================================================
// Types
// =============================================================================

interface AlertState {
  id: string
  options: AlertOptions
  element?: HTMLElement
  timeout?: ReturnType<typeof setTimeout>
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Check if native notifications are available
 */
function hasNativeNotificationSupport(): boolean {
  // Check for browser Notification API
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return true
  }
  // Future: Check for @stacksjs/zyte bindings for desktop notifications
  return false
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Request notification permission (browser)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// =============================================================================
// Alert Manager
// =============================================================================

// Active alerts
const activeAlerts = new Map<string, AlertState>()

// Toast container element
const _toastContainer: HTMLElement | null = null

/**
 * Generate a unique alert ID
 */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get icon for alert type
 */
function getAlertIcon(type: AlertOptions['type']): string {
  switch (type) {
    case 'info':
      return '&#x2139;'
    case 'success':
      return '&#x2714;'
    case 'warning':
      return '&#x26A0;'
    case 'error':
      return '&#x2716;'
    default:
      return '&#x2139;'
  }
}

/**
 * Get or create the toast container element
 */
function getToastContainer(position: AlertOptions['position'] = 'top-right'): HTMLElement {
  if (!isBrowser()) {
    throw new Error('Toast container requires browser environment')
  }

  // Check if container already exists with correct position
  const existingContainer = document.querySelector(`.stx-toast-container[data-position="${position}"]`)
  if (existingContainer) {
    return existingContainer as HTMLElement
  }

  // Create new container
  const container = document.createElement('div')
  container.className = `stx-toast-container ${position}`
  container.dataset.position = position
  document.body.appendChild(container)

  return container
}

/**
 * Create toast HTML
 */
function createToastHTML(state: AlertState): string {
  const { options } = state
  const icon = getAlertIcon(options.type)
  const typeClass = options.type || 'info'
  const hasClose = options.duration !== 0

  return `
    <div class="stx-toast ${typeClass}" data-alert-id="${state.id}" role="alert" aria-live="polite">
      <div class="stx-toast-icon">${icon}</div>
      <div class="stx-toast-content">
        ${options.title ? `<div class="stx-toast-title">${escapeHtml(options.title)}</div>` : ''}
        <div class="stx-toast-message">${escapeHtml(options.message)}</div>
      </div>
      ${hasClose ? '<button class="stx-toast-close" aria-label="Close">&times;</button>' : ''}
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
 * Dismiss an alert
 */
function dismissAlert(state: AlertState): void {
  // Clear timeout if exists
  if (state.timeout) {
    clearTimeout(state.timeout)
  }

  // Remove from active alerts
  activeAlerts.delete(state.id)

  // Animate out and remove element
  if (state.element && isBrowser()) {
    state.element.classList.add('dismissing')
    setTimeout(() => {
      state.element?.remove()
    }, 200)
  }
}

/**
 * Show an alert/notification
 *
 * @param options - Alert configuration options
 *
 * @example
 * ```typescript
 * await showAlert({
 *   title: 'Success',
 *   message: 'Your changes have been saved',
 *   type: 'success',
 *   duration: 3000,
 *   position: 'top-right',
 * })
 * ```
 */
export async function showAlert(options: AlertOptions): Promise<void> {
  const id = generateAlertId()
  const hasNative = hasNativeNotificationSupport()
  const duration = options.duration ?? 5000

  const state: AlertState = {
    id,
    options,
  }

  activeAlerts.set(id, state)

  if (hasNative && options.type !== 'error') {
    // Use native Notification API for non-error alerts
    try {
      const notification = new Notification(options.title || 'Notification', {
        body: options.message,
        icon: options.type === 'success' ? '✓' : options.type === 'warning' ? '⚠' : 'ℹ',
        tag: id,
      })

      notification.onclick = () => {
        if (options.onClick) {
          options.onClick()
        }
        notification.close()
      }

      if (duration > 0) {
        state.timeout = setTimeout(() => {
          notification.close()
          activeAlerts.delete(id)
        }, duration)
      }

      return
    }
    catch {
      // Fall through to web-based implementation
    }
  }

  if (isBrowser()) {
    // Web-based toast implementation
    const container = getToastContainer(options.position)
    const wrapper = document.createElement('div')
    wrapper.innerHTML = createToastHTML(state)
    const toast = wrapper.firstElementChild as HTMLElement
    state.element = toast

    // Add to container
    container.appendChild(toast)

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('visible')
    })

    // Handle click
    toast.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('stx-toast-close')) {
        dismissAlert(state)
        return
      }

      if (options.onClick) {
        options.onClick()
      }
    })

    // Auto-dismiss
    if (duration > 0) {
      state.timeout = setTimeout(() => {
        dismissAlert(state)
      }, duration)
    }
  }
  else {
    // Node.js environment - console fallback
    const typeLabel = (options.type || 'info').toUpperCase()
    console.log(`[stx-alert] ${typeLabel}: ${options.title || ''}`)
    console.log(`[stx-alert] ${options.message}`)

    // Auto-dismiss from tracking
    if (duration > 0) {
      state.timeout = setTimeout(() => {
        activeAlerts.delete(id)
      }, duration)
    }
  }
}

/**
 * Show a toast notification (alias for showAlert with toast-friendly defaults)
 */
export async function showToast(options: ToastOptions): Promise<void> {
  return showAlert({
    ...options,
    position: options.position || 'top-right',
  })
}

/**
 * Show an info toast
 */
export async function showInfoToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'info', duration })
}

/**
 * Show a success toast
 */
export async function showSuccessToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'success', duration })
}

/**
 * Show a warning toast
 */
export async function showWarningToast(message: string, duration = 3000): Promise<void> {
  return showToast({ message, type: 'warning', duration })
}

/**
 * Show an error toast
 */
export async function showErrorToast(message: string, duration = 5000): Promise<void> {
  return showToast({ message, type: 'error', duration })
}

/**
 * Show a notification with title
 */
export async function notify(title: string, message: string, type: AlertOptions['type'] = 'info'): Promise<void> {
  return showAlert({ title, message, type })
}

/**
 * Dismiss a specific alert by ID
 */
export function dismissAlertById(id: string): void {
  const state = activeAlerts.get(id)
  if (state) {
    dismissAlert(state)
  }
}

/**
 * Dismiss all active alerts
 */
export function dismissAllAlerts(): void {
  for (const state of activeAlerts.values()) {
    dismissAlert(state)
  }
}

/**
 * Get count of active alerts
 */
export function getActiveAlertCount(): number {
  return activeAlerts.size
}

/**
 * CSS styles for web-based toasts
 */
export const TOAST_STYLES = `
.stx-toast-container {
  position: fixed;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
  pointer-events: none;
}

.stx-toast-container.top-left { top: 16px; left: 16px; }
.stx-toast-container.top-center { top: 16px; left: 50%; transform: translateX(-50%); }
.stx-toast-container.top-right { top: 16px; right: 16px; }
.stx-toast-container.bottom-left { bottom: 16px; left: 16px; }
.stx-toast-container.bottom-center { bottom: 16px; left: 50%; transform: translateX(-50%); }
.stx-toast-container.bottom-right { bottom: 16px; right: 16px; }

.stx-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.2s, transform 0.2s;
}

.stx-toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.stx-toast.dismissing {
  opacity: 0;
  transform: translateX(100%);
}

@media (prefers-color-scheme: dark) {
  .stx-toast {
    background: #2d2d2d;
    color: #fff;
  }
}

.stx-toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.stx-toast.info .stx-toast-icon { color: #3498db; }
.stx-toast.success .stx-toast-icon { color: #27ae60; }
.stx-toast.warning .stx-toast-icon { color: #f39c12; }
.stx-toast.error .stx-toast-icon { color: #e74c3c; }

.stx-toast-content {
  flex: 1;
  min-width: 0;
}

.stx-toast-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.stx-toast-message {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

@media (prefers-color-scheme: dark) {
  .stx-toast-message { color: #aaa; }
}

.stx-toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
  padding: 0;
  line-height: 1;
  color: inherit;
  transition: opacity 0.15s;
}

.stx-toast-close:hover {
  opacity: 1;
}

/* Border accent for different types */
.stx-toast.info { border-left: 4px solid #3498db; }
.stx-toast.success { border-left: 4px solid #27ae60; }
.stx-toast.warning { border-left: 4px solid #f39c12; }
.stx-toast.error { border-left: 4px solid #e74c3c; }
`
