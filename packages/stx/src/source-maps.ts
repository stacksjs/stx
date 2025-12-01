/**
 * Source Maps for stx Templates
 *
 * Provides source map generation for compiled templates, enabling
 * better debugging by mapping generated output back to source templates.
 *
 * ## Features
 *
 * - V3 Source Map format compatible with browsers and tools
 * - Tracks line/column mappings from source to generated
 * - Supports multiple source files (includes, components)
 * - Base64 VLQ encoding for compact representation
 *
 * ## Usage
 *
 * ```typescript
 * const generator = new SourceMapGenerator('output.html')
 * generator.addSource('template.stx', templateContent)
 *
 * // During template processing, add mappings
 * generator.addMapping({
 *   generated: { line: 1, column: 0 },
 *   source: 'template.stx',
 *   original: { line: 1, column: 0 }
 * })
 *
 * // Get the source map
 * const sourceMap = generator.toJSON()
 * const inlineMap = generator.toInlineComment()
 * ```
 *
 * @module source-maps
 */

import { Buffer } from 'node:buffer'

// =============================================================================
// Types
// =============================================================================

/**
 * Position in source or generated code
 */
export interface Position {
  /** 1-based line number */
  line: number
  /** 0-based column number */
  column: number
}

/**
 * A single mapping from generated to original position
 */
export interface Mapping {
  /** Position in generated code */
  generated: Position
  /** Source file path (optional for unmapped sections) */
  source?: string
  /** Position in original source (required if source is provided) */
  original?: Position
  /** Name/symbol at this position (optional) */
  name?: string
}

/**
 * V3 Source Map format
 * @see https://sourcemaps.info/spec.html
 */
export interface SourceMapV3 {
  /** Source map version (always 3) */
  version: 3
  /** Generated file name */
  file?: string
  /** Root path for source files */
  sourceRoot?: string
  /** List of source file paths */
  sources: string[]
  /** Original source contents (optional) */
  sourcesContent?: (string | null)[]
  /** List of symbol names */
  names: string[]
  /** VLQ-encoded mappings */
  mappings: string
}

// =============================================================================
// VLQ Encoding
// =============================================================================

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Encode a number as Base64 VLQ
 */
function encodeVLQ(value: number): string {
  let vlq = value < 0
    ? ((-value) << 1) + 1
    : value << 1

  let encoded = ''
  do {
    let digit = vlq & 0b11111
    vlq >>>= 5
    if (vlq > 0) {
      digit |= 0b100000 // continuation bit
    }
    encoded += BASE64_CHARS[digit]
  } while (vlq > 0)

  return encoded
}

/**
 * Decode Base64 VLQ to number
 */
export function decodeVLQ(encoded: string): { value: number, rest: string } {
  let value = 0
  let shift = 0
  let i = 0

  do {
    const char = encoded[i]
    const digit = BASE64_CHARS.indexOf(char)
    if (digit === -1) {
      throw new Error(`Invalid Base64 VLQ character: ${char}`)
    }
    value += (digit & 0b11111) << shift
    shift += 5
    i++
  } while (i < encoded.length && (BASE64_CHARS.indexOf(encoded[i - 1]) & 0b100000))

  // Convert from VLQ signed representation
  const isNegative = value & 1
  value >>>= 1
  if (isNegative) {
    value = -value
  }

  return { value, rest: encoded.slice(i) }
}

// =============================================================================
// Source Map Generator
// =============================================================================

/**
 * Source map generator for stx templates
 */
export class SourceMapGenerator {
  private file: string
  private sourceRoot?: string
  private sources: string[] = []
  private sourcesContent: Map<string, string> = new Map()
  private names: string[] = []
  private mappings: Mapping[] = []

  constructor(file: string, sourceRoot?: string) {
    this.file = file
    this.sourceRoot = sourceRoot
  }

  /**
   * Add a source file
   */
  addSource(path: string, content?: string): number {
    let index = this.sources.indexOf(path)
    if (index === -1) {
      index = this.sources.length
      this.sources.push(path)
    }
    if (content !== undefined) {
      this.sourcesContent.set(path, content)
    }
    return index
  }

  /**
   * Add a name/symbol
   */
  addName(name: string): number {
    let index = this.names.indexOf(name)
    if (index === -1) {
      index = this.names.length
      this.names.push(name)
    }
    return index
  }

