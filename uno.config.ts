import type { UserConfig as UnoConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'

const config: UnoConfig = {
  presets: [
    presetUno(),
  ],

  content: {
    pipeline: {
      include: [/\.(stx|vue|[jt]sx|mdx?|elm|html)($|\?)/],
      // exclude files
      // exclude: []
    },
  },

  theme: {
    extend: {
      colors: {
        primary: '#1F1FE9',
        secondary: '#B80C09',
        success: '#CAFE48',
        dark: '#1A181B',
        light: '#F5F3F5',
      },
    },
  },
}

export default config
