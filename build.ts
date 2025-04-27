import { build } from 'bun'
import stxPlugin from './src/index'

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
}

runBuild().catch(console.error)
