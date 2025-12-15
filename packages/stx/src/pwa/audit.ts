/**
 * PWA Audit
 *
 * Audits PWA configuration and build output for compliance
 * with PWA best practices and requirements.
 */

import type { StxOptions } from '../types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Audit check result
 */
export interface AuditCheck {
  id: string
  name: string
  category: 'required' | 'recommended' | 'optional'
  passed: boolean
  message: string
  details?: string
}

/**
 * Audit result summary
 */
export interface AuditResult {
  score: number
  passed: number
  failed: number
  warnings: number
  checks: AuditCheck[]
}

/**
 * Run PWA configuration audit
 */
export function auditConfig(options: StxOptions): AuditCheck[] {
  const checks: AuditCheck[] = []
  const pwa = options.pwa

  // Check if PWA is enabled
  checks.push({
    id: 'pwa-enabled',
    name: 'PWA Enabled',
    category: 'required',
    passed: pwa?.enabled === true,
    message: pwa?.enabled ? 'PWA is enabled' : 'PWA is not enabled in config',
  })

  if (!pwa?.enabled) {
    return checks
  }

  // Manifest checks
  checks.push({
    id: 'manifest-name',
    name: 'App Name',
    category: 'required',
    passed: Boolean(pwa.manifest?.name),
    message: pwa.manifest?.name
      ? `App name: "${pwa.manifest.name}"`
      : 'Missing required manifest name',
  })

  checks.push({
    id: 'manifest-short-name',
    name: 'Short Name',
    category: 'recommended',
    passed: Boolean(pwa.manifest?.shortName),
    message: pwa.manifest?.shortName
      ? `Short name: "${pwa.manifest.shortName}"`
      : 'Short name not set (will use full name)',
  })

  checks.push({
    id: 'manifest-description',
    name: 'App Description',
    category: 'recommended',
    passed: Boolean(pwa.manifest?.description),
    message: pwa.manifest?.description
      ? 'Description is set'
      : 'App description not provided',
  })

  checks.push({
    id: 'manifest-theme-color',
    name: 'Theme Color',
    category: 'required',
    passed: Boolean(pwa.manifest?.themeColor),
    message: pwa.manifest?.themeColor
      ? `Theme color: ${pwa.manifest.themeColor}`
      : 'Theme color not set',
  })

  checks.push({
    id: 'manifest-background-color',
    name: 'Background Color',
    category: 'required',
    passed: Boolean(pwa.manifest?.backgroundColor),
    message: pwa.manifest?.backgroundColor
      ? `Background color: ${pwa.manifest.backgroundColor}`
      : 'Background color not set',
  })

  checks.push({
    id: 'manifest-display',
    name: 'Display Mode',
    category: 'required',
    passed: ['standalone', 'fullscreen', 'minimal-ui'].includes(pwa.manifest?.display || ''),
    message: pwa.manifest?.display
      ? `Display mode: ${pwa.manifest.display}`
      : 'Display mode should be standalone, fullscreen, or minimal-ui',
  })

  checks.push({
    id: 'manifest-start-url',
    name: 'Start URL',
    category: 'required',
    passed: Boolean(pwa.manifest?.startUrl),
    message: pwa.manifest?.startUrl
      ? `Start URL: ${pwa.manifest.startUrl}`
      : 'Start URL not set',
  })

  // Icon checks
  checks.push({
    id: 'icons-source',
    name: 'Icon Source',
    category: 'required',
    passed: Boolean(pwa.icons?.src),
    message: pwa.icons?.src
      ? `Icon source: ${pwa.icons.src}`
      : 'No icon source configured',
  })

  const iconSizes = pwa.icons?.sizes || []
  checks.push({
    id: 'icons-192',
    name: '192x192 Icon',
    category: 'required',
    passed: iconSizes.includes(192),
    message: iconSizes.includes(192)
      ? '192x192 icon will be generated'
      : 'Missing 192x192 icon (required for Android)',
  })

  checks.push({
    id: 'icons-512',
    name: '512x512 Icon',
    category: 'required',
    passed: iconSizes.includes(512),
    message: iconSizes.includes(512)
      ? '512x512 icon will be generated'
      : 'Missing 512x512 icon (required for splash screen)',
  })

  checks.push({
    id: 'icons-maskable',
    name: 'Maskable Icon',
    category: 'recommended',
    passed: pwa.icons?.purpose?.includes('maskable') || false,
    message: pwa.icons?.purpose?.includes('maskable')
      ? 'Maskable icon purpose is set'
      : 'Consider adding maskable icon purpose for adaptive icons',
  })

  // Service Worker checks
  checks.push({
    id: 'sw-configured',
    name: 'Service Worker',
    category: 'required',
    passed: Boolean(pwa.serviceWorker),
    message: pwa.serviceWorker
      ? 'Service worker is configured'
      : 'Service worker configuration missing',
  })

  checks.push({
    id: 'sw-cache-version',
    name: 'Cache Version',
    category: 'recommended',
    passed: Boolean(pwa.serviceWorker?.cacheVersion),
    message: pwa.serviceWorker?.cacheVersion
      ? `Cache version: ${pwa.serviceWorker.cacheVersion}`
      : 'Set cache version for proper cache busting',
  })

  // Offline support
  checks.push({
    id: 'offline-enabled',
    name: 'Offline Support',
    category: 'required',
    passed: pwa.offline?.enabled === true,
    message: pwa.offline?.enabled
      ? 'Offline support is enabled'
      : 'Offline support is disabled',
  })

  // Caching strategies
  const routes = pwa.routes || []
  checks.push({
    id: 'caching-strategies',
    name: 'Caching Strategies',
    category: 'recommended',
    passed: routes.length > 0,
    message: routes.length > 0
      ? `${routes.length} route caching strategies configured`
      : 'No custom caching strategies defined',
  })

  // Push notifications
  checks.push({
    id: 'push-config',
    name: 'Push Notifications',
    category: 'optional',
    passed: !pwa.push?.enabled || Boolean(pwa.push?.vapidPublicKey),
    message: pwa.push?.enabled
      ? (pwa.push?.vapidPublicKey ? 'Push notifications configured with VAPID key' : 'Push enabled but missing VAPID key')
      : 'Push notifications not enabled',
  })

  // Share target
  checks.push({
    id: 'share-target',
    name: 'Share Target',
    category: 'optional',
    passed: true,
    message: pwa.shareTarget?.enabled
      ? `Share target enabled at ${pwa.shareTarget.action}`
      : 'Share target not enabled',
  })

  // Auto-injection
  checks.push({
    id: 'auto-inject',
    name: 'Auto-injection',
    category: 'recommended',
    passed: pwa.autoInject !== false,
    message: pwa.autoInject !== false
      ? 'PWA tags will be auto-injected'
      : 'Auto-injection disabled - manual tag insertion required',
  })

  return checks
}

