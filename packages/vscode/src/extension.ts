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
      const tsContent = this.derivedTsContent.get(uri.toString()) || '';

      if (!comments || comments.length === 0) {
        return undefined;
      }

      // If we have a parent context, we're looking for a property
      if (parentContext) {
        // First try to find the property in the specified parent
        const parentPropComment = comments.find(c =>
          c.symbol === symbolName &&
          c.isProperty === true &&
          c.parentSymbol === parentContext
        );

        if (parentPropComment) {
          return parentPropComment.comment;
        }

        // If not found in parent, look for a standalone property
        const propComment = comments.find(c =>
          c.symbol === symbolName &&
          c.isProperty === true
        );

        return propComment?.comment;
      }

      // For direct symbol lookups, determine the symbol type structurally
      interface SymbolMatch {
        comment: JSDocInfo;
        distance: number;
        type: string;
      }

      const symbolMatches: SymbolMatch[] = [];

      // Function check
      const functionMatch = tsContent.match(new RegExp(`function\\s+${symbolName}\\s*\\(`));
      if (functionMatch) {
        // Find all function declarations with this name
        const functionComments = comments.filter(c =>
          c.symbol === symbolName &&
          c.symbolType === 'function' &&
          !c.isProperty
        );

        if (functionComments.length > 0) {
          // Use the position in content to find the closest match
          functionComments.forEach(c => {
            const matchPos = functionMatch.index || 0;
            const distance = Math.abs((c.contentPosition || 0) - matchPos);
            symbolMatches.push({ comment: c, distance, type: 'function' });
          });
        }
      }

      // Interface check
      const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${symbolName}\\s*{`));
      if (interfaceMatch) {
        // Extract the entire interface block to determine its bounds
        const interfaceDefRegex = new RegExp(`interface\\s+${symbolName}\\s*{([^}]*)}`, 's');
        const interfaceDef = tsContent.match(interfaceDefRegex);

        if (interfaceDef) {
          const interfaceStart = interfaceMatch.index || 0;
          const interfaceEnd = (interfaceMatch.index || 0) + interfaceDef[0].length;

          // Find all comments for this interface
          const interfaceComments = comments.filter(c =>
            c.symbol === symbolName &&
            c.symbolType === 'interface' &&
            !c.isProperty
          );

          if (interfaceComments.length > 0) {
            // Use the position in content to find the closest match
            interfaceComments.forEach(c => {
              const pos = c.contentPosition || 0;
              // Check if this comment is close to the interface definition
              // Use proximity as a criteria for relevance
              const distance = Math.abs(pos - interfaceStart);

              // Only include comments that appear before the interface (JSDoc usually comes before)
              // or that are nearby and clearly related
              if (pos <= interfaceStart + 20) { // Allow a small margin for related comments
                symbolMatches.push({ comment: c, distance, type: 'interface' });
              }
            });
          }
        }
      }

      // Type alias check
      const typeMatch = tsContent.match(new RegExp(`type\\s+${symbolName}\\s*=`));
      if (typeMatch) {
        const typeComments = comments.filter(c =>
          c.symbol === symbolName &&
          c.symbolType === 'type' &&
          !c.isProperty
        );

        if (typeComments.length > 0) {
          typeComments.forEach(c => {
            const matchPos = typeMatch.index || 0;
            const distance = Math.abs((c.contentPosition || 0) - matchPos);
            symbolMatches.push({ comment: c, distance, type: 'type' });
          });
        }
      }

      // Class check
      const classMatch = tsContent.match(new RegExp(`class\\s+${symbolName}\\s*{`));
      if (classMatch) {
        const classComments = comments.filter(c =>
          c.symbol === symbolName &&
          c.symbolType === 'class' &&
          !c.isProperty
        );

        if (classComments.length > 0) {
          classComments.forEach(c => {
            const matchPos = classMatch.index || 0;
            const distance = Math.abs((c.contentPosition || 0) - matchPos);
            symbolMatches.push({ comment: c, distance, type: 'class' });
          });
        }
      }

      // Const/variable check
      const constMatch = tsContent.match(new RegExp(`const\\s+${symbolName}\\s*=`));
      if (constMatch) {
        const constComments = comments.filter(c =>
          c.symbol === symbolName &&
          (c.symbolType === 'const' || c.symbolType === 'let' || c.symbolType === 'var') &&
          !c.isProperty
        );

        if (constComments.length > 0) {
          constComments.forEach(c => {
            const matchPos = constMatch.index || 0;
            const distance = Math.abs((c.contentPosition || 0) - matchPos);
            symbolMatches.push({ comment: c, distance, type: 'const' });
          });
        }
      }

      // If we found matches based on structure, use the closest one
      if (symbolMatches.length > 0) {
        // Sort by proximity - closest first
        symbolMatches.sort((a, b) => a.distance - b.distance);
        return symbolMatches[0].comment.comment;
      }

      // Fallback to direct symbol match if none of the structural matches worked
      const directMatch = comments.find(c => c.symbol === symbolName && !c.isProperty);
      return directMatch?.comment;
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

      // Check if this is a property access (e.g. product.name)
      const isPropertyAccess = line.substring(0, wordRange.start.character).trim().endsWith('.');

      // Check if we're inside a CSS/style block
      const isInStyleBlock = isInStyleTag(document, position);

      // Precise detection for CSS class selectors
      const isCssClassSelector = isInStyleBlock && document.getText().charAt(document.offsetAt(wordRange.start) - 1) === '.';

      // Get text before the current position for context
      const beforeText = line.substring(0, wordRange.start.character);

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

      // DIRECT BRUTE FORCE APPROACH FOR CSS ELEMENTS

      // CSS CLASS SELECTOR DETECTION
      // This handles both .class selectors in style blocks and class attributes in HTML
      const isPrecedingDot = beforeText.trim().endsWith('.');

      // Check character before word for more precise detection
      const charBeforeWordRange = document.getText().charAt(document.offsetAt(wordRange.start) - 1);
      const isPreciselyPrecedingDot = charBeforeWordRange === '.';

      if ((isPrecedingDot || isPreciselyPrecedingDot) && !isPropertyAccess && !isInStyleBlock) {
        // Create hover for CSS class
        const hover = new vscode.MarkdownString();
        hover.isTrusted = true;
        hover.supportHtml = true;

        if (isInStyleBlock) {
          // In style block, show as CSS selector
          hover.appendCodeblock(`.${word} { }`, 'css');
          hover.appendText('\n\n');
          hover.appendMarkdown('**CSS Class Selector**\n\n');
        } else {
          // Outside style block, show as HTML with class
          hover.appendCodeblock(`<element class="${word}">`, 'html');
          hover.appendText('\n\n');
        }

        // Common info for all class selectors
        hover.appendMarkdown('[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity): (0, 1, 0)');

        // Show the CSS styles for this class
        const cssStyles = findCssStylesForClass(document, word);
        if (cssStyles && cssStyles.length > 0) {
          hover.appendMarkdown('\n\n**CSS Properties:**\n\n');
          hover.appendCodeblock(`.${word} {\n${cssStyles.join('\n')}\n}`, 'css');
        }

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

          // Try to find associated CSS styles in the document
          const cssStyles = findCssStylesForClass(document, word);
          if (cssStyles && cssStyles.length > 0) {
            hover.appendMarkdown('\n\n**CSS Properties:**\n\n');
            hover.appendCodeblock(`.${word} {\n${cssStyles.join('\n')}\n}`, 'css');
          }

          return new vscode.Hover(hover);
        }
      }

      // 3.5 HTML TAG DETECTION
      // Check if this looks like an HTML tag (e.g., <span>, <div>)
      // Don't detect as HTML tag if we're in a style block
      if (!isInStyleBlock) {
        const htmlTagOpening = line.includes('<' + word);
        const htmlTagClosing = line.includes('</' + word);
        const isHtmlTag = htmlTagOpening || htmlTagClosing || (line.match(new RegExp(`<${word}[\\s>]`)) !== null);

        // Common HTML tags list
        const htmlTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'strong', 'em', 'a', 'img', 'button', 'input', 'form', 'label',
                        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
                        'select', 'option', 'textarea', 'header', 'footer', 'nav', 'main',
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

      // 4. DIRECT ELEMENT DETECTION - MUST COME LAST
      // Common HTML/CSS elements
      const cssElements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                         'body', 'html', 'header', 'footer', 'main', 'section', 'article',
                         'nav', 'ul', 'ol', 'li', 'a', 'button', 'input', 'form', 'table',
                         'tr', 'td', 'th', 'pre', 'code', 'img', 'strong', 'em', 'label',
                         'select', 'option', 'textarea', 'style', 'script', 'link', 'meta'];

      // If the word is a CSS element in an appropriate context, show element tooltip
      // Prioritize different tooltips based on context
      if (cssElements.includes(word)) {
        if (isInStyleBlock) {
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
        } else if (line.includes('{') || line.includes('<style>') || line.includes('style')) {
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
            description = 'TypeScript keyword: ' + word;
            break;
        }

        hover.appendMarkdown(description);

        return new vscode.Hover(hover);
      }

      // 5.5. STX DIRECTIVES
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

      // 6. LOOP VARIABLES - Handle @foreach loop variables
      // Check for @foreach syntax
      const foreachMatch = line.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/);
      if (foreachMatch) {
        const iterableVar = foreachMatch[1].trim();
        const loopVar = foreachMatch[2].trim();
        const indexVar = foreachMatch[3]?.trim(); // Optional index variable

        // If we're hovering on the collection/iterable variable
        if (word === iterableVar) {
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // Search for type information in the virtual TS file
          const virtualUri = document.uri.with({
            scheme: 'stx-ts',
            path: document.uri.path + '.ts'
          });

          // Get TS content
          const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

          // Try to find the type from declarations like "const products: Product[]"
          const typeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${word}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));
          const inferredType = typeMatch ? typeMatch[1] : 'array';

          // First line: variable with type
          hover.appendCodeblock(`const ${word}: ${inferredType}`, 'typescript');

          // Add spacing
          hover.appendText('\n\n');

          // Description
          hover.appendMarkdown(`Collection being iterated in the @foreach loop.`);

          return new vscode.Hover(hover);
        }

        // If we're hovering on the loop variable
        if (word === loopVar) {
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // Get collection type to infer item type
          const virtualUri = document.uri.with({
            scheme: 'stx-ts',
            path: document.uri.path + '.ts'
          });

          // Get TS content
          const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

          // Try to find the type from declarations
          let itemType = 'any';
          const collectionTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${iterableVar}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));

          if (collectionTypeMatch) {
            const collectionType = collectionTypeMatch[1];
            // Extract item type from array type (e.g., Product[] -> Product)
            if (collectionType.includes('[]')) {
              itemType = collectionType.replace('[]', '');
            } else if (collectionType.includes('Array<')) {
              // Handle Array<Type>
              const genericMatch = collectionType.match(/Array<([^>]+)>/);
              if (genericMatch) {
                itemType = genericMatch[1];
              }
            }
          }

          // First line: variable with type
          hover.appendCodeblock(`const ${word}: ${itemType}`, 'typescript');

          // Add spacing
          hover.appendText('\n\n');

          // Description
          hover.appendMarkdown(`Loop variable for each item in the \`${iterableVar}\` collection.`);

          // Now try to find the properties of this type
          if (itemType !== 'any') {
            // Look for interface or type definition
            const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${itemType}\\s*{([^}]*)}`, 's'));
            const typeMatch = tsContent.match(new RegExp(`type\\s+${itemType}\\s*=\\s*{([^}]*)}`, 's'));

            const typeContent = interfaceMatch ? interfaceMatch[1] :
                                typeMatch ? typeMatch[1] : null;

            if (typeContent) {
              // Extract properties
              hover.appendMarkdown('\n\n**Properties:**\n');

              // Extract each property with its type
              const propertyRegex = /(\w+)\s*:\s*([^;]+);/g;
              let propertyMatch;
              let hasProperties = false;

              while ((propertyMatch = propertyRegex.exec(typeContent)) !== null) {
                hasProperties = true;
                const propName = propertyMatch[1];
                const propType = propertyMatch[2].trim();

                hover.appendMarkdown(`- \`${propName}\`: *${propType}*\n`);
              }

              // If no properties found in regex (might be complex type), just show raw interface
              if (!hasProperties && typeContent.trim()) {
                hover.appendMarkdown('```typescript\n' + typeContent.trim().split('\n').map(line => line.trim()).join('\n') + '\n```');
              }
            }
          }

          return new vscode.Hover(hover);
        }

        // If we're hovering on the index variable
        if (indexVar && word === indexVar) {
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // First line: variable with type
          hover.appendCodeblock(`const ${word}: number`, 'typescript');

          // Add spacing
          hover.appendText('\n\n');

          // Description
          hover.appendMarkdown(`Index of the current item in the \`${iterableVar}\` collection.`);

          return new vscode.Hover(hover);
        }
      }

      // Also check if the current line is inside a @foreach block
      // This handles cases where the @foreach declaration is on a previous line
      if (!foreachMatch) {
        // Look for @foreach in previous lines (up to 10 lines back)
        let foreachLine = null;
        let foreachIterableVar = null;
        let foreachLoopVar = null;

        for (let i = 1; i <= 10; i++) {
          if (position.line - i >= 0) {
            const prevLine = document.lineAt(position.line - i).text;
            const prevForeachMatch = prevLine.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/);

            if (prevForeachMatch) {
              foreachLine = position.line - i;
              foreachIterableVar = prevForeachMatch[1].trim();
              foreachLoopVar = prevForeachMatch[2].trim();
              break;
            }
          }
        }

        // If we found a @foreach and we're hovering on the loop variable
        if (foreachLine !== null && word === foreachLoopVar) {
          const hover = new vscode.MarkdownString();
          hover.isTrusted = true;
          hover.supportHtml = true;

          // Get collection type to infer item type
          const virtualUri = document.uri.with({
            scheme: 'stx-ts',
            path: document.uri.path + '.ts'
          });

          // Get TS content
          const tsContent = virtualTsDocumentProvider.provideTextDocumentContent(virtualUri);

          // Try to find the type from declarations
          let itemType = 'any';
          const collectionTypeMatch = tsContent.match(new RegExp(`(?:const|let|var)\\s+${foreachIterableVar}\\s*:\\s*([\\w\\[\\]<>]+)`, 'i'));

          if (collectionTypeMatch) {
            const collectionType = collectionTypeMatch[1];
            // Extract item type from array type (e.g., Product[] -> Product)
            if (collectionType.includes('[]')) {
              itemType = collectionType.replace('[]', '');
            } else if (collectionType.includes('Array<')) {
              // Handle Array<Type>
              const genericMatch = collectionType.match(/Array<([^>]+)>/);
              if (genericMatch) {
                itemType = genericMatch[1];
              }
            }
          }

          // First line: variable with type
          hover.appendCodeblock(`const ${word}: ${itemType}`, 'typescript');

          // Add spacing
          hover.appendText('\n\n');

          // Description
          hover.appendMarkdown(`Loop variable for each item in the \`${foreachIterableVar}\` collection.`);

          // Now try to find the properties of this type
          if (itemType !== 'any') {
            // Look for interface or type definition
            const interfaceMatch = tsContent.match(new RegExp(`interface\\s+${itemType}\\s*{([^}]*)}`, 's'));
            const typeMatch = tsContent.match(new RegExp(`type\\s+${itemType}\\s*=\\s*{([^}]*)}`, 's'));

            const typeContent = interfaceMatch ? interfaceMatch[1] :
                                typeMatch ? typeMatch[1] : null;

            if (typeContent) {
              // Extract properties
              hover.appendMarkdown('\n\n**Properties:**\n');

              // Extract each property with its type
              const propertyRegex = /(\w+)\s*:\s*([^;]+);/g;
              let propertyMatch;
              let hasProperties = false;

              while ((propertyMatch = propertyRegex.exec(typeContent)) !== null) {
                hasProperties = true;
                const propName = propertyMatch[1];
                const propType = propertyMatch[2].trim();

                hover.appendMarkdown(`- \`${propName}\`: *${propType}*\n`);
              }

              // If no properties found in regex (might be complex type), just show raw interface
              if (!hasProperties && typeContent.trim()) {
                hover.appendMarkdown('```typescript\n' + typeContent.trim().split('\n').map(line => line.trim()).join('\n') + '\n```');
              }
            }
          }

          return new vscode.Hover(hover);
        }
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
        const letMatch = tsContent.match(new RegExp(`let\\s+${word}\\b`));
        const varMatch = tsContent.match(new RegExp(`var\\s+${word}\\b`));

        // Check if this might be an HTML tag rather than a variable
        const htmlTagMatch = line.match(new RegExp(`<(/)?${word}(\\s|/?>|$)`));
        const commonHtmlTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                            'strong', 'em', 'a', 'img', 'button', 'input', 'form', 'label',
                            'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'pre', 'code'];
        const mightBeHtmlTag = htmlTagMatch !== null || (commonHtmlTags.includes(word) && line.includes('<'));

        // Skip variable processing for CSS class selectors
        if (isInStyleBlock) {
          // Check if preceded by a period (which would make it a class)
          const charBeforeWord = document.getText().charAt(document.offsetAt(wordRange.start) - 1);
          if (charBeforeWord === '.') {
            return null;
          }
        }

        // For style blocks, make sure we only proceed with variables when in a TypeScript context
        // Skip if we're in CSS rules (not inside an expression)
        if (isInStyleBlock && !line.includes('{{') && (
            line.includes(':') ||
            line.includes(';') ||
            line.includes('{') ||
            line.includes('}')
        )) {
          // Likely in CSS rules, not a TypeScript variable
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
        } else if (propertyContext) {
          symbolType = "property";
        } else if (mightBeHtmlTag) {
          // Skip processing as a variable - the HTML tag handler will take care of this
          return null;
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

        // For interfaces, add additional context about properties when available
        if (symbolType === "interface") {
          // Check if the interface has properties by searching the content
          const interfaceRegex = new RegExp(`interface\\s+${word}\\s+{([^}]*)}`, 's');
          const interfaceMatch = tsContent.match(interfaceRegex);

          if (interfaceMatch && interfaceMatch[1]) {
            const properties = interfaceMatch[1].trim();
            // Only add properties section if not already in JSDoc and if properties exist
            if (properties && (!jsDocComment || !jsDocComment.includes("id:") || !jsDocComment.includes("name:"))) {
              hoverContent.appendMarkdown('\n\n**Properties**\n');

              // Extract and format each property
              const propertyRegex = /(\w+):\s*([^;]+);/g;
              let propertyMatch;
              let propertyList = [];

              while ((propertyMatch = propertyRegex.exec(properties)) !== null) {
                const propName = propertyMatch[1];
                const propType = propertyMatch[2].trim();
                propertyList.push({ name: propName, type: propType });
                hoverContent.appendMarkdown(`- \`${propName}\`: *${propType}*\n`);
              }

              // Add a sample usage example if we found properties
              if (propertyList.length > 0) {
                // Build dynamic example with the first few properties
                let exampleProps = propertyList.slice(0, Math.min(3, propertyList.length))
                  .map(prop => {
                    // Generate sensible example values based on type
                    let exampleValue = '';
                    if (prop.type.includes('string')) {
                      exampleValue = '"example ' + prop.name + '"';
                    } else if (prop.type.includes('number')) {
                      exampleValue = '1';
                    } else if (prop.type.includes('boolean')) {
                      exampleValue = 'true';
                    } else if (prop.type.includes('Date')) {
                      exampleValue = 'new Date()';
                    } else if (prop.type.includes('[]')) {
                      exampleValue = '[]';
                    } else if (prop.type.includes('object')) {
                      exampleValue = '{}';
                    } else {
                      exampleValue = 'undefined';
                    }
                    return '  ' + prop.name + ': ' + exampleValue;
                  }).join(',\n');

                hoverContent.appendMarkdown(`\n\n**Example**\n\n\`\`\`typescript\nconst ${word.toLowerCase()}: ${word} = {\n${exampleProps}\n};\n\`\`\``);
              }
            }
          }
        }

        // CSS PROPERTY AND VALUE DETECTION
        if (isInStyleBlock) {
          // Detect if this is a CSS property name or value

          // CSS property pattern: property: value;
          const isCssPropertyMatch = line.match(/^\s*([a-zA-Z-]+)\s*:/);
          const isCssProperty = isCssPropertyMatch && isCssPropertyMatch[1] === word;

          // CSS value pattern: property: value;
          const isCssValueMatch = line.match(/:\s*([^;]+)/);
          const isCssValue = isCssValueMatch && isCssValueMatch[1].trim().includes(word);

          if (isCssProperty) {
            // CSS property name
            const hover = new vscode.MarkdownString();
            hover.isTrusted = true;
            hover.supportHtml = true;

            // First line: CSS property
            hover.appendCodeblock(`${word}: value;`, 'css');

            // Add spacing
            hover.appendText('\n\n');

            // Try to provide CSS property documentation
            let propertyDesc = '';

            switch (word) {
              case 'color':
                propertyDesc = 'Sets the color of text.';
                break;
              case 'background':
              case 'background-color':
                propertyDesc = 'Sets the background color of an element.';
                break;
              case 'padding':
                propertyDesc = 'Sets the padding space on all sides of an element.';
                break;
              case 'margin':
                propertyDesc = 'Sets the margin space on all sides of an element.';
                break;
              case 'border':
                propertyDesc = 'Sets the border on all sides of an element.';
                break;
              case 'font-size':
                propertyDesc = 'Specifies the size of the font.';
                break;
              case 'display':
                propertyDesc = 'Specifies how an element is displayed.';
                break;
              case 'position':
                propertyDesc = 'Specifies the positioning method used for an element.';
                break;
              default:
                propertyDesc = 'CSS property.';
            }

            hover.appendMarkdown(propertyDesc);
            hover.appendMarkdown(`\n\n[MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/${word})`);

            return new vscode.Hover(hover);
          }

          if (isCssValue && !isCssProperty) {
            // This might be a CSS value
            const hover = new vscode.MarkdownString();
            hover.isTrusted = true;
            hover.supportHtml = true;

            // Try to identify color values
            if (/^#[0-9a-f]{3,8}$/i.test(word)) {
              // Hex color value
              hover.appendCodeblock(word, 'css');
              hover.appendText('\n\n');
              hover.appendMarkdown('**CSS Color Value (Hexadecimal)**');
              return new vscode.Hover(hover);
            }

            // Common CSS values
            const commonValues = ['inherit', 'initial', 'unset', 'auto', 'none', 'block', 'inline', 'flex', 'grid'];
            if (commonValues.includes(word)) {
              hover.appendCodeblock(`property: ${word};`, 'css');
              hover.appendText('\n\n');
              hover.appendMarkdown('**CSS Value**');
              return new vscode.Hover(hover);
            }
          }
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

  // Create a structured format to ensure line breaks
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

    let formattedParam = '**Parameter** `' + paramName + '`';
    if (paramType) {
      formattedParam += ': ' + paramType;
    }
    if (paramDesc) {
      formattedParam += ' - *' + paramDesc + '*';
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
      formattedReturns += ' ' + returnType;
    }
    if (returnDesc) {
      formattedReturns += ' *' + returnDesc + '*';
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
      formattedThrows += ' ' + throwType;
    }
    if (throwDesc) {
      formattedThrows += ' *' + throwDesc + '*';
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
      formattedDeprecated += ' *' + deprecatedDesc + '*';
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

    const formattedExample = '**Example**\n\n```typescript\n' + formattedCode + '\n```';
    sections.push(formattedExample);
  }

  // Extract @see references
  const seeRegex = /@see\s+(\S+)(?:\s|$)/g;
  let seeMatch;
  const sees: string[] = [];

  while ((seeMatch = seeRegex.exec(cleanedComment)) !== null) {
    const reference = seeMatch[1].trim();
    // Always include all @see references without filtering
    // Let the context-aware extraction in getJSDocForSymbol handle relevance
    sees.push('**See**: [`' + reference + '`](#)');
  }

  if (sees.length > 0) {
    sections.push(sees.join('\n\n'));
  }

  // Join all sections with double line breaks for clear separation
  return sections.join('\n\n');
}

// Helper function to find the line number of a @foreach declaration for a given variable
function findForeachDeclarationForVariable(document: vscode.TextDocument, currentLine: number, variableName: string): number | null {
  // Look for @foreach in previous lines (up to 10 lines back)
  for (let i = 0; i <= 10; i++) {
    // First check the current line
    if (i === 0) {
      const line = document.lineAt(currentLine).text;
      const foreachMatch = line.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/);
      if (foreachMatch && foreachMatch[2].trim() === variableName) {
        return currentLine;
      }
    }
    // Then check previous lines
    else if (currentLine - i >= 0) {
      const prevLine = document.lineAt(currentLine - i).text;
      const prevForeachMatch = prevLine.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/);
      if (prevForeachMatch && prevForeachMatch[2].trim() === variableName) {
        return currentLine - i;
      }
    }
  }

  return null;
}

