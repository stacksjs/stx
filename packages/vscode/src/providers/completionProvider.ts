/* eslint-disable no-console, no-template-curly-in-string */
import * as vscode from 'vscode'
import { TransitionDirection, TransitionEase, TransitionType } from '../interfaces/animation-types'

/**
 * Creates a completion provider for STX animation directives
 */
export function createCompletionProvider(): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position, token, context) {
      // Check if this is an STX file by extension, even if language ID isn't set
      const isStxFile = document.fileName.endsWith('.stx')
      if (!isStxFile && document.languageId !== 'stx') {
        console.log(`STX Completion - Skipping non-STX file: ${document.fileName} (language: ${document.languageId})`)
        return undefined
      }

      console.log(`STX Completion - Processing document: ${document.fileName} (language: ${document.languageId})`)

      const line = document.lineAt(position.line).text
      const linePrefix = line.substring(0, position.character)

      console.log(`STX Completion - Processing line prefix: "${linePrefix}"`)
      console.log(`STX Completion - Trigger character: "${context?.triggerCharacter || 'none'}"`)

      // When triggered by @ character, show all directives
      if (context?.triggerCharacter === '@') {
        console.log(`STX Completion - Triggered by @ character, showing all directives`)
        return getAllDirectiveCompletions()
      }

      // Check for partial directive name (like @tra)
      // This handles the case when the user has already typed @ and some letters
      const directiveMatch = linePrefix.match(/@([a-z]*)$/i)
      if (directiveMatch) {
        const prefix = directiveMatch[1].toLowerCase()
        console.log(`STX Completion - Found directive prefix: "${prefix}"`)
        return getFilteredDirectiveCompletions(prefix)
      }

      // If we're at a position with @ character (no trigger, but @ is there)
      if (linePrefix.endsWith('@')) {
        console.log(`STX Completion - Line ends with @, showing all directives`)
        return getAllDirectiveCompletions()
      }

      // Check for parameters in directives
      if (linePrefix.includes('@transition(')) {
        console.log(`STX Completion - Detected @transition parameters context`)

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
        console.log(`STX Completion - Detected @motion parameters context`)
        return createBooleanCompletions()
      }

      return undefined
    },
  }
}

/**
 * Get all STX directives without filtering
 */
function getAllDirectiveCompletions(): vscode.CompletionItem[] {
  return createDirectiveItems(getAllDirectives())
}

/**
 * Get STX directives filtered by prefix
 */
function getFilteredDirectiveCompletions(prefix: string): vscode.CompletionItem[] {
  const allDirectives = getAllDirectives()
  const filteredDirectives = allDirectives.filter(d =>
    d.name.toLowerCase().includes(prefix.toLowerCase()),
  )

  console.log(`STX Completion - Filtered directives: ${filteredDirectives.map(d => d.name).join(', ')}`)
  return createDirectiveItems(filteredDirectives)
}

/**
 * Get all available STX directives
 */
function getAllDirectives(): Array<{ name: string, description: string }> {
  return [
    { name: 'transition', description: 'Applies transition animations to an element' },
    { name: 'translate', description: 'Translate a string using the i18n system' },
    { name: 'motion', description: 'Controls animation display based on user preferences' },
    { name: 'animationGroup', description: 'Groups elements for coordinated animations' },
    { name: 'scrollAnimate', description: 'Triggers animation when element scrolls into view' },
    { name: 'if', description: 'Conditional rendering' },
    { name: 'else', description: 'Alternative rendering for conditionals' },
    { name: 'elseif', description: 'Alternative condition for if statement' },
    { name: 'foreach', description: 'Iterates over an array or collection' },
    { name: 'for', description: 'Standard for loop' },
    { name: 'while', description: 'While loop' },
    { name: 'component', description: 'Renders a component' },
    { name: 'ts', description: 'TypeScript code block' },
    { name: 'js', description: 'JavaScript code block' },
    { name: 'json', description: 'JSON data block' },
    { name: 'markdown', description: 'Markdown content block' },
    { name: 'empty', description: 'Empty placeholder element' },
    { name: 'env', description: 'Access environment variables' },
    { name: 'include', description: 'Include another template file' },
    { name: 'isset', description: 'Check if a variable is set' },
    { name: 'endtransition', description: 'Ends a transition block' },
    { name: 'endmotion', description: 'Ends a motion block' },
    { name: 'endif', description: 'Ends an if block' },
    { name: 'endfor', description: 'Ends a for loop block' },
    { name: 'endforeach', description: 'Ends a foreach loop block' },
    { name: 'endwhile', description: 'Ends a while loop block' },
    { name: 'endts', description: 'Ends a TypeScript code block' },
    { name: 'endjs', description: 'Ends a JavaScript code block' },
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

    item.detail = `STX ${directive.name} directive`
    item.documentation = new vscode.MarkdownString(directive.description)

    // Set snippets for directives
    switch (directive.name) {
      case 'transition':
        item.insertText = new vscode.SnippetString(
          '@transition(${1|fade,slide,scale,flip,rotate,custom|}, ${2:400}, ${3|ease,ease-in,ease-out,ease-in-out,linear|}, ${4:0}, ${5|in,out,both|})',
        )
        break
      case 'motion':
        item.insertText = new vscode.SnippetString('@motion(${1|true,false|})')
        break
      case 'translate':
        item.insertText = new vscode.SnippetString('@translate(${1:key}, { ${2:params} })')
        break
      case 'animationGroup':
        item.insertText = new vscode.SnippetString('@animationGroup(${1:groupName}, ${2:#selector1})')
        break
      case 'if':
        item.insertText = new vscode.SnippetString('@if(${1:condition})\n\t${2}\n@endif')
        break
      case 'foreach':
        item.insertText = new vscode.SnippetString('@foreach(${1:collection} as ${2:item})\n\t${3}\n@endforeach')
        break
      case 'component':
        item.insertText = new vscode.SnippetString('@component(${1:name}, { ${2:props} })')
        break
      case 'ts':
        item.insertText = new vscode.SnippetString('@ts\n\t${1}\n@endts')
        break
      case 'endtransition':
        item.insertText = new vscode.SnippetString('@endtransition')
        break
      case 'endmotion':
        item.insertText = new vscode.SnippetString('@endmotion')
        break
      case 'include':
        item.insertText = new vscode.SnippetString('@include(${1:path})')
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
