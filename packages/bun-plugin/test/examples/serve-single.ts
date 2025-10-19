import process from 'node:process'
import stxPlugin from '../../src/index'

async function main() {
  console.log('Building single .stx file...')

  // Build the .stx file
  const result = await Bun.build({
    entrypoints: ['../fixtures/basic.stx'],
    outdir: './dist',
    plugins: [stxPlugin()],
  })

  if (!result.success) {
    console.error('❌ Build failed')
    process.exit(1)
  }

  console.log('✅ Build completed successfully!')
  console.log(`📁 Built ${result.outputs.length} files`)

  // Find the HTML output
  const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
  if (!htmlOutput) {
    console.error('❌ No HTML output found')
    process.exit(1)
  }

  const content = await htmlOutput.text()
  console.log('\n📄 Built HTML preview (first 500 chars):')
  console.log(`${content.substring(0, 500)}...`)

  // Start a simple server
  const server = Bun.serve({
    port: 3456,
    async fetch(_req) {
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  console.log(`\n🚀 Server running at: ${server.url}`)
  console.log('Press Ctrl+C to stop')
}

main().catch(console.error)
