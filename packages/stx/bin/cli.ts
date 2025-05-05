import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { docsCommand } from '../src/docs'
import { scanA11yIssues } from '../src/a11y'
import path from 'node:path'
import { serveStxFile } from '../src/dev-server'
import fs from 'node:fs'

const cli = new CAC('stx')

interface CliOption {
  verbose: boolean
}

// Check if a file is being provided directly
const isDirectFileRun = process.argv.length >= 3 &&
                        process.argv[2].endsWith('.stx') &&
                        fs.existsSync(process.argv[2])

if (isDirectFileRun) {
  // Direct file mode: stx file.stx
  const filePath = process.argv[2]
  const options = {
    port: 3000,
    watch: true
  }

  // Parse any options after the file
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg === '--port' && i + 1 < process.argv.length) {
      options.port = parseInt(process.argv[++i], 10)
    }
    else if (arg === '--no-watch') {
      options.watch = false
    }
  }

  // Start the dev server directly
  serveStxFile(filePath, options)
    .catch(error => {
      console.error('Failed to start dev server:', error)
      process.exit(1)
    })
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
    .action(async (file, options) => {
      try {
        const success = await serveStxFile(file, {
          port: options.port,
          watch: options.watch !== false
        })

        if (!success) {
          process.exit(1)
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
          0
        )

        // Format and output results
        if (options.json) {
          const jsonOutput = JSON.stringify(results, null, 2)

          if (options.output) {
            await Bun.write(options.output, jsonOutput)
            console.log(`A11y scan results written to ${options.output}`)
          } else {
            console.log(jsonOutput)
          }
        } else {
          // User-friendly console output
          if (totalFiles === 0) {
            console.log('✓ No accessibility issues found!')
          } else {
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

  cli.command('version', 'Show the version of the CLI').action(() => {
    console.log(version)
  })

  cli.help()
  cli.version(version)
  cli.parse()
}
