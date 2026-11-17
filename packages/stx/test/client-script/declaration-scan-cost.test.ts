import { expect, spyOn, test } from 'bun:test'
import { topLevelDeclaredNames } from '../../src/client-parameter-bindings'

test('module declaration discovery scans a large bundle without rescanning each prefix', () => {
  const names = Array.from({ length: 1000 }, (_, index) => `declarationScanFixture${index}`)
  const source = names.map(name => `const ${name} = 1;`).join('\n')
  const original = String.prototype.matchAll
  let scannedCharacters = 0
  const scanner = spyOn(String.prototype, 'matchAll').mockImplementation(function (this: string, expression: RegExp) {
    scannedCharacters += this.length
    return original.call(this, expression)
  })
  try {
    expect(topLevelDeclaredNames(source)).toEqual([...names].sort())
    // Bound the actual scanning work, independent of CPU speed or host load.
    expect(scannedCharacters).toBeLessThanOrEqual(source.length * 5)
  }
  finally { scanner.mockRestore() }
})
