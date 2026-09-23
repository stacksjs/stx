#!/usr/bin/env bun
/*
 * Register this repository as a trusted publisher (OIDC) for every package it
 * publishes, so releases stop depending on a long-lived NPM_TOKEN.
 *
 * Why this exists: nine packages were configured as trusted publishers by hand
 * and publish with provenance. The other 218 - every icon collection - were
 * not, so `pantry publish` fell back to token authentication and npm answered
 * 404, which is what it returns when a credential may not write a package that
 * does exist. The release job has failed on all 218 for roughly eighty
 * releases; @stacksjs/iconify-academicons sat on 0.2.219 while the core
 * packages reached 0.2.300.
 *
 * Run it once, with a token that may manage those packages:
 *
 *   NPM_TOKEN=<a token with write access to @stacksjs> bun scripts/trust-publishers.ts
 *
 * Add --dry-run to print what it would register and change nothing. Re-running
 * is safe: a publisher that already exists is reported and skipped.
 *
 * Once every package is registered the token is no longer needed for
 * publishing at all, and the NPM_TOKEN secret can be deleted.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const OWNER = 'stacksjs'
const REPOSITORY = 'stx'
const WORKFLOW = '.github/workflows/release.yml'

const dryRun = process.argv.includes('--dry-run')
const root = join(import.meta.dir, '..')

/** Every package this repo publishes, read from the manifests rather than guessed. */
function publishedPackages(): string[] {
  const names: string[] = []
  for (const group of ['packages', 'packages/collections']) {
    let entries: string[]
    try {
      entries = readdirSync(join(root, group))
    }
    catch {
      continue
    }
    for (const entry of entries) {
      const manifest = join(root, group, entry, 'package.json')
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf-8'))
        if (pkg.name && pkg.private !== true)
          names.push(pkg.name)
      }
      catch {
        // A directory without a readable manifest is not a package.
      }
    }
  }
  return [...new Set(names)].sort()
}

const packages = publishedPackages()
console.log(`${packages.length} packages to register against ${OWNER}/${REPOSITORY} ${WORKFLOW}\n`)

if (!dryRun && !process.env.NPM_TOKEN) {
  console.error('NPM_TOKEN is not set. Re-run with a token that may manage these packages, or pass --dry-run.')
  process.exit(1)
}

let added = 0
let already = 0
const failed: { name: string, reason: string }[] = []

for (const name of packages) {
  if (dryRun) {
    console.log(`  would register ${name}`)
    continue
  }

  const result = Bun.spawnSync([
    'pantry',
    'publisher:add',
    '--package',
    name,
    '--type',
    'github-action',
    '--owner',
    OWNER,
    '--repository',
    REPOSITORY,
    '--workflow',
    WORKFLOW,
  ], { env: { ...process.env }, stdout: 'pipe', stderr: 'pipe' })

  const output = `${result.stdout.toString()}${result.stderr.toString()}`.trim()
  if (result.exitCode === 0) {
    added++
    console.log(`  ✓ ${name}`)
  }
  else if (/exists|already/i.test(output)) {
    already++
    console.log(`  ↷ ${name} (already trusted)`)
  }
  else {
    failed.push({ name, reason: output.split('\n')[0] || `exit ${result.exitCode}` })
    console.log(`  ✗ ${name}: ${output.split('\n')[0]}`)
  }
}

if (dryRun)
  process.exit(0)

console.log(`\nregistered ${added}, already trusted ${already}, failed ${failed.length}`)
if (failed.length) {
  console.log('\nFailures:')
  for (const f of failed) console.log(`  ${f.name}: ${f.reason}`)
  process.exit(1)
}
console.log('\nEvery package is a trusted publisher. The NPM_TOKEN secret is no longer needed to publish.')
