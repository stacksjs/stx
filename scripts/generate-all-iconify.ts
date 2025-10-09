#!/usr/bin/env bun
import { join } from 'node:path'
import process from 'node:process'
import { fetchCollections, generatePackage } from '../packages/iconify-generator/src/index.js'

const PACKAGES_DIR = join(process.cwd(), 'packages/collections')

async function generateAllIconify() {
  console.log('🚀 Starting generation of ALL Iconify collections...\n')

  const collections = await fetchCollections()
  const collectionEntries = Object.entries(collections)

  console.log(`📊 Found ${collectionEntries.length} collections to generate\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ prefix: string, error: string }> = []

  for (let i = 0; i < collectionEntries.length; i++) {
    const [prefix, info] = collectionEntries[i]
    const progress = `[${i + 1}/${collectionEntries.length}]`

    try {
      console.log(`${progress} Generating ${prefix} (${info.name}) - ${info.total} icons...`)

      await generatePackage(prefix, PACKAGES_DIR)
      successCount++

      console.log(`${progress} ✓ ${prefix} completed\n`)
    }
    catch (error) {
      errorCount++
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push({ prefix, error: errorMsg })
      console.error(`${progress} ✗ ${prefix} failed: ${errorMsg}\n`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 Generation Summary')
  console.log('='.repeat(80))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📦 Total: ${collectionEntries.length}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(({ prefix, error }) => {
      console.log(`  - ${prefix}: ${error}`)
    })
  }

  console.log('\n✨ All collections generated!')
  console.log('\nTo build all packages, run:')
  console.log('  bun run build-all-iconify')
}

generateAllIconify().catch(console.error)
