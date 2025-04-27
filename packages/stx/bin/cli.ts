import { CAC } from 'cac'
import { version } from '../package.json'
import { docsCommand } from '../src/docs'

const cli = new CAC('stx')

interface CliOption {
  verbose: boolean
}

cli
  .command('build', 'Build the project')
  .option('--verbose', 'Enable verbose logging')
  .example('stx build --verbose')
  .action(async (options?: CliOption) => {
    // TODO: Implement build command
  })

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

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
