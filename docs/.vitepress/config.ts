import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'STX',
  description: 'A modern UI engine powered by Bun',
  
  themeConfig: {
    siteTitle: 'STX',
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/install', activeMatch: '/guide/' },
      { text: 'API', link: '/api-reference', activeMatch: '/api-' },
      { text: 'Examples', link: '/examples', activeMatch: '/examples' },
      { text: 'Community', link: '/community', activeMatch: '/community' },
      {
        text: 'v2.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' },
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
            { text: 'Introduction', link: '/intro' },
            { text: 'Installation', link: '/install' },
            { text: 'Quick Start', link: '/usage' },
          ]
        },
        {
          text: '📚 Core Concepts',
          collapsed: false,
          items: [
            { text: 'Components', link: '/features/components' },
            { text: 'Directives', link: '/features/directives' },
            { text: 'TypeScript', link: '/features/typescript' },
            { text: 'State Management', link: '/features/state' },
          ]
        },
        {
          text: '⚡ Advanced Features',
          collapsed: false,
          items: [
            { text: 'Performance', link: '/features/performance' },
            { text: 'Deployment', link: '/features/deployment' },
            { text: 'Configuration', link: '/config' },
          ]
        },
        {
          text: '📖 Examples & Guides',
          collapsed: false,
          items: [
            { text: 'Basic Examples', link: '/examples#basic-examples' },
            { text: 'Building a Blog', link: '/examples#building-a-blog' },
            { text: 'Advanced Patterns', link: '/examples#advanced-patterns' },
            { text: 'Best Practices', link: '/best-practices' },
            { text: 'Migration Guide', link: '/migration' },
          ]
        }
      ],
      '/api/': [
        {
          text: '📖 API Reference',
          items: [
            { text: 'Template Syntax', link: '/api-reference#template-syntax' },
            { text: 'Component API', link: '/api-reference#component-api' },
            { text: 'State Management', link: '/api-reference#state-management' },
            { text: 'Styling API', link: '/api-reference#styling-api' },
            { text: 'TypeScript Integration', link: '/api-reference#typescript-integration' },
            { text: 'Utilities', link: '/api-reference#utilities' },
            { text: 'Configuration', link: '/api-reference#configuration' },
            { text: 'CLI Commands', link: '/api-reference#cli-commands' },
          ]
        }
      ],
      '/community/': [
        {
          text: '👥 Community',
          items: [
            { text: 'Code of Conduct', link: '/community#code-of-conduct' },
            { text: 'Contributing', link: '/community#contributing' },
            { text: 'Communication', link: '/community#communication-channels' },
            { text: 'Events & Programs', link: '/community#events-and-programs' },
            { text: 'Recognition', link: '/community#recognition-and-rewards' },
          ]
        },
        {
          text: '🔧 Resources',
          items: [
            { text: 'Learning Resources', link: '/community#learning-resources' },
            { text: 'Support', link: '/community#support' },
            { text: 'Branding', link: '/community#branding-guidelines' },
            { text: 'Sponsorship', link: '/community#sponsorship' },
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