/**
 * UI Store - Modal state and UI interactions
 */
import { createStore } from '../store'

export interface UIState {
  modals: {
    github: boolean
    settings: boolean
  }
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    duration?: number
  }>
}

export const uiStore = createStore<UIState>({
  modals: {
    github: false,
    settings: false
  },
  notifications: []
}, {
  name: 'ui'
})

// Actions
export const uiActions = {
  openModal: (modal: keyof UIState['modals']) => {
    const state = uiStore.get()
    uiStore.update({
      modals: { ...state.modals, [modal]: true }
    })
  },

  closeModal: (modal: keyof UIState['modals']) => {
    const state = uiStore.get()
    uiStore.update({
      modals: { ...state.modals, [modal]: false }
    })
  },

  closeAllModals: () => {
    uiStore.update({
      modals: {
        github: false,
        settings: false
      }
    })
  },

  toggleModal: (modal: keyof UIState['modals']) => {
    const state = uiStore.get()
    uiStore.update({
      modals: { ...state.modals, [modal]: !state.modals[modal] }
    })
  },

  notify: (
    type: 'info' | 'success' | 'warning' | 'error',
    message: string,
    duration: number = 3000
  ) => {
    const state = uiStore.get()
    const id = `notification-${Date.now()}`

    uiStore.update({
      notifications: [...state.notifications, { id, type, message, duration }]
    })

    if (duration > 0) {
      setTimeout(() => {
        uiActions.dismissNotification(id)
      }, duration)
    }

    return id
  },

  dismissNotification: (id: string) => {
    const state = uiStore.get()
    uiStore.update({
      notifications: state.notifications.filter(n => n.id !== id)
    })
  },

  clearNotifications: () => {
    uiStore.update({ notifications: [] })
  }
}
