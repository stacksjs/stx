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

      // Skip processing normal text in HTML context
      const isInHtmlContext = !line.includes('@ts') &&
                            !line.includes('{{') &&
                            !isInStyleTag(document, position);

      // Check for HTML tag content
      const lineBeforeWord = line.substring(0, wordRange.start.character);
      const lineAfterWord = line.substring(wordRange.end.character);

      // Words that are likely part of regular text content
      const isCommonWord = /^(the|a|an|this|that|these|those|my|your|his|her|its|our|their|today|tomorrow|yesterday|is|are|was|were|am|be|been|being)$/i.test(word);

      // Check for contractions and possessives ('s)
      const isContractionOrPossessive = word.endsWith("'s") || word.endsWith("s'") ||
                                       word.includes("'") || // Any contraction (isn't, don't, etc.)
                                       lineAfterWord.trim().startsWith("'s"); // Word followed by 's

      // Check if inside sentence structure (surrounded by other words, not in code context)
      const isInSentence = (lineBeforeWord.trim().match(/[a-zA-Z]$/) || // Word after another word
                           lineAfterWord.trim().match(/^[a-zA-Z]/) ||  // Word before another word
                           lineBeforeWord.trim().match(/[:;,.]\s*$/)); // After punctuation

      // Check for punctuation in surrounding context (likely prose, not code)
      const hasPunctuation = lineBeforeWord.includes('.') || lineBeforeWord.includes(',') ||
                            lineBeforeWord.includes(':') || lineBeforeWord.includes(';') ||
                            lineAfterWord.includes('.') || lineAfterWord.includes(',');

      // Determine if this is likely normal text content
      const isPlainTextWord = isInHtmlContext &&
                            (isCommonWord ||
                             isContractionOrPossessive ||
                             isInSentence ||
                             hasPunctuation);

      // Check if word appears in an actual code context or looks like a variable
      const isInCodeExpression = line.includes('{{') && line.includes('}}');
      const isInAtExpression = line.includes('@') && (line.includes('(') || line.includes(')'));
      const looksLikeVariable = /^[a-z][a-zA-Z0-9]*$/.test(word) && word.length > 1; // camelCase pattern
      const looksLikeConstant = /^[A-Z][A-Z0-9_]*$/.test(word); // CONSTANT_CASE pattern

      // Check for common TypeScript/JavaScript keywords without using the pre-declared arrays
      const isTypescriptKeyword = ['const', 'let', 'var', 'function', 'interface', 'type', 'class', 'enum',
                                 'import', 'export', 'return', 'async', 'await', 'if', 'else', 'for', 'while',
                                 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'throw',
                                 'new', 'this', 'super', 'extends', 'implements', 'string', 'number', 'boolean',
                                 'any', 'void', 'undefined', 'null', 'never', 'object', 'symbol', 'unknown',
                                 'bigint', 'Array', 'Promise', 'Date'].includes(word);

      // Combined check: if it's plain text and NOT in a code context, skip the hover
      if (isPlainTextWord &&
          !(isInCodeExpression || isInAtExpression || looksLikeVariable || looksLikeConstant || isTypescriptKeyword)) {
        return null;
      }

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
                hover.appendMarkdown(`**Transition Type**: ${description}`);
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
              hover.appendMarkdown(`**Duration**: Transition duration in milliseconds (default: 300)`);
              return new vscode.Hover(hover);

            case 2: // Ease
              // Handle hyphenated values like 'ease-out'
              let description = '';

              // Map the string value to an enum value if possible
              const easingValues = Object.values(TransitionEase);
              const matchingEase = easingValues.find(v => v.toString() === fullParam);

              if (matchingEase || ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'].includes(fullParam)) {
                description = getTransitionEaseDescription(fullParam as TransitionEase);
                hover.appendMarkdown(`**Easing Function**: ${description}`);
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
                  hover.appendMarkdown(`**Easing Function**: ${description}`);
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
              hover.appendMarkdown(`**Delay**: Transition delay in milliseconds (default: 0)`);
              return new vscode.Hover(hover);

            case 4: // Direction
              if (Object.values(TransitionDirection).includes(fullParam as TransitionDirection)) {
                const description = getTransitionDirectionDescription(fullParam as TransitionDirection);
                hover.appendMarkdown(`**Direction**: ${description}`);
                hover.appendMarkdown(`\n\n**Available Directions**:`);
                hover.appendMarkdown(`\n- \`in\`: Element transitions in (appears)`);
                hover.appendMarkdown(`\n- \`out\`: Element transitions out (disappears)`);
                hover.appendMarkdown(`\n- \`both\`: Element transitions both in and out (default)`);
                return new vscode.Hover(hover);
              }
              break;
          }
        }

        // If we're hovering over the directive name itself
        if (word === 'transition' || wordRange.start.character <= line.indexOf('@transition') + 11) {
          let hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          hover.appendMarkdown('Applies animation transitions to elements based on specified parameters.');
          hover.appendMarkdown('\n\n**Syntax**\n');
          hover.appendCodeblock('@transition(type, duration?, ease?, delay?, direction?)', 'stx');
          hover.appendMarkdown('\n\n**Example**\n');
          hover.appendCodeblock('@transition(\'fade\', 500, \'ease-out\')\n  <div class="animated-content">This content will fade in/out</div>', 'stx');
          hover.appendMarkdown('\n\n**Parameters**\n');
          hover.appendMarkdown('- `type` (required): Animation type (\'fade\', \'slide\', \'scale\', \'flip\', \'rotate\', \'custom\')\n');
          hover.appendMarkdown('- `duration` (optional): Animation duration in milliseconds (default: 300)\n');
          hover.appendMarkdown('- `ease` (optional): Easing function (\'linear\', \'ease\', \'ease-in\', \'ease-out\', \'ease-in-out\')\n');
          hover.appendMarkdown('- `delay` (optional): Animation delay in milliseconds (default: 0)\n');
          hover.appendMarkdown('- `direction` (optional): Animation direction (\'in\', \'out\', \'both\')');

          return new vscode.Hover(hover);
        }
      }

      // Check if we're inside a motion directive
      const motionMatch = line.match(/@motion\((.*?)\)/);
      if (motionMatch && (word === 'true' || word === 'false' || word === 'motion')) {
        let hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        if (word === 'motion' || wordRange.start.character <= line.indexOf('@motion') + 7) {
          // Hovering over the directive name
          hover.appendMarkdown('Controls animation preferences based on user accessibility settings.');
          hover.appendMarkdown('\n\n**Syntax**\n');
          hover.appendCodeblock('@motion(enabled)', 'stx');
          hover.appendMarkdown('\n\n**Example**\n');
          hover.appendCodeblock('@motion(true)\n  <div class="animated-section">This respects user\'s motion preferences</div>', 'stx');
          hover.appendMarkdown('\n\n**Parameters**\n');
          hover.appendMarkdown('- `enabled` (required): Boolean indicating whether animations should be enabled\n');
          hover.appendMarkdown('\nWhen set to `true`, animations will only be shown to users who haven\'t requested reduced motion.\n');
          hover.appendMarkdown('When set to `false`, animations will be disabled for everyone.');
        } else {
          // Hovering over true/false parameter
          hover.appendMarkdown(`**Motion Preference**: ${word === 'true' ? 'Enables' : 'Disables'} animations based on user preference settings.`);
          hover.appendMarkdown(`\n\nWhen set to \`true\`, animations will be shown to users who haven't requested reduced motion.`);
          hover.appendMarkdown(`\n\nWhen set to \`false\`, no animations will be shown regardless of user preferences.`);
        }

        return new vscode.Hover(hover);
      }

      // Check if we're inside an animationGroup directive
      const animationGroupMatch = line.match(/@animationGroup\((.*?)\)/);
      if (animationGroupMatch) {
        // Check if the word is one of the parameters
        const params = animationGroupMatch[1].split(',').map(p => p.trim());

        // If hovering over the directive name
        if (word === 'animationGroup' || word === 'animationgroup' ||
            wordRange.start.character <= line.indexOf('@animationGroup') + 14) {
          let hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          hover.appendMarkdown('Groups elements for synchronized animations.');
          hover.appendMarkdown('\n\n**Syntax**\n');
          hover.appendCodeblock('@animationGroup(name, ...selectors)', 'stx');
          hover.appendMarkdown('\n\n**Example**\n');
          hover.appendCodeblock('@animationGroup(\'hero\', \'.header\', \'.main-content\', \'#cta-button\')', 'stx');
          hover.appendMarkdown('\n\n**Parameters**\n');
          hover.appendMarkdown('- `name` (required): Unique name for the animation group\n');
          hover.appendMarkdown('- `selectors` (required): One or more CSS selectors for elements to include in this group');

          return new vscode.Hover(hover);
        }
        // Check if we're hovering over parameter
        else if (params.some(p => p.replace(/['"`]/g, '') === word)) {
          let hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          const isGroupName = params[0].replace(/['"`]/g, '') === word;

          if (isGroupName) {
            hover.appendMarkdown(`**Animation Group Name**: Unique identifier for this animation group`);
          } else {
            hover.appendMarkdown(`**Element Selector**: CSS selector for elements to include in this animation group`);
          }

          return new vscode.Hover(hover);
        }
      }

      // Check if we're in a CSS/style block
      const inStyleBlock = isInStyleTag(document, position);

      // Check if this is a property access (e.g. product.name)
      const isPropertyAccess = line.substring(0, wordRange.start.character).trim().endsWith('.');

      // Handle dot notation objects (e.g., common.greeting in @t('common.greeting'))
      const isDotNotationString = /'([^']*\.[^']*)'/.test(line) || /"([^"]*\.[^"]*)"/.test(line) || /`([^`]*\.[^`]*)`/.test(line);
      const dotNotationMatch = line.match(/'([^']*\.[^']*)'/)?.[1] || line.match(/"([^"]*\.[^"]*)"/)?.[1] || line.match(/`([^`]*\.[^`]*)`/)?.[1];

      if (isDotNotationString && dotNotationMatch && dotNotationMatch.includes(word)) {
        // Handle translation keys like 'common.greeting'
        const parts = dotNotationMatch.split('.');
        if (parts.length === 2 && (parts[0] === word || parts[1] === word)) {
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          if (parts[0] === word) {
            // Show object structure for the namespace (e.g., 'common')
            hover.appendCodeblock(`// Translation namespace: ${word}`, 'typescript');
            hover.appendText('\n\n');
            hover.appendMarkdown(`Translation namespace containing localized strings.\n\n`);
            hover.appendCodeblock(`${word}: {
  ${parts[1]}: string,
  // ... other translation keys
}`, 'typescript');
          } else if (parts[1] === word) {
            // Show property info (e.g., 'greeting')
            hover.appendCodeblock(`// Translation key: ${parts[0]}.${word}`, 'typescript');
            hover.appendText('\n\n');
            hover.appendMarkdown(`Translation key for a localized string.`);
          }

          return new vscode.Hover(hover);
        }
      }

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

      // First check if this could be a directive - either with @ prefix or after @
      const atPosition = line.indexOf('@');
      const wordAfterAt = atPosition >= 0 && position.character > atPosition;
      const directiveMatch = line.match(/@(\w+)/);
      const possibleDirective = directiveMatch ? directiveMatch[1] : null;
      const isAtOrDirective = word.startsWith('@') || word === possibleDirective || wordAfterAt;

      if (isAtOrDirective) {
        // Extract the directive name without the @ if needed
        let directiveName = word;

        if (word.startsWith('@')) {
          directiveName = word.substring(1);
        } else if (wordAfterAt && possibleDirective === word) {
          directiveName = word;
        }

        // Skip if this is just a single "@" character or not a valid directive
        if (directiveName.length === 0 || directiveName === '@') {
          return null;
        }

        // List of valid STX directives
        const validDirectives = [
          'if', 'else', 'elseif', 'elif', 'endif',
          'unless', 'endunless',
          'for', 'endfor',
          'foreach', 'endforeach',
          'while', 'endwhile',
          'switch', 'case', 'default', 'endswitch',
          'component', 'endcomponent',
          'slot', 'endslot',
          'ts', 'endts',
          'include',
          'raw', 'endraw',
          'markdown', 'endmarkdown',
          't', 'translate',
          'continue', 'break',
          'transition', 'endtransition', 'animationGroup', 'motion' // Animation directives
        ];

        // Skip if not a valid directive
        if (!validDirectives.includes(directiveName.toLowerCase())) {
          return null;
        }

        // Create hover content
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // Add description based on directive
        let description = '';
        let syntax = '';
        let example = '';

        // Use lowercase for switch to ensure consistent matching
        const lowerDirective = directiveName.toLowerCase();

        switch (lowerDirective) {
          case 'foreach':
            description = 'Iterates over an array or collection and renders the content once for each item.';
            syntax = '@foreach (collection as item[, index])';
            example = '@foreach (products as product)\n  <li>\\${product.name}: $\\${product.price}</li>\n@endforeach';

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
          case 'endforeach':
            description = 'Marks the end of a @foreach loop block.';
            syntax = '@endforeach';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'if':
            description = 'Conditionally renders content if the expression evaluates to true.';
            syntax = '@if (condition)';
            example = '@if (user.isLoggedIn)\n  <span>Welcome, \\${user.name}!</span>\n@endif';

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
          case 'else':
            description = 'Provides an alternative content block to render when the preceding @if condition is false.';
            syntax = '@else';
            example = '@if (user.isAdmin)\n  <span>Admin Panel</span>\n@else\n  <span>User Dashboard</span>\n@endif';

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
          case 'elseif':
          case 'elif':
            description = 'Checks an additional condition when the preceding @if or @elseif condition is false.';
            syntax = '@elseif (condition)';
            example = '@if (user.isAdmin)\n  <span>Admin Panel</span>\n@elseif (user.isModerator)\n  <span>Moderator Panel</span>\n@else\n  <span>User Dashboard</span>\n@endif';

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
          case 'endif':
            description = 'Marks the end of an @if/@elseif/@else conditional block.';
            syntax = '@endif';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'unless':
            description = 'Conditionally renders content if the expression evaluates to false (opposite of @if).';
            syntax = '@unless (condition)';
            example = '@unless (user.isLoggedIn)\n  <a href="/login">Log in</a>\n@endunless';

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
          case 'endunless':
            description = 'Marks the end of an @unless conditional block.';
            syntax = '@endunless';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'include':
            description = 'Includes and renders a partial template at the current position.';
            syntax = '@include (path[, data])';
            example = '@include (\'partials/header.stx\', { title: \'Home Page\' })';

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
          case 'component':
            description = 'Renders a reusable component with the provided props.';
            syntax = '@component (name[, props])';
            example = '@component (\'Button\', { label: \'Submit\', type: \'primary\' })';

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
          case 'slot':
            description = 'Defines a named slot within a component that can be filled with content.';
            syntax = '@slot (name)';
            example = '@slot (\'header\')\n  <h1>Page Title</h1>\n@endslot';

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
          case 'endslot':
            description = 'Marks the end of a @slot content block.';
            syntax = '@endslot';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'ts':
            description = 'Defines a TypeScript code block for client-side or server-side logic.';
            syntax = '@ts';
            example = '@ts\n  // TypeScript code here\n  const user = { name: \'John\', age: 30 };\n@endts';

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
          case 'endts':
            description = 'Marks the end of a TypeScript code block.';
            syntax = '@endts';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'switch':
            description = 'Evaluates an expression and matches it against multiple cases.';
            syntax = '@switch (expression)';
            example = '@switch (user.role)\n  @case (\'admin\')\n    Admin Panel\n  @case (\'user\')\n    User Dashboard\n  @default\n    Access Denied\n@endswitch';

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
          case 'case':
            description = 'Defines a case to match within a @switch block.';
            syntax = '@case (value)';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'default':
            description = 'Provides a default case within a @switch block when no other cases match.';
            syntax = '@default';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'endswitch':
            description = 'Marks the end of a @switch block.';
            syntax = '@endswitch';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'for':
            description = 'Creates a for loop with standard initialization, condition, and increment syntax.';
            syntax = '@for (initialization; condition; increment)';
            example = '@for (let i = 0; i < 5; i++)\n  <li>Item \\${i + 1}</li>\n@endfor';

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
          case 'endfor':
            description = 'Marks the end of a @for loop block.';
            syntax = '@endfor';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'while':
            description = 'Creates a while loop that executes as long as the condition is true.';
            syntax = '@while (condition)';
            example = '@while (items.length > 0)\n  <li>\\${items.pop()}</li>\n@endwhile';

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
          case 'endwhile':
            description = 'Marks the end of a @while loop block.';
            syntax = '@endwhile';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'continue':
            description = 'Skips the rest of the current iteration and moves to the next iteration of the loop.';
            syntax = '@continue';
            example = '@foreach (items as item)\n  @if (item.hidden)\n    @continue\n  @endif\n  <li>\\${item.name}</li>\n@endforeach';

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
          case 'break':
            description = 'Exits the current loop immediately.';
            syntax = '@break';
            example = '@foreach (items as item)\n  @if (item.isLast)\n    @break\n  @endif\n  <li>\\${item.name}</li>\n@endforeach';

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
          case 't':
          case 'translate':
            description = 'Renders translated text using the specified translation key.';
            syntax = lowerDirective === 't' ?
                    '@t(key[, parameters])' :
                    '@translate(key[, parameters])';
            example = lowerDirective === 't' ?
                     "@t('common.greeting', { name: user.name })" :
                     "@translate('common.welcome', { company: 'Acme Inc.' })";

            // Add more details about how translation works
            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            // Add specific details about translation keys
            hover.appendMarkdown('\n\n**Translation Keys**\n');
            hover.appendMarkdown('Translation keys use dot notation to organize strings:\n');
            hover.appendCodeblock(`common.greeting: "Hello, {name}"
common.welcome: "Welcome to {company}"
errors.notFound: "Page not found"`, 'yaml');

            hover.appendMarkdown('\n\n**Parameter Passing**\n');
            hover.appendMarkdown('Pass parameters as an object to replace placeholders in translation strings:');
            hover.appendCodeblock(`@t('common.greeting', { name: user.name })
// If translation is "Hello, {name}", outputs: "Hello, John"`, 'stx');

            return new vscode.Hover(hover);
          case 'transition':
            description = 'Applies animation transitions to elements based on specified parameters.';
            syntax = '@transition(type, duration?, ease?, delay?, direction?)';
            example = '@transition(\'fade\', 500, \'ease-out\')\n  <div class="animated-content">This content will fade in/out</div>';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            hover.appendMarkdown('\n\n**Parameters**\n');
            hover.appendMarkdown('- `type` (required): Animation type (\'fade\', \'slide\', \'scale\', \'flip\', \'rotate\', \'custom\')\n');
            hover.appendMarkdown('- `duration` (optional): Animation duration in milliseconds (default: 300)\n');
            hover.appendMarkdown('- `ease` (optional): Easing function (\'linear\', \'ease\', \'ease-in\', \'ease-out\', \'ease-in-out\')\n');
            hover.appendMarkdown('- `delay` (optional): Animation delay in milliseconds (default: 0)\n');
            hover.appendMarkdown('- `direction` (optional): Animation direction (\'in\', \'out\', \'both\')');

            return new vscode.Hover(hover);
          case 'animationgroup':
            description = 'Groups elements for synchronized animations.';
            syntax = '@animationGroup(name, ...selectors)';
            example = '@animationGroup(\'hero\', \'.header\', \'.main-content\', \'#cta-button\')';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            hover.appendMarkdown('\n\n**Parameters**\n');
            hover.appendMarkdown('- `name` (required): Unique name for the animation group\n');
            hover.appendMarkdown('- `selectors` (required): One or more CSS selectors for elements to include in this group');

            return new vscode.Hover(hover);
          case 'motion':
            description = 'Controls animation preferences based on user accessibility settings.';
            syntax = '@motion(enabled)';
            example = '@motion(true)\n  <div class="animated-section">This respects user\'s motion preferences</div>';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            hover.appendMarkdown('\n\n**Parameters**\n');
            hover.appendMarkdown('- `enabled` (required): Boolean indicating whether animations should be enabled\n');
            hover.appendMarkdown('\nWhen set to `true`, animations will only be shown to users who haven\'t requested reduced motion.\n');
            hover.appendMarkdown('When set to `false`, animations will be disabled for everyone.');

            return new vscode.Hover(hover);
          case 'endtransition':
            description = 'Marks the end of a @transition block.';
            syntax = '@endtransition';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'markdown':
            description = 'Embeds Markdown content that will be rendered as HTML in the output.';
            syntax = '@markdown\n    # Markdown content\n    Text with **bold** and *italic*\n@endmarkdown';
            example = '@markdown\n    # Product Details\n    \n    This **premium** product includes:\n    - Feature 1\n    - Feature 2\n@endmarkdown';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            // Add markdown formatting guide
            hover.appendMarkdown('\n\n**Markdown Formatting**\n');
            hover.appendMarkdown('- Headings: `# H1`, `## H2`, etc.\n');
            hover.appendMarkdown('- Bold: `**bold text**`\n');
            hover.appendMarkdown('- Italic: `*italic text*`\n');
            hover.appendMarkdown('- Lists: `- item` or `1. item`\n');
            hover.appendMarkdown('- Links: `[text](url)`\n');
            hover.appendMarkdown('- Code: `` `code` `` or ````code block````');

            return new vscode.Hover(hover);
          case 'endmarkdown':
            description = 'Marks the end of a Markdown content block.';
            syntax = '@endmarkdown';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          case 'raw':
            description = 'Displays content exactly as is, without processing any STX expressions or directives.';
            syntax = '@raw\n    Content to display verbatim\n@endraw';
            example = '@raw\n    <div>\n        Using {{ curly braces }} that should not be processed\n        @if (true) This is not a directive @endif\n    </div>\n@endraw';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            if (example) {
              hover.appendMarkdown('\n\n**Example**\n');
              hover.appendCodeblock(example, 'stx');
            }

            hover.appendMarkdown('\n\n**Use Cases**\n');
            hover.appendMarkdown('- Displaying syntax examples that use STX syntax\n');
            hover.appendMarkdown('- Including content that contains curly braces or @ symbols\n');
            hover.appendMarkdown('- Showing code snippets that should not be processed');

            return new vscode.Hover(hover);
          case 'endraw':
            description = 'Marks the end of a raw content block.';
            syntax = '@endraw';

            hover.appendMarkdown(description);

            if (syntax) {
              hover.appendMarkdown('\n\n**Syntax**\n');
              hover.appendCodeblock(syntax, 'stx');
            }

            return new vscode.Hover(hover);
          default:
            description = `STX directive: @${directiveName}`;


            hover.appendMarkdown(description);
            return new vscode.Hover(hover);
        }
      }

      // TYPESCRIPT KEYWORDS
      // Handle TypeScript keywords with proper tooltips
      // TypeScript primitive types handled by isTypescriptKeyword defined earlier

      // Check if we're in a type annotation context (e.g., ": number" in an interface or variable declaration)
      const isInTypeAnnotation = line.substring(0, wordRange.end.character).match(/:\s*\w*$/);

      // Also check if the word appears after a colon in a property definition context
      const propertyTypeMatch = line.match(/\b\w+\s*:\s*(\w+)/);
      const isPropertyType = propertyTypeMatch && propertyTypeMatch[1] === word;

      // List of TypeScript types
      const typesList = ['string', 'number', 'boolean', 'any', 'void', 'undefined', 'null', 'never',
                        'object', 'symbol', 'unknown', 'bigint', 'Array', 'Promise', 'Date'];

      if (isTypescriptKeyword ||
          (isInTypeAnnotation && typesList.includes(word)) ||
          (isPropertyType && typesList.includes(word))) {
        // Create hover for TypeScript keyword
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        let isType = typesList.includes(word) ||
                     (isInTypeAnnotation && typesList.includes(word)) ||
                     (isPropertyType && typesList.includes(word));

        // First line: keyword or type
        if (isType) {
          hover.appendCodeblock(`type ${word}`, 'typescript');
        } else {
          hover.appendCodeblock(`${word}`, 'typescript');
        }

        // Add spacing
        hover.appendText('\n\n');

        // Add description based on keyword
        let description = '';

        switch (word) {
          // TS Keywords
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

          // TS Types
          case 'string':
            description = 'Represents textual data, a sequence of characters.';
            break;
          case 'number':
            description = 'Represents numeric values (integers and floating-point values).';
            break;
          case 'boolean':
            description = 'Represents a logical value: true or false.';
            break;
          case 'any':
            description = 'Represents any JavaScript value with no constraints.';
            break;
          case 'void':
            description = 'Represents the absence of a value, commonly used as a function return type.';
            break;
          case 'undefined':
            description = 'Represents a value that is not defined or initialized.';
            break;
          case 'null':
            description = 'Represents the intentional absence of any object value.';
            break;
          case 'never':
            description = 'Represents a type of values that never occur (used for functions that never return or always throw).';
            break;
          case 'object':
            description = 'Represents non-primitive types (anything that is not number, string, boolean, symbol, null, or undefined).';
            break;
          case 'symbol':
            description = 'Represents a unique and immutable primitive value.';
            break;
          case 'unknown':
            description = 'Similar to any, but safer because it requires type checking before operations can be performed.';
            break;
          case 'bigint':
            description = 'Represents whole numbers larger than 2^53 - 1.';
            break;
          case 'Array':
            description = 'Represents a collection of values (use Array<type> or type[] syntax).';
            break;
          case 'Promise':
            description = 'Represents a value that might be available now, in the future, or never.';
            break;
          case 'Date':
            description = 'Represents dates and times.';
            break;
          default:
            description = isType ? 'TypeScript type: ' + word : 'TypeScript keyword: ' + word;
            break;
        }

        hover.appendMarkdown(description);
        return new vscode.Hover(hover);
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

        // Check for arrow function pattern
        const arrowFunctionMatch = tsContent.match(new RegExp(`const\\s+${word}\\s*=\\s*\\([^)]*\\)\\s*:[^=]+=>`, 's'));
        const isArrowFunction = arrowFunctionMatch !== null;

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
        let variableInterface = null;

        if ((constMatch || letMatch || varMatch) && !mightBeHtmlTag) {
          // Try to find type declaration like "const products: Product[]"
          const varTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
          if (varTypeMatch) {
            variableType = varTypeMatch[1];

            // Try to find the interface or type definition for this type
            const interfaceDef = tsContent.match(new RegExp(`interface\\s+${variableType.replace('[]', '')}\\s*{([^}]*)}`, 's'));
            if (interfaceDef) {
              variableInterface = interfaceDef[1].trim();
            } else {
              const typeDef = tsContent.match(new RegExp(`type\\s+${variableType.replace('[]', '')}\\s*=\\s*{([^}]*)}`, 's'));
              if (typeDef) {
                variableInterface = typeDef[1].trim();
              }
            }
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

                // Try to parse object structure
                const objectMatch = assignment.match(/{([^}]*)}/);
                if (objectMatch) {
                  variableInterface = objectMatch[1].trim();
                }
              } else {
                // Try to extract type from function call
                const functionCallMatch = assignment.match(/(\w+)\(\)/);
                if (functionCallMatch) {
                  const functionName = functionCallMatch[1];

                  // Look for the function's return type
                  const functionReturnMatch = tsContent.match(new RegExp(`function\\s+${functionName}\\s*\\(.*\\)\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
                  if (functionReturnMatch) {
                    variableType = functionReturnMatch[1];

                    // Now try to find the interface definition
                    const returnInterfaceMatch = tsContent.match(new RegExp(`interface\\s+${variableType.replace('[]', '')}\\s*{([^}]*)}`, 's'));
                    if (returnInterfaceMatch) {
                      variableInterface = returnInterfaceMatch[1].trim();
                    }
                  }
                }
              }
            }
          }
        }

        // Set symbol type based on our detections
        if (isArrowFunction) {
          symbolType = "function";
          console.log(`Detected arrow function: ${word}`);
        } else if (interfaceMatch) {
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

        // Get all JSDoc info for this symbol to access type information
        const allJsDocs = virtualTsDocumentProvider.getJSDocComments(document.uri);
        const symbolJsDocInfo = allJsDocs.find(doc => doc.symbol === word);

        // For functions, get return type info
        const functionInfo = functionMatch ?
          allJsDocs.find(doc => doc.symbol === word && doc.symbolType === 'function' && doc.returnType) :
          null;

        // Get interface reference info for better type display
        const interfaceInfo = allJsDocs.find(
          doc => doc.symbol === word && doc.symbolType === 'interface-reference' && doc.interfaceContent
        );

        // Special handling for arrow functions - directly extract the signature
        let arrowFunctionSignature = null;
        if (isArrowFunction) {
          console.log(`Processing arrow function: ${word}`);
          // Extract the function signature directly from the source
          const arrowFunctionMatch = tsContent.match(new RegExp(`const\\s+${word}\\s*=\\s*(\\([^)]*\\))\\s*:\\s*([\\w\\[\\]<>|\\s]+)\\s*=>`, 's'));
          if (arrowFunctionMatch) {
            const params = arrowFunctionMatch[1];
            const returnTypeStr = arrowFunctionMatch[2].trim();
            arrowFunctionSignature = `${params}: ${returnTypeStr}`;
            console.log(`Extracted arrow function signature: ${arrowFunctionSignature}`);
          }
        }

        // Create hover content
        const hoverContent = new vscode.MarkdownString();
        hoverContent.isTrusted = true;
        hoverContent.supportHtml = true;

        // Start with symbol type/name and include type information if available
        if (arrowFunctionSignature) {
          // Direct display for arrow functions using the signature we extracted
          hoverContent.appendCodeblock(`${symbolType} ${word} = ${arrowFunctionSignature} => { ... }`, 'typescript');
          console.log(`Displaying arrow function signature: ${arrowFunctionSignature}`);
        } else if (functionInfo) {
          // Handle functions with return type info
          const returnType = functionInfo.returnType;

          // Check if it's an arrow function (if symbol type is const/let/var)
          const isArrowFunction = constMatch || letMatch || varMatch;

          // Look for function signature
          const functionSignatureInfo = allJsDocs.find(
            doc => doc.symbol === word && doc.symbolType === 'function-signature' && doc.fullSignature
          );

          console.log(`Function hover for ${word}:`, functionSignatureInfo ? 'Found signature info' : 'No signature info');

          // If we have the full signature, use it
          if (functionSignatureInfo && functionSignatureInfo.fullSignature) {
            console.log(`Using full signature for ${word}: ${functionSignatureInfo.fullSignature}`);
            if (isArrowFunction) {
              hoverContent.appendCodeblock(`${symbolType} ${word} = ${functionSignatureInfo.fullSignature} => { ... }`, 'typescript');
            } else {
              hoverContent.appendCodeblock(`function ${word}${functionSignatureInfo.fullSignature}`, 'typescript');
            }
          } else if (isArrowFunction) {
            hoverContent.appendCodeblock(`${symbolType} ${word} = (): ${returnType} => { ... }`, 'typescript');
          } else {
            hoverContent.appendCodeblock(`function ${word}(): ${returnType}`, 'typescript');
          }

          // If we have the interface definition for the return type, show it
          const returnTypeInterfaceInfo = allJsDocs.find(
            doc => doc.symbol === returnType && doc.symbolType === 'interface' && doc.interfaceContent
          );

          // For union types like "User | null", try to find the main type's interface
          if (!returnTypeInterfaceInfo && returnType && returnType.includes('|')) {
            const types = returnType.split('|').map(t => t.trim());
            const nonNullTypes = types.filter(t => t !== 'null' && t !== 'undefined');

            if (nonNullTypes.length > 0) {
              const mainType = nonNullTypes[0];
              const mainTypeInfo = allJsDocs.find(
                doc => doc.symbol === mainType && doc.symbolType === 'interface' && doc.interfaceContent
              );

              if (mainTypeInfo) {
                hoverContent.appendText('\n\n');
                hoverContent.appendCodeblock(`// Return type:
interface ${mainType} {
  ${mainTypeInfo.interfaceContent}
}`, 'typescript');
              }
            }
          } else if (returnTypeInterfaceInfo) {
            hoverContent.appendText('\n\n');
            hoverContent.appendCodeblock(`// Return type:
interface ${returnType} {
  ${returnTypeInterfaceInfo.interfaceContent}
}`, 'typescript');
          } else if (interfaceInfo) {
            // If we have a direct interface reference for the function
            hoverContent.appendText('\n\n');
            hoverContent.appendCodeblock(`// Return type structure:
{
  ${interfaceInfo.interfaceContent}
}`, 'typescript');
          }
        } else if (symbolJsDocInfo && symbolJsDocInfo.variableType) {
          // If we have detailed type information from our enhanced JSDocInfo
          const typeInfo = symbolJsDocInfo.variableType;
          hoverContent.appendCodeblock(`${symbolType} ${word}: ${typeInfo}`, 'typescript');

          // If we have the interface content, show the full type structure
          if (interfaceInfo && interfaceInfo.interfaceContent) {
            hoverContent.appendText('\n\n');
            hoverContent.appendCodeblock(`// Type structure:
interface ${typeInfo} {
  ${interfaceInfo.interfaceContent}
}`, 'typescript');
          }
        } else if (variableType) {
          hoverContent.appendCodeblock(`${symbolType} ${word}: ${variableType}`, 'typescript');

          // If we have the interface definition, show it too
          if (variableInterface) {
            hoverContent.appendText('\n\n');

            // Nicely format the type structure
            if (variableType.endsWith('[]')) {
              // For arrays, show the item type structure
              hoverContent.appendCodeblock(`// Array of:
interface ${variableType.replace('[]', '')} {
  ${variableInterface}
}`, 'typescript');
            } else {
              hoverContent.appendCodeblock(`// Type structure:
interface ${variableType} {
  ${variableInterface}
}`, 'typescript');
            }
          }
        } else {
          // Try to infer variable type if possible
          // Check if a variable is initialized with a method call
          const methodCallMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*=\\s*([^;]+\\.\\w+\\(\\))`, 'i'));
          if (methodCallMatch) {
            const methodCall = methodCallMatch[1];
            const dateMethodsReturningString = ['toLocaleDateString', 'toLocaleTimeString', 'toISOString', 'toString', 'toTimeString', 'toDateString'];
            const dateMethodsReturningNumber = ['getTime', 'valueOf', 'getFullYear', 'getMonth', 'getDate'];

            let inferredType = null;

            // Try to infer from method call
            for (const method of dateMethodsReturningString) {
              if (methodCall.includes(`.${method}(`)) {
                inferredType = 'string';
                break;
              }
            }

            if (!inferredType) {
              for (const method of dateMethodsReturningNumber) {
                if (methodCall.includes(`.${method}(`)) {
                  inferredType = 'number';
                  break;
                }
              }
            }

            if (inferredType) {
              hoverContent.appendCodeblock(`${symbolType} ${word}: ${inferredType}`, 'typescript');

              // Add a note about inferred type
              hoverContent.appendText('\n\n');
              hoverContent.appendMarkdown(`_Type inferred from method call: \`${methodCall}\`_`);
              return new vscode.Hover(hoverContent);
            }
          }

          // Also check for new instances
          const newInstanceMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*=\\s*new\\s+(\\w+)`, 'i'));
          if (newInstanceMatch) {
            const className = newInstanceMatch[1];
            hoverContent.appendCodeblock(`${symbolType} ${word}: ${className}`, 'typescript');

            // Add a note about inferred type
            hoverContent.appendText('\n\n');
            hoverContent.appendMarkdown(`_Instance of \`${className}\`_`);
            return new vscode.Hover(hoverContent);
          }

          // Default case if no type inference succeeded
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
