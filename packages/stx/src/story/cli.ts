/**
 * STX Story - CLI Integration
 * Provides CLI commands for the story feature
 */

import process from 'node:process'
import { buildCommand } from './commands/build'
import { devCommand } from './commands/dev'
import { previewCommand } from './commands/preview'

/**
 * CLI command definitions for integration with @stacksjs/clapp
 */
export const storyCommands = {
  /**
   * Main story command (defaults to dev)
   */
  'story': {
    description: 'Component showcase and testing',
    options: {
      port: {
        alias: 'p',
        type: 'number' as const,
        description: 'Server port (default: 6006)',
      },
      open: {
        alias: 'o',
        type: 'boolean' as const,
        description: 'Open browser automatically',
      },
      host: {
        type: 'string' as const,
        description: 'Host to bind to',
      },
    },
    action: async (options: { port?: number, open?: boolean, host?: string }): Promise<void> => {
      await devCommand(options)
    },
  },

  /**
   * Story dev subcommand
   */
  'story:dev': {
    description: 'Start story development server',
    options: {
      port: {
        alias: 'p',
        type: 'number' as const,
        description: 'Server port (default: 6006)',
      },
      open: {
        alias: 'o',
        type: 'boolean' as const,
        description: 'Open browser automatically',
      },
      host: {
        type: 'string' as const,
        description: 'Host to bind to',
      },
    },
    action: async (options: { port?: number, open?: boolean, host?: string }): Promise<void> => {
      await devCommand(options)
    },
  },

  /**
   * Story build subcommand
   */
  'story:build': {
    description: 'Build static story site',
    options: {
      outDir: {
        alias: 'o',
        type: 'string' as const,
        description: 'Output directory',
      },
    },
    action: async (options: { outDir?: string }): Promise<void> => {
      await buildCommand(options)
    },
  },

  /**
   * Story preview subcommand
   */
  'story:preview': {
    description: 'Preview built story site',
    options: {
      port: {
        alias: 'p',
        type: 'number' as const,
        description: 'Server port (default: 4173)',
      },
      open: {
        alias: 'o',
        type: 'boolean' as const,
        description: 'Open browser automatically',
      },
    },
    action: async (options: { port?: number, open?: boolean }): Promise<void> => {
      await previewCommand(options)
    },
  },

  /**
   * Story test subcommand
   */
  'story:test': {
    description: 'Run visual regression tests',
    options: {
      update: {
        alias: 'u',
        type: 'boolean' as const,
        description: 'Update snapshots',
      },
      filter: {
        alias: 'f',
        type: 'string' as const,
        description: 'Filter components by name',
      },
    },
    action: async (options: { update?: boolean, filter?: string }): Promise<void> => {
      const { createContext } = await import('./context')
      const { runVisualTests, updateSnapshots, formatTestResults } = await import('./testing')

      const ctx = await createContext({ mode: 'build' })

      if (options.update) {
        const count = await updateSnapshots(ctx, {
          filter: options.filter ? [options.filter] : undefined,
        })
        console.log(`Updated ${count} snapshots`)
      }
      else {
        const result = await runVisualTests(ctx, {
          filter: options.filter ? [options.filter] : undefined,
        })
        console.log(formatTestResults(result))
        if (result.failed > 0) {
          process.exit(1)
        }
      }
    },
  },
}

/**
 * Register story commands with a CLI instance
 * This is a helper for manual CLI integration
 */
export function registerStoryCommands(cli: any): void {
  // Register main story command
  cli.command('story', storyCommands.story.description)
    .option('-p, --port <port>', storyCommands.story.options.port.description)
    .option('-o, --open', storyCommands.story.options.open.description)
    .option('--host <host>', storyCommands.story.options.host.description)
    .action(storyCommands.story.action)

  // Register subcommands
  cli.command('story dev', storyCommands['story:dev'].description)
    .option('-p, --port <port>', storyCommands['story:dev'].options.port.description)
    .option('-o, --open', storyCommands['story:dev'].options.open.description)
    .option('--host <host>', storyCommands['story:dev'].options.host.description)
    .action(storyCommands['story:dev'].action)

  cli.command('story build', storyCommands['story:build'].description)
    .option('-o, --outDir <dir>', storyCommands['story:build'].options.outDir.description)
    .action(storyCommands['story:build'].action)

  cli.command('story preview', storyCommands['story:preview'].description)
    .option('-p, --port <port>', storyCommands['story:preview'].options.port.description)
    .option('-o, --open', storyCommands['story:preview'].options.open.description)
    .action(storyCommands['story:preview'].action)

  cli.command('story test', storyCommands['story:test'].description)
    .option('-u, --update', storyCommands['story:test'].options.update.description)
    .option('-f, --filter <name>', storyCommands['story:test'].options.filter.description)
    .action(storyCommands['story:test'].action)
}

/**
 * Run story CLI directly (for standalone usage)
 */
export async function runStoryCLI(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0] || 'dev'
  const options: Record<string, any> = {}

  // Parse simple options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg === '-p' || arg === '--port') {
      options.port = Number.parseInt(args[++i], 10)
    }
    else if (arg === '-o' || arg === '--open') {
      options.open = true
    }
    else if (arg === '--host') {
      options.host = args[++i]
    }
    else if (arg === '-u' || arg === '--update') {
      options.update = true
    }
    else if (arg === '-f' || arg === '--filter') {
      options.filter = args[++i]
    }
    else if (arg === '--outDir') {
      options.outDir = args[++i]
    }
  }

  switch (command) {
    case 'dev':
    case '':
      await devCommand(options)
      break
    case 'build':
      await buildCommand(options)
      break
    case 'preview':
      await previewCommand(options)
      break
    case 'test':
      await storyCommands['story:test'].action(options)
      break
    default:
      console.log('Unknown command:', command)
      console.log('Available commands: dev, build, preview, test')
      process.exit(1)
  }
}
