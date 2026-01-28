import type { BunPressOptions } from '@stacksjs/bunpress'

export default {
  verbose: false,
  docsDir: './docs',
  outDir: './dist',

  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'Features', link: '/features/components' },
    { text: 'API', link: '/api/' },
    { text: 'Tools', link: '/guide/tools/vscode' },
    { text: 'Community', link: '/community/' },
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
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/install' },
            { text: 'Usage', link: '/guide/usage' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Templates', link: '/guide/templates' },
            { text: 'Directives', link: '/guide/directives' },
            { text: 'Components', link: '/guide/components' },
            { text: 'State Management', link: '/guide/state' },
            { text: 'TypeScript', link: '/guide/typescript' },
          ],
        },
        {
          text: 'Advanced',
          collapsed: false,
          items: [
            { text: 'Server-Side Rendering', link: '/guide/ssr' },
            { text: 'Desktop Apps', link: '/guide/desktop' },
            { text: 'Performance', link: '/guide/performance' },
            { text: 'Security', link: '/guide/security' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Deployment', link: '/guide/deployment' },
          ],
        },
        {
          text: 'Tools',
          collapsed: false,
          items: [
            { text: 'VS Code Extension', link: '/guide/tools/vscode' },
            { text: 'CLI', link: '/api/cli' },
          ],
        },
        {
          text: 'Recipes',
          collapsed: true,
          items: [
            { text: 'Best Practices', link: '/guide/best-practices' },
            { text: 'Migration from Blade', link: '/guide/migration-from-blade' },
            { text: 'Internationalization', link: '/guide/i18n' },
            { text: 'Benchmarks', link: '/guide/benchmarks' },
          ],
        },
      ],

      '/features/': [
        {
          text: 'Features',
          collapsed: false,
          items: [
            { text: 'Components', link: '/features/components' },
            { text: 'Templates', link: '/features/templates' },
            { text: 'State Management', link: '/features/state' },
            { text: 'TypeScript', link: '/features/typescript' },
          ],
        },
        {
          text: 'Production',
          collapsed: false,
          items: [
            { text: 'Security', link: '/features/security' },
            { text: 'Testing', link: '/features/testing' },
            { text: 'Monitoring', link: '/features/monitoring' },
            { text: 'Deployment', link: '/features/deployment' },
          ],
        },
      ],

      '/advanced/': [
        {
          text: 'Advanced Topics',
          collapsed: false,
          items: [
            { text: 'Custom Directives', link: '/advanced/custom-directives' },
            { text: 'Plugins', link: '/advanced/plugins' },
            { text: 'State Management', link: '/advanced/state' },
            { text: 'Build System', link: '/advanced/build' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Template Syntax', link: '/api/template-syntax' },
            { text: 'Configuration', link: '/api/config' },
            { text: 'CLI', link: '/api/cli' },
          ],
        },
        {
          text: 'Core APIs',
          collapsed: false,
          items: [
            { text: 'Components', link: '/api/components' },
            { text: 'Component API', link: '/api/component' },
            { text: 'State', link: '/api/state' },
            { text: 'Styling', link: '/api/styling' },
            { text: 'TypeScript', link: '/api/typescript' },
          ],
        },
        {
          text: 'Utilities',
          collapsed: true,
          items: [
            { text: 'Utilities', link: '/api/utilities' },
            { text: 'Helpers', link: '/api/helpers' },
            { text: 'Core', link: '/api/core' },
            { text: 'Plugins', link: '/api/plugins' },
            { text: 'Testing', link: '/api/testing' },
          ],
        },
      ],

      '/community/': [
        {
          text: 'Community',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/community/' },
            { text: 'Team', link: '/community/team' },
            { text: 'Contributing', link: '/community/contributing' },
            { text: 'Code of Conduct', link: '/community/code-of-conduct' },
          ],
        },
        {
          text: 'Resources',
          collapsed: false,
          items: [
            { text: 'Support', link: '/community/support' },
            { text: 'Learning', link: '/community/learning' },
            { text: 'Communication', link: '/community/communication' },
            { text: 'Events', link: '/community/events' },
          ],
        },
        {
          text: 'Support Us',
          collapsed: true,
          items: [
            { text: 'Sponsorship', link: '/community/sponsorship' },
            { text: 'Sponsors', link: '/community/sponsors' },
            { text: 'Partners', link: '/community/partners' },
            { text: 'Branding', link: '/community/branding' },
          ],
        },
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
