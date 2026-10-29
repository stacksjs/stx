import { expect, test } from 'bun:test'
import { mergeHeadConfigs } from '../../src/head'

test('a tenant replaces site identity while preserving independent resources and icon variants', () => {
  const merged = mergeHeadConfigs({
    meta: [{ name: 'description', content: 'Platform' }, { name: 'viewport', content: 'width=device-width' }],
    link: [{ rel: 'icon', type: 'image/svg+xml', href: '/platform.svg' }, { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/small.png' }, { rel: 'preload', href: '/font-a.woff2' }],
  }, {
    meta: [{ name: 'description', content: 'Tenant' }],
    link: [{ rel: 'icon', type: 'image/svg+xml', href: '/tenant.svg' }, { rel: 'preload', href: '/font-b.woff2' }],
  })
  expect(merged.meta).toEqual([{ name: 'description', content: 'Tenant' }, { name: 'viewport', content: 'width=device-width' }])
  expect(merged.link?.map(link => link.href)).toEqual(['/tenant.svg', '/small.png', '/font-a.woff2', '/font-b.woff2'])
})
