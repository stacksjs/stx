import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  createSnapshotTester,
  createVisualRegressionTester,
  createStoryTester,
  generateReport,
  snapshot,
  snapshotJson,
  resetDefaultTester,
  defaultViewports,
} from '../src/visual-testing'

describe('Visual Testing', () => {
  const testDir = path.join(process.cwd(), '.test-visual')
  const snapshotDir = path.join(testDir, '__snapshots__')
  const screenshotDir = path.join(testDir, '__screenshots__')
  const diffDir = path.join(testDir, '__diffs__')

  beforeEach(async () => {
    await fs.promises.mkdir(testDir, { recursive: true })
    resetDefaultTester()
  })

  afterEach(async () => {
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true })
    }
    resetDefaultTester()
  })

  describe('createSnapshotTester', () => {
    it('should create tester with default config', () => {
      const tester = createSnapshotTester()
      expect(tester).toBeDefined()
      expect(tester.snapshot).toBeDefined()
      expect(tester.snapshotJson).toBeDefined()
    })

    it('should create tester with custom config', () => {
      const tester = createSnapshotTester({
        snapshotDir: 'custom-snapshots',
        threshold: 0.05,
      })
      expect(tester.getConfig().snapshotDir).toBe('custom-snapshots')
      expect(tester.getConfig().threshold).toBe(0.05)
    })
  })

  describe('HTML Snapshot Testing', () => {
    it('should create new snapshot when none exists', async () => {
      const tester = createSnapshotTester({ snapshotDir })

      const result = await tester.snapshot('<div>Hello</div>', 'hello')

      expect(result.passed).toBe(true)
      expect(result.message).toContain('New snapshot created')
      expect(fs.existsSync(result.snapshotPath)).toBe(true)
    })

    it('should pass when snapshot matches', async () => {
      const tester = createSnapshotTester({ snapshotDir })

      // Create initial snapshot
      await tester.snapshot('<div>Hello</div>', 'matching')

      // Test same content
      const result = await tester.snapshot('<div>Hello</div>', 'matching')

      expect(result.passed).toBe(true)
      expect(result.message).toContain('matches')
    })

    it('should fail when snapshot differs', async () => {
      const tester = createSnapshotTester({
        snapshotDir,
        diffDir,
        updateSnapshots: false,
      })

      // Create initial snapshot
      await tester.snapshot('<div>Hello</div>', 'different')

      // Test different content
      const result = await tester.snapshot('<div>World</div>', 'different')

      expect(result.passed).toBe(false)
      expect(result.message).toContain('does not match')
      expect(result.diffPath).toBeDefined()
    })

    it('should update snapshot when updateSnapshots is true', async () => {
      const tester = createSnapshotTester({
        snapshotDir,
        updateSnapshots: true,
      })

      // Create initial snapshot
      await tester.snapshot('<div>Hello</div>', 'update')

      // Update with different content
      const result = await tester.snapshot('<div>Updated</div>', 'update')

      expect(result.passed).toBe(true)
      expect(result.message).toContain('updated')

      // Verify content was updated
      const content = await Bun.file(result.snapshotPath).text()
      expect(content).toContain('Updated')
    })

    it('should normalize HTML for comparison', async () => {
      const tester = createSnapshotTester({ snapshotDir })

      // Create snapshot with whitespace
      await tester.snapshot('<div>  Hello   World  </div>', 'normalize')

      // Should match with different whitespace
      const result = await tester.snapshot('<div>Hello World</div>', 'normalize')

      expect(result.passed).toBe(true)
    })
  })

  describe('JSON Snapshot Testing', () => {
    it('should create JSON snapshot', async () => {
      const tester = createSnapshotTester({ snapshotDir })

      const data = { name: 'test', value: 123 }
      const result = await tester.snapshotJson(data, 'json-test')

      expect(result.passed).toBe(true)
      expect(fs.existsSync(result.snapshotPath)).toBe(true)

      const content = await Bun.file(result.snapshotPath).text()
      expect(JSON.parse(content)).toEqual(data)
    })

    it('should fail on JSON mismatch', async () => {
      const tester = createSnapshotTester({
        snapshotDir,
        updateSnapshots: false,
      })

      await tester.snapshotJson({ a: 1 }, 'json-diff')
      const result = await tester.snapshotJson({ a: 2 }, 'json-diff')

      expect(result.passed).toBe(false)
    })
  })

  describe('Inline Snapshot', () => {
    it('should return expected value for new snapshot', () => {
      const tester = createSnapshotTester()

      const result = tester.matchInlineSnapshot('<div>Test</div>')

      expect(result.passed).toBe(true)
      expect(result.expected).toBe('<div>Test</div>')
    })

    it('should compare with existing snapshot', () => {
      const tester = createSnapshotTester()

      const result = tester.matchInlineSnapshot(
        '<div>Test</div>',
        '<div>Test</div>'
      )

      expect(result.passed).toBe(true)
    })

    it('should fail on mismatch', () => {
      const tester = createSnapshotTester()

      const result = tester.matchInlineSnapshot(
        '<div>Actual</div>',
        '<div>Expected</div>'
      )

      expect(result.passed).toBe(false)
    })
  })

  describe('Visual Regression Testing', () => {
    it('should create visual regression tester', () => {
      const tester = createVisualRegressionTester()
      expect(tester.compareScreenshots).toBeDefined()
      expect(tester.testViewports).toBeDefined()
    })

    it('should create baseline for new screenshot', async () => {
      const tester = createVisualRegressionTester({ screenshotDir })

      const screenshot = Buffer.from('fake-image-data')
      const result = await tester.compareScreenshots('new-test', screenshot)

      expect(result.passed).toBe(true)
      expect(fs.existsSync(result.baselinePath)).toBe(true)
    })

    it('should pass when screenshot matches baseline', async () => {
      const tester = createVisualRegressionTester({ screenshotDir })

      const screenshot = Buffer.from('same-image-data')

      // Create baseline
      await tester.compareScreenshots('match-test', screenshot)

      // Compare same image
      const result = await tester.compareScreenshots('match-test', screenshot)

      expect(result.passed).toBe(true)
    })

    it('should fail when screenshot differs', async () => {
      const tester = createVisualRegressionTester({
        screenshotDir,
        diffDir,
        threshold: 0,
        updateSnapshots: false,
      })

      // Create baseline
      await tester.compareScreenshots(
        'diff-test',
        Buffer.from('original-image')
      )

      // Compare different image
      const result = await tester.compareScreenshots(
        'diff-test',
        Buffer.from('different-image')
      )

      expect(result.passed).toBe(false)
      expect(result.diffPercentage).toBeGreaterThan(0)
    })
  })

  describe('Default Viewports', () => {
    it('should have standard viewports defined', () => {
      expect(defaultViewports).toHaveLength(4)

      const names = defaultViewports.map(v => v.name)
      expect(names).toContain('mobile')
      expect(names).toContain('tablet')
      expect(names).toContain('desktop')
      expect(names).toContain('wide')
    })

    it('should have correct mobile viewport settings', () => {
      const mobile = defaultViewports.find(v => v.name === 'mobile')
      expect(mobile?.isMobile).toBe(true)
      expect(mobile?.hasTouch).toBe(true)
      expect(mobile?.width).toBe(375)
    })

    it('should have correct desktop viewport settings', () => {
      const desktop = defaultViewports.find(v => v.name === 'desktop')
      expect(desktop?.isMobile).toBe(false)
      expect(desktop?.hasTouch).toBe(false)
      expect(desktop?.width).toBe(1280)
    })
  })

  describe('Story Testing', () => {
    it('should create story tester', () => {
      const tester = createStoryTester()
      expect(tester.addStory).toBeDefined()
      expect(tester.getStories).toBeDefined()
      expect(tester.testStory).toBeDefined()
    })

    it('should register stories', () => {
      const tester = createStoryTester()

      tester.addStory({
        name: 'default',
        component: 'Button',
        render: () => '<button>Click</button>',
      })

      tester.addStory({
        name: 'primary',
        component: 'Button',
        render: () => '<button class="primary">Click</button>',
      })

      expect(tester.getStories()).toHaveLength(2)
    })

    it('should get stories for component', () => {
      const tester = createStoryTester()

      tester.addStories([
        { name: 'default', component: 'Button', render: () => '<button>Click</button>' },
        { name: 'primary', component: 'Button', render: () => '<button class="primary">Click</button>' },
        { name: 'default', component: 'Input', render: () => '<input />' },
      ])

      const buttonStories = tester.getStoriesForComponent('Button')
      expect(buttonStories).toHaveLength(2)

      const inputStories = tester.getStoriesForComponent('Input')
      expect(inputStories).toHaveLength(1)
    })

    it('should test a story', async () => {
      const tester = createStoryTester({ snapshotDir })

      tester.addStory({
        name: 'default',
        component: 'Button',
        render: () => '<button>Test Button</button>',
      })

      const result = await tester.testStory('Button/default')

      expect(result.name).toBe('Button/default')
      expect(result.passed).toBe(true)
      expect(result.snapshots).toHaveLength(1)
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should return error for unknown story', async () => {
      const tester = createStoryTester()

      const result = await tester.testStory('Unknown/story')

      expect(result.passed).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('not found')
    })

    it('should test all stories', async () => {
      const tester = createStoryTester({ snapshotDir })

      tester.addStories([
        { name: 'a', component: 'Comp', render: () => '<div>A</div>' },
        { name: 'b', component: 'Comp', render: () => '<div>B</div>' },
      ])

      const results = await tester.testAllStories()

      expect(results).toHaveLength(2)
      expect(results.every(r => r.passed)).toBe(true)
    })

    it('should generate story index', async () => {
      const tester = createStoryTester()

      tester.addStories([
        { name: 'default', component: 'Button', render: () => '', args: { label: 'Click' } },
        { name: 'large', component: 'Button', render: () => '', args: { size: 'lg' } },
        { name: 'default', component: 'Input', render: () => '' },
      ])

      const index = await tester.generateStoryIndex()
      const parsed = JSON.parse(index)

      expect(parsed.Button).toHaveLength(2)
      expect(parsed.Input).toHaveLength(1)
      expect(parsed.Button[0].args.label).toBe('Click')
    })
  })

  describe('Report Generation', () => {
    it('should generate JSON report', async () => {
      const results = [
        {
          name: 'test-1',
          passed: true,
          duration: 100,
          snapshots: [],
          screenshots: [],
          errors: [],
        },
        {
          name: 'test-2',
          passed: false,
          duration: 50,
          snapshots: [],
          screenshots: [],
          errors: [new Error('Test failed')],
        },
      ]

      const reportPath = await generateReport(results, {
        outputDir: testDir,
        format: 'json',
      })

      expect(fs.existsSync(reportPath)).toBe(true)

      const report = JSON.parse(await Bun.file(reportPath).text())
      expect(report.summary.total).toBe(2)
      expect(report.summary.passed).toBe(1)
      expect(report.summary.failed).toBe(1)
    })

    it('should generate Markdown report', async () => {
      const results = [
        {
          name: 'Button',
          passed: true,
          duration: 100,
          snapshots: [{ passed: true, snapshotPath: 'button.html' }],
          screenshots: [],
          errors: [],
        },
      ]

      const reportPath = await generateReport(results, {
        outputDir: testDir,
        format: 'markdown',
        title: 'Test Report',
      })

      expect(reportPath).toContain('.md')

      const content = await Bun.file(reportPath).text()
      expect(content).toContain('# Test Report')
      expect(content).toContain('Button')
      expect(content).toContain('Passed: 1')
    })

    it('should generate HTML report', async () => {
      const results = [
        {
          name: 'Component Test',
          passed: true,
          duration: 50,
          snapshots: [],
          screenshots: [],
          errors: [],
        },
      ]

      const reportPath = await generateReport(results, {
        outputDir: testDir,
        format: 'html',
      })

      expect(reportPath).toContain('.html')

      const content = await Bun.file(reportPath).text()
      expect(content).toContain('<!DOCTYPE html>')
      expect(content).toContain('Component Test')
    })
  })

  describe('Convenience Functions', () => {
    it('should use default tester for snapshot()', async () => {
      // Override snapshot dir for testing
      const result = await snapshot('<div>Quick Test</div>', 'quick-test')
      expect(result).toBeDefined()
      expect(result.passed).toBe(true)
    })

    it('should use default tester for snapshotJson()', async () => {
      const result = await snapshotJson({ test: true }, 'quick-json')
      expect(result).toBeDefined()
      expect(result.passed).toBe(true)
    })
  })
})
