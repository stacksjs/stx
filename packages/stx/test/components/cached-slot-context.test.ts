/**
 * Cached component output must be isolated by the caller data its slots read.
 *
 * The cache originally keyed the literal slot source. Two renders of
 * `<Card>{{ account.name }}</Card>` therefore shared one entry even though the
 * caller resolved that expression to different text before the fragment was
 * returned. The second request received the first request's name and optional
 * sections. These tests keep the page source fixed and vary only its render
 * context, which is the boundary that failed in stacksjs/stx#2055.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { renderView } from '../../src/build-views'
import { clearDevCaches } from '../../src/caching'

const made: string[] = []

afterEach(() => {
  clearDevCaches()
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

function project(page: string): { page: string, componentsDir: string, root: string } {
  const root = mkdtempSync(path.join(tmpdir(), 'stx-cached-slot-'))
  made.push(root)
  const componentsDir = path.join(root, 'components')
  mkdirSync(componentsDir, { recursive: true })
  writeFileSync(
    path.join(componentsDir, 'Card.stx'),
    `<script server cache>\nconst tone = $props.tone || 'plain'\n</script>\n<section class="{{ tone }}"><header><slot name="title" /></header><main><slot /></main></section>`,
  )
  writeFileSync(
    path.join(componentsDir, 'Badge.stx'),
    `<script server cache>\nconst kind = $props.kind || 'default'\n</script>\n<strong data-kind="{{ kind }}"><slot /></strong>`,
  )
  const pagePath = path.join(root, 'page.stx')
  writeFileSync(pagePath, page)
  return { page: pagePath, componentsDir, root }
}

async function render(
  fixture: ReturnType<typeof project>,
  account: Record<string, unknown>,
): Promise<string> {
  return renderView(fixture.page, { account }, {
    root: fixture.root,
    componentsDir: fixture.componentsDir,
  })
}

describe('cached component caller-slot isolation', () => {
  it('still reuses a fragment when the caller data is unchanged', async () => {
    const fixture = project(`<Memo>{{ account.name }}</Memo>`)
    writeFileSync(
      path.join(fixture.componentsDir, 'Memo.stx'),
      `<script server cache>
globalThis.__cachedSlotRenders = (globalThis.__cachedSlotRenders || 0) + 1
</script>
<aside><slot /></aside>`,
    )
    ;(globalThis as any).__cachedSlotRenders = 0
    const account = { name: 'Same Runner' }

    const first = await render(fixture, account)
    const second = await render(fixture, account)

    expect(second).toBe(first)
    expect((globalThis as any).__cachedSlotRenders).toBe(1)
    delete (globalThis as any).__cachedSlotRenders
  })

  it('does not retain default, named, or optional slot content from a prior render', async () => {
    const fixture = project(`<Card>
  <h1 slot="title">{{ account.name }}</h1>
  <p>{{ account.email }}</p>
  @if(account.joinedAt)
    <time>{{ account.joinedAt }}</time>
  @endif
</Card>`)

    const first = await render(fixture, {
      name: 'First Runner',
      email: 'first@example.test',
      joinedAt: '2026-01-02',
    })
    const second = await render(fixture, {
      name: 'Second Runner',
      email: 'second@example.test',
      joinedAt: null,
    })

    expect(first).toContain('First Runner')
    expect(first).toContain('first@example.test')
    expect(first).toContain('<time>2026-01-02</time>')
    expect(second).toContain('Second Runner')
    expect(second).toContain('second@example.test')
    expect(second).not.toContain('First Runner')
    expect(second).not.toContain('first@example.test')
    expect(second).not.toContain('<time>')
  })

  it('does not cache a slot context that cannot be represented safely', async () => {
    const fixture = project(`<Card>
  @if(account.flags.has('joined'))
    <p>Joined</p>
  @else
    <p>Invited</p>
  @endif
</Card>`)

    const first = await render(fixture, { flags: new Map([['joined', true]]) })
    const second = await render(fixture, { flags: new Map() })

    expect(first).toContain('<p>Joined</p>')
    expect(second).toContain('<p>Invited</p>')
    expect(second).not.toContain('<p>Joined</p>')
  })

  it('isolates included loops and nested cached components', async () => {
    const fixture = project(`<Card>
  @include('./account-summary')
</Card>`)
    writeFileSync(
      path.join(fixture.root, 'account-summary.stx'),
      `<ul>@foreach(account.tags as tag)<li><Badge>{{ tag }}</Badge></li>@endforeach</ul>`,
    )

    const first = await render(fixture, { tags: ['trail', 'morning'] })
    const second = await render(fixture, { tags: ['night'] })

    expect(first).toContain('trail')
    expect(first).toContain('morning')
    expect(second).toContain('night')
    expect(second).not.toContain('trail')
    expect(second).not.toContain('morning')
  })

  it('preserves client-bound slot metadata without sharing server attributes', async () => {
    const fixture = project(`<script client>
const expanded = state(false)
</script>
<Card>
  <div data-account="{{ account.id }}" :show="expanded">
    <span x-text="accountLabel"></span>
  </div>
</Card>`)

    const first = await render(fixture, { id: 'runner-a' })
    const second = await render(fixture, { id: 'runner-b' })

    expect(first).toContain('data-account="runner-a"')
    expect(second).toContain('data-account="runner-b"')
    expect(second).not.toContain('data-account="runner-a"')
    expect(second).toContain('data-stx="__stx_setup_')
    expect(second).toContain(':show="expanded"')
    expect(second).toContain('x-text="accountLabel"')
  })
})
