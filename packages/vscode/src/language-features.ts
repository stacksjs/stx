export interface StxDirectiveDefinition {
  name: string
  description: string
  snippet?: string
}

export interface StxAttributeDirectiveDefinition extends StxDirectiveDefinition {
  snippet: string
}

/** Shared statement-directive inventory for editor features. */
export const STX_DIRECTIVES: readonly StxDirectiveDefinition[] = [
  { name: 'transition', description: 'Applies transition animations to an element' },
  { name: 'motion', description: 'Controls animation display based on user preferences' },
  { name: 'animationGroup', description: 'Groups elements for coordinated animations' },
  { name: 'scrollAnimate', description: 'Triggers animation when element scrolls into view' },
  { name: 'translate', description: 'Translate a string using the i18n system' },
  { name: 't', description: 'Short alias for translate directive' },
  { name: 'if', description: 'Conditional rendering' },
  { name: 'else', description: 'Alternative rendering for conditionals' },
  { name: 'elseif', description: 'Alternative condition for if statement' },
  { name: 'unless', description: 'Inverse conditional rendering' },
  { name: 'foreach', description: 'Iterates over an array or collection' },
  { name: 'for', description: 'Standard for loop' },
  { name: 'while', description: 'While loop' },
  { name: 'forelse', description: 'Loop with fallback when collection is empty' },
  { name: 'switch', description: 'Switch statement for multiple conditions' },
  { name: 'case', description: 'Case option in switch statement' },
  { name: 'default', description: 'Default case in switch statement' },
  { name: 'break', description: 'Break from loop or switch' },
  { name: 'continue', description: 'Continue to next iteration' },
  { name: 'component', description: 'Renders a component' },
  { name: 'slot', description: 'Define a named slot in a component' },
  { name: 'webcomponent', description: 'Include a web component' },
  { name: 'ts', description: 'TypeScript code block' },
  { name: 'js', description: 'JavaScript code block' },
  { name: 'script', description: 'Script code block (alternative to @ts)' },
  { name: 'css', description: 'CSS code block' },
  { name: 'json', description: 'Output variable as JSON' },
  { name: 'markdown', description: 'Markdown content block' },
  { name: 'raw', description: 'Display content without processing expressions' },
  { name: 'verbatim', description: 'Display content without processing directives' },
  { name: 'extends', description: 'Extend a base layout' },
  { name: 'section', description: 'Define a content section' },
  { name: 'yield', description: 'Output the contents of a section' },
  { name: 'parent', description: 'Include parent section content' },
  { name: 'stack', description: 'Define a stack for pushing content' },
  { name: 'push', description: 'Push content to a stack' },
  { name: 'pushIf', description: 'Conditionally push content to a stack' },
  { name: 'pushOnce', description: 'Push content to a stack only once' },
  { name: 'prepend', description: 'Prepend content to a stack' },
  { name: 'prependOnce', description: 'Prepend content to a stack only once' },
  { name: 'include', description: 'Include another template file' },
  { name: 'includeIf', description: 'Conditionally include a template' },
  { name: 'includeWhen', description: 'Include template when condition is true' },
  { name: 'includeUnless', description: 'Include template unless condition is true' },
  { name: 'includeFirst', description: 'Include the first existing template from a list' },
  { name: 'auth', description: 'Content visible only to authenticated users' },
  { name: 'guest', description: 'Content visible only to guests' },
  { name: 'can', description: 'Check if user has permission' },
  { name: 'cannot', description: 'Check if user lacks permission' },
  { name: 'env', description: 'Check environment condition' },
  { name: 'isset', description: 'Check if a variable is set' },
  { name: 'empty', description: 'Check if a variable is empty' },
  { name: 'error', description: 'Display validation error for a field' },
  { name: 'hasSection', description: 'Check if a section exists' },
  { name: 'once', description: 'Include content only once per rendering cycle' },
  { name: 'use', description: 'Import a class or namespace' },
  { name: 'csrf', description: 'Include CSRF protection token' },
  { name: 'method', description: 'Specify form submission method' },
  { name: 'locale', description: 'Set locale for content' },
  { name: 'errorBoundary', description: 'Catch rendering errors and show fallback content', snippet: '@errorBoundary\n\t${1}\n@fallback\n\t${2}\n@enderrorBoundary' },
  { name: 'fallback', description: 'Define fallback content for an error, suspense, or stream boundary' },
  { name: 'suspense', description: 'Coordinate async rendering with fallback content', snippet: '@suspense\n\t${1}\n@fallback\n\t${2}\n@endsuspense' },
  { name: 'async', description: 'Load and render a component asynchronously', snippet: "@async(component: '${1:Component}', timeout: ${2:5000})\n\t${3}\n@endasync" },
  { name: 'defer', description: 'Defer rendering until a browser trigger fires', snippet: "@defer(on: '${1:visible}')\n\t${2}\n@enddefer" },
  { name: 'teleport', description: 'Render content into another DOM container', snippet: "@teleport('${1:#modals}')\n\t${2}\n@endteleport" },
  { name: 'keepAlive', description: 'Preserve component state while it is inactive', snippet: '@keepAlive\n\t${1}\n@endkeepAlive' },
  { name: 'virtualList', description: 'Efficiently render a large scrolling list', snippet: '@virtualList(${1:items}, { itemHeight: ${2:50}, containerHeight: ${3:400} })\n\t${4}\n@endvirtualList' },
  { name: 'virtualGrid', description: 'Efficiently render a large scrolling grid', snippet: '@virtualGrid(${1:items}, { columns: ${2:4}, rowHeight: ${3:200}, containerHeight: ${4:600} })\n\t${5}\n@endvirtualGrid' },
  { name: 'infiniteList', description: 'Render a virtual list that loads additional items', snippet: '@infiniteList(${1:items}, { itemHeight: ${2:50} })\n\t${3}\n@loading\n\t${4}\n@endinfiniteList' },
  { name: 'loading', description: 'Define loading content for an infinite list' },
  { name: 'stream', description: 'Stream a server-rendered boundary independently', snippet: "@stream('${1:content}')\n\t${2}\n@fallback\n\t${3}\n@endstream" },
  { name: 'memo', description: 'Skip subtree updates while dependencies are unchanged', snippet: '@memo([${1:dependencies}])\n\t${2}\n@endmemo' },
  { name: 'client:load', description: 'Hydrate an island immediately on page load', snippet: '@client:load\n\t${1}\n@endclient' },
  { name: 'client:idle', description: 'Hydrate an island when the browser is idle', snippet: '@client:idle\n\t${1}\n@endclient' },
  { name: 'client:visible', description: 'Hydrate an island when it enters the viewport', snippet: '@client:visible\n\t${1}\n@endclient' },
  { name: 'client:media', description: 'Hydrate an island when a media query matches', snippet: "@client:media(media: '${1:(min-width: 768px)}')\n\t${2}\n@endclient" },
  { name: 'client:only', description: 'Render an island only in the browser', snippet: '@client:only\n\t${1}\n@endclient' },
  { name: 'client:hover', description: 'Hydrate an island on its first hover or focus', snippet: '@client:hover\n\t${1}\n@endclient' },
  { name: 'client:event', description: 'Hydrate an island when a custom event fires', snippet: "@client:event(event: '${1:event-name}')\n\t${2}\n@endclient" },
  { name: 'static', description: 'Render content without a hydration wrapper', snippet: '@static\n\t${1}\n@endstatic' },
  { name: 'computed', description: 'Declare a computed template value', snippet: '@computed(${1:name}, ${2:expression})' },
  { name: 'watch', description: 'Watch a value and run a handler when it changes', snippet: '@watch(${1:source})\n\t${2}\n@endwatch' },
  { name: 'errors', description: 'Render all validation errors for a field', snippet: '@errors(${1:form.field})\n\t${2}\n@enderrors' },
  { name: 'hasErrors', description: 'Conditionally render when a field has validation errors', snippet: '@hasErrors(${1:form.field})\n\t${2}\n@endhasErrors' },
  { name: 'head', description: 'Add markup to the document head', snippet: '@head\n\t${1}\n@endhead' },
  { name: 'title', description: 'Set the document title', snippet: "@title('${1:Page title}')" },
  { name: 'meta', description: 'Add a metadata tag', snippet: "@meta('${1:description}', '${2:content}')" },
  { name: 'metaTag', description: 'Add a metadata tag with full attribute control', snippet: "@metaTag({ name: '${1:description}', content: '${2:content}' })" },
  { name: 'seo', description: 'Generate title, meta, Open Graph, and Twitter tags', snippet: '@seo({ title: ${1:title}, description: ${2:description} })' },
  { name: 'structuredData', description: 'Emit JSON-LD structured data', snippet: '@structuredData(${1:schema})' },
  { name: 'csp', description: 'Emit a Content Security Policy meta tag', snippet: '@csp' },
  { name: 'cspNonce', description: 'Output the current Content Security Policy nonce', snippet: '@cspNonce' },
  { name: 'endtransition', description: 'Ends a transition block' },
  { name: 'endmotion', description: 'Ends a motion block' },
  { name: 'endscrollAnimate', description: 'Ends a scroll animation block' },
  { name: 'endif', description: 'Ends an if block' },
  { name: 'endunless', description: 'Ends an unless block' },
  { name: 'endfor', description: 'Ends a for loop block' },
  { name: 'endforeach', description: 'Ends a foreach loop block' },
  { name: 'endforelse', description: 'Ends a forelse block' },
  { name: 'endwhile', description: 'Ends a while block' },
  { name: 'endswitch', description: 'Ends a switch block' },
  { name: 'endts', description: 'Ends a TypeScript code block' },
  { name: 'endjs', description: 'Ends a JavaScript code block' },
  { name: 'endscript', description: 'Ends a script block' },
  { name: 'endcss', description: 'Ends a CSS block' },
  { name: 'endmarkdown', description: 'Ends a markdown block' },
  { name: 'endraw', description: 'Ends a raw content block' },
  { name: 'endverbatim', description: 'Ends a verbatim block' },
  { name: 'endcomponent', description: 'Ends a component block' },
  { name: 'endslot', description: 'Ends a slot block' },
  { name: 'endsection', description: 'Ends a section block' },
  { name: 'endpush', description: 'Ends a push block' },
  { name: 'endpushIf', description: 'Ends a pushIf block' },
  { name: 'endpushOnce', description: 'Ends a pushOnce block' },
  { name: 'endprepend', description: 'Ends a prepend block' },
  { name: 'endprependOnce', description: 'Ends a prependOnce block' },
  { name: 'endauth', description: 'Ends an auth block' },
  { name: 'endguest', description: 'Ends a guest block' },
  { name: 'endcan', description: 'Ends a can block' },
  { name: 'endcannot', description: 'Ends a cannot block' },
  { name: 'endempty', description: 'Ends an empty block' },
  { name: 'endenv', description: 'Ends an env block' },
  { name: 'endisset', description: 'Ends an isset block' },
  { name: 'enderror', description: 'Ends an error block' },
  { name: 'endonce', description: 'Ends a once block' },
  { name: 'endwebcomponent', description: 'Ends a webcomponent block' },
  { name: 'enderrorBoundary', description: 'Ends an error boundary' },
  { name: 'endsuspense', description: 'Ends a suspense boundary' },
  { name: 'endasync', description: 'Ends an async component block' },
  { name: 'enddefer', description: 'Ends a deferred block' },
  { name: 'endteleport', description: 'Ends a teleported block' },
  { name: 'endkeepAlive', description: 'Ends a keep-alive block' },
  { name: 'endvirtualList', description: 'Ends a virtual list' },
  { name: 'endvirtualGrid', description: 'Ends a virtual grid' },
  { name: 'endinfiniteList', description: 'Ends an infinite list' },
  { name: 'endstream', description: 'Ends a streamed boundary' },
  { name: 'endmemo', description: 'Ends a memoized block' },
  { name: 'endclient', description: 'Ends a partially hydrated island' },
  { name: 'endstatic', description: 'Ends a static block' },
  { name: 'endwatch', description: 'Ends a watch block' },
  { name: 'enderrors', description: 'Ends a validation errors block' },
  { name: 'endhasErrors', description: 'Ends a validation condition' },
  { name: 'endhead', description: 'Ends a document head block' },
]

