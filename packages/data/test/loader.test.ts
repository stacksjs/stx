import { describe, expect, test } from 'bun:test'
import { createActionContext, createLoaderContext, defineAction, defineLoader, defineLoaders, executeAction, executeLoader } from '../src/loader'

describe('defineLoader', () => {
  test('creates a loader definition', () => {
    const loader = defineLoader(async ({ params }) => {
      return { id: params.id, title: 'Test' }
    })
    expect(loader._type).toBe('loader')
    expect(typeof loader.handler).toBe('function')
  })
})

describe('defineLoaders', () => {
  test('creates multiple loader definitions', () => {
    const loaders = defineLoaders({
      posts: async () => [{ id: 1 }],
      user: async () => ({ name: 'Test' }),
    })
    expect(loaders.posts._type).toBe('loader')
    expect(loaders.user._type).toBe('loader')
  })
})

describe('defineAction', () => {
  test('creates an action definition', () => {
    const action = defineAction(async () => {
      return { data: { success: true } }
    })
    expect(action._type).toBe('action')
  })
})

describe('createLoaderContext', () => {
  test('creates context from request', () => {
    const request = new Request('https://example.com/posts/42', {
      headers: { cookie: 'session=abc123' },
    })
    const ctx = createLoaderContext(request, { id: '42' })

    expect(ctx.params.id).toBe('42')
    expect(ctx.url.pathname).toBe('/posts/42')
    expect(ctx.cookies.get('session')).toBe('abc123')
    expect(ctx.headers.get('cookie')).toBeTruthy()
  })
})

describe('createActionContext', () => {
  test('extends loader context with formData and json', () => {
    const request = new Request('https://example.com/api', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hello' }),
      headers: { 'content-type': 'application/json' },
    })
    const ctx = createActionContext(request)

    expect(typeof ctx.formData).toBe('function')
    expect(typeof ctx.json).toBe('function')
    expect(ctx.params).toEqual({})
  })
})

describe('executeLoader', () => {
  test('executes loader and returns data', async () => {
    const loader = defineLoader(async ({ params }) => {
      return { post: { id: params.id, title: 'Test Post' } }
    })

    const request = new Request('https://example.com/posts/1')
    const result = await executeLoader(loader, request, { id: '1' })

    expect(result.post.id).toBe('1')
    expect(result.post.title).toBe('Test Post')
  })

  test('supports sync loaders', async () => {
    const loader = defineLoader(({ params }) => {
      return { value: Number(params.n) * 2 }
    })

    const request = new Request('https://example.com/calc/5')
    const result = await executeLoader(loader, request, { n: '5' })
    expect(result.value).toBe(10)
  })
})

describe('executeAction', () => {
  test('executes action and returns result', async () => {
    const action = defineAction(async (ctx) => {
      const body = await ctx.json<{ title: string }>()
      return { data: { created: true, title: body.title } }
    })

    const request = new Request('https://example.com/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Post' }),
      headers: { 'content-type': 'application/json' },
    })

    const result = await executeAction(action, request)
    expect(result.data?.created).toBe(true)
    expect(result.data?.title).toBe('New Post')
  })

  test('supports validation errors', async () => {
    const action = defineAction(async () => {
      return {
        errors: { title: ['Title is required'] },
        status: 422,
      }
    })

    const request = new Request('https://example.com/api/posts', { method: 'POST' })
    const result = await executeAction(action, request)
    expect(result.errors?.title).toEqual(['Title is required'])
    expect(result.status).toBe(422)
  })
})
