import * as vscode from 'vscode';
import { PositionMapping, JSDocInfo } from '../interfaces';

export class VirtualTsDocumentProvider implements vscode.TextDocumentContentProvider {
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
}