import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  createRouter,
  findErrorPage,
  generateRouteTypes,
  matchRoute,
} from '../../src/router'

const TEMP_DIR = path.join(import.meta.dir, 'temp')
const PAGES_DIR = path.join(TEMP_DIR, 'pages')

async function createPageFile(relativePath: string, content = '<p>page</p>'): Promise<void> {
  const fullPath = path.join(PAGES_DIR, relativePath)
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })
  await Bun.write(fullPath, content)
}

describe('STX Router', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(PAGES_DIR, { recursive: true })

    // Create page files for route discovery tests
    await createPageFile('index.stx')
    await createPageFile('about.stx')
    await createPageFile('chat/index.stx')
    await createPageFile('chat/[id].stx')
    await createPageFile('blog/[...slug].stx')
    await createPageFile('users/[[id]].stx')
    await createPageFile('dashboard/settings.stx')
  })

  afterAll(async () => {
    try {
      await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
    }
    catch {}
  })

  describe('filePathToPattern (via createRouter)', () => {
    it('should discover standard routes', () => {
      const routes = createRouter(TEMP_DIR)
      const patterns = routes.map(r => r.pattern)

      expect(patterns).toContain('/')
      expect(patterns).toContain('/about')
      expect(patterns).toContain('/chat')
      expect(patterns).toContain('/dashboard/settings')
    })

    it('should convert [param] to :param', () => {
      const routes = createRouter(TEMP_DIR)
      const chatIdRoute = routes.find(r => r.pattern.includes('/chat/'))
      expect(chatIdRoute).toBeDefined()
      expect(chatIdRoute!.pattern).toBe('/chat/:id')
      expect(chatIdRoute!.isDynamic).toBe(true)
    })

    it('should convert [...param] to :param* (catch-all)', () => {
      const routes = createRouter(TEMP_DIR)
      const blogRoute = routes.find(r => r.pattern.includes('blog'))
      expect(blogRoute).toBeDefined()
      expect(blogRoute!.pattern).toBe('/blog/:slug*')
    })

    it('should convert [[param]] to :param? (optional)', () => {
      const routes = createRouter(TEMP_DIR)
      const usersRoute = routes.find(r => r.pattern.includes('users'))
      expect(usersRoute).toBeDefined()
      expect(usersRoute!.pattern).toBe('/users/:id?')
      expect(usersRoute!.isDynamic).toBe(true)
    })
  })

  describe('patternToRegex (via matchRoute)', () => {
    it('should match static routes exactly', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/about', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/about')
      expect(match!.params).toEqual({})
    })

    it('should match dynamic routes and extract params', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/chat/123', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/chat/:id')
      expect(match!.params).toEqual({ id: '123' })
    })

    it('should match catch-all routes', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/blog/2024/hello-world', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/blog/:slug*')
      expect(match!.params).toEqual({ slug: '2024/hello-world' })
    })

    it('should match optional routes with param present', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/users/456', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/users/:id?')
      expect(match!.params).toEqual({ id: '456' })
    })

    it('should match optional routes without param', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/users', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/users/:id?')
      expect(match!.params.id).toBeUndefined()
    })

    it('should not match non-existent routes', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/nonexistent', routes)
      expect(match).toBeNull()
    })

    it('should match root path', () => {
      const routes = createRouter(TEMP_DIR)
      const match = matchRoute('/', routes)
      expect(match).not.toBeNull()
      expect(match!.route.pattern).toBe('/')
    })
  })

  describe('route sorting priority', () => {
    it('should prioritize static routes over dynamic', () => {
      const routes = createRouter(TEMP_DIR)
      const staticIdx = routes.findIndex(r => r.pattern === '/about')
      const dynamicIdx = routes.findIndex(r => r.pattern === '/chat/:id')
      expect(staticIdx).toBeLessThan(dynamicIdx)
    })

    it('should prioritize more specific routes (more segments)', () => {
      const routes = createRouter(TEMP_DIR)
      const settingsIdx = routes.findIndex(r => r.pattern === '/dashboard/settings')
      const aboutIdx = routes.findIndex(r => r.pattern === '/about')
      expect(settingsIdx).toBeLessThan(aboutIdx)
    })
  })

  describe('findErrorPage', () => {
    beforeAll(async () => {
      await createPageFile('404.stx', '<h1>404 Not Found</h1>')
      await createPageFile('500.stx', '<h1>500 Server Error</h1>')
    })

    it('should find specific error page by status code', () => {
      const result = findErrorPage(PAGES_DIR, 404)
      expect(result).not.toBeNull()
      expect(result).toEndWith('404.stx')
    })

    it('should find 500 error page', () => {
      const result = findErrorPage(PAGES_DIR, 500)
      expect(result).not.toBeNull()
      expect(result).toEndWith('500.stx')
    })

    it('should return null for missing error pages', () => {
      const result = findErrorPage(PAGES_DIR, 503)
      expect(result).toBeNull()
    })

    it('should fall back to generic error.stx', async () => {
      await createPageFile('error.stx', '<h1>Error</h1>')
      const result = findErrorPage(PAGES_DIR, 503)
      expect(result).not.toBeNull()
      expect(result).toEndWith('error.stx')
    })
  })

  describe('generateRouteTypes', () => {
    it('should generate route-types.d.ts', () => {
      const routes = createRouter(TEMP_DIR)
      const outputDir = path.join(TEMP_DIR, '.stx')

      generateRouteTypes(routes, outputDir)

      const typesPath = path.join(outputDir, 'route-types.d.ts')
      expect(fs.existsSync(typesPath)).toBe(true)

      const content = fs.readFileSync(typesPath, 'utf8')
      expect(content).toContain('// Auto-generated by STX - do not edit')
      expect(content).toContain('declare module "stx/routes"')
      expect(content).toContain('interface RouteMap')
    })

    it('should include static routes with empty params', () => {
      const routes = createRouter(TEMP_DIR)
      const outputDir = path.join(TEMP_DIR, '.stx')

      generateRouteTypes(routes, outputDir)

      const content = fs.readFileSync(path.join(outputDir, 'route-types.d.ts'), 'utf8')
      expect(content).toContain("'/about': {  }")
    })

    it('should include dynamic routes with param types', () => {
      const routes = createRouter(TEMP_DIR)
      const outputDir = path.join(TEMP_DIR, '.stx')

      generateRouteTypes(routes, outputDir)

      const content = fs.readFileSync(path.join(outputDir, 'route-types.d.ts'), 'utf8')
      expect(content).toContain("'/chat/:id': { id: string }")
    })

    it('should type catch-all params as string[]', () => {
      const routes = createRouter(TEMP_DIR)
      const outputDir = path.join(TEMP_DIR, '.stx')

      generateRouteTypes(routes, outputDir)

      const content = fs.readFileSync(path.join(outputDir, 'route-types.d.ts'), 'utf8')
      expect(content).toContain("'/blog/:slug*': { slug: string[] }")
    })
  })
})
