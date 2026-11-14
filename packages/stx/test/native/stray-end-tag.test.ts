/**
 * One `</div>` too many is forgiven by the HTML parser and changes the tree:
 * the elements after it close a tag early, so the rest of a conditional block
 * leaves its `:if`. The native compiler says so.
 */
import { expect, it } from 'bun:test'
import { strayEndTags, translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

it('reports an end tag that closes nothing', async () => {
  const { diagnostics } = await translateHtmlToIR(`
    <div>
      <div :if="tour()">
        <div><p>Page</p></div></div>
        <div><p>Next</p></div>
      </div>
      <div :if="!tour()"><p>Question</p></div>
    </div>`)
  expect(diagnostics.filter(diagnostic => diagnostic.kind === 'stray-end-tag')).toEqual([{ kind: 'stray-end-tag', tag: 'div' }])
})

it('finds nothing in balanced markup, whatever its attributes and scripts hold', () => {
  expect(strayEndTags(`
    <!-- </div> -->
    <div :if="a > b" @click="items.map(item => item.id)" title='1 < 2'>
      <img src="/a.png"><br><input value="</div>">
      <svg viewBox="0 0 2 2"><path d="M0 0" /></svg>
      <ul><li>One<li>Two</ul>
      <script>if (a < b) document.write('</div>')</script>
    </div>`)).toEqual([])
})

it('lets an end tag close the elements left open inside it', () => {
  expect(strayEndTags('<div><p>One<p>Two</div>')).toEqual([])
  expect(strayEndTags('<div></div></div></section>')).toEqual(['div', 'section'])
})
