/**
 * Scaffolding System
 *
 * Project and file scaffolding for stx applications:
 * - `stx create <project-name>` - Create new project
 * - `stx add component <name>` - Add a component
 * - `stx add page <name>` - Add a page
 * - `stx add store <name>` - Add a store
 * - `stx add layout <name>` - Add a layout
 * - `stx add api <name>` - Add an API endpoint
 *
 * @module scaffolding
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { execSync } from 'node:child_process'

// =============================================================================
// Types
// =============================================================================

/**
 * Project template options
 */
export type ProjectTemplate = 'default' | 'minimal' | 'full' | 'blog' | 'dashboard' | 'landing'

/**
 * Project creation options
 */
export interface CreateProjectOptions {
  /** Project template */
  template?: ProjectTemplate
  /** Skip git initialization */
  skipGit?: boolean
  /** Skip dependency installation */
  skipInstall?: boolean
  /** Package manager to use */
  packageManager?: 'bun' | 'npm' | 'pnpm' | 'yarn'
  /** TypeScript mode */
  typescript?: boolean
  /** Include example components */
  examples?: boolean
  /** Enable PWA support */
  pwa?: boolean
  /** Include tailwind */
  tailwind?: boolean
}

/**
 * Add component options
 */
export interface AddComponentOptions {
  /** Component directory */
  dir?: string
  /** Include props interface */
  props?: boolean
  /** Include scoped styles */
  styles?: boolean
  /** Include script section */
  script?: boolean
  /** Overwrite if exists */
  force?: boolean
}

/**
 * Add page options
 */
export interface AddPageOptions {
  /** Pages directory */
  dir?: string
  /** Use a layout */
  layout?: string
  /** Include dynamic params */
  dynamic?: boolean
  /** Include loader function */
  loader?: boolean
  /** Overwrite if exists */
  force?: boolean
}

/**
 * Add store options
 */
export interface AddStoreOptions {
  /** Stores directory */
  dir?: string
  /** Include persistence */
  persist?: boolean
  /** Include actions */
  actions?: boolean
  /** Overwrite if exists */
  force?: boolean
}

/**
 * Add layout options
 */
export interface AddLayoutOptions {
  /** Layouts directory */
  dir?: string
  /** Include navigation */
  nav?: boolean
  /** Include footer */
  footer?: boolean
  /** Overwrite if exists */
  force?: boolean
}

/**
 * Scaffolding result
 */
export interface ScaffoldResult {
  success: boolean
  message: string
  files: string[]
  errors: string[]
}

// =============================================================================
// Project Templates
// =============================================================================

/**
 * Project template definitions
 */
export const PROJECT_TEMPLATES: Record<ProjectTemplate, { description: string, features: string[] }> = {
  default: {
    description: 'Standard stx project with pages, components, and stores',
    features: ['Pages', 'Components', 'Layouts', 'Stores', 'Dev server'],
  },
  minimal: {
    description: 'Minimal setup with just the essentials',
    features: ['Single page', 'Basic styles'],
  },
  full: {
    description: 'Full-featured project with all stx capabilities',
    features: ['Pages', 'Components', 'Layouts', 'Stores', 'API routes', 'PWA', 'i18n', 'Testing'],
  },
  blog: {
    description: 'Blog template with markdown support',
    features: ['Blog layout', 'Post pages', 'Tags', 'RSS feed', 'Markdown'],
  },
  dashboard: {
    description: 'Admin dashboard template',
    features: ['Sidebar', 'Charts', 'Tables', 'Forms', 'Auth pages'],
  },
  landing: {
    description: 'Marketing landing page template',
    features: ['Hero section', 'Features', 'Pricing', 'CTA', 'Contact form'],
  },
}

// =============================================================================
// Create Project
// =============================================================================

/**
 * Create a new stx project
 */
