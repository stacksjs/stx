import { skipLeadingHtmlTrivia } from '../../src/html-masking.ts'

const cases = [
  ['', ''],
  ['<span>root</span>', ''],
  [' \r\n\t<span>root</span>', ' \r\n\t'],
  ['\uFEFF\u00A0<span>root</span>', '\uFEFF\u00A0'],
  ['<!-- first --><span>root</span>', '<!-- first -->'],
  ['<!-- first --> \n<!-- second -->\t<div>root</div>', '<!-- first --> \n<!-- second -->\t'],
  ['\x00STX_HTML_COMMENT_42\x00<span>root</span>', '\x00STX_HTML_COMMENT_42\x00'],
  [' <!-- first -->\n\x00STX_HTML_COMMENT_007\x00 \n<span>root</span>', ' <!-- first -->\n\x00STX_HTML_COMMENT_007\x00 \n'],
  [' <!-- unfinished <span>root</span>', ' '],
  [' \x00STX_HTML_COMMENT_nope\x00<span>root</span>', ' '],
  [' \x00STX_HTML_COMMENT_1<span>root</span>', ' '],
  ['<!-- first -->text <!-- second --><span>root</span>', '<!-- first -->'],
  ['<!-- first -->text --><span>root</span>', '<!-- first -->'],
  ['<!-- <span>not a root</span> --><span>root</span>', '<!-- <span>not a root</span> -->'],
  ['<!-- first -->\n', '<!-- first -->\n'],
  [' \x00STX_HTML_COMMENT_0\x00', ' \x00STX_HTML_COMMENT_0\x00'],
]

for (const [html, prefix] of cases) {
  const end = skipLeadingHtmlTrivia(html)
  if (end !== prefix.length || html.slice(0, end) !== prefix)
    throw new Error(`Wrong leading trivia at ${JSON.stringify(html)}: ${end}`)
}

const prefix = '<!-- one --> \x00STX_HTML_COMMENT_123\x00\n'.repeat(10000)
if (skipLeadingHtmlTrivia(`${prefix}<span>root</span>`) !== prefix.length)
  throw new Error('Lost a root after many real and masked comments')

console.log(`OK ${cases.length} HTML trivia cases and 20000 consecutive comments`)
