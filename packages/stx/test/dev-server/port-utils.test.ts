import { describe, expect, it } from 'bun:test'
import net from 'node:net'
import { findAvailablePort } from '../../src/dev-server/port-utils'

// =============================================================================
// Regression: findAvailablePort used to do `startPort + i` without coercing
// startPort. When the CLI passed `--port 3456` it arrived as the string
// "3456", so the first iteration produced "3456" + 0 = "34560" (string
// concat). Bun.serve happily bound that, so every requested port appeared
// to roll to port * 10 — and HMR's `port + 1` similarly rolled to
// "345601", which Bun caps at 65535. Verify the coercion holds.
// =============================================================================

async function ephemeralPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port
      srv.close(() => resolve(port))
    })
  })
}

describe('findAvailablePort', () => {
  it('returns the requested port when free', async () => {
    const wanted = await ephemeralPort()
    const got = await findAvailablePort(wanted)
    expect(got).toBe(wanted)
    expect(typeof got).toBe('number')
  })

  it('returns a number even when called with a string (CLI passes strings)', async () => {
    const wanted = await ephemeralPort()
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error — intentionally violating the type to mirror the CLI bug
    const got = await findAvailablePort(String(wanted))
    expect(got).toBe(wanted)
    expect(typeof got).toBe('number')
  })
})
