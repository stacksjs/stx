import * as vscode from 'vscode';
import { VirtualTsDocumentProvider } from './virtualTsDocumentProvider';
import { formatJSDoc } from '../utils/jsdocUtils';
import { isInStyleTag, findCssStylesForClass } from '../utils/cssUtils';
import { findForeachDeclarationForVariable } from '../utils/stxUtils';
import { TransitionType, TransitionDirection, TransitionEase } from '../interfaces/animation-types';

export function createHoverProvider(virtualTsDocumentProvider: VirtualTsDocumentProvider): vscode.HoverProvider {
  return {
    async provideHover(document, position, token) {
      // Check if we're in a TypeScript section or expression
      const wordRange = document.getWordRangeAtPosition(position);

      if (!wordRange) {
        return null;
      }

      // Get the word at the current position
      const word = document.getText(wordRange);

      // Get the entire line for context analysis
      const line = document.lineAt(position.line).text;

      // ANIMATION DIRECTIVE HANDLING
      // Check if we're inside a transition directive
      const transitionMatch = line.match(/@transition\((.*?)\)/);
      if (transitionMatch) {
        const params = transitionMatch[1].split(',').map(p => p.trim());

        // Check if the word is one of the parameters or part of a hyphenated parameter (like ease-out)
        let foundParamIndex = -1;
        let fullParam = '';

        // First try direct match
        foundParamIndex = params.findIndex(p => p.replace(/['"`]/g, '') === word);

        // If not found, try to check if it's part of a hyphenated value
        if (foundParamIndex === -1) {
          for (let i = 0; i < params.length; i++) {
            const param = params[i].replace(/['"`]/g, '');

            // Check if the parameter contains hyphen and the word
            if (param.includes('-')) {
              const parts = param.split('-');
              if (parts.includes(word) || param === word) {
                foundParamIndex = i;
                fullParam = param;
                break;
              }
            }
          }
        } else {
          fullParam = params[foundParamIndex].replace(/['"`]/g, '');
        }

        // Special case for "ease" parts
        if (foundParamIndex === -1 && (word === 'ease' || word === 'in' || word === 'out')) {
          // Check if there's an ease-in, ease-out, or ease-in-out parameter
          const easeParams = ['ease-in', 'ease-out', 'ease-in-out'];

          for (let i = 0; i < params.length; i++) {
            const param = params[i].replace(/['"`]/g, '');

            if (easeParams.includes(param)) {
              if ((word === 'ease' && param.startsWith('ease')) ||
                  (word === 'in' && (param === 'ease-in' || param === 'ease-in-out')) ||
                  (word === 'out' && (param === 'ease-out' || param === 'ease-in-out'))) {
                foundParamIndex = i;
                fullParam = param;
                break;
              }
            }
          }
        }

        if (foundParamIndex !== -1) {
          let hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          switch (foundParamIndex) {
            case 0: // Transition type
              if (Object.values(TransitionType).includes(fullParam as TransitionType)) {
                const description = getTransitionTypeDescription(fullParam as TransitionType);
                hover.appendCodeblock(`@transition('${fullParam}', duration?, ease?, delay?, direction?)`, 'stx');
                hover.appendMarkdown(`\n\n**Transition Type**: ${description}`);
                hover.appendMarkdown(`\n\n**Available Types**:`);
                hover.appendMarkdown(`\n- \`fade\`: Smooth opacity transitions`);
                hover.appendMarkdown(`\n- \`slide\`: Elegant sliding movements`);
                hover.appendMarkdown(`\n- \`scale\`: Size scaling effects`);
                hover.appendMarkdown(`\n- \`flip\`: 3D flipping animations`);
                hover.appendMarkdown(`\n- \`rotate\`: Rotation-based animations`);
                hover.appendMarkdown(`\n- \`custom\`: Custom animation (requires additional CSS)`);
                return new vscode.Hover(hover);
              }
              break;

            case 1: // Duration
              hover.appendCodeblock(`@transition(type, ${fullParam}, ease?, delay?, direction?)`, 'stx');
              hover.appendMarkdown(`\n\n**Duration**: Transition duration in milliseconds (default: 300)`);
              return new vscode.Hover(hover);

            case 2: // Ease
              // Handle hyphenated values like 'ease-out'
              let description = '';

              // Map the string value to an enum value if possible
              const easingValues = Object.values(TransitionEase);
              const matchingEase = easingValues.find(v => v.toString() === fullParam);

              if (matchingEase || ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'].includes(fullParam)) {
                description = getTransitionEaseDescription(fullParam as TransitionEase);
                hover.appendCodeblock(`@transition(type, duration, '${fullParam}', delay?, direction?)`, 'stx');
                hover.appendMarkdown(`\n\n**Easing Function**: ${description}`);
                hover.appendMarkdown(`\n\n**Available Easing Functions**:`);
                hover.appendMarkdown(`\n- \`linear\`: Constant speed throughout`);
                hover.appendMarkdown(`\n- \`ease\`: Default easing (slight acceleration/deceleration)`);
                hover.appendMarkdown(`\n- \`ease-in\`: Starts slowly, speeds up`);
                hover.appendMarkdown(`\n- \`ease-out\`: Starts quickly, slows down`);
                hover.appendMarkdown(`\n- \`ease-in-out\`: Slow start, fast middle, slow end`);
                return new vscode.Hover(hover);
              } else if (fullParam.includes('-') && (fullParam.startsWith('ease-') || fullParam === 'linear')) {
                // Handle parts of hyphenated values (if word is just "out" from "ease-out")
                const hyphenParts = fullParam.split('-');
                if (hyphenParts.includes(word)) {
                  description = getTransitionEaseDescription(fullParam as TransitionEase);
                  hover.appendCodeblock(`@transition(type, duration, '${fullParam}', delay?, direction?)`, 'stx');
                  hover.appendMarkdown(`\n\n**Easing Function**: ${description}`);
                  hover.appendMarkdown(`\n\n**Available Easing Functions**:`);
                  hover.appendMarkdown(`\n- \`linear\`: Constant speed throughout`);
                  hover.appendMarkdown(`\n- \`ease\`: Default easing (slight acceleration/deceleration)`);
                  hover.appendMarkdown(`\n- \`ease-in\`: Starts slowly, speeds up`);
                  hover.appendMarkdown(`\n- \`ease-out\`: Starts quickly, slows down`);
                  hover.appendMarkdown(`\n- \`ease-in-out\`: Slow start, fast middle, slow end`);
                  return new vscode.Hover(hover);
                }
              }
              break;

            case 3: // Delay
              hover.appendCodeblock(`@transition(type, duration, ease, ${fullParam}, direction?)`, 'stx');
              hover.appendMarkdown(`\n\n**Delay**: Transition delay in milliseconds (default: 0)`);
              return new vscode.Hover(hover);

            case 4: // Direction
              if (Object.values(TransitionDirection).includes(fullParam as TransitionDirection)) {
                const description = getTransitionDirectionDescription(fullParam as TransitionDirection);
                hover.appendCodeblock(`@transition(type, duration, ease, delay, '${fullParam}')`, 'stx');
                hover.appendMarkdown(`\n\n**Direction**: ${description}`);
                hover.appendMarkdown(`\n\n**Available Directions**:`);
                hover.appendMarkdown(`\n- \`in\`: Element transitions in (appears)`);
                hover.appendMarkdown(`\n- \`out\`: Element transitions out (disappears)`);
                hover.appendMarkdown(`\n- \`both\`: Element transitions both in and out (default)`);
                return new vscode.Hover(hover);
              }
              break;
          }
        }
      }

      // Check if we're inside a motion directive
      const motionMatch = line.match(/@motion\((.*?)\)/);
      if (motionMatch && (word === 'true' || word === 'false')) {
        let hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        hover.appendCodeblock(`@motion(${word})`, 'stx');
        hover.appendMarkdown(`\n\n**Motion Preference**: ${word === 'true' ? 'Enables' : 'Disables'} animations based on user preference settings.`);
        hover.appendMarkdown(`\n\nWhen set to \`true\`, animations will be shown to users who haven't requested reduced motion.`);
        hover.appendMarkdown(`\n\nWhen set to \`false\`, no animations will be shown regardless of user preferences.`);

        return new vscode.Hover(hover);
      }

      // Check if we're inside an animationGroup directive
      const animationGroupMatch = line.match(/@animationGroup\((.*?)\)/);
      if (animationGroupMatch) {
        // Check if the word is one of the parameters
        const params = animationGroupMatch[1].split(',').map(p => p.trim());
        if (params.some(p => p.replace(/['"`]/g, '') === word)) {
          let hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          const isGroupName = params[0].replace(/['"`]/g, '') === word;

          if (isGroupName) {
            hover.appendCodeblock(`@animationGroup('${word}', ...selectors)`, 'stx');
            hover.appendMarkdown(`\n\n**Animation Group Name**: Unique identifier for this animation group`);
          } else {
            hover.appendCodeblock(`@animationGroup(name, '${word}', ...)`, 'stx');
            hover.appendMarkdown(`\n\n**Element Selector**: CSS selector for elements to include in this animation group`);
          }

          return new vscode.Hover(hover);
        }
      }

      // Check if we're in a CSS/style block
      const inStyleBlock = isInStyleTag(document, position);

      // Check if this is a property access (e.g. product.name)
      const isPropertyAccess = line.substring(0, wordRange.start.character).trim().endsWith('.');

      // Precise detection for CSS class selectors
      const isCssClassSelector = inStyleBlock && document.getText().charAt(document.offsetAt(wordRange.start) - 1) === '.';

      // Get text before the current position for context
      const beforeText = line.substring(0, wordRange.start.character);

      // CSS CLASS NAME IN HTML CLASS ATTRIBUTE
      // Check if we're within a class attribute (class="note" or className="note")
      const classAttributeRegex = /(class|className)\s*=\s*["']([^"']*)["']/g;
      let classAttributeMatch;
      let isInClassAttribute = false;
      let classesInAttribute: string[] = [];

      // Reset regex state
      classAttributeRegex.lastIndex = 0;

      while ((classAttributeMatch = classAttributeRegex.exec(line)) !== null) {
        const attributeStart = classAttributeMatch.index;
        const attributeValueStart = attributeStart + classAttributeMatch[0].indexOf(classAttributeMatch[2]);
        const attributeValueEnd = attributeValueStart + classAttributeMatch[2].length;

        // Check if our position is within the class attribute value
        if (position.character >= attributeValueStart && position.character <= attributeValueEnd) {
          isInClassAttribute = true;
          classesInAttribute = classAttributeMatch[2].split(/\s+/);
          break;
        }
      }

      // If we're in a class attribute, check if the word matches one of the classes
      if (isInClassAttribute && classesInAttribute.includes(word)) {
        // Create hover for CSS class
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: CSS class selector
        hover.appendCodeblock(`.${word} { }`, 'css');

        // Add spacing
        hover.appendText('\n\n');

        // Description
        hover.appendMarkdown('**CSS Class**\n\n');
        hover.appendMarkdown('Applies styles to elements with this class attribute.\n\n');

        // Show the current styles for this class
        const cssStyles = findCssStylesForClass(document, word);
        if (cssStyles && cssStyles.length > 0) {
          hover.appendMarkdown('**CSS Properties:**\n\n');
          hover.appendCodeblock(`.${word} {\n${cssStyles.join('\n')}\n}`, 'css');
        } else {
          hover.appendMarkdown('*No styles found for this class in the current document.*');
        }

        return new vscode.Hover(hover);
      }

      // CSS CLASS SELECTOR DETECTION - This comes first
      if (isCssClassSelector) {
        // We're in a style block with a class selector like ".note"
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: CSS class selector
        hover.appendCodeblock(`.${word} { }`, 'css');

        // Add spacing
        hover.appendText('\n\n');

        // Description
        hover.appendMarkdown('**CSS Class Selector**\n\n');
        hover.appendMarkdown('Selects all elements with the specified class attribute.\n\n');
        hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 1, 0)');

        // Show the current styles for this class
        const cssStyles = findCssStylesForClass(document, word);
        if (cssStyles && cssStyles.length > 0) {
          hover.appendMarkdown('\n\n**CSS Properties:**\n\n');
          hover.appendCodeblock(`.${word} {\n${cssStyles.join('\n')}\n}`, 'css');
        }

        return new vscode.Hover(hover);
      }

      // HTML TAG DETECTION
      // Check if this looks like an HTML tag (e.g., <span>, <div>)
      // Don't detect as HTML tag if we're in a style block
      if (!inStyleBlock) {
        const htmlTagOpening = line.includes('<' + word);
        const htmlTagClosing = line.includes('</' + word);
        const isHtmlTag = htmlTagOpening || htmlTagClosing || (line.match(new RegExp(`<${word}[\\s>]`)) !== null);

        // Common HTML tags list
        const htmlTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'strong', 'em', 'a', 'img', 'button', 'input', 'form', 'label',
                        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
                        'select', 'option', 'textarea', 'header', 'footer', 'nav', 'main', 'body',
                        'section', 'article', 'aside', 'code', 'pre', 'hr', 'br'];

        if (htmlTags.includes(word) && isHtmlTag) {
          // Create hover for HTML tag
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // First line: HTML tag example
          hover.appendCodeblock(`<${word}></${word}>`, 'html');

          // Add spacing
          hover.appendText('\n\n');

          // Add description and MDN link
          let tagDescription = '';

          switch (word) {
            case 'body':
              tagDescription = 'Main content of the HTML document. Contains all content that is visible to the user.';
              break;
            case 'div':
              tagDescription = 'Generic container element for flow content with no semantic meaning.';
              break;
            case 'span':
              tagDescription = 'Generic inline container with no semantic meaning. Used for styling or grouping text.';
              break;
            case 'p':
              tagDescription = 'Paragraph element representing a block of text.';
              break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
              tagDescription = `Level ${word.substring(1)} heading element. H1 is most important, H6 is least important.`;
              break;
            case 'strong':
              tagDescription = 'Indicates strong importance. Text is typically displayed in bold.';
              break;
            case 'em':
              tagDescription = 'Marks text that has stress emphasis. Text is typically displayed in italic.';
              break;
            case 'a':
              tagDescription = 'Anchor element for creating hyperlinks to other pages, files, or locations.';
              break;
            case 'img':
              tagDescription = 'Embeds an image into the document. Self-closing tag requiring src attribute.';
              break;
            case 'button':
              tagDescription = 'Clickable button element for forms or interactive elements.';
              break;
            case 'input':
              tagDescription = 'Form input element for user data entry. Requires type attribute.';
              break;
            case 'form':
              tagDescription = 'Container for a form with inputs and controls for user submission.';
              break;
            case 'ul':
              tagDescription = 'Unordered list container. Contains li elements.';
              break;
            case 'ol':
              tagDescription = 'Ordered (numbered) list container. Contains li elements.';
              break;
            case 'li':
              tagDescription = 'List item element. Used within ul or ol containers.';
              break;
            case 'table':
              tagDescription = 'Container for tabular data with rows and columns.';
              break;
            case 'pre':
              tagDescription = 'Preformatted text element. Preserves whitespace and line breaks.';
              break;
            case 'code':
              tagDescription = 'Represents computer code within a document.';
              break;
            case 'label':
              tagDescription = 'Label for a form element. Improves accessibility and usability.';
              break;
            default:
              tagDescription = `HTML ${word} element`;
              break;
          }

          hover.appendMarkdown(tagDescription);
          hover.appendMarkdown(`\n\n[MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${word})`);

          return new vscode.Hover(hover);
        }
      }

      // CSS ELEMENT SELECTORS in style blocks
      if (inStyleBlock) {
        // Common HTML/CSS elements
        const cssElements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                          'body', 'html', 'header', 'footer', 'main', 'section', 'article',
                          'nav', 'ul', 'ol', 'li', 'a', 'button', 'input', 'form', 'table',
                          'tr', 'td', 'th', 'pre', 'code', 'img', 'strong', 'em', 'label',
                          'select', 'option', 'textarea', 'style', 'script', 'link', 'meta'];

        if (cssElements.includes(word)) {
          // Make sure it's not preceded by a period (which would make it a class)
          const charBeforeWord = document.getText().charAt(document.offsetAt(wordRange.start) - 1);

          if (charBeforeWord !== '.') {
            // If we're in a style block, it's a CSS selector
            const hover = new vscode.MarkdownString();
            hover.isTrusted = true;
            hover.supportHtml = true;

            // First line: CSS element selector
            hover.appendCodeblock(`${word} { }`, 'css');

            // Add spacing
            hover.appendText('\n\n');

            // Description
            hover.appendMarkdown('**CSS Element Selector**\n\n');
            hover.appendMarkdown('Selects all elements with the specified tag name.\n\n');
            hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 0, 1)');

            return new vscode.Hover(hover);
          }
        }
      }

      // STX DIRECTIVES
      // Handle STX directives with detailed tooltips
      // Check if the word is a directive (starts with @)
      const isDirective = line.includes('@' + word) || beforeText.trim().endsWith('@');

      if (isDirective || word.startsWith('@')) {
        // Extract the directive name without the @ if needed
        const directiveName = word.startsWith('@') ? word.substring(1) : word;

        // Create hover content
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: directive
        hover.appendCodeblock(`@${directiveName}`, 'stx');

        // Add spacing
        hover.appendText('\n\n');

        // Add description based on directive
        let description = '';
        let syntax = '';
        let example = '';

        switch (directiveName.toLowerCase()) {
          case 'foreach':
            description = 'Iterates over an array or collection and renders the content once for each item.';
            syntax = '@foreach (collection as item[, index])';
            example = '@foreach (products as product)\n  <li>\\${product.name}: $\\${product.price}</li>\n@endforeach';
            break;
          case 'endforeach':
            description = 'Marks the end of a @foreach loop block.';
            syntax = '@endforeach';
            break;
          case 'if':
            description = 'Conditionally renders content if the expression evaluates to true.';
            syntax = '@if (condition)';
            example = '@if (user.isLoggedIn)\n  <span>Welcome, \\${user.name}!</span>\n@endif';
            break;
          case 'else':
            description = 'Provides an alternative content block to render when the preceding @if condition is false.';
            syntax = '@else';
            example = '@if (user.isAdmin)\n  <span>Admin Panel</span>\n@else\n  <span>User Dashboard</span>\n@endif';
            break;
          case 'elseif':
          case 'elif':
            description = 'Checks an additional condition when the preceding @if or @elseif condition is false.';
            syntax = '@elseif (condition)';
            example = '@if (user.isAdmin)\n  <span>Admin Panel</span>\n@elseif (user.isModerator)\n  <span>Moderator Panel</span>\n@else\n  <span>User Dashboard</span>\n@endif';
            break;
          case 'endif':
            description = 'Marks the end of an @if/@elseif/@else conditional block.';
            syntax = '@endif';
            break;
          case 'unless':
            description = 'Conditionally renders content if the expression evaluates to false (opposite of @if).';
            syntax = '@unless (condition)';
            example = '@unless (user.isLoggedIn)\n  <a href="/login">Log in</a>\n@endunless';
            break;
          case 'endunless':
            description = 'Marks the end of an @unless conditional block.';
            syntax = '@endunless';
            break;
          case 'include':
            description = 'Includes and renders a partial template at the current position.';
            syntax = '@include (path[, data])';
            example = '@include (\'partials/header.stx\', { title: \'Home Page\' })';
            break;
          case 'component':
            description = 'Renders a reusable component with the provided props.';
            syntax = '@component (name[, props])';
            example = '@component (\'Button\', { label: \'Submit\', type: \'primary\' })';
            break;
          case 'slot':
            description = 'Defines a named slot within a component that can be filled with content.';
            syntax = '@slot (name)';
            example = '@slot (\'header\')\n  <h1>Page Title</h1>\n@endslot';
            break;
          case 'endslot':
            description = 'Marks the end of a @slot content block.';
            syntax = '@endslot';
            break;
          case 'ts':
            description = 'Defines a TypeScript code block for client-side or server-side logic.';
            syntax = '@ts';
            example = '@ts\n  // TypeScript code here\n  const user = { name: \'John\', age: 30 };\n@endts';
            break;
          case 'endts':
            description = 'Marks the end of a TypeScript code block.';
            syntax = '@endts';
            break;
          case 'switch':
            description = 'Evaluates an expression and matches it against multiple cases.';
            syntax = '@switch (expression)';
            example = '@switch (user.role)\n  @case (\'admin\')\n    Admin Panel\n  @case (\'user\')\n    User Dashboard\n  @default\n    Access Denied\n@endswitch';
            break;
          case 'case':
            description = 'Defines a case to match within a @switch block.';
            syntax = '@case (value)';
            break;
          case 'default':
            description = 'Provides a default case within a @switch block when no other cases match.';
            syntax = '@default';
            break;
          case 'endswitch':
            description = 'Marks the end of a @switch block.';
            syntax = '@endswitch';
            break;
          case 'for':
            description = 'Creates a for loop with standard initialization, condition, and increment syntax.';
            syntax = '@for (initialization; condition; increment)';
            example = '@for (let i = 0; i < 5; i++)\n  <li>Item \\${i + 1}</li>\n@endfor';
            break;
          case 'endfor':
            description = 'Marks the end of a @for loop block.';
            syntax = '@endfor';
            break;
          case 'while':
            description = 'Creates a while loop that executes as long as the condition is true.';
            syntax = '@while (condition)';
            example = '@while (items.length > 0)\n  <li>\\${items.pop()}</li>\n@endwhile';
            break;
          case 'endwhile':
            description = 'Marks the end of a @while loop block.';
            syntax = '@endwhile';
            break;
          case 'continue':
            description = 'Skips the rest of the current iteration and moves to the next iteration of the loop.';
            syntax = '@continue';
            example = '@foreach (items as item)\n  @if (item.hidden)\n    @continue\n  @endif\n  <li>\\${item.name}</li>\n@endforeach';
            break;
          case 'break':
            description = 'Exits the current loop immediately.';
            syntax = '@break';
            example = '@foreach (items as item)\n  @if (item.isLast)\n    @break\n  @endif\n  <li>\\${item.name}</li>\n@endforeach';
            break;
          default:
            description = `STX directive: @${directiveName}`;
            break;
        }

        // Add description and syntax
        hover.appendMarkdown(description);

        if (syntax) {
          hover.appendMarkdown('\n\n**Syntax**\n');
          hover.appendCodeblock(syntax, 'stx');
        }

        if (example) {
          hover.appendMarkdown('\n\n**Example**\n');
          hover.appendCodeblock(example, 'stx');
        }

        return new vscode.Hover(hover);
      }

      // TYPESCRIPT KEYWORDS
      // Handle TypeScript keywords with proper tooltips
      const tsKeywords = ['const', 'let', 'var', 'function', 'interface', 'type', 'class', 'enum',
                        'import', 'export', 'return', 'async', 'await', 'if', 'else', 'for', 'while',
                        'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'throw',
                        'new', 'this', 'super', 'extends', 'implements'];

      if (tsKeywords.includes(word)) {
        // Create hover for TypeScript keyword
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: keyword
        hover.appendCodeblock(`${word}`, 'typescript');

        // Add spacing
        hover.appendText('\n\n');

        // Add description based on keyword
        let description = '';

        switch (word) {
          case 'const':
            description = 'Declares a constant whose value cannot be reassigned.';
            break;
          case 'let':
            description = 'Declares a block-scoped variable, optionally initializing it to a value.';
            break;
          case 'var':
            description = 'Declares a variable, optionally initializing it to a value.';
            break;
          case 'function':
            description = 'Declares a function with the specified parameters.';
            break;
          case 'interface':
            description = 'Declares an interface that defines the structure of an object.';
            break;
          case 'type':
            description = 'Defines a type alias for a more complex type definition.';
            break;
          case 'class':
            description = 'Declares a class definition for creating objects with shared properties and methods.';
            break;
          case 'enum':
            description = 'Defines a set of named constants.';
            break;
          case 'import':
            description = 'Imports bindings from a module.';
            break;
          case 'export':
            description = 'Exports declarations for use in other modules.';
            break;
          case 'return':
            description = 'Returns a value from a function.';
            break;
          case 'async':
            description = 'Declares an asynchronous function that returns a Promise.';
            break;
          case 'await':
            description = 'Pauses execution of an async function until a Promise is settled.';
            break;
          case 'if':
            description = 'Executes a statement if a specified condition is truthy.';
            break;
          case 'else':
            description = 'Specifies a block of code to be executed if the condition is falsy.';
            break;
          default:
            description = 'TypeScript keyword: ' + word;
            break;
        }

        hover.appendMarkdown(description);
        return new vscode.Hover(hover);
      }

      // If this is a property access, prioritize object property handling over CSS class
      if (isPropertyAccess) {
        // Handle property access
        const propertyMatch = beforeText.match(/(\w+)\.\s*$/);
        if (propertyMatch) {
          const objectName = propertyMatch[1];

          // Create virtual TS document uri
          const virtualUri = document.uri.with({
            scheme: 'stx-ts',
            path: document.uri.path + '.ts'
          });

          // Get TS content
          const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

          // Try to determine the object type
          let objectType = '';

          // Check if it's a loop variable from @foreach
          const foreachMatchLine = findForeachDeclarationForVariable(document, position.line, objectName);
          if (foreachMatchLine !== null) {
            const foreachLine = document.lineAt(foreachMatchLine).text;
            const foreachMatch = foreachLine.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/);
            if (foreachMatch) {
              const collectionName = foreachMatch[1].trim();

              // Get collection type
              const collectionTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${collectionName}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
              if (collectionTypeMatch) {
                const collectionType = collectionTypeMatch[1];
                // Extract item type from array type (e.g., Product[] -> Product)
                if (collectionType.includes('[]')) {
                  objectType = collectionType.replace('[]', '');
                } else if (collectionType.includes('Array<')) {
                  // Handle Array<Type>
                  const genericMatch = collectionType.match(/Array<([^>]+)>/);
                  if (genericMatch) {
                    objectType = genericMatch[1];
                  }
                }
              }
            }
          } else {
            // Check variable declarations
            const varTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${objectName}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
            if (varTypeMatch) {
              objectType = varTypeMatch[1];
            }
          }

          // If we found the object type, try to find the property type
          if (objectType) {
            // Create hover content
            const hover = new vscode.MarkdownString();
            hover.isTrusted = true;
            hover.supportHtml = true;

            // Find the interface/type definition
            const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${objectType}\\s*{([^}]*)}`, 's'));
            const typeMatch = tsContent.match(new RegExp(`type\\s+${objectType}\\s*=\\s*{([^}]*)}`, 's'));

            const interfaceContent = interfaceMatch ? interfaceMatch[1] :
                                    typeMatch ? typeMatch[1] : null;

            if (interfaceContent) {
              // Look for the property in the interface
              const propertyMatch = interfaceContent.match(new RegExp(`${word}\\s*:\\s*([^;]+);`));

              if (propertyMatch) {
                const propertyType = propertyMatch[1].trim();

                // First line: property with type
                hover.appendCodeblock(`(property) ${objectName}.${word}: ${propertyType}`, 'typescript');

                // Add spacing
                hover.appendText('\n\n');

                // Look for property JSDoc
                const allJsDocComments = virtualTsDocumentProvider.getJSDocComments(document.uri);
                const propJsDoc = allJsDocComments.find(doc =>
                  doc.symbol === word &&
                  doc.isProperty &&
                  doc.parentSymbol === objectType
                );

                if (propJsDoc) {
                  const formattedComment = formatJSDoc(propJsDoc.comment);
                  hover.appendMarkdown(formattedComment);
                } else {
                  // Generic description if no JSDoc
                  hover.appendMarkdown(`Property of \`${objectType}\` interface.`);
                }

                return new vscode.Hover(hover);
              }
            }
          }
        }
      }

      // Create virtual TS document
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      try {
        const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

        // First determine the symbol type more accurately
        let symbolType = "variable";
        const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${word}\\b`));
        const typeMatch = tsContent.match(new RegExp(`type\\s+${word}\\b`));
        const classMatch = tsContent.match(new RegExp(`class\\s+${word}\\b`));
        const functionMatch = tsContent.match(new RegExp(`function\\s+${word}\\b`));
        const constMatch = tsContent.match(new RegExp(`const\\s+${word}\\b`));
        const letMatch = tsContent.match(new RegExp(`let\\s+${word}\\b`));
        const varMatch = tsContent.match(new RegExp(`var\\s+${word}\\b`));

        // Check if this might be an HTML tag rather than a variable
        const htmlTagMatch = line.match(new RegExp(`<(/)?${word}(\\s|/?>|$)`));
        const commonHtmlTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                            'strong', 'em', 'a', 'img', 'button', 'input', 'form', 'label',
                            'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'pre', 'code',
                            'body', 'html', 'head', 'header', 'footer', 'main', 'section', 'article', 'aside'];
        const mightBeHtmlTag = htmlTagMatch !== null || (commonHtmlTags.includes(word) && line.includes('<'));

        // Skip variable processing for CSS class selectors
        if (inStyleBlock) {
          // Check if preceded by a period (which would make it a class)
          const charBeforeWord = document.getText().charAt(document.offsetAt(wordRange.start) - 1);
          if (charBeforeWord === '.') {
            return null;
          }
        }

        // Skip if this is a common HTML tag in a context that looks like HTML
        // This prevents it from being treated as a variable
        if (mightBeHtmlTag || commonHtmlTags.includes(word)) {
          return null;
        }

        // Skip if this is a word in a class attribute, as it was already handled
        if (isInClassAttribute && classesInAttribute.includes(word)) {
          return null;
        }

        // Look for variable type information
        let variableType = null;
        if ((constMatch || letMatch || varMatch) && !mightBeHtmlTag) {
          // Try to find type declaration like "const products: Product[]"
          const varTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
          if (varTypeMatch) {
            variableType = varTypeMatch[1];
          } else {
            // Try to infer from assignment
            const assignmentMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*=\\s*([^;]+)`, 'i'));
            if (assignmentMatch) {
              // Handle common cases
              const assignment = assignmentMatch[1].trim();
              if (assignment.startsWith('"') || assignment.startsWith("'")) {
                variableType = 'string';
              } else if (/^\d+(\.\d+)?$/.test(assignment)) {
                variableType = 'number';
              } else if (assignment === 'true' || assignment === 'false') {
                variableType = 'boolean';
              } else if (assignment.startsWith('[')) {
                variableType = 'array';
              } else if (assignment.startsWith('{')) {
                variableType = 'object';
              }
            }
          }
        }

        if (interfaceMatch) {
          symbolType = "interface";
        } else if (typeMatch) {
          symbolType = "type";
        } else if (classMatch) {
          symbolType = "class";
        } else if (functionMatch) {
          symbolType = "function";
        } else if (constMatch && !mightBeHtmlTag) {
          symbolType = "const";
        } else if (letMatch && !mightBeHtmlTag) {
          symbolType = "let";
        } else if (varMatch && !mightBeHtmlTag) {
          symbolType = "var";
        }

        // Check for JSDoc comment
        const jsDocComment = virtualTsDocumentProvider.getJSDocForSymbol(document.uri, word);

        // Create hover content
        const hoverContent = new vscode.MarkdownString();

        // Start with symbol type/name and include type information if available
        if (variableType) {
          hoverContent.appendCodeblock(`${symbolType} ${word}: ${variableType}`, 'typescript');
        } else {
          hoverContent.appendCodeblock(`${symbolType} ${word}`, 'typescript');
        }

        // Ensure proper spacing
        hoverContent.appendText('\n');

        // Add JSDoc content if available
        if (jsDocComment) {
          const formattedComment = formatJSDoc(jsDocComment);
          hoverContent.appendMarkdown(formattedComment);
        }

        return new vscode.Hover(hoverContent);
      } catch (error) {
        console.error('Error providing hover:', error);
      }

      return null;
    }
  };
}

