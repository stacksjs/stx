/**
 * Production Build System
 *
 * Comprehensive production build tooling for stx applications:
 * - Code splitting per route
 * - CSS extraction and minification
 * - Bundle analysis
 * - Source maps generation
 * - Asset fingerprinting
 * - Compression (gzip/brotli)
 *
 * @module production-build
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

// =============================================================================
// Types
// =============================================================================

/**
 * Production build configuration
 */
export interface ProductionBuildConfig {
  /** Entry points (pages/routes) */
  entry: string | string[] | Record<string, string>
  /** Output directory */
  outDir: string
  /** Public path for assets */
  publicPath?: string
  /** Enable source maps */
  sourcemaps?: boolean | 'inline' | 'external' | 'hidden'
  /** Minification options */
  minify?: boolean | MinifyOptions
  /** Code splitting options */
  splitting?: boolean | SplittingOptions
  /** CSS extraction options */
  css?: CssOptions
  /** Asset handling options */
  assets?: AssetOptions
  /** Compression options */
  compression?: CompressionOptions
  /** Bundle analysis */
  analyze?: boolean | AnalyzeOptions
  /** Target browsers */
  target?: string | string[]
  /** Environment variables to inline */
  define?: Record<string, string>
  /** External dependencies (don't bundle) */
  external?: string[]
  /** Plugins */
  plugins?: BuildPlugin[]
}

/**
 * Minification options
 */
export interface MinifyOptions {
  /** Minify JavaScript */
  js?: boolean
  /** Minify CSS */
  css?: boolean
  /** Minify HTML */
  html?: boolean
  /** Remove console.log statements */
  dropConsole?: boolean
  /** Remove debugger statements */
  dropDebugger?: boolean
  /** Mangle variable names */
  mangle?: boolean
}

/**
 * Code splitting options
 */
export interface SplittingOptions {
  /** Split vendor code into separate chunk */
  vendor?: boolean
  /** Minimum chunk size in bytes */
  minSize?: number
  /** Maximum chunk size in bytes */
  maxSize?: number
  /** Chunk naming pattern */
  chunkNames?: 'hash' | 'named' | 'deterministic'
  /** Manual chunk configuration */
  manualChunks?: Record<string, string[]>
}

/**
 * CSS options
 */
export interface CssOptions {
  /** Extract CSS to separate files */
  extract?: boolean
  /** CSS modules configuration */
  modules?: boolean | CssModulesOptions
  /** PostCSS plugins */
  postcss?: boolean | object
  /** Minify CSS */
  minify?: boolean
  /** CSS filename pattern */
  filename?: string
}

/**
 * CSS modules options
 */
export interface CssModulesOptions {
  /** Scoped class name pattern */
  pattern?: string
  /** Generate source maps */
  sourcemap?: boolean
}

/**
 * Asset options
 */
export interface AssetOptions {
  /** Inline assets smaller than this size (bytes) */
  inlineLimit?: number
  /** Asset filename pattern */
  filename?: string
  /** Include hash in filenames */
  hash?: boolean
  /** Hash length */
  hashLength?: number
  /** Asset types to process */
  include?: string[]
  /** Asset types to exclude */
  exclude?: string[]
}

/**
 * Compression options
 */
export interface CompressionOptions {
  /** Enable gzip compression */
  gzip?: boolean
  /** Enable brotli compression */
  brotli?: boolean
  /** Minimum size to compress (bytes) */
  threshold?: number
  /** Delete original files after compression */
  deleteOriginal?: boolean
}

/**
 * Bundle analysis options
 */
export interface AnalyzeOptions {
  /** Output format */
  format?: 'html' | 'json' | 'text'
  /** Output file */
  filename?: string
  /** Open browser automatically */
  open?: boolean
  /** Show gzip size */
  gzipSize?: boolean
  /** Show brotli size */
  brotliSize?: boolean
}

/**
 * Build plugin interface
 */
