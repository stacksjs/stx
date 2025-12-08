/**
 * STX Story - Figma Export
 * Export component designs to Figma format
 */

import type { AnalyzedComponent, StoryAnalyzedProp } from './types'

/**
 * Figma node types
 */
export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'

/**
 * Figma color
 */
export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Figma paint (fill/stroke)
 */
export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE'
  color?: FigmaColor
  opacity?: number
}

/**
 * Figma text style
 */
export interface FigmaTextStyle {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight?: { value: number, unit: 'PIXELS' | 'PERCENT' | 'AUTO' }
  letterSpacing?: { value: number, unit: 'PIXELS' | 'PERCENT' }
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
}

/**
 * Figma node base
 */
export interface FigmaNodeBase {
  id: string
  name: string
  type: FigmaNodeType
  visible?: boolean
  locked?: boolean
}

/**
 * Figma frame node
 */
export interface FigmaFrameNode extends FigmaNodeBase {
  type: 'FRAME' | 'COMPONENT' | 'COMPONENT_SET'
  children: FigmaNode[]
  absoluteBoundingBox?: { x: number, y: number, width: number, height: number }
  constraints?: { horizontal: string, vertical: string }
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  strokeWeight?: number
  cornerRadius?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX'
}

/**
 * Figma text node
 */
export interface FigmaTextNode extends FigmaNodeBase {
  type: 'TEXT'
  characters: string
  style?: FigmaTextStyle
  fills?: FigmaPaint[]
}

/**
 * Figma rectangle node
 */
export interface FigmaRectangleNode extends FigmaNodeBase {
  type: 'RECTANGLE'
  absoluteBoundingBox?: { x: number, y: number, width: number, height: number }
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  strokeWeight?: number
  cornerRadius?: number
}

/**
 * Union of all Figma node types
 */
export type FigmaNode = FigmaFrameNode | FigmaTextNode | FigmaRectangleNode | FigmaNodeBase

/**
 * Figma document
 */
export interface FigmaDocument {
  name: string
  lastModified: string
  version: string
  document: {
    id: string
    name: string
    type: 'DOCUMENT'
    children: FigmaNode[]
  }
  components: Record<string, FigmaComponentMeta>
  styles: Record<string, FigmaStyleMeta>
}

/**
 * Figma component metadata
 */
export interface FigmaComponentMeta {
  key: string
  name: string
  description: string
}

/**
 * Figma style metadata
 */
export interface FigmaStyleMeta {
  key: string
  name: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
}

/**
 * Export options
 */
export interface FigmaExportOptions {
  /** Include variants as component set */
  includeVariants?: boolean
  /** Include prop documentation */
  includeProps?: boolean
  /** Base frame width */
  frameWidth?: number
  /** Base frame height */
  frameHeight?: number
  /** Spacing between components */
  componentSpacing?: number
}

/**
 * Export components to Figma format
 */
export function exportToFigma(
  components: AnalyzedComponent[],
  options: FigmaExportOptions = {},
): FigmaDocument {
  const {
    includeVariants: _includeVariants = true,
    includeProps = true,
    frameWidth = 400,
    frameHeight = 300,
    componentSpacing = 40,
  } = options

  const figmaComponents: Record<string, FigmaComponentMeta> = {}
  const figmaStyles: Record<string, FigmaStyleMeta> = {}
  const canvasChildren: FigmaNode[] = []

  let xOffset = 0

  for (const component of components) {
    const componentId = generateId()

    // Create component frame
    const componentFrame = createComponentFrame(
      component,
      componentId,
      xOffset,
      0,
      frameWidth,
      frameHeight,
      includeProps,
    )

    canvasChildren.push(componentFrame)

    // Add to components registry
    figmaComponents[componentId] = {
      key: componentId,
      name: component.name,
      description: component.description || '',
    }

    xOffset += frameWidth + componentSpacing
  }

  return {
    name: 'STX Components',
    lastModified: new Date().toISOString(),
    version: '1.0.0',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '0:1',
          name: 'Components',
          type: 'CANVAS',
          children: canvasChildren,
        } as unknown as FigmaFrameNode,
      ],
    },
    components: figmaComponents,
    styles: figmaStyles,
  }
}

/**
 * Create a component frame
 */
