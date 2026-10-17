import { describe, expect, it } from 'bun:test'
import { extractExports } from '../../src/signal-processing'

const names = (source: string) => extractExports(source).split(',').map(name => name.trim()).filter(Boolean)

describe('setup exports after return-position regex literals', () => {
  it('keeps bundled helpers private when a returned regex contains a closing brace', () => {
    const source = `var bundle = (function() {
function matches(value) {
  return /}/.test(value);
}
function privateHelper() { return 1; }
return { matches };
})();
var shown = bundle.matches;
`
    expect(names(source)).toEqual(['bundle', 'shown'])
    const scope = new Function(`${source}return { ${extractExports(source)} };`)()
    expect(scope.shown('}')).toBe(true)
    expect(scope.shown('x')).toBe(false)
  })

  it('keeps the public binding after the URL predicate used by native workout helpers', () => {
    expect(names(`var bundle = (function() {
function offlineVideo(address) {
  try {
    return /^https?:$/.test(address.protocol) && address.pathname.startsWith('/api/exercise-videos/') ? address.url : null;
  } catch { return null; }
}
return { offlineVideo };
})();
var shown = bundle.offlineVideo;
`)).toEqual(['bundle', 'shown'])
  })

  it('retains division and interpolated expressions without exporting their nested declarations', () => {
    expect(names([
      'const ratio = 12 / 3',
      'const label = `${(() => { const hidden = ratio; return hidden })()}`',
      'const { shown, original: renamed } = source',
      'const [first, ...rest] = values',
      'function visible() { return /[{}]/.test(label) }',
    ].join('\n'))).toEqual(['ratio', 'label', 'shown', 'renamed', 'first', 'rest', 'visible'])
  })
})