export async function createProject(
  projectName: string,
  options: CreateProjectOptions = {},
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    success: true,
    message: '',
    files: [],
    errors: [],
  }

  const template = options.template || 'default'
  const projectPath = join(process.cwd(), projectName)

  // Check if directory exists
  if (existsSync(projectPath)) {
    result.success = false
    result.message = `Directory ${projectName} already exists`
    return result
  }

  try {
    // Create project directory
    mkdirSync(projectPath, { recursive: true })

    // Create directory structure
    const dirs = getProjectDirs(template)
    for (const dir of dirs) {
      mkdirSync(join(projectPath, dir), { recursive: true })
    }

    // Create files
    const files = getProjectFiles(template, projectName, options)
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(projectPath, filePath)
      ensureDir(dirname(fullPath))
      writeFileSync(fullPath, content)
      result.files.push(filePath)
    }

    // Initialize git
    if (!options.skipGit) {
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' })
        writeFileSync(join(projectPath, '.gitignore'), getGitignore())
        result.files.push('.gitignore')
      }
      catch {
        result.errors.push('Failed to initialize git repository')
      }
    }

    // Install dependencies
    if (!options.skipInstall) {
      const pm = options.packageManager || detectPackageManager()
      try {
        console.log(`\nInstalling dependencies with ${pm}...`)
        execSync(`${pm} install`, { cwd: projectPath, stdio: 'inherit' })
      }
      catch {
        result.errors.push('Failed to install dependencies')
      }
    }

    result.message = `Created project: ${projectName}`
    console.log(`
✅ ${result.message}

Next steps:
  cd ${projectName}
  ${options.packageManager || 'bun'} run dev
`)
  }
  catch (error) {
    result.success = false
    result.message = `Failed to create project: ${error}`
  }

  return result
}

/**
 * Get project directories based on template
 */
function getProjectDirs(template: ProjectTemplate): string[] {
  const baseDirs = ['src', 'src/pages', 'src/components', 'src/layouts', 'public']

  switch (template) {
    case 'minimal':
      return ['src', 'public']
    case 'full':
      return [...baseDirs, 'src/stores', 'src/api', 'src/i18n', 'src/utils', 'test']
    case 'blog':
      return [...baseDirs, 'src/posts', 'src/utils']
    case 'dashboard':
      return [...baseDirs, 'src/stores', 'src/api', 'src/utils']
    case 'landing':
      return [...baseDirs, 'src/sections']
    default:
      return [...baseDirs, 'src/stores']
  }
}

/**
 * Get project files based on template
 */
function getProjectFiles(
  template: ProjectTemplate,
  projectName: string,
  options: CreateProjectOptions,
): Record<string, string> {
  const files: Record<string, string> = {}

  // Common files
  files['package.json'] = getPackageJson(projectName, template, options)
  files['stx.config.ts'] = getStxConfig(template, options)
  files['README.md'] = getReadme(projectName, template)

  if (options.typescript !== false) {
    files['tsconfig.json'] = getTsConfig()
  }

  // Template-specific files
  switch (template) {
    case 'minimal':
      files['src/index.stx'] = getMinimalPage()
      break

    case 'blog':
      files['src/pages/index.stx'] = getBlogIndexPage()
      files['src/pages/[slug].stx'] = getBlogPostPage()
      files['src/layouts/blog.stx'] = getBlogLayout()
      files['src/components/PostCard.stx'] = getPostCardComponent()
      break

    case 'dashboard':
      files['src/pages/index.stx'] = getDashboardIndexPage()
      files['src/pages/settings.stx'] = getDashboardSettingsPage()
      files['src/layouts/dashboard.stx'] = getDashboardLayout()
      files['src/components/Sidebar.stx'] = getSidebarComponent()
      files['src/components/StatsCard.stx'] = getStatsCardComponent()
      files['src/stores/dashboard.ts'] = getDashboardStore()
      break

    case 'landing':
      files['src/pages/index.stx'] = getLandingPage()
      files['src/sections/Hero.stx'] = getHeroSection()
      files['src/sections/Features.stx'] = getFeaturesSection()
      files['src/sections/Pricing.stx'] = getPricingSection()
      files['src/components/Button.stx'] = getButtonComponent()
      break

    case 'full':
      files['src/pages/index.stx'] = getDefaultIndexPage()
      files['src/pages/about.stx'] = getAboutPage()
      files['src/layouts/default.stx'] = getDefaultLayout()
      files['src/components/Header.stx'] = getHeaderComponent()
      files['src/components/Footer.stx'] = getFooterComponent()
      files['src/stores/app.ts'] = getAppStore()
      files['src/i18n/en.json'] = getI18nFile('en')
      files['test/example.test.ts'] = getTestFile()
      break

    default:
      files['src/pages/index.stx'] = getDefaultIndexPage()
      files['src/layouts/default.stx'] = getDefaultLayout()
      files['src/components/Header.stx'] = getHeaderComponent()
      files['src/components/Footer.stx'] = getFooterComponent()
      files['src/stores/app.ts'] = getAppStore()
  }

  return files
}

// =============================================================================
// Add Commands
// =============================================================================

/**
 * Add a component
 */