function createComponentFrame(
  component: AnalyzedComponent,
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  includeProps: boolean,
): FigmaFrameNode {
  const children: FigmaNode[] = []

  // Component name text
  children.push({
    id: `${id}:title`,
    name: 'Title',
    type: 'TEXT',
    characters: component.name,
    style: {
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 16,
    },
    fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
  } as FigmaTextNode)

  // Description if available
  if (component.description) {
    children.push({
      id: `${id}:desc`,
      name: 'Description',
      type: 'TEXT',
      characters: component.description,
      style: {
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSize: 12,
      },
      fills: [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
    } as FigmaTextNode)
  }

  // Props documentation
  if (includeProps && component.props.length > 0) {
    const propsFrame = createPropsFrame(component.props, `${id}:props`)
    children.push(propsFrame)
  }

  // Component preview placeholder
  children.push({
    id: `${id}:preview`,
    name: 'Preview',
    type: 'RECTANGLE',
    absoluteBoundingBox: { x: 0, y: 0, width: width - 32, height: 150 },
    fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95, a: 1 } }],
    strokes: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }],
    strokeWeight: 1,
    cornerRadius: 8,
  } as FigmaRectangleNode)

  return {
    id,
    name: component.name,
    type: 'COMPONENT',
    children,
    absoluteBoundingBox: { x, y, width, height },
    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
    strokes: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }],
    strokeWeight: 1,
    cornerRadius: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 16,
    itemSpacing: 12,
    layoutMode: 'VERTICAL',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'MIN',
  }
}

/**
 * Create props documentation frame
 */
function createPropsFrame(props: StoryAnalyzedProp[], id: string): FigmaFrameNode {
  const children: FigmaNode[] = []

  // Props header
  children.push({
    id: `${id}:header`,
    name: 'Props Header',
    type: 'TEXT',
    characters: 'Props',
    style: {
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 12,
    },
    fills: [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4, a: 1 } }],
  } as FigmaTextNode)

  // Individual props
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    children.push({
      id: `${id}:prop:${i}`,
      name: prop.name,
      type: 'TEXT',
      characters: `${prop.name}: ${prop.type}${prop.required ? ' (required)' : ''}`,
      style: {
        fontFamily: 'SF Mono',
        fontWeight: 400,
        fontSize: 11,
      },
      fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2, a: 1 } }],
    } as FigmaTextNode)
  }

  return {
    id,
    name: 'Props',
    type: 'FRAME',
    children,
    fills: [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98, a: 1 } }],
    cornerRadius: 6,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    itemSpacing: 4,
    layoutMode: 'VERTICAL',
    primaryAxisAlignItems: 'MIN',
    counterAxisAlignItems: 'MIN',
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Export to Figma JSON file
 */
export async function exportToFigmaFile(
  components: AnalyzedComponent[],
  outputPath: string,
  options: FigmaExportOptions = {},
): Promise<void> {
  const figmaDoc = exportToFigma(components, options)
  const json = JSON.stringify(figmaDoc, null, 2)

  const fs = await import('node:fs')
  const path = await import('node:path')

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.promises.writeFile(outputPath, json)
}

/**
 * Convert CSS color to Figma color
 */
export function cssColorToFigma(cssColor: string): FigmaColor {
  // Handle hex colors
  if (cssColor.startsWith('#')) {
    const hex = cssColor.slice(1)
    const r = Number.parseInt(hex.slice(0, 2), 16) / 255
    const g = Number.parseInt(hex.slice(2, 4), 16) / 255
    const b = Number.parseInt(hex.slice(4, 6), 16) / 255
    const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }

  // Handle rgb/rgba
  const rgbMatch = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbMatch) {
    return {
      r: Number.parseInt(rgbMatch[1]) / 255,
      g: Number.parseInt(rgbMatch[2]) / 255,
      b: Number.parseInt(rgbMatch[3]) / 255,
      a: rgbMatch[4] ? Number.parseFloat(rgbMatch[4]) : 1,
    }
  }

  // Default to black
  return { r: 0, g: 0, b: 0, a: 1 }
}

/**
 * Convert Figma color to CSS
 */
export function figmaColorToCss(color: FigmaColor): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)

  if (color.a === 1) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return `rgba(${r}, ${g}, ${b}, ${color.a})`
}

/**
 * Generate Figma plugin manifest
 */
export function generateFigmaPluginManifest(name: string): object {
  return {
    name,
    id: `stx-story-${name.toLowerCase().replace(/\s+/g, '-')}`,
    api: '1.0.0',
    main: 'code.js',
    ui: 'ui.html',
    editorType: ['figma'],
    capabilities: ['inspect'],
    permissions: ['currentuser'],
  }
}

/**
 * Generate Figma import code snippet
 */
export function generateFigmaImportCode(components: AnalyzedComponent[]): string {
  const componentNames = components.map(c => c.name).join(', ')

  return `
// Figma Plugin Code to import STX components
// Run this in Figma's plugin console

const components = ${JSON.stringify(components.map(c => ({
  name: c.name,
  props: c.props.map(p => ({ name: p.name, type: p.type })),
})), null, 2)};

async function importComponents() {
  for (const comp of components) {
    const frame = figma.createFrame();
    frame.name = comp.name;
    frame.resize(400, 300);

    // Add title
    const title = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    title.fontName = { family: "Inter", style: "Semi Bold" };
    title.characters = comp.name;
    title.fontSize = 16;
    frame.appendChild(title);

    // Position on canvas
    frame.x = figma.viewport.center.x;
    frame.y = figma.viewport.center.y;
  }

  figma.notify('Imported ${componentNames}');
}

importComponents();
`
}