export const STX_DIRECTIVE_PAIRS: Readonly<Record<string, string>> = {
  if: 'endif',
  unless: 'endunless',
  for: 'endfor',
  foreach: 'endforeach',
  forelse: 'endforelse',
  while: 'endwhile',
  switch: 'endswitch',
  ts: 'endts',
  js: 'endjs',
  script: 'endscript',
  css: 'endcss',
  markdown: 'endmarkdown',
  raw: 'endraw',
  verbatim: 'endverbatim',
  component: 'endcomponent',
  slot: 'endslot',
  webcomponent: 'endwebcomponent',
  section: 'endsection',
  push: 'endpush',
  pushIf: 'endpushIf',
  pushOnce: 'endpushOnce',
  prepend: 'endprepend',
  prependOnce: 'endprependOnce',
  auth: 'endauth',
  guest: 'endguest',
  can: 'endcan',
  cannot: 'endcannot',
  env: 'endenv',
  isset: 'endisset',
  empty: 'endempty',
  error: 'enderror',
  once: 'endonce',
  transition: 'endtransition',
  motion: 'endmotion',
  scrollAnimate: 'endscrollAnimate',
  errorBoundary: 'enderrorBoundary',
  suspense: 'endsuspense',
  async: 'endasync',
  defer: 'enddefer',
  teleport: 'endteleport',
  keepAlive: 'endkeepAlive',
  virtualList: 'endvirtualList',
  virtualGrid: 'endvirtualGrid',
  infiniteList: 'endinfiniteList',
  stream: 'endstream',
  memo: 'endmemo',
  static: 'endstatic',
  watch: 'endwatch',
  errors: 'enderrors',
  hasErrors: 'endhasErrors',
  head: 'endhead',
}

