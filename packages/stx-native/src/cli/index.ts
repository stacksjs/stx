#!/usr/bin/env node
/**
 * STX Native CLI
 *
 * Command-line interface for building and running STX Native apps.
 *
 * Usage:
 *   stx-native run ios          # Run on iOS simulator
 *   stx-native run android      # Run on Android emulator
 *   stx-native build ios        # Build iOS app
 *   stx-native build android    # Build Android app
 *   stx-native init             # Initialize a new STX Native project
 *   stx-native dev              # Start dev server with hot reload
 */

import { spawn, execSync, ChildProcess } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync, watchFile, readdirSync } from 'fs'
import { join, resolve, dirname, basename, extname } from 'path'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { parseSTX, compileSTX } from '../compiler/parser'
import type { STXDocument } from '../compiler/ir'

// ============================================================================
// Types
// ============================================================================

interface CLIConfig {
  projectRoot: string
  entryFile: string
  outputDir: string
  platform: 'ios' | 'android' | 'all'
  debug: boolean
  port: number
}

interface ProjectConfig {
  name: string
  version: string
  displayName: string
  bundleId: string
  androidPackage: string
  entry: string
  ios?: {
    deploymentTarget: string
    teamId?: string
  }
  android?: {
    minSdk: number
    targetSdk: number
    compileSdk: number
  }
}

// ============================================================================
// CLI Implementation
// ============================================================================

class STXCLI {
  private config: CLIConfig
  private projectConfig: ProjectConfig | null = null
  private devServer: ReturnType<typeof createServer> | null = null
  private wsServer: WebSocketServer | null = null
  private connectedClients: Set<WebSocket> = new Set()
  private watchedFiles: Map<string, number> = new Map()

  constructor() {
    this.config = {
      projectRoot: process.cwd(),
      entryFile: 'App.stx',
      outputDir: '.stx-native',
      platform: 'all',
      debug: true,
      port: 8081,
    }
  }

  async run(args: string[]): Promise<void> {
    const command = args[0]
    const subCommand = args[1]
    const flags = this.parseFlags(args.slice(2))

    // Apply flags
    if (flags.debug !== undefined) this.config.debug = flags.debug
    if (flags.port) this.config.port = parseInt(flags.port, 10)
    if (flags.entry) this.config.entryFile = flags.entry

    // Load project config
    this.loadProjectConfig()

    switch (command) {
      case 'run':
        await this.runCommand(subCommand as 'ios' | 'android', flags)
        break
      case 'build':
        await this.buildCommand(subCommand as 'ios' | 'android', flags)
        break
      case 'init':
        await this.initCommand(flags)
        break
      case 'dev':
        await this.devCommand(flags)
        break
      case 'compile':
        await this.compileCommand(flags)
        break
      case 'help':
      case '--help':
      case '-h':
        this.showHelp()
        break
      case 'version':
      case '--version':
      case '-v':
        this.showVersion()
        break
      default:
        console.error(`Unknown command: ${command}`)
        this.showHelp()
        process.exit(1)
    }
  }

  // ========================================================================
  // Commands
  // ========================================================================

  private async runCommand(platform: 'ios' | 'android', flags: Record<string, string>): Promise<void> {
    if (!platform || (platform !== 'ios' && platform !== 'android')) {
      console.error('Please specify a platform: stx-native run ios|android')
      process.exit(1)
    }

    console.log(`\n🚀 Running STX Native app on ${platform}...\n`)

    // First, compile the app
    await this.compileApp()

    // Start dev server
    await this.startDevServer()

    // Run on platform
    if (platform === 'ios') {
      await this.runIOS(flags)
    } else {
      await this.runAndroid(flags)
    }
  }

  private async buildCommand(platform: 'ios' | 'android', flags: Record<string, string>): Promise<void> {
    if (!platform || (platform !== 'ios' && platform !== 'android')) {
      console.error('Please specify a platform: stx-native build ios|android')
      process.exit(1)
    }

    const release = flags.release === 'true'
    console.log(`\n🔨 Building STX Native app for ${platform} (${release ? 'release' : 'debug'})...\n`)

    // Compile the app
    await this.compileApp()

    // Build for platform
    if (platform === 'ios') {
      await this.buildIOS(release)
    } else {
      await this.buildAndroid(release)
    }
  }

