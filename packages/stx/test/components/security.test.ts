import type { ResolvedProps } from '../../src/component-registry'
import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { StxDrawerBuiltin } from '../../src/builtins/drawer'
import { IconBuiltin } from '../../src/builtins/icon'
import { StxModalBuiltin } from '../../src/builtins/modal'
import { StxToastBuiltin } from '../../src/builtins/toast'
import { processDynamicComponents } from '../../src/dynamic-components'
import { processDirectives } from '../../src/process'

function staticProps(s: Record<string, unknown>): ResolvedProps {
  return { static: s, serverDynamic: {}, clientReactive: {}, events: {} } as ResolvedProps
}

// A value that breaks out of a double-quoted attribute and runs JS.
const BREAKOUT = 'x" onload="alert(1)'

const tempDirs: string[] = []

async function makeTempDir() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-component-security-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => fs.promises.rm(dir, { recursive: true, force: true })))
})

describe('component rendering security', () => {
  it('escapes forwarded event handlers on file-based component roots', async () => {
    const dir = await makeTempDir()
    const componentsDir = path.join(dir, 'components')
    await fs.promises.mkdir(componentsDir, { recursive: true })
    await Bun.write(path.join(componentsDir, 'Card.stx'), '<article><slot /></article>')

    const output = await processDirectives(
      '<Card @click="save(&quot;x&quot;) <script>alert(1)</script>">Hello</Card>',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir, debug: false },
      new Set(),
    )

    expect(output).toContain('id="__stx_evt_0"')
    expect(output).not.toContain('<script>alert(1)</script>')
    expect(output).not.toContain('save(&quot;x&quot;) <script>')
  })

  it('escapes builtin component event handlers and static attributes', async () => {
    const dir = await makeTempDir()
    const output = await processDirectives(
      '<StxLink to="/shop" aria-label="<script>alert(1)</script>" @click="track(&quot;candle&quot;) <img src=x>">Shop</StxLink>',
      {},
      path.join(dir, 'page.stx'),
      { debug: false },
      new Set(),
    )

    expect(output).toContain('id="__stx_evt_0"')
    expect(output).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt;"')
    expect(output).not.toContain('@@click')
    expect(output).not.toContain('<img src=x>')
  })

  it('escapes unsafe dynamic-component diagnostics inside HTML comments', async () => {
    const dir = await makeTempDir()
    const output = await processDynamicComponents(
      '<component :is="missing--><script>alert(1)</script>"></component>',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), debug: false },
      new Set(),
    )

    expect(output).toContain('dynamic component: could not resolve')
    expect(output).not.toContain('--><script>')
    expect(output).not.toContain('<script>alert(1)</script>')
  })
})

describe('builtin attribute escaping', () => {
  const ctx = {} as any

  it('Icon escapes class / style / size / color', () => {
    const out = IconBuiltin.render(
      staticProps({ name: 'lucide:check', class: BREAKOUT, style: BREAKOUT, size: BREAKOUT, color: BREAKOUT }),
      '',
      ctx,
    )
    expect(out).not.toContain('onload="alert(1)"')
    expect(out).not.toContain('" onload=')
    expect(out).toContain('&quot; onload=&quot;alert(1)')
  })

  it('StxDrawer escapes the id prop', () => {
    const out = StxDrawerBuiltin.render(staticProps({ id: BREAKOUT }), '', ctx)
    expect(out).not.toContain('" onload="alert(1)')
    expect(out).toContain('&quot; onload=&quot;alert(1)')
  })

  it('StxModal escapes the id prop', () => {
    const out = StxModalBuiltin.render(staticProps({ id: BREAKOUT }), '', ctx)
    expect(out).not.toContain('" onload="alert(1)')
    expect(out).toContain('&quot; onload=&quot;alert(1)')
  })

  it('StxToast escapes the position prop', () => {
    const out = StxToastBuiltin.render(staticProps({ position: BREAKOUT }), '', ctx)
    expect(out).not.toContain('" onload="alert(1)')
    expect(out).toContain('&quot; onload=&quot;alert(1)')
  })

  it('leaves benign prop values untouched (no over-escaping)', () => {
    const out = StxModalBuiltin.render(staticProps({ id: 'settings' }), '', ctx)
    expect(out).toContain('id="stx-modal-settings"')
    expect(out).toContain('data-stx-modal="settings"')
  })
})

describe('comment-mask does not defeat attribute escaping', () => {
  it('a <!-- … --> inside an attribute value cannot break out on restore', async () => {
    const dir = await makeTempDir()
    // Single-quoted source attribute, so the comment can legally contain a `"`.
    // The old global comment mask hid that `"` from the attribute parser; the
    // value was then re-emitted double-quoted+escaped, and the raw comment (with
    // its `"`) was restored INTO that double-quoted attribute — closing it and
    // injecting <img onerror>. Element-position masking leaves it in place to escape.
    const output = await processDirectives(
      `<StxLink to="/x" data-note='<!-- "><img src=x onerror=alert(1)> -->'>go</StxLink>`,
      {},
      path.join(dir, 'page.stx'),
      { debug: false },
      new Set(),
    )
    expect(output).not.toContain('<img src=x onerror=alert(1)>')
    expect(output).not.toContain('"><img')
  })

  it('still masks a real top-level comment (directives inside are not expanded)', async () => {
    const dir = await makeTempDir()
    const output = await processDirectives(
      '<p>a</p><!-- @if(true) hidden @endif --><p>b</p>',
      {},
      path.join(dir, 'page.stx'),
      { debug: false },
      new Set(),
    )
    // The directive inside the comment must NOT be evaluated; the comment survives.
    expect(output).toContain('<!-- @if(true) hidden @endif -->')
  })
})
