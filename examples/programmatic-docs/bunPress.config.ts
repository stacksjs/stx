/**
 * Example BunPress Configuration
 * This shows how you would configure a documentation system using stx
 */

export default {
  // Site metadata
  title: 'stx Documentation',
  description: 'Fast, modern templating for Bun',

  // Base URL path (useful for deploying to subdirectories)
  base: '/',

  // Directory containing markdown and stx files
  contentDir: './docs',

  // Output directory for built files
  outDir: './dist',

  // Theme configuration
  theme: {
    primaryColor: '#3451b2',
    codeTheme: 'github-dark',
    logo: '/logo.svg',
  },

  // Navigation menu
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/' },
    { text: 'API', link: '/api/' },
    {
      text: 'Examples',
      items: [
        { text: 'Basic', link: '/examples/basic' },
        { text: 'Advanced', link: '/examples/advanced' },
      ],
    },
    { text: 'GitHub', link: 'https://github.com/stacksjs/stx' },
  ],

  // Sidebar configuration
  sidebar: {
    '/guide/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/intro' },
          { text: 'Installation', link: '/guide/install' },
          { text: 'Quick Start', link: '/guide/quickstart' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Templates', link: '/guide/templates' },
          { text: 'Directives', link: '/guide/directives' },
          { text: 'Components', link: '/guide/components' },
        ],
      },
    ],
    '/api/': [
      {
        text: 'API Reference',
        items: [
          { text: 'Components', link: '/api/components' },
          { text: 'Directives', link: '/api/directives' },
          { text: 'Helpers', link: '/api/helpers' },
          { text: 'Configuration', link: '/api/config' },
        ],
      },
    ],
  },

  // Server options
  server: {
    port: 3000,
    watch: true,
  },

  // Markdown processing options
  markdown: {
    syntaxHighlighting: {
      enabled: true,
      serverSide: true,
      defaultTheme: 'github-dark',
      highlightUnknownLanguages: true,
    },
  },

  // stx processing options
  stx: {
    cache: true,
    cachePath: '.stx/cache',
    debug: false,
  },
}
