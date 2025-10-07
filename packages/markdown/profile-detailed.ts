import { readFileSync } from 'fs'

const large = readFileSync('../benchmarks/fixtures/large.md', 'utf-8')

// Inline the parser here with timing instrumentation
let tokenizeTime = 0
let parseInlineTime = 0
let renderTime = 0
let parseInlineCalls = 0

const start = performance.now()

// Just do a simple count of how many times we'd call parseInline
const lines = large.split('\n')
let headings = 0
let paragraphs = 0
let lists = 0
let blockquotes = 0
let tables = 0

for (const line of lines) {
  if (line.match(/^#{1,6}\s/)) headings++
  if (line.match(/^[*\-+]\s/) || line.match(/^\d+\.\s/)) lists++
  if (line.match(/^>/)) blockquotes++
  if (line.match(/^\|/)) tables++
  if (line.length > 0 && !line.match(/^[#*\-+>\d|`\s]/)) paragraphs++
}

console.log('Document analysis:')
console.log('  Headings:', headings)
console.log('  Paragraphs:', paragraphs)
console.log('  Lists:', lists)
console.log('  Blockquotes:', blockquotes)
console.log('  Tables:', tables)
console.log('  Total inline parsing calls estimate:', headings + paragraphs + lists + blockquotes)

// Count inline markers
const inlineMarkers = {
  bold: (large.match(/\*\*/g) || []).length / 2,
  italic: (large.match(/(?<!\*)\*(?!\*)/g) || []).length / 2,
  code: (large.match(/`/g) || []).length / 2,
  links: (large.match(/\[.*?\]\(.*?\)/g) || []).length
}

console.log('\nInline elements:')
console.log('  Bold:', inlineMarkers.bold)
console.log('  Italic:', inlineMarkers.italic)
console.log('  Inline code:', inlineMarkers.code)
console.log('  Links:', inlineMarkers.links)

const totalCharsToProcess = large.length
console.log('\nTotal characters to process:', totalCharsToProcess)
console.log('Characters per parseInline call:', Math.floor(totalCharsToProcess / (headings + paragraphs + lists + blockquotes)))
