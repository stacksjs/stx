import { DEFAULT_PORT, findAvailablePort, findAvailablePortInRange, isPortAvailable } from '../../src/dev-server/port-utils.ts'

if (DEFAULT_PORT !== 3000 || [findAvailablePort, findAvailablePortInRange, isPortAvailable].some(value => typeof value !== 'function'))
  throw new Error('Port utility exports were not initialized')

console.log('OK port utilities initialized without requesting sockets')
