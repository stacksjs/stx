import { Glob } from 'bun'
import process from 'node:process'
import stxPlugin from 'bun-plugin-stx'

console.log('🔨 Building stx files...\n')

// Auto-discover all .stx files in pages directory
const glob = new Glob('pages/**/*.stx')
const entrypoints = await Array.fromAsync(glob.scan('.'))

console.log(`📄 Found ${entrypoints.length} .stx files:`)
entrypoints.forEach(file => console.log(`   - ${file}`))

// Build all .stx files
const result = await Bun.build({
  entrypoints,
  outdir: './dist',
  plugins: [stxPlugin()],
  naming: {
    entry: '[dir]/[name].[ext]',
  },
})

if (!result.success) {
  console.error('\n❌ Build failed!')
  console.error(result.logs)
  process.exit(1)
}

console.log(`\n✅ Build completed successfully!`)
console.log(`📁 Output: ${result.outputs.length} files in ./dist`)

// List output files
console.log('\n📦 Generated files:')
for (const output of result.outputs) {
  const size = (output.size / 1024).toFixed(2)
  console.log(`   - ${output.path} (${size} KB)`)
}

console.log('\n🎉 Ready to serve! Run: bun run dev')
