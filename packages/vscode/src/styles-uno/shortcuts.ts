import type { UserShortcuts } from '@unocss/core'

export const shortcuts: UserShortcuts = {
  // Layout shortcuts
  'stx-container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  'stx-row': 'flex flex-row',
  'stx-col': 'flex flex-col',
  'stx-center': 'flex items-center justify-center',

  // Component shortcuts
  'stx-card': 'bg-white rounded-lg shadow-md p-4',
  'stx-button': 'px-4 py-2 rounded-md font-medium',
  'stx-input': 'px-3 py-2 border rounded-md',
  'stx-label': 'block text-sm font-medium text-gray-700',

  // Typography shortcuts
  'stx-heading': 'font-bold text-gray-900',
  'stx-text': 'text-gray-600',
  'stx-link': 'text-blue-600 hover:text-blue-700',

  // Utility shortcuts
  'stx-shadow': 'shadow-lg hover:shadow-xl transition-shadow',
  'stx-transition': 'transition-all duration-200',
  'stx-hover': 'hover:opacity-80',
}