/**
 * Run PWA build output audit
 */
export function auditBuildOutput(outputDir: string): AuditCheck[] {
  const checks: AuditCheck[] = []

  // Check manifest exists
  const manifestPath = path.join(outputDir, 'manifest.json')
  const manifestExists = fs.existsSync(manifestPath)
  checks.push({
    id: 'build-manifest',
    name: 'Manifest File',
    category: 'required',
    passed: manifestExists,
    message: manifestExists
      ? 'manifest.json exists'
      : 'manifest.json not found in build output',
  })

  // Validate manifest if exists
  if (manifestExists) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

      checks.push({
        id: 'build-manifest-valid',
        name: 'Valid Manifest JSON',
        category: 'required',
        passed: true,
        message: 'Manifest is valid JSON',
      })

      checks.push({
        id: 'build-manifest-icons',
        name: 'Manifest Icons',
        category: 'required',
        passed: Array.isArray(manifest.icons) && manifest.icons.length > 0,
        message: manifest.icons?.length
          ? `${manifest.icons.length} icons defined in manifest`
          : 'No icons defined in manifest',
      })
    }
    catch {
      checks.push({
        id: 'build-manifest-valid',
        name: 'Valid Manifest JSON',
        category: 'required',
        passed: false,
        message: 'Manifest is not valid JSON',
      })
    }
  }

  // Check service worker exists
  const swPath = path.join(outputDir, 'sw.js')
  const swExists = fs.existsSync(swPath)
  checks.push({
    id: 'build-sw',
    name: 'Service Worker File',
    category: 'required',
    passed: swExists,
    message: swExists
      ? 'Service worker (sw.js) exists'
      : 'Service worker not found in build output',
  })

  // Check offline page exists
  const offlinePath = path.join(outputDir, 'offline.html')
  const offlineExists = fs.existsSync(offlinePath)
  checks.push({
    id: 'build-offline',
    name: 'Offline Page',
    category: 'recommended',
    passed: offlineExists,
    message: offlineExists
      ? 'Offline page exists'
      : 'No offline.html found',
  })

  // Check icons directory
  const iconsDir = path.join(outputDir, 'pwa-icons')
  const iconsDirExists = fs.existsSync(iconsDir)
  if (iconsDirExists) {
    const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png') || f.endsWith('.webp'))
    checks.push({
      id: 'build-icons',
      name: 'Generated Icons',
      category: 'required',
      passed: iconFiles.length > 0,
      message: iconFiles.length > 0
        ? `${iconFiles.length} icon files generated`
        : 'No icon files found',
    })
  }
  else {
    checks.push({
      id: 'build-icons',
      name: 'Generated Icons',
      category: 'required',
      passed: false,
      message: 'Icons directory not found',
    })
  }

  return checks
}

