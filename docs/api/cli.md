# CLI API Reference

This document covers STX's command-line interface (CLI) API, including project scaffolding, development, building, and deployment commands.

## Project Commands

### Project Creation

```bash
# Create new project
stx create my-project

# Create with template
stx create my-project --template typescript

# Create with options
stx create my-project \
  --template typescript \
  --package-manager bun \
  --git \
  --install
```

### Project Configuration

```bash
# Initialize configuration
stx init

# Add configuration options
stx config set key value

# Get configuration value
stx config get key

# List all configuration
stx config list

# Reset configuration
stx config reset
```

## Development Commands

### Development Server

```bash
# Start development server
stx dev

# Start with port
stx dev --port 3000

# Start with host
stx dev --host 0.0.0.0

# Start with HTTPS
stx dev --https

# Start with custom config
stx dev --config stx.config.ts
```

### File Generation

```bash
# Generate component
stx generate component MyComponent

# Generate page
stx generate page About

# Generate layout
stx generate layout Admin

# Generate store module
stx generate store user

# Generate API route
stx generate api users
```

### Asset Management

```bash
# Build assets
stx assets:build

# Watch assets
stx assets:watch

# Clean asset cache
stx assets:clean

# Optimize images
stx assets:optimize

# Generate icons
stx assets:icons
```

## Build Commands

### Production Build

```bash
# Build for production
stx build

# Build with options
stx build \
  --mode production \
  --target esnext \
  --minify \
  --sourcemap

# Build specific entry
stx build src/main.ts

# Build with custom config
stx build --config prod.config.ts
```

### Build Analysis

```bash
# Analyze bundle
stx analyze

# Generate bundle report
stx analyze --json stats.json

# View bundle visualization
stx analyze --open

# Check bundle size
stx analyze --size-limit
```

## Testing Commands

### Test Execution

```bash
# Run all tests
stx test

# Run specific tests
stx test src/components

# Run with coverage
stx test --coverage

# Run in watch mode
stx test --watch

# Run with specific config
stx test --config test.config.ts
```

### Test Generation

```bash
# Generate test file
stx generate test MyComponent

# Generate test suite
stx generate suite components

# Generate E2E tests
stx generate e2e login

# Generate API tests
stx generate api-test users
```

## Deployment Commands

### Build & Deploy

```bash
# Build and deploy
stx deploy

# Deploy to specific environment
stx deploy --env production

# Deploy with options
stx deploy \
  --env production \
  --tag v1.0.0 \
  --force

# Preview deployment
stx deploy --dry-run
```

### Environment Management

```bash
# Set environment variables
stx env:set KEY=value

# Get environment variable
stx env:get KEY

# List all variables
stx env:list

# Remove variable
stx env:unset KEY

# Pull environment from remote
stx env:pull

# Push environment to remote
stx env:push
```

## Plugin Commands

### Plugin Management

```bash
# Add plugin
stx plugin:add @stx/auth

# Remove plugin
stx plugin:remove @stx/auth

# List installed plugins
stx plugin:list

# Update plugins
stx plugin:update

# Create plugin
stx plugin:create my-plugin
```

### Plugin Development

```bash
# Initialize plugin
stx plugin:init

# Build plugin
stx plugin:build

# Test plugin
stx plugin:test

# Publish plugin
stx plugin:publish

# Link plugin locally
stx plugin:link
```

## Database Commands

### Database Management

```bash
# Run migrations
stx db:migrate

# Create migration
stx db:make create_users_table

# Rollback migration
stx db:rollback

# Refresh database
stx db:refresh

# Seed database
stx db:seed

# Reset database
stx db:reset
```

### Database Utilities

```bash
# Show migration status
stx db:status

# Run database console
stx db:console

# Dump database
stx db:dump

# Restore database
stx db:restore

# Check database health
stx db:health
```

## Cache Commands

### Cache Management

```bash
# Clear all cache
stx cache:clear

# Clear specific cache
stx cache:clear --tag assets

# Warm up cache
stx cache:warm

# List cache entries
stx cache:list

# Remove cache entry
stx cache:forget key

# Get cache statistics
stx cache:stats
```

## Utility Commands

### Project Utilities

```bash
# Show project info
stx info

# Check dependencies
stx check

# Update dependencies
stx update

# Clean project
stx clean

# Run security audit
stx audit

# Generate documentation
stx docs:generate
```

### Maintenance Commands

```bash
# Enter maintenance mode
stx down

# Exit maintenance mode
stx up

# Show maintenance status
stx status

# Run health checks
stx health

# View logs
stx logs

# Run diagnostics
stx diagnose
```

## Global Options

```bash
# Global command options
stx [command] [options]

Options:
  -h, --help              Show help information
  -v, --version          Show version information
  -q, --quiet            Suppress output
  --debug                Enable debug mode
  --no-color             Disable colored output
  --json                 Output as JSON
  --config <path>        Use custom config file
  --cwd <path>          Set working directory
  --env <name>          Set environment
```

## Configuration Reference

### CLI Configuration

```ts
// stx.config.ts
export default {
  cli: {
    // Command aliases
    aliases: {
      'd': 'dev',
      'b': 'build'
    },
    
    // Default options
    defaults: {
      port: 3000,
      host: 'localhost'
    },
    
    // Command hooks
    hooks: {
      beforeCommand(command) {
        console.log(`Running ${command}`)
      },
      
      afterCommand(command) {
        console.log(`Completed ${command}`)
      }
    },
    
    // Custom commands
    commands: {
      custom: {
        description: 'Custom command',
        run: async () => {
          // Command implementation
        }
      }
    }
  }
}
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Review [Plugin Development](/api/plugins) 