export interface BuildPlugin {
  name: string
  setup?: (build: ProductionBuild) => void | Promise<void>
  buildStart?: () => void | Promise<void>
  transform?: (code: string, id: string) => string | Promise<string> | null
  buildEnd?: (result: BuildResult) => void | Promise<void>
}

/**
 * Build result
 */
export interface BuildResult {
  /** Output files */
  outputs: OutputFile[]
  /** Build duration in ms */
  duration: number
  /** Total size */
  totalSize: number
  /** Gzipped size */
  gzipSize: number
  /** Chunks generated */
  chunks: ChunkInfo[]
  /** Assets generated */
  assets: AssetInfo[]
  /** Warnings */
  warnings: string[]
  /** Errors */
  errors: string[]
}

/**
 * Output file info
 */
export interface OutputFile {
  /** File path */
  path: string
  /** File type */
  type: 'js' | 'css' | 'html' | 'asset' | 'map'
  /** File size in bytes */
  size: number
  /** Gzipped size */
  gzipSize?: number
  /** Content hash */
  hash?: string
  /** Source file(s) */
  sources?: string[]
  /** Is entry point */
  isEntry?: boolean
}

/**
 * Chunk info
 */
export interface ChunkInfo {
  /** Chunk name */
  name: string
  /** Chunk file */
  file: string
  /** Chunk size */
  size: number
  /** Modules in chunk */
  modules: string[]
  /** Is vendor chunk */
  isVendor?: boolean
  /** Import dependencies */
  imports: string[]
  /** Dynamic imports */
  dynamicImports: string[]
}

/**
 * Asset info
 */
export interface AssetInfo {
  /** Asset name */
  name: string
  /** Asset file */
  file: string
  /** Asset size */
  size: number
  /** Original path */
  source: string
  /** MIME type */
  mimeType?: string
}

// =============================================================================
// Default Configuration
// =============================================================================

const defaultConfig: Partial<ProductionBuildConfig> = {
  outDir: 'dist',
  publicPath: '/',
  sourcemaps: true,
  minify: {
    js: true,
    css: true,
    html: true,
    dropConsole: true,
    dropDebugger: true,
    mangle: true,
  },
  splitting: {
    vendor: true,
    minSize: 20000,
    maxSize: 250000,
    chunkNames: 'deterministic',
  },
  css: {
    extract: true,
    minify: true,
    filename: 'assets/[name].[hash].css',
  },
  assets: {
    inlineLimit: 4096,
    filename: 'assets/[name].[hash][ext]',
    hash: true,
    hashLength: 8,
    include: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'woff', 'woff2', 'ttf', 'eot'],
  },
  compression: {
    gzip: true,
    brotli: true,
    threshold: 1024,
    deleteOriginal: false,
  },
}

// =============================================================================
// Production Build Class
// =============================================================================

/**
 * Production Build orchestrator
 */
export class ProductionBuild {
  private config: ProductionBuildConfig
  private startTime: number = 0
  private outputs: OutputFile[] = []
  private chunks: ChunkInfo[] = []
  private assets: AssetInfo[] = []
  private warnings: string[] = []
  private errors: string[] = []
  private moduleGraph: Map<string, Set<string>> = new Map()
  private assetHashes: Map<string, string> = new Map()

  constructor(config: ProductionBuildConfig) {
    this.config = { ...defaultConfig, ...config } as ProductionBuildConfig
  }

