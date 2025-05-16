import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { scanA11yIssues } from '../src/a11y'
import { serveMultipleStxFiles, serveStxFile } from '../src/dev-server'
import { docsCommand } from '../src/docs'

const cli = new CAC('stx')

// interface CliOption {
//   verbose: boolean
// }

// Helper to check if an argument is a glob pattern
const isGlob = (arg: string) => arg.includes('*') || arg.includes('?') || arg.includes('{') || arg.includes('[')

// Check if direct file(s) run mode or glob pattern is provided
const isDirectMode = process.argv.length >= 3 && (
  (process.argv[2].endsWith('.stx') && fs.existsSync(process.argv[2]))
  || isGlob(process.argv[2])
)

if (isDirectMode) {
  // Direct file mode: stx file.stx or stx **/*.stx
  const fileArg = process.argv[2]
  const options = {
    port: 3000,
    watch: true,
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
  }

  // Check if we're dealing with a glob pattern
  if (isGlob(fileArg)) {
    // Handle glob pattern
    (async () => {
      try {
        // Use Bun.glob to find all matching .stx files
        const files = await Array.fromAsync(new Bun.Glob(fileArg).scan({ onlyFiles: true, absolute: true }))

        // Filter to only include .stx files
        const stxFiles = fileArg.endsWith('.stx')
          ? files
          : files.filter(file => file.endsWith('.stx'))

        if (stxFiles.length === 0) {
          console.error(`Error: No .stx files found matching pattern: ${fileArg}`)
          process.exit(1)
        }

        // Serve multiple STX files directly without extra output
        // (the server will handle the pretty output)
        const success = await serveMultipleStxFiles(stxFiles, options)

        if (!success) {
          process.exit(1)
        }
      }
      catch (error) {
        console.error('Failed to process STX files:', error)
        process.exit(1)
      }
    })()
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
    .example('stx dev template.stx')
    .example('stx dev components/hero.stx --port 8080')
    .example('stx dev **/*.stx')
    .action(async (filePattern, options) => {
      try {
        // Check if the input is a glob pattern
        if (isGlob(filePattern)) {
          console.log(`Expanding glob pattern: ${filePattern}`)

          // Use Bun.Glob to find matching files
          const files = await Array.fromAsync(new Bun.Glob(filePattern).scan({ onlyFiles: true, absolute: true }))

          // Filter to only include .stx files
          const stxFiles = filePattern.endsWith('.stx')
            ? files
            : files.filter(file => file.endsWith('.stx'))

          if (stxFiles.length === 0) {
            console.error(`Error: No .stx files found matching pattern: ${filePattern}`)
            process.exit(1)
          }

          console.log(`Found ${stxFiles.length} STX ${stxFiles.length === 1 ? 'file' : 'files'} matching ${filePattern}`)

          // Serve multiple STX files
          const success = await serveMultipleStxFiles(stxFiles, {
            port: options.port,
            watch: options.watch !== false,
          })

          if (!success) {
            process.exit(1)
          }
        }
        else {
          // Single file mode
          const success = await serveStxFile(filePattern, {
            port: options.port,
            watch: options.watch !== false,
          })

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
    .example('stx build ./src/index.stx --outfile bundle.js')
    .example('stx build ./components/*.stx --outdir dist --minify')
    .example('stx build ./src/index.stx --outfile bundle.js --target bun')
    .example('stx build **/*.stx --outdir dist')
    .action(async (entrypoints: string[], options: {
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
    }) => {
      try {
        console.log('Building files with Bun...')

        if (!entrypoints || entrypoints.length === 0) {
          console.error('Error: No entrypoints specified')
          process.exit(1)
        }

        // Expand any glob patterns in entrypoints
        const expandedEntrypoints: string[] = []

        // Process each entrypoint, expanding globs as needed
        for (const entrypoint of entrypoints) {
          if (isGlob(entrypoint)) {
            // Use Bun.Glob to expand the pattern
            console.log(`Expanding glob pattern: ${entrypoint}`)
            try {
              const matchedFiles = await Array.fromAsync(
                new Bun.Glob(entrypoint).scan({
                  onlyFiles: true,
                  absolute: true,
                }),
              )

              // Filter to only include .stx files if the pattern itself doesn't already specify .stx
              const stxFiles = entrypoint.endsWith('.stx')
                ? matchedFiles
                : matchedFiles.filter(file => file.endsWith('.stx'))

              if (stxFiles.length === 0) {
                console.warn(`Warning: No .stx files found matching pattern: ${entrypoint}`)
              }
              else {
                console.log(`Found ${stxFiles.length} STX ${stxFiles.length === 1 ? 'file' : 'files'} matching ${entrypoint}`)
                expandedEntrypoints.push(...stxFiles)
              }
            }
            catch (error) {
              console.error(`Error expanding glob pattern ${entrypoint}:`, error)
              process.exit(1)
            }
          }
          else {
            // Regular file path, add directly
            expandedEntrypoints.push(entrypoint)
          }
        }

        if (expandedEntrypoints.length === 0) {
          console.error('Error: No valid entrypoints found after expanding glob patterns')
          process.exit(1)
        }

        console.log(`Building ${expandedEntrypoints.length} STX ${expandedEntrypoints.length === 1 ? 'file' : 'files'}...`)

        // Define the type for Bun build options
        interface BunBuildOptions {
          entrypoints: string[]
          target?: 'browser' | 'bun' | 'node'
          format?: 'esm' | 'cjs' | 'iife'
          minify?: boolean | {
            whitespace?: boolean
            syntax?: boolean
            identifiers?: boolean
          }
          sourcemap?: 'none' | 'linked' | 'inline' | 'external' | boolean
          splitting?: boolean
          outdir?: string
          outfile?: string
          publicPath?: string
          root?: string
          env?: 'inline' | 'disable' | `${string}*`
          packages?: 'bundle' | 'external'
          external?: string[]
          compile?: boolean
          watch?: {
            onRebuild: (error: Error | null, result: BuildOutput | null) => void
          }
        }

        // Define the type for Bun build output
        interface BuildOutput {
          outputs: Array<{
            path: string
            kind: string
            hash: string | null
          }>
          success: boolean
          logs: Array<{
            level: string
            message: string
          }>
        }

        // Prepare build options with proper typing
        const buildOptions: BunBuildOptions = {
          entrypoints: expandedEntrypoints,
          target: options.target,
          format: options.format,
          minify: options.minify !== false,
          sourcemap: options.sourcemap,
          splitting: options.splitting !== false,
          outdir: options.outdir,
          publicPath: options.publicPath,
          root: options.root,
          env: options.env as 'inline' | 'disable' | `${string}*`,
          packages: options.packages as 'bundle' | 'external',
          compile: options.compile,
        }

        // Handle output file override
        if (options.outfile) {
          if (expandedEntrypoints.length > 1) {
            console.warn('Warning: --outfile is ignored when building multiple entrypoints')
          }
          else {
            delete buildOptions.outdir
            buildOptions.outfile = options.outfile
          }
        }

        // Handle external modules
        if (options.external) {
          buildOptions.external = options.external.split(',').map((e: string) => e.trim())
        }

        // Handle watch mode
        if (options.watch) {
          buildOptions.watch = {
            onRebuild(error: Error | null, result: BuildOutput | null) {
              if (error) {
                console.error('Build failed:', error)
              }
              else if (result) {
                const fileCount = result.outputs.length
                console.log(`Build succeeded! Generated ${fileCount} file${fileCount !== 1 ? 's' : ''}`)
              }
            },
          }
        }

        // Execute build
        const result = await Bun.build(buildOptions) as BuildOutput

        if (result.success) {
          const outputCount = result.outputs.length
          console.log(`✓ Build successful! Generated ${outputCount} file${outputCount !== 1 ? 's' : ''}`)

          // Show output file paths
          if (outputCount > 0 && outputCount <= 10) {
            console.log('\nGenerated files:')
            for (const output of result.outputs) {
              const relativePath = path.relative(process.cwd(), output.path)
              console.log(`  ${relativePath}`)
            }
          }

          // Show any warnings
          if (result.logs && result.logs.length > 0) {
            const warnings = result.logs.filter(log => log.level === 'warning')
            if (warnings.length > 0) {
              console.log('\nWarnings:')
              for (const warning of warnings) {
                console.warn(`  ${warning.message}`)
              }
            }
          }
        }
        else {
          console.error('Build failed with errors')
          if (result.logs && result.logs.length > 0) {
            const errors = result.logs.filter(log => log.level === 'error')
            for (const error of errors) {
              console.error(`  ${error.message}`)
            }
          }
          process.exit(1)
        }
      }
      catch (error) {
        console.error('Build failed:', error instanceof Error ? error.message : String(error))
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
