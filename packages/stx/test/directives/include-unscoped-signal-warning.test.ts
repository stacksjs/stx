/**
 * "declares signals but has no element to scope them to" is for partials that
 * really declare signals.
 *
 * A partial that is nothing but a plain `<script>` (an IntersectionObserver
 * for reveal-on-scroll, a theme toggle) goes through the non-signal branch,
 * which also mints a scope id so `useRef` and friends have somewhere to bind.
 * The warning read that id as "this partial has signals", so a layout partial
 * with no markup and no signals was warned about on every render of every
 * page. It also repeated per render when it did apply; once per file is
 * enough to be read.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { resetUnscopedSignalWarnings } from '../../src/includes'
import { processDirectives } from '../../src/process'

let dir = ''

const PLAIN_SCRIPT = `{{-- One observer for the page. --}}
<script>
  ;(function () {
    if (window.__reveal) return
    window.__reveal = true
    document.documentElement.classList.add('js-reveal')
  })()
</script>
`

const SIGNAL_SCRIPT = `<script>
  const count = state(0)
</script>
`

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-unscoped-signal-'))
  await Bun.write(path.join(dir, 'partials', 'reveal-script.stx'), PLAIN_SCRIPT)
  await Bun.write(path.join(dir, 'partials', 'counter-script.stx'), SIGNAL_SCRIPT)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

afterEach(() => {
  resetUnscopedSignalWarnings()
})

async function renderCapturingWarnings(template: string, times = 1): Promise<{ html: string, warnings: string[] }> {
  const warnings: string[] = []
  const realWarn = console.warn
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  let html = ''
  try {
    for (let i = 0; i < times; i++) {
      html = await processDirectives(
        template,
        {},
        path.join(dir, 'page.stx'),
        { ...defaultConfig, partialsDir: path.join(dir, 'partials'), componentsDir: dir } as any,
        new Set<string>(),
      )
    }
  }
  finally {
    console.warn = realWarn
  }
  return { html, warnings: warnings.filter(w => w.includes('no element to scope them to')) }
}

describe('unscoped signal partial warning', () => {
  it('stays quiet for a script-only partial that uses no signals', async () => {
    const { html, warnings } = await renderCapturingWarnings(`<main>@include('reveal-script')</main>`, 3)

    // The script still ships.
    expect(html).toContain('js-reveal')
    expect(warnings).toEqual([])
  })

  it('still warns for a script-only partial that declares signals', async () => {
    const { warnings } = await renderCapturingWarnings(`<main>@include('counter-script')</main>`)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('counter-script.stx')
  })

  it('warns once per file, not once per render', async () => {
    const { warnings } = await renderCapturingWarnings(`<main>@include('counter-script')</main>`, 4)

    expect(warnings).toHaveLength(1)
  })
})
