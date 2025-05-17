import type { DevServerOptions } from '../src/dev-server'
import type { SyntaxHighlightTheme } from '../src/types'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { scanA11yIssues } from '../src/a11y'
import { serveMultipleStxFiles, serveStxFile } from '../src/dev-server'
import { docsCommand } from '../src/docs'
import { initFile } from '../src/init'
import { plugin as stxPlugin } from '../src/plugin'
import { gitHash } from '../src/release'

// Test command utilities
interface TestCommandOptions {
  watch?: boolean
  filter?: string
  reporter?: string
  timeout?: number
  coverage?: boolean
  ui?: boolean
  verbose?: boolean
}

/**
 * Run tests using Bun's test runner with happy-dom for browser environment
 */
async function runTests(
  patterns: string[],
  options: TestCommandOptions,
): Promise<boolean> {
  try {
    // Prepare command arguments
    const args = ['test']

    // Expand glob patterns to actual files
    const expandedPatterns: string[] = []

    if (patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        if (isGlob(pattern)) {
          // Expand glob pattern to matching files
          try {
            const matches = await Array.fromAsync(new Bun.Glob(pattern).scan({ onlyFiles: true, absolute: true }))
            if (matches.length === 0) {
              console.warn(`Warning: No files found matching pattern: ${pattern}`)
            }
            else {
              expandedPatterns.push(...matches)
              if (options.verbose) {
                console.log(`Found ${matches.length} file(s) matching pattern: ${pattern}`)
              }
            }
          }
          catch (error) {
            console.error(`Error expanding glob pattern ${pattern}:`, error)
            return false
          }
        }
        else {
          // Not a glob, add directly
          expandedPatterns.push(pattern)
        }
      }
    }

    // Check if we have any files to test
    if (expandedPatterns.length === 0) {
      console.error('Error: No test files found matching the provided patterns.')
      return false
    }

    // Add the expanded patterns to args
    args.push(...expandedPatterns)

    // Add options
    if (options.filter) {
      args.push('--pattern', options.filter)
    }

    if (options.timeout) {
      args.push('--timeout', options.timeout.toString())
    }

    // Handle reporter options correctly
    // Bun currently only supports 'junit' reporter with a required output file
    if (options.reporter && options.reporter !== 'default') {
      if (options.reporter === 'junit') {
        // Create a temp file for junit output
        const junitOutputFile = path.join(os.tmpdir(), `stx-test-report-${Date.now()}.xml`)
        args.push('--reporter', options.reporter)
        args.push('--reporter-outfile', junitOutputFile)
      }
      else {
        console.warn(`Warning: Reporter '${options.reporter}' is not supported. Using default reporter.`)
      }
    }

    if (options.coverage) {
      args.push('--coverage')
    }

    if (options.watch) {
      args.push('--watch')
    }

    // Add happy-dom for DOM environment
    args.push('--preload', path.join(__dirname, '../happy-dom.ts'))

    // Add environment variables for STX test context
    const env = {
      ...process.env,
      STX_TEST_MODE: 'true',
      STX_TEST_UI: options.ui ? 'true' : 'false',
      STX_TEST_VERBOSE: options.verbose ? 'true' : 'false',
    }

    // Build the full command
    const command = 'bun'

    if (options.verbose) {
      console.log(`Running: ${command} ${args.join(' ')}`)
    }

    // Create timestamp for test timing
    const startTime = performance.now()

    // Execute the command
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      env,
    })

    return new Promise((resolve) => {
      child.on('close', (code) => {
        const endTime = performance.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)

        if (code === 0) {
          // console.log(`✓ Tests completed successfully in ${duration}s`);
          resolve(true)
        }
        else {
          // console.error(`✗ Tests failed with code ${code} after ${duration}s`);
          resolve(false)
        }
      })

      // Handle process interruption
      process.on('SIGINT', () => {
        console.log('\nTest run interrupted')
        child.kill('SIGINT')
        process.exit(1)
      })
    })
  }
  catch (error) {
    console.error('Error running tests:', error instanceof Error ? error.message : String(error))
    return false
  }
}

const cli = new CAC('stx')

// Helper to check if an argument is a glob pattern
const isGlob = (arg: string) => arg.includes('*') || arg.includes('?') || arg.includes('{') || arg.includes('[')

// Helper to check if we support this file type
const isSupportedFileType = (arg: string) => arg.endsWith('.stx') || arg.endsWith('.md')

// Check if direct file(s) run mode or glob pattern is provided
const isDirectMode = process.argv.length >= 3 && (
  (isSupportedFileType(process.argv[2]) && fs.existsSync(process.argv[2]))
  || isGlob(process.argv[2])
)

