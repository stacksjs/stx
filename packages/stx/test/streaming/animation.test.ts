import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

// Helper function to read built HTML file
async function getHtmlOutput(result: any): Promise<string> {
  expect(result.success).toBe(true)
  const htmlOutput = result.outputs.find((o: any) => o.path.endsWith('.html'))
  expect(htmlOutput).toBeDefined()
  return await Bun.file(htmlOutput!.path).text()
}

// Ensure test directories exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

describe('Animation System', () => {
  // Test @transition directive
  it('should process @transition directive correctly', async () => {
    const testFile = path.join(TEMP_DIR, 'transition.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transition Test</title>
        <script>
          module.exports = {
            showContent: true,
          };
        </script>
      </head>
      <body>
        @transition('fade', 300, 'ease-in-out', 0, 'in')
          <div id="fade-transition">This should fade in</div>
        @endtransition

        @transition('slide')
          <div id="slide-transition">This should slide in with default params</div>
        @endtransition
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for transition elements
    expect(outputHtml).toContain('stx-transition')
    expect(outputHtml).toContain('<div id="fade-transition">This should fade in</div>')
    expect(outputHtml).toContain('<div id="slide-transition">This should slide in with default params</div>')
  })

  // Test @scrollAnimate directive
  it('should process @scrollAnimate directive correctly', async () => {
    const testFile = path.join(TEMP_DIR, 'scroll-animate.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scroll Animation Test</title>
        <script>
          module.exports = {
            showContent: true,
          };
        </script>
      </head>
      <body>
        @scrollAnimate('fade', 500, 'ease-out', 0.2)
          <div id="fade-element">This should fade in when scrolled into view</div>
        @endscrollAnimate

        @scrollAnimate('slide-up', 600, 'ease-in-out', 0.1, 100)
          <div id="slide-element">This should slide up with 100ms delay when scrolled into view</div>
        @endscrollAnimate
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for intersection observer and scroll animation elements
    expect(outputHtml).toContain('IntersectionObserver')
    expect(outputHtml).toContain('stx-observe')
    expect(outputHtml).toContain('stx-out')
    expect(outputHtml).toContain('<div id="fade-element">This should fade in when scrolled into view</div>')
    expect(outputHtml).toContain('<div id="slide-element">This should slide up with 100ms delay when scrolled into view</div>')
  })

  // Test @animationGroup directive
  it('should process @animationGroup directive correctly', async () => {
    const testFile = path.join(TEMP_DIR, 'animation-group.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Animation Group Test</title>
        <script>
          module.exports = {
            elements: ["header", "main", "footer"],
            staggerDelay: 100,
            sequence: true
          };
        </script>
      </head>
      <body>
        <div id="header">Header</div>
        <div id="main">Main Content</div>
        <div id="footer">Footer</div>

        @animationGroup('page-intro', '#header', '#main', '#footer')
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for animation group script
    expect(outputHtml).toContain('Animation Group: page-intro')
    expect(outputHtml).toContain('["#header","#main","#footer"]')
  })

  // Test @motion directive for motion preferences respect
  it('should process @motion directive correctly', async () => {
    const testFile = path.join(TEMP_DIR, 'motion.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Motion Preferences Test</title>
        <script>
          module.exports = {
            respectPreferences: true
          };
        </script>
      </head>
      <body>
        @motion(true)
          <div class="animated-content">
            This content should respect user's motion preferences.
          </div>
        @endmotion

        @motion(false)
          <div class="always-animated-content">
            This content will always animate regardless of preferences.
          </div>
        @endmotion
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for motion preferences handling
    expect(outputHtml).toContain('data-animate="auto"')
    expect(outputHtml).toContain('data-animate="true"')
    expect(outputHtml).toContain('prefersReducedMotion')
    expect(outputHtml).toContain('--stx-transition-duration')
  })

  // Test animation styles injection
  it('should inject animation base styles', async () => {
    const testFile = path.join(TEMP_DIR, 'animation-styles.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Animation Styles Test</title>
        <script>
          module.exports = {};
        </script>
      </head>
      <body>
        <div>Test content</div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for base animation styles
    expect(outputHtml).toContain('stx-animation-base')
    expect(outputHtml).toContain('--stx-transition-duration')
    expect(outputHtml).toContain('@media (prefers-reduced-motion: reduce)')
    expect(outputHtml).toContain('stx-from-bottom')
    expect(outputHtml).toContain('stx-from-top')
    expect(outputHtml).toContain('stx-from-left')
    expect(outputHtml).toContain('stx-from-right')
  })
})
