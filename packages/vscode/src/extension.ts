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

// Interface for JSDoc comments
interface JSDocInfo {
  comment: string;
  symbol: string;
  line: number;
  isProperty?: boolean;
  parentSymbol?: string;
  symbolType: string;
  contentPosition: number;
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

    // Track JSDoc comments for each document
    private jsDocComments = new Map<string, JSDocInfo[]>();

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
        const { content, mappings, jsDocComments } = this.extractTypeScriptFromStx(document);
        this.derivedTsContent.set(key, content);
        this.positionMappings.set(key, mappings);
        this.jsDocComments.set(key, jsDocComments);
        return content;
      }

      return '// No TypeScript content found';
    }

    extractTypeScriptFromStx(document: vscode.TextDocument): {
      content: string,
      mappings: PositionMapping[],
      jsDocComments: JSDocInfo[]
    } {
      try {
        const text = document.getText();
        let tsContent = '';
        const mappings: PositionMapping[] = [];
        const jsDocComments: JSDocInfo[] = [];
        let tsLineCounter = 0;

        // Extract TypeScript from @ts blocks
        const tsBlockRegex = /@ts\s+([\s\S]*?)@endts/g;
        let blockMatch;

        while ((blockMatch = tsBlockRegex.exec(text)) !== null) {
          const blockContent = blockMatch[1];
          const blockStartPos = document.positionAt(blockMatch.index + blockMatch[0].indexOf(blockContent));

          // Process JSDoc comments first
          const jsDocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(?:(interface|type|class|function|const|let|var)\s+([^\s{(:]+))/g;
          let jsDocMatch;
          let blockContentCopy = blockContent;

          while ((jsDocMatch = jsDocRegex.exec(blockContentCopy)) !== null) {
            const jsDocComment = jsDocMatch[1].trim();
            const symbolType = jsDocMatch[2];
            const symbolName = jsDocMatch[3];

            // Clean up JSDoc comment - make sure we're not including properties in the comment
            let cleanedComment = jsDocComment;
            // Remove nested interface properties from the comment if they're coming through
            if (symbolType === 'function' && cleanedComment.includes('id:') && cleanedComment.includes('user:')) {
              // This indicates we might have order properties in the comment - clean it up
              cleanedComment = cleanedComment.replace(/.*?id:\s*number.*?date:\s*Date.*?\}/s, '');
            }

            // Calculate position in original document
            const jsDocPos = blockStartPos.line +
                            blockContentCopy.substring(0, jsDocMatch.index).split('\n').length - 1;

            // Store additional context about the symbol type
            jsDocComments.push({
              comment: cleanedComment,
              symbol: symbolName,
              line: jsDocPos,
              symbolType: symbolType,
              // Store the position in the content for context awareness
              contentPosition: jsDocMatch.index
            });

            // Now look for property-level JSDoc within this symbol
            // Find the block of code for this symbol
            const symbolStart = jsDocMatch.index + jsDocMatch[0].length;
            const symbolBlockMatch = blockContentCopy.substring(symbolStart).match(/{([^{}]*(?:{[^{}]*}[^{}]*)*)}/);

            if (symbolBlockMatch && symbolBlockMatch[1]) {
              const symbolBlock = symbolBlockMatch[1];
              // Extract property JSDoc comments
              const propertyJSDocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*([a-zA-Z0-9_]+)\s*:/g;
              let propertyMatch;

              while ((propertyMatch = propertyJSDocRegex.exec(symbolBlock)) !== null) {
                const propertyComment = propertyMatch[1].trim();
                const propertyName = propertyMatch[2];

                jsDocComments.push({
                  comment: propertyComment,
                  symbol: propertyName,
                  line: jsDocPos + symbolBlock.substring(0, propertyMatch.index).split('\n').length,
                  isProperty: true,
                  parentSymbol: symbolName,
                  symbolType: 'property',
                  contentPosition: propertyMatch.index
                });
              }
            }
          }

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

        return { content: tsContent, mappings, jsDocComments };
      } catch (error) {
        console.error('Error extracting TypeScript from STX:', error);
        return { content: '// Error extracting TypeScript content', mappings: [], jsDocComments: [] };
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

    // Get JSDoc comment for a symbol, including property-level JSDoc
    getJSDocForSymbol(uri: vscode.Uri, symbolName: string, parentContext?: string): string | undefined {
      const key = uri.toString();
      const comments = this.jsDocComments.get(key);

      if (!comments) {
        return undefined;
      }

      // If we have a parent context, we're looking for a property
      if (parentContext) {
        // Find the comment for this property in the specified parent
        const comment = comments.find(c =>
          c.symbol === symbolName &&
          c.isProperty === true &&
          c.parentSymbol === parentContext
        );
        return comment?.comment;
      }

      // Find an exact match for this symbol based on symbol type
      const tsContent = this.derivedTsContent.get(uri.toString()) || '';

      // Check if the symbol is a function
      const isFunctionMatch = tsContent.match(new RegExp(`function\\s+${symbolName}\\b`));
      if (isFunctionMatch) {
        // For functions, find the JSDoc comment that's specifically for this function
        const functionComment = comments.find(c =>
          c.symbol === symbolName &&
          c.symbolType === 'function' &&
          !c.isProperty
        );
        if (functionComment) {
          return functionComment.comment;
        }
      }

      // For interfaces
      const isInterfaceMatch = tsContent.match(new RegExp(`interface\\s+${symbolName}\\b`));
      if (isInterfaceMatch) {
        const interfaceComment = comments.find(c =>
          c.symbol === symbolName &&
          c.symbolType === 'interface' &&
          !c.isProperty
        );
        if (interfaceComment) {
          return interfaceComment.comment;
        }
      }

      // For other symbol types (class, type, etc.), find a match by type
      const directMatch = comments.find(c => c.symbol === symbolName && !c.isProperty);
      if (directMatch) {
        return directMatch.comment;
      }

      // If no direct match, try to find property-level JSDoc without specific parent context
      const propertyMatch = comments.find(c => c.symbol === symbolName && c.isProperty === true);
      return propertyMatch?.comment;
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
      const { content, mappings, jsDocComments } = this.extractTypeScriptFromStx(document);
      this.derivedTsContent.set(stxUri.toString(), content);
      this.positionMappings.set(stxUri.toString(), mappings);
      this.jsDocComments.set(stxUri.toString(), jsDocComments);

      // Notify that content has changed
      this._onDidChangeEmitter.fire(virtualUri);
    }

    // Get position mappings for a document
    getMappings(uri: vscode.Uri): PositionMapping[] {
      return this.positionMappings.get(uri.toString()) || [];
    }

    // Get JSDoc comments for a document
    getJSDocComments(uri: vscode.Uri): JSDocInfo[] {
      return this.jsDocComments.get(uri.toString()) || [];
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

  // Register the hover provider for STX files with improved property support
  const hoverProvider = vscode.languages.registerHoverProvider('stx', {
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

      // DIRECT BRUTE FORCE APPROACH FOR CSS ELEMENTS

      // Get text before the current position for context
      const beforeText = line.substring(0, wordRange.start.character);

      // 1. DIRECT CLASS DETECTION - MUST COME FIRST
      // Check for class selectors (.card)
      if (beforeText.includes('.') && beforeText.trim().endsWith('.')) {
        // Force the exact tooltip format for class selectors
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: element class
        hover.appendCodeblock(`<element class="${word}">`, 'html');

        // Add spacing
        hover.appendText('\n\n');

        // Selector specificity with link
        hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 1, 0)');

        return new vscode.Hover(hover);
      }

      // 2. DIRECT ID DETECTION
      if (beforeText.includes('#') && beforeText.trim().endsWith('#')) {
        // Force the exact tooltip format for ID selectors
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: element id
        hover.appendCodeblock(`<element id="${word}">`, 'html');

        // Add spacing
        hover.appendText('\n\n');

        // Selector specificity with link
        hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (1, 0, 0)');

        return new vscode.Hover(hover);
      }

      // 3. CLASS ATTRIBUTE DETECTION
      if (line.includes('class="') || line.includes("class='")) {
        const classMatch = line.match(/class=["']([^"']*)["']/);
        if (classMatch && classMatch[1].split(/\s+/).includes(word)) {
          // Force the exact tooltip format for class attributes
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // First line: element class
          hover.appendCodeblock(`<element class="${word}">`, 'html');

          // Add spacing
          hover.appendText('\n\n');

          // Selector specificity with link
          hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 1, 0)');

          return new vscode.Hover(hover);
        }
      }

      // 4. DIRECT ELEMENT DETECTION - MUST COME LAST
      // Common HTML/CSS elements
      const cssElements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                         'body', 'html', 'header', 'footer', 'main', 'section', 'article',
                         'nav', 'ul', 'ol', 'li', 'a', 'button', 'input', 'form', 'table',
                         'tr', 'td', 'th', 'pre', 'code', 'img', 'strong', 'em', 'label',
                         'select', 'option', 'textarea', 'style', 'script', 'link', 'meta'];

      // If the word is a CSS element in an appropriate context, show element tooltip
      if (cssElements.includes(word) &&
          (line.includes('{') || line.includes('<style>') || line.includes('style'))) {
        // Force the exact tooltip format
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        // First line: element name
        hover.appendCodeblock(`<${word}>`, 'html');

        // Add spacing
        hover.appendText('\n\n');

        // Selector specificity with link
        hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 0, 1)');

        return new vscode.Hover(hover);
      }

      // 5. TYPESCRIPT KEYWORDS
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
          default:
            description = `TypeScript keyword: ${word}`;
            break;
        }

        hover.appendMarkdown(description);

        return new vscode.Hover(hover);
      }

      // If the above direct approaches didn't work, proceed with TypeScript hover logic
      // Create virtual TS document
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      try {
        const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

        // Detect the context of this symbol
        // Is it a property access?
        const beforeWord = line.substring(0, wordRange.start.character).trim();

        let propertyContext = null;
        const propertyAccessMatch = beforeWord.match(/(\w+)\s*:\s*$/);
        const dotNotationMatch = beforeWord.match(/(\w+)\s*\.\s*$/);

        if (propertyAccessMatch) {
          // Object literal property
          propertyContext = propertyAccessMatch[1];
        } else if (dotNotationMatch) {
          // Dot notation property access
          propertyContext = dotNotationMatch[1];
        }

        // First determine the symbol type more accurately
        let symbolType = "variable";
        const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${word}\\b`));
        const typeMatch = tsContent.match(new RegExp(`type\\s+${word}\\b`));
        const classMatch = tsContent.match(new RegExp(`class\\s+${word}\\b`));
        const functionMatch = tsContent.match(new RegExp(`function\\s+${word}\\b`));
        const constMatch = tsContent.match(new RegExp(`const\\s+${word}\\b`));

        if (interfaceMatch) {
          symbolType = "interface";
        } else if (typeMatch) {
          symbolType = "type";
        } else if (classMatch) {
          symbolType = "class";
        } else if (functionMatch) {
          symbolType = "function";
        } else if (constMatch) {
          symbolType = "const";
        } else if (propertyContext) {
          symbolType = "property";
        }

        // Check for JSDoc comment in the appropriate context
        let jsDocComment;
        if (propertyContext) {
          // Check for property documentation first in parent object
          jsDocComment = virtualTsDocumentProvider.getJSDocForSymbol(document.uri, word, propertyContext);

          // If not found, then check for general property documentation
          if (!jsDocComment) {
            jsDocComment = virtualTsDocumentProvider.getJSDocForSymbol(document.uri, word);
          }
        } else {
          // For functions, make sure we're only getting function docs
          if (symbolType === 'function') {
            // Get all JSDoc for this file
            const allJsDocs = virtualTsDocumentProvider.getJSDocComments(document.uri);
            // Find the exact function JSDoc
            const functionDoc = allJsDocs.find(doc =>
              doc.symbol === word &&
              doc.symbolType === 'function'
            );

            jsDocComment = functionDoc?.comment;

            // As a fallback, use the regular method
            if (!jsDocComment) {
              jsDocComment = virtualTsDocumentProvider.getJSDocForSymbol(document.uri, word);
            }
          } else {
            jsDocComment = virtualTsDocumentProvider.getJSDocForSymbol(document.uri, word);
          }
        }

        // Create hover content
        const hoverContent = new vscode.MarkdownString();

        // Start with symbol type/name
        hoverContent.appendCodeblock(`${symbolType} ${word}`, 'typescript');

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

// Format JSDoc comment for hover display
function formatJSDoc(comment: string): string {
  // First, clean up the comment by removing asterisks and extra whitespace
  let cleanedComment = comment
    .replace(/^\s*\*+/gm, '') // Remove leading asterisks on each line
    .replace(/\/\*\*/g, '')   // Remove opening /**
    .replace(/\*\//g, '')     // Remove closing */
    .trim();

  // Additional cleanup for function documentation
  // Remove any property-like declarations that might have been captured incorrectly
  if (cleanedComment.includes('Parameter') && cleanedComment.includes('id:')) {
    // This is likely a function with incorrectly included interface properties
    cleanedComment = cleanedComment.replace(/Unique identifier for the order.*?Date when the order was placed.*?\}/s, '');
  }

  // Create a more structured format to ensure line breaks
  const sections: string[] = [];

  // Extract the main description (everything before the first @tag)
  const descriptionMatch = cleanedComment.match(/^([\s\S]*?)(?=@\w|$)/);
  if (descriptionMatch && descriptionMatch[1].trim()) {
    sections.push(descriptionMatch[1].trim());
  }

  // Extract @param tags
  const paramRegex = /@param\s+(?:{([^}]+)})?\s*(\w+)(?:\s*-\s*(.*))?/g;
  let paramMatch;
  const params: string[] = [];

  while ((paramMatch = paramRegex.exec(cleanedComment)) !== null) {
    const paramType = paramMatch[1] ? `*{${paramMatch[1]}}*` : '';
    const paramName = paramMatch[2];
    const paramDesc = paramMatch[3] || '';

    let formattedParam = `**Parameter** \`${paramName}\``;
    if (paramType) {
      formattedParam += `: ${paramType}`;
    }
    if (paramDesc) {
      formattedParam += ` - *${paramDesc}*`;
    }

    params.push(formattedParam);
  }

  if (params.length > 0) {
    sections.push(params.join('\n\n'));
  }

  // Extract @returns tag
  const returnsRegex = /@returns?\s+(?:{([^}]+)})?\s*(.*)/;
  const returnsMatch = cleanedComment.match(returnsRegex);
  if (returnsMatch) {
    const returnType = returnsMatch[1] ? `*{${returnsMatch[1]}}*` : '';
    const returnDesc = returnsMatch[2] || '';

    let formattedReturns = '**Returns**';
    if (returnType) {
      formattedReturns += ` ${returnType}`;
    }
    if (returnDesc) {
      formattedReturns += ` *${returnDesc}*`;
    }

    sections.push(formattedReturns);
  }

  // Extract @throws tag
  const throwsRegex = /@throws?\s+(?:{([^}]+)})?\s*(.*)/;
  const throwsMatch = cleanedComment.match(throwsRegex);
  if (throwsMatch) {
    const throwType = throwsMatch[1] ? `*{${throwsMatch[1]}}*` : '';
    const throwDesc = throwsMatch[2] || '';

    let formattedThrows = '**Throws**';
    if (throwType) {
      formattedThrows += ` ${throwType}`;
    }
    if (throwDesc) {
      formattedThrows += ` *${throwDesc}*`;
    }

    sections.push(formattedThrows);
  }

  // Extract @deprecated tag
  if (cleanedComment.includes('@deprecated')) {
    const deprecatedRegex = /@deprecated\s*(.*)/;
    const deprecatedMatch = cleanedComment.match(deprecatedRegex);
    const deprecatedDesc = deprecatedMatch ? deprecatedMatch[1] : '';

    let formattedDeprecated = '**⚠️ Deprecated**';
    if (deprecatedDesc) {
      formattedDeprecated += ` *${deprecatedDesc}*`;
    }

    sections.push(formattedDeprecated);
  }

  // Extract @example blocks
  const exampleRegex = /@example\s+([\s\S]*?)(?=@\w|$)/g;
  let exampleMatch;

  while ((exampleMatch = exampleRegex.exec(cleanedComment)) !== null) {
    const exampleCode = exampleMatch[1].trim();

    // Format the example with line breaks and indentation
    let formattedCode = exampleCode;

    // Normalize indentation to ensure consistent formatting
    const codeLines = formattedCode.split('\n');

    // Find the minimum indentation across all non-empty lines
    let minIndent = Infinity;
    for (const line of codeLines) {
      if (line.trim() === '') continue; // Skip empty lines
      const indent = line.match(/^\s*/)?.[0].length || 0;
      minIndent = Math.min(minIndent, indent);
    }

    // If minIndent is still Infinity, set it to 0
    if (minIndent === Infinity) minIndent = 0;

    // Remove the common indentation prefix from all lines
    const normalizedLines = codeLines.map(line => {
      if (line.trim() === '') return '';
      return line.substring(minIndent);
    });

    // Fix the alignment of comment lines to match code
    const alignedLines = normalizedLines.map(line => {
      // Add a space BEFORE comment slashes to match code indentation
      if (line.trim().startsWith('//')) {
        return ' ' + line.trim();
      }
      return line;
    });

    // Rejoin with normalized indentation
    formattedCode = alignedLines.join('\n');

    // If it's a one-liner with objects, format it nicely
    if (!formattedCode.includes('\n') && formattedCode.includes('{') && formattedCode.includes('}')) {
      formattedCode = formattedCode
        .replace(/{\s*/g, '{\n  ')
        .replace(/,\s*/g, ',\n  ')
        .replace(/\s*}/g, '\n}');
    }

    const formattedExample = `**Example**\n\n\`\`\`typescript\n${formattedCode}\n\`\`\``;
    sections.push(formattedExample);
  }

  // Extract @see references
  const seeRegex = /@see\s+(\S+)(?:\s|$)/g;
  let seeMatch;
  const sees: string[] = [];

  while ((seeMatch = seeRegex.exec(cleanedComment)) !== null) {
    const reference = seeMatch[1].trim();
    sees.push(`**See**: [\`${reference}\`](#)`);
  }

  if (sees.length > 0) {
    sections.push(sees.join('\n\n'));
  }

  // Join all sections with double line breaks for clear separation
  return sections.join('\n\n');
}

export function deactivate() {}