  /**
   * Run the production build
   */
  async build(): Promise<BuildResult> {
    this.startTime = Date.now()
    this.outputs = []
    this.chunks = []
    this.assets = []
    this.warnings = []
    this.errors = []

    try {
      // Ensure output directory exists
      this.ensureDir(this.config.outDir)

      // Run plugins setup
      await this.runPluginHook('setup')
      await this.runPluginHook('buildStart')

      // Collect entry points
      const entries = this.collectEntries()

      // Build each entry
      for (const [name, path] of entries) {
        await this.buildEntry(name, path)
      }

      // Extract and process CSS
      if (this.config.css?.extract) {
        await this.extractCss()
      }

      // Process assets
      await this.processAssets()

      // Code splitting
      if (this.config.splitting) {
        await this.performCodeSplitting()
      }

      // Minification
      if (this.config.minify) {
        await this.minifyOutputs()
      }

      // Generate source maps
      if (this.config.sourcemaps) {
        await this.generateSourceMaps()
      }

      // Asset fingerprinting
      await this.fingerprintAssets()

      // Compression
      if (this.config.compression) {
        await this.compressOutputs()
      }

      // Bundle analysis
      if (this.config.analyze) {
        await this.analyzeBundle()
      }

      const result = this.getResult()

      // Run plugins buildEnd
      await this.runPluginHook('buildEnd', result)

      return result
    }
    catch (error) {
      this.errors.push(String(error))
      return this.getResult()
    }
  }

  /**
   * Collect entry points from config
   */
  private collectEntries(): Map<string, string> {
    const entries = new Map<string, string>()
    const { entry } = this.config

    if (typeof entry === 'string') {
      entries.set('main', entry)
    }
    else if (Array.isArray(entry)) {
      entry.forEach((e, i) => {
        const name = basename(e, extname(e))
        entries.set(name, e)
      })
    }
    else if (typeof entry === 'object') {
      Object.entries(entry).forEach(([name, path]) => {
        entries.set(name, path)
      })
    }

    return entries
  }

  /**
   * Build a single entry point
   */
  private async buildEntry(name: string, entryPath: string): Promise<void> {
    if (!existsSync(entryPath)) {
      this.errors.push(`Entry point not found: ${entryPath}`)
      return
    }

    const content = readFileSync(entryPath, 'utf-8')
    const ext = extname(entryPath)

    // Determine output type
    let outputContent = content
    let outputType: OutputFile['type'] = 'js'

    if (ext === '.stx' || ext === '.html') {
      outputType = 'html'
      outputContent = await this.processTemplate(content, entryPath)
    }
    else if (ext === '.css') {
      outputType = 'css'
      outputContent = await this.processCss(content, entryPath)
    }
    else if (ext === '.js' || ext === '.ts') {
      outputType = 'js'
      outputContent = await this.processScript(content, entryPath)
    }

    // Apply plugin transforms
    outputContent = await this.runPluginTransform(outputContent, entryPath)

    // Calculate hash
    const hash = this.generateHash(outputContent)

    // Determine output path
    const outputName = this.getOutputName(name, outputType, hash)
    const outputPath = join(this.config.outDir, outputName)

    // Write output
    this.ensureDir(dirname(outputPath))
    writeFileSync(outputPath, outputContent)

    // Record output
    this.outputs.push({
      path: outputPath,
      type: outputType,
      size: Buffer.byteLength(outputContent),
      hash,
      sources: [entryPath],
      isEntry: true,
    })
  }

