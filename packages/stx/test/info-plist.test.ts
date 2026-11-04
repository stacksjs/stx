import { expect, it } from 'bun:test'
import { renderInfoPlist, type PlistValue } from '../src/info-plist'

it('renders nested Services declarations as typed XML, escaping text and keys', () => {
  const xml = renderInfoPlist({ NSServices: [{ NSMenuItem: { default: 'Search & <Translate> 日本語' }, NSMessage: 'searchWithMyApp', NSSendTypes: ['public.utf8-plain-text'] }], 'a&<key>': '"quoted" & text' })
  expect(xml).toContain(`<key>NSServices</key>
    <array>
        <dict>
            <key>NSMenuItem</key>
            <dict>
                <key>default</key>
                <string>Search &amp; &lt;Translate&gt; 日本語</string>
            </dict>
            <key>NSMessage</key>
            <string>searchWithMyApp</string>
            <key>NSSendTypes</key>
            <array>
                <string>public.utf8-plain-text</string>
            </array>
        </dict>
    </array>`)
  expect(xml).toContain('<key>a&amp;&lt;key&gt;</key>')
  expect(xml).toContain('<string>"quoted" &amp; text</string>')
  expect(xml).not.toContain('[object Object]')
})

it('preserves scalar types, mixed arrays, empty containers and readonly configuration', () => {
  const value = { integer: 7, negative: -2, real: 2.5, tiny: 1e-7, large: 1e21, yes: true, no: false, emptyArray: [], emptyObject: {}, mixed: ['x', 3, false, { nested: ['y'] }] } as const satisfies Record<string, PlistValue>
  const xml = renderInfoPlist(value)
  for (const item of ['<integer>7</integer>', '<integer>-2</integer>', '<real>2.5</real>', '<real>1e-7</real>', '<real>1e+21</real>', '<true/>', '<false/>', '<array/>', '<dict/>']) expect(xml).toContain(item)
  expect(xml).toContain('<string>y</string>')
})

it('allows shared dictionaries but rejects cycles and unsupported values', () => {
  const shared = { title: 'shared' }
  expect(renderInfoPlist({ first: shared, second: shared }).match(/<string>shared<\/string>/g)).toHaveLength(2)
  const cyclic: Record<string, PlistValue> = {}
  cyclic.self = cyclic
  expect(() => renderInfoPlist(cyclic)).toThrow('Cyclic Info.plist value at infoPlist.self')
  for (const value of [null, undefined, new Date(), new Map(), () => 1])
    expect(() => renderInfoPlist({ nested: [value as unknown as PlistValue] })).toThrow('Unsupported Info.plist value at infoPlist.nested[0]')
  for (const value of [NaN, Infinity, -Infinity]) expect(() => renderInfoPlist({ value })).toThrow('Non-finite Info.plist number')
})
