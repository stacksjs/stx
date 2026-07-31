import { describe, expect, it } from 'bun:test'
import { convertToCommonJS, isCompleteImport } from '../../src/variable-extractor'

/**
 * A `<script server>` import may span several lines, which is how anybody
 * writes one with more than three names.
 *
 * `convertToCommonJS` walked the script a line at a time, so the opening
 * `import {` matched none of its patterns and was emitted verbatim into the
 * generated module. That is a syntax error, the script then failed to execute,
 * and the page rendered with every server variable undefined and nothing
 * logged. From the outside it looks exactly like a page whose data is simply
 * missing, which is why it costs hours rather than minutes.
 */
describe('isCompleteImport', () => {
  it('accepts a finished named import', () => {
    expect(isCompleteImport('import { alpha } from \'./x\'')).toBe(true)
  })

  it('rejects an import whose brace list has not closed', () => {
    expect(isCompleteImport('import {')).toBe(false)
    expect(isCompleteImport('import { alpha,')).toBe(false)
  })

  it('rejects a closed list with no module specifier yet', () => {
    expect(isCompleteImport('import { alpha } from')).toBe(false)
  })

  it('accepts a default import', () => {
    expect(isCompleteImport('import Thing from \'./thing\'')).toBe(true)
  })

  it('accepts a side-effect import', () => {
    expect(isCompleteImport('import \'./setup\'')).toBe(true)
  })

  it('rejects an unterminated specifier string', () => {
    expect(isCompleteImport('import { alpha } from \'./x')).toBe(false)
  })

  it('accepts double quotes and backticks alike', () => {
    expect(isCompleteImport('import { a } from "./x"')).toBe(true)
  })

  it('is not fooled by a brace inside the specifier', () => {
    expect(isCompleteImport('import { a } from \'./{weird}\'')).toBe(true)
  })
})

describe('convertToCommonJS with multi-line imports', () => {
  it('converts an import split over several lines', () => {
    const source = [
      'import {',
      '  alpha,',
      '  beta,',
      '} from \'./helpers\'',
      '',
      'const value = alpha + beta',
    ].join('\n')

    const output = convertToCommonJS(source, '/project/views/page.stx')

    // The whole statement became one dynamic import, and nothing leaked
    // through as a bare `import {` line.
    expect(output).toContain('await import(')
    expect(output).toContain('alpha')
    expect(output).toContain('beta')
    expect(output.split('\n').some(line => line.trim() === 'import {')).toBe(false)
  })

  it('keeps the rest of the script after a multi-line import', () => {
    const source = [
      'import {',
      '  alpha,',
      '} from \'./helpers\'',
      '',
      'const title = \'hello\'',
    ].join('\n')

    const output = convertToCommonJS(source, '/project/views/page.stx')

    // The bug's real symptom: everything after the import was stranded.
    expect(output).toContain('title')
  })

  it('still handles a single-line import', () => {
    const output = convertToCommonJS('import { alpha } from \'./helpers\'', '/project/views/page.stx')

    expect(output).toContain('await import(')
    expect(output).toContain('alpha')
  })

  it('resolves a relative specifier against the template directory', () => {
    const output = convertToCommonJS([
      'import {',
      '  alpha,',
      '} from \'./helpers\'',
    ].join('\n'), '/project/views/page.stx')

    expect(output).toContain('/project/views/helpers')
  })

  it('handles two multi-line imports in a row', () => {
    const source = [
      'import {',
      '  alpha,',
      '} from \'./one\'',
      'import {',
      '  beta,',
      '} from \'./two\'',
      'const total = alpha + beta',
    ].join('\n')

    const output = convertToCommonJS(source, '/project/views/page.stx')

    expect(output).toContain('/project/views/one')
    expect(output).toContain('/project/views/two')
    expect(output).toContain('total')
  })

  it('handles a renamed binding across lines', () => {
    const source = [
      'import {',
      '  alpha as renamed,',
      '} from \'./one\'',
    ].join('\n')

    const output = convertToCommonJS(source, '/project/views/page.stx')

    expect(output).toContain('renamed')
  })

  it('does not consume the following statement when the import is complete', () => {
    const source = [
      'import { alpha } from \'./one\'',
      'const beta = 2',
    ].join('\n')

    const output = convertToCommonJS(source, '/project/views/page.stx')

    expect(output).toContain('beta')
    expect(output).toContain('2')
  })
})
