/**
 * Port Utilities Module
 * Provides functions for checking port availability and finding free ports
 */

import net from 'node:net'

/**
 * Check if a port is available on IPv4
 */
async function isPortAvailableIPv4(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '0.0.0.0')
  })
}

/**
 * Check if a port is available on IPv6
 */
async function isPortAvailableIPv6(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '::')
  })
}

/**
 * Check if a port is available by attempting to bind to it
 * Checks both IPv4 and IPv6
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  // Check IPv4
  const ipv4Available = await isPortAvailableIPv4(port)

  if (!ipv4Available) {
    return false
  }

  // Check IPv6
  const ipv6Available = await isPortAvailableIPv6(port)

  return ipv6Available
}

/**
 * Find an available port starting from the given port
 * @param startPort - The port to start searching from
 * @param maxAttempts - Maximum number of ports to try (default: 20)
 * @throws Error if no available port is found within maxAttempts
 */
export async function findAvailablePort(startPort: number, maxAttempts = 20): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await isPortAvailable(port)
    if (available) {
      return port
    }
  }
  throw new Error(`Could not find an available port between ${startPort} and ${startPort + maxAttempts - 1}`)
}

/**
 * Default port for the dev server
 */
export const DEFAULT_PORT = 3000

/**
 * Port range configuration
 */
export interface PortRange {
  start: number
  end: number
}

/**
 * Find an available port within a specific range
 */
export async function findAvailablePortInRange(range: PortRange): Promise<number> {
  const maxAttempts = range.end - range.start + 1
  return findAvailablePort(range.start, maxAttempts)
}
