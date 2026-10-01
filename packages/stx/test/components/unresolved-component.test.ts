/**
 * An unresolved component leaves a comment, not a stack trace and the
 * machine's directory layout.
 *
 * The renderer returned the ENOENT message AND every absolute path it had
 * searched, as visible text in the document:
 *
 *   [Error loading component: ENOENT: no such file or directory, open 'skeleton']
 *   Searched paths:
 *     - /…/resources/views/components/skeleton.stx
 *     … 24 more absolute paths …
 *
 * HTTP 200, nothing in the browser console, nothing in the dev server output,
 * build succeeded. So the page looked broken to whoever was reading it, leaked
 * the developer's directory layout to them, and gave the developer no signal
 * at all except by reading the rendered HTML (stacksjs/stx#2004).
 *
 * The paths are genuinely useful - they are how you see that a name resolved
 * under `components/` but not under `views/components/` - so they are kept, on
 * the channel where the person who can act on them is looking.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'

let errors: string[]
let originalError: typeof console.error

beforeEach(() => {
  errors = []
  originalError = console.error
  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' '))
  }
})

afterEach(() => {
  console.error = originalError
})

/** A fresh empty components dir per case, so nothing resolves and the memo cannot cross tests. */
async function renderInEmptyProject(markup: string): Promise<string> {
  const dir = `${import.meta.dir}/.tmp-unresolved-${crypto.randomUUID()}`
  await Bun.write(path.join(dir, 'components', '.keep'), '')

  try {
    return await processDirectives(
      markup,
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve', cache: false } as any,
      new Set<string>(),
    )
  }
  finally {
    await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
  }
}

/** The document without the runtime, which legitimately contains paths. */
function markup(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

describe('a component that cannot be resolved (#2004)', () => {
  it('renders nothing a reader can see', async () => {
    const html = markup(await renderInEmptyProject('<section><Skeleton /></section>'))

    expect(html).not.toContain('Error loading component')
    expect(html).not.toContain('ENOENT')
    expect(html).not.toContain('Searched paths')
  })

  it('never puts a filesystem path in the document', async () => {
    const html = markup(await renderInEmptyProject('<section><Skeleton /></section>'))

    // The leak this closes: 26 absolute paths of the rendering machine, shipped
    // to whoever loaded the page.
    expect(html).not.toMatch(/\/(?:private|Users|home|var|root)\//)
    expect(html).not.toContain('.stx')
  })

  it('leaves the name behind in a comment, so the HTML still says what is missing', async () => {
    const html = markup(await renderInEmptyProject('<section><Skeleton /></section>'))

    expect(html).toContain('<!-- stx: component "skeleton" could not be resolved')

    /*
     * A comment, so it is findable in source and invisible in the page: with
     * comments and tags removed there is no text left inside the section. The
     * old output put a paragraph of it there.
     */
    const visible = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]*>/g, '')
      .trim()

    expect(visible).toBe('')
  })

  it('tells the operator, with the paths it searched', async () => {
    await renderInEmptyProject('<section><Skeleton /></section>')

    const reported = errors.filter(line => line.includes('could not be resolved'))

    expect(reported.length).toBe(1)
    expect(reported[0]).toContain('skeleton')
    expect(reported[0]).toContain('searched:')
    // The paths belong here, where someone can act on them.
    expect(reported[0]).toContain('.stx')
  })

  it('names the file that used it, which is what you actually need', async () => {
    await renderInEmptyProject('<section><Skeleton /></section>')

    expect(errors.find(line => line.includes('could not be resolved'))).toContain('page.stx')
  })

  it('says it once, not once per use', async () => {
    await renderInEmptyProject('<ul><Skeleton /><Skeleton /><Skeleton /></ul>')

    expect(errors.filter(line => line.includes('could not be resolved')).length).toBe(1)
  })

  it('still renders everything around it', async () => {
    const html = markup(await renderInEmptyProject('<section><h1>Kept</h1><Skeleton /><p>Also kept</p></section>'))

    expect(html).toContain('Kept')
    expect(html).toContain('Also kept')
  })
})
