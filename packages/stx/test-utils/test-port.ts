/**
 * A port no other test in the run is using.
 *
 * The convention this replaces was `const PORT = 45_000 + (process.pid % 1000)`,
 * repeated across 27 files with hand-picked bases and moduli. It reads like it
 * spreads tests apart, and it does not: every file in one `bun test` run shares
 * one pid, so each file's port is a FIXED function of that pid and the ranges
 * were chosen independently. Measured over pids 1..2000, **every single pid**
 * produced at least one cross-file collision, and one pair
 * (`serve-on-request-server` + `serve-shared-assets`) collided on all of them.
 *
 * The failure is worse than a bind error, because these harnesses poll
 * `Bun.connect` until something answers and then assert on state the server
 * should have reached by then. A collision means the probe connects to the
 * OTHER test's server, immediately, and the assertion reads a startup that
 * never happened -- which is how `serve-bind-after-warmup` failed under the
 * full suite while passing 17/17 alone.
 *
 * So the kernel picks instead: bind port 0, read what it assigned, release it.
 * There is a window between releasing and the test binding, but the kernel
 * hands out ephemeral ports from a large range and does not immediately reuse
 * one, which is a different order of risk from a scheme that collides on every
 * run.
 */

/** Bind port 0, take the port the kernel assigned, and release it. */
export function freePort(): number {
  const server = Bun.listen({
    hostname: '127.0.0.1',
    port: 0,
    socket: { data() {}, open() {}, close() {}, error() {} },
  })
  const { port } = server
  server.stop(true)
  return port
}
