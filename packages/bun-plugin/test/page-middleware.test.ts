import { describe, expect, it } from 'bun:test'
import { runPageMiddleware } from '../src/page-middleware'
import type { MiddlewareContext, MiddlewareRequest, PageMiddleware } from '../src/page-middleware'

interface EnhancedRequestFixture extends MiddlewareRequest {
  bearerToken: () => string | null
}

// Compile-time compatibility fixture for the narrower request accepted by
// `@stacksjs/router` Middleware instances.
const sharedMiddlewareFixture: PageMiddleware = {
  name: 'Shared',
  handle(_request: EnhancedRequestFixture) {},
}

void sharedMiddlewareFixture

function context(path = '/dashboard'): MiddlewareContext {
  return {
    path,
    url: new URL(`http://localhost${path}`),
    params: { id: '42' },
    cookies: {},
    redirect: to => Response.redirect(`http://localhost${to}`, 302),
  }
}

describe('class-style page middleware', () => {
  it('runs by priority and exposes route and middleware params on the request', async () => {
    const order: string[] = []
    const request = new Request('http://localhost/dashboard') as MiddlewareRequest

    const response = await runPageMiddleware({
      request,
      context: context(),
      entries: ['late', 'role:admin,owner', 'early'],
      registry: {
        late: {
          name: 'Late',
          priority: 20,
          handle() { order.push('late') },
        },
        role: {
          name: 'Role',
          priority: 10,
          handle(req) {
            order.push(`role:${req._middlewareParams?.role}`)
          },
        },
        early: {
          name: 'Early',
          priority: 1,
          handle(req) {
            order.push(`early:${req.params?.id}`)
          },
        },
      },
    })

    expect(response).toBeNull()
    expect(order).toEqual(['early:42', 'role:admin,owner', 'late'])
  })

  it('resolves a complete alias before treating its colon as parameters', async () => {
    const order: string[] = []
    const request = new Request('http://localhost/dashboard') as MiddlewareRequest

    await runPageMiddleware({
      request,
      context: context(),
      entries: ['env:production'],
      registry: {
        env: () => { order.push('parameterized') },
        'env:production': () => { order.push('exact') },
      },
    })

    expect(order).toEqual(['exact'])
    expect(request._middlewareParams?.env).toBeUndefined()
  })

  it('short-circuits on a thrown Response', async () => {
    const response = await runPageMiddleware({
      request: new Request('http://localhost/dashboard') as MiddlewareRequest,
      context: context(),
      entries: ['auth'],
      registry: {
        auth: {
          name: 'Auth',
          priority: 1,
          handle() { throw new Response('Unauthorized', { status: 401 }) },
        },
      },
    })

    expect(response?.status).toBe(401)
    expect(await response?.text()).toBe('Unauthorized')
  })

  it('uses a framework request preparer before invoking middleware', async () => {
    const response = await runPageMiddleware({
      request: new Request('http://localhost/dashboard') as MiddlewareRequest,
      context: context(),
      entries: ['auth'],
      registry: {
        auth: {
          name: 'Auth',
          handle(req) {
            if ((req as MiddlewareRequest & { user?: () => string }).user?.() !== 'Chris')
              throw { statusCode: 401, message: 'Unauthorized' }
          },
        },
      },
      prepareRequest(request) {
        return Object.assign(request, { user: () => 'Chris' })
      },
    })

    expect(response).toBeNull()
  })

  it('fails closed when a middleware name cannot be resolved', async () => {
    const response = await runPageMiddleware({
      request: new Request('http://localhost/dashboard') as MiddlewareRequest,
      context: context(),
      entries: ['missing'],
      registry: {},
    })

    expect(response?.status).toBe(500)
  })

  it('inverts middleware refusals with the same reference syntax as Stacks', async () => {
    const response = await runPageMiddleware({
      request: new Request('http://localhost/login') as MiddlewareRequest,
      context: context('/login'),
      entries: ['!auth'],
      registry: {
        auth: {
          name: 'Auth',
          handle() { throw { statusCode: 401, message: 'Unauthorized' } },
        },
      },
    })

    expect(response).toBeNull()
  })
})
