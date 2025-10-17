/* eslint-disable no-console, no-template-curly-in-string */
import * as vscode from 'vscode'
import { TransitionDirection, TransitionEase, TransitionType } from '../interfaces/animation-types'

/**
 * Creates a completion provider for stx animation directives
 */
export function createCompletionProvider(): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position, token, context) {
      // Check configuration
      const config = vscode.workspace.getConfiguration('stx.completion')
      const completionEnabled = config.get<boolean>('enable', true)

      if (!completionEnabled) {
        return undefined
      }

      // Check if this is an stx file by extension, even if language ID isn't set
      const isStxFile = document.fileName.endsWith('.stx')
      if (!isStxFile && document.languageId !== 'stx') {
        console.log(`stx Completion - Skipping non-stx file: ${document.fileName} (language: ${document.languageId})`)
        return undefined
      }

      console.log(`stx Completion - Processing document: ${document.fileName} (language: ${document.languageId})`)

      const line = document.lineAt(position.line).text
      const linePrefix = line.substring(0, position.character)

      console.log(`stx Completion - Processing line prefix: "${linePrefix}"`)
      console.log(`stx Completion - Trigger character: "${context?.triggerCharacter || 'none'}"`)

      // When triggered by @ character, show all directives
      if (context?.triggerCharacter === '@') {
        console.log(`stx Completion - Triggered by @ character, showing all directives`)
        return getAllDirectiveCompletions()
      }

      // Check for partial directive name (like @tra)
      // This handles the case when the user has already typed @ and some letters
      const directiveMatch = linePrefix.match(/@([a-z]*)$/i)
      if (directiveMatch) {
        const prefix = directiveMatch[1].toLowerCase()
        console.log(`stx Completion - Found directive prefix: "${prefix}"`)
        return getFilteredDirectiveCompletions(prefix)
      }

      // If we're at a position with @ character (no trigger, but @ is there)
      if (linePrefix.endsWith('@')) {
        console.log(`stx Completion - Line ends with @, showing all directives`)
        return getAllDirectiveCompletions()
      }

      // Check for parameters in directives
      if (linePrefix.includes('@transition(')) {
        console.log(`stx Completion - Detected @transition parameters context`)

        // Very basic parameter position detection
        const params = linePrefix.substring(linePrefix.indexOf('(') + 1).split(',')
        const paramIndex = params.length - 1

        // Parameter completions based on position
        if (paramIndex === 0) {
          // First param is transition type (fade, slide, etc.)
          return createTransitionTypeCompletions()
        }
        else if (paramIndex === 2) {
          // Third param is easing function
          return createEasingCompletions()
        }
        else if (paramIndex === 4) {
          // Fifth param is direction
          return createDirectionCompletions()
        }
      }

      if (linePrefix.includes('@motion(')) {
        console.log(`stx Completion - Detected @motion parameters context`)
        return createBooleanCompletions()
      }

      return undefined
    },
  }
}

/**
 * Get all stx directives without filtering
 */
function getAllDirectiveCompletions(): vscode.CompletionItem[] {
  return createDirectiveItems(getAllDirectives())
}

/**
 * Get stx directives filtered by prefix
 */
function getFilteredDirectiveCompletions(prefix: string): vscode.CompletionItem[] {
  const allDirectives = getAllDirectives()
  const filteredDirectives = allDirectives.filter(d =>
    d.name.toLowerCase().includes(prefix.toLowerCase()),
  )

  console.log(`stx Completion - Filtered directives: ${filteredDirectives.map(d => d.name).join(', ')}`)
  return createDirectiveItems(filteredDirectives)
}

/**
 * Get all available stx directives
 */
