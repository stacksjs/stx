#!/usr/bin/env bun
import { join } from 'node:path'
import process from 'node:process'
import { fetchCollections, generatePackage } from './index'

const args = process.argv.slice(2)

async function main() {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
stx-iconify - Generate Iconify icon packages for stx

Usage:
  stx-iconify <command> [options]

Commands:
  list                    List all available icon collections
  generate <prefix>       Generate an icon package for a collection
  generate <prefix> <icons...>  Generate specific icons from a collection

Examples:
  stx-iconify list
  stx-iconify generate mdi
  stx-iconify generate lucide home settings user
  stx-iconify generate tabler --output ./packages
    `)
    process.exit(0)
  }

  const command = args[0]

  if (command === 'list') {
    console.log('\n📚 Fetching available icon collections...\n')
    const collections = await fetchCollections()

    const sortedCollections = Object.entries(collections)
      .sort((a, b) => b[1].total - a[1].total)

    console.log('Available collections:\n')
    for (const [prefix, info] of sortedCollections) {
      console.log(`  ${prefix.padEnd(30)} ${info.name} (${info.total} icons)`)
    }
    console.log(`\nTotal: ${sortedCollections.length} collections`)
  }
  else if (command === 'generate') {
    const prefix = args[1]
    if (!prefix) {
      console.error('Error: Please specify a collection prefix')
      console.error('Usage: stx-iconify generate <prefix> [icons...]')
      process.exit(1)
    }

    let outputDir = join(process.cwd(), 'packages')
    const icons: string[] = []

    // Parse remaining args
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--output' || args[i] === '-o') {
        outputDir = args[i + 1]
        i++
      }
      else if (!args[i].startsWith('--')) {
        icons.push(args[i])
      }
    }

    await generatePackage(prefix, outputDir, icons.length > 0 ? icons : undefined)
    console.log('\n✓ Package generated successfully!')
    console.log(`\nTo use the package:`)
    console.log(`  1. cd packages/iconify-${prefix}`)
    console.log(`  2. bun install`)
    console.log(`  3. bun run build`)
  }
  else {
    console.error(`Unknown command: ${command}`)
    console.error('Run "stx-iconify --help" for usage information')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
