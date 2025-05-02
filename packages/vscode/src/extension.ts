import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

// Interface for mapping positions between STX and TypeScript
interface PositionMapping {
  stxLine: number;
  stxChar: number;
  tsLine: number;
  tsChar: number;
  length: number;
}

export function activate(context: vscode.ExtensionContext) {
  // Create virtual TypeScript files for each STX file to support language features
  const virtualTsDocumentProvider = new class implements vscode.TextDocumentContentProvider {
    // Track all STX documents that have been opened
    private stxDocuments = new Map<string, vscode.TextDocument>();

    // Track derived TS content to avoid unnecessary updates
    private derivedTsContent = new Map<string, string>();

    // Track position mappings between STX and TypeScript files
    private positionMappings = new Map<string, PositionMapping[]>();

    // Event emitter for content changes
    private _onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this._onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
      // Virtual TS document path: stx-ts:/path/to/file.stx.ts
      // Original STX path: file:/path/to/file.stx
      const originalPath = uri.path.replace(/\.ts$/, '');
      const documentUri = vscode.Uri.file(originalPath);
      const key = documentUri.toString();

      // Get content from cache if available
      if (this.derivedTsContent.has(key)) {
        return this.derivedTsContent.get(key) || '';
      }

      // Extract TypeScript from STX file
      const document = this.stxDocuments.get(key) ||
                       vscode.workspace.textDocuments.find(doc => doc.uri.toString() === key);

      if (document) {
        const { content, mappings } = this.extractTypeScriptFromStx(document);
        this.derivedTsContent.set(key, content);
        this.positionMappings.set(key, mappings);
        return content;
      }

      return '// No TypeScript content found';
    }

    extractTypeScriptFromStx(document: vscode.TextDocument): { content: string, mappings: PositionMapping[] } {
      try {
        const text = document.getText();
        let tsContent = '';
        const mappings: PositionMapping[] = [];
        let tsLineCounter = 0;

        // Extract TypeScript from @ts blocks
        const tsBlockRegex = /@ts\s+([\s\S]*?)@endts/g;
        let blockMatch;

        while ((blockMatch = tsBlockRegex.exec(text)) !== null) {
          const blockContent = blockMatch[1];
          const blockStartPos = document.positionAt(blockMatch.index + blockMatch[0].indexOf(blockContent));

          // Add each line with position mapping
          const blockLines = blockContent.split('\n');
          for (let i = 0; i < blockLines.length; i++) {
            const line = blockLines[i];
            tsContent += line + '\n';

            // Create position mapping for this line
            mappings.push({
              stxLine: blockStartPos.line + i,
              stxChar: i === 0 ? blockStartPos.character : 0,
              tsLine: tsLineCounter,
              tsChar: 0,
              length: line.length
            });

            tsLineCounter++;
          }

          // Add an extra newline for separation
          tsContent += '\n';
          tsLineCounter++;
        }

        // Extract TypeScript from {{ }} expressions
        const tsExpressionRegex = /{{([\s\S]*?)}}/g;
        let exprMatch;
        let exprCounter = 0;

        while ((exprMatch = tsExpressionRegex.exec(text)) !== null) {
          const exprContent = exprMatch[1].trim();
          const exprStartPos = document.positionAt(exprMatch.index + 2); // +2 to skip {{

          // Add as TypeScript variable declaration
          const varDecl = `const expr${exprCounter} = ${exprContent};\n`;
          tsContent += varDecl;

          // Create position mapping for this expression
          mappings.push({
            stxLine: exprStartPos.line,
            stxChar: exprStartPos.character,
            tsLine: tsLineCounter,
            tsChar: varDecl.indexOf(exprContent),
            length: exprContent.length
          });

          tsLineCounter++;
          exprCounter++;
        }

        // Add interface and type declarations to help with intellisense
        // First see if there are any interfaces/types in the TS content
        const interfaceMatch = text.match(/@ts\s+interface\s+(\w+)/);
        const typeMatch = text.match(/@ts\s+type\s+(\w+)/);

        return { content: tsContent, mappings };
      } catch (error) {
        console.error('Error extracting TypeScript from STX:', error);
        return { content: '// Error extracting TypeScript content', mappings: [] };
      }
    }

    // Get TypeScript position from STX position
    getTsPositionFromStx(stxUri: vscode.Uri, stxPosition: vscode.Position): vscode.Position | undefined {
      const key = stxUri.toString();
      const mappings = this.positionMappings.get(key);

      if (!mappings) {
        return undefined;
      }

      // Find the mapping that contains this position
      for (const mapping of mappings) {
        if (mapping.stxLine === stxPosition.line) {
          const charOffset = stxPosition.character - mapping.stxChar;
          if (charOffset >= 0 && charOffset < mapping.length) {
            return new vscode.Position(mapping.tsLine, mapping.tsChar + charOffset);
          }
        }
      }

      return undefined;
    }

    // Get STX position from TypeScript position
    getStxPositionFromTs(stxUri: vscode.Uri, tsPosition: vscode.Position): vscode.Position | undefined {
      const key = stxUri.toString();
      const mappings = this.positionMappings.get(key);

      if (!mappings) {
        return undefined;
      }

      // Find the mapping that contains this position
      for (const mapping of mappings) {
        if (mapping.tsLine === tsPosition.line) {
          const charOffset = tsPosition.character - mapping.tsChar;
          if (charOffset >= 0 && charOffset < mapping.length) {
            return new vscode.Position(mapping.stxLine, mapping.stxChar + charOffset);
          }
        }
      }

      return undefined;
    }

    // Track STX document changes
    trackDocument(document: vscode.TextDocument): void {
      if (document.languageId === 'stx') {
        const key = document.uri.toString();
        this.stxDocuments.set(key, document);

        // Create or update corresponding virtual TS document
        this.updateVirtualTsDocument(document);
      }
    }

    // Update virtual TS document when STX document changes
    updateVirtualTsDocument(document: vscode.TextDocument): void {
      const stxUri = document.uri;
      const virtualUri = stxUri.with({
        scheme: 'stx-ts',
        path: stxUri.path + '.ts'
      });

      // Extract TypeScript content
      const { content, mappings } = this.extractTypeScriptFromStx(document);
      this.derivedTsContent.set(stxUri.toString(), content);
      this.positionMappings.set(stxUri.toString(), mappings);

      // Notify that content has changed
      this._onDidChangeEmitter.fire(virtualUri);
    }

    // Get position mappings for a document
    getMappings(uri: vscode.Uri): PositionMapping[] {
      return this.positionMappings.get(uri.toString()) || [];
    }
  };

  // Register the virtual document provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('stx-ts', virtualTsDocumentProvider)
  );

  // Track document changes
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document.languageId === 'stx') {
      virtualTsDocumentProvider.updateVirtualTsDocument(event.document);
    }
  });

  // Track document opens
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument(document => {
    if (document.languageId === 'stx') {
      virtualTsDocumentProvider.trackDocument(document);

      // Automatically show TypeScript features for STX files
      vscode.window.showInformationMessage('Welcome to STX (Stacks) language support!');

      // Open a virtual TypeScript document for this STX file
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      // Load the virtual document in the background to activate TypeScript features
      vscode.workspace.openTextDocument(virtualUri)
        .then(() => {
          console.log('TypeScript virtual document created for', document.uri.toString());
        }, (error: Error) => {
          console.error('Failed to open virtual TypeScript document:', error);
        });
    }
  });

  // Process already open documents
  vscode.workspace.textDocuments.forEach(document => {
    if (document.languageId === 'stx') {
      virtualTsDocumentProvider.trackDocument(document);
    }
  });

  // Register the hover provider for STX files with improved type information
  const hoverProvider = vscode.languages.registerHoverProvider('stx', {
    async provideHover(document, position, token) {
      // Check if we're in a TypeScript section or expression
      const lineText = document.lineAt(position.line).text;
      const wordRange = document.getWordRangeAtPosition(position);

      if (!wordRange) {
        return null;
      }

      // Get the word at the current position
      const word = document.getText(wordRange);

      // Create virtual TS document
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      try {
        // Find the TypeScript version of this position
        const tsPosition = virtualTsDocumentProvider.getTsPositionFromStx(document.uri, position);
        if (!tsPosition) {
          // Try a more basic approach - search for the word in TS content
          const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

          // Check if it's a TypeScript declaration or a structure type
          // Look for interface or type declarations
          if (tsContent.includes(`interface ${word}`)) {
            return new vscode.Hover(`(interface) ${word}`);
          } else if (tsContent.includes(`type ${word}`)) {
            return new vscode.Hover(`(type) ${word}`);
          } else if (tsContent.includes(`const ${word}`)) {
            return new vscode.Hover(`(const) ${word}`);
          } else if (tsContent.includes(`let ${word}`)) {
            return new vscode.Hover(`(let) ${word}`);
          } else if (word.match(/^[A-Z][A-Za-z0-9_]*$/) && tsContent.includes(word)) {
            // Likely a type name (starts with capital letter)
            return new vscode.Hover(`(type) ${word}`);
          } else if (tsContent.includes(word)) {
            return new vscode.Hover(`(variable) ${word}`);
          }

          return null;
        }

        // Get more specific type information using the language service
        // We'll use a virtual file to get more accurate type info
        const tsVirtualDoc = await vscode.workspace.openTextDocument(virtualUri);
        const wordRangeInTs = new vscode.Range(
          tsPosition,
          new vscode.Position(tsPosition.line, tsPosition.character + word.length)
        );

        // Find context around the symbol
        const line = tsVirtualDoc.lineAt(tsPosition.line).text;

        // Extract type information - look for declarations
        if (line.includes(`interface ${word}`)) {
          return new vscode.Hover(`(interface) ${word}`);
        } else if (line.includes(`type ${word}`)) {
          return new vscode.Hover(`(type) ${word}`);
        } else if (line.includes(`const ${word}`)) {
          // Try to extract the type
          const typeMatch = line.match(new RegExp(`const\\s+${word}\\s*:\\s*([A-Za-z0-9_\\[\\]]+)`));
          if (typeMatch) {
            return new vscode.Hover(`(const) ${word}: ${typeMatch[1]}`);
          }
          return new vscode.Hover(`(const) ${word}`);
        } else if (line.includes(`let ${word}`)) {
          // Try to extract the type
          const typeMatch = line.match(new RegExp(`let\\s+${word}\\s*:\\s*([A-Za-z0-9_\\[\\]]+)`));
          if (typeMatch) {
            return new vscode.Hover(`(let) ${word}: ${typeMatch[1]}`);
          }
          return new vscode.Hover(`(let) ${word}`);
        } else {
          // Try to infer type from usage
          if (word.match(/^[A-Z][A-Za-z0-9_]*$/)) {
            // Likely a type name (starts with capital letter)
            return new vscode.Hover(`(type) ${word}`);
          }

          // Check if it's a property access
          const propertyMatch = line.match(new RegExp(`([a-zA-Z0-9_]+)\\.${word}`));
          if (propertyMatch) {
            return new vscode.Hover(`(property) ${propertyMatch[1]}.${word}`);
          }

          return new vscode.Hover(`(variable) ${word}`);
        }
      } catch (error) {
        console.error('Error providing hover:', error);
      }

      return null;
    }
  });

  // Register definition provider for cmd+click
  const definitionProvider = vscode.languages.registerDefinitionProvider('stx', {
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
      } catch (error) {
        console.error('Error providing definition:', error);
      }

      return null;
    }
  });

  // Automatically set language ID for .stx files
  const fileOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const fileName = document.fileName;
    const extension = path.extname(fileName);

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx');
    }
  });

  context.subscriptions.push(
    documentChangeListener,
    documentOpenListener,
    fileOpenListener,
    hoverProvider,
    definitionProvider
  );
}

export function deactivate() {}
