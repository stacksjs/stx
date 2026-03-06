import { describe, expect, test } from 'bun:test'
import { testAction, testLoader } from '../src/loader'

describe('testLoader', () => {
  test('calls loader handler and returns result', async () => {
    const loader = {
      handler: () => ({ users: ['Alice', 'Bob'] }),
    }
    const result = await testLoader(loader)
    expect(result).toEqual({ users: ['Alice', 'Bob'] })
  })

  test('passes params to context', async () => {
    const loader = {
      handler: (ctx: any) => ctx.params.id,
    }
    const result = await testLoader(loader, { params: { id: '42' } })
    expect(result).toBe('42')
  })

  test('passes headers to context', async () => {
    const loader = {
      handler: (ctx: any) => ctx.headers.get('Authorization'),
    }
    const result = await testLoader(loader, { headers: { Authorization: 'Bearer token' } })
    expect(result).toBe('Bearer token')
  })

  test('passes cookies to context', async () => {
    const loader = {
      handler: (ctx: any) => ctx.cookies.session,
    }
    const result = await testLoader(loader, { cookies: { session: 'abc' } })
    expect(result).toBe('abc')
  })

  test('works with async handlers', async () => {
    const loader = {
      handler: async () => {
        return { data: 'async result' }
      },
    }
    const result = await testLoader(loader)
    expect(result).toEqual({ data: 'async result' })
  })

  test('context has request and response', async () => {
    const loader = {
      handler: (ctx: any) => ({
        hasRequest: !!ctx.request,
        hasResponse: !!ctx.response,
        method: ctx.request.method,
      }),
    }
    const result = await testLoader(loader)
    expect(result).toEqual({
      hasRequest: true,
      hasResponse: true,
      method: 'GET',
    })
  })
})

describe('testAction', () => {
  test('calls action handler and returns result', async () => {
    const action = {
      handler: () => ({ success: true }),
    }
    const result = await testAction(action)
    expect(result).toEqual({ success: true })
  })

  test('passes body to context', async () => {
    const action = {
      handler: (ctx: any) => ctx.body,
    }
    const result = await testAction(action, { body: { name: 'Alice' } })
    expect(result).toEqual({ name: 'Alice' })
  })

  test('passes formData to context', async () => {
    const action = {
      handler: (ctx: any) => ctx.formData,
    }
    const result = await testAction(action, { formData: { email: 'a@b.com' } })
    expect(result).toEqual({ email: 'a@b.com' })
  })

  test('passes params to context', async () => {
    const action = {
      handler: (ctx: any) => ctx.params.id,
    }
    const result = await testAction(action, { params: { id: '99' } })
    expect(result).toBe('99')
  })

  test('context request method is POST', async () => {
    const action = {
      handler: (ctx: any) => ctx.request.method,
    }
    const result = await testAction(action)
    expect(result).toBe('POST')
  })

  test('works with async handlers', async () => {
    const action = {
      handler: async (ctx: any) => {
        return { processed: ctx.body }
      },
    }
    const result = await testAction(action, { body: 'data' })
    expect(result).toEqual({ processed: 'data' })
  })
})
