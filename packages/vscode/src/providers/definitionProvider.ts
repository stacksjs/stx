import * as vscode from 'vscode';
import { VirtualTsDocumentProvider } from './virtualTsDocumentProvider';

export function createDefinitionProvider(virtualTsDocumentProvider: VirtualTsDocumentProvider): vscode.DefinitionProvider {
  return {
    async provideDefinition(document, position, token) {
      // Get the word at the position
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) {
        return null;
      }

      const word = document.getText(wordRange);

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