if (isDirectMode) {
  // Direct file mode: stx file.stx, stx file.md or stx **/*.stx
  const fileArg = process.argv[2]

  const options: DevServerOptions = {
    port: 3000,
    watch: true,
    cache: true,
    markdown: {
      syntaxHighlighting: {
        enabled: true,
        serverSide: true,
        defaultTheme: 'github' as SyntaxHighlightTheme,
        highlightUnknownLanguages: true,
      },
    },
  }

  // Parse any options after the file
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg === '--port' && i + 1 < process.argv.length) {
      options.port = Number.parseInt(process.argv[++i], 10)
    }
    else if (arg === '--no-watch') {
      options.watch = false
    }
    else if (arg === '--highlight-theme' && i + 1 < process.argv.length) {
      if (!options.markdown)
        options.markdown = {}
      if (!options.markdown.syntaxHighlighting)
        options.markdown.syntaxHighlighting = {}
      options.markdown.syntaxHighlighting.defaultTheme = process.argv[++i] as SyntaxHighlightTheme
    }
    else if (arg === '--no-highlight') {
      if (!options.markdown)
        options.markdown = {}
      if (!options.markdown.syntaxHighlighting)
        options.markdown.syntaxHighlighting = {}
      options.markdown.syntaxHighlighting.enabled = false
    }
    else if (arg === '--no-highlight-unknown') {
      if (!options.markdown)
        options.markdown = {}
      if (!options.markdown.syntaxHighlighting)
        options.markdown.syntaxHighlighting = {}
      options.markdown.syntaxHighlighting.highlightUnknownLanguages = false
    }
    else if (arg === '--no-cache') {
      options.cache = false
    }
  }

  // Check if we're dealing with a glob pattern
  if (isGlob(fileArg)) {
    // Handle glob pattern

    try {
      // Use Bun.glob to find all matching files
      const files = await Array.fromAsync(new Bun.Glob(fileArg).scan({ onlyFiles: true, absolute: true }))

      // Filter to only include supported file types based on the pattern
      const supportedFiles = fileArg.endsWith('.stx')
        ? files.filter(file => file.endsWith('.stx'))
        : fileArg.endsWith('.md')
          ? files.filter(file => file.endsWith('.md'))
          : files.filter(file => file.endsWith('.stx') || file.endsWith('.md'))

      if (supportedFiles.length === 0) {
        console.error(`Error: No STX or Markdown files found matching pattern: ${fileArg}`)
        process.exit(1)
      }

      // Serve multiple files directly without extra output
      // (the server will handle the pretty output)
      const success = await serveMultipleStxFiles(supportedFiles, options)

      if (!success) {
        process.exit(1)
      }
    }
    catch (error) {
      console.error('Failed to process files:', error)
      process.exit(1)
    }
  }
  else {
    // Single file mode - launch directly without extra output
    // (the server will handle the pretty output)
    serveStxFile(fileArg, options)
      .catch((error) => {
        console.error('Failed to start dev server:', error)
        process.exit(1)
      })
  }
}
else {
  // Normal CLI mode - define all commands
  cli
    .command('docs', 'Generate documentation for components, templates, and directives')
    .option('--output <dir>', 'Output directory for documentation', { default: 'docs' })
    .option('--format <format>', 'Documentation format (markdown, html, json)', { default: 'markdown' })
    .option('--components-dir <dir>', 'Components directory', { default: 'components' })
    .option('--templates-dir <dir>', 'Templates directory', { default: '.' })
    .option('--no-components', 'Disable components documentation')
    .option('--no-templates', 'Disable templates documentation')
    .option('--no-directives', 'Disable directives documentation')
    .option('--extra-content <content>', 'Extra content to include in documentation')
    .example('stx docs --output docs --format html')
    .action(async (options) => {
      try {
        const result = await docsCommand(options)
        if (result) {
          console.log('Documentation generated successfully.')
          process.exit(0)
        }
        else {
          console.error('Documentation generation failed.')
          process.exit(1)
        }
      }
      catch (error) {
        console.error('Error generating documentation:', error)
        process.exit(1)
      }
    })

  cli
    .command('dev <file>', 'Start a development server for an STX file')
    .option('--port <port>', 'Port to use for the dev server', { default: 3000 })
    .option('--no-watch', 'Disable file watching and auto-reload')
    .option('--highlight-theme <theme>', 'Syntax highlighting theme for Markdown code blocks', { default: 'github' })
    .option('--no-highlight', 'Disable syntax highlighting for Markdown code blocks')
    .option('--no-highlight-unknown', 'Disable syntax highlighting for unknown languages in Markdown')
    .option('--no-cache', 'Disable caching of parsed files')
    .example('stx dev template.stx')
    .example('stx dev components/hero.stx --port 8080')
    .example('stx dev **/*.stx')
    .example('stx dev docs/guide.md')
    .example('stx dev **/*.md')
    .example('stx dev docs/guide.md --highlight-theme atom-one-dark')
    .action(async (filePattern, options) => {
      try {
        // Set up markdown options from CLI parameters
        const markdownOptions = {
          syntaxHighlighting: {
            enabled: options.highlight !== false,
            serverSide: true,
            defaultTheme: (options.highlightTheme || 'github') as SyntaxHighlightTheme,
            highlightUnknownLanguages: options.highlightUnknown !== false,
          },
        }

        // Check if the input is a glob pattern
        if (isGlob(filePattern)) {
          console.log(`Expanding glob pattern: ${filePattern}`)

          // Use Bun.Glob to find matching files
          const files = await Array.fromAsync(new Bun.Glob(filePattern).scan({ onlyFiles: true, absolute: true }))

          // Filter to only include supported file types
          const supportedFiles = filePattern.endsWith('.stx')
            ? files.filter(file => file.endsWith('.stx'))
            : filePattern.endsWith('.md')
              ? files.filter(file => file.endsWith('.md'))
              : files.filter(file => file.endsWith('.stx') || file.endsWith('.md'))

          if (supportedFiles.length === 0) {
            console.error(`Error: No STX or Markdown files found matching pattern: ${filePattern}`)
            process.exit(1)
          }

          console.log(`Found ${supportedFiles.length} ${supportedFiles.length === 1 ? 'file' : 'files'} matching ${filePattern}`)

          // Serve multiple files
          const success = await serveMultipleStxFiles(supportedFiles, {
            port: options.port,
            watch: options.watch !== false,
            markdown: markdownOptions,
            cache: options.cache !== false,
          } as DevServerOptions)

          if (!success) {
            process.exit(1)
          }
        }
        else {
          // Single file mode
          const success = await serveStxFile(filePattern, {
            port: options.port,
            watch: options.watch !== false,
            markdown: markdownOptions,
            cache: options.cache !== false,
          } as DevServerOptions)

          if (!success) {
            process.exit(1)
          }
        }
      }
      catch (error) {
        console.error('Error starting dev server:', error)
        process.exit(1)
      }
    })

  cli
    .command('a11y [directory]', 'Scan STX files for accessibility issues')
    .option('--no-recursive', 'Disable recursive scanning of directories')
    .option('--ignore <paths>', 'Comma-separated paths to ignore', { default: '' })
    .option('--json', 'Output results as JSON')
    .option('--output <file>', 'Write results to a file instead of stdout')
    .option('--fix', 'Automatically fix common accessibility issues')
    .example('stx a11y ./templates')
    .example('stx a11y --json --output a11y-report.json')
    .action(async (directory = '.', options) => {
      try {
        console.log(`Scanning ${directory} for accessibility issues...`)

        // Parse ignore paths
        const ignorePaths = options.ignore
          ? options.ignore.split(',').map((p: string) => p.trim())
          : []

        // Scan for issues
        const results = await scanA11yIssues(directory, {
          recursive: options.recursive !== false,
          ignorePaths,
        })

        // Count total issues
        const totalFiles = Object.keys(results).length
        const totalIssues = Object.values(results).reduce(
          (sum, issues) => sum + issues.length,
          0,
        )

        // Format and output results
        if (options.json) {
          const jsonOutput = JSON.stringify(results, null, 2)

          if (options.output) {
            await Bun.write(options.output, jsonOutput)
            console.log(`A11y scan results written to ${options.output}`)
          }
          else {
            console.log(jsonOutput)
          }
        }
        else {
          // User-friendly console output
          if (totalFiles === 0) {
            console.log('✓ No accessibility issues found!')
          }
          else {
            console.log(`Found ${totalIssues} accessibility issues in ${totalFiles} files:\n`)

            for (const [file, issues] of Object.entries(results)) {
              const relativePath = path.relative(process.cwd(), file)
              console.log(`\n${relativePath} (${issues.length} issues):`)

              for (const issue of issues) {
                console.log(`  • ${issue.impact.toUpperCase()}: ${issue.message}`)
                console.log(`    ${issue.help}`)
                if (issue.helpUrl) {
                  console.log(`    More info: ${issue.helpUrl}`)
                }
                console.log(`    Element: ${issue.element.substring(0, 100)}${issue.element.length > 100 ? '...' : ''}`)
                console.log('')
              }
            }

            console.log(`\nTotal: ${totalIssues} issues in ${totalFiles} files`)

            if (options.output) {
              // Create a simple HTML report
              const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>STX Accessibility Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { margin-bottom: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .file { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
    .file-header { padding: 10px 15px; background: #eee; font-weight: bold; border-bottom: 1px solid #ddd; }
    .issue { padding: 15px; border-bottom: 1px solid #eee; }
    .issue:last-child { border-bottom: none; }
    .issue-impact { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; color: white; margin-right: 10px; }
    .critical { background-color: #d00; }
    .serious { background-color: #f50; }
    .moderate { background-color: #e90; }
    .minor { background-color: #0a7; }
    .issue-element { font-family: monospace; padding: 8px; background: #f5f5f5; margin-top: 10px; border-radius: 3px; overflow: auto; }
    .help-url { font-size: 14px; }
  </style>
</head>
<body>
  <h1>STX Accessibility Report</h1>

  <div class="summary">
    <p>Found ${totalIssues} accessibility issues in ${totalFiles} files</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  ${Object.entries(results).map(([file, issues]) => `
    <div class="file">
      <div class="file-header">${path.relative(process.cwd(), file)} (${issues.length} issues)</div>
      ${issues.map(issue => `
        <div class="issue">
          <span class="issue-impact ${issue.impact}">${issue.impact.toUpperCase()}</span>
          <strong>${issue.message}</strong>
          <p>${issue.help}</p>
          ${issue.helpUrl ? `<a class="help-url" href="${issue.helpUrl}" target="_blank">More information</a>` : ''}
          <pre class="issue-element">${issue.element.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>
              `.trim()

              await Bun.write(options.output, htmlReport)
              console.log(`A11y scan results written to ${options.output}`)
            }
          }
        }

        // Exit with error code if issues found
        process.exit(totalIssues > 0 ? 1 : 0)
      }
      catch (error) {
        console.error('Error scanning for accessibility issues:', error)
        process.exit(1)
      }
    })

  cli
    .command('build [entrypoints...]', 'Bundle your STX files using Bun\'s bundler')
    .option('--outdir <dir>', 'Output directory for bundled files', { default: 'dist' })
    .option('--outfile <file>', 'Output file name (for single entrypoint)')
    .option('--target <target>', 'Target environment: browser, bun, or node', { default: 'browser' })
    .option('--format <format>', 'Output format: esm, cjs, or iife', { default: 'esm' })
    .option('--minify', 'Enable minification')
    .option('--no-minify', 'Disable minification')
    .option('--sourcemap <type>', 'Sourcemap type: none, linked, inline, or external', { default: 'none' })
    .option('--splitting', 'Enable code splitting')
    .option('--no-splitting', 'Disable code splitting')
    .option('--external <modules>', 'Comma-separated list of modules to exclude from bundle')
    .option('--packages <mode>', 'Package handling mode: bundle or external', { default: 'bundle' })
    .option('--watch', 'Watch for changes and rebuild')
    .option('--public-path <path>', 'Public path for assets')
    .option('--env <mode>', 'How to handle environment variables: inline, disable, or prefix*')
    .option('--compile', 'Generate a standalone executable')
    .option('--root <dir>', 'Project root directory')
    .option('--verbose', 'Show verbose build output')
    .example('stx build ./src/index.stx --outfile bundle.js')
    .example('stx build ./components/*.stx --outdir dist --minify')
    .example('stx build ./src/index.stx --outfile bundle.js --target bun')
    .example('stx build **/*.stx --outdir dist')
    .action(async (entrypoints: string | string[], options: {
      outdir: string
      outfile?: string
      target?: 'browser' | 'bun' | 'node'
      format?: 'esm' | 'cjs' | 'iife'
      minify?: boolean
      sourcemap?: 'none' | 'linked' | 'inline' | 'external' | boolean
      splitting?: boolean
      external?: string
      packages?: 'bundle' | 'external'
      watch?: boolean
      publicPath?: string
      env?: 'inline' | 'disable' | `${string}*`
      compile?: boolean
      root?: string
      verbose?: boolean
    }) => {
      try {
        console.log('Building STX files...')

        // Convert entrypoints to an array if it's a string
        let entrypointArray: string[] = []
        if (typeof entrypoints === 'string') {
          // It's a single path
          entrypointArray = [entrypoints]
        }
        else if (Array.isArray(entrypoints)) {
          entrypointArray = entrypoints
        }
        else {
          entrypointArray = []
        }

        if (entrypointArray.length === 0) {
          console.error('Error: No entrypoints specified')
          process.exit(1)
        }

        // Create temporary and output directories
        const tempDir = path.join(process.cwd(), '.stx-build-temp')
        const outputDir = path.resolve(options.outdir)

        // Ensure directories exist
        fs.mkdirSync(tempDir, { recursive: true })
        fs.mkdirSync(outputDir, { recursive: true })

        // Expanded file paths
        const expandedFiles: string[] = []

        // Process each entrypoint, expanding globs as needed
        for (const entrypoint of entrypointArray) {
          if (isGlob(entrypoint)) {
            console.log(`Expanding glob pattern: ${entrypoint}`)
            try {
              const matchedFiles = await Array.fromAsync(
                new Bun.Glob(entrypoint).scan({
                  onlyFiles: true,
                  absolute: false, // Use relative paths
                }),
              )

              // Filter to only include .stx files if pattern doesn't specify
              const stxFiles = entrypoint.endsWith('.stx')
                ? matchedFiles
                : matchedFiles.filter(file => file.endsWith('.stx'))

              if (stxFiles.length === 0) {
                console.warn(`Warning: No .stx files found matching pattern: ${entrypoint}`)
              }
              else {
                console.log(`Found ${stxFiles.length} STX ${stxFiles.length === 1 ? 'file' : 'files'} matching ${entrypoint}`)
                expandedFiles.push(...stxFiles)
              }
            }
            catch (error) {
              console.error(`Error expanding glob pattern ${entrypoint}:`, error)
              process.exit(1)
            }
          }
          else if (entrypoint.endsWith('.stx')) {
            // Add .stx file directly
            expandedFiles.push(entrypoint)
          }
          else {
            console.warn(`Warning: Skipping non-STX file: ${entrypoint}`)
          }
        }

        if (expandedFiles.length === 0) {
          console.error('Error: No valid .stx files found to build')
          process.exit(1)
        }

        console.log(`Building ${expandedFiles.length} STX ${expandedFiles.length === 1 ? 'file' : 'files'}...`)

        // Track successfully built files
        interface BuildResult {
          inputFile: string
          outputHtml?: string
          outputJs?: string
          otherOutputs: string[]
          scriptSources?: string[]
        }

        const results: BuildResult[] = []
        let successCount = 0

        // Build each file individually
        for (const file of expandedFiles) {
          const absolutePath = path.resolve(file)
          const relativePath = path.relative(process.cwd(), absolutePath)

          if (options.verbose) {
            console.log(`Processing: ${relativePath}`)
          }

          try {
            // Build with STX plugin to generate HTML
            const buildResult = await Bun.build({
              entrypoints: [absolutePath],
              outdir: tempDir,
              plugins: [stxPlugin],
              target: options.target || 'browser',
              format: options.format || 'esm',
              minify: options.minify !== false,
              sourcemap: options.sourcemap || 'none',
              splitting: options.splitting !== false,
              define: {
                'process.env.NODE_ENV': '"production"',
              },
            })

            if (!buildResult.success) {
              console.error(`Build failed for ${relativePath}:`, buildResult.logs)
              continue
            }

            // Find HTML and JS outputs
            const htmlOutput = buildResult.outputs.find(o => o.path.endsWith('.html'))
            const jsOutputs = buildResult.outputs.filter(o => o.path.endsWith('.js'))
            const otherOutputs = buildResult.outputs.filter(o => !o.path.endsWith('.html') && !o.path.endsWith('.js'))

            const result: BuildResult = {
              inputFile: relativePath,
              otherOutputs: otherOutputs.map(o => o.path),
            }

            if (htmlOutput) {
              result.outputHtml = htmlOutput.path

              // Read the HTML content to find all chunk references
              const htmlContent = await Bun.file(htmlOutput.path).text()

              // Extract all script src attributes from the HTML
              const scriptMatches = htmlContent.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g) || []

              // Find JS files referenced in the HTML
              const scriptSources = scriptMatches
                .map((script) => {
                  const srcMatch = script.match(/src="([^"]+)"/)
                  return srcMatch ? srcMatch[1] : null
                })
                .filter((src): src is string => src !== null)
                .filter(src => src.includes('chunk-'))

              if (options.verbose && scriptSources.length > 0) {
                console.log(`    Script references found in HTML: ${scriptSources.join(', ')}`)
              }

              // Track them in the result for reporting later
              result.scriptSources = scriptSources

              // Process expressions in the HTML that might not have been evaluated
              try {
                // Extract the script content from the original STX file
                const originalContent = await Bun.file(absolutePath).text()
                const scriptMatch = originalContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)

                if (scriptMatch) {
                  const scriptContent = scriptMatch[1]

                  // Execute the script to extract variables
                  try {
                    // Create a function to evaluate the script and extract variables
                    const evalFn = new Function(`${scriptContent}
                      // Return all variables defined in this scope
                      return {
                        name: typeof name !== 'undefined' ? name : undefined,
                        items: typeof items !== 'undefined' ? items : undefined,
                        count: typeof count !== 'undefined' ? count : undefined
                      };
                    `)

                    // Execute the function to get the variables
                    const context = evalFn()

                    if (options.verbose) {
                      console.log(`    Extracted variables:`, Object.keys(context).filter(k => context[k] !== undefined))
                    }

                    // Process the HTML content with these variables
                    let processedHtml = htmlContent

                    // Handle known complex patterns like the items.map() specifically
                    const itemsMapRegex = /\{items\.map\(item\s*=>\s*`[\s\S]*?<li>\{item\}<\/li>[\s\S]*?`\)\.join\(['"]*\)\}/g

                    // Replace items.map with the actual rendered list items
                    processedHtml = processedHtml.replace(itemsMapRegex, () => {
                      try {
                        if (!context.items || !Array.isArray(context.items)) {
                          if (options.verbose) {
                            console.warn('    Warning: items is not an array in context')
                          }
                          return '<!-- Error: items not found -->'
                        }

                        // Manually render the list items
                        const renderedItems = context.items.map((item: any) =>
                          `
    <li>${item}</li>
  `).join('')

                        if (options.verbose) {
                          console.log(`    Rendered items.map() with ${context.items.length} items`)
                        }

                        return renderedItems
                      }
                      catch (err) {
                        if (options.verbose) {
                          console.warn(`    Warning: Failed to render items.map(): ${err}`)
                        }
                        return '<!-- Error rendering items -->'
                      }
                    })

                    // Process other simple expressions like {name} and {count}
                    processedHtml = processedHtml.replace(/\{([^{}]+)\}/g, (match, expr) => {
                      // Skip if it looks like a complex expression
                      if (expr.includes('.map(') || expr.includes('.join(')) {
                        return match
                      }

                      try {
                        // Simple variable replacements
                        if (expr.trim() in context) {
                          return String(context[expr.trim()])
                        }

                        // Return the original expression if we can't evaluate it
                        return match
                      }
                      catch (err) {
                        if (options.verbose) {
                          console.warn(`    Warning: Error processing expression ${expr}: ${err}`)
                        }
                        return match // Keep original expression if processing fails
                      }
                    })

                    // Write the processed HTML back to the file
                    await Bun.write(htmlOutput.path, processedHtml)

                    if (options.verbose) {
                      console.log(`    Processed expressions in HTML output`)
                    }
                  }
                  catch (scriptError) {
                    if (options.verbose) {
                      console.warn(`    Warning: Could not extract variables from script: ${scriptError}`)
                    }
                  }
                }
              }
              catch (processError) {
                if (options.verbose) {
                  console.warn(`    Warning: Could not process expressions in HTML: ${processError}`)
                }
              }
            }

            if (jsOutputs.length > 0) {
              result.outputJs = jsOutputs[0].path
            }

            if (!htmlOutput) {
              console.warn(`Warning: No HTML output generated for ${relativePath}`)
            }

            results.push(result)
            successCount++

            if (options.verbose) {
              console.log(`  Success: ${relativePath}`)
              if (htmlOutput)
                console.log(`    HTML: ${path.basename(htmlOutput.path)}`)
              if (jsOutputs.length > 0)
                console.log(`    JS: ${jsOutputs.map(o => path.basename(o.path)).join(', ')}`)
              if (otherOutputs.length > 0)
                console.log(`    Other: ${otherOutputs.length} file(s)`)
            }
          }
          catch (error) {
            console.error(`Error building ${relativePath}:`, error)
          }
        }

        if (successCount === 0) {
          console.error('Error: No files were successfully built')
          fs.rmSync(tempDir, { recursive: true, force: true })
          process.exit(1)
        }

        // Copy files to final output directory, maintaining directory structure
        console.log(`Copying output files to ${outputDir}...`)
        let copiedFilesCount = 0

        for (const result of results) {
          // Calculate output paths, preserving directory structure
          const inputDir = path.dirname(result.inputFile)
          const baseName = path.basename(result.inputFile, '.stx')
          const targetDir = path.join(outputDir, inputDir)

          // Ensure target directory exists
          fs.mkdirSync(targetDir, { recursive: true })

          if (result.outputHtml) {
            // Read the HTML content to find all chunk references
            const htmlContent = await Bun.file(result.outputHtml).text()
            const targetHtmlPath = path.join(targetDir, `${baseName}.html`)

            // Extract all script src attributes from the HTML
            const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g
            const matches = [...htmlContent.matchAll(scriptRegex)]
            const scriptSrcs = matches.map(match => match[1])

            // Track all chunk files we need to copy
            const chunksToCopy = new Map<string, string>()

            // Process each script src to find chunk files
            for (const src of scriptSrcs) {
              if (src.startsWith('./') && src.includes('chunk-')) {
                const srcFileName = path.basename(src)
                const tempChunkPath = path.join(path.dirname(result.outputHtml), srcFileName)

                if (fs.existsSync(tempChunkPath)) {
                  chunksToCopy.set(srcFileName, tempChunkPath)
                }
                else if (options.verbose) {
                  console.warn(`    Warning: Referenced chunk file not found: ${tempChunkPath}`)
                }
              }
            }

            // Copy HTML file with adjusted script references if needed
            if (chunksToCopy.size > 0) {
              // We keep the references as they are (relative paths)
              fs.copyFileSync(result.outputHtml, targetHtmlPath)

              // Now copy all chunk files
              for (const [chunkName, chunkPath] of chunksToCopy.entries()) {
                const targetChunkPath = path.join(targetDir, chunkName)
                fs.copyFileSync(chunkPath, targetChunkPath)
                copiedFilesCount++

                if (options.verbose) {
                  console.log(`    Copied chunk: ${path.relative(outputDir, targetChunkPath)}`)
                }
              }
            }
            else {
              // No chunks, just copy the HTML file
              fs.copyFileSync(result.outputHtml, targetHtmlPath)
            }

            copiedFilesCount++
          }

          // Copy JS file (main entry JS, not chunks)
          if (result.outputJs) {
            const targetJsPath = path.join(targetDir, `${baseName}.js`)
            fs.copyFileSync(result.outputJs, targetJsPath)
            copiedFilesCount++
          }

          // Copy other files
          for (const otherPath of result.otherOutputs) {
            const otherName = path.basename(otherPath)
            const targetOtherPath = path.join(targetDir, otherName)
            fs.copyFileSync(otherPath, targetOtherPath)
            copiedFilesCount++
          }
        }

        // Clean up temporary directory
        try {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
        catch (error) {
          console.warn('Warning: Failed to clean up temporary directory')
        }

        // Output summary
        console.log(`✓ Build successful! Built ${successCount} STX ${successCount === 1 ? 'file' : 'files'} with ${copiedFilesCount} output ${copiedFilesCount === 1 ? 'file' : 'files'}`)

        // Track total script/chunk count for reporting
        let totalChunkCount = 0

        if (results.length > 0 && results.length <= 10) {
          console.log('\nGenerated files:')
          for (const result of results) {
            const inputDir = path.dirname(result.inputFile)
            const baseName = path.basename(result.inputFile, '.stx')

            console.log(`  ${result.inputFile} →`)
            if (result.outputHtml) {
              console.log(`    HTML: ${path.join(options.outdir, inputDir, `${baseName}.html`)}`)
            }
            if (result.outputJs) {
              console.log(`    JS: ${path.join(options.outdir, inputDir, `${baseName}.js`)}`)
            }

            // Report chunk files
            if (result.scriptSources && result.scriptSources.length > 0) {
              totalChunkCount += result.scriptSources.length
              console.log(`    Chunks: ${result.scriptSources.length} chunk file(s)`)

              // Show detailed chunk info if verbose
              if (options.verbose) {
                for (const src of result.scriptSources) {
                  const chunkName = path.basename(src)
                  console.log(`      - ${path.join(inputDir, chunkName)}`)
                }
              }
            }
          }
        }

        console.log(`\nTo view these files, you can use a local HTTP server:`)
        console.log(`  cd ${options.outdir} && npx serve`)

        if (totalChunkCount > 0) {
          console.log(`\nNote: The build includes JavaScript chunks that need to be served over HTTP for proper functioning.`)
          console.log(`Opening the HTML files directly may not work correctly due to browser security restrictions.`)
        }

        // Handle watch mode
        if (options.watch) {
          console.log('\nWatch mode enabled. Waiting for changes...')

          // Get directories to watch (parent directories of each STX file)
          const watchDirs = new Set(
            expandedFiles.map(file => path.dirname(path.resolve(file))),
          )

          for (const dir of watchDirs) {
            fs.watch(dir, { recursive: true }, async (eventType, filename) => {
              if (!filename)
                return

              if (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts')) {
                console.log(`\nFile changed: ${filename}, rebuilding...`)

                // Find associated input file
                const changedFile = path.join(dir, filename)
                const relativeChanged = path.relative(process.cwd(), changedFile)

                // Find file(s) to rebuild
                const filesToRebuild = filename.endsWith('.stx')
                  ? [relativeChanged] // If .stx file changed, rebuild just that file
                  : expandedFiles.filter((f) => { // If .js/.ts changed, rebuild any STX file in same directory
                      const fileDir = path.dirname(path.resolve(f))
                      return fileDir === dir
                    })

                if (filesToRebuild.length === 0) {
                  console.log('No STX files to rebuild')
                  return
                }

                // Rebuild files
                console.log(`Rebuilding ${filesToRebuild.length} file(s)...`)

                for (const file of filesToRebuild) {
                  try {
                    const absolutePath = path.resolve(file)
                    const buildResult = await Bun.build({
                      entrypoints: [absolutePath],
                      outdir: options.outdir,
                      plugins: [stxPlugin],
                      target: options.target || 'browser',
                      format: options.format || 'esm',
                      minify: options.minify !== false,
                      sourcemap: options.sourcemap || 'none',
                      splitting: options.splitting !== false,
                      define: {
                        'process.env.NODE_ENV': '"production"',
                      },
                    })

                    if (buildResult.success) {
                      console.log(`  ✓ Rebuilt ${file}`)
                    }
                    else {
                      console.error(`  ✗ Failed to rebuild ${file}`)
                    }
                  }
                  catch (error) {
                    console.error(`Error rebuilding ${file}:`, error)
                  }
                }

                console.log('Rebuild complete')
              }
            })
          }

          console.log(`Watching ${watchDirs.size} ${watchDirs.size === 1 ? 'directory' : 'directories'} for changes...`)
          console.log('Press Ctrl+C to stop')
        }
      }
      catch (error) {
        console.error('Build failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  cli
    .command('test [patterns...]', 'Run tests with Bun test runner and browser environment')
    .option('--watch', 'Watch for changes and rerun tests')
    .option('--filter <pattern>', 'Only run tests matching the given pattern')
    .option('--reporter <reporter>', 'Test reporter to use: default or junit (junit requires Bun v1.0+)', { default: 'default' })
    .option('--timeout <ms>', 'Test timeout in milliseconds', { default: 5000 })
    .option('--coverage', 'Enable code coverage')
    .option('--ui', 'Coming soon')
    .option('--verbose', 'Show verbose output including test command')
    .example('stx test')
    .example('stx test packages/stx/test/')
    .example('stx test **/*.test.ts --verbose')
    .example('stx test --filter "should process"')
    .example('stx test --watch --verbose')
    .example('stx test --reporter junit')
    .action(async (patterns: string[], options: TestCommandOptions) => {
      try {
        console.log(`\x1B[1mstx test\x1B[0m \x1B[2mv${version} (${gitHash})\x1B[0m`)

        // Convert patterns to array if it's a string
        const patternArray = typeof patterns === 'string' ? [patterns] : patterns || []

        // Default to finding all test files if no patterns specified
        if (patternArray.length === 0) {
          // Common test file patterns
          patternArray.push('**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js')
        }

        if (options.verbose) {
          console.log('Test patterns:', patternArray)
          console.log('Options:', JSON.stringify({
            watch: options.watch || false,
            filter: options.filter || 'none',
            reporter: options.reporter || 'default',
            timeout: options.timeout || 5000,
            coverage: options.coverage || false,
            ui: options.ui || false,
          }, null, 2))
        }

        // Run tests with provided patterns and options
        const success = await runTests(patternArray, options)

        // Exit with appropriate code based on test results
        if (!success && !options.watch) {
          process.exit(1)
        }
      }
      catch (error) {
        console.error('Error running tests:', error)
        process.exit(1)
      }
    })

  cli
    .command('init [file]', 'Create a new STX file')
    .alias('new')
    .option('--force', 'Overwrite existing file')
    .option('--template <file>', 'Path to a template file to use as a base')
    .example('stx init')
    .example('stx init page.stx')
    .example('stx new contact.stx')
    .example('stx new components/button.stx --template examples/components/button.stx')
    .action(async (file = 'index.stx', options) => {
      try {
        const success = await initFile(file, {
          force: options.force,
          template: options.template,
        })

        if (success) {
          console.log(`\n✨ Successfully created file: ${file}`)
          console.log(`\nTo view it in the development server:`)
          console.log(`  stx dev ${file}\n`)
        }
        else {
          console.error(`\n❌ Failed to create file: ${file}`)
          process.exit(1)
        }
      }
      catch (error) {
        console.error('Error creating file:', error)
        process.exit(1)
      }
    })

  cli.command('version', 'Show the version of the CLI').action(() => {
    console.log(version)
  })

  cli.help()
  cli.version(version)
  cli.parse()
}
