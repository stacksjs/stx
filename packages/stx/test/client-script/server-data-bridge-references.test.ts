/**
 * The server→client bridge publishes what the client REFERENCES, not what it
 * happens to mention (stacksjs/stx#1831).
 *
 * Every top-level server binding is a bridge candidate, and publication was
 * decided by testing `\bname\b` against the raw client script. `code` is
 * unparsed text, so a comment, a URL segment, a CSS class and an English
 * sentence all counted as references — and the value went into the response
 * BODY whether or not any client code could use it.
 *
 * In a real app that put a raw session token and every project's API key into
 * the page source:
 *
 *   - `token`    — the client called `useStore('session').token()`, so the
 *                  word matched via an unrelated PROPERTY.
 *   - `projects` — the client built the URL `` `/api/projects/${id}` ``.
 *   - `logs`     — the word appeared in a COMMENT.
 *
 * None was referenced by client code. All three shipped.
 *
 * Why it is a security bug and not just waste: it is invisible at the call
 * site (the author writes the ordinary `const token = cookie(...)`), the
 * trigger is untyped text (adding a comment can start publishing a secret, and
 * that reads as a docs change in review), and the response body travels where a
 * cookie does not — HAR exports on support tickets, "save page as", disk cache,
 * session-replay tools, screenshots of view-source. It also defeats deliberate
 * masking: the app's `maskKey()` projection was published alongside the
 * unmasked source rows.
 *
 * The tests below fix the leak in both directions. Withholding a value the
 * client genuinely uses is its own outage — the client throws on an undefined
 * name — so the positive cases matter as much as the negative ones.
 */
import { describe, expect, it, spyOn } from 'bun:test'
import { extractBridgeData, generateServerDataBridge, stripCommentsAndLiterals } from '../../src/client-script'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

/** Is `value` published into the page for this client script? */
function bridges(code: string, data: Record<string, unknown> = { value: 'SECRET' }): boolean {
  return generateServerDataBridge(code, data).includes('var value =')
}

describe('the three reported leaks', () => {
  it('does not publish a token named only by an unrelated property', () => {
    const code = `const session = useStore('session')\nconst who = session.token()`
    const out = generateServerDataBridge(code, { token: 'deadbeefcafe' })

    expect(out).not.toContain('deadbeefcafe')
  })

  it('does not publish a value named only inside a URL', () => {
    const code = 'async function load(id) { return fetch(`/api/projects/${id}`) }'
    const out = generateServerDataBridge(code, { projects: [{ ingest_key: 'loghq_secret' }] })

    expect(out).not.toContain('loghq_secret')
  })

  it('does not publish a value named only in a comment', () => {
    const code = '// a fragment swap would repaint the old project\'s logs\nconst n = state(0)'
    const out = generateServerDataBridge(code, { logs: [{ payload: 'customer data' }] })

    expect(out).not.toContain('customer data')
  })
})

describe('values the client really uses still cross', () => {
  // Withholding one of these is an outage: the generated client code reads a
  // name that was never declared.
  it('bridges a bare reference', () => {
    expect(bridges('const n = state(value)')).toBe(true)
  })

  it('bridges a value read inside a template interpolation', () => {
    // `${...}` is code. Blanking it with the surrounding literal would withhold
    // every value used only to build a URL — the single likeliest shape.
    expect(bridges('fetch(`/api/users/${value}`)')).toBe(true)
  })

  it('bridges through nested interpolations', () => {
    expect(bridges('const u = `a${ `b${value}` }c`')).toBe(true)
  })

  it('bridges when a brace hides inside a string in the interpolation', () => {
    expect(bridges('const u = `${ ok ? "}" : value }`')).toBe(true)
  })

  it('bridges object shorthand', () => {
    expect(bridges('const o = { value }')).toBe(true)
  })

  it('bridges when only a property of it is read', () => {
    // `value.deep` reads the binding; it is `x.value` that does not.
    expect(bridges('const x = value.deep.field')).toBe(true)
  })
})

describe('a mention is not a reference', () => {
  it('ignores line and block comments', () => {
    expect(bridges('// we should show the value here\nconst n = 1')).toBe(false)
    expect(bridges('/* value */ const n = 1')).toBe(false)
  })

  it('ignores string literals', () => {
    expect(bridges('const s = "the value is secret"')).toBe(false)
    expect(bridges('fetch(`/api/value/1`)')).toBe(false)
  })

  it('ignores property access, optional chaining and private fields', () => {
    expect(bridges('const t = session.value()')).toBe(false)
    expect(bridges('const t = session?.value')).toBe(false)
    expect(bridges('class A { #value = 1; get x() { return this.#value } }')).toBe(false)
  })

  it('ignores a name that appears nowhere', () => {
    expect(bridges('const n = state(0)')).toBe(false)
  })
})