  private async initCommand(flags: Record<string, string>): Promise<void> {
    const projectName = flags.name || basename(this.config.projectRoot)

    console.log(`\n📦 Initializing STX Native project: ${projectName}\n`)

    // Create project structure
    const dirs = [
      'src',
      'src/components',
      'src/screens',
      'ios',
      'android',
      '.stx-native',
    ]

    for (const dir of dirs) {
      const fullPath = join(this.config.projectRoot, dir)
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true })
        console.log(`  Created: ${dir}/`)
      }
    }

    // Create stx-native.config.json
    const config: ProjectConfig = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      displayName: projectName,
      bundleId: `com.example.${projectName.toLowerCase().replace(/\s+/g, '')}`,
      androidPackage: `com.example.${projectName.toLowerCase().replace(/\s+/g, '')}`,
      entry: 'src/App.stx',
      ios: {
        deploymentTarget: '13.0',
      },
      android: {
        minSdk: 21,
        targetSdk: 34,
        compileSdk: 34,
      },
    }

    writeFileSync(
      join(this.config.projectRoot, 'stx-native.config.json'),
      JSON.stringify(config, null, 2)
    )
    console.log('  Created: stx-native.config.json')

    // Create App.stx
    const appTemplate = `<script>
  let count = 0

  function increment() {
    count++
  }

  function decrement() {
    count--
  }
</script>

<template>
  <SafeAreaView class="flex-1 bg-gray-900">
    <View class="flex-1 justify-center items-center p-4">
      <Text class="text-white text-4xl font-bold mb-8">
        Welcome to STX Native
      </Text>

      <Text class="text-gray-400 text-lg mb-8">
        Count: {count}
      </Text>

      <View class="flex-row gap-4">
        <Button
          class="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={decrement}
        >
          <Text class="text-white font-semibold">-</Text>
        </Button>

        <Button
          class="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={increment}
        >
          <Text class="text-white font-semibold">+</Text>
        </Button>
      </View>
    </View>
  </SafeAreaView>
</template>
`
    writeFileSync(join(this.config.projectRoot, 'src', 'App.stx'), appTemplate)
    console.log('  Created: src/App.stx')

    // Create package.json
    const packageJson = {
      name: config.name,
      version: config.version,
      private: true,
      scripts: {
        dev: 'stx-native dev',
        'run:ios': 'stx-native run ios',
        'run:android': 'stx-native run android',
        'build:ios': 'stx-native build ios',
        'build:android': 'stx-native build android',
      },
      dependencies: {
        'stx-native': '^1.0.0',
      },
    }

    writeFileSync(
      join(this.config.projectRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
    console.log('  Created: package.json')

    console.log('\n✅ Project initialized successfully!')
    console.log('\nNext steps:')
    console.log('  1. cd ' + projectName)
    console.log('  2. npm install')
    console.log('  3. stx-native run ios  # or android')
    console.log('')
  }

  private async devCommand(flags: Record<string, string>): Promise<void> {
    console.log(`\n🔥 Starting STX Native dev server...\n`)

    // Compile the app
    await this.compileApp()

    // Start dev server with hot reload
    await this.startDevServer()

    // Watch for file changes
    this.startFileWatcher()

    console.log(`\n📱 Dev server running at http://localhost:${this.config.port}`)
    console.log('   WebSocket for hot reload at ws://localhost:' + this.config.port)
    console.log('\n   Watching for file changes...\n')
  }

  private async compileCommand(flags: Record<string, string>): Promise<void> {
    const inputFile = flags.input || flags._[0]
    const outputFile = flags.output || flags.o

    if (!inputFile) {
      console.error('Please specify an input file: stx-native compile <file.stx>')
      process.exit(1)
    }

    const content = readFileSync(inputFile, 'utf-8')
    const ir = compileSTX(content, inputFile)

    if (outputFile) {
      writeFileSync(outputFile, ir)
      console.log(`Compiled: ${inputFile} → ${outputFile}`)
    } else {
      console.log(ir)
    }
  }

  // ========================================================================
  // Platform Runners
  // ========================================================================

  private async runIOS(flags: Record<string, string>): Promise<void> {
    const simulator = flags.simulator || 'iPhone 15'
    const iosDir = join(this.config.projectRoot, 'ios')

    if (!existsSync(iosDir)) {
      console.log('iOS project not found. Generating...')
      await this.generateIOSProject()
    }

    console.log(`\n📱 Launching iOS simulator (${simulator})...\n`)

    // Boot simulator
    try {
      execSync(`xcrun simctl boot "${simulator}" 2>/dev/null || true`, { stdio: 'inherit' })
    } catch {
      // Simulator might already be booted
    }

    // Open Simulator app
    execSync('open -a Simulator', { stdio: 'inherit' })

    // Build and run
    const buildProcess = spawn('xcodebuild', [
      '-workspace', join(iosDir, `${this.projectConfig?.name || 'STXApp'}.xcworkspace`),
      '-scheme', this.projectConfig?.name || 'STXApp',
      '-configuration', this.config.debug ? 'Debug' : 'Release',
      '-destination', `platform=iOS Simulator,name=${simulator}`,
      'build',
    ], { stdio: 'inherit' })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Build succeeded. Installing on simulator...')
        // Install and launch
        const appPath = this.findIOSAppPath()
        if (appPath) {
          execSync(`xcrun simctl install booted "${appPath}"`, { stdio: 'inherit' })
          execSync(`xcrun simctl launch booted ${this.projectConfig?.bundleId}`, { stdio: 'inherit' })
        }
      } else {
        console.error('\n❌ Build failed')
      }
    })
  }

  private async runAndroid(flags: Record<string, string>): Promise<void> {
    const androidDir = join(this.config.projectRoot, 'android')

    if (!existsSync(androidDir)) {
      console.log('Android project not found. Generating...')
      await this.generateAndroidProject()
    }

    console.log('\n📱 Launching Android emulator...\n')

    // Check for running emulator
    try {
      const devices = execSync('adb devices').toString()
      if (!devices.includes('emulator')) {
        // Start emulator
        const emulators = execSync('emulator -list-avds').toString().trim().split('\n')
        if (emulators.length > 0) {
          spawn('emulator', ['-avd', emulators[0]], { detached: true, stdio: 'ignore' })
          console.log('Starting emulator... waiting 30s')
          await new Promise(resolve => setTimeout(resolve, 30000))
        }
      }
    } catch (e) {
      console.warn('Could not start emulator automatically')
    }

    // Build and run
    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
    const buildProcess = spawn(gradlew, [
      this.config.debug ? 'installDebug' : 'installRelease',
    ], {
      cwd: androidDir,
      stdio: 'inherit',
      shell: true,
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Build succeeded. Launching app...')
        execSync(`adb shell am start -n ${this.projectConfig?.androidPackage}/.MainActivity`, { stdio: 'inherit' })
      } else {
        console.error('\n❌ Build failed')
      }
    })
  }

  // ========================================================================
  // Platform Builders
  // ========================================================================

  private async buildIOS(release: boolean): Promise<void> {
    const iosDir = join(this.config.projectRoot, 'ios')

    if (!existsSync(iosDir)) {
      await this.generateIOSProject()
    }

    const archiveProcess = spawn('xcodebuild', [
      '-workspace', join(iosDir, `${this.projectConfig?.name || 'STXApp'}.xcworkspace`),
      '-scheme', this.projectConfig?.name || 'STXApp',
      '-configuration', release ? 'Release' : 'Debug',
      '-archivePath', join(this.config.outputDir, 'build', 'ios', `${this.projectConfig?.name}.xcarchive`),
      'archive',
    ], { stdio: 'inherit' })

    archiveProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ iOS archive created successfully')
      } else {
        console.error('\n❌ iOS build failed')
      }
    })
  }

  private async buildAndroid(release: boolean): Promise<void> {
    const androidDir = join(this.config.projectRoot, 'android')

    if (!existsSync(androidDir)) {
      await this.generateAndroidProject()
    }

    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
    const task = release ? 'assembleRelease' : 'assembleDebug'

    const buildProcess = spawn(gradlew, [task], {
      cwd: androidDir,
      stdio: 'inherit',
      shell: true,
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Android APK built successfully')
        console.log(`   Output: android/app/build/outputs/apk/${release ? 'release' : 'debug'}/`)
      } else {
        console.error('\n❌ Android build failed')
      }
    })
  }

  // ========================================================================
  // Project Generation
  // ========================================================================

  private async generateIOSProject(): Promise<void> {
    const iosDir = join(this.config.projectRoot, 'ios')
    mkdirSync(iosDir, { recursive: true })

    // Generate basic iOS project structure
    // In a real implementation, this would create Xcode project files
    console.log('  Generated iOS project skeleton')
    console.log('  NOTE: Full iOS project generation requires Xcode templates')
  }

  private async generateAndroidProject(): Promise<void> {
    const androidDir = join(this.config.projectRoot, 'android')
    mkdirSync(join(androidDir, 'app', 'src', 'main', 'java'), { recursive: true })
    mkdirSync(join(androidDir, 'app', 'src', 'main', 'res', 'layout'), { recursive: true })

    // Generate basic Android project structure
    // In a real implementation, this would create full Gradle project
    console.log('  Generated Android project skeleton')
    console.log('  NOTE: Full Android project generation requires Gradle templates')
  }

  // ========================================================================
  // Dev Server
  // ========================================================================

  private async startDevServer(): Promise<void> {
    return new Promise((resolve) => {
      this.devServer = createServer((req, res) => {
        this.handleDevRequest(req, res)
      })

      // WebSocket server for hot reload
      this.wsServer = new WebSocketServer({ server: this.devServer })
      this.wsServer.on('connection', (ws) => {
        this.connectedClients.add(ws)
        console.log('  📱 Device connected')

        ws.on('close', () => {
          this.connectedClients.delete(ws)
          console.log('  📱 Device disconnected')
        })
      })

      this.devServer.listen(this.config.port, () => {
        resolve()
      })
    })
  }

  private handleDevRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/'

    if (url === '/bundle.js' || url === '/') {
      // Serve compiled bundle
      const bundlePath = join(this.config.outputDir, 'bundle.js')
      if (existsSync(bundlePath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' })
        res.end(readFileSync(bundlePath))
      } else {
        res.writeHead(404)
        res.end('Bundle not found')
      }
    } else if (url === '/ir.json') {
      // Serve compiled IR
      const irPath = join(this.config.outputDir, 'ir.json')
      if (existsSync(irPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(readFileSync(irPath))
      } else {
        res.writeHead(404)
        res.end('IR not found')
      }
    } else if (url === '/health') {
      res.writeHead(200)
      res.end('OK')
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  }

  private startFileWatcher(): void {
    const srcDir = join(this.config.projectRoot, 'src')
    this.watchDirectory(srcDir)
  }

  private watchDirectory(dir: string): void {
    if (!existsSync(dir)) return

    const files = readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
      const fullPath = join(dir, file.name)

      if (file.isDirectory()) {
        this.watchDirectory(fullPath)
      } else if (file.name.endsWith('.stx') || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        watchFile(fullPath, { interval: 500 }, async (curr, prev) => {
          if (curr.mtime !== prev.mtime) {
            console.log(`  📝 File changed: ${file.name}`)
            await this.handleFileChange(fullPath)
          }
        })
        this.watchedFiles.set(fullPath, Date.now())
      }
    }
  }

  private async handleFileChange(filePath: string): Promise<void> {
    try {
      // Recompile
      await this.compileApp()

      // Notify connected clients
      const message = JSON.stringify({
        type: 'HOT_RELOAD',
        payload: {
          changedFiles: [filePath],
          preserveState: true,
        },
      })

      for (const client of this.connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      }

      console.log('  🔄 Hot reload sent to', this.connectedClients.size, 'client(s)')
    } catch (error) {
      console.error('  ❌ Compile error:', error)
    }
  }

  // ========================================================================
  // Compilation
  // ========================================================================

  private async compileApp(): Promise<void> {
    const entryPath = join(this.config.projectRoot, this.projectConfig?.entry || this.config.entryFile)

    if (!existsSync(entryPath)) {
      throw new Error(`Entry file not found: ${entryPath}`)
    }

    // Create output directory
    const outputDir = join(this.config.projectRoot, this.config.outputDir)
    mkdirSync(outputDir, { recursive: true })

    // Compile entry file
    const content = readFileSync(entryPath, 'utf-8')
    const document = parseSTX(content, entryPath)

    // Write IR
    writeFileSync(
      join(outputDir, 'ir.json'),
      JSON.stringify(document, null, 2)
    )

    // Generate bundle (combines IR + runtime)
    const bundle = this.generateBundle(document)
    writeFileSync(join(outputDir, 'bundle.js'), bundle)

    console.log('  ✅ Compiled successfully')
  }

  private generateBundle(document: STXDocument): string {
    // Generate a JavaScript bundle that includes the IR and runtime
    return `
// STX Native Bundle
// Generated at ${new Date().toISOString()}

(function() {
  'use strict';

  // STX Document IR
  const __STX_DOCUMENT__ = ${JSON.stringify(document)};

  // Script code
  ${document.script.code}

  // Initialize bridge
  if (typeof globalThis.__stxNativeBridge !== 'undefined') {
    const bridge = globalThis.__stxNativeBridge;

    // Register handlers
    ${document.script.functions.map(fn => `
    if (typeof ${fn} === 'function') {
      globalThis.__stxHandlers['${fn}'] = ${fn};
    }
    `).join('\n')}

    // Render initial UI
    bridge.postMessage(JSON.stringify({
      id: 'init_' + Date.now(),
      type: 'RENDER',
      timestamp: Date.now(),
      payload: {
        document: __STX_DOCUMENT__.root,
        mode: 'replace'
      },
      source: 'js'
    }));
  }

  // Export for debugging
  globalThis.__STX_DOCUMENT__ = __STX_DOCUMENT__;
})();
`
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private loadProjectConfig(): void {
    const configPath = join(this.config.projectRoot, 'stx-native.config.json')
    if (existsSync(configPath)) {
      this.projectConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
    }
  }

  private parseFlags(args: string[]): Record<string, string> {
    const flags: Record<string, string> = { _: [] as unknown as string }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=')
        flags[key] = value || args[++i] || 'true'
      } else if (arg.startsWith('-')) {
        const key = arg.slice(1)
        flags[key] = args[++i] || 'true'
      } else {
        (flags._ as unknown as string[]).push(arg)
      }
    }

    return flags
  }

  private findIOSAppPath(): string | null {
    const buildDir = join(this.config.projectRoot, 'ios', 'build')
    // Search for .app in build directory
    // This is simplified - real implementation would search properly
    return null
  }

  private showHelp(): void {
    console.log(`
STX Native CLI

Usage:
  stx-native <command> [options]

Commands:
  init                    Initialize a new STX Native project
  dev                     Start development server with hot reload
  run ios                 Run on iOS simulator
  run android             Run on Android emulator
  build ios               Build iOS app
  build android           Build Android app
  compile <file>          Compile STX file to IR

Options:
  --port <number>         Dev server port (default: 8081)
  --entry <file>          Entry file (default: src/App.stx)
  --debug                 Build in debug mode (default)
  --release               Build in release mode
  --simulator <name>      iOS simulator name (default: "iPhone 15")

Examples:
  stx-native init --name MyApp
  stx-native dev --port 8082
  stx-native run ios --simulator "iPhone 15 Pro"
  stx-native build android --release
`)
  }

  private showVersion(): void {
    console.log('stx-native v1.0.0')
  }
}

// ============================================================================
// Entry Point
// ============================================================================

const cli = new STXCLI()
cli.run(process.argv.slice(2)).catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})

export { STXCLI }
