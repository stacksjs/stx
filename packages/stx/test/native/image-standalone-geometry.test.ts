import { expect, it } from 'bun:test'
import { join } from 'node:path'

it.skipIf(process.platform !== 'darwin')('runs the standalone Swift image frame algorithm for intrinsic size, upscaling and crop positions', async () => {
  const path = join(import.meta.dir, '../../src/native/renderers/ios.swift')
  const renderer = await Bun.file(path).text()
  const start = renderer.indexOf('private func stxImageFrame(')
  expect(start).toBeGreaterThan(0)
  const end = renderer.indexOf('\n}\n', start) + 2
  expect(end).toBeGreaterThan(start)
  const algorithm = renderer.slice(start, end)
  const assertions = `
import CoreGraphics
${algorithm}
func check(_ mode: String, _ source: CGSize, _ point: CGPoint, _ expected: CGRect) {
  let actual = stxImageFrame(box: CGSize(width: 100, height: 80), intrinsic: source, fit: mode, alignment: point)
  precondition(actual == expected, "\\(mode): \\(actual) != \\(expected)")
}
let small = CGSize(width: 20, height: 10), large = CGSize(width: 200, height: 100)
let center = CGPoint(x: 0.5, y: 0.5), corner = CGPoint(x: 1, y: 1)
check("scale-down", small, corner, CGRect(x: 80, y: 70, width: 20, height: 10))
check("scale-down", large, center, CGRect(x: 0, y: 15, width: 100, height: 50))
check("contain", small, center, CGRect(x: 0, y: 15, width: 100, height: 50))
check("cover", large, corner, CGRect(x: -60, y: 0, width: 160, height: 80))
check("none", large, CGPoint(x: 0.25, y: 0.75), CGRect(x: -25, y: -15, width: 200, height: 100))
check("fill", small, corner, CGRect(x: 0, y: 0, width: 100, height: 80))
check("scale-down", .zero, corner, .zero)
`
  const result = Bun.spawnSync(['xcrun', 'swift', '-'], { stdin: Buffer.from(assertions), stdout: 'pipe', stderr: 'pipe' })
  expect(result.stderr.toString()).toBe('')
  expect(result.exitCode).toBe(0)
  const parsed = Bun.spawnSync(['xcrun', 'swiftc', '-frontend', '-parse', path], { stdout: 'pipe', stderr: 'pipe' })
  expect(parsed.stderr.toString()).toBe('')
  expect(parsed.exitCode).toBe(0)
}, 30_000)
