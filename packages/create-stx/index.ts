#!/usr/bin/env bun
/**
 * create-stx
 *
 * Scaffold a new STX application.
 *
 * Usage:
 *   bun create stx my-app
 *   bunx create-stx my-app
 *   npx create-stx my-app
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

function log(message: string) {
  console.log(message)
}

function success(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
}

function error(message: string) {
  console.error(`${colors.red}✗${colors.reset} ${message}`)
}

function info(message: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`)
}

// Template files
const templates = {
  'pages/index.stx': `<script>
export const title = 'Welcome to STX'
export const description = 'Build modern web apps with intuitive templating'
</script>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="/dist/app.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; }
    .counter { margin: 2rem 0; }
    .counter button {
      padding: 0.5rem 1.5rem;
      margin: 0 0.5rem;
      font-size: 1.5rem;
      border: 2px solid white;
      background: transparent;
      color: white;
      border-radius: 8px;
      cursor: pointer;
    }
    .counter button:hover { background: white; color: #764ba2; }
    .counter span { font-size: 2rem; margin: 0 1rem; }
    .links { display: flex; gap: 1rem; justify-content: center; }
    a {
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border: 2px solid white;
      border-radius: 8px;
      transition: all 0.2s;
    }
    a:hover { background: white; color: #764ba2; }
  </style>
  <!-- Load stores synchronously -->
  <script>
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/js/stores.js', false);
    xhr.send();
    if (xhr.status === 200) eval(xhr.responseText);
  </script>
</head>
<body>
  <div class="container">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>

    <!-- Counter demo using stores -->
    <div class="counter">
      <button id="decrement">-</button>
      <span id="count">0</span>
      <button id="increment">+</button>
    </div>

    <div class="links">
      <a href="https://stx.sh" target="_blank">Documentation</a>
      <a href="https://github.com/stacksjs/stx" target="_blank">GitHub</a>
    </div>
  </div>

  <script>
    (function() {
      var stores = window.AppStores;
      var appStore = stores.appStore;
      var appActions = stores.appActions;

      // Subscribe to store changes
      appStore.subscribe(function(state) {
        document.getElementById('count').textContent = state.count;
      });

      // Button handlers
      document.getElementById('increment').onclick = appActions.increment;
      document.getElementById('decrement').onclick = appActions.decrement;
    })();
  </script>
</body>
</html>
`,

  'components/Button.stx': `<!--
  Button Component

  Props:
    - text: Button text
    - type: Button type (primary, secondary, danger)
    - disabled: Whether button is disabled
-->
<button
  class="btn btn-{{ type || 'primary' }}"
  {{ disabled ? 'disabled' : '' }}
>
  {{ text || slot }}
</button>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: #667eea;
  color: white;
}
.btn-primary:hover {
  background: #5a67d8;
}
.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}
.btn-danger {
  background: #fc8181;
  color: white;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
`,

  'public/.gitkeep': '',

  'public/js/.gitkeep': '',

  'lib/store.ts': `/**
 * Lightweight reactive store implementation
 * Based on STX state-management patterns
 */

export type Subscriber<T> = (value: T, previousValue: T | undefined) => void
export type Unsubscribe = () => void

export interface StoreOptions<T> {
  name?: string
  persist?: {
    key?: string
    storage?: 'local' | 'session'
    debounce?: number
  }
  onChange?: (value: T, prev: T | undefined) => void
}

export interface Store<T> {
  get: () => T
  set: (value: T | ((prev: T) => T)) => void
  update: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe
  reset: () => void
  name?: string
}

