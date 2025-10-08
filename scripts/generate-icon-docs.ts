#!/usr/bin/env bun
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { generatePackage } from '../packages/iconify-generator/src/index'

const collectionsDir = join(process.cwd(), 'packages/collections')
const docsDir = join(process.cwd(), 'docs/collections')

async function main() {
  console.log('📚 Generating documentation for all icon collections...\n')

  // Get all iconify collection directories
  const entries = await readdir(collectionsDir)
  const iconCollections = entries
    .filter(entry => entry.startsWith('iconify-'))
    .map(entry => entry.replace('iconify-', ''))
    .sort()

  console.log(`Found ${iconCollections.length} icon collections\n`)

  let successCount = 0
  let errorCount = 0

  for (const prefix of iconCollections) {
    try {
      // Read package.json to get icon list
      const packageJsonPath = join(collectionsDir, `iconify-${prefix}`, 'package.json')
      const packageJson = await Bun.file(packageJsonPath).json()

      // Check if src/index.ts exists to get icon list
      const srcIndexPath = join(collectionsDir, `iconify-${prefix}`, 'src', 'index.ts')
      const srcIndexFile = Bun.file(srcIndexPath)

      if (await srcIndexFile.exists()) {
        const indexContent = await srcIndexFile.text()

        // Extract icon names from export statements
        const iconMatches = indexContent.matchAll(/export \{ default as (\w+) \}/g)
        const icons = Array.from(iconMatches, m => m[1])

        if (icons.length > 0) {
          // Generate docs using the generator's documentation function
          const { generateDocumentation, fetchCollections } = await import('../packages/iconify-generator/src/index')

          const collections = await fetchCollections()
          const collectionInfo = collections[prefix]

          if (collectionInfo) {
            const docContent = generateDocumentation(prefix, collectionInfo, icons)
            const docPath = join(docsDir, `iconify-${prefix}.md`)

            await Bun.write(docPath, docContent)
            console.log(`✓ Generated docs for ${prefix} (${icons.length} icons)`)
            successCount++
          } else {
            console.log(`⚠ Skipped ${prefix} - collection info not found`)
            errorCount++
          }
        } else {
          console.log(`⚠ Skipped ${prefix} - no icons found`)
          errorCount++
        }
      } else {
        console.log(`⚠ Skipped ${prefix} - src/index.ts not found`)
        errorCount++
      }
    } catch (error) {
      console.error(`✗ Error generating docs for ${prefix}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n✓ Documentation generation complete!`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Errors/Skipped: ${errorCount}`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
