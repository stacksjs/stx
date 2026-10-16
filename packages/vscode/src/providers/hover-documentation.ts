export interface JavaScriptOperatorHover {
  syntax: string
  description: string
}

export interface GlobalObjectHover {
  type: string
  description: string
}

export const JAVASCRIPT_OPERATOR_HOVERS: Readonly<Record<string, JavaScriptOperatorHover>> = {
  typeof: {
    syntax: 'typeof operand',
    description: '**JavaScript Operator**\n\nReturns a string indicating the type of the operand.\n\n**Possible return values:**\n- `"string"` - for string values\n- `"number"` - for number values\n- `"boolean"` - for boolean values\n- `"object"` - for objects and null\n- `"function"` - for functions\n- `"undefined"` - for undefined\n- `"symbol"` - for symbols\n- `"bigint"` - for BigInt values',
  },
  instanceof: {
    syntax: 'object instanceof Constructor',
    description: '**JavaScript Operator**\n\nTests whether an object has in its prototype chain the prototype property of a constructor. Returns `true` or `false`.',
  },
  delete: {
    syntax: 'delete object.property',
    description: '**JavaScript Operator**\n\nRemoves a property from an object. Returns `true` if successful.',
  },
  in: {
    syntax: '"property" in object',
    description: '**JavaScript Operator**\n\nReturns `true` if the specified property is in the specified object or its prototype chain.',
  },
  of: {
    syntax: 'for (const item of iterable)',
    description: '**JavaScript Keyword**\n\nUsed in `for...of` loops to iterate over iterable objects (Arrays, Strings, Maps, Sets, etc.).',
  },
}

export const GLOBAL_OBJECT_HOVERS: Readonly<Record<string, GlobalObjectHover>> = {
  window: { type: 'Window & typeof globalThis', description: 'The global window object represents the browser window. Provides access to the DOM, browser APIs, and global variables.' },
  document: { type: 'Document', description: 'The Document interface represents the web page loaded in the browser. Entry point to the DOM tree.' },
  console: { type: 'Console', description: 'Provides access to the browser\'s debugging console with methods like `log()`, `error()`, `warn()`, etc.' },
  navigator: { type: 'Navigator', description: 'Represents the state and identity of the user agent (browser). Provides information about the browser and device.' },
  location: { type: 'Location', description: 'Represents the URL of the current document and provides methods to manipulate the browser\'s location.' },
  localStorage: { type: 'Storage', description: 'Provides access to the browser\'s local storage. Data persists even after the browser is closed.' },
  sessionStorage: { type: 'Storage', description: 'Provides access to the browser\'s session storage. Data is cleared when the page session ends.' },
  history: { type: 'History', description: 'Provides an interface for manipulating the browser session history (pages visited in the tab/frame).' },
  Math: { type: 'Math', description: 'Built-in object with properties and methods for mathematical constants and functions.' },
  JSON: { type: 'JSON', description: 'Provides methods for parsing JSON and converting values to JSON: `parse()` and `stringify()`.' },
  globalThis: { type: 'typeof globalThis', description: 'Provides a standard way to access the global object across different JavaScript environments.' },
}

export const HTML_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'img', 'button', 'input', 'form',
  'label', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'select', 'option', 'textarea', 'header',
  'footer', 'nav', 'main', 'body', 'section', 'article', 'aside', 'code', 'pre', 'hr', 'br',
])

const HTML_TAG_DESCRIPTIONS: Readonly<Record<string, string>> = {
  body: 'Main content of the HTML document. Contains all content that is visible to the user.',
  div: 'Generic container element for flow content with no semantic meaning.',
  span: 'Generic inline container with no semantic meaning. Used for styling or grouping text.',
  p: 'Paragraph element representing a block of text.',
  strong: 'Indicates strong importance. Text is typically displayed in bold.',
  em: 'Marks text that has stress emphasis. Text is typically displayed in italic.',
  a: 'Anchor element for creating hyperlinks to other pages, files, or locations.',
  img: 'Embeds an image into the document. Self-closing tag requiring src attribute.',
  button: 'Clickable button element for forms or interactive elements.',
  input: 'Form input element for user data entry. Requires type attribute.',
  form: 'Container for a form with inputs and controls for user submission.',
  ul: 'Unordered list container. Contains li elements.',
  ol: 'Ordered (numbered) list container. Contains li elements.',
  li: 'List item element. Used within ul or ol containers.',
  table: 'Container for tabular data with rows and columns.',
  pre: 'Preformatted text element. Preserves whitespace and line breaks.',
  code: 'Represents computer code within a document.',
  label: 'Label for a form element. Improves accessibility and usability.',
}

export function htmlTagDescription(tag: string): string {
  if (/^h[1-6]$/.test(tag))
    return `Level ${tag.slice(1)} heading element. H1 is most important, H6 is least important.`

  return HTML_TAG_DESCRIPTIONS[tag] ?? `HTML ${tag} element`
}
