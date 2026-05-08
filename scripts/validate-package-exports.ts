import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PackageCheck {
  dir: string
  name: string
  samples: string[]
}

const root = process.cwd()

const packages: PackageCheck[] = [
  {
    dir: 'packages/stx',
    name: '@stacksjs/stx',
    samples: ['expressions', 'parser/tokenizer', 'safe-evaluator', 'types/index'],
  },
  {
    dir: 'packages/router',
    name: 'stx-router',
    samples: ['client', 'layout-metadata', 'matcher'],
  },
  {
    dir: 'packages/bun-plugin',
    name: 'bun-plugin-stx',
    samples: ['client', 'preload', 'serve'],
  },
]

function fail(message: string): never {
  console.error(`export validation failed: ${message}`)
  process.exit(1)
}

function checkFile(packageDir: string, exportKey: string, condition: string, target: string): void {
  if (target.includes('*'))
    return

  const filePath = join(packageDir, target)
  if (!existsSync(filePath))
    fail(`${exportKey}.${condition} points to missing file ${filePath}`)
}

for (const pkg of packages) {
  const packageDir = join(root, pkg.dir)
  const packageJsonPath = join(packageDir, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const exportsMap = packageJson.exports as Record<string, string | Record<string, string>>

  if (!exportsMap)
    fail(`${pkg.name} has no exports map`)

  for (const [exportKey, value] of Object.entries(exportsMap)) {
    if (typeof value === 'string') {
      checkFile(packageDir, exportKey, 'default', value)
      continue
    }

    for (const [condition, target] of Object.entries(value)) {
      checkFile(packageDir, exportKey, condition, target)
    }
  }

  const wildcard = exportsMap['./*']
  if (!wildcard || typeof wildcard !== 'object')
    fail(`${pkg.name} is missing a wildcard export`)

  const importTarget = wildcard.import || wildcard.bun
  if (!importTarget?.endsWith('*.js'))
    fail(`${pkg.name} wildcard runtime export must resolve to .js files`)

  if (wildcard.types && !wildcard.types.endsWith('*.d.ts'))
    fail(`${pkg.name} wildcard type export must resolve to .d.ts files`)

  for (const sample of pkg.samples) {
    const jsPath = join(packageDir, 'dist', `${sample}.js`)
    if (!existsSync(jsPath))
      fail(`${pkg.name}/${sample} is missing runtime JS at ${jsPath}`)

    if (wildcard.types) {
      const dtsPath = join(packageDir, 'dist', `${sample}.d.ts`)
      if (!existsSync(dtsPath))
        fail(`${pkg.name}/${sample} is missing declarations at ${dtsPath}`)
    }
  }
}

console.log(`validated exports for ${packages.map(pkg => pkg.name).join(', ')}`)