export const STX_OPENING_DIRECTIVE_BY_CLOSE = new Map(
  Object.entries(STX_DIRECTIVE_PAIRS).map(([opening, closing]) => [closing, opening]),
)

/** Reactive attributes supported by the browser runtime. */
export const STX_ATTRIBUTE_DIRECTIVES: readonly StxAttributeDirectiveDefinition[] = [
  { name: ':if', description: 'Conditionally render this element', snippet: ':if="${1:condition}"' },
  { name: ':else-if', description: 'Render when the preceding condition is false and this condition is true', snippet: ':else-if="${1:condition}"' },
  { name: ':else', description: 'Render when the preceding conditions are false', snippet: ':else' },
  { name: ':for', description: 'Render this element for every item in a reactive collection', snippet: ':for="${1:item} in ${2:items}"' },
  { name: ':show', description: 'Toggle this element without removing it from the DOM', snippet: ':show="${1:condition}"' },
  { name: ':key', description: 'Provide a stable identity for a rendered item', snippet: ':key="${1:item.id}"' },
  { name: 'v-if', description: 'Vue-compatible alias for :if', snippet: 'v-if="${1:condition}"' },
  { name: 'v-else-if', description: 'Vue-compatible alias for :else-if', snippet: 'v-else-if="${1:condition}"' },
  { name: 'v-else', description: 'Vue-compatible alias for :else', snippet: 'v-else' },
  { name: 'v-memo', description: 'Skip subtree updates while dependencies are unchanged', snippet: 'v-memo="[${1:dependencies}]"' },
  { name: 'x-if', description: 'Alpine-compatible alias for :if', snippet: 'x-if="${1:condition}"' },
  { name: 'x-else-if', description: 'Alpine-compatible alias for :else-if', snippet: 'x-else-if="${1:condition}"' },
  { name: 'x-else', description: 'Alpine-compatible alias for :else', snippet: 'x-else' },
  { name: 'x-for', description: 'Alpine-compatible alias for :for', snippet: 'x-for="${1:item} in ${2:items}"' },
  { name: 'x-show', description: 'Alpine-compatible alias for :show', snippet: 'x-show="${1:condition}"' },
  { name: 'x-text', description: 'Set text content from a reactive expression', snippet: 'x-text="${1:expression}"' },
  { name: 'x-html', description: 'Set HTML content from a reactive expression', snippet: 'x-html="${1:expression}"' },
  { name: 'x-model', description: 'Two-way bind a form control to reactive state', snippet: 'x-model="${1:value}"' },
  { name: 'x-class', description: 'Bind classes from a reactive expression', snippet: 'x-class="${1:classes}"' },
  { name: 'x-style', description: 'Bind inline styles from a reactive expression', snippet: 'x-style="${1:styles}"' },
  { name: 'x-href', description: 'Bind an anchor destination', snippet: 'x-href="${1:url}"' },
  { name: 'x-src', description: 'Bind an image or media source', snippet: 'x-src="${1:url}"' },
  { name: 'x-bind:', description: 'Bind any HTML attribute', snippet: 'x-bind:${1:attribute}="${2:expression}"' },
  { name: 'x-ref', description: 'Register a named element reference', snippet: 'x-ref="${1:name}"' },
  { name: 'x-cloak', description: 'Hide an element until its reactive scope is ready', snippet: 'x-cloak' },
  { name: '@click', description: 'Run an expression when the element is clicked', snippet: '@click="${1:handler}"' },
  { name: '@submit', description: 'Run an expression when the form is submitted', snippet: '@submit.prevent="${1:handler}"' },
  { name: '@input', description: 'Run an expression when input is received', snippet: '@input="${1:handler}"' },
  { name: '@change', description: 'Run an expression when the value changes', snippet: '@change="${1:handler}"' },
  { name: '@keydown', description: 'Run an expression on keydown', snippet: '@keydown="${1:handler}"' },
  { name: '@keyup', description: 'Run an expression on keyup', snippet: '@keyup="${1:handler}"' },
  { name: '@focus', description: 'Run an expression when the element receives focus', snippet: '@focus="${1:handler}"' },
  { name: '@blur', description: 'Run an expression when the element loses focus', snippet: '@blur="${1:handler}"' },
  { name: '@mouseenter', description: 'Run an expression when the pointer enters the element', snippet: '@mouseenter="${1:handler}"' },
  { name: '@mouseleave', description: 'Run an expression when the pointer leaves the element', snippet: '@mouseleave="${1:handler}"' },
  { name: 'stx-hydrate', description: 'Defer reactive hydration until a trigger fires', snippet: 'stx-hydrate="${1:visible}"' },
]

export interface StxAttributeCompletionContext {
  prefix: string
}

/** Return the attribute token before the cursor when it is inside an opening tag. */
export function getStxAttributeCompletionContext(sourceBeforeCursor: string): StxAttributeCompletionContext | undefined {
  let tagStart = -1
  let quote: '"' | '\'' | undefined

  for (let index = 0; index < sourceBeforeCursor.length; index++) {
    const character = sourceBeforeCursor[index]

    if (quote) {
      if (character === quote && sourceBeforeCursor[index - 1] !== '\\')
        quote = undefined
      continue
    }

    if ((character === '"' || character === '\'') && tagStart >= 0) {
      quote = character
      continue
    }

    if (character === '<') {
      const next = sourceBeforeCursor[index + 1]
      tagStart = next && /[A-Za-z]/.test(next) ? index : -1
    }
    else if (character === '>') {
      tagStart = -1
    }
  }

  if (tagStart < 0 || quote)
    return undefined

  const tag = sourceBeforeCursor.slice(tagStart + 1)
  const match = tag.match(/\s([:@\w.-]*)$/)
  if (!match)
    return undefined

  return { prefix: match[1] }
}
