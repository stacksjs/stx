import type { BunPressOptions } from '@stacksjs/bunpress'

export default {
  verbose: false,
  docsDir: './docs',
  outDir: './dist',

  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'Directives', link: '/guide/directives' },
    { text: 'Components', link: '/guide/components' },
    { text: 'Desktop', link: '/guide/desktop' },
    { text: 'API', link: '/api/' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/stx' },
  ],

  markdown: {
    title: 'STX - Modern Templating Engine',
    meta: {
      description: 'A fast, modern templating engine with Vue-like Single File Components, Laravel Blade directives, and Bun-powered performance.',
      author: 'Stacks.js',
    },

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Directives', link: '/guide/directives' },
            { text: 'Components', link: '/guide/components' },
            { text: 'Layouts', link: '/guide/layouts' },
            { text: 'Props & Slots', link: '/guide/props-slots' },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Templating', link: '/features/templating' },
            { text: 'Component System', link: '/features/components' },
            { text: 'Blade Directives', link: '/features/blade-directives' },
            { text: 'Icons', link: '/features/icons' },
          ],
        },
      ],
      '/advanced/': [
        {
          text: 'Advanced',
          items: [
            { text: 'Configuration', link: '/advanced/configuration' },
            { text: 'Server-Side Rendering', link: '/advanced/ssr' },
            { text: 'Desktop Integration', link: '/advanced/desktop' },
            { text: 'Custom Directives', link: '/advanced/custom-directives' },
            { text: 'Performance', link: '/advanced/performance' },
            { text: 'CI/CD Integration', link: '/advanced/ci-cd' },
          ],
        },
      ],
      '/api/': [
        { text: 'API Reference', link: '/api/' },
        { text: 'Configuration', link: '/api/configuration' },
        { text: 'Directives', link: '/api/directives' },
      ],
    },

    toc: {
      enabled: true,
      position: 'sidebar',
      minDepth: 2,
      maxDepth: 4,
    },

    syntaxHighlightTheme: 'github-dark',

    features: {
      containers: true,
      githubAlerts: true,
      codeBlocks: {
        lineNumbers: true,
        lineHighlighting: true,
      },
      emoji: true,
    },
  },

  sitemap: {
    enabled: true,
    baseUrl: 'https://stx.sh',
  },

  robots: {
    enabled: true,
  },
} satisfies BunPressOptions