function getAllDirectives(): Array<{ name: string, description: string }> {
  return [
    // Animation directives
    { name: 'transition', description: 'Applies transition animations to an element' },
    { name: 'motion', description: 'Controls animation display based on user preferences' },
    { name: 'animationGroup', description: 'Groups elements for coordinated animations' },
    { name: 'scrollAnimate', description: 'Triggers animation when element scrolls into view' },

    // Translation directives
    { name: 'translate', description: 'Translate a string using the i18n system' },
    { name: 't', description: 'Short alias for translate directive' },

    // Conditional directives
    { name: 'if', description: 'Conditional rendering' },
    { name: 'else', description: 'Alternative rendering for conditionals' },
    { name: 'elseif', description: 'Alternative condition for if statement' },
    { name: 'unless', description: 'Inverse conditional rendering' },

    // Loop directives
    { name: 'foreach', description: 'Iterates over an array or collection' },
    { name: 'for', description: 'Standard for loop' },
    { name: 'while', description: 'While loop' },
    { name: 'forelse', description: 'Loop with fallback when collection is empty' },

    // Switch directives
    { name: 'switch', description: 'Switch statement for multiple conditions' },
    { name: 'case', description: 'Case option in switch statement' },
    { name: 'default', description: 'Default case in switch statement' },
    { name: 'break', description: 'Break from loop or switch' },
    { name: 'continue', description: 'Continue to next iteration' },

    // Component directives
    { name: 'component', description: 'Renders a component' },
    { name: 'slot', description: 'Define a named slot in a component' },
    { name: 'webcomponent', description: 'Include a web component' },

    // Code block directives
    { name: 'ts', description: 'TypeScript code block' },
    { name: 'js', description: 'JavaScript code block' },
    { name: 'script', description: 'Script code block (alternative to @ts)' },
    { name: 'css', description: 'CSS code block' },

    // Content directives
    { name: 'json', description: 'Output variable as JSON' },
    { name: 'markdown', description: 'Markdown content block' },
    { name: 'raw', description: 'Display content without processing expressions' },
    { name: 'verbatim', description: 'Display content without processing directives' },

    // Layout directives
    { name: 'extends', description: 'Extend a base layout' },
    { name: 'section', description: 'Define a content section' },
    { name: 'yield', description: 'Output the contents of a section' },
    { name: 'parent', description: 'Include parent section content' },

    // Stack directives
    { name: 'stack', description: 'Define a stack for pushing content' },
    { name: 'push', description: 'Push content to a stack' },
    { name: 'pushIf', description: 'Conditionally push content to a stack' },
    { name: 'pushOnce', description: 'Push content to a stack only once' },
    { name: 'prepend', description: 'Prepend content to a stack' },
    { name: 'prependOnce', description: 'Prepend content to a stack only once' },

    // Include directives
    { name: 'include', description: 'Include another template file' },
    { name: 'includeIf', description: 'Conditionally include a template' },
    { name: 'includeWhen', description: 'Include template when condition is true' },
    { name: 'includeUnless', description: 'Include template unless condition is true' },
    { name: 'includeFirst', description: 'Include the first existing template from a list' },

    // Auth directives
    { name: 'auth', description: 'Content visible only to authenticated users' },
    { name: 'guest', description: 'Content visible only to guests' },
    { name: 'can', description: 'Check if user has permission' },
    { name: 'cannot', description: 'Check if user lacks permission' },

    // Utility directives
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

    // End directives
    { name: 'endtransition', description: 'Ends a transition block' },
    { name: 'endmotion', description: 'Ends a motion block' },
    { name: 'endif', description: 'Ends an if block' },
    { name: 'endunless', description: 'Ends an unless block' },
    { name: 'endfor', description: 'Ends a for loop block' },
    { name: 'endforeach', description: 'Ends a foreach loop block' },
    { name: 'endforelse', description: 'Ends a forelse loop block' },
    { name: 'endwhile', description: 'Ends a while loop block' },
    { name: 'endswitch', description: 'Ends a switch block' },
    { name: 'endts', description: 'Ends a TypeScript code block' },
    { name: 'endjs', description: 'Ends a JavaScript code block' },
    { name: 'endscript', description: 'Ends a script code block' },
    { name: 'endcss', description: 'Ends a CSS code block' },
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
  ]
}

/**
 * Create completion items from directive definitions
 */
