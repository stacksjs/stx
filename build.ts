import { build } from 'bun'
import stxPlugin from './packages/stx/src/index'

async function runBuild() {
  const result = await build({
    entrypoints: ['./home.stx'],
    outdir: './dist',
    plugins: [stxPlugin],
  })

  console.log('Build completed:', result.success ? '✅' : '❌')
  if (!result.success) {
    console.error('Build errors:', result.logs)
  }

  const result2 = await build({
    entrypoints: ['./bin/cli.ts'],
    outdir: './dist',
    target: 'bun',
    minify: true,
  })

  console.log('CLI Build completed:', result2.success ? '✅' : '❌')
  if (!result2.success) {
    console.error('Build errors:', result2.logs)
  }
}

runBuild().catch(console.error)
