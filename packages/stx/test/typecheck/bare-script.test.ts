/**
 * A bare `<script>` is checked, exactly as `<script client>` is (stacksjs/stx#1920).
 *
 * `extractScriptBlocks` reports a tag with no attribute as `plain`, and the
 * checker dropped every `plain` block as "not part of the authored TS surface".
 * That is the one script form nobody writes an attribute for, and therefore the
 * most common one in the wild: `storage/framework/defaults` shipped **18 blocks
 * that could not parse**, across many releases, and typecheck reported the 2
 * that happened to say `client`. Sixteen components were dead on arrival for
 * anyone scaffolding from defaults, and the tool whose job is to catch that
 * reported success.
 *
 * The report is worse than a miss: the file is still counted, so the summary
 * reads `Checked 0 script block(s) … in 1 file(s) — 0 error(s)` for a file that
 * plainly has one, and "0 errors" over an unchecked block is indistinguishable
 * from a pass.
 *
 * ## Which context a bare block is checked in
 *
 * As a client block. `client` is an explicit alias for the default — the
 * framework's own rule is that ONLY `<script server>` runs on the server — so
 * the bare form and the `client` form are the same thing and are checked the
 * same way. The distinction is not academic: a client block also receives the
 * server-to-client payload declarations, so checking a bare block as a server
 * block would invent "Cannot find name" on every value crossing the bridge.
 *
 * Measured on a 42-file corpus: the newly-checked blocks produced 353
 * diagnostics and NOT ONE of them was TS2304 "Cannot find name", while the
 * client blocks already in the run produced 47. Wrong context, and that number
 * would have dominated.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { formatTypecheckDiagnostics, typecheckStxFiles } from '../../src/typecheck'

// Outside the repo on purpose: a fixture inside it is reached by this
// repository's own tsconfig, so tsc reports unrelated errors and the fixture
// stops testing what it says it tests.
const dir = join(tmpdir(), `stx-bare-${crypto.randomUUID()}`)

/** Write a page and check it, cleaning up whatever the assertion does. */
async function check(name: string, source: string): Promise<Awaited<ReturnType<typeof typecheckStxFiles>>> {
  const file = join(dir, name)
  await Bun.write(file, source)
  return typecheckStxFiles([file], { templates: false })
}

const BROKEN_BODY = 'const broken = ((('

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

describe('a bare <script> is a checked block', () => {
  it('reports a syntax error the `client` and `server` forms both report', async () => {
    // Byte-identical but for the opening tag. Whatever the checker does with
    // one, it has to do with all three, because they are the same block.
    const [bare, client, server] = await Promise.all([
      check('bare.stx', `<script>\n${BROKEN_BODY}\n</script>\n<div>hi</div>`),
      check('client.stx', `<script client>\n${BROKEN_BODY}\n</script>\n<div>hi</div>`),
      check('server.stx', `<script server>\n${BROKEN_BODY}\n</script>\n<div>hi</div>`),
    ])

    expect(bare.blockCount).toBe(1)
    expect(bare.diagnostics.length).toBeGreaterThan(0)

    // The equivalence, stated as such: same count of blocks, same verdict.
    expect(client.blockCount).toBe(bare.blockCount)
    expect(server.blockCount).toBe(bare.blockCount)
    expect(client.diagnostics.length).toBeGreaterThan(0)
    expect(server.diagnostics.length).toBeGreaterThan(0)
  })

  it('counts the block, so the summary cannot read as a pass over nothing', async () => {
    // The reported shape was `Checked 0 script block(s) … in 1 file(s)`: the
    // file counted, the block did not. A zero here is the silent half.
    const result = await check('counted.stx', `<script>\nconst n: number = 1\n</script>`)

    expect(result.blockCount).toBe(1)
    expect(result.checkedFiles).toHaveLength(1)
  })

  it('type-checks it, not merely parses it', async () => {
    // A syntax error alone would be satisfied by handing the body to a parser.
    // This needs the block to reach the type checker with the real globals.
    const result = await check('semantic.stx', `<script>\nconst n: number = "definitely a string"\n</script>`)

    expect(result.diagnostics.map(d => d.code)).toContain(2322)
  })

  it('names the tag the author wrote, not the checker\'s internal kind', async () => {
    // `plain` is this checker's word. Printing `<script plain>` would point the
    // author at a tag that does not exist.
    const result = await check('named.stx', `<script>\nconst n: number = "nope"\n</script>`)
    const rendered = formatTypecheckDiagnostics(result.diagnostics)

    expect(rendered).toContain('[<script>]')
    expect(rendered).not.toContain('plain')
  })

  it('is governed by the client switch, since that is what it is', async () => {
    const file = join(dir, 'switched.stx')
    await Bun.write(file, `<script>\nconst n: number = "nope"\n</script>`)

    const off = await typecheckStxFiles([file], { templates: false, client: false })
    expect(off.blockCount).toBe(0)
    expect(off.diagnostics).toHaveLength(0)

    // And is not swept up by the server switch, which would make `--no-server`
    // silently stop checking client code.
    const serverOff = await typecheckStxFiles([file], { templates: false, server: false })
    expect(serverOff.blockCount).toBe(1)
  })

  it('still ignores a block that carries no JavaScript', async () => {
    // The existing exclusions are about CONTENT, not about the attribute being
    // absent — widening `plain` must not drag these in.
    const result = await check('nonjs.stx', `<script type="application/ld+json">
{ "@context": "https://schema.org" }
</script>
<script src="/vendor.js"></script>`)

    expect(result.blockCount).toBe(0)
  })
})