/**
 * Get description for a transition type
 */
function getTransitionTypeDescription(type: TransitionType): string {
  switch(type) {
    case TransitionType.Fade:
      return 'Smooth opacity transitions - elements fade in or out';
    case TransitionType.Slide:
      return 'Elegant sliding movements - elements slide into or out of view';
    case TransitionType.Scale:
      return 'Size scaling effects - elements grow or shrink';
    case TransitionType.Flip:
      return '3D flipping animations - elements rotate in 3D space';
    case TransitionType.Rotate:
      return 'Rotation-based animations - elements rotate in 2D space';
    case TransitionType.Custom:
      return 'Custom animation - requires additional CSS definitions';
    default:
      return 'Unknown transition type';
  }
}

/**
 * Get description for a transition direction
 */
function getTransitionDirectionDescription(direction: TransitionDirection): string {
  switch(direction) {
    case TransitionDirection.In:
      return 'Element transitions in (appears)';
    case TransitionDirection.Out:
      return 'Element transitions out (disappears)';
    case TransitionDirection.Both:
      return 'Element transitions both in and out';
    default:
      return 'Unknown transition direction';
  }
}

/**
 * Get description for a transition easing function
 */
function getTransitionEaseDescription(ease: TransitionEase | string): string {
  switch(ease) {
    case TransitionEase.Linear:
    case 'linear':
      return 'Linear timing function (constant speed)';
    case TransitionEase.Ease:
    case 'ease':
      return 'Default easing function (slight acceleration and deceleration)';
    case TransitionEase.EaseIn:
    case 'ease-in':
      return 'Starts slowly, then speeds up';
    case TransitionEase.EaseOut:
    case 'ease-out':
      return 'Starts quickly, then slows down';
    case TransitionEase.EaseInOut:
    case 'ease-in-out':
      return 'Starts slowly, speeds up in the middle, then slows down at the end';
    default:
      return 'Custom easing function';
  }
}
