import type { StxOptions } from '../../stx/src/types'

const config: StxOptions = {
  enabled: true,
  partialsDir: 'src/partials',
  componentsDir: 'src/components',
  debug: true,
  cache: false, // Disable caching during development
  cachePath: '.stx/cache',
  cacheVersion: '1.0.0',
  i18n: {
    locale: 'en',
    defaultLocale: 'en',
    translationsDir: 'translations',
  },
  middleware: [
    {
      name: 'devtoolsPath',
      handler: (template, context, filePath) => {
        // Add the current file path to the context
        context.filePath = filePath
        return template
      },
      timing: 'before',
      description: 'Adds the current file path to the template context',
    },
  ],
}

export default config
