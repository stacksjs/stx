import { defineConfig } from '@unocss/core'
import { rules } from './rules'
import { shortcuts } from './shortcuts'

export default defineConfig({
  rules,
  shortcuts,
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
}) 