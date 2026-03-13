import { spawn } from 'bun'

const crosswindBin = '/Users/glennmichaeltorregosa/Documents/Projects/crosswind/packages/crosswind/bin/crosswind'

// Start crosswind watch
const crosswind = spawn([crosswindBin, 'watch', '--config', './crosswind.config.ts'], {
  cwd: import.meta.dir,
  stdout: 'inherit',
  stderr: 'inherit',
})

// Start server
const server = spawn(['bun', 'serve.ts'], {
  cwd: import.meta.dir,
  stdout: 'inherit',
  stderr: 'inherit',
})

// Handle cleanup
process.on('SIGINT', () => {
  crosswind.kill()
  server.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  crosswind.kill()
  server.kill()
  process.exit(0)
})

// Wait for both
await Promise.all([crosswind.exited, server.exited])
