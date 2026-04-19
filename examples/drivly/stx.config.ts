export default {
  app: {
    head: {
      title: 'Drivly — Rent the perfect car, from real people',
      meta: [
        { name: 'description', content: 'Skip the rental counter. Book unique cars from trusted hosts across 10,000+ cities. From Teslas to 4x4s to vintage convertibles — all on Drivly.' },
        { name: 'theme-color', content: '#FF3E54' },
      ],
    },
  },
  pagesDir: 'pages',
  componentsDir: 'components',
  layoutsDir: 'layouts',
  partialsDir: 'partials',
  storesDir: 'stores',
  publicDir: 'public',
  // Every page calls useSeoMeta() explicitly, so we don't want the auto-SEO
  // fallback injecting generic "stx Project" tags on top of ours.
  skipDefaultSeoTags: true,
  debug: false,
  cache: false,
}
