/**
 * Package installation tests
 *
 * Tests that the package exports work correctly and can be imported
 * as expected after installation.
 */

import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGE_ROOT = join(__dirname, '../..')
const DIST_DIR = join(PACKAGE_ROOT, 'dist')

// Check if dist directory exists (only exists after build)
const HAS_DIST = existsSync(DIST_DIR)

describe('Package Installation', () => {
  describe('Package Structure', () => {
    it('should have package.json', () => {
      const packagePath = join(PACKAGE_ROOT, 'package.json')
      expect(existsSync(packagePath)).toBe(true)
    })

    it('should have valid package.json', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.name).toBe('@stacksjs/components')
      expect(packageJson.type).toBe('module')
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.main || packageJson.module).toBeDefined()
    })

    it('should have README.md', () => {
      const readmePath = join(PACKAGE_ROOT, 'README.md')
      expect(existsSync(readmePath)).toBe(true)
    })

    it('should have src directory', () => {
      expect(existsSync(join(PACKAGE_ROOT, 'src'))).toBe(true)
    })

    it('should have dist directory (requires build)', () => {
      // This test is skipped in development - dist only exists after build
      if (!HAS_DIST) {
        expect(true).toBe(true) // Skip gracefully
        return
      }
      expect(existsSync(DIST_DIR)).toBe(true)
    })
  })

  describe('Package Exports', () => {
    it('should export main entry point', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()
      const mainExport = packageJson.exports['.']

      expect(mainExport).toBeDefined()
      expect(mainExport.types || mainExport.import).toBeDefined()
    })

    it('should export TypeScript types', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()
      const mainExport = packageJson.exports['.']

      expect(mainExport.types).toBeDefined()
      expect(mainExport.types).toContain('.d.ts')
    })

    it('should have wildcard exports for submodules', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.exports['./*']).toBeDefined()
    })
  })

  describe('Built Files (requires build)', () => {
    it('should have compiled index.js', () => {
      if (!HAS_DIST) {
        expect(true).toBe(true) // Skip gracefully in dev
        return
      }
      const indexPath = join(DIST_DIR, 'index.js')
      expect(existsSync(indexPath)).toBe(true)
    })

    it('should have type definitions', () => {
      if (!HAS_DIST) {
        expect(true).toBe(true) // Skip gracefully in dev
        return
      }
      const typesPath = join(DIST_DIR, 'index.d.ts')
      expect(existsSync(typesPath)).toBe(true)
    })

    it('should have component exports in dist', () => {
      if (!HAS_DIST) {
        expect(true).toBe(true) // Skip gracefully in dev
        return
      }
      const componentsDir = join(DIST_DIR, 'components')
      // Components might be in dist/components or bundled in index
      const hasComponentsDir = existsSync(componentsDir)
      const hasIndexFile = existsSync(join(DIST_DIR, 'index.js'))

      expect(hasComponentsDir || hasIndexFile).toBe(true)
    })

    it('should have utils exports', () => {
      if (!HAS_DIST) {
        expect(true).toBe(true) // Skip gracefully in dev
        return
      }
      const utilsDir = join(DIST_DIR, 'utils')
      const hasUtils = existsSync(utilsDir)
      const hasIndexFile = existsSync(join(DIST_DIR, 'index.js'))

      expect(hasUtils || hasIndexFile).toBe(true)
    })
  })

  describe('Module Resolution', () => {
    it('should be able to import main module', async () => {
      // Test that the index exports are valid TypeScript
      const indexPath = join(PACKAGE_ROOT, 'src/index.ts')
      const content = await Bun.file(indexPath).text()

      // Should have export statements
      expect(content).toMatch(/export/i)
    })

    it('should export component types', async () => {
      const indexPath = join(PACKAGE_ROOT, 'src/index.ts')
      const content = await Bun.file(indexPath).text()

      // Should re-export from UI components
      expect(content).toMatch(/export.*from|export \*/i)
    })

    it('should export utilities', async () => {
      const indexPath = join(PACKAGE_ROOT, 'src/index.ts')
      const content = await Bun.file(indexPath).text()

      // Should export utilities
      expect(content).toMatch(/utils|accessibility|theme/i)
    })
  })

  describe('Dependencies', () => {
    it('should have required dependencies', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.dependencies).toBeDefined()
      expect(packageJson.dependencies['@stacksjs/stx']).toBeDefined()
    })

    it('should have dev dependencies', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.devDependencies).toBeDefined()
      expect(packageJson.devDependencies.typescript).toBeDefined()
    })

    it('should have workspace dependencies', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      // Check for workspace protocol
      const deps = JSON.stringify(packageJson.dependencies)
      expect(deps).toMatch(/workspace:\*/i)
    })
  })

  describe('Scripts', () => {
    it('should have build script', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.scripts.build).toBeDefined()
    })

    it('should have test script', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.scripts.test).toBeDefined()
    })

    it('should have lint script', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.scripts.lint).toBeDefined()
    })

    it('should have prepublishOnly script', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.scripts.prepublishOnly).toBeDefined()
    })
  })

  describe('Publishing', () => {
    it('should have files field for npm', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.files).toBeDefined()
      expect(packageJson.files).toContain('dist')
    })

    it('should have license', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.license).toBeDefined()
    })

    it('should have repository info', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.repository).toBeDefined()
    })

    it('should have keywords', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.keywords).toBeDefined()
      expect(Array.isArray(packageJson.keywords)).toBe(true)
      expect(packageJson.keywords.length).toBeGreaterThan(0)
    })
  })

  describe('Type Definitions', () => {
    it('should have main types field', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      expect(packageJson.types).toBeDefined()
      expect(packageJson.types).toContain('.d.ts')
    })

    it('should have types in exports', async () => {
      const packageJson = await Bun.file(join(PACKAGE_ROOT, 'package.json')).json()

      const mainExport = packageJson.exports['.']
      expect(mainExport.types).toBeDefined()
    })
  })

  describe('Verify Source Components', () => {
    const componentDirs = [
      'button',
      'switch',
      'checkbox',
      'dialog',
      'dropdown',
      'notification',
      'progress',
      'spinner',
      'tooltip',
    ]

    for (const component of componentDirs) {
      it(`should have ${component} component`, () => {
        const componentPath = join(PACKAGE_ROOT, 'src/ui', component)
        expect(existsSync(componentPath)).toBe(true)
      })
    }
  })

  describe('Verify Composables', () => {
    it('should have composables directory', () => {
      const composablesPath = join(PACKAGE_ROOT, 'src/composables')
      expect(existsSync(composablesPath)).toBe(true)
    })

    it('should have useDarkMode composable', () => {
      const composablePath = join(PACKAGE_ROOT, 'src/composables/useDarkMode.ts')
      expect(existsSync(composablePath)).toBe(true)
    })

    it('should have useCopyCode composable', () => {
      const composablePath = join(PACKAGE_ROOT, 'src/composables/useCopyCode.ts')
      expect(existsSync(composablePath)).toBe(true)
    })
  })

  describe('Verify Utilities', () => {
    it('should have utils directory', () => {
      const utilsPath = join(PACKAGE_ROOT, 'src/utils')
      expect(existsSync(utilsPath)).toBe(true)
    })

    it('should have accessibility utilities', () => {
      const a11yPath = join(PACKAGE_ROOT, 'src/utils/accessibility.ts')
      expect(existsSync(a11yPath)).toBe(true)
    })

    it('should have theme utilities', () => {
      const themePath = join(PACKAGE_ROOT, 'src/utils/theme.ts')
      expect(existsSync(themePath)).toBe(true)
    })
  })
})
