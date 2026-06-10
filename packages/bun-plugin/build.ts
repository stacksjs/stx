import { rmSync } from 'node:fs'
import { dts } from 'bun-plugin-dtsx'

function assertBuild(result: Awaited<ReturnType<typeof Bun.build>>, label: string): void {
  if (result.success)
    return

  const logs = result.logs.map(log => String(log)).join('\n')
  throw new Error(`${label} failed${logs ? `:\n${logs}` : ''}`)
}

rmSync('./dist', { recursive: true, force: true })

assertBuild(await Bun.build({
  entrypoints: ['./src/index.ts', './src/client.ts', './src/preload.ts', './src/serve.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  splitting: true,
  external: ['@stacksjs/stx'], // Don't bundle stx to avoid duplicate exports
}), 'bun-plugin-stx build')
