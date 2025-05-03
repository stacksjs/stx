import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to find CSS styles for a class
export function findCssStylesForClass(document: vscode.TextDocument, className: string): string[] {
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
export function isInStyleTag(document: vscode.TextDocument, position: vscode.Position): boolean {
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

// Interface to return the position of a CSS class definition
export interface CssDefinitionPosition {
  line: number;
  character: number;
}

// Find the position of a CSS class definition in a document
export function findCssDefinitionForClass(document: vscode.TextDocument, className: string): CssDefinitionPosition | null {
  try {
    const text = document.getText();

    // Look for style blocks in the document
    const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let styleMatch;

    while ((styleMatch = styleBlockRegex.exec(text)) !== null) {
      const styleContent = styleMatch[1];
      const styleStartOffset = styleMatch.index + styleMatch[0].indexOf('>') + 1;

      // Look for class selectors within this style block
      const selectorRegex = new RegExp(`\\.${className}\\s*{`, 'g');
      let selectorMatch;

      // We need to search within the style content but keep track of absolute position
      let relativeText = styleContent;
      let relativeOffset = 0;

      while ((selectorMatch = selectorRegex.exec(relativeText)) !== null) {
        // Calculate the document offset where this class is defined
        const absoluteOffset = styleStartOffset + relativeOffset + selectorMatch.index;
        const position = document.positionAt(absoluteOffset);

        // Return the position of the class definition
        return {
          line: position.line,
          character: position.character
        };
      }
    }

    // Also look for linked CSS files - future enhancement:
    // Could open external files but requires additional handling

    // If no definition found
    return null;
  } catch (e) {
    console.error("Error finding CSS class definition:", e);
    return null;
  }
}

// Helper function to check if word is a CSS class name in a style block
export function isCssClassName(document: vscode.TextDocument, position: vscode.Position, word: string): boolean {
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