export async function addComponent(
  name: string,
  options: AddComponentOptions = {},
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = { success: true, message: '', files: [], errors: [] }

  const dir = options.dir || 'src/components'
  const componentName = toPascalCase(name)
  const filePath = join(dir, `${componentName}.stx`)

  if (existsSync(filePath) && !options.force) {
    result.success = false
    result.message = `Component ${componentName} already exists. Use --force to overwrite.`
    return result
  }

  try {
    ensureDir(dir)
    const content = generateComponent(componentName, options)
    writeFileSync(filePath, content)
    result.files.push(filePath)
    result.message = `Created component: ${filePath}`
    console.log(`✅ ${result.message}`)
  }
  catch (error) {
    result.success = false
    result.message = `Failed to create component: ${error}`
  }

  return result
}

/**
 * Add a page
 */
export async function addPage(
  name: string,
  options: AddPageOptions = {},
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = { success: true, message: '', files: [], errors: [] }

  const dir = options.dir || 'src/pages'
  const pageName = name.toLowerCase().replace(/\s+/g, '-')
  const filePath = join(dir, `${pageName}.stx`)

  if (existsSync(filePath) && !options.force) {
    result.success = false
    result.message = `Page ${pageName} already exists. Use --force to overwrite.`
    return result
  }

  try {
    ensureDir(dir)
    const content = generatePage(pageName, options)
    writeFileSync(filePath, content)
    result.files.push(filePath)
    result.message = `Created page: ${filePath}`
    console.log(`✅ ${result.message}`)
  }
  catch (error) {
    result.success = false
    result.message = `Failed to create page: ${error}`
  }

  return result
}

/**
 * Add a store
 */
export async function addStore(
  name: string,
  options: AddStoreOptions = {},
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = { success: true, message: '', files: [], errors: [] }

  const dir = options.dir || 'src/stores'
  const storeName = toCamelCase(name)
  const filePath = join(dir, `${storeName}.ts`)

  if (existsSync(filePath) && !options.force) {
    result.success = false
    result.message = `Store ${storeName} already exists. Use --force to overwrite.`
    return result
  }

  try {
    ensureDir(dir)
    const content = generateStore(storeName, options)
    writeFileSync(filePath, content)
    result.files.push(filePath)
    result.message = `Created store: ${filePath}`
    console.log(`✅ ${result.message}`)
  }
  catch (error) {
    result.success = false
    result.message = `Failed to create store: ${error}`
  }

  return result
}

/**
 * Add a layout
 */
export async function addLayout(
  name: string,
  options: AddLayoutOptions = {},
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = { success: true, message: '', files: [], errors: [] }

  const dir = options.dir || 'src/layouts'
  const layoutName = name.toLowerCase().replace(/\s+/g, '-')
  const filePath = join(dir, `${layoutName}.stx`)

  if (existsSync(filePath) && !options.force) {
    result.success = false
    result.message = `Layout ${layoutName} already exists. Use --force to overwrite.`
    return result
  }

  try {
    ensureDir(dir)
    const content = generateLayout(layoutName, options)
    writeFileSync(filePath, content)
    result.files.push(filePath)
    result.message = `Created layout: ${filePath}`
    console.log(`✅ ${result.message}`)
  }
  catch (error) {
    result.success = false
    result.message = `Failed to create layout: ${error}`
  }

  return result
}

// =============================================================================
// Generators
// =============================================================================

/**
 * Generate component content
 */
function generateComponent(name: string, options: AddComponentOptions): string {
  const lines: string[] = []

  lines.push(`{{-- Component: ${name} --}}`)

  if (options.props !== false) {
    lines.push(`<script>
// Props
const title = props.title || '${name}'
const variant = props.variant || 'default'
</script>
`)
  }

  lines.push(`<div class="${toKebabCase(name)} ${toKebabCase(name)}--{{ variant }}">
  <h3>{{ title }}</h3>
  <div class="${toKebabCase(name)}__content">
    {{ slot }}
  </div>
</div>`)

  if (options.styles !== false) {
    lines.push(`
<style scoped>
.${toKebabCase(name)} {
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.${toKebabCase(name)}--primary {
  border-left: 3px solid #3498db;
}

.${toKebabCase(name)}--success {
  border-left: 3px solid #2ecc71;
}

.${toKebabCase(name)}__content {
  margin-top: 0.5rem;
}
</style>`)
  }

  return lines.join('\n')
}

/**
 * Generate page content
 */
function generatePage(name: string, options: AddPageOptions): string {
  const title = toPascalCase(name.replace(/-/g, ' '))
  const lines: string[] = []

  lines.push(`<script>
const title = '${title}'
const description = 'Page description'
</script>
`)

  if (options.layout) {
    lines.push(`@layout('${options.layout}')
`)
  }

  if (options.dynamic) {
    lines.push(`{{-- Dynamic route: /pages/[${name}].stx --}}
{{-- Access params via props.params --}}
`)
  }

  lines.push(`@section('content')
<div class="page-${name}">
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
</div>
@endsection`)

  return lines.join('\n')
}