function createDirectiveItems(directives: Array<{ name: string, description: string }>): vscode.CompletionItem[] {
  return directives.map((directive) => {
    const item = new vscode.CompletionItem(
      `@${directive.name}`,
      vscode.CompletionItemKind.Snippet,
    )

    item.detail = `stx ${directive.name} directive`
    item.documentation = new vscode.MarkdownString(directive.description)

    // Set snippets for directives
    switch (directive.name) {
      // Animation directives
      case 'transition':
        item.insertText = new vscode.SnippetString(
          '@transition(${1|fade,slide,scale,flip,rotate,custom|}, ${2:400}, ${3|ease,ease-in,ease-out,ease-in-out,linear|}, ${4:0}, ${5|in,out,both|})\n\t${6}\n@endtransition',
        )
        break
      case 'motion':
        item.insertText = new vscode.SnippetString('@motion(${1|true,false|})\n\t${2}\n@endmotion')
        break
      case 'scrollAnimate':
        item.insertText = new vscode.SnippetString('@scrollAnimate(${1|fade,slide,scale,flip,rotate,custom|}, ${2:400}, ${3|ease,ease-in,ease-out,ease-in-out,linear|}, ${4:0.2}, ${5:0})\n\t${6}\n@endscrollAnimate')
        break

      // Translation directives
      case 'translate':
        item.insertText = new vscode.SnippetString('@translate(${1:key}, { ${2:params} })')
        break
      case 't':
        item.insertText = new vscode.SnippetString('@t(${1:key}, { ${2:params} })')
        break

      // Conditional directives
      case 'if':
        item.insertText = new vscode.SnippetString('@if(${1:condition})\n\t${2}\n@endif')
        break
      case 'unless':
        item.insertText = new vscode.SnippetString('@unless(${1:condition})\n\t${2}\n@endunless')
        break
      case 'elseif':
        item.insertText = new vscode.SnippetString('@elseif(${1:condition})')
        break

      // Loop directives
      case 'foreach':
        item.insertText = new vscode.SnippetString('@foreach(${1:collection} as ${2:item})\n\t${3}\n@endforeach')
        break
      case 'for':
        item.insertText = new vscode.SnippetString('@for(${1:let i = 0}; ${2:i < items.length}; ${3:i++})\n\t${4}\n@endfor')
        break
      case 'while':
        item.insertText = new vscode.SnippetString('@while(${1:condition})\n\t${2}\n@endwhile')
        break
      case 'forelse':
        item.insertText = new vscode.SnippetString('@forelse(${1:collection} as ${2:item})\n\t${3}\n@empty\n\t${4}\n@endforelse')
        break

      // Switch directives
      case 'switch':
        item.insertText = new vscode.SnippetString('@switch(${1:value})\n\t@case(${2:option1})\n\t\t${3}\n\t\t@break\n\t@default\n\t\t${4}\n@endswitch')
        break
      case 'case':
        item.insertText = new vscode.SnippetString('@case(${1:value})\n\t${2}\n\t@break')
        break

      // Component directives
      case 'component':
        item.insertText = new vscode.SnippetString('@component(${1:name}, { ${2:props} })\n\t${3}\n@endcomponent')
        break
      case 'slot':
        item.insertText = new vscode.SnippetString('@slot(${1:name})\n\t${2}\n@endslot')
        break
      case 'webcomponent':
        item.insertText = new vscode.SnippetString('@webcomponent(${1:name})\n\t${2}\n@endwebcomponent')
        break

      // Code block directives
      case 'ts':
        item.insertText = new vscode.SnippetString('@ts\n\t${1}\n@endts')
        break
      case 'js':
        item.insertText = new vscode.SnippetString('@js\n\t${1}\n@endjs')
        break
      case 'script':
        item.insertText = new vscode.SnippetString('@script\n\t${1}\n@endscript')
        break
      case 'css':
        item.insertText = new vscode.SnippetString('@css\n\t${1}\n@endcss')
        break

      // Content directives
      case 'markdown':
        item.insertText = new vscode.SnippetString('@markdown\n\t${1}\n@endmarkdown')
        break
      case 'raw':
        item.insertText = new vscode.SnippetString('@raw\n\t${1}\n@endraw')
        break
      case 'verbatim':
        item.insertText = new vscode.SnippetString('@verbatim\n\t${1}\n@endverbatim')
        break
      case 'json':
        item.insertText = new vscode.SnippetString('@json(${1:variable})')
        break

      // Layout directives
      case 'extends':
        item.insertText = new vscode.SnippetString('@extends(${1:layout})')
        break
      case 'section':
        item.insertText = new vscode.SnippetString('@section(${1:name})\n\t${2}\n@endsection')
        break
      case 'yield':
        item.insertText = new vscode.SnippetString('@yield(${1:section})')
        break

      // Stack directives
      case 'push':
        item.insertText = new vscode.SnippetString('@push(${1:stack})\n\t${2}\n@endpush')
        break
      case 'pushIf':
        item.insertText = new vscode.SnippetString('@pushIf(${1:condition}, ${2:stack})\n\t${3}\n@endpushIf')
        break
      case 'pushOnce':
        item.insertText = new vscode.SnippetString('@pushOnce(${1:stack})\n\t${2}\n@endpushOnce')
        break
      case 'prepend':
        item.insertText = new vscode.SnippetString('@prepend(${1:stack})\n\t${2}\n@endprepend')
        break
      case 'prependOnce':
        item.insertText = new vscode.SnippetString('@prependOnce(${1:stack})\n\t${2}\n@endprependOnce')
        break
      case 'stack':
        item.insertText = new vscode.SnippetString('@stack(${1:name})')
        break

      // Include directives
      case 'include':
        item.insertText = new vscode.SnippetString('@include(${1:path})')
        break
      case 'includeIf':
        item.insertText = new vscode.SnippetString('@includeIf(${1:condition}, ${2:path})')
        break
      case 'includeWhen':
        item.insertText = new vscode.SnippetString('@includeWhen(${1:condition}, ${2:path})')
        break
      case 'includeUnless':
        item.insertText = new vscode.SnippetString('@includeUnless(${1:condition}, ${2:path})')
        break
      case 'includeFirst':
        item.insertText = new vscode.SnippetString('@includeFirst([${1:paths}])')
        break

      // Auth directives
      case 'auth':
        item.insertText = new vscode.SnippetString('@auth\n\t${1}\n@endauth')
        break
      case 'guest':
        item.insertText = new vscode.SnippetString('@guest\n\t${1}\n@endguest')
        break
      case 'can':
        item.insertText = new vscode.SnippetString('@can(${1:permission}, ${2:model})\n\t${3}\n@endcan')
        break
      case 'cannot':
        item.insertText = new vscode.SnippetString('@cannot(${1:permission}, ${2:model})\n\t${3}\n@endcannot')
        break

      // Utility directives
      case 'env':
        item.insertText = new vscode.SnippetString('@env(${1:environment})\n\t${2}\n@endenv')
        break
      case 'isset':
        item.insertText = new vscode.SnippetString('@isset(${1:variable})\n\t${2}\n@endisset')
        break
      case 'empty':
        item.insertText = new vscode.SnippetString('@empty(${1:variable})\n\t${2}\n@endempty')
        break
      case 'error':
        item.insertText = new vscode.SnippetString('@error(${1:field})\n\t${2}\n@enderror')
        break
      case 'hasSection':
        item.insertText = new vscode.SnippetString('@hasSection(${1:name})\n\t${2}\n@endif')
        break
      case 'once':
        item.insertText = new vscode.SnippetString('@once\n\t${1}\n@endonce')
        break
      case 'use':
        item.insertText = new vscode.SnippetString('@use(${1:namespace})')
        break
      case 'csrf':
        item.insertText = new vscode.SnippetString('@csrf')
        break
      case 'method':
        item.insertText = new vscode.SnippetString('@method(${1|GET,POST,PUT,PATCH,DELETE|})')
        break
      case 'locale':
        item.insertText = new vscode.SnippetString('@locale(${1:locale})')
        break
      case 'animationGroup':
        item.insertText = new vscode.SnippetString('@animationGroup(${1:groupName}, ${2:#selector1})')
        break

      default:
        item.insertText = new vscode.SnippetString(`@${directive.name}`)
        break
    }

    // Prioritize transition and commonly used directives
    if (['transition', 'motion', 'translate', 'component', 'if', 'foreach'].includes(directive.name)) {
      item.sortText = `0${directive.name}`
    }
    else {
      item.sortText = `1${directive.name}`
    }

    return item
  })
}

