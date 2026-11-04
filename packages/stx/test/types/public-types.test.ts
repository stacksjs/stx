import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

describe('public TypeScript surface', () => {
  it('types the image startup settings consumed from project configuration', async () => {
    await fs.promises.mkdir(path.resolve('.stx'), { recursive: true })
    const dir = await fs.promises.mkdtemp(path.resolve('.stx', 'image-startup-types-'))
    try {
      const file = path.join(dir, 'config.ts')
      await Bun.write(file, `
        import type { StxOptions } from '../../packages/stx/src/types'
        const disabled = { imageWarmup: false } satisfies StxOptions
        const forced = { imageWarmup: true } satisfies StxOptions
        const automatic = { imageWarmup: 'auto', imageWarmupBindBudgetMs: 0 } satisfies StxOptions
        const bounded = { imageWarmupBindBudgetMs: 45000 } satisfies StxOptions
        // @ts-expect-error Only boolean values and 'auto' are supported.
        const invalidMode = { imageWarmup: 'disabled' } satisfies StxOptions
        // @ts-expect-error The bind budget is a number of milliseconds.
        const invalidBudget = { imageWarmupBindBudgetMs: '45000' } satisfies StxOptions
        void [disabled, forced, automatic, bounded, invalidMode, invalidBudget]
      `)
      // Use the same optional dependency declarations as the source project.
      const declarations = Array.from(new Bun.Glob('packages/stx/src/*.d.ts').scanSync())
      const result = Bun.spawnSync(['bun', '--bun', 'tsc', '--ignoreConfig', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'esnext', '--types', 'bun', '--skipLibCheck', '--noEmit', file, ...declarations], {
        cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe',
      })
      expect(result.exitCode, `${result.stdout.toString()}\n${result.stderr.toString()}`).toBe(0)
    }
    finally {
      await fs.promises.rm(dir, { recursive: true, force: true })
    }
  })

  it('typechecks public subpath imports and typed JSX components', async () => {
    const dir = path.resolve('.stx', `public-types-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.promises.mkdir(dir, { recursive: true })
    const file = path.join(dir, 'public-types.tsx')

    await Bun.write(file, `
      import type { StxOptions } from '@stacksjs/stx/types/index'
      import { jsx, type ComponentFunction } from '@stacksjs/stx/jsx-runtime'
      import { safeEvaluate } from '@stacksjs/stx/safe-evaluator'
      import { deriveLayoutGroup } from 'stx-router/layout-metadata'

import type { NativeBuildConfig, PlistValue } from '@stacksjs/stx/native-build'
const services = [{ NSMenuItem: { default: 'Search' }, NSMessage: 'search', NSSendTypes: ['public.utf8-plain-text'] }] as const
const nativeConfig = { input: 'app.stx', infoPlist: { NSServices: services, Ratio: 2.5, Enabled: true, Empty: {} } } satisfies NativeBuildConfig
const nested: PlistValue = ['x', 2, false, { child: [] }]
// @ts-expect-error null is not a supported plist value
const nullPlist: PlistValue = null
// @ts-expect-error functions cannot be serialized into a plist
const callbackPlist: PlistValue = () => 1
// @ts-expect-error undefined dictionary values are unsupported
const missingPlist: PlistValue = { missing: undefined }
void [nativeConfig, nested, nullPlist, callbackPlist, missingPlist]


      interface ProductProps {
        name: string
        price: number
      }

      const Product: ComponentFunction<ProductProps> = props => jsx('article', { children: props.name })
      const vnode = jsx(Product, { name: 'Cedar Wick Candle', price: 28 })
      const config: StxOptions = { buildMode: 'spa', pagesDir: 'pages' }
      const group = deriveLayoutGroup('layouts/shop/product.stx')
      const value = safeEvaluate<number>('price * qty', { price: 28, qty: 2 })

      if (!vnode || !config || group !== 'shop' || value !== 56) {
        throw new Error('public type smoke failed')
      }
    `)

    const result = Bun.spawnSync(['bun', '--bun', 'tsc', '--ignoreConfig', '--jsx', 'react-jsx', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'esnext', '--types', 'bun', '--skipLibCheck', '--noEmit', file], {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
    })

    await fs.promises.rm(dir, { recursive: true, force: true })

    expect(result.exitCode, `${result.stdout.toString()}\n${result.stderr.toString()}`).toBe(0)
  })
})