  /**
   * Process a template file
   */
  private async processTemplate(content: string, filePath: string): Promise<string> {
    // Basic template processing - in real implementation would use full stx processing
    let output = content

    // Extract inline scripts and styles
    const scripts: string[] = []
    const styles: string[] = []

    // Extract scripts
    output = output.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, code) => {
      if (code.trim()) {
        scripts.push(code)
      }
      return ''
    })

    // Extract styles
    output = output.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
      if (css.trim()) {
        styles.push(css)
      }
      return ''
    })

    // Process and re-inject
    if (scripts.length > 0) {
      const processedScript = scripts.join('\n')
      const scriptHash = this.generateHash(processedScript).slice(0, 8)
      const scriptFile = `assets/app.${scriptHash}.js`
      const scriptPath = join(this.config.outDir, scriptFile)

      this.ensureDir(dirname(scriptPath))
      writeFileSync(scriptPath, processedScript)

      this.outputs.push({
        path: scriptPath,
        type: 'js',
        size: Buffer.byteLength(processedScript),
        hash: scriptHash,
        sources: [filePath],
      })

      output = output.replace('</body>', `<script src="${this.config.publicPath}${scriptFile}"></script>\n</body>`)
    }

    if (styles.length > 0) {
      const processedStyle = styles.join('\n')
      const styleHash = this.generateHash(processedStyle).slice(0, 8)
      const styleFile = `assets/app.${styleHash}.css`
      const stylePath = join(this.config.outDir, styleFile)

      this.ensureDir(dirname(stylePath))
      writeFileSync(stylePath, processedStyle)

      this.outputs.push({
        path: stylePath,
        type: 'css',
        size: Buffer.byteLength(processedStyle),
        hash: styleHash,
        sources: [filePath],
      })

      output = output.replace('</head>', `<link rel="stylesheet" href="${this.config.publicPath}${styleFile}">\n</head>`)
    }

    return output
  }

  /**
   * Process a CSS file
   */
  private async processCss(content: string, filePath: string): Promise<string> {
    let output = content

    // Basic CSS minification
    if (typeof this.config.minify === 'object' && this.config.minify.css) {
      output = this.minifyCss(output)
    }

    return output
  }

  /**
   * Process a script file
   */
  private async processScript(content: string, filePath: string): Promise<string> {
    let output = content

    // Replace environment variables
    if (this.config.define) {
      for (const [key, value] of Object.entries(this.config.define)) {
        output = output.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
      }
    }

    return output
  }

  /**
   * Extract CSS from templates
   */
  private async extractCss(): Promise<void> {
    // Collect all CSS from outputs
    const cssContents: string[] = []

    for (const output of this.outputs) {
      if (output.type === 'css') {
        const content = readFileSync(output.path, 'utf-8')
        cssContents.push(content)
      }
    }

    if (cssContents.length === 0)
      return

    const combinedCss = cssContents.join('\n')
    const hash = this.generateHash(combinedCss).slice(0, 8)
    const filename = (this.config.css?.filename || 'assets/[name].[hash].css')
      .replace('[name]', 'styles')
      .replace('[hash]', hash)

    const outputPath = join(this.config.outDir, filename)
    this.ensureDir(dirname(outputPath))
    writeFileSync(outputPath, combinedCss)

    this.outputs.push({
      path: outputPath,
      type: 'css',
      size: Buffer.byteLength(combinedCss),
      hash,
    })
  }

  /**
   * Process static assets
   */
  private async processAssets(): Promise<void> {
    const assetsDir = join(dirname(this.config.outDir), 'public')
    if (!existsSync(assetsDir))
      return

    const assetOptions = this.config.assets || {}
    const include = assetOptions.include || []

    this.walkDir(assetsDir, (filePath) => {
      const ext = extname(filePath).slice(1).toLowerCase()
      if (!include.includes(ext))
        return

      const content = readFileSync(filePath)
      const size = content.length

      // Check inline limit
      if (assetOptions.inlineLimit && size < assetOptions.inlineLimit) {
        // Will be inlined, skip
        return
      }

      const hash = assetOptions.hash ? this.generateHash(content).slice(0, assetOptions.hashLength || 8) : ''
      const filename = (assetOptions.filename || 'assets/[name].[hash][ext]')
        .replace('[name]', basename(filePath, extname(filePath)))
        .replace('[hash]', hash)
        .replace('[ext]', extname(filePath))

      const outputPath = join(this.config.outDir, filename)
      this.ensureDir(dirname(outputPath))
      writeFileSync(outputPath, content)

      this.assetHashes.set(filePath, filename)
      this.assets.push({
        name: basename(filePath),
        file: filename,
        size,
        source: filePath,
      })

      this.outputs.push({
        path: outputPath,
        type: 'asset',
        size,
        hash,
        sources: [filePath],
      })
    })
  }

  /**
   * Perform code splitting
   */
  private async performCodeSplitting(): Promise<void> {
    const splitting = typeof this.config.splitting === 'object' ? this.config.splitting : {}

    // Create vendor chunk if enabled
    if (splitting.vendor) {
      const vendorModules: string[] = []

      // In real implementation, would analyze imports and create vendor chunk
      // For now, just create a placeholder

      this.chunks.push({
        name: 'vendor',
        file: 'assets/vendor.js',
        size: 0,
        modules: vendorModules,
        isVendor: true,
        imports: [],
        dynamicImports: [],
      })
    }
  }

  /**
   * Minify outputs
   */
  private async minifyOutputs(): Promise<void> {
    const minifyOptions = typeof this.config.minify === 'object' ? this.config.minify : {}

    for (const output of this.outputs) {
      const content = readFileSync(output.path, 'utf-8')
      let minified = content

      if (output.type === 'js' && minifyOptions.js) {
        minified = this.minifyJs(content)
      }
      else if (output.type === 'css' && minifyOptions.css) {
        minified = this.minifyCss(content)
      }
      else if (output.type === 'html' && minifyOptions.html) {
        minified = this.minifyHtml(content)
      }

      if (minified !== content) {
        writeFileSync(output.path, minified)
        output.size = Buffer.byteLength(minified)
      }
    }
  }

  /**
   * Minify JavaScript
   */
  private minifyJs(code: string): string {
    const minifyOptions = typeof this.config.minify === 'object' ? this.config.minify : {}

    let minified = code

    // Remove comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
    minified = minified.replace(/\/\/.*$/gm, '')

    // Remove console.log if configured
    if (minifyOptions.dropConsole) {
      minified = minified.replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '')
    }

    // Remove debugger statements
    if (minifyOptions.dropDebugger) {
      minified = minified.replace(/debugger;?/g, '')
    }

    // Remove excess whitespace
    minified = minified.replace(/\s+/g, ' ')
    minified = minified.replace(/\s*([{};,:])\s*/g, '$1')
    minified = minified.replace(/;\}/g, '}')

    return minified.trim()
  }

  /**
   * Minify CSS
   */
  private minifyCss(css: string): string {
    let minified = css

    // Remove comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')

    // Remove excess whitespace
    minified = minified.replace(/\s+/g, ' ')
    minified = minified.replace(/\s*([{};:,>+~])\s*/g, '$1')

    // Remove last semicolon before }
    minified = minified.replace(/;}/g, '}')

    // Remove empty rules
    minified = minified.replace(/[^{}]+\{\s*\}/g, '')

    return minified.trim()
  }

  /**
   * Minify HTML
   */
  private minifyHtml(html: string): string {
    let minified = html

    // Remove HTML comments (but keep conditional comments)
    minified = minified.replace(/<!--(?!\[if)[\s\S]*?-->/g, '')

    // Remove whitespace between tags
    minified = minified.replace(/>\s+</g, '><')

    // Remove leading/trailing whitespace in tags
    minified = minified.replace(/\s+>/g, '>')
    minified = minified.replace(/<\s+/g, '<')

    // Collapse multiple whitespace
    minified = minified.replace(/\s{2,}/g, ' ')

    return minified.trim()
  }

  /**
   * Generate source maps
   */
  private async generateSourceMaps(): Promise<void> {
    if (!this.config.sourcemaps)
      return

    for (const output of this.outputs) {
      if (output.type === 'js' || output.type === 'css') {
        const content = readFileSync(output.path, 'utf-8')

        // Create basic source map
        const sourceMap = {
          version: 3,
          file: basename(output.path),
          sources: output.sources || [],
          sourcesContent: output.sources?.map(s => existsSync(s) ? readFileSync(s, 'utf-8') : null) || [],
          mappings: '',
          names: [],
        }

        const mapPath = `${output.path}.map`
        writeFileSync(mapPath, JSON.stringify(sourceMap))

        // Add source map reference to file
        const sourceMappingURL = this.config.sourcemaps === 'inline'
          ? `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(sourceMap)).toString('base64')}`
          : `\n//# sourceMappingURL=${basename(mapPath)}`

        if (this.config.sourcemaps !== 'hidden') {
          writeFileSync(output.path, content + sourceMappingURL)
        }

        this.outputs.push({
          path: mapPath,
          type: 'map',
          size: statSync(mapPath).size,
        })
      }
    }
  }

  /**
   * Fingerprint assets in HTML files
   */
  private async fingerprintAssets(): Promise<void> {
    for (const output of this.outputs) {
      if (output.type === 'html') {
        let content = readFileSync(output.path, 'utf-8')

        // Replace asset references with fingerprinted versions
        for (const [original, fingerprinted] of this.assetHashes) {
          const relativePath = relative(dirname(output.path), original)
          content = content.replace(
            new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            `${this.config.publicPath}${fingerprinted}`,
          )
        }

        writeFileSync(output.path, content)
      }
    }
  }

  /**
   * Compress outputs with gzip/brotli
   */
  private async compressOutputs(): Promise<void> {
    const compression = this.config.compression || {}
    const threshold = compression.threshold || 1024

    for (const output of this.outputs) {
      if (output.type === 'map')
        continue
      if (output.size < threshold)
        continue

      const content = readFileSync(output.path)

      // Gzip
      if (compression.gzip) {
        const gzipped = gzipSync(content, { level: 9 })
        const gzipPath = `${output.path}.gz`
        writeFileSync(gzipPath, gzipped)
        output.gzipSize = gzipped.length
      }

      // Brotli (if available)
      if (compression.brotli) {
        try {
          const { brotliCompressSync } = await import('node:zlib')
          const brotlied = brotliCompressSync(content)
          writeFileSync(`${output.path}.br`, brotlied)
        }
        catch {
          // Brotli not available
        }
      }
    }
  }

  /**
   * Analyze bundle
   */
  private async analyzeBundle(): Promise<void> {
    const analyzeOptions = typeof this.config.analyze === 'object' ? this.config.analyze : {}
    const format = analyzeOptions.format || 'text'

    const analysis = {
      outputs: this.outputs.map(o => ({
        path: relative(this.config.outDir, o.path),
        type: o.type,
        size: o.size,
        gzipSize: o.gzipSize,
        sizeFormatted: this.formatSize(o.size),
        gzipSizeFormatted: o.gzipSize ? this.formatSize(o.gzipSize) : undefined,
      })),
      chunks: this.chunks,
      assets: this.assets,
      totalSize: this.outputs.reduce((sum, o) => sum + o.size, 0),
      totalGzipSize: this.outputs.reduce((sum, o) => sum + (o.gzipSize || 0), 0),
    }

    let output: string

    if (format === 'json') {
      output = JSON.stringify(analysis, null, 2)
    }
    else if (format === 'html') {
      output = this.generateAnalysisHtml(analysis)
    }
    else {
      output = this.generateAnalysisText(analysis)
    }

    const filename = analyzeOptions.filename || `bundle-analysis.${format === 'html' ? 'html' : format === 'json' ? 'json' : 'txt'}`
    const outputPath = join(this.config.outDir, filename)
    writeFileSync(outputPath, output)

    // Print summary to console
    console.log('\n📊 Bundle Analysis')
    console.log('─'.repeat(50))
    for (const o of analysis.outputs) {
      const gzipInfo = o.gzipSizeFormatted ? ` (gzip: ${o.gzipSizeFormatted})` : ''
      console.log(`  ${o.path}: ${o.sizeFormatted}${gzipInfo}`)
    }
    console.log('─'.repeat(50))
    console.log(`  Total: ${this.formatSize(analysis.totalSize)} (gzip: ${this.formatSize(analysis.totalGzipSize)})`)
    console.log('')
  }

  /**
   * Generate HTML analysis report
   */
  private generateAnalysisHtml(analysis: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .size { font-family: monospace; text-align: right; }
    .bar { height: 20px; background: #4CAF50; border-radius: 4px; }
    .summary { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>📊 Bundle Analysis</h1>
  <div class="summary">
    <strong>Total Size:</strong> ${this.formatSize(analysis.totalSize)}<br>
    <strong>Gzipped:</strong> ${this.formatSize(analysis.totalGzipSize)}<br>
    <strong>Files:</strong> ${analysis.outputs.length}
  </div>
  <table>
    <thead>
      <tr><th>File</th><th>Type</th><th class="size">Size</th><th class="size">Gzip</th><th>%</th></tr>
    </thead>
    <tbody>
      ${analysis.outputs.map((o: any) => `
        <tr>
          <td>${o.path}</td>
          <td>${o.type}</td>
          <td class="size">${o.sizeFormatted}</td>
          <td class="size">${o.gzipSizeFormatted || '-'}</td>
          <td><div class="bar" style="width: ${Math.round((o.size / analysis.totalSize) * 100)}%"></div></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`
  }

  /**
   * Generate text analysis report
   */
  private generateAnalysisText(analysis: any): string {
    const lines = ['Bundle Analysis', '='.repeat(50), '']

    for (const o of analysis.outputs) {
      lines.push(`${o.path}`)
      lines.push(`  Size: ${o.sizeFormatted}${o.gzipSizeFormatted ? ` (gzip: ${o.gzipSizeFormatted})` : ''}`)
      lines.push('')
    }

    lines.push('='.repeat(50))
    lines.push(`Total: ${this.formatSize(analysis.totalSize)} (gzip: ${this.formatSize(analysis.totalGzipSize)})`)

    return lines.join('\n')
  }

  /**
   * Run plugin hook
   */
  private async runPluginHook(hook: string, arg?: any): Promise<void> {
    if (!this.config.plugins)
      return

    for (const plugin of this.config.plugins) {
      const fn = (plugin as any)[hook]
      if (typeof fn === 'function') {
        await fn.call(plugin, arg || this)
      }
    }
  }

  /**
   * Run plugin transform
   */
  private async runPluginTransform(code: string, id: string): Promise<string> {
    if (!this.config.plugins)
      return code

    let result = code
    for (const plugin of this.config.plugins) {
      if (plugin.transform) {
        const transformed = await plugin.transform(result, id)
        if (transformed != null) {
          result = transformed
        }
      }
    }
    return result
  }

  /**
   * Generate content hash
   */
  private generateHash(content: string | Buffer): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Get output filename with hash
   */
  private getOutputName(name: string, type: OutputFile['type'], hash: string): string {
    const ext = type === 'html' ? '.html' : type === 'css' ? '.css' : type === 'js' ? '.js' : ''
    return `${name}.${hash.slice(0, 8)}${ext}`
  }

  /**
   * Format size in bytes to human readable
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024)
      return `${bytes} B`
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  /**
   * Walk directory recursively
   */
  private walkDir(dir: string, callback: (path: string) => void): void {
    if (!existsSync(dir))
      return

    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        this.walkDir(fullPath, callback)
      }
      else {
        callback(fullPath)
      }
    }
  }

  /**
   * Get build result
   */
  private getResult(): BuildResult {
    const duration = Date.now() - this.startTime
    const totalSize = this.outputs.reduce((sum, o) => sum + o.size, 0)
    const gzipSize = this.outputs.reduce((sum, o) => sum + (o.gzipSize || 0), 0)

    return {
      outputs: this.outputs,
      duration,
      totalSize,
      gzipSize,
      chunks: this.chunks,
      assets: this.assets,
      warnings: this.warnings,
      errors: this.errors,
    }
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Create and run a production build
 */
export async function build(config: ProductionBuildConfig): Promise<BuildResult> {
  const builder = new ProductionBuild(config)
  return builder.build()
}

/**
 * Create a production build instance
 */
export function createProductionBuild(config: ProductionBuildConfig): ProductionBuild {
  return new ProductionBuild(config)
}

/**
 * Default production config
 */
export function defineConfig(config: ProductionBuildConfig): ProductionBuildConfig {
  return { ...defaultConfig, ...config } as ProductionBuildConfig
}
