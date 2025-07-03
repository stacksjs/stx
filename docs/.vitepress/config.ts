import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'STX',
  description: 'A modern UI engine powered by Bun',
  
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      // Replace STX code blocks with HTML for proper highlighting
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args
        const token = tokens[idx]
        if (token.info === 'stx') {
          token.info = 'html'
        }
        return fence(...args)
      }
    }
  },
  
  themeConfig: {
    siteTitle: 'STX',
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/intro', activeMatch: '/guide/' },
      { text: 'API', link: '/api/reference', activeMatch: '/api/' },
      { text: 'Examples', link: '/guide/examples', activeMatch: '/examples' },
      { text: 'Community', link: '/community/', activeMatch: '/community/' },
      {
        text: 'v2.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/community/contributing' },
          { text: 'GitHub', link: 'https://github.com/stacksjs/stx' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '🚀 Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/intro' },
            { text: 'Installation', link: '/guide/install' },
            { text: 'Quick Start', link: '/guide/usage' },
          ]
        },
        {
          text: '📚 Core Concepts',
          collapsed: false,
          items: [
            { text: 'Components', link: '/guide/components' },
            { text: 'Directives', link: '/guide/directives' },
            { text: 'TypeScript', link: '/guide/typescript' },
            { text: 'State Management', link: '/guide/state' },
          ]
        },
        {
          text: '⚡ Advanced Features',
          collapsed: false,
          items: [
            { text: 'Performance', link: '/guide/performance' },
            { text: 'Deployment', link: '/guide/deployment' },
            { text: 'Configuration', link: '/guide/config' },
            { text: 'Security', link: '/guide/security' },
            { text: 'Monitoring', link: '/guide/monitoring' },
            { text: 'Build Process', link: '/guide/build' },
          ]
        },
        {
          text: '📖 Examples & Guides',
          collapsed: false,
          items: [
            { text: 'Best Practices', link: '/guide/best-practices' },
            { text: 'Migration Guide', link: '/guide/migration' },
            { text: 'Templates', link: '/guide/templates' },
            { text: 'Testing', link: '/guide/testing' },
          ]
        }
      ],
      '/api/': [
        {
          text: '📖 API Reference',
          items: [
            { text: 'Overview', link: '/api/reference' },
            { text: 'Template Syntax', link: '/api/template-syntax' },
            { text: 'Component API', link: '/api/component' },
            { text: 'State Management', link: '/api/state' },
            { text: 'Styling API', link: '/api/styling' },
            { text: 'TypeScript Integration', link: '/api/typescript' },
            { text: 'Utilities', link: '/api/utilities' },
            { text: 'Configuration', link: '/api/config' },
            { text: 'CLI Commands', link: '/api/cli' },
            { text: 'Core API', link: '/api/core' },
            { text: 'Plugins', link: '/api/plugins' },
            { text: 'Router', link: '/api/router' },
            { text: 'Helpers', link: '/api/helpers' },
            { text: 'Testing', link: '/api/testing' },
          ]
        }
      ],
      '/community/': [
        {
          text: '👥 Community',
          items: [
            { text: 'Overview', link: '/community/' },
            { text: 'Team', link: '/community/team' },
            { text: 'Code of Conduct', link: '/community/code-of-conduct' },
            { text: 'Contributing', link: '/community/contributing' },
            { text: 'Communication', link: '/community/communication' },
            { text: 'Events', link: '/community/events' },
            { text: 'Recognition', link: '/community/recognition' },
          ]
        },
        {
          text: '🔧 Resources',
          items: [
            { text: 'Learning Resources', link: '/community/learning' },
            { text: 'Support', link: '/community/support' },
            { text: 'Branding', link: '/community/branding' },
            { text: 'Sponsorship', link: '/community/sponsorship' },
            { text: 'Partners', link: '/community/partners' },
            { text: 'Sponsors', link: '/community/sponsors' },
            { text: 'Postcardware', link: '/community/postcardware' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/stacksjs/stx' },
      { icon: 'discord', link: 'https://discord.gg/stacksjs' },
      { icon: 'twitter', link: 'https://twitter.com/stacksjs' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 STX Contributors'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    }
  }
}) 