#!/usr/bin/env node
/* eslint-disable no-console */
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

import { spawn, execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync, watchFile, readdirSync } from 'fs'
import { join, resolve, basename } from 'path'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { parseSTX } from '../compiler/parser'
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
  /** Named .stx screens compiled into one native bundle. */
  screens?: Record<string, string>
  /** First screen when no route is supplied by the native host. */
  initialScreen?: string
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
    /*
     * From the argument after the command, not two after it.
     *
     * `args[1]` used to be read as a subcommand and parsing began at `args[2]`,
     * which works for `run ios` and `build android` and silently eats the only
     * argument of every command that takes a positional instead. The documented
     * `compile <file>` could therefore never receive its file, and answered
     * "Please specify an input file" for a command that specified one. Nothing
     * had executed this file, so nothing had noticed (stacksjs/stx#1985).
     */
    const { flags, positionals } = this.parseArgs(args.slice(1))

    // Apply flags
    if (flags.debug !== undefined) this.config.debug = flags.debug
    if (flags.port) this.config.port = parseInt(flags.port, 10)
    if (flags.entry) this.config.entryFile = flags.entry

    // Load project config
    this.loadProjectConfig()

    switch (command) {
      case 'run':
        await this.runCommand(positionals[0] as 'ios' | 'android', flags)
        break
      case 'build':
        await this.buildCommand(positionals[0] as 'ios' | 'android', flags)
        break
      case 'init':
        await this.initCommand(flags)
        break
      case 'dev':
        await this.devCommand(flags)
        break
      case 'compile':
        await this.compileCommand(flags, positionals)
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
    }
else {
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
    }
else {
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
    console.log(`  1. cd ${projectName}`)
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
    console.log(`   WebSocket for hot reload at ws://localhost:${this.config.port}`)
    console.log('\n   Watching for file changes...\n')
  }

  private async compileCommand(flags: Record<string, string>, positionals: string[]): Promise<void> {
    const inputFile = flags.input || positionals[0]
    const outputFile = flags.output || flags.o
    const format = flags.format || 'ir'
    const routes = this.configuredScreens()

    if (!inputFile && !routes) {
      console.error('Please specify an input file: stx-native compile <file.stx>')
      process.exit(1)
    }
    if (inputFile && routes)
      throw new Error('Screen routes are configured in stx-native.config.json; compile without an input file')

    if (format !== 'ir' && format !== 'bundle') {
      throw new Error(`Unknown compile format: ${format}. Expected ir or bundle.`)
    }

    const document = routes ? null : parseSTX(readFileSync(inputFile!, 'utf-8'), inputFile!)
    const result = format === 'bundle'
      ? routes ? this.generateRouteBundle(routes) : this.generateBundle(document!)
      : JSON.stringify(routes ?? document, null, 2)

    if (outputFile) {
      writeFileSync(outputFile, result)
      console.log(`Compiled: ${inputFile} → ${outputFile}`)
    }
else {
      console.log(result)
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
    }
catch {
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
      }
else {
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
    }
catch (e) {
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
      }
else {
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
      }
else {
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
      }
else {
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
      }
else {
        res.writeHead(404)
        res.end('Bundle not found')
      }
    }
