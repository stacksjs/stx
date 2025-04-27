import { build } from 'bun'
import process from 'node:process'
import stxPlugin from './packages/stx/src/index'

async function runTestBuild() {
  // eslint-disable-next-line no-console
  console.log('Building test.stx...')

  const result = await build({
    entrypoints: ['./test.stx'],
    outdir: './test/out',
    plugins: [stxPlugin],
  })

  if (result.success) {
    // eslint-disable-next-line no-console
    console.log('✅ Build successful!')
    // eslint-disable-next-line no-console
    console.log(`Output: ${result.outputs.map(o => o.path).join(', ')}`)

    // Print the output content for verification
    for (const output of result.outputs) {
      // eslint-disable-next-line no-console
      console.log(`\nContents of ${output.path}:`)
      // eslint-disable-next-line no-console
      console.log('-----------------------------------')
      const content = await Bun.file(output.path).text()
      // eslint-disable-next-line no-console
      console.log(content)
      // eslint-disable-next-line no-console
      console.log('-----------------------------------')
    }
  }
  else {
    console.error('❌ Build failed')
    console.error('Errors:', result.logs)
  }
}

runTestBuild().catch((err) => {
  console.error('Error running build:', err)
  process.exit(1)
})
