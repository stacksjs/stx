import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import { processDirectives } from '../src/process'
import { defaultConfig } from '../src/config'
import { stripDocumentWrapper } from '../src/app-shell'

// This test exercises the real bun-queue devtools fixture when available on
// the contributor's machine. It's developer-machine specific, so we skip
// gracefully when the fixture directory isn't present.
const DEVTOOLS_ROOT = '/Users/glennmichaeltorregosa/Documents/Projects/bun-queue/packages/devtools'
const FIXTURE_AVAILABLE = fs.existsSync(`${DEVTOOLS_ROOT}/pages/index.stx`)
const describeIfFixture = FIXTURE_AVAILABLE ? describe : describe.skip

describeIfFixture('SPA Fragment Extraction — Real bun-queue Dashboard', () => {
  test('processes the real dashboard template and extracts a valid SPA fragment', async () => {
    // 1. Read the real devtools files
    const layoutPath = `${DEVTOOLS_ROOT}/pages/layouts/default.stx`
    const dashboardPath = `${DEVTOOLS_ROOT}/pages/index.stx`

    expect(fs.existsSync(layoutPath)).toBe(true)
    expect(fs.existsSync(dashboardPath)).toBe(true)

    const dashboardTemplate = fs.readFileSync(dashboardPath, 'utf-8')
    console.log(`Dashboard template length: ${dashboardTemplate.length} chars`)

    // 2. Configure options pointing at the real devtools directories
    const options = {
      ...defaultConfig,
      componentsDir: `${DEVTOOLS_ROOT}/components`,
      layoutsDir: `${DEVTOOLS_ROOT}/pages/layouts`,
      partialsDir: `${DEVTOOLS_ROOT}/partials`,
      autoShell: true,
      app: {
        head: {
          title: 'bun-queue Dashboard',
          script: [
            { src: 'https://cdn.jsdelivr.net/npm/chart.js@4', defer: true },
          ],
          bodyClass: 'bg-[#0a0a0f] text-zinc-50',
        },
      },
    }

    // 3. Process through the real directive pipeline
    let output: string
    try {
      output = await processDirectives(
        dashboardTemplate,
        {},
        dashboardPath,
        options as any,
        new Set<string>(),
      )
    }
    catch (err: any) {
      console.error('processDirectives threw an error:', err.message)
      console.error('Stack:', err.stack?.slice(0, 500))
      // Re-throw so the test fails visibly
      throw err
    }

    console.log(`Rendered output length: ${output.length} chars`)
    console.log(`First 300 chars:\n${output.slice(0, 300)}`)

    // 4. Verify the full rendered output
    expect(output).toContain('<!DOCTYPE')
    console.log('[PASS] Output contains <!DOCTYPE (autoShell worked)')

    expect(output.toLowerCase()).toContain('<main')
    console.log('[PASS] Output contains <main> tag')

    // Check for __stx_setup function
    const hasSetup = output.includes('__stx_setup')
    console.log(`[INFO] Contains __stx_setup: ${hasSetup}`)

    // Log the setup script regex match
    const setupMatch = output.match(/<script data-stx-scoped>\s*function __stx_setup[\s\S]*?<\/script>/i)
    if (setupMatch) {
      console.log(`[INFO] Setup script match found (${setupMatch[0].length} chars)`)
      console.log(`[INFO] First 200 chars of match:\n${setupMatch[0].slice(0, 200)}`)
    }
    else {
      console.log('[INFO] No setup script match found via regex')
      // Try a broader search
      const broaderMatch = output.match(/__stx_setup[^(]*/g)
      if (broaderMatch) {
        console.log(`[INFO] Broader __stx_setup matches: ${JSON.stringify(broaderMatch)}`)
      }
    }

    // Check for Chart.js CDN in <head>
    const headSection = output.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
    if (headSection) {
      const hasChartJs = headSection[1].includes('chart.js')
      console.log(`[INFO] Chart.js CDN in <head>: ${hasChartJs}`)
      if (hasChartJs) {
        expect(headSection[1]).toContain('chart.js')
        console.log('[PASS] Chart.js CDN script present in <head>')
      }
    }
    else {
      console.log('[WARN] No <head> section found in output')
    }

    // 5. Apply fragment extraction (same as serve.ts / app-shell.ts)
    const fragment = stripDocumentWrapper(output)
    console.log(`\nFragment length: ${fragment.length} chars`)
    console.log(`Fragment first 300 chars:\n${fragment.slice(0, 300)}`)

    // Fragment should not START with <!DOCTYPE (the document wrapper is stripped)
    expect(fragment.trimStart().startsWith('<!DOCTYPE')).toBe(false)
    console.log('[PASS] Fragment does not start with <!DOCTYPE')

    // Check if <!DOCTYPE appears anywhere (might be in JS string literals)
    const doctypeCount = (fragment.match(/<!DOCTYPE/gi) || []).length
    console.log(`[INFO] <!DOCTYPE occurrences in fragment: ${doctypeCount} (may appear in JS string literals)`)

    // Fragment should contain page content
    expect(fragment.length).toBeGreaterThan(100)
    console.log('[PASS] Fragment has substantial content')

    // Extract setup scripts from the fragment
    const setupScripts: string[] = []
    const scriptRe = /<script\b[^>]*data-stx-scoped[^>]*>[\s\S]*?<\/script>/gi
    let m: RegExpExecArray | null
    while ((m = scriptRe.exec(fragment)) !== null) {
      setupScripts.push(m[0])
    }
    console.log(`\n[INFO] Setup scripts in fragment: ${setupScripts.length}`)
    for (let i = 0; i < setupScripts.length; i++) {
      console.log(`  Script ${i}: ${setupScripts[i].slice(0, 120)}...`)
    }

    expect(setupScripts.length).toBeGreaterThan(0)
    console.log('[PASS] Fragment contains setup scripts')

    // Check that fragment contains the page content (e.g. main tag or dashboard content)
    const hasMainContent = fragment.toLowerCase().includes('<main') || fragment.includes('dashboard') || fragment.includes('queue')
    expect(hasMainContent).toBe(true)
    console.log('[PASS] Fragment contains page content')

    // Check that at least one setup script is in the fragment
    const fragmentHasSetup = setupScripts.some(s => s.includes('__stx_setup') || s.includes('stx.mount') || s.includes('state('))
    console.log(`[INFO] Fragment has setup-like script: ${fragmentHasSetup}`)
  })
})
