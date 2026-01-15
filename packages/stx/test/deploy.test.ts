import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  calculateSha1,
  collectDeployFiles,
  createFileManifest,
  filterRequiredFiles,
  formatSize,
  getTotalSize,
  createNetlifyClient,
} from '../src/deploy/netlify'
import {
  generateNetlifyToml,
  detectProjectConfig,
  createDefaultNetlifyConfig,
  writeNetlifyConfig,
  hasNetlifyConfig,
} from '../src/deploy/config-generators'
import {
  deploy,
  initNetlify,
  DeployError,
} from '../src/deploy'

describe('Deploy Module', () => {
  const testDir = path.join(process.cwd(), '.test-deploy')
  const distDir = path.join(testDir, 'dist')

  beforeEach(async () => {
    // Create test directories
    await fs.promises.mkdir(distDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true })
    }
  })

  describe('calculateSha1', () => {
    it('should calculate SHA1 hash of content', async () => {
      const content = new TextEncoder().encode('Hello, World!')
      const hash = await calculateSha1(content)

      expect(hash).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01')
    })

    it('should return different hashes for different content', async () => {
      const content1 = new TextEncoder().encode('Hello')
      const content2 = new TextEncoder().encode('World')

      const hash1 = await calculateSha1(content1)
      const hash2 = await calculateSha1(content2)

      expect(hash1).not.toBe(hash2)
    })

    it('should return same hash for same content', async () => {
      const content = new TextEncoder().encode('Test content')
      const hash1 = await calculateSha1(content)
      const hash2 = await calculateSha1(content)

      expect(hash1).toBe(hash2)
    })
  })

  describe('collectDeployFiles', () => {
    it('should collect files from directory', async () => {
      // Create test files
      await Bun.write(path.join(distDir, 'index.html'), '<html></html>')
      await Bun.write(path.join(distDir, 'app.js'), 'console.log("test")')

      const files = await collectDeployFiles(distDir)

      expect(files.length).toBe(2)
      expect(files.map(f => f.path).sort()).toEqual(['app.js', 'index.html'])
    })

    it('should calculate SHA1 for each file', async () => {
      await Bun.write(path.join(distDir, 'test.txt'), 'test content')

      const files = await collectDeployFiles(distDir)

      expect(files[0].sha1).toBeDefined()
      expect(files[0].sha1.length).toBe(40) // SHA1 is 40 hex chars
    })

    it('should ignore node_modules by default', async () => {
      await fs.promises.mkdir(path.join(distDir, 'node_modules'), { recursive: true })
      await Bun.write(path.join(distDir, 'index.html'), '<html></html>')
      await Bun.write(path.join(distDir, 'node_modules', 'pkg.js'), 'module')

      const files = await collectDeployFiles(distDir)

      expect(files.length).toBe(1)
      expect(files[0].path).toBe('index.html')
    })

    it('should handle nested directories', async () => {
      await fs.promises.mkdir(path.join(distDir, 'assets'), { recursive: true })
      await Bun.write(path.join(distDir, 'index.html'), '<html></html>')
      await Bun.write(path.join(distDir, 'assets', 'style.css'), 'body {}')

      const files = await collectDeployFiles(distDir)

      expect(files.length).toBe(2)
      expect(files.map(f => f.path).sort()).toEqual(['assets/style.css', 'index.html'])
    })
  })

  describe('createFileManifest', () => {
    it('should create manifest with leading slashes', () => {
      const files = [
        { path: 'index.html', sha1: 'abc123', content: new Uint8Array() },
        { path: 'app.js', sha1: 'def456', content: new Uint8Array() },
      ]

      const manifest = createFileManifest(files)

      expect(manifest['/index.html']).toBe('abc123')
      expect(manifest['/app.js']).toBe('def456')
    })
  })

  describe('filterRequiredFiles', () => {
    it('should filter files to only required ones', () => {
      const files = [
        { path: 'index.html', sha1: 'abc', content: new Uint8Array() },
        { path: 'app.js', sha1: 'def', content: new Uint8Array() },
        { path: 'style.css', sha1: 'ghi', content: new Uint8Array() },
      ]

      const required = filterRequiredFiles(files, ['/index.html', '/style.css'])

      expect(required.length).toBe(2)
      expect(required.map(f => f.path).sort()).toEqual(['index.html', 'style.css'])
    })

    it('should handle paths with or without leading slash', () => {
      const files = [
        { path: 'file1.html', sha1: 'a', content: new Uint8Array() },
        { path: 'file2.html', sha1: 'b', content: new Uint8Array() },
      ]

      const required1 = filterRequiredFiles(files, ['/file1.html'])
      const required2 = filterRequiredFiles(files, ['file2.html'])

      expect(required1.length).toBe(1)
      expect(required2.length).toBe(1)
    })
  })

  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatSize(1572864)).toBe('1.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatSize(1610612736)).toBe('1.5 GB')
    })
  })

  describe('getTotalSize', () => {
    it('should sum file sizes', () => {
      const files = [
        { path: 'a', sha1: '', content: new Uint8Array(100) },
        { path: 'b', sha1: '', content: new Uint8Array(200) },
        { path: 'c', sha1: '', content: new Uint8Array(300) },
      ]

      expect(getTotalSize(files)).toBe(600)
    })

    it('should return 0 for empty array', () => {
      expect(getTotalSize([])).toBe(0)
    })
  })

  describe('generateNetlifyToml', () => {
    it('should generate basic config', () => {
      const config = {
        build: {
          command: 'bun run build',
          publish: 'dist',
        },
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('[build]')
      expect(toml).toContain('command = "bun run build"')
      expect(toml).toContain('publish = "dist"')
    })

    it('should include redirects', () => {
      const config = {
        build: { command: 'build', publish: 'dist' },
        redirects: [
          { from: '/*', to: '/index.html', status: 200 },
        ],
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('[[redirects]]')
      expect(toml).toContain('from = "/*"')
      expect(toml).toContain('to = "/index.html"')
      expect(toml).toContain('status = 200')
    })

    it('should include headers', () => {
      const config = {
        build: { command: 'build', publish: 'dist' },
        headers: [
          { for: '/*', values: { 'X-Frame-Options': 'DENY' } },
        ],
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('[[headers]]')
      expect(toml).toContain('for = "/*"')
      expect(toml).toContain('X-Frame-Options = "DENY"')
    })

    it('should include functions config', () => {
      const config = {
        build: { command: 'build', publish: 'dist', functions: 'functions' },
        functions: { directory: 'functions', node_bundler: 'esbuild' as const },
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('[functions]')
      expect(toml).toContain('directory = "functions"')
      expect(toml).toContain('node_bundler = "esbuild"')
    })

    it('should include context-specific config', () => {
      const config = {
        build: { command: 'build', publish: 'dist' },
        context: {
          production: { environment: { NODE_ENV: 'production' } },
        },
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('[context.production]')
      expect(toml).toContain('NODE_ENV = "production"')
    })

    it('should escape special characters', () => {
      const config = {
        build: { command: 'echo "hello\\nworld"', publish: 'dist' },
      }

      const toml = generateNetlifyToml(config)

      expect(toml).toContain('echo \\"hello\\\\nworld\\"')
    })
  })

  describe('createDefaultNetlifyConfig', () => {
    it('should create config with defaults', () => {
      const config = createDefaultNetlifyConfig()

      expect(config.build.command).toBe('bun run build')
      expect(config.build.publish).toBe('dist')
    })

    it('should include security headers', () => {
      const config = createDefaultNetlifyConfig()

      expect(config.headers).toBeDefined()
      expect(config.headers!.length).toBeGreaterThan(0)

      const securityHeader = config.headers!.find(h => h.for === '/*')
      expect(securityHeader?.values['X-Frame-Options']).toBe('DENY')
    })

    it('should include SPA redirect by default', () => {
      const config = createDefaultNetlifyConfig()

      expect(config.redirects).toBeDefined()
      expect(config.redirects![0].from).toBe('/*')
      expect(config.redirects![0].to).toBe('/index.html')
    })

    it('should use custom build command if provided', () => {
      const config = createDefaultNetlifyConfig({ buildCommand: 'npm run build' })

      expect(config.build.command).toBe('npm run build')
    })

    it('should include functions if detected', () => {
      const config = createDefaultNetlifyConfig({ functionsDir: 'api' })

      expect(config.build.functions).toBe('api')
      expect(config.functions?.directory).toBe('api')
    })
  })

  describe('detectProjectConfig', () => {
    it('should detect stx framework', async () => {
      // Create stx.config.ts
      await Bun.write(path.join(testDir, 'stx.config.ts'), 'export default {}')

      const config = await detectProjectConfig(testDir)

      expect(config.framework).toBe('stx')
    })

    it('should detect output directory', async () => {
      // Remove the default dist created by beforeEach
      await fs.promises.rm(distDir, { recursive: true })
      await fs.promises.mkdir(path.join(testDir, 'build'), { recursive: true })

      const config = await detectProjectConfig(testDir)

      expect(config.outputDir).toBe('build')
    })

    it('should detect functions directory', async () => {
      await fs.promises.mkdir(path.join(testDir, 'functions'), { recursive: true })

      const config = await detectProjectConfig(testDir)

      expect(config.functionsDir).toBe('functions')
    })
  })

  describe('writeNetlifyConfig', () => {
    it('should write netlify.toml file', async () => {
      await writeNetlifyConfig(testDir)

      const exists = fs.existsSync(path.join(testDir, 'netlify.toml'))
      expect(exists).toBe(true)
    })

    it('should use detected config', async () => {
      await fs.promises.mkdir(path.join(testDir, 'functions'), { recursive: true })
      await writeNetlifyConfig(testDir)

      const content = await Bun.file(path.join(testDir, 'netlify.toml')).text()
      expect(content).toContain('functions')
    })
  })

  describe('hasNetlifyConfig', () => {
    it('should return true if netlify.toml exists', async () => {
      await Bun.write(path.join(testDir, 'netlify.toml'), '[build]')

      expect(hasNetlifyConfig(testDir)).toBe(true)
    })

    it('should return false if netlify.toml does not exist', () => {
      expect(hasNetlifyConfig(testDir)).toBe(false)
    })
  })

  describe('DeployError', () => {
    it('should create error with code', () => {
      const error = new DeployError('Test error', 'TEST_CODE')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('DeployError')
    })
  })

  describe('deploy', () => {
    it('should throw error if no token provided', async () => {
      // Ensure env var is not set
      const originalToken = process.env.NETLIFY_AUTH_TOKEN
      delete process.env.NETLIFY_AUTH_TOKEN

      try {
        await expect(deploy({ directory: distDir })).rejects.toThrow('No Netlify auth token found')
      } finally {
        if (originalToken) {
          process.env.NETLIFY_AUTH_TOKEN = originalToken
        }
      }
    })

    it('should throw error if no site ID provided', async () => {
      const originalToken = process.env.NETLIFY_AUTH_TOKEN
      const originalSiteId = process.env.NETLIFY_SITE_ID
      process.env.NETLIFY_AUTH_TOKEN = 'test-token'
      delete process.env.NETLIFY_SITE_ID

      try {
        await expect(deploy({ directory: distDir })).rejects.toThrow('No Netlify site ID found')
      } finally {
        if (originalToken) {
          process.env.NETLIFY_AUTH_TOKEN = originalToken
        } else {
          delete process.env.NETLIFY_AUTH_TOKEN
        }
        if (originalSiteId) {
          process.env.NETLIFY_SITE_ID = originalSiteId
        }
      }
    })

    it('should throw error if directory does not exist', async () => {
      const originalToken = process.env.NETLIFY_AUTH_TOKEN
      const originalSiteId = process.env.NETLIFY_SITE_ID
      process.env.NETLIFY_AUTH_TOKEN = 'test-token'
      process.env.NETLIFY_SITE_ID = 'test-site'

      try {
        await expect(deploy({ directory: '/nonexistent/path' })).rejects.toThrow('Build directory not found')
      } finally {
        if (originalToken) {
          process.env.NETLIFY_AUTH_TOKEN = originalToken
        } else {
          delete process.env.NETLIFY_AUTH_TOKEN
        }
        if (originalSiteId) {
          process.env.NETLIFY_SITE_ID = originalSiteId
        } else {
          delete process.env.NETLIFY_SITE_ID
        }
      }
    })

    it('should work in dry-run mode', async () => {
      // Create test files
      await Bun.write(path.join(distDir, 'index.html'), '<html></html>')

      const originalToken = process.env.NETLIFY_AUTH_TOKEN
      const originalSiteId = process.env.NETLIFY_SITE_ID
      process.env.NETLIFY_AUTH_TOKEN = 'test-token'
      process.env.NETLIFY_SITE_ID = 'test-site'

      try {
        const result = await deploy({
          directory: distDir,
          dryRun: true,
        })

        expect(result.success).toBe(true)
        expect(result.deployId).toBe('dry-run')
        expect(result.filesUploaded).toBe(1)
      } finally {
        if (originalToken) {
          process.env.NETLIFY_AUTH_TOKEN = originalToken
        } else {
          delete process.env.NETLIFY_AUTH_TOKEN
        }
        if (originalSiteId) {
          process.env.NETLIFY_SITE_ID = originalSiteId
        } else {
          delete process.env.NETLIFY_SITE_ID
        }
      }
    })
  })

  describe('initNetlify', () => {
    it('should create netlify.toml', async () => {
      const result = await initNetlify({ directory: testDir })

      expect(result.configPath).toContain('netlify.toml')
      expect(fs.existsSync(result.configPath)).toBe(true)
    })

    it('should save site ID to .env.local', async () => {
      const result = await initNetlify({
        directory: testDir,
        siteId: 'my-test-site',
      })

      expect(result.siteId).toBe('my-test-site')

      const envContent = await Bun.file(path.join(testDir, '.env.local')).text()
      expect(envContent).toContain('NETLIFY_SITE_ID=my-test-site')
    })

    it('should not overwrite existing netlify.toml', async () => {
      // Create existing config
      await Bun.write(path.join(testDir, 'netlify.toml'), '# existing config')

      await initNetlify({ directory: testDir })

      const content = await Bun.file(path.join(testDir, 'netlify.toml')).text()
      expect(content).toBe('# existing config')
    })
  })

  describe('createNetlifyClient', () => {
    it('should create client with token', () => {
      const client = createNetlifyClient({ token: 'test-token' })

      expect(client.getSite).toBeDefined()
      expect(client.createDeploy).toBeDefined()
      expect(client.uploadFile).toBeDefined()
    })
  })
})
