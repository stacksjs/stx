import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

describe('a bound prop read with defineProps', () => {
  it('is reported, with the useReactiveProp that reads it live', async () => {
    const root = createTempDir('stx-define-props-warning-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components', 'Badge.stx'), `<script client>const props = defineProps(['label', 'tone'])
const tone = useReactiveProp('tone', 'plain')</script><View><Text :text="props.label + tone()"></Text></View>`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>const name = state('A')</script><View><Badge :label="name()" :tone="name()" /></View>`)
    const warnings: string[] = []
    const warn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    try { await compileSharedScreenBundle(file, { root }) }
    finally { console.warn = warn }
    const about = warnings.filter(text => text.includes('defineProps'))
    expect(about).toHaveLength(1)
    expect(about[0]).toContain('Badge.stx reads `label`')
    expect(about[0]).toContain('useReactiveProp(\'label\')')
  })
})
