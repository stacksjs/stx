#!/usr/bin/env bun
/*
 * Print the npm trusted-publisher setup for every package this repo
 * publishes, one clickable settings URL per package.
 *
 * It prints rather than configures because npm has no API for this. Trusted
 * publishers are configured only in the website UI, per package: there is no
 * CLI command, no registry endpoint, and no scope or organization level
 * setting that covers a whole namespace at once. `pantry publisher:add` looks
 * like it should do the job and does not - it calls `/-/oidc/publishers` on
 * the registry, which answers `ResourceNotFound: does not exist`, so it fails
 * with a RegistryError however good your token is.
 *
 * Why it matters: nine of these packages have a trusted publisher and publish
 * with provenance over OIDC. The other 218, every icon collection, do not, so
 * `pantry publish` falls back to NPM_TOKEN. On the last green release 9
 * published with provenance, 123 fell back to the token, and none of those
 * 123 succeeded. @stacksjs/iconify-academicons has been stuck on 0.2.219
 * while the core packages reached 0.2.300.
 *
 * Until each one is configured, publishing the collections depends on a
 * working NPM_TOKEN secret. Once they all are, the secret can be deleted.
 *
 *   bun scripts/trust-publishers.ts            # every package
 *   bun scripts/trust-publishers.ts --todo     # collections only, the ones missing it
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const OWNER = 'stacksjs'
const REPOSITORY = 'stx'
const WORKFLOW = 'release.yml'

/**
 * The packages known to already have a trusted publisher, because they are the
 * ones observed publishing with provenance. npm exposes no way to query this,
 * so it is a record of what the release log showed rather than a live check.
 */
const ALREADY_TRUSTED = new Set([
  '@stacksjs/components',
  '@stacksjs/desktop',
  '@stacksjs/iconify-core',
  '@stacksjs/iconify-generator',
  '@stacksjs/sanitizer',
  '@stacksjs/stx',
  'bun-plugin-stx',
  'create-stx',
  'stx-router',
])

const todoOnly = process.argv.includes('--todo')
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
      try {
        const pkg = JSON.parse(readFileSync(join(root, group, entry, 'package.json'), 'utf-8'))
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

const all = publishedPackages()
const packages = todoOnly ? all.filter(name => !ALREADY_TRUSTED.has(name)) : all

console.log(`Enter these on each package's Settings → Trusted publishing:

  Publisher     GitHub Actions
  Organization  ${OWNER}
  Repository    ${REPOSITORY}
  Workflow      ${WORKFLOW}
  Environment   (leave blank)

${packages.length} package(s)${todoOnly ? ' still to configure' : ''}:
`)

for (const name of packages) {
  const mark = ALREADY_TRUSTED.has(name) ? '✓' : ' '
  console.log(`  ${mark} https://www.npmjs.com/package/${name}/access`)
}

if (!todoOnly)
  console.log(`\n✓ marks the ${ALREADY_TRUSTED.size} already publishing with provenance. Use --todo for just the rest.`)