  /**
   * Add a mapping
   */
  addMapping(mapping: Mapping): void {
    // Validate mapping
    if (mapping.source && !mapping.original) {
      throw new Error('Mapping with source must have original position')
    }

    // Ensure source is registered
    if (mapping.source) {
      this.addSource(mapping.source)
    }

    // Ensure name is registered
    if (mapping.name) {
      this.addName(mapping.name)
    }

    this.mappings.push(mapping)
  }

  /**
   * Add multiple mappings for a range of lines
   */
  addMappingRange(
    generatedStart: Position,
    source: string,
    originalStart: Position,
    lineCount: number,
  ): void {
    for (let i = 0; i < lineCount; i++) {
      this.addMapping({
        generated: { line: generatedStart.line + i, column: generatedStart.column },
        source,
        original: { line: originalStart.line + i, column: originalStart.column },
      })
    }
  }

  /**
   * Generate the VLQ-encoded mappings string
   */
  private generateMappings(): string {
    // Sort mappings by generated position
    const sorted = [...this.mappings].sort((a, b) => {
      if (a.generated.line !== b.generated.line) {
        return a.generated.line - b.generated.line
      }
      return a.generated.column - b.generated.column
    })

    const lines: string[][] = []
    let prevGeneratedColumn = 0
    let prevSourceIndex = 0
    let prevOriginalLine = 0
    let prevOriginalColumn = 0
    let prevNameIndex = 0
    let currentLine = 1

    for (const mapping of sorted) {
      // Fill in empty lines
      while (currentLine < mapping.generated.line) {
        lines.push([])
        currentLine++
        prevGeneratedColumn = 0
      }

      // Ensure we have an array for the current line
      if (!lines[currentLine - 1]) {
        lines[currentLine - 1] = []
      }

      let segment = ''

      // Field 1: Generated column (relative to previous in same line)
      segment += encodeVLQ(mapping.generated.column - prevGeneratedColumn)
      prevGeneratedColumn = mapping.generated.column

      if (mapping.source && mapping.original) {
        const sourceIndex = this.sources.indexOf(mapping.source)

        // Field 2: Source index (relative to previous)
        segment += encodeVLQ(sourceIndex - prevSourceIndex)
        prevSourceIndex = sourceIndex

        // Field 3: Original line (relative to previous, 0-based)
        segment += encodeVLQ((mapping.original.line - 1) - prevOriginalLine)
        prevOriginalLine = mapping.original.line - 1

        // Field 4: Original column (relative to previous)
        segment += encodeVLQ(mapping.original.column - prevOriginalColumn)
        prevOriginalColumn = mapping.original.column

        // Field 5: Name index (optional, relative to previous)
        if (mapping.name) {
          const nameIndex = this.names.indexOf(mapping.name)
          segment += encodeVLQ(nameIndex - prevNameIndex)
          prevNameIndex = nameIndex
        }
      }

      lines[currentLine - 1].push(segment)
    }

    return lines.map(segments => segments.join(',')).join(';')
  }

  /**
   * Generate the source map as JSON object
   */
  toJSON(): SourceMapV3 {
    const sourcesContent: (string | null)[] = this.sources.map(
      source => this.sourcesContent.get(source) ?? null,
    )

    return {
      version: 3,
      file: this.file,
      sourceRoot: this.sourceRoot,
      sources: this.sources,
      sourcesContent: sourcesContent.some(c => c !== null) ? sourcesContent : undefined,
      names: this.names,
      mappings: this.generateMappings(),
    }
  }

  /**
   * Generate the source map as JSON string
   */
  toString(): string {
    return JSON.stringify(this.toJSON())
  }

  /**
   * Generate as data URL
   */
  toDataURL(): string {
    const json = this.toString()
    const base64 = Buffer.from(json).toString('base64')
    return `data:application/json;charset=utf-8;base64,${base64}`
  }

  /**
   * Generate as inline comment for HTML
   */
  toInlineComment(): string {
    return `<!--# sourceMappingURL=${this.toDataURL()} -->`
  }

  /**
   * Generate as inline comment for JavaScript
   */
  toJSInlineComment(): string {
    return `//# sourceMappingURL=${this.toDataURL()}`
  }

  /**
   * Generate as inline comment for CSS
   */
  toCSSInlineComment(): string {
    return `/*# sourceMappingURL=${this.toDataURL()} */`
  }
}

// =============================================================================
// Source Map Consumer
// =============================================================================

/**
 * Source map consumer for parsing and querying source maps
 */
export class SourceMapConsumer {
  private sourceMap: SourceMapV3
  private decodedMappings: Array<{
    generatedLine: number
    generatedColumn: number
    sourceIndex: number
    originalLine: number
    originalColumn: number
    nameIndex: number
  }> = []

