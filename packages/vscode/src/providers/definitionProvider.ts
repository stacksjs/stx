import * as vscode from 'vscode';
import { VirtualTsDocumentProvider } from './virtualTsDocumentProvider';
import { findCssDefinitionForClass } from '../utils/cssUtils';
import { extractTemplatePath, resolveTemplatePath, getTemplatePathRange } from '../utils/templateUtils';

export function createDefinitionProvider(virtualTsDocumentProvider: VirtualTsDocumentProvider): vscode.DefinitionProvider {
  return {
    async provideDefinition(document, position, token) {
      // Get the word at the position
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) {
        return null;
      }

      const word = document.getText(wordRange);
      const line = document.lineAt(position.line).text;

      // Check if we're in a template path (within an @include or @component directive)
      // This handles both regular includes and conditional includes
      const isRegularDirective = /@(include|component)\s*\(/.test(line);
      const isConditionalDirective = /@(includeIf|includeWhen|includeUnless|includeFirst)\s*\([^,]*,/.test(line);

      if (isRegularDirective || isConditionalDirective) {
        const templatePath = extractTemplatePath(line);
        if (templatePath) {
          // Check if cursor is within the template path string
          const templatePathRange = getTemplatePathRange(document, position.line);
          if (templatePathRange && templatePathRange.contains(position)) {
            // Resolve the template path to a file
            const resolvedUri = resolveTemplatePath(document.uri, templatePath);
            if (resolvedUri) {
              return new vscode.Location(resolvedUri, new vscode.Position(0, 0));
            }
          }
        }
      }

      // Check if we're in a class attribute (class="note" or className="note")
      const classAttributeRegex = /(class|className)\s*=\s*["']([^"']*)["']/g;
      let classAttributeMatch;
      let isInClassAttribute = false;

      // Reset regex state
      classAttributeRegex.lastIndex = 0;

      while ((classAttributeMatch = classAttributeRegex.exec(line)) !== null) {
        const attributeStart = classAttributeMatch.index;
        const attributeValueStart = attributeStart + classAttributeMatch[0].indexOf(classAttributeMatch[2]);
        const attributeValueEnd = attributeValueStart + classAttributeMatch[2].length;

        // Check if our position is within the class attribute value
        if (position.character >= attributeValueStart && position.character <= attributeValueEnd) {
          isInClassAttribute = true;
          const classesInAttribute = classAttributeMatch[2].split(/\s+/);

          // Check if the word under cursor is one of these classes
          if (classesInAttribute.includes(word)) {
            // Look for the CSS class definition
            const cssDefinition = findCssDefinitionForClass(document, word);
            if (cssDefinition) {
              return new vscode.Location(
                document.uri,
                new vscode.Position(cssDefinition.line, cssDefinition.character)
              );
            }
          }
          break;
        }
      }

      // Check if this is a CSS class selector (in a style tag)
      const text = document.getText();
      const offset = document.offsetAt(position);
      if (offset > 0 && text.charAt(offset - 1) === '.') {
        // This is likely a CSS class selector (.className)
        // We're already at the definition, so no need to navigate
        return null;
      }

      // Create virtual TS document uri
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      try {
        // Get TS content
        const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);
        const tsLines = tsContent.split('\n');

        // First, check for declarations in the current file
        for (let i = 0; i < tsLines.length; i++) {
          const line = tsLines[i];

          // Look for interface, type, const or let declarations
          const isDeclaration =
            line.includes(`interface ${word}`) ||
            line.includes(`type ${word}`) ||
            line.includes(`const ${word}`) ||
            line.includes(`let ${word}`) ||
            line.includes(`function ${word}`);

          if (isDeclaration) {
            // Convert TS position back to STX position
            const tsPosition = new vscode.Position(i, line.indexOf(word));
            const stxPosition = virtualTsDocumentProvider.getStxPositionFromTs(document.uri, tsPosition);

            if (stxPosition) {
              return new vscode.Location(
                document.uri,
                new vscode.Range(stxPosition, stxPosition.translate(0, word.length))
              );
            }
          }
        }

        // Check for JSDoc comments
        const jsDocComments = virtualTsDocumentProvider.getJSDocComments(document.uri);
        const jsDocForSymbol = jsDocComments.find(comment => comment.symbol === word);

        if (jsDocForSymbol) {
          const jsDocLine = jsDocForSymbol.line;
          return new vscode.Location(
            document.uri,
            new vscode.Position(jsDocLine, 0)
          );
        }
      } catch (error) {
        console.error('Error providing definition:', error);
      }

      return null;
    }
  };
}
