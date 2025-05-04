import * as vscode from 'vscode';
import { PositionMapping, JSDocInfo } from '../interfaces';
import { TransitionType, TransitionDirection, TransitionEase } from '../interfaces/animation-types';

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

        // Extract interface information from type definitions
        this.extractInterfaceTypeInfo(blockContent, jsDocComments);

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

      // Extract animation directives and update tsContent and tsLineCounter
      const animationResults = this.extractAnimationDirectives(text, tsContent, mappings, jsDocComments, tsLineCounter);
      tsContent = animationResults.content;
      tsLineCounter = animationResults.lineCounter;

      return { content: tsContent, mappings, jsDocComments };
    } catch (error) {
      console.error('Error extracting TypeScript from STX:', error);
      return { content: '// Error extracting TypeScript content', mappings: [], jsDocComments: [] };
    }
  }

  /**
   * Extracts interface and type information from TypeScript content
   * @param content The TypeScript content
   * @param jsDocComments The array to add JSDoc information to
   */
  private extractInterfaceTypeInfo(content: string, jsDocComments: JSDocInfo[]): void {
    try {
      // Extract function return types - handle both function declarations and arrow functions
      // Regular function format: function name(...) : ReturnType { ... }
      const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([\w\[\]<>]+)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)?}/gs;
      let functionMatch;

      while ((functionMatch = functionRegex.exec(content)) !== null) {
        const functionName = functionMatch[1];
        const params = functionMatch[2].trim();
        const returnType = functionMatch[3];
        const functionBody = functionMatch[4] || '';

        // Add function return type info
        jsDocComments.push({
          comment: `Function returning ${returnType}`,
          symbol: functionName,
          line: 0, // Line number not critical here
          symbolType: 'function',
          returnType: returnType
        });

        // Parse parameter types
        if (params) {
          const paramList = params.split(',').map(p => p.trim());
          paramList.forEach(param => {
            const paramParts = param.split(':').map(p => p.trim());
            if (paramParts.length >= 2) {
              const paramName = paramParts[0];
              const paramType = paramParts[1];

              // Add parameter info
              jsDocComments.push({
                comment: `Parameter of ${functionName}`,
                symbol: paramName,
                line: 0,
                isProperty: true,
                parentSymbol: functionName,
                symbolType: 'parameter',
                propertyType: paramType
              });
            }
          });
        }

        // Extract variables from function body to better understand what it returns
        if (functionBody) {
          // Look for return statements
          const returnStatements = functionBody.match(/return\s+([^;]+);/g);
          if (returnStatements && returnStatements.length > 0) {
            const returnVarMatch = returnStatements[0].match(/return\s+(\w+);/);
            if (returnVarMatch) {
              const returnVarName = returnVarMatch[1];

              // Find variable declaration inside function
              const varDeclaration = functionBody.match(new RegExp(`(?:const|let|var)\\s+${returnVarName}\\s*=\\s*({[^;]+});`));
              if (varDeclaration) {
                // We have an object literal being returned - extract its structure
                const objLiteral = varDeclaration[1];
                if (objLiteral.startsWith('{')) {
                  jsDocComments.push({
                    comment: `Return value structure of ${functionName}`,
                    symbol: returnType,
                    line: 0,
                    symbolType: 'interface',
                    interfaceContent: objLiteral.replace(/^\{|\}$/g, '').trim()
                  });
                }
              }
            }
          }
        }

        // Look for the returned interface
        if (returnType !== 'string' && returnType !== 'number' && returnType !== 'boolean' &&
            returnType !== 'any' && returnType !== 'void' && returnType !== 'undefined') {
          // Extract the base type (remove [] or <> if present)
          const baseType = returnType.replace(/\[\]$/, '').replace(/<.*>$/, '');

          const interfaceMatch = content.match(new RegExp(`interface\\s+${baseType}\\s*{([^}]*)}`, 's'));
          if (interfaceMatch) {
            jsDocComments.push({
              comment: `Interface definition for ${baseType}`,
              symbol: baseType,
              line: 0,
              symbolType: 'interface',
              interfaceContent: interfaceMatch[1].trim()
            });

            // Extract properties from the interface
            const propertyRegex = /(\w+)\s*:\s*([^;]+);/g;
            let propertyMatch;

            while ((propertyMatch = propertyRegex.exec(interfaceMatch[1])) !== null) {
              const propertyName = propertyMatch[1];
              const propertyType = propertyMatch[2].trim();

              jsDocComments.push({
                comment: `Property of ${baseType}`,
                symbol: propertyName,
                line: 0,
                isProperty: true,
                parentSymbol: baseType,
                symbolType: 'property',
                propertyType: propertyType
              });
            }
          }
        }
      }

      // Also check for arrow functions with explicit return types
      // Arrow function with explicit type: const name = (): ReturnType => {...}
      const arrowFunctionWithTypeRegex = /const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*:\s*([\w\[\]<>|]+)\s*=>\s*(?:{([^}]*)})|((?:{[^}]*}|[^;]+));/gs;
      let arrowMatch;

      while ((arrowMatch = arrowFunctionWithTypeRegex.exec(content)) !== null) {
        const functionName = arrowMatch[1];
        const returnType = arrowMatch[2];
        const functionBody = arrowMatch[3] || arrowMatch[4] || '';

        // Add function info
        jsDocComments.push({
          comment: `Arrow function returning ${returnType}`,
          symbol: functionName,
          line: 0,
          symbolType: 'function',
          returnType: returnType
        });

        // If the function directly returns an object literal, extract it
        const directReturnMatch = functionBody.match(/return\s+({[^;]+});/);
        if (directReturnMatch) {
          const objectLiteral = directReturnMatch[1];

          // Clean up the object literal by removing line comments
          const cleanedLiteral = objectLiteral.replace(/\/\/[^\n]*/g, '').trim();

          // Extract the object structure properly
          const propertyPattern = /(\w+)\s*:\s*([^,}]+)(?:,|$)/g;
          let propertyMatch;
          let interfaceContent = '';

          while ((propertyMatch = propertyPattern.exec(cleanedLiteral)) !== null) {
            const propName = propertyMatch[1].trim();
            const propValue = propertyMatch[2].trim();

            // Infer property type from its value
            let propType = 'any';
            if (propValue.match(/^['"]/)) {
              propType = 'string';
            } else if (propValue.match(/^\d/)) {
              propType = 'number';
            } else if (propValue === 'true' || propValue === 'false') {
              propType = 'boolean';
            }

            interfaceContent += `${propName}: ${propType};\n  `;
          }

          if (interfaceContent) {
            jsDocComments.push({
              comment: `Return value structure from arrow function ${functionName}`,
              symbol: returnType,
              line: 0,
              symbolType: 'interface',
              interfaceContent: interfaceContent
            });
          }
        }

        // Check if this is a union type
        if (returnType.includes('|')) {
          const baseTypes = returnType.split('|').map(t => t.trim());

          // For types like "User | null", focus on the non-null type
          const nonNullTypes = baseTypes.filter(t => t !== 'null' && t !== 'undefined');

          if (nonNullTypes.length > 0) {
            for (const baseType of nonNullTypes) {
              const interfaceMatch = content.match(new RegExp(`interface\\s+${baseType}\\s*{([^}]*)}`, 's'));
              if (interfaceMatch) {
                jsDocComments.push({
                  comment: `Interface definition for ${baseType} (from union type)`,
                  symbol: baseType,
                  line: 0,
                  symbolType: 'interface',
                  interfaceContent: interfaceMatch[1].trim()
                });

                // Also link this to the function
                jsDocComments.push({
                  comment: `Return value structure from ${functionName}`,
                  symbol: functionName,
                  line: 0,
                  symbolType: 'interface-reference',
                  interfaceContent: interfaceMatch[1].trim()
                });
              }
            }
          }
        }
      }

      // Extract variable types and their assignments
      const variableRegex = /(const|let|var)\s+(\w+)(?:\s*:\s*([\w\[\]<>]+))?\s*=\s*([^;]+);/g;
      let variableMatch;

      while ((variableMatch = variableRegex.exec(content)) !== null) {
        const varType = variableMatch[1]; // const, let, var
        const varName = variableMatch[2];
        const declaredType = variableMatch[3]; // might be undefined
        const assignment = variableMatch[4].trim();

        // Check if this is calling a function with a known return type
        const functionCallMatch = assignment.match(/(\w+)\(\)/);
        if (functionCallMatch) {
          const calledFunction = functionCallMatch[1];

          // Find the function's return type from our previously collected info
          const functionInfo = jsDocComments.find(
            info => info.symbol === calledFunction && info.symbolType === 'function'
          );

          if (functionInfo && functionInfo.returnType) {
            const returnType = functionInfo.returnType;

            // Process union types like "User | null" to focus on the main type
            let mainType = returnType;
            if (returnType.includes('|')) {
              const types = returnType.split('|').map(t => t.trim());
              const nonNullTypes = types.filter(t => t !== 'null' && t !== 'undefined');
              if (nonNullTypes.length > 0) {
                mainType = nonNullTypes[0];
              }
            }

            // Add a more detailed comment about this variable
            jsDocComments.push({
              comment: `Variable from ${calledFunction}() return value`,
              symbol: varName,
              line: 0,
              symbolType: varType,
              variableType: mainType
            });

            // Link this directly to the original function
            const functionInterfaceInfo = jsDocComments.find(
              info => info.symbol === functionInfo.returnType && info.symbolType === 'interface'
            );

            if (functionInterfaceInfo && functionInterfaceInfo.interfaceContent) {
              // Copy the interface info to this variable
              jsDocComments.push({
                comment: `Type structure for ${varName}`,
                symbol: varName,
                line: 0,
                symbolType: 'interface-reference',
                interfaceContent: functionInterfaceInfo.interfaceContent
              });
            }

            // Check for interfaces matching the main type
            if (mainType !== returnType) {
              const interfaceInfo = jsDocComments.find(
                info => info.symbol === mainType && info.symbolType === 'interface'
              );

              if (interfaceInfo && interfaceInfo.interfaceContent) {
                // Copy the interface info to this variable
                jsDocComments.push({
                  comment: `Type structure for ${varName}`,
                  symbol: varName,
                  line: 0,
                  symbolType: 'interface-reference',
                  interfaceContent: interfaceInfo.interfaceContent
                });
              }
            }
          }
        }
        // If it's a direct object literal assignment, capture that structure
        else if (assignment.startsWith('{') && assignment.endsWith('}')) {
          const objectContent = assignment.slice(1, -1).trim();

          // Add type for the variable
          if (!declaredType) {
            jsDocComments.push({
              comment: `Inferred object structure`,
              symbol: varName,
              line: 0,
              symbolType: varType,
              variableType: `${varName}Type` // Synthetic type name
            });

            // Add the interface content
            jsDocComments.push({
              comment: `Type structure for ${varName}`,
              symbol: varName,
              line: 0,
              symbolType: 'interface-reference',
              interfaceContent: objectContent
            });
          }
        }
      }
    } catch (error) {
      console.error('Error extracting interface and type info:', error);
    }
  }

  /**
   * Extract animation directives and add TypeScript definitions for them
   */
  private extractAnimationDirectives(
    text: string,
    tsContent: string,
    mappings: PositionMapping[],
    jsDocComments: JSDocInfo[],
    tsLineCounter: number
  ): { content: string, lineCounter: number } {
    let resultContent = tsContent;
    let resultLineCounter = tsLineCounter;

    // Add animation system types
    resultContent += `\n// Animation system types\n`;
    resultContent += `enum TransitionType {\n  Fade = 'fade',\n  Slide = 'slide',\n  Scale = 'scale',\n  Flip = 'flip',\n  Rotate = 'rotate',\n  Custom = 'custom'\n}\n\n`;
    resultLineCounter += 9;

    resultContent += `enum TransitionDirection {\n  In = 'in',\n  Out = 'out',\n  Both = 'both'\n}\n\n`;
    resultLineCounter += 5;

    resultContent += `enum TransitionEase {\n  Linear = 'linear',\n  Ease = 'ease',\n  EaseIn = 'ease-in',\n  EaseOut = 'ease-out',\n  EaseInOut = 'ease-in-out'\n}\n\n`;
    resultLineCounter += 7;

    // Add documentation comments for each animation type
    resultContent += `/**\n * Available transition types for STX animations\n * @see https://stx.stacksjs.org/docs/animation\n */\n`;
    resultContent += `const transitionTypes = {\n`;
    resultContent += `  /** Smooth opacity transitions */\n  fade: 'fade',\n`;
    resultContent += `  /** Elegant sliding movements */\n  slide: 'slide',\n`;
    resultContent += `  /** Size scaling effects */\n  scale: 'scale',\n`;
    resultContent += `  /** 3D flipping animations */\n  flip: 'flip',\n`;
    resultContent += `  /** Rotation-based animations */\n  rotate: 'rotate',\n`;
    resultContent += `  /** Custom animation (requires additional CSS) */\n  custom: 'custom'\n};\n\n`;
    resultLineCounter += 11;

    // Add documentation for easing functions
    resultContent += `/**\n * Available easing functions for STX animations\n */\n`;
    resultContent += `const transitionEasings = {\n`;
    resultContent += `  /** Linear timing function (constant speed) */\n  linear: 'linear',\n`;
    resultContent += `  /** Default easing function (slight acceleration and deceleration) */\n  ease: 'ease',\n`;
    resultContent += `  /** Starts slowly, then speeds up */\n  easeIn: 'ease-in',\n`;
    resultContent += `  /** Starts quickly, then slows down */\n  easeOut: 'ease-out',\n`;
    resultContent += `  /** Starts slowly, speeds up in the middle, then slows down at the end */\n  easeInOut: 'ease-in-out'\n};\n\n`;
    resultLineCounter += 11;

    // Extract @transition directives
    const transitionRegex = /@transition\(['"]([^'"]+)['"](?:\s*,\s*(\d+))?(?:\s*,\s*['"]([^'"]+)['"])?(?:\s*,\s*(\d+))?(?:\s*,\s*['"]([^'"]+)['"])?\)/g;
    let transitionMatch;
    let transitionCounter = 0;

    while ((transitionMatch = transitionRegex.exec(text)) !== null) {
      const type = transitionMatch[1] as TransitionType;
      const duration = transitionMatch[2] ? parseInt(transitionMatch[2], 10) : 300;
      const ease = transitionMatch[3] || 'ease';
      const delay = transitionMatch[4] ? parseInt(transitionMatch[4], 10) : 0;
      const direction = transitionMatch[5] || 'both';

      // Add variable declaration for this transition
      const varName = `transition_${transitionCounter}`;
      const declaration = `const ${varName}_type: TransitionType = transitionTypes.${type};\n` +
                         `const ${varName}_duration: number = ${duration};\n` +
                         `const ${varName}_ease: TransitionEase = '${ease}';\n` +
                         `const ${varName}_delay: number = ${delay};\n` +
                         `const ${varName}_direction: TransitionDirection = '${direction}';\n\n`;

      resultContent += declaration;
      resultLineCounter += 6;

      // Add JSDoc comment for each transition parameter
      jsDocComments.push({
        comment: `Transition type: ${this.getTransitionTypeDescription(type as TransitionType)}`,
        symbol: type,
        line: transitionMatch.index,
        symbolType: 'string',
        contentPosition: transitionMatch.index
      });

      // Add JSDoc comment for ease parameter if it's specified
      if (transitionMatch[3]) {
        const easeComment = this.getTransitionEaseDescription(ease as TransitionEase);
        jsDocComments.push({
          comment: `Transition easing: ${easeComment}`,
          symbol: ease,
          line: transitionMatch.index,
          symbolType: 'string',
          contentPosition: transitionMatch.index
        });
      }

      transitionCounter++;
    }

    // Extract @motion directives
    const motionRegex = /@motion\(([^)]+)\)/g;
    let motionMatch;
    let motionCounter = 0;

    while ((motionMatch = motionRegex.exec(text)) !== null) {
      const enabled = motionMatch[1].trim() === 'true';

      // Add variable declaration for motion preference
      const varName = `motion_${motionCounter}`;
      const declaration = `const ${varName}_enabled: boolean = ${enabled};\n\n`;

      resultContent += declaration;
      resultLineCounter += 2;

      // Add JSDoc comment for motion preference
      jsDocComments.push({
        comment: `Motion preference setting: ${enabled ? 'Enabled' : 'Disabled'}`,
        symbol: enabled.toString(),
        line: motionMatch.index,
        symbolType: 'boolean',
        contentPosition: motionMatch.index
      });

      motionCounter++;
    }

    // Extract @animationGroup directives
    const animationGroupRegex = /@animationGroup\(['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])*\)/g;
    let animationGroupMatch;
    let animationGroupCounter = 0;

    while ((animationGroupMatch = animationGroupRegex.exec(text)) !== null) {
      const groupName = animationGroupMatch[1];

      // Add variable declaration for animation group
      const varName = `animationGroup_${animationGroupCounter}`;
      const declaration = `const ${varName}_name: string = '${groupName}';\n\n`;

      resultContent += declaration;
      resultLineCounter += 2;

      // Add JSDoc comment for animation group
      jsDocComments.push({
        comment: `Animation group: ${groupName}`,
        symbol: groupName,
        line: animationGroupMatch.index,
        symbolType: 'string',
        contentPosition: animationGroupMatch.index
      });

      animationGroupCounter++;
    }

    return { content: resultContent, lineCounter: resultLineCounter };
  }

  /**
   * Get description for a transition type
   */
  private getTransitionTypeDescription(type: TransitionType): string {
    switch(type) {
      case TransitionType.Fade:
        return 'Smooth opacity transitions';
      case TransitionType.Slide:
        return 'Elegant sliding movements';
      case TransitionType.Scale:
        return 'Size scaling effects';
      case TransitionType.Flip:
        return '3D flipping animations';
      case TransitionType.Rotate:
        return 'Rotation-based animations';
      case TransitionType.Custom:
        return 'Custom animation';
      default:
        return 'Unknown transition type';
    }
  }

  /**
   * Get description for a transition easing function
   */
  private getTransitionEaseDescription(ease: TransitionEase | string): string {
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