describe('the __ prefix is the opt-out', () => {
  it('never bridges a __-prefixed binding, through the real pipeline', () => {
    // The escape hatch an author is told to rely on for a credential, so it is
    // tested where it actually runs: extractBridgeData is what the server
    // context passes through before the bridge is generated.
    const serverData = extractBridgeData({ __token: 'deadbeefcafe', greeting: 'hi' })
    const out = generateServerDataBridge('const a = __token\nconst b = greeting', serverData)

    expect(out).not.toContain('deadbeefcafe')
    expect(out).toContain('greeting')
  })

  it('holds at the emitter too, whichever path assembled the data', () => {
    const out = generateServerDataBridge('const x = __token', { __token: 'deadbeefcafe' })

    expect(out).not.toContain('deadbeefcafe')
  })
})

describe('end to end, through a real render', () => {
  // The unit tests above call the bridge directly. This one renders a page, so
  // it covers the path that actually ships: server script → extractBridgeData →
  // generateServerDataBridge → HTML.
  async function render(template: string): Promise<string> {
    return processDirectives(
      template,
      {},
      '/app/page.stx',
      { ...defaultConfig, partialsDir: '/tmp', componentsDir: '/tmp', autoShell: true } as never,
      new Set<string>(),
    )
  }

  it('keeps a secret out of the page while sending what is used', async () => {
    // The property-access shape, because it is the one that survives every
    // transformation on the way here. A comment is a weaker e2e fixture than it
    // looks: this path transpiles the client script first, so comments are
    // already gone by the time the bridge reads it, and the assertion would
    // pass with or without the fix. The unit tests above cover the comment and
    // string cases against the bridge directly, which is where they bite.
    //
    // Verified non-vacuous: at the parent commit this renders the token into
    // the page, and `posts` crosses either way.
    const out = await render(`<script server>
const token = 'tok_deadbeefcafe'
const posts = [{ id: 1, title: 'Hello' }]
</script>
<script client>
  const items = state(posts)
  const who = useStore('session').token()
</script>
<main><span :text="items"></span></main>`)

    expect(out).not.toContain('tok_deadbeefcafe')
    expect(out).toContain('"title":"Hello"')
  })

  it('sends a value used only to build a URL', async () => {
    // The likeliest legitimate shape, and the one a naive literal-strip breaks.
    const out = await render(`<script server>
const userId = 'u_12345'
</script>
<script client>
  onMount(() => fetch(\`/api/users/\${userId}\`))
</script>
<main>hi</main>`)

    expect(out).toContain('u_12345')
  })
})

describe('warnings for what still gets through', () => {
  /** Capture warnings emitted while generating a bridge. */
  function warningsFor(code: string, data: Record<string, unknown>): string[] {
    const spy = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      generateServerDataBridge(code, data)
      return spy.mock.calls.map(call => String(call[0]))
    }
    finally {
      spy.mockRestore()
    }
  }

  it('warns when a credential-shaped name is published', () => {
    // Tightening the matcher cannot help when the client genuinely references
    // the name — that is a real reference, and the value really does ship. A
    // warning is the only thing left, and it names the __ escape hatch.
    const warnings = warningsFor('const t = apiSecretForWarning', { apiSecretForWarning: 'x' })

    expect(warnings.join('\n')).toContain('apiSecretForWarning')
    expect(warnings.join('\n')).toContain('__')
  })

  it('warns when a bridged payload is large', () => {
    const big = Array.from({ length: 4000 }, (_, i) => ({ i, pad: 'xxxxxxxxxx' }))
    const warnings = warningsFor('const r = bigRowsForWarning', { bigRowsForWarning: big })

    expect(warnings.join('\n')).toMatch(/KB/)
  })

  it('stays quiet for an ordinary value', () => {
    expect(warningsFor('const g = plainGreetingForWarning', { plainGreetingForWarning: 'hi' })).toEqual([])
  })

  it('says nothing about a value it withheld', () => {
    // No publication, no warning — otherwise every comment mentioning "token"
    // would produce a security warning about a value that never shipped.
    expect(warningsFor('// nothing to do with tokenNeverBridged\nconst n = 1', { tokenNeverBridged: 'x' })).toEqual([])
  })
})

describe('stripCommentsAndLiterals', () => {
  it('keeps interpolations and blanks the text around them', () => {
    expect(stripCommentsAndLiterals('const u = `/api/x/${userId}/y`'))
      .toBe('const u =           userId    ')
  })

  it('preserves length and line structure', () => {
    // Offsets line up, which the other caller depends on.
    for (const sample of [
      'const u = `a${ `b${c}` }d`',
      'x /* c */ + "s" + `t${y}`',
      '`${ a ? "}" : b }`',
      'a\n// c\nb',
    ]) {
      const out = stripCommentsAndLiterals(sample)
      expect(out).toHaveLength(sample.length)
      expect(out.split('\n')).toHaveLength(sample.split('\n').length)
    }
  })
})