/**
 * Creates completion items for transition types
 */
function createTransitionTypeCompletions(): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = []

  // Add all transition types
  Object.values(TransitionType).forEach((type) => {
    const completion = new vscode.CompletionItem(type, vscode.CompletionItemKind.Value)
    let description = ''

    switch (type) {
      case TransitionType.Fade:
        description = 'Smooth opacity transitions'
        break
      case TransitionType.Slide:
        description = 'Elegant sliding movements'
        break
      case TransitionType.Scale:
        description = 'Size scaling effects'
        break
      case TransitionType.Flip:
        description = '3D flipping animations'
        break
      case TransitionType.Rotate:
        description = 'Rotation-based animations'
        break
      case TransitionType.Custom:
        description = 'Custom animation (requires additional CSS)'
        break
    }

    completion.detail = description
    completion.documentation = new vscode.MarkdownString(`**${type}**: ${description}`)
    completion.insertText = type
    completions.push(completion)
  })

  return completions
}

/**
 * Creates completion items for easing functions
 */
function createEasingCompletions(): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = []

  // Add all easing functions
  Object.values(TransitionEase).forEach((ease) => {
    const completion = new vscode.CompletionItem(ease, vscode.CompletionItemKind.Value)
    let description = ''

    switch (ease) {
      case TransitionEase.Linear:
        description = 'Linear timing function (constant speed)'
        break
      case TransitionEase.Ease:
        description = 'Default easing function (slight acceleration/deceleration)'
        break
      case TransitionEase.EaseIn:
        description = 'Starts slowly, then speeds up'
        break
      case TransitionEase.EaseOut:
        description = 'Starts quickly, then slows down'
        break
      case TransitionEase.EaseInOut:
        description = 'Starts slowly, speeds up in the middle, then slows down at the end'
        break
    }

    completion.detail = description
    completion.documentation = new vscode.MarkdownString(`**${ease}**: ${description}`)
    completion.insertText = ease
    completions.push(completion)
  })

  return completions
}