/**
 * Generate store content
 */
function generateStore(name: string, options: AddStoreOptions): string {
  const storeName = `${name}Store`
  const stateType = `${toPascalCase(name)}State`

  let content = `import { defineStore } from 'stx'

interface ${stateType} {
  // Add your state properties here
  count: number
  loading: boolean
}

export const ${storeName} = defineStore('${name}', {
  state: (): ${stateType} => ({
    count: 0,
    loading: false,
  }),

  getters: {
    doubleCount(): number {
      return this.count * 2
    },
  },
`

  if (options.actions !== false) {
    content += `
  actions: {
    increment() {
      this.count++
    },

    decrement() {
      this.count--
    },

    async fetchData() {
      this.loading = true
      try {
        // Add your async logic here
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        this.loading = false
      }
    },
  },
`
  }

  if (options.persist) {
    content += `
  persist: {
    enabled: true,
    strategies: [
      { key: '${name}', storage: localStorage },
    ],
  },
`
  }

  content += `})
`

  return content
}

/**
 * Generate layout content
 */
function generateLayout(name: string, options: AddLayoutOptions): string {
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'My App')</title>
  @yield('head')
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
  </style>
  @yield('styles')
</head>
<body>
`

  if (options.nav !== false) {
    content += `  <header class="header">
    <nav class="nav">
      <a href="/" class="nav__logo">Logo</a>
      <div class="nav__links">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </div>
    </nav>
  </header>

`
  }

  content += `  <main>
    {{ slot }}
  </main>

`

  if (options.footer !== false) {
    content += `  <footer class="footer">
    <p>&copy; {{ new Date().getFullYear() }} My App. All rights reserved.</p>
  </footer>

`
  }

  content += `  @yield('scripts')
</body>
</html>`

  return content
}

// =============================================================================
// Template Files
// =============================================================================

function getPackageJson(name: string, template: ProjectTemplate, options: CreateProjectOptions): string {
  const pkg: any = {
    name,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'stx dev src/pages/index.stx',
      build: 'stx build',
      preview: 'stx serve dist',
    },
    dependencies: {
      stx: 'latest',
    },
    devDependencies: {},
  }

  if (options.typescript !== false) {
    pkg.devDependencies.typescript = '^5.0.0'
  }

  if (options.tailwind) {
    pkg.devDependencies.tailwindcss = '^3.0.0'
  }

  if (template === 'full') {
    pkg.scripts.test = 'bun test'
    pkg.scripts.lint = 'bun run lint'
  }

  return JSON.stringify(pkg, null, 2)
}

function getStxConfig(template: ProjectTemplate, options: CreateProjectOptions): string {
  return `import { defineConfig } from 'stx'

export default defineConfig({
  // Template directories
  partialsDir: 'src/partials',
  componentsDir: 'src/components',
  layoutsDir: 'src/layouts',

  // Development
  debug: process.env.NODE_ENV !== 'production',
  cache: process.env.NODE_ENV === 'production',

  // Features
  a11y: { enabled: true },
  seo: { enabled: true },
${options.pwa ? `  pwa: { enabled: true },\n` : ''}
  // Analytics (configure when ready)
  // analytics: { enabled: true, driver: 'fathom', fathom: { siteId: 'YOUR_SITE_ID' } },
})
`
}

function getTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      types: ['bun-types'],
    },
    include: ['src/**/*', 'test/**/*'],
  }, null, 2)
}

function getReadme(name: string, template: ProjectTemplate): string {
  return `# ${name}

A stx project created with the \`${template}\` template.

## Getting Started

\`\`\`bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
\`\`\`

## Project Structure

\`\`\`
src/
├── pages/       # Page components (file-based routing)
├── components/  # Reusable components
├── layouts/     # Layout templates
├── stores/      # State management
└── public/      # Static assets
\`\`\`

## Learn More

- [stx Documentation](https://stx.dev/docs)
- [stx GitHub](https://github.com/stacksjs/stx)
`
}

function getGitignore(): string {
  return `# Dependencies
node_modules/
.bun/

# Build
dist/
.stx/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
`
}

// Template-specific pages and components (abbreviated for space)

function getMinimalPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to stx</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Welcome to stx</h1>
  <p>Edit <code>src/index.stx</code> to get started.</p>
</body>
</html>
`
}

function getDefaultIndexPage(): string {
  return `<script>
