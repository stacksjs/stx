import { CAC } from 'cac'
import { version } from '../package.json'

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

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
