import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  assertSnapshot,
  createSnapshotManager,
  matchSnapshot,
} from './test-utils'

describe('Snapshot Testing', () => {
  const testDir = path.dirname(import.meta.path)
  const snapshotDir = path.join(testDir, '__snapshots__')

  // Clean up snapshots before tests
  beforeAll(() => {
    if (fs.existsSync(snapshotDir)) {
      const files = fs.readdirSync(snapshotDir)
      for (const file of files) {
        if (file.startsWith('test-') && file.endsWith('.snap.html')) {
          fs.unlinkSync(path.join(snapshotDir, file))
        }
      }
    }
  })

  // Clean up test snapshots after tests
  afterAll(() => {
    if (fs.existsSync(snapshotDir)) {
      const files = fs.readdirSync(snapshotDir)
      for (const file of files) {
        if (file.startsWith('test-') && file.endsWith('.snap.html')) {
          fs.unlinkSync(path.join(snapshotDir, file))
        }
      }
    }
  })

  describe('matchSnapshot', () => {
    it('creates a new snapshot when none exists', async () => {
      const result = await matchSnapshot(
        '<div>{{ name }}</div>',
        'test-new-snapshot',
        { name: 'World' },
        { testFilePath: import.meta.path },
      )

      expect(result.passed).toBe(true)
      expect(result.created).toBe(true)
      expect(result.updated).toBe(false)
      expect(result.actual).toBe('<div>World</div>')

      // Verify snapshot file was created
      expect(fs.existsSync(result.snapshotPath)).toBe(true)
    })

    it('matches existing snapshot', async () => {
      // First call creates snapshot
      await matchSnapshot(
        '<p>Hello</p>',
        'test-existing-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      // Second call should match
      const result = await matchSnapshot(
        '<p>Hello</p>',
        'test-existing-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      expect(result.passed).toBe(true)
      expect(result.created).toBe(false)
      expect(result.updated).toBe(false)
    })

    it('fails when snapshot does not match', async () => {
      // Create initial snapshot
      await matchSnapshot(
        '<span>Original</span>',
        'test-mismatch-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      // Try to match with different content
      const result = await matchSnapshot(
        '<span>Modified</span>',
        'test-mismatch-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      expect(result.passed).toBe(false)
      expect(result.error).toContain('Snapshot mismatch')
      expect(result.expected).toBe('<span>Original</span>')
      expect(result.actual).toBe('<span>Modified</span>')
    })

    it('updates snapshot when update option is true', async () => {
      // Create initial snapshot
      await matchSnapshot(
        '<div>First</div>',
        'test-update-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      // Update with new content
      const result = await matchSnapshot(
        '<div>Second</div>',
        'test-update-snapshot',
        {},
        { testFilePath: import.meta.path, update: true },
      )

      expect(result.passed).toBe(true)
      expect(result.updated).toBe(true)

      // Verify snapshot was updated
      const snapshotContent = fs.readFileSync(result.snapshotPath, 'utf-8')
      expect(snapshotContent).toBe('<div>Second</div>')
    })

    it('normalizes whitespace when option is enabled', async () => {
      // Create snapshot with whitespace
      await matchSnapshot(
        '<div>\n  Hello\n</div>',
        'test-whitespace-snapshot',
        {},
        { testFilePath: import.meta.path },
      )

      // Match with different whitespace
      const result = await matchSnapshot(
        '<div>  Hello  </div>',
        'test-whitespace-snapshot',
        {},
        { testFilePath: import.meta.path, normalizeWhitespace: true },
      )

      expect(result.passed).toBe(true)
    })

    it('uses custom serializer', async () => {
      const result = await matchSnapshot(
        '<div>{{ name }}</div>',
        'test-serializer-snapshot',
        { name: 'Test' },
        {
          testFilePath: import.meta.path,
          serializer: content => content.toUpperCase(),
        },
      )

      expect(result.passed).toBe(true)
      expect(result.actual).toBe('<DIV>TEST</DIV>')
    })
  })

  describe('assertSnapshot', () => {
    it('does not throw when snapshot matches', async () => {
      // Create initial snapshot
      await matchSnapshot(
        '<div>Pass</div>',
        'test-assert-pass',
        {},
        { testFilePath: import.meta.path },
      )

      // Should not throw
      await assertSnapshot(
        '<div>Pass</div>',
        'test-assert-pass',
        {},
        { testFilePath: import.meta.path },
      )
    })

    it('throws when snapshot does not match', async () => {
      // Create initial snapshot
      await matchSnapshot(
        '<div>Expected</div>',
        'test-assert-fail',
        {},
        { testFilePath: import.meta.path },
      )

      // Should throw
      let error: Error | null = null
      try {
        await assertSnapshot(
          '<div>Different</div>',
          'test-assert-fail',
          {},
          { testFilePath: import.meta.path },
        )
      }
      catch (e: any) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.message).toContain('Snapshot mismatch')
    })
  })

  describe('createSnapshotManager', () => {
    it('creates manager with correct methods', () => {
      const manager = createSnapshotManager(import.meta.path)

      expect(typeof manager.match).toBe('function')
      expect(typeof manager.assert).toBe('function')
      expect(typeof manager.getSnapshotDir).toBe('function')
      expect(typeof manager.clearSnapshots).toBe('function')
      expect(typeof manager.listSnapshots).toBe('function')
    })

    it('uses default options for all snapshots', async () => {
      const manager = createSnapshotManager(import.meta.path, {
        normalizeWhitespace: true,
      })

      // Create snapshot with extra whitespace
      await manager.match(
        '<p>\n  Content\n</p>',
        'test-manager-default-options',
      )

      // Match with different whitespace - should pass due to normalizeWhitespace
      const result = await manager.match(
        '<p>   Content   </p>',
        'test-manager-default-options',
      )

      expect(result.passed).toBe(true)
    })

    it('lists snapshots correctly', async () => {
      const manager = createSnapshotManager(import.meta.path)

      // Create a few snapshots
      await manager.match('<div>A</div>', 'test-list-a')
      await manager.match('<div>B</div>', 'test-list-b')

      const snapshots = manager.listSnapshots()

      expect(snapshots).toContain('test-list-a')
      expect(snapshots).toContain('test-list-b')
    })
  })

  describe('Complex template snapshots', () => {
    it('snapshots loop output', async () => {
      const result = await matchSnapshot(
        '@foreach(items as item)<li>{{ item }}</li>@endforeach',
        'test-loop-output',
        { items: ['apple', 'banana', 'cherry'] },
        { testFilePath: import.meta.path },
      )

      expect(result.passed).toBe(true)
      expect(result.actual).toContain('<li>apple</li>')
      expect(result.actual).toContain('<li>banana</li>')
      expect(result.actual).toContain('<li>cherry</li>')
    })

    it('snapshots conditional output', async () => {
      const result = await matchSnapshot(
        '@if(show)<div>Visible</div>@else<div>Hidden</div>@endif',
        'test-conditional-output',
        { show: true },
        { testFilePath: import.meta.path },
      )

      expect(result.passed).toBe(true)
      expect(result.actual).toBe('<div>Visible</div>')
    })

    it('snapshots nested structures', async () => {
      const template = `
        <div class="user">
          <h2>{{ user.name }}</h2>
          @if(user.email)
            <a href="mailto:{{ user.email }}">{{ user.email }}</a>
          @endif
          @foreach(user.roles as role)
            <span class="badge">{{ role }}</span>
          @endforeach
        </div>
      `

      const result = await matchSnapshot(
        template,
        'test-nested-structures',
        {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            roles: ['admin', 'editor'],
          },
        },
        { testFilePath: import.meta.path, normalizeWhitespace: true },
      )

      expect(result.passed).toBe(true)
    })
  })
})
