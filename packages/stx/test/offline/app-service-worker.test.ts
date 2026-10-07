import { describe, expect, it } from 'bun:test'
import { generateOfflineWorker, OFFLINE_REGISTER_SCRIPT } from '../../src/offline/app-service-worker'
import { processDirectives } from '../../src/process'

describe('the offline worker', () => {
  const worker = generateOfflineWorker({ enabled: true, pages: ['/m', '/m/calendar', 'not-a-path'], apiPrefix: '/api/', networkTimeoutMs: 2000 }, 'build123')

  it('is a script a browser can run', () => {
    // eslint-disable-next-line no-new-func
    expect(() => new Function('self', 'caches', 'fetch', worker)).not.toThrow()
  })

  it('carries its build, its screens and its API prefix', () => {
    const settings = JSON.parse(worker.match(/var S = (\{.*\});/)![1]!)
    expect(settings.build).toBe('build123')
    expect(settings.pages).toEqual(['/m', '/m/calendar'])
    expect(settings.api).toBe('/api/')
    expect(settings.timeout).toBe(2000)
    expect(settings.fallback).toBe('/m')
    expect(settings.exclude).toContain('/_stx/hmr')
  })

  it('keeps each build\'s screens apart and API answers per signed-in token', () => {
    expect(worker).toContain('\'stx-shell-\' + S.build')
    expect(worker).toContain('__stx_who')
    expect(worker).toContain('stx:clear-offline-data')
    // Writes are never cached here, nor a range (a video seeking): the cache
    // cannot hold a partial answer.
    expect(worker).toContain('if (request.method !== \'GET\') return;')
    expect(worker).toContain('if (request.headers.has(\'Range\')) return;')
    expect(worker).not.toContain('response.ok')
  })
})

describe('registering it', () => {
  const page = '<!DOCTYPE html><html><head><title>t</title></head><body><main>hi</main></body></html>'

  it('rides on every document when offline is on', async () => {
    const html = await processDirectives(page, {}, 'page.stx', { offline: { enabled: true } } as any, new Set())
    expect(html).toContain(OFFLINE_REGISTER_SCRIPT)
  })

  it('is absent otherwise', async () => {
    const html = await processDirectives(page, {}, 'page.stx', {} as any, new Set())
    expect(html).not.toContain('data-stx-offline')
  })
})
