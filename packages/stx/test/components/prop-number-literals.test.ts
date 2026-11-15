import { expect, test } from 'bun:test'
import { literalValue } from '../../src/props-declaration'

// The safe reader seam catches grammar/normalization errors without executing
// source. The SSR/generated-element/Chrome cases cover delivery separately.
test.each([
  ['0', 0], ['-0', -0], ['0.', 0], ['.5', 0.5], ['-.5', -0.5],
  ['1.', 1], ['1.e+2', 100], ['1e01', 10], ['0e01', 0],
  ['1_234.5_6e+0_2', 123456], ['-1_000', -1000], ['+ 1_000', 1000],
  ['0xFF_FF', 65535], ['- /* sign */ 0XFF_FF', -65535],
  ['+0b1010_0101', 165], ['0B1_0', 2], ['-0o7_7', -63], ['0O7_0', 56],
] as const)('reads the valid numeric literal %s', (source, expected) => {
  expect(literalValue(source)).toBe(expected)
})

test.each([
  '1__0', '1_', '0_1', '0_0', '00', '01', '08', '01.2',
  '1_.0', '1._0', '.1_', '._1', '1.2__3',
  '1e', '1e+', '1e-', '1e_2', '1e+_2', '1_e2', '1e2_', '1e2__3',
  '0x', '0x_FF', '0xFF_', '0xF__F', '0xFG',
  '0b', '0b2', '0b_1', '0b10__01', '0b1_', '0b1e2',
  '0o', '0o8', '0o_7', '0o7__7', '0o7_',
  '1n', '1_000n', '0xFFn', '0b1n', '0o7n', '+1n', '-1n',
  '--1', '+-1', '-+1', '1 2', '1..', '1.2.3',
])('rejects malformed or unsupported numeric source %s throughout nested literals', (source) => {
  expect(literalValue(source)).toBeUndefined()
  expect(literalValue(`[${source}]`)).toBeUndefined()
  expect(literalValue(`{value:${source}}`)).toBeUndefined()
  expect(literalValue(`{${source}:1}`)).toBeUndefined()
})

test.each(['_1', 'NaN', 'Infinity'])('rejects the identifier %s as a numeric value while allowing it as an object key', (source) => {
  expect(literalValue(source)).toBeUndefined()
  expect(literalValue(`[${source}]`)).toBeUndefined()
  expect(literalValue(`{value:${source}}`)).toBeUndefined()
  expect(literalValue(`{${source}:1}`)).toEqual({ [source]: 1 })
})

test('numeric property keys follow JavaScript property spelling and duplicate-key rules', () => {
  expect(literalValue(`{1e3:'first',0x10:'hex',1_000:'last',0b11:'binary',0o7:'octal',1.:'dot',.5:'half','0x10':'quoted'}`)).toEqual({ 1: 'dot', 3: 'binary', 7: 'octal', 16: 'hex', 1000: 'last', '0.5': 'half', '0x10': 'quoted' })
})

test('numeric-looking expressions remain unexecuted', () => {
  expect(literalValue(`1 + (globalThis.__stxNumberExecuted = true)`)).toBeUndefined()
  expect(literalValue(`({ get value() { globalThis.__stxNumberExecuted = true; return 1_000 } })`)).toBeUndefined()
  expect((globalThis as any).__stxNumberExecuted).toBeUndefined()
})