export function createStore<T extends object>(
  initialValue: T,
  options: StoreOptions<T> = {}
): Store<T> {
  const { name, persist, onChange } = options

  let currentValue = { ...initialValue }
  const subscribers = new Set<Subscriber<T>>()
  let persistTimeout: ReturnType<typeof setTimeout> | null = null

  // Load persisted value
  if (persist && typeof window !== 'undefined') {
    const storage = persist.storage === 'session' ? sessionStorage : localStorage
    const key = persist.key || \`app:\${name || 'store'}\`
    try {
      const stored = storage.getItem(key)
      if (stored) {
        currentValue = { ...initialValue, ...JSON.parse(stored) }
      }
    } catch { /* Invalid stored value */ }
  }

  const persistValue = (value: T) => {
    if (!persist || typeof window === 'undefined') return
    const storage = persist.storage === 'session' ? sessionStorage : localStorage
    const key = persist.key || \`app:\${name || 'store'}\`
    if (persist.debounce) {
      if (persistTimeout) clearTimeout(persistTimeout)
      persistTimeout = setTimeout(() => storage.setItem(key, JSON.stringify(value)), persist.debounce)
    } else {
      storage.setItem(key, JSON.stringify(value))
    }
  }

  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const subscriber of subscribers) {
      try { subscriber(newValue, prevValue) } catch (e) { console.error('[store]', e) }
    }
    if (onChange) onChange(newValue, prevValue)
  }

  return {
    get: () => currentValue,
    set: (value) => {
      const prevValue = currentValue
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value
      if (newValue !== prevValue) {
        currentValue = newValue
        persistValue(newValue)
        notify(newValue, prevValue)
      }
    },
    update: (partial) => {
      const prevValue = currentValue
      const updates = typeof partial === 'function' ? (partial as (prev: T) => Partial<T>)(currentValue) : partial
      currentValue = { ...currentValue, ...updates }
      persistValue(currentValue)
      notify(currentValue, prevValue)
    },
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      subscriber(currentValue, undefined)
      return () => subscribers.delete(subscriber)
    },
    reset: () => {
      const prevValue = currentValue
      currentValue = { ...initialValue }
      persistValue(currentValue)
      notify(currentValue, prevValue)
    },
    name
  }
}
`,

  'lib/stores/index.ts': `/**
 * Stores - Central export
 */
export * from './app'
export { createStore } from '../store'
export * from '../composables'
`,

  'lib/stores/app.ts': `/**
 * App Store - Example application state
 */
import { createStore } from '../store'

export interface AppState {
  count: number
  theme: 'light' | 'dark'
}

export const appStore = createStore<AppState>({
  count: 0,
  theme: 'light'
}, {
  name: 'app',
  persist: { key: 'app:state', storage: 'local' }
})

export const appActions = {
  increment: () => appStore.update(s => ({ count: s.count + 1 })),
  decrement: () => appStore.update(s => ({ count: s.count - 1 })),
  setTheme: (theme: AppState['theme']) => appStore.update({ theme })
}
`,

  'lib/build.ts': `/**
 * Build script to bundle stores for browser use
 */
import { build } from 'bun'
import { writeFileSync, readFileSync } from 'fs'

const result = await build({
  entrypoints: ['./lib/stores/index.ts'],
  outdir: './public/js',
  target: 'browser',
  format: 'iife',
  naming: 'stores.js',
  minify: false,
  define: { 'process.env.NODE_ENV': '"production"' }
})

if (!result.success) {
  console.error('Build failed:', result.logs)
  process.exit(1)
}

// Wrap to export globally
const bundlePath = './public/js/stores.js'
let bundle = readFileSync(bundlePath, 'utf-8')
bundle = bundle.replace(/^\\(\\(\\) => \\{/, 'window.AppStores = (function() {')
bundle = bundle.replace(/\\}\\)\\(\\);?\\s*$/, '  return exports_stores;\\n})();')

writeFileSync(bundlePath, \`/**
 * App Stores - Browser Bundle
 * Auto-generated, do not edit
 */
\${bundle}
\`)
console.log('Stores built to public/js/stores.js')
`,

  'stx.config.ts': `import type { StxConfig } from '@stacksjs/stx'

const config: StxConfig = {
  // Pages directory for file-based routing
  pagesDir: 'pages',

  // Components directory
  componentsDir: 'components',

  // Public assets directory
  publicDir: 'public',

  // Enable caching in production
  cache: process.env.NODE_ENV === 'production',

  // Debug mode in development
  debug: process.env.NODE_ENV !== 'production',
}

export default config
`,

  'package.json': (name: string) => JSON.stringify({
    name,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'bun run build:stores && bun run --bun stx dev',
      build: 'bun run build:stores && bun run --bun stx build',
      'build:stores': 'bun run lib/build.ts',
      preview: 'bun run --bun stx preview',
    },
    dependencies: {},
    devDependencies: {
      '@stacksjs/stx': 'latest',
      'bun-plugin-stx': 'latest',
      typescript: '^5.0.0',
    },
  }, null, 2),

  'bunfig.toml': `preload = ["bun-plugin-stx"]
`,

  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      declaration: true,
      outDir: 'dist',
      rootDir: '.',
    },
    include: ['**/*.ts', '**/*.stx'],
    exclude: ['node_modules', 'dist'],
  }, null, 2),

  '.gitignore': `# Dependencies
node_modules/

# Build output
dist/
.stx/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`,

  'README.md': (name: string) => `# ${name}

A modern web application built with [STX](https://stx.sh).

## Getting Started

\`\`\`bash
# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
\`\`\`

## Project Structure

\`\`\`
${name}/
  pages/          # File-based routing
    index.stx     # Homepage (/)
  components/     # Reusable components
  public/         # Static assets
  stx.config.ts   # STX configuration
\`\`\`

## Learn More

- [STX Documentation](https://stx.sh)
- [GitHub Repository](https://github.com/stacksjs/stx)
`,
}

