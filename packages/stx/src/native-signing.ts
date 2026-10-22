import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Bind a bundle's resources and identity to its macOS signature. */
export interface MacOSSigningOptions {
  /** Defaults to ad-hoc signing for local development. */
  identity?: string
  /** App entitlements plist, applied to the main executable only. */
  entitlements?: string
  /** Apple-issued profile authorizing restricted app capabilities. */
  provisioningProfile?: string
  hardenedRuntime?: boolean
}

/** Isolate the plist dictionary before converting its JSON-compatible values. */
export function parseMacOSProfileEntitlements(decoded: Uint8Array): Record<string, unknown> {
  // Profiles also contain certificate data and dates. macOS 15's plutil
  // rejects those JSON-incompatible siblings when extracting directly as JSON.
  const dictionary = Bun.spawnSync(['/usr/bin/plutil', '-extract', 'Entitlements', 'xml1', '-o', '-', '-'], { stdin: decoded })
  if (dictionary.exitCode !== 0) throw new Error(`Could not extract the macOS profile entitlements: ${dictionary.stderr.toString().trim() || dictionary.stdout.toString().trim()}`)
  const json = Bun.spawnSync(['/usr/bin/plutil', '-convert', 'json', '-o', '-', '-'], { stdin: dictionary.stdout })
  if (json.exitCode !== 0) throw new Error(`Could not convert the macOS profile entitlements: ${json.stderr.toString().trim() || json.stdout.toString().trim()}`)
  const entitlements = JSON.parse(json.stdout.toString())
  if (!entitlements || typeof entitlements !== 'object' || Array.isArray(entitlements)) throw new Error('The macOS profile entitlements must be a dictionary.')
  return entitlements
}

export async function signMacOSBundle(bundle: string, nestedExecutables: string[] = [], options: MacOSSigningOptions = {}): Promise<void> {
  if (process.platform !== 'darwin') return
  let signingEntitlements = options.entitlements
  let temporary: string | undefined
  try {
    if (options.provisioningProfile) {
      if (!options.identity || options.identity === '-') throw new Error('A provisioning profile requires a signing identity.')
      const decoded = Bun.spawnSync(['/usr/bin/security', 'cms', '-D', '-i', options.provisioningProfile])
      if (decoded.exitCode !== 0) throw new Error('Could not decode the macOS provisioning profile.')
      const profileEntitlements = parseMacOSProfileEntitlements(decoded.stdout)
      let entitlements: Record<string, unknown> = {}
      if (options.entitlements) {
        const requested = Bun.spawnSync(['/usr/bin/plutil', '-convert', 'json', '-o', '-', options.entitlements])
        if (requested.exitCode !== 0) throw new Error('Could not read the app entitlements plist.')
        entitlements = JSON.parse(requested.stdout.toString())
      }
      // These bind the main executable to the profile. Do not copy unrelated
      // permissions (such as wildcard keychain groups) into the application.
      for (const key of ['com.apple.application-identifier', 'com.apple.developer.team-identifier']) {
        if (profileEntitlements[key]) entitlements[key] = profileEntitlements[key]
      }
      temporary = mkdtempSync(join(tmpdir(), 'stx-entitlements-'))
      signingEntitlements = join(temporary, 'entitlements.plist')
      writeFileSync(signingEntitlements, JSON.stringify(entitlements))
      if (Bun.spawnSync(['/usr/bin/plutil', '-convert', 'xml1', signingEntitlements]).exitCode !== 0) {
        throw new Error('Could not generate the provisioned app entitlements.')
      }
      copyFileSync(options.provisioningProfile, join(bundle, 'Contents', 'embedded.provisionprofile'))
    }
    for (const target of [...nestedExecutables, bundle]) {
      const flags = options.hardenedRuntime ? ['--options', 'runtime'] : []
      if (target === bundle && signingEntitlements) flags.push('--entitlements', signingEntitlements)
      const timestamp = options.identity && options.identity !== '-' ? '--timestamp' : '--timestamp=none'
      const proc = Bun.spawn(['/usr/bin/codesign', '--force', '--sign', options.identity || '-', timestamp, ...flags, target], { stdout: 'pipe', stderr: 'pipe' })
      const [stderr, code] = await Promise.all([new Response(proc.stderr).text(), proc.exited])
      if (code !== 0) throw new Error(`Could not sign native bundle ${target}: ${stderr.trim()}`)
    }
    const verification = Bun.spawn(['/usr/bin/codesign', '--verify', '--strict', bundle], { stdout: 'pipe', stderr: 'pipe' })
    const [stderr, code] = await Promise.all([new Response(verification.stderr).text(), verification.exited])
    if (code !== 0) throw new Error(`Invalid native bundle signature: ${stderr.trim()}`)
  }
  finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true })
  }
}
