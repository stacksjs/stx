import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { AdapterBuildConfig, AdapterBuildResult, DeployAdapter, StaticAdapterConfig } from '../types'

function copyDirSync(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    }
    else {
      copyFileSync(srcPath, destPath)
    }
  }
}

function collectFiles(dir: string, base: string = dir): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(full, base))
    else files.push(relative(base, full))
  }
  return files
}

export function staticAdapter(config: StaticAdapterConfig = {}): DeployAdapter {
  return {
    name: 'static',

    async build(buildConfig: AdapterBuildConfig): Promise<AdapterBuildResult> {
      const outDir = buildConfig.outDir
      mkdirSync(outDir, { recursive: true })

      // If fallback page needed for SPA mode
      if (config.fallback) {
        const fallbackSrc = join(outDir, 'index.html')
        const fallbackDest = join(outDir, config.fallback)
        if (existsSync(fallbackSrc) && !existsSync(fallbackDest)) {
          copyFileSync(fallbackSrc, fallbackDest)
        }
      }

      const files = collectFiles(outDir)

      return {
        outputDir: outDir,
        files,
      }
    },

    async generateConfig(outputDir: string): Promise<void> {
      // Generate _redirects for Netlify-style hosting
      if (config.fallback) {
        const redirects = `/* /${config.fallback} 200\n`
        const { writeFileSync } = await import('node:fs')
        writeFileSync(join(outputDir, '_redirects'), redirects)
      }
    },
  }
}