  constructor(sourceMap: SourceMapV3 | string) {
    this.sourceMap = typeof sourceMap === 'string'
      ? JSON.parse(sourceMap) as SourceMapV3
      : sourceMap

    this.decodeMappings()
  }

  /**
   * Decode the VLQ mappings string
   */
  private decodeMappings(): void {
    const lines = this.sourceMap.mappings.split(';')

    let generatedLine = 1
    let sourceIndex = 0
    let originalLine = 0
    let originalColumn = 0
    let nameIndex = 0

    for (const line of lines) {
      let generatedColumn = 0

      if (line) {
        const segments = line.split(',')

        for (const segment of segments) {
          if (!segment) {
            continue
          }

          let rest = segment

          // Field 1: Generated column
          const col = decodeVLQ(rest)
          generatedColumn += col.value
          rest = col.rest

          let mappingSourceIndex = -1
          let mappingOriginalLine = -1
          let mappingOriginalColumn = -1
          let mappingNameIndex = -1

          if (rest.length > 0) {
            // Field 2: Source index
            const src = decodeVLQ(rest)
            sourceIndex += src.value
            mappingSourceIndex = sourceIndex
            rest = src.rest

            // Field 3: Original line
            const origLine = decodeVLQ(rest)
            originalLine += origLine.value
            mappingOriginalLine = originalLine
            rest = origLine.rest

            // Field 4: Original column
            const origCol = decodeVLQ(rest)
            originalColumn += origCol.value
            mappingOriginalColumn = originalColumn
            rest = origCol.rest

            // Field 5: Name index (optional)
            if (rest.length > 0) {
              const name = decodeVLQ(rest)
              nameIndex += name.value
              mappingNameIndex = nameIndex
            }
          }

          this.decodedMappings.push({
            generatedLine,
            generatedColumn,
            sourceIndex: mappingSourceIndex,
            originalLine: mappingOriginalLine,
            originalColumn: mappingOriginalColumn,
            nameIndex: mappingNameIndex,
          })
        }
      }

      generatedLine++
    }
  }

  /**
   * Get the original position for a generated position
   */
  originalPositionFor(generated: Position): {
    source: string | null
    line: number | null
    column: number | null
    name: string | null
  } {
    // Find the closest mapping
    let closest = null
    let closestDist = Infinity

    for (const mapping of this.decodedMappings) {
      if (mapping.generatedLine === generated.line) {
        const dist = Math.abs(mapping.generatedColumn - generated.column)
        if (dist < closestDist && mapping.generatedColumn <= generated.column) {
          closest = mapping
          closestDist = dist
        }
      }
    }

    if (closest && closest.sourceIndex >= 0) {
      return {
        source: this.sourceMap.sources[closest.sourceIndex] || null,
        line: closest.originalLine + 1, // Convert back to 1-based
        column: closest.originalColumn,
        name: closest.nameIndex >= 0 ? this.sourceMap.names[closest.nameIndex] : null,
      }
    }

    return { source: null, line: null, column: null, name: null }
  }

  /**
   * Get the generated position for an original position
   */
  generatedPositionFor(original: { source: string, line: number, column?: number }): {
    line: number | null
    column: number | null
  } {
    const sourceIndex = this.sourceMap.sources.indexOf(original.source)
    if (sourceIndex === -1) {
      return { line: null, column: null }
    }

    const targetLine = original.line - 1 // Convert to 0-based

    for (const mapping of this.decodedMappings) {
      if (
        mapping.sourceIndex === sourceIndex
        && mapping.originalLine === targetLine
      ) {
        if (original.column === undefined || mapping.originalColumn === original.column) {
          return {
            line: mapping.generatedLine,
            column: mapping.generatedColumn,
          }
        }
      }
    }

    return { line: null, column: null }
  }

  /**
   * Get source content for a source file
   */
  sourceContentFor(source: string): string | null {
    const index = this.sourceMap.sources.indexOf(source)
    if (index === -1) {
      return null
    }
    return this.sourceMap.sourcesContent?.[index] ?? null
  }

  /**
   * Get all source files
   */
  get sources(): string[] {
    return [...this.sourceMap.sources]
  }

  /**
   * Get the source map
   */
  get rawSourceMap(): SourceMapV3 {
    return this.sourceMap
  }
}

// =============================================================================
// Template Tracker
// =============================================================================

/**
 * Tracks positions during template transformation for source map generation
 */