// Helper function to find CSS styles for a class
function findCssStylesForClass(document: vscode.TextDocument, className: string): string[] {
  try {
    const text = document.getText();
    const styles: string[] = [];
    const importedStyles: string[] = [];
    const documentDir = path.dirname(document.uri.fsPath);

    // Look for style blocks in the document
    const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let styleMatch;

    while ((styleMatch = styleBlockRegex.exec(text)) !== null) {
      const styleContent = styleMatch[1];

      // Look for class selectors
      const selectorRegex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
      let selectorMatch;

      while ((selectorMatch = selectorRegex.exec(styleContent)) !== null) {
        const properties = selectorMatch[1].trim();

        // Split into individual properties and format them
        if (properties) {
          const propLines = properties.split(';')
            .map(prop => prop.trim())
            .filter(prop => prop.length > 0)
            .map(prop => `  ${prop};`);

          styles.push(...propLines);
        }
      }
    }

    // Look for linked CSS files
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*)["'][^>]*>/g;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(text)) !== null) {
      const href = linkMatch[1];

      // Try to resolve path for local stylesheets
      if (!href.startsWith('http')) {
        try {
          // Resolve path relative to the document
          const cssPath = path.resolve(documentDir, href);

          // Check if file exists and read it
          if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');

            // Find class styles in the external CSS
            const externalSelectorRegex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
            let externalMatch;

            while ((externalMatch = externalSelectorRegex.exec(cssContent)) !== null) {
              const properties = externalMatch[1].trim();

              if (properties) {
                const propLines = properties.split(';')
                  .map(prop => prop.trim())
                  .filter(prop => prop.length > 0)
                  .map(prop => `  ${prop}; /* from ${path.basename(cssPath)} */`);

                importedStyles.push(...propLines);
              }
            }
          }
        } catch (error) {
          console.error("Error reading linked stylesheet:", error);
        }
      }
    }

    // Also look for inline styles on elements with this class
    const inlineStyleRegex = new RegExp(`class=["'][^"']*${className}[^"']*["'][^>]*style=["']([^"']*)["']`, 'g');
    let inlineMatch;

    while ((inlineMatch = inlineStyleRegex.exec(text)) !== null) {
      const inlineStyles = inlineMatch[1].trim();

      if (inlineStyles) {
        // Format inline styles as CSS properties
        const propLines = inlineStyles.split(';')
          .map(prop => prop.trim())
          .filter(prop => prop.length > 0)
          .map(prop => `  ${prop}; /* inline */`);

        styles.push(...propLines);
      }
    }

    // Also check for any style attribute in the same line
    const classPos = text.indexOf(`class="${className}"`) || text.indexOf(`class='${className}'`);
    if (classPos !== -1) {
      const lineNum = document.positionAt(classPos).line;
      const currentLine = document.lineAt(lineNum).text;
      const lineStyleMatch = currentLine.match(/style=["']([^"']*)["']/);

      if (lineStyleMatch) {
        const lineStyles = lineStyleMatch[1].trim();

        if (lineStyles) {
          // Format inline styles from the current line
          const propLines = lineStyles.split(';')
            .map(prop => prop.trim())
            .filter(prop => prop.length > 0)
            .map(prop => `  ${prop}; /* inline - current element */`);

          styles.push(...propLines);
        }
      }
    }

    // Combine all styles, prioritizing inline styles first
    return [...styles, ...importedStyles];
  } catch (e) {
    console.error("Error finding CSS styles:", e);
    return [];
  }
}

// Helper function to check if a position is inside a style tag
function isInStyleTag(document: vscode.TextDocument, position: vscode.Position): boolean {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Find all style blocks in the document
  const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;

  while ((match = styleBlockRegex.exec(text)) !== null) {
    const styleStart = match.index + match[0].indexOf('>') + 1;
    const styleEnd = match.index + match[0].lastIndexOf('<');

    if (offset >= styleStart && offset <= styleEnd) {
      return true;
    }
  }

  return false;
}

// Helper function to check if word is a CSS class name in a style block
function isCssClassName(document: vscode.TextDocument, position: vscode.Position, word: string): boolean {
  // First check if we're in a style block
  if (!isInStyleTag(document, position)) {
    return false;
  }

  // Get the entire document text and current position
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Check if there's a period right before the word at this position
  // Find the start of the word
  const wordStart = text.substring(0, offset).lastIndexOf(word);
  if (wordStart === -1 || wordStart + word.length < offset) {
    return false;
  }

  // Check if there's a period right before the word
  return wordStart > 0 && text.charAt(wordStart - 1) === '.';
}

export function deactivate() {}
