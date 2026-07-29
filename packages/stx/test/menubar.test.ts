import { describe, expect, it } from 'bun:test'
import { applyPreferencePatch, normalizeRouteKey, toResponse } from '../src/menubar'

describe('menu bar routes', () => {
  it('treats a bare path as a GET route', () => {
    expect(normalizeRouteKey('/api/status')).toBe('GET /api/status')
    expect(normalizeRouteKey('post /api/toggle')).toBe('POST /api/toggle')
    expect(normalizeRouteKey('  DELETE   /api/timer  ')).toBe('DELETE /api/timer')
  })

  it('serializes handler return values and leaves a Response untouched', async () => {
    expect(await toResponse({ active: true }).json()).toEqual({ active: true })
    expect(toResponse({ active: true }).headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    expect(await toResponse([1, 2]).json()).toEqual([1, 2])

    // A handler that returns nothing has nothing to send back.
    expect(toResponse(undefined).status).toBe(204)

    // `null` is a value, not an absent one.
    expect(toResponse(null).status).toBe(200)

    const custom = new Response('teapot', { status: 418 })
    expect(toResponse(custom)).toBe(custom)
  })
})

describe('preference patches', () => {
  function store(defaults: Record<string, unknown>) {
    const values = { ...defaults }
    return {
      get: (key: string) => values[key],
      set: (key: string, value: unknown) => { values[key] = value },
      getAll: () => ({ ...values }),
    } as any
  }

  it('applies known keys and returns the updated preferences', () => {
    const prefs = store({ theme: 'dark', fontSize: 14 })
    expect(applyPreferencePatch(prefs, { theme: 'light' })).toEqual({ theme: 'light', fontSize: 14 })
  })

  it('drops unknown keys so a request cannot write arbitrary preferences', () => {
    const prefs = store({ theme: 'dark' })
    expect(applyPreferencePatch(prefs, { theme: 'light', isAdmin: true })).toEqual({ theme: 'light' })
  })
})