else if (url === '/ir.json') {
      // Serve compiled IR
      const irPath = join(this.config.outputDir, 'ir.json')
      if (existsSync(irPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(readFileSync(irPath))
      }
else {
        res.writeHead(404)
        res.end('IR not found')
      }
    }
else if (url === '/health') {
      res.writeHead(200)
      res.end('OK')
    }
else {
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
      }
else if (file.name.endsWith('.stx') || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
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
    }
catch (error) {
      console.error('  ❌ Compile error:', error)
    }
  }

  // ========================================================================
  // Compilation
  // ========================================================================

  private async compileApp(): Promise<void> {
    const routes = this.configuredScreens()
    const entryPath = join(this.config.projectRoot, this.projectConfig?.entry || this.config.entryFile)

    if (!routes && !existsSync(entryPath)) {
      throw new Error(`Entry file not found: ${entryPath}`)
    }

    // Create output directory
    const outputDir = join(this.config.projectRoot, this.config.outputDir)
    mkdirSync(outputDir, { recursive: true })

    // Compile entry file
    const document = routes ? null : parseSTX(readFileSync(entryPath, 'utf-8'), entryPath)

    // Write IR
    writeFileSync(
      join(outputDir, 'ir.json'),
      JSON.stringify(routes ?? document, null, 2)
    )

    // Generate bundle (combines IR + runtime)
    const bundle = routes ? this.generateRouteBundle(routes) : this.generateBundle(document!)
    writeFileSync(join(outputDir, 'bundle.js'), bundle)

    console.log('  ✅ Compiled successfully')
  }

  private configuredScreens(): { initialScreen: string, screens: Record<string, STXDocument> } | null {
    const configured = this.projectConfig?.screens
    if (!configured) return null
    const entries = Object.entries(configured)
    if (entries.length === 0) throw new Error('screens must name at least one .stx file')
    const screens: Record<string, STXDocument> = {}
    for (const [name, file] of entries) {
      if (!/^[A-Za-z][\w-]*$/.test(name)) throw new Error(`Invalid native screen name: ${name}`)
      if (typeof file !== 'string' || !file.endsWith('.stx')) throw new Error(`Screen ${name} must name a .stx file`)
      const source = resolve(this.config.projectRoot, file)
      screens[name] = parseSTX(readFileSync(source, 'utf-8'), source)
    }
    const initialScreen = this.projectConfig?.initialScreen || entries[0][0]
    if (!screens[initialScreen]) throw new Error(`Initial screen ${initialScreen} is not in screens`)
    return { initialScreen, screens }
  }

  private generateRouteBundle(routes: { initialScreen: string, screens: Record<string, STXDocument> }): string {
    const names = Object.keys(routes.screens)
    const header = `
(function() {
  const names = ${JSON.stringify(names)};
  const name = globalThis.__stxNativeRoute || ${JSON.stringify(routes.initialScreen)};
  if (!names.includes(name)) throw new Error('Unknown native screen: ' + name);
  globalThis.__stxNativeRoute = name;
})();
`
    return header + names.map(name => this.generateBundle(routes.screens[name], name, names)).join('\n')
  }

  private generateBundle(document: STXDocument, routeName?: string, routeNames?: string[]): string {
    // This is the small JavaScriptCore runtime for a native screen. The
    // compiled IR is data, while expressions and handlers execute in the same
    // lexical scope as the screen's script. A handler triggers a fresh tree so
    // the first native slice does not require a DOM or a WebView.
    return `
// STX Native Bundle
// Generated at ${new Date().toISOString()}

(function() {
  'use strict';

  ${routeName ? `if (globalThis.__stxNativeRoute !== ${JSON.stringify(routeName)}) return;` : ''}
  const __STX_ROUTE_NAME__ = ${JSON.stringify(routeName ?? 'main')};
  const __STX_ROUTE_NAMES__ = ${JSON.stringify(routeNames ?? ['main'])};

  // STX Document IR
  const __STX_DOCUMENT__ = ${JSON.stringify(document)};

  if (typeof globalThis.__stxNativeBridge !== 'undefined') {
    const bridge = globalThis.__stxNativeBridge;
    const handlers = globalThis.__stxHandlers || (globalThis.__stxHandlers = {});
    const pendingAPI = new Map();
    const appStateHandlers = new Set();
    const deepLinkHandlers = new Set();
    const scheduleTimeout = typeof globalThis.setTimeout === 'function'
      ? globalThis.setTimeout.bind(globalThis)
      : null;
    const cancelTimeout = typeof globalThis.clearTimeout === 'function'
      ? globalThis.clearTimeout.bind(globalThis)
      : null;
    let currentAppState = ['active', 'inactive', 'background'].includes(bridge.initialAppState)
      ? bridge.initialAppState
      : 'active';
    let initialDeepLinkClaimed = false;
    let sequence = 0;

    function send(type, payload, id) {
      const messageId = id || 'js_' + (++sequence);
      bridge.postMessage(JSON.stringify({
        id: messageId,
        type,
        timestamp: Date.now(),
        payload,
        source: 'js'
      }));
      return messageId;
    }

    function resolveValue(value, item, index) {
      if (typeof value !== 'string' || !value.includes('{')) return value;
      const exact = value.match(/^\\{([^{}]+)\\}$/);
      if (exact) return eval(exact[1]);
      return value.replace(/\\{([^{}]+)\\}/g, function(_match, expression) {
        // Expressions are compiler-owned screen code. Direct eval retains the
        // screen scope plus a FlatList template's item and index bindings.
        const answer = eval(expression);
        return answer == null ? '' : String(answer);
      });
    }

    function resolveText(value, item, index) {
      const answer = resolveValue(value, item, index);
      return answer == null ? '' : String(answer);
    }

    const mutationProtocolVersion = Number(bridge.mutationProtocolVersion || 0);
    let mutationRevision = 0;
    let mutationsEnabled = mutationProtocolVersion === 1;
    let previousTree = null;
    let latestTree = null;

    function nodeKey(node, item, index) {
      const props = node.props || {};
      return resolveValue(node.key || props.key || props.testID || null, item, index);
    }

    function listExpression(value, item, index) {
      if (typeof value !== 'string') return value;
      const exact = value.match(/^\\{([^{}]+)\\}$/);
      const answer = eval(exact ? exact[1] : value);
      return typeof answer === 'function' ? answer(item, index) : answer;
    }

    function listRole(node) {
      return node && typeof node !== 'string' ? (node.props || {}).listRole || null : null;
    }

    function resolveListNode(node, id, resolvedProps) {
      const rawProps = node.props || {};
      const data = listExpression(rawProps.data, undefined, undefined);
      const templates = (node.children || []).filter(function(child) { return typeof child !== 'string'; });
      const itemTemplates = templates.filter(function(child) { return listRole(child) === 'item'; });
      if (!Array.isArray(data) || itemTemplates.length === 0) return null;

      const groups = {
        header: templates.filter(function(child) { return listRole(child) === 'header'; }),
        empty: templates.filter(function(child) { return listRole(child) === 'empty'; }),
        separator: templates.filter(function(child) { return listRole(child) === 'separator'; }),
        footer: templates.filter(function(child) { return listRole(child) === 'footer'; })
      };
      const children = [];
      const seenKeys = new Map();
      function appendTemplates(entries, role, item, index, keyPrefix) {
        entries.forEach(function(template, templateIndex) {
          const suffix = entries.length === 1 ? '' : '/template:' + templateIndex;
          const child = resolveNode(template, id + '/' + keyPrefix + suffix, item, index);
          child.props = { ...(child.props || {}), listRole: role };
          children.push(child);
        });
      }
      appendTemplates(groups.header, 'header', undefined, -1, 'header');
      if (data.length === 0) {
        appendTemplates(groups.empty, 'empty', undefined, -1, 'empty');
      }
      else {
        data.forEach(function(item, index) {
          let key = rawProps.keyExtractor == null
            ? item && (item.key ?? item.id)
            : listExpression(rawProps.keyExtractor, item, index);
          if (key == null || key === '') key = index;
          const encodedKey = encodeURIComponent(String(key));
          const occurrence = seenKeys.get(encodedKey) || 0;
          seenKeys.set(encodedKey, occurrence + 1);
          const uniqueKey = occurrence === 0 ? encodedKey : encodedKey + '#' + occurrence;
          itemTemplates.forEach(function(template, templateIndex) {
            const suffix = itemTemplates.length === 1 ? '' : '/template:' + templateIndex;
            const child = resolveNode(template, id + '/key:' + uniqueKey + suffix, item, index);
            child.props = { ...(child.props || {}), key: String(key), listRole: 'item' };
            children.push(child);
          });
          if (index < data.length - 1) {
            appendTemplates(groups.separator, 'separator', item, index, 'separator:' + uniqueKey);
          }
        });
      }
      appendTemplates(groups.footer, 'footer', undefined, data.length, 'footer');
      const props = { ...resolvedProps, itemCount: data.length };
      delete props.data;
      delete props.keyExtractor;
      return { ...node, id, props, children };
    }

    function resolveNode(node, id, item, itemIndex) {
      const isDataList = node.type === 'FlatList' && (node.props || {}).data != null;
      const resolvedProps = Object.fromEntries(Object.entries(node.props || {}).map(function([key, value]) {
        if (isDataList && (key === 'data' || key === 'keyExtractor')) return [key, value];
        return [key, resolveValue(value, item, itemIndex)];
      }));
      if (isDataList) {
        const list = resolveListNode(node, id, resolvedProps);
        if (list) return list;
      }
      const rawChildren = node.children || [];
      const keyedCounts = new Map();
      rawChildren.forEach(function(child) {
        if (typeof child === 'string') return;
        const key = nodeKey(child, item, itemIndex);
        if (key) keyedCounts.set(key, (keyedCounts.get(key) || 0) + 1);
      });
      return {
        ...node,
        id,
        props: resolvedProps,
        children: rawChildren.map(function(child, index) {
          if (typeof child === 'string') return resolveText(child, item, itemIndex);
          const key = nodeKey(child, item, itemIndex);
          const childId = key && keyedCounts.get(key) === 1
            ? id + '/key:' + key
            : id + '/index:' + index;
          return resolveNode(child, childId, item, itemIndex);
        })
      };
    }

    function nodeValue(node) {
      return {
        type: node.type,
        props: node.props || {},
        style: node.style || {},
        events: node.events || {},
        children: (node.children || []).filter(function(child) { return typeof child === 'string'; })
      };
    }

    function treeValue(node) {
      return {
        id: node.id,
        ...nodeValue(node),
        children: (node.children || []).map(function(child) {
          return typeof child === 'string' ? child : treeValue(child);
        })
      };
    }

    function flatten(root) {
      const result = new Map();
      function visit(node, parentId, index) {
        const childNodes = (node.children || []).filter(function(child) { return typeof child !== 'string'; });
        result.set(node.id, {
          node,
          parentId,
          index,
          children: childNodes.map(function(child) { return child.id; })
        });
        childNodes.forEach(function(child, childIndex) { visit(child, node.id, childIndex); });
      }
      visit(root, null, 0);
      return result;
    }

    function createTreeOperations(tree) {
      const nodes = flatten(tree);
      const operations = [];
      nodes.forEach(function(entry, id) {
        operations.push({ op: 'createNode', id, root: entry.parentId === null, node: nodeValue(entry.node) });
      });
      nodes.forEach(function(entry, parentId) {
        entry.children.forEach(function(childId, index) {
          operations.push({ op: 'insertChild', parentId, childId, index });
        });
      });
      return operations;
    }

    function equivalent(left, right) {
      return JSON.stringify(left) === JSON.stringify(right);
    }

    function diffTrees(before, after) {
      const oldNodes = flatten(before);
      const newNodes = flatten(after);
      const typeChanged = Array.from(oldNodes.keys()).some(function(id) {
        return newNodes.has(id) && oldNodes.get(id).node.type !== newNodes.get(id).node.type;
      });
      if (typeChanged) {
        return [{ op: 'removeNode', id: before.id }].concat(createTreeOperations(after));
      }

      const operations = [];
      const removed = new Set(Array.from(oldNodes.keys()).filter(function(id) { return !newNodes.has(id); }));
      oldNodes.forEach(function(entry, id) {
        if (!removed.has(id) || (entry.parentId && removed.has(entry.parentId))) return;
        operations.push({ op: 'removeNode', id });
      });

      newNodes.forEach(function(entry, id) {
        if (!oldNodes.has(id)) operations.push({ op: 'createNode', id, root: entry.parentId === null, node: nodeValue(entry.node) });
      });

      newNodes.forEach(function(entry, id) {
        const previous = oldNodes.get(id);
        if (!previous) return;
        const oldValue = nodeValue(previous.node);
        const newValue = nodeValue(entry.node);
        const patch = {};
        if (!equivalent(oldValue.props, newValue.props)) patch.props = newValue.props;
        if (!equivalent(oldValue.style, newValue.style)) patch.style = newValue.style;
        if (!equivalent(oldValue.events, newValue.events)) patch.events = newValue.events;
        if (!equivalent(oldValue.children, newValue.children)) patch.children = newValue.children;
        if (Object.keys(patch).length) operations.push({ op: 'updateNode', id, patch });
      });

      newNodes.forEach(function(entry, parentId) {
        let current = [];
        const previous = oldNodes.get(parentId);
        if (previous) {
          current = previous.children.filter(function(id) {
            return newNodes.has(id) && newNodes.get(id).parentId === parentId;
          });
        }
        entry.children.forEach(function(childId, index) {
          if (current[index] === childId) return;
          const oldIndex = current.indexOf(childId);
          if (oldIndex >= 0) {
            operations.push({ op: 'moveChild', parentId, childId, index });
            current.splice(oldIndex, 1);
            current.splice(index, 0, childId);
          }
          else {
            operations.push({ op: 'insertChild', parentId, childId, index });
            current.splice(index, 0, childId);
          }
        });
      });
      return operations;
    }

    function sendRenderFallback() {
      send('RENDER', { document: treeValue(latestTree), mode: 'replace' }, 'render_' + Date.now() + '_' + (++sequence));
    }

    function render() {
      const nextTree = resolveNode(__STX_DOCUMENT__.root, 'root');
      latestTree = nextTree;
      if (!mutationsEnabled) {
        sendRenderFallback();
        return;
      }
      if (!previousTree) {
        previousTree = nextTree;
        sendRenderFallback();
        return;
      }
      const operations = diffTrees(previousTree, nextTree);
      previousTree = nextTree;
      if (!operations.length) return;
      const baseRevision = mutationRevision;
      mutationRevision += 1;
      send('MUTATE', {
        version: mutationProtocolVersion,
        batchId: 'mutation_' + mutationRevision,
        baseRevision,
        revision: mutationRevision,
        operations
      });
    }

    function requestAPI(module, method, args) {
      return new Promise(function(resolve, reject) {
        const id = 'js_' + (++sequence);
        const configuredTimeout = Number(bridge.capabilityTimeoutMs || 30000);
        const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 30000;
        const timeout = scheduleTimeout ? scheduleTimeout(function() {
          if (!pendingAPI.delete(id)) return;
          send('API_CANCEL', { version: 1, requestId: id, reason: 'timeout' });
          const error = new Error('Native API request timed out');
          error.code = 'TIMEOUT';
          reject(error);
        }, timeoutMs) : null;
        pendingAPI.set(id, { resolve, reject, timeout });
        send('API_REQUEST', { version: 1, module, method, args }, id);
      });
    }

    globalThis.craft = globalThis.craft || {};
    const nativeCapabilities = new Set(Array.isArray(bridge.capabilities) ? bridge.capabilities : []);
    globalThis.craft.platform = bridge.platform || 'unknown';
    globalThis.craft.capabilityProtocolVersion = Number(bridge.capabilityProtocolVersion || 0);
    globalThis.craft.capabilities = {
      haptics: nativeCapabilities.has('haptics'),
      speechRecognition: false,
      share: false,
      camera: false,
      biometric: false,
      pushNotifications: false,
      secureStorage: false,
      storage: nativeCapabilities.has('storage'),
      localDatabase: nativeCapabilities.has('database'),
      lifecycle: nativeCapabilities.has('lifecycle'),
      geolocation: false,
      clipboard: nativeCapabilities.has('clipboard'),
      contacts: false,
      calendar: false,
      localNotifications: nativeCapabilities.has('notifications'),
      inAppPurchase: false,
      keepAwake: false,
      orientationLock: false,
      deepLinks: nativeCapabilities.has('deepLinks'),
      flashlight: false,
      speech: false,
      network: false,
      deviceInfo: nativeCapabilities.has('device'),
      badge: false,
      appReview: false
    };
    globalThis.craft.route = {
      name: __STX_ROUTE_NAME__,
      params: globalThis.__stxNativeParams || {}
    };
    function navigate(type, screen, params) {
      if (!__STX_ROUTE_NAMES__.includes(screen)) throw new Error('Unknown native screen: ' + screen);
      if (params !== undefined && (params === null || typeof params !== 'object' || Array.isArray(params))) {
        throw new Error('Navigation params must be an object');
      }
      return send(type, { screen, params: params || {} });
    }
    globalThis.craft.navigation = {
      push: function(screen, params) { return navigate('NAVIGATE', screen, params); },
      replace: function(screen, params) { return navigate('NAVIGATE_REPLACE', screen, params); },
      back: function() { return send('NAVIGATE_BACK', {}); }
    };
    globalThis.craft.device = globalThis.craft.device || {};
    globalThis.craft.device.getInfo = function() {
      return requestAPI('Device', 'getInfo', []);
    };
    globalThis.craft.clipboard = {
      write: function(text) { return requestAPI('Clipboard', 'write', [text]); },
      read: function() { return requestAPI('Clipboard', 'read', []); }
    };
    globalThis.craft.haptic = function(style) {
      return requestAPI('Haptics', 'impact', [style || 'medium']);
    };
    function hapticFeedback(answer) {
      return answer.then(function() {}, function(error) {
        // Match Craft's browser bridge: the high-level feedback helpers are
        // no-ops when disabled, while craft.haptic() rejects with the code.
        if (error.code === 'CAPABILITY_DISABLED') return;
        throw error;
      });
    }
    globalThis.craft.haptics = {
      impact: function(style) { return hapticFeedback(globalThis.craft.haptic(style)); },
      notification: function(type) {
        const style = type === 'error' ? 'heavy' : type === 'warning' ? 'medium' : 'light';
        return hapticFeedback(globalThis.craft.haptic(style));
      },
      selection: function() { return hapticFeedback(globalThis.craft.haptic('soft')); }
    };
    globalThis.craft.storage = {
      get: function(key) { return requestAPI('Storage', 'get', [key]); },
      set: function(key, value) { return requestAPI('Storage', 'set', [key, value]); },
      remove: function(key) { return requestAPI('Storage', 'remove', [key]); },
      clear: function() { return requestAPI('Storage', 'clear', []); },
      keys: function() { return requestAPI('Storage', 'keys', []); }
    };
    globalThis.craft.db = {
      execute: function(sql, params) { return requestAPI('Database', 'execute', [sql, params || []]); },
      query: function(sql, params) { return requestAPI('Database', 'query', [sql, params || []]); },
      beginTransaction: function() { return requestAPI('Database', 'beginTransaction', []); },
      commit: function() { return requestAPI('Database', 'commit', []); },
      rollback: function() { return requestAPI('Database', 'rollback', []); }
    };
    function onAppStateChange(callback) {
        if (typeof callback !== 'function') throw new TypeError('lifecycle.onStateChange needs a function');
        appStateHandlers.add(callback);
        return function() { appStateHandlers.delete(callback); };
    }
    globalThis.craft.lifecycle = {
      getState: function() { return currentAppState; },
      onStateChange: onAppStateChange,
      onChange: onAppStateChange
    };
    globalThis.craft.getAppState = globalThis.craft.lifecycle.getState;
    globalThis.craft.onAppStateChange = onAppStateChange;
    globalThis.craft.deepLinks = {
      getInitialURL: function() {
        initialDeepLinkClaimed = true;
        return requestAPI('DeepLinks', 'getInitialURL', []);
      },
      onLink: function(callback) {
        if (typeof callback !== 'function') throw new TypeError('deepLinks.onLink needs a function');
        deepLinkHandlers.add(callback);
        return function() { deepLinkHandlers.delete(callback); };
      }
    };
    globalThis.craft.notifications = {
      show: function(notification) { return requestAPI('Notifications', 'schedule', [notification]); },
      schedule: function(notification) { return requestAPI('Notifications', 'schedule', [notification]); },
      cancel: function(id) { return requestAPI('Notifications', 'cancel', [id]); },
      cancelAll: function() { return requestAPI('Notifications', 'cancelAll', []); },
      pending: function() { return requestAPI('Notifications', 'pending', []); }
    };
    globalThis.craft.scheduleNotification = globalThis.craft.notifications.schedule;
    globalThis.craft.cancelNotification = globalThis.craft.notifications.cancel;
    globalThis.craft.cancelAllNotifications = globalThis.craft.notifications.cancelAll;
    globalThis.craft.getPendingNotifications = globalThis.craft.notifications.pending;

    bridge.onMessage(function(raw) {
      const message = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (message.type === 'EVENT') {
        const handler = handlers[message.payload.handlerName];
        if (handler) handler(message.payload.nativeEvent || {});
      }
      else if (message.type === 'API_RESPONSE' || message.type === 'API_ERROR') {
        const requestId = message.correlationId || message.payload.requestId;
        const pending = pendingAPI.get(requestId);
        if (!pending) return;
        pendingAPI.delete(requestId);
        if (pending.timeout !== null && cancelTimeout) cancelTimeout(pending.timeout);
        if (message.type === 'API_RESPONSE') pending.resolve(message.payload.data);
        else {
          const error = new Error(message.payload.message || 'Native API failed');
          error.code = message.payload.code || 'CRAFT_ERROR';
          pending.reject(error);
        }
      }
      else if (message.type === 'APP_STATE') {
        if (message.payload.state === currentAppState) return;
        currentAppState = message.payload.state;
        appStateHandlers.forEach(function(handler) { handler(message.payload.state); });
      }
      else if (message.type === 'DEEP_LINK') {
        if (initialDeepLinkClaimed && message.payload.initial) return;
        deepLinkHandlers.forEach(function(handler) { handler(message.payload); });
      }
      else if (message.type === 'MUTATION_ERROR') {
        mutationsEnabled = false;
        mutationRevision = 0;
        previousTree = null;
        sendRenderFallback();
      }
    });

    // Script code runs after Craft APIs are installed, so top-level effects
    // can call them just as event handlers can.
    ${document.script.code}

    // Register handlers
    ${document.script.functions.map(fn => `
    if (typeof ${fn} === 'function') {
      handlers['${fn}'] = function(event) {
        const result = ${fn}(event);
        if (result && typeof result.then === 'function') {
          return result.then(function(value) { render(); return value; });
        }
        render();
        return result;
      };
    }
    `).join('\n')}

    render();
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

  /**
   * Named flags and positional arguments, kept apart.
   *
   * Positionals used to be pushed onto `flags._`, declared as a string and
   * cast with `as unknown as string` so it would sit in a
   * `Record<string, string>`. The cast is what let `flags._[0]` compile:
   * on the declared type that is a character of a string, and the one caller
   * reading it wanted the first argument (stacksjs/stx#1985).
   */
  private parseArgs(args: string[]): { flags: Record<string, string>, positionals: string[] } {
    const flags: Record<string, string> = {}
    const positionals: string[] = []

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=')
        flags[key] = value || args[++i] || 'true'
      }
      else if (arg.startsWith('-') && arg.length > 1) {
        const key = arg.slice(1)
        flags[key] = args[++i] || 'true'
      }
      else {
        positionals.push(arg)
      }
    }

    return { flags, positionals }
  }

  // eslint-disable-next-line pickier/no-unused-vars
  private findIOSAppPath(): string | null {
    // eslint-disable-next-line pickier/no-unused-vars
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
  compile <file>          Compile STX file to IR (or --format bundle)

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

/*
 * Guarded, because this module both runs the CLI and exports the class
 * (stacksjs/stx#1985).
 *
 * Unguarded, importing it ran the CLI against the importer's own argv, which
 * for a test runner is an unknown command: the help text printed and
 * `process.exit(1)` took the runner down with it. So the file could be executed
 * or exported from, never both, and the export below says which was intended.
 *
 * `import.meta.main` is the same guard `benchmarks/src/regression.ts` and
 * `bun-plugin/src/serve.ts` use. `bun src/cli/index.ts …` is unaffected.
 */
if (import.meta.main) {
  const cli = new STXCLI()
  cli.run(process.argv.slice(2)).catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
}

export { STXCLI }
