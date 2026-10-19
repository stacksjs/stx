import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import { acceptedPublications, publicationMatchesOriginal } from '../../../scripts/npm-publication'

describe('accepted npm publication recovery', () => {
  const bytes = new TextEncoder().encode('original accepted archive')
  const receipt = {
    name: '@stacksjs/example', version: '1.2.3',
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    shasum: createHash('sha1').update(bytes).digest('hex'),
  }
  const tarball = 'https://registry.npmjs.org/@stacksjs/example/-/example-1.2.3.tgz'
  const metadata = { name: receipt.name, version: receipt.version, dist: { tarball, integrity: receipt.integrity, shasum: receipt.shasum } }

  it('keeps the original checksums for the scoped package actually accepted', () => {
    expect(acceptedPublications([
      'Publishing @stacksjs/example...',
      `Publishing ${receipt.name}@${receipt.version}...`,
      `Shasum: ${receipt.shasum}`,
      `Integrity: ${receipt.integrity}`,
      'Error: Upload accepted; publication is pending public metadata and verified tarball availability. Do not upload this version again.',
    ].join('\n'))).toEqual([receipt])
  })

  it('refuses a pending upload whose original archive identity was not recorded', () => {
    expect(() => acceptedPublications('Publishing @stacksjs/example@1.2.3...\nError: Upload accepted; publication is pending public metadata')).toThrow('no complete original archive receipt')
  })

  it('refuses to resume when metadata is absent even if the tarball is readable', async () => {
    const requests: string[] = []
    expect(await publicationMatchesOriginal(receipt, async (url) => {
      requests.push(url)
      return url === tarball ? new Response(bytes) : new Response('', { status: 404 })
    })).toBe(false)
    expect(requests).toEqual(['https://registry.npmjs.org/%40stacksjs%2Fexample/1.2.3'])
  })

  it('requires metadata for this exact package, version and original checksum', async () => {
    for (const changed of [
      { ...metadata, name: '@stacksjs/another' },
      { ...metadata, version: '1.2.4' },
      { ...metadata, dist: { ...metadata.dist, integrity: 'sha512-different' } },
      { ...metadata, dist: { ...metadata.dist, tarball: 'https://unrelated.invalid/archive.tgz' } },
    ]) {
      expect(await publicationMatchesOriginal(receipt, async () => Response.json(changed))).toBe(false)
    }
  })

  it('rejects different archive bytes despite matching metadata', async () => {
    expect(await publicationMatchesOriginal(receipt, async url => url === tarball
      ? new Response('different archive')
      : Response.json(metadata))).toBe(false)
  })

  it('permits a resume only after read-only metadata and full original-byte verification', async () => {
    const methods: string[] = []
    expect(await publicationMatchesOriginal(receipt, async (url, init) => {
      methods.push(init.method)
      return url === tarball ? new Response(bytes) : Response.json(metadata)
    })).toBe(true)
    expect(methods).toEqual(['GET', 'GET'])
  })
})