/**
 * Calculate audit score and summary
 */
export function calculateAuditResult(checks: AuditCheck[]): AuditResult {
  const requiredChecks = checks.filter(c => c.category === 'required')
  const recommendedChecks = checks.filter(c => c.category === 'recommended')

  const requiredPassed = requiredChecks.filter(c => c.passed).length
  const recommendedPassed = recommendedChecks.filter(c => c.passed).length

  // Score: required checks worth 70%, recommended 30%
  const requiredScore = requiredChecks.length > 0
    ? (requiredPassed / requiredChecks.length) * 70
    : 70
  const recommendedScore = recommendedChecks.length > 0
    ? (recommendedPassed / recommendedChecks.length) * 30
    : 30

  const score = Math.round(requiredScore + recommendedScore)

  return {
    score,
    passed: checks.filter(c => c.passed).length,
    failed: checks.filter(c => !c.passed && c.category === 'required').length,
    warnings: checks.filter(c => !c.passed && c.category !== 'required').length,
    checks,
  }
}

/**
 * Run full PWA audit
 */
export function runPwaAudit(options: StxOptions, outputDir?: string): AuditResult {
  const configChecks = auditConfig(options)
  const buildChecks = outputDir && fs.existsSync(outputDir)
    ? auditBuildOutput(outputDir)
    : []

  return calculateAuditResult([...configChecks, ...buildChecks])
}

/**
 * Format audit result for console output
 */
export function formatAuditResult(result: AuditResult): string {
  const lines: string[] = []

  lines.push('\n=== PWA Audit Report ===\n')

  // Score
  const scoreColor = result.score >= 90 ? '32' : result.score >= 70 ? '33' : '31'
  lines.push(`Score: \x1B[${scoreColor}m${result.score}/100\x1B[0m`)
  lines.push(`Passed: ${result.passed} | Failed: ${result.failed} | Warnings: ${result.warnings}\n`)

  // Group by category
  const categories = ['required', 'recommended', 'optional'] as const
  for (const category of categories) {
    const categoryChecks = result.checks.filter(c => c.category === category)
    if (categoryChecks.length === 0)
      continue

    lines.push(`\n${category.toUpperCase()}:`)
    for (const check of categoryChecks) {
      const icon = check.passed ? '\x1B[32m✓\x1B[0m' : '\x1B[31m✗\x1B[0m'
      lines.push(`  ${icon} ${check.name}: ${check.message}`)
      if (check.details) {
        lines.push(`      ${check.details}`)
      }
    }
  }

  lines.push('')
  return lines.join('\n')
}
