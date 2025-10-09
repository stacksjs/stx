import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'stx',
  description: 'A modern UI engine powered by Bun',

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      // Use custom stx syntax highlighting
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args
        const token = tokens[idx]
        if (token.info === 'stx') {
          // Use HTML highlighting for stx
          token.info = 'html'
          const rawResult = fence(...args)
          return rawResult.replace(
            'language-html',
            'language-stx'
          )
        }
        return fence(...args)
      }
    }
  },

  themeConfig: {
    siteTitle: 'stx',
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/intro', activeMatch: '/guide/' },
      { text: 'API', link: '/api/reference', activeMatch: '/api/' },
      { text: 'Iconify', link: '/iconify', activeMatch: '/iconify|/collections/' },
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
            { text: 'Programmatic Usage', link: '/guide/programmatic-usage' },
          ]
        },
        {
          text: '🛠️ Tools',
          collapsed: false,
          items: [
            { text: 'VSCode Extension', link: '/guide/tools/vscode' },
          ]
        }
      ],
      '/api/': [
        {
          text: '📖 API Reference',
          items: [
            { text: 'Overview', link: '/api/reference' },
            { text: 'API Index', link: '/api/index' },
          ]
        },
        {
          text: '🎯 Core APIs',
          collapsed: false,
          items: [
            { text: 'Template Syntax', link: '/api/template-syntax' },
            { text: 'Component API', link: '/api/component' },
            { text: 'Components', link: '/api/components' },
            { text: 'State Management', link: '/api/state' },
            { text: 'Styling API', link: '/api/styling' },
            { text: 'TypeScript Integration', link: '/api/typescript' },
            { text: 'Utilities', link: '/api/utilities' },
            { text: 'Helpers', link: '/api/helpers' },
          ]
        },
        {
          text: '📦 Package APIs',
          collapsed: false,
          items: [
            { text: 'Markdown', link: '/api/markdown' },
            { text: 'Caching', link: '/api/caching' },
            { text: 'Error Handling', link: '/api/error-handling' },
            { text: 'i18n', link: '/api/i18n' },
          ]
        },
        {
          text: '🔧 Development',
          collapsed: false,
          items: [
            { text: 'Configuration', link: '/api/config' },
            { text: 'CLI Commands', link: '/api/cli' },
            { text: 'Testing', link: '/api/testing' },
            { text: 'Core API', link: '/api/core' },
            { text: 'Plugins', link: '/api/plugins' },
            { text: 'Router', link: '/api/router' },
          ]
        }
      ],
      '/features/': [
        {
          text: '⚡ Features',
          items: [
            { text: 'Performance', link: '/features/performance' },
            { text: 'Benchmarks', link: '/features/benchmarks' },
            { text: 'Components', link: '/features/components' },
            { text: 'Directives', link: '/features/directives' },
            { text: 'Templates', link: '/features/templates' },
            { text: 'State Management', link: '/features/state' },
            { text: 'TypeScript', link: '/features/typescript' },
            { text: 'Security', link: '/features/security' },
            { text: 'Testing', link: '/features/testing' },
            { text: 'Monitoring', link: '/features/monitoring' },
            { text: 'Deployment', link: '/features/deployment' },
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
      ],
      '/collections/': [
        {
          text: '🎨 Icon Collections',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/iconify' },
          ]
        },
        {
          text: '📦 Available Collections',
          collapsed: true,
          items: [
            { text: 'Academicons', link: '/collections/iconify-academicons' },
            { text: 'Akar Icons', link: '/collections/iconify-akar-icons' },
            { text: 'Ant Design Icons', link: '/collections/iconify-ant-design' },
            { text: 'Arcticons', link: '/collections/iconify-arcticons' },
            { text: 'Basil', link: '/collections/iconify-basil' },
            { text: 'Bitcoin Icons', link: '/collections/iconify-bitcoin-icons' },
            { text: 'Bootstrap Icons', link: '/collections/iconify-bi' },
            { text: 'BoxIcons', link: '/collections/iconify-bx' },
            { text: 'BoxIcons Logo', link: '/collections/iconify-bxl' },
            { text: 'BoxIcons Solid', link: '/collections/iconify-bxs' },
            { text: 'BPMN', link: '/collections/iconify-bpmn' },
            { text: 'Brandico', link: '/collections/iconify-brandico' },
            { text: 'Bytesize Icons', link: '/collections/iconify-bytesize' },
            { text: 'Carbon', link: '/collections/iconify-carbon' },
            { text: 'Catppuccin Icons', link: '/collections/iconify-catppuccin' },
            { text: 'Charm Icons', link: '/collections/iconify-charm' },
            { text: 'Circle Flags', link: '/collections/iconify-circle-flags' },
            { text: 'Circum Icons', link: '/collections/iconify-circum' },
            { text: 'Clarity', link: '/collections/iconify-clarity' },
            { text: 'CodeX Icons', link: '/collections/iconify-codex' },
            { text: 'Codicons', link: '/collections/iconify-codicon' },
            { text: 'coolicons', link: '/collections/iconify-ci' },
            { text: 'CoreUI Brands', link: '/collections/iconify-cib' },
            { text: 'CoreUI Flags', link: '/collections/iconify-cif' },
            { text: 'CoreUI Free', link: '/collections/iconify-cil' },
            { text: 'Covid Icons', link: '/collections/iconify-covid' },
            { text: 'Cryptocurrency Color Icons', link: '/collections/iconify-cryptocurrency-color' },
            { text: 'Cryptocurrency Icons', link: '/collections/iconify-cryptocurrency' },
            { text: 'css.gg', link: '/collections/iconify-gg' },
            { text: 'Cuida Icons', link: '/collections/iconify-cuida' },
            { text: 'Custom Brand Icons', link: '/collections/iconify-cbi' },
            { text: 'Cyber color icons', link: '/collections/iconify-streamline-cyber-color' },
            { text: 'Cyber free icons', link: '/collections/iconify-streamline-cyber' },
            { text: 'Dashicons', link: '/collections/iconify-dashicons' },
            { text: 'Devicon', link: '/collections/iconify-devicon' },
            { text: 'Devicon Plain', link: '/collections/iconify-devicon-plain' },
            { text: 'Dinkie Icons', link: '/collections/iconify-dinkie-icons' },
            { text: 'Duoicons', link: '/collections/iconify-duo-icons' },
            { text: 'Elegant', link: '/collections/iconify-et' },
            { text: 'Element Plus', link: '/collections/iconify-ep' },
            { text: 'Elusive Icons', link: '/collections/iconify-el' },
            { text: 'Emoji One (Colored)', link: '/collections/iconify-emojione' },
            { text: 'Emoji One (Monotone)', link: '/collections/iconify-emojione-monotone' },
            { text: 'Emoji One (v1)', link: '/collections/iconify-emojione-v1' },
            { text: 'Entypo+', link: '/collections/iconify-entypo' },
            { text: 'Entypo+ Social', link: '/collections/iconify-entypo-social' },
            { text: 'EOS Icons', link: '/collections/iconify-eos-icons' },
            { text: 'Eva Icons', link: '/collections/iconify-eva' },
            { text: 'Evil Icons', link: '/collections/iconify-ei' },
            { text: 'Famicons', link: '/collections/iconify-famicons' },
            { text: 'Feather Icon', link: '/collections/iconify-fe' },
            { text: 'Feather Icons', link: '/collections/iconify-feather' },
            { text: 'File Icons', link: '/collections/iconify-file-icons' },
            { text: 'Firefox OS Emoji', link: '/collections/iconify-fxemoji' },
            { text: 'Flag Icons', link: '/collections/iconify-flag' },
            { text: 'Flagpack', link: '/collections/iconify-flagpack' },
            { text: 'Flat Color Icons', link: '/collections/iconify-flat-color-icons' },
            { text: 'Flat UI Icons', link: '/collections/iconify-flat-ui' },
            { text: 'Flex color icons', link: '/collections/iconify-streamline-flex-color' },
            { text: 'Flex free icons', link: '/collections/iconify-streamline-flex' },
            { text: 'Flowbite Icons', link: '/collections/iconify-flowbite' },
            { text: 'Fluent Emoji', link: '/collections/iconify-fluent-emoji' },
            { text: 'Fluent Emoji Flat', link: '/collections/iconify-fluent-emoji-flat' },
            { text: 'Fluent Emoji High Contrast', link: '/collections/iconify-fluent-emoji-high-contrast' },
            { text: 'Fluent UI MDL2', link: '/collections/iconify-fluent-mdl2' },
            { text: 'Fluent UI System Color Icons', link: '/collections/iconify-fluent-color' },
            { text: 'Fluent UI System Icons', link: '/collections/iconify-fluent' },
            { text: 'Font Awesome 4', link: '/collections/iconify-fa' },
            { text: 'Font Awesome 5 Brands', link: '/collections/iconify-fa-brands' },
            { text: 'Font Awesome 5 Regular', link: '/collections/iconify-fa-regular' },
            { text: 'Font Awesome 5 Solid', link: '/collections/iconify-fa-solid' },
            { text: 'Font Awesome 6 Brands', link: '/collections/iconify-fa6-brands' },
            { text: 'Font Awesome 6 Regular', link: '/collections/iconify-fa6-regular' },
            { text: 'Font Awesome 6 Solid', link: '/collections/iconify-fa6-solid' },
            { text: 'Font Awesome Brands', link: '/collections/iconify-fa7-brands' },
            { text: 'Font Awesome Regular', link: '/collections/iconify-fa7-regular' },
            { text: 'Font Awesome Solid', link: '/collections/iconify-fa7-solid' },
            { text: 'Font-GIS', link: '/collections/iconify-gis' },
            { text: 'FontAudio', link: '/collections/iconify-fad' },
            { text: 'Fontelico', link: '/collections/iconify-fontelico' },
            { text: 'Fontisto', link: '/collections/iconify-fontisto' },
            { text: 'FormKit Icons', link: '/collections/iconify-formkit' },
            { text: 'Foundation', link: '/collections/iconify-foundation' },
            { text: 'Framework7 Icons', link: '/collections/iconify-f7' },
            { text: 'Freehand color icons', link: '/collections/iconify-streamline-freehand-color' },
            { text: 'Freehand free icons', link: '/collections/iconify-streamline-freehand' },
            { text: 'Gala Icons', link: '/collections/iconify-gala' },
            { text: 'Game Icons', link: '/collections/iconify-game-icons' },
            { text: 'Garden SVG Icons', link: '/collections/iconify-garden' },
            { text: 'GeoGlyphs', link: '/collections/iconify-geo' },
            { text: 'Gitlab SVGs', link: '/collections/iconify-pajamas' },
            { text: 'Google Material Icons', link: '/collections/iconify-ic' },
            { text: 'Gravity UI Icons', link: '/collections/iconify-gravity-ui' },
            { text: 'Gridicons', link: '/collections/iconify-gridicons' },
            { text: 'Grommet Icons', link: '/collections/iconify-grommet-icons' },
            { text: 'Guidance', link: '/collections/iconify-guidance' },
            { text: 'Health Icons', link: '/collections/iconify-healthicons' },
            { text: 'HeroIcons', link: '/collections/iconify-heroicons' },
            { text: 'HeroIcons v1 Outline', link: '/collections/iconify-heroicons-outline' },
            { text: 'HeroIcons v1 Solid', link: '/collections/iconify-heroicons-solid' },
            { text: 'Huge Icons', link: '/collections/iconify-hugeicons' },
            { text: 'Humbleicons', link: '/collections/iconify-humbleicons' },
            { text: 'Icalicons', link: '/collections/iconify-il' },
            { text: 'IcoMoon Free', link: '/collections/iconify-icomoon-free' },
            { text: 'IconaMoon', link: '/collections/iconify-iconamoon' },
            { text: 'Iconoir', link: '/collections/iconify-iconoir' },
            { text: 'IconPark', link: '/collections/iconify-icon-park' },
            { text: 'IconPark Outline', link: '/collections/iconify-icon-park-outline' },
            { text: 'IconPark Solid', link: '/collections/iconify-icon-park-solid' },
            { text: 'IconPark TwoTone', link: '/collections/iconify-icon-park-twotone' },
            { text: 'Icons8 Windows 10 Icons', link: '/collections/iconify-icons8' },
            { text: 'Icons8 Windows 8 Icons', link: '/collections/iconify-wpf' },
            { text: 'Innowatio Font', link: '/collections/iconify-iwwa' },
            { text: 'IonIcons', link: '/collections/iconify-ion' },
            { text: 'Jam Icons', link: '/collections/iconify-jam' },
            { text: 'Kameleon color icons', link: '/collections/iconify-streamline-kameleon-color' },
            { text: 'Lets Icons', link: '/collections/iconify-lets-icons' },
            { text: 'Ligature Symbols', link: '/collections/iconify-ls' },
            { text: 'Line Awesome', link: '/collections/iconify-la' },
            { text: 'Lineicons', link: '/collections/iconify-lineicons' },
            { text: 'Logos free icons', link: '/collections/iconify-streamline-logos' },
            { text: 'Lsicon', link: '/collections/iconify-lsicon' },
            { text: 'Lucide', link: '/collections/iconify-lucide' },
            { text: 'Lucide Lab', link: '/collections/iconify-lucide-lab' },
            { text: 'Mage Icons', link: '/collections/iconify-mage' },
            { text: 'Majesticons', link: '/collections/iconify-majesticons' },
            { text: 'Maki', link: '/collections/iconify-maki' },
            { text: 'Map Icons', link: '/collections/iconify-map' },
            { text: 'Marketeq', link: '/collections/iconify-marketeq' },
            { text: 'Material Design Iconic Font', link: '/collections/iconify-zmdi' },
            { text: 'Material Design Icons', link: '/collections/iconify-mdi' },
            { text: 'Material Design Light', link: '/collections/iconify-mdi-light' },
            { text: 'Material Icon Theme', link: '/collections/iconify-material-icon-theme' },
            { text: 'Material Line Icons', link: '/collections/iconify-line-md' },
            { text: 'Material Symbols', link: '/collections/iconify-material-symbols' },
            { text: 'Material Symbols Light', link: '/collections/iconify-material-symbols-light' },
            { text: 'Medical Icons', link: '/collections/iconify-medical-icon' },
            { text: 'Memory Icons', link: '/collections/iconify-memory' },
            { text: 'Meteocons', link: '/collections/iconify-meteocons' },
            { text: 'Meteor Icons', link: '/collections/iconify-meteor-icons' },
            { text: 'MingCute Icon', link: '/collections/iconify-mingcute' },
            { text: 'Mono Icons', link: '/collections/iconify-mono-icons' },
            { text: 'Mono Icons', link: '/collections/iconify-mi' },
            { text: 'Myna UI Icons', link: '/collections/iconify-mynaui' },
            { text: 'Nimbus', link: '/collections/iconify-nimbus' },
            { text: 'Nonicons', link: '/collections/iconify-nonicons' },
            { text: 'Noto Emoji', link: '/collections/iconify-noto' },
            { text: 'Noto Emoji (v1)', link: '/collections/iconify-noto-v1' },
            { text: 'NRK Core Icons', link: '/collections/iconify-nrk' },
            { text: 'Octicons', link: '/collections/iconify-octicon' },
            { text: 'OOUI', link: '/collections/iconify-ooui' },
            { text: 'Open Iconic', link: '/collections/iconify-oi' },
            { text: 'OpenMoji', link: '/collections/iconify-openmoji' },
            { text: 'OpenSearch UI', link: '/collections/iconify-oui' },
            { text: 'Pepicons', link: '/collections/iconify-pepicons' },
            { text: 'Pepicons Pencil', link: '/collections/iconify-pepicons-pencil' },
            { text: 'Pepicons Pop!', link: '/collections/iconify-pepicons-pop' },
            { text: 'Pepicons Print', link: '/collections/iconify-pepicons-print' },
            { text: 'Phosphor', link: '/collections/iconify-ph' },
            { text: 'Pico-icon', link: '/collections/iconify-picon' },
            { text: 'Pixel free icons', link: '/collections/iconify-streamline-pixel' },
            { text: 'Pixel Icon', link: '/collections/iconify-pixel' },
            { text: 'Pixelarticons', link: '/collections/iconify-pixelarticons' },
            { text: 'Plump color icons', link: '/collections/iconify-streamline-plump-color' },
            { text: 'Plump free icons', link: '/collections/iconify-streamline-plump' },
            { text: 'PrestaShop Icons', link: '/collections/iconify-ps' },
            { text: 'Prime Icons', link: '/collections/iconify-prime' },
            { text: 'ProIcons', link: '/collections/iconify-proicons' },
            { text: 'Qlementine Icons', link: '/collections/iconify-qlementine-icons' },
            { text: 'Quill Icons', link: '/collections/iconify-quill' },
            { text: 'Radix Icons', link: '/collections/iconify-radix-icons' },
            { text: 'Raphael', link: '/collections/iconify-raphael' },
            { text: 'Remix Icon', link: '/collections/iconify-ri' },
            { text: 'Rivet Icons', link: '/collections/iconify-rivet-icons' },
            { text: 'Sargam Icons', link: '/collections/iconify-si' },
            { text: 'Sharp color icons', link: '/collections/iconify-streamline-sharp-color' },
            { text: 'Sharp free icons', link: '/collections/iconify-streamline-sharp' },
            { text: 'SidekickIcons', link: '/collections/iconify-sidekickicons' },
            { text: 'Siemens Industrial Experience Icons', link: '/collections/iconify-ix' },
            { text: 'Simple Icons', link: '/collections/iconify-simple-icons' },
            { text: 'Simple line icons', link: '/collections/iconify-simple-line-icons' },
            { text: 'Skill Icons', link: '/collections/iconify-skill-icons' },
            { text: 'SmartIcons Glyph', link: '/collections/iconify-si-glyph' },
            { text: 'Solar', link: '/collections/iconify-solar' },
            { text: 'Stash Icons', link: '/collections/iconify-stash' },
            { text: 'Stickies color icons', link: '/collections/iconify-streamline-stickies-color' },
            { text: 'Streamline', link: '/collections/iconify-streamline' },
            { text: 'Streamline Block', link: '/collections/iconify-streamline-block' },
            { text: 'Streamline color', link: '/collections/iconify-streamline-color' },
            { text: 'Streamline Emojis', link: '/collections/iconify-streamline-emojis' },
            { text: 'Subway Icon Set', link: '/collections/iconify-subway' },
            { text: 'SVG Logos', link: '/collections/iconify-logos' },
            { text: 'SVG Spinners', link: '/collections/iconify-svg-spinners' },
            { text: 'System UIcons', link: '/collections/iconify-system-uicons' },
            { text: 'Tabler Icons', link: '/collections/iconify-tabler' },
            { text: 'TDesign Icons', link: '/collections/iconify-tdesign' },
            { text: 'Teenyicons', link: '/collections/iconify-teenyicons' },
            { text: 'TopCoat Icons', link: '/collections/iconify-topcoat' },
            { text: 'Twitter Emoji', link: '/collections/iconify-twemoji' },
            { text: 'Typicons', link: '/collections/iconify-typcn' },
            { text: 'uiw icons', link: '/collections/iconify-uiw' },
            { text: 'Ultimate color icons', link: '/collections/iconify-streamline-ultimate-color' },
            { text: 'Ultimate free icons', link: '/collections/iconify-streamline-ultimate' },
            { text: 'Unicons', link: '/collections/iconify-uil' },
            { text: 'Unicons Monochrome', link: '/collections/iconify-uim' },
            { text: 'Unicons Solid', link: '/collections/iconify-uis' },
            { text: 'Unicons Thin Line', link: '/collections/iconify-uit' },
            { text: 'UnJS Logos', link: '/collections/iconify-unjs' },
            { text: 'Vaadin Icons', link: '/collections/iconify-vaadin' },
            { text: 'Vesper Icons', link: '/collections/iconify-vs' },
            { text: 'VSCode Icons', link: '/collections/iconify-vscode-icons' },
            { text: 'Weather Icons', link: '/collections/iconify-wi' },
            { text: 'Web Symbols Liga', link: '/collections/iconify-websymbol' },
            { text: 'Web3 Icons', link: '/collections/iconify-token' },
            { text: 'Web3 Icons Branded', link: '/collections/iconify-token-branded' },
            { text: 'WebHostingHub Glyphs', link: '/collections/iconify-whh' },
            { text: 'WeUI Icon', link: '/collections/iconify-weui' },
            { text: 'Zondicons', link: '/collections/iconify-zondicons' }
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
      copyright: 'Copyright © 2025 stx Contributors'
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