export class TemplateTracker {
  private generator: SourceMapGenerator
  private currentGeneratedLine = 1
  private currentGeneratedColumn = 0
  private sourceFile: string

  constructor(outputFile: string, sourceFile: string, sourceContent?: string) {
    this.generator = new SourceMapGenerator(outputFile)
    this.sourceFile = sourceFile
    if (sourceContent) {
      this.generator.addSource(sourceFile, sourceContent)
    }
  }

  /**
   * Track a simple 1:1 replacement
   */
  trackReplacement(
    originalLine: number,
    originalColumn: number,
    generatedContent: string,
  ): void {
    this.generator.addMapping({
      generated: { line: this.currentGeneratedLine, column: this.currentGeneratedColumn },
      source: this.sourceFile,
      original: { line: originalLine, column: originalColumn },
    })

    // Update position based on generated content
    const lines = generatedContent.split('\n')
    if (lines.length > 1) {
      this.currentGeneratedLine += lines.length - 1
      this.currentGeneratedColumn = lines[lines.length - 1].length
    }
    else {
      this.currentGeneratedColumn += generatedContent.length
    }
  }

  /**
   * Track content from a different source file (include/component)
   */
  trackInclude(
    includeFile: string,
    includeContent: string,
    generatedContent: string,
  ): void {
    this.generator.addSource(includeFile, includeContent)

    // Map each line of the included content
    const generatedLines = generatedContent.split('\n')
    for (let i = 0; i < generatedLines.length; i++) {
      this.generator.addMapping({
        generated: { line: this.currentGeneratedLine + i, column: 0 },
        source: includeFile,
        original: { line: i + 1, column: 0 },
      })
    }

    this.currentGeneratedLine += generatedLines.length - 1
    this.currentGeneratedColumn = generatedLines[generatedLines.length - 1].length
  }

  /**
   * Track unmapped generated content
   */
  trackGenerated(content: string): void {
    const lines = content.split('\n')
    if (lines.length > 1) {
      this.currentGeneratedLine += lines.length - 1
      this.currentGeneratedColumn = lines[lines.length - 1].length
    }
    else {
      this.currentGeneratedColumn += content.length
    }
  }

  /**
   * Add a newline
   */
  newLine(): void {
    this.currentGeneratedLine++
    this.currentGeneratedColumn = 0
  }

  /**
   * Get the current generated position
   */
  getCurrentPosition(): Position {
    return {
      line: this.currentGeneratedLine,
      column: this.currentGeneratedColumn,
    }
  }

  /**
   * Get the source map generator
   */
  getGenerator(): SourceMapGenerator {
    return this.generator
  }

  /**
   * Get the source map as JSON
   */
  toJSON(): SourceMapV3 {
    return this.generator.toJSON()
  }

  /**
   * Get the inline source map comment
   */
  toInlineComment(): string {
    return this.generator.toInlineComment()
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse an inline source map comment from content
 */
export function extractInlineSourceMap(content: string): SourceMapV3 | null {
  // HTML comment format
  const htmlMatch = content.match(/<!--#\s*sourceMappingURL=data:application\/json[^,]*,([^-]+)-->/)
  if (htmlMatch) {
    try {
      const decoded = Buffer.from(htmlMatch[1], 'base64').toString('utf-8')
      return JSON.parse(decoded) as SourceMapV3
    }
    catch {
      return null
    }
  }

  // JS comment format
  const jsMatch = content.match(/\/\/#\s*sourceMappingURL=data:application\/json[^,]*,(.+)$/)
  if (jsMatch) {
    try {
      const decoded = Buffer.from(jsMatch[1], 'base64').toString('utf-8')
      return JSON.parse(decoded) as SourceMapV3
    }
    catch {
      return null
    }
  }

  return null
}

/**
 * Remove inline source map comments from content
 */
export function removeInlineSourceMap(content: string): string {
  return content
    .replace(/<!--#\s*sourceMappingURL=[^-]+-->/g, '')
    .replace(/\/\/#\s*sourceMappingURL=.+$/gm, '')
    .replace(/\/\*#\s*sourceMappingURL=.+\*\//g, '')
}

/**
 * Calculate line and column from an offset in content
 */
export function offsetToPosition(content: string, offset: number): Position {
  const before = content.slice(0, offset)
  const lines = before.split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
  }
}

/**
 * Calculate offset from line and column in content
 */
export function positionToOffset(content: string, position: Position): number {
  const lines = content.split('\n')
  let offset = 0

  for (let i = 0; i < position.line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1 // +1 for newline
  }

  offset += position.column
  return offset
}