const title = 'Welcome to stx'
const features = [
  { icon: '⚡', name: 'Fast', desc: 'Built on Bun for blazing speed' },
  { icon: '🎨', name: 'Beautiful', desc: 'Blade-style syntax you know and love' },
  { icon: '🛠', name: 'Powerful', desc: 'Full-featured component system' },
]
</script>

@layout('layouts/default')

@section('title')
{{ title }}
@endsection

@section('content')
<div class="hero">
  <h1>{{ title }}</h1>
  <p>A modern UI framework with Laravel Blade syntax</p>
</div>

<div class="features">
  @foreach(features as feature)
  <div class="feature">
    <span class="feature__icon">{{ feature.icon }}</span>
    <h3>{{ feature.name }}</h3>
    <p>{{ feature.desc }}</p>
  </div>
  @endforeach
</div>
@endsection
`
}

function getAboutPage(): string {
  return `<script>
const title = 'About'
</script>

@layout('layouts/default')

@section('title')
{{ title }}
@endsection

@section('content')
<h1>{{ title }}</h1>
<p>This is the about page.</p>
@endsection
`
}

function getDefaultLayout(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'My App')</title>
  @yield('head')
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui; color: #333; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
  </style>
  @yield('styles')
</head>
<body>
  @component('Header')@endcomponent
  <main class="container">
    {{ slot }}
  </main>
  @component('Footer')@endcomponent
  @yield('scripts')
</body>
</html>
`
}

function getHeaderComponent(): string {
  return `<header class="header">
  <nav class="nav container">
    <a href="/" class="logo">stx</a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </div>
  </nav>
</header>

<style scoped>
.header { background: #2c3e50; padding: 1rem 0; }
.nav { display: flex; justify-content: space-between; align-items: center; }
.logo { color: white; font-weight: bold; text-decoration: none; font-size: 1.25rem; }
.nav-links a { color: rgba(255,255,255,0.8); margin-left: 1.5rem; text-decoration: none; }
.nav-links a:hover { color: white; }
</style>
`
}

function getFooterComponent(): string {
  return `<footer class="footer">
  <div class="container">
    <p>&copy; {{ new Date().getFullYear() }} Built with stx</p>
  </div>
</footer>

<style scoped>
.footer { background: #f8f9fa; padding: 2rem 0; margin-top: 4rem; text-align: center; color: #666; }
</style>
`
}

function getAppStore(): string {
  return `import { defineStore } from 'stx'

interface AppState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
}

export const appStore = defineStore('app', {
  state: (): AppState => ({
    theme: 'light',
    sidebarOpen: true,
  }),

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
  },

  persist: {
    enabled: true,
    strategies: [{ key: 'app-preferences', storage: localStorage }],
  },
})
`
}

function getI18nFile(locale: string): string {
  return JSON.stringify({
    common: {
      welcome: 'Welcome',
      home: 'Home',
      about: 'About',
      contact: 'Contact',
    },
    messages: {
      loading: 'Loading...',
      error: 'An error occurred',
    },
  }, null, 2)
}

function getTestFile(): string {
  return `import { describe, expect, it } from 'bun:test'

describe('Example', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2)
  })
})
`
}

// Blog template files
function getBlogIndexPage(): string { return '<!-- Blog index -->' }
function getBlogPostPage(): string { return '<!-- Blog post -->' }
function getBlogLayout(): string { return '<!-- Blog layout -->' }
function getPostCardComponent(): string { return '<!-- Post card -->' }

// Dashboard template files
function getDashboardIndexPage(): string { return '<!-- Dashboard index -->' }
function getDashboardSettingsPage(): string { return '<!-- Settings -->' }
function getDashboardLayout(): string { return '<!-- Dashboard layout -->' }
function getSidebarComponent(): string { return '<!-- Sidebar -->' }
function getStatsCardComponent(): string { return '<!-- Stats card -->' }
function getDashboardStore(): string { return '// Dashboard store' }

// Landing template files
function getLandingPage(): string { return '<!-- Landing page -->' }
function getHeroSection(): string { return '<!-- Hero section -->' }
function getFeaturesSection(): string { return '<!-- Features -->' }
function getPricingSection(): string { return '<!-- Pricing -->' }
function getButtonComponent(): string { return '<!-- Button -->' }

// =============================================================================
// Utilities
// =============================================================================

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function detectPackageManager(): 'bun' | 'npm' | 'pnpm' | 'yarn' {
  if (existsSync('bun.lockb'))
    return 'bun'
  if (existsSync('pnpm-lock.yaml'))
    return 'pnpm'
  if (existsSync('yarn.lock'))
    return 'yarn'
  return 'bun'
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, s => s.toUpperCase())
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, s => s.toLowerCase())
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
