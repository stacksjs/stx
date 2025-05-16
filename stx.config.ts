import type { StxOptions } from '@stacksjs/stx'
import process from 'node:process'

const config: StxOptions = {
  // Customize SEO options
  skipDefaultSeoTags: false, // Set to true to disable auto-injection of SEO tags
  defaultTitle: 'STX Project',
  defaultDescription: 'A website built with STX templating engine',

  // Animation options
  animation: {
    enabled: true, // Keep animations enabled globally
    respectMotionPreferences: true,
  },

  // Component and partial directories
  componentsDir: './components',
  partialsDir: './partials',

  // Other options
  debug: process.env.NODE_ENV !== 'production',
  cache: process.env.NODE_ENV === 'production',
}

export default config
