import { defineConfig } from 'ts-craft'

export default defineConfig({
  // Application metadata
  name: 'Voide',
  version: '1.0.0',
  description: 'Voice AI Code Assistant - Talk to Claude to code',
  author: 'Stacks.js',
  bundleId: 'com.stacksjs.voide',

  // Entry point
  entry: '../voide.stx',

  // Window configuration
  window: {
    title: 'Voide - Voice AI Assistant',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    fullscreenable: true,
    darkMode: true,
  },

  // Build output
  build: {
    outDir: './dist',
    // Target platforms
    targets: ['macos', 'windows', 'linux'],
  },

  // macOS specific
  macos: {
    category: 'public.app-category.developer-tools',
    entitlements: {
      'com.apple.security.network.client': true,
      'com.apple.security.device.audio-input': true, // For voice input
    },
  },

  // Desktop features
  features: {
    systemTray: true,
    hotReload: process.env.NODE_ENV === 'development',
    devTools: process.env.NODE_ENV === 'development',
  },

  // Server configuration (for the buddy-service)
  server: {
    port: 3456,
  },
})