async function createProject(projectName: string, targetDir: string) {
  log('')
  log(`${colors.bright}${colors.blue}  Creating STX app in ${colors.cyan}${targetDir}${colors.reset}`)
  log('')

  // Create directories
  const dirs = ['pages', 'components', 'public', 'public/js', 'lib', 'lib/stores', 'lib/composables']
  for (const dir of dirs) {
    const dirPath = path.join(targetDir, dir)
    fs.mkdirSync(dirPath, { recursive: true })
  }
  success('Created project structure')

  // Write template files
  for (const [filePath, content] of Object.entries(templates)) {
    const fullPath = path.join(targetDir, filePath)
    const fileContent = typeof content === 'function' ? content(projectName) : content
    fs.writeFileSync(fullPath, fileContent)
  }
  success('Created template files')

  // Install dependencies
  info('Installing dependencies...')

  return new Promise<void>((resolve) => {
    const child = spawn('bun', ['install'], {
      cwd: targetDir,
      stdio: 'inherit',
    })

    child.on('close', (code) => {
      if (code === 0) {
        success('Installed dependencies')
      } else {
        log('')
        info('Could not install STX packages from npm (not yet published)')
        info('For local development, link the packages manually:')
        log(`    ${colors.dim}cd ${targetDir}${colors.reset}`)
        log(`    ${colors.dim}bun link @stacksjs/stx${colors.reset}`)
        log(`    ${colors.dim}bun link bun-plugin-stx${colors.reset}`)
      }
      resolve()
    })

    child.on('error', () => {
      info('Could not run bun install')
      resolve()
    })
  })
}

async function main() {
  const args = process.argv.slice(2)

  // Get project name from args or prompt
  let projectName = args[0]

  if (!projectName) {
    // Default to 'my-stx-app' if no name provided
    projectName = 'my-stx-app'
    info(`No project name provided, using "${projectName}"`)
  }

  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
    error('Project name can only contain letters, numbers, dashes, and underscores')
    process.exit(1)
  }

  const targetDir = path.resolve(process.cwd(), projectName)

  // Check if directory exists
  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir)
    if (files.length > 0) {
      error(`Directory "${projectName}" already exists and is not empty`)
      process.exit(1)
    }
  } else {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  try {
    await createProject(projectName, targetDir)

    log('')
    log(`${colors.green}${colors.bright}  Done!${colors.reset} Created ${projectName}`)
    log('')
    log('  To get started:')
    log('')
    log(`    ${colors.cyan}cd ${projectName}${colors.reset}`)
    log(`    ${colors.cyan}bun dev${colors.reset}`)
    log('')
  } catch (err) {
    error(`Failed to create project: ${err}`)
    process.exit(1)
  }
}

main()
