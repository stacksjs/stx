/**
 * `defineProps<T>` accepts an `interface` (stacksjs/stx#1917).
 *
 * The constraint was `Record<string, unknown>`, and a TypeScript interface does
 * not satisfy an index signature — only a type alias gets an implicit one. So
 * these two differ on the keyword alone:
 *
 *   interface CardProps { title: string }   // TS2344 + TS2345
 *   type CardProps = { title: string }      // fine
 *
 * `interface` is the form the framework scaffolds: `storage/framework/defaults/`
 * declares props with it 44 times and with a type alias zero times. The
 * constraint rejected the entire scaffolded corpus.
 *
 * ## Why it stayed invisible
 *
 * Every example in the docstrings passes an INLINE object literal, which does
 * have an implicit index signature and therefore always passed. The error shows
 * up only once the type is named — which is the moment it is reused, exported or
 * documented.
 *
 * And apps import from `stx`, which is not a package anyone can install: the npm
 * name belongs to an unrelated 2017 project and was unpublished in 2025. The
 * module resolved to `any`, so the constraint was never enforced at all.
 * Correcting the specifier in one real app turned 18 "Cannot find module"
 * errors into 36 constraint errors across 18 components.
 *
 * Compiled against `src/` rather than the package's subpath exports on purpose:
 * a stale `dist/` would let this pass while the source is broken.
 */

import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

/** Compile one fixture in isolation and hand back tsc's verdict. */
async function compile(source: string): Promise<{ code: number, output: string }> {
  const dir = path.resolve('.stx', `props-iface-${crypto.randomUUID()}`)
  await fs.promises.mkdir(dir, { recursive: true })
  const file = path.join(dir, 'fixture.ts')
  await Bun.write(file, source)

  const result = Bun.spawnSync(
    // `--types bun` because props.ts reads `process`; without it every run fails
    // on that rather than on the thing under test.
    ['bun', '--bun', 'tsc', '--ignoreConfig', '--strict', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'esnext', '--types', 'bun', '--skipLibCheck', '--noEmit', file],
    { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' },
  )

  await fs.promises.rm(dir, { recursive: true, force: true })

  return {
    code: result.exitCode ?? 0,
    output: `${result.stdout.toString()}\n${result.stderr.toString()}`,
  }
}

// `.stx/<dir>/fixture.ts` is two levels below the repo root.
const PROPS = '../../packages/stx/src/props'

describe('defineProps and an interface', () => {
  it('accepts the exact shape the framework scaffolds', async () => {
    // Verbatim from the report, down to `withDefaults(..., {})`.
    const { code, output } = await compile(`
      import { defineProps, withDefaults } from '${PROPS}'

      interface ValueCardProps {
        icon: string
        title: string
        description: string
      }

      const { icon, title, description } = withDefaults(defineProps<ValueCardProps>(), {})
      export const used = [icon, title, description]
    `)

    expect(code, output).toBe(0)
  })

  it('agrees with the type-alias spelling, which is what made this a keyword bug', async () => {
    // The two forms describe the same shape. If only one compiles, the choice of
    // keyword is a trap for anyone who picks the other.
    const { code, output } = await compile(`
      import { defineProps, withDefaults } from '${PROPS}'

      type AliasProps = { icon: string, title: string }
      interface InterfaceProps { icon: string, title: string }

      export const a = withDefaults(defineProps<AliasProps>(), {})
      export const b = withDefaults(defineProps<InterfaceProps>(), {})
    `)

    expect(code, output).toBe(0)
  })

  it('accepts one for every helper that takes a props-shaped type', async () => {
    // The constraint was repeated across seven signatures; fixing only the two
    // in the report would leave the next author to rediscover it.
    const { code, output } = await compile(`
      import { defineEmits, defineExpose, defineProps, definePropsWithValidation, shape, withDefaults } from '${PROPS}'

      interface Props { title: string }
      interface Events { close: void }
      interface Exposed { reset: () => void }
      interface Inner { id: string }

      export const p = defineProps<Props>()
      export const d = withDefaults(defineProps<Props>(), { title: 'x' })
      export const v = definePropsWithValidation<Props>({ title: { required: true } })
      export const s = shape<Inner>({ id: { required: true } })
      export const e = defineEmits<Events>()
      defineExpose<Exposed>({ reset: () => {} })
    `)

    expect(code, output).toBe(0)
  })

  it('still rejects a type that is not an object at all', async () => {
    // `object` is a real constraint, not a way of switching checking off. If
    // this ever compiles, the generic has stopped constraining anything.
    const { code, output } = await compile(`
      import { defineProps } from '${PROPS}'

      export const p = defineProps<string>()
    `)

    expect(code, output).not.toBe(0)
    expect(output).toContain('does not satisfy the constraint')
  })
})