/**
 * Creates completion items for transition directions
 */
function createDirectionCompletions(): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = []

  // Add all direction values
  Object.values(TransitionDirection).forEach((direction) => {
    const completion = new vscode.CompletionItem(direction, vscode.CompletionItemKind.Value)
    let description = ''

    switch (direction) {
      case TransitionDirection.In:
        description = 'Element transitions in (appears)'
        break
      case TransitionDirection.Out:
        description = 'Element transitions out (disappears)'
        break
      case TransitionDirection.Both:
        description = 'Element transitions both in and out (default)'
        break
    }

    completion.detail = description
    completion.documentation = new vscode.MarkdownString(`**${direction}**: ${description}`)
    completion.insertText = direction
    completions.push(completion)
  })

  return completions
}

/**
 * Creates completion items for boolean values
 */
function createBooleanCompletions(): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = []

  // Add true/false options
  const trueCompletion = new vscode.CompletionItem('true', vscode.CompletionItemKind.Value)
  trueCompletion.detail = 'Enable animations'
  trueCompletion.documentation = new vscode.MarkdownString('Shows animations to users who haven\'t requested reduced motion')
  completions.push(trueCompletion)

  const falseCompletion = new vscode.CompletionItem('false', vscode.CompletionItemKind.Value)
  falseCompletion.detail = 'Disable animations'
  falseCompletion.documentation = new vscode.MarkdownString('No animations will be shown regardless of user preferences')
  completions.push(falseCompletion)

  return completions
}
