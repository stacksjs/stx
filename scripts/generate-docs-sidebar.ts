#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const docsDir = 'docs/collections'

async function generateSidebar() {
  const files = await readdir(docsDir)

  const items = []
  for (const file of files) {
    if (file.startsWith('iconify-') && file.endsWith('.md')) {
      const content = await readFile(join(docsDir, file), 'utf-8')
      const titleMatch = content.match(/^# (.+)$/m)
      const title = titleMatch ? titleMatch[1] : file.replace('iconify-', '').replace('.md', '')
      const link = `/collections/${file.replace('.md', '')}`
      items.push({ text: title, link })
    }
  }

  items.sort((a, b) => a.text.localeCompare(b.text))

  // Generate sidebar items as TypeScript code
  const itemsCode = items.map(item =>
    `            { text: '${item.text}', link: '${item.link}' }`,
  ).join(',\n')

  // Generate full sidebar config
  const sidebarConfig = `      '/collections/': [
        {
          text: '🎨 Icon Collections',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/iconify' },
          ]
        },
        {
          text: '📦 Available Collections',
          collapsed: true,
          items: [
${itemsCode}
          ]
        }
      ],`

  await writeFile('/tmp/sidebar-config.txt', sidebarConfig)
  console.log('✓ Sidebar config generated')
  console.log(`  Total collections: ${items.length}`)
}

generateSidebar().catch(console.error)
