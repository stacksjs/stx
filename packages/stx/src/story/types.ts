/**
 * STX Story - Component showcase and testing
 * Type definitions for the story feature
 */

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Tree group configuration for organizing stories
 */
export interface TreeGroupConfig {
  /** Display title for the group */
  title: string
  /** Unique identifier for the group */
  id?: string
  /** Function to determine if a file belongs to this group */
  include?: (file: StoryTreeFile) => boolean
}

/**
 * Responsive viewport preset
 */
export interface ResponsivePreset {
  /** Display label */
  label: string
  /** Viewport width in pixels */
  width: number
  /** Viewport height in pixels (optional) */
  height?: number
}

/**
 * Background preset for story canvas
 */
export interface BackgroundPreset {
  /** Display label */
  label: string
  /** Background color (CSS value) */
  color: string
  /** Contrast color for text (optional) */
  contrastColor?: string
}

/**
 * Story theme configuration
 */
export interface StoryThemeConfig {
  /** Title displayed in the story UI */
  title?: string
  /** Logo configuration */
  logo?: {
    /** Square logo (for favicon/small displays) */
    square?: string
    /** Light theme logo */
    light?: string
    /** Dark theme logo */
    dark?: string
  }
  /** Favicon path */
  favicon?: string
  /** Custom colors */
  colors?: {
    /** Primary accent color shades */
    primary?: Record<string, string>
    /** Gray color shades */
    gray?: Record<string, string>
  }
  /** Default color scheme */
  defaultColorScheme?: 'light' | 'dark' | 'auto'
  /** Hide the color scheme toggle */
  hideColorSchemeSwitch?: boolean
  /** CSS class to apply for dark mode */
  darkClass?: string
}

/**
 * Story tree configuration
 */
export interface StoryTreeConfig {
  /** How to generate tree paths from files */
  file?: 'title' | 'path' | ((file: StoryTreeFile) => string[])
  /** Sort order for tree items */
  order?: 'asc' | ((a: string, b: string) => number)
  /** Group configurations */
  groups?: TreeGroupConfig[]
}

/**
 * Story configuration (part of StxConfig)
 */
export interface StoryConfig {
  /** Enable the story feature */
  enabled?: boolean
  /** Output directory for built story site */
  outDir?: string
  /** Glob patterns to match story files */
  storyMatch?: string[]
  /** Glob patterns to ignore */
  storyIgnored?: string[]
  /** Tree organization configuration */
  tree?: StoryTreeConfig
  /** Theme configuration */
  theme?: StoryThemeConfig
  /** Responsive viewport presets */
  responsivePresets?: ResponsivePreset[]
  /** Background presets */
  backgroundPresets?: BackgroundPreset[]
  /** Auto-apply contrast color to text */
  autoApplyContrastColor?: boolean
  /** Path to setup file for global configuration */
  setupFile?: string
  /** Default server port */
  port?: number
  /** Disable auto-generated props controls globally */
  autoPropsDisabled?: boolean
}

// =============================================================================
// Story File Types
// =============================================================================

/**
 * File information for tree configuration
 */
export interface StoryTreeFile {
  /** Story title */
  title: string
  /** File path */
  path: string
}

/**
 * Server-side story file representation
 */
export interface ServerStoryFile {
  /** Unique identifier */
  id: string
  /** Absolute file path */
  path: string
  /** Relative file path */
  relativePath: string
  /** File name without extension */
  fileName: string
  /** Generated tree path */
  treePath?: string[]
  /** Tree file data for config functions */
  treeFile?: StoryTreeFile
  /** Parsed story data */
  story?: ServerStory
}

// =============================================================================
// Story Definition Types
// =============================================================================

/**
 * Story layout configuration
 */
export type StoryLayout =
  | { type: 'single', iframe?: boolean }
  | { type: 'grid', width?: number | string }

/**
 * Server-side story representation
 */
export interface ServerStory {
  /** Unique identifier */
  id: string
  /** Story title */
  title: string
  /** Group this story belongs to */
  group?: string
  /** Story variants */
  variants: ServerVariant[]
  /** Layout configuration */
  layout?: StoryLayout
  /** Icon name (iconify format) */
  icon?: string
  /** Icon color */
  iconColor?: string
  /** Show only in docs, not in canvas */
  docsOnly?: boolean
  /** Disable auto-generated props controls for this story */
  autoPropsDisabled?: boolean
}

/**
 * Server-side variant representation
 */
export interface ServerVariant {
  /** Unique identifier */
  id: string
  /** Variant title */
  title: string
  /** Icon name */
  icon?: string
  /** Icon color */
  iconColor?: string
  /** Initial state for controls */
  state?: Record<string, any>
  /** Source code for display */
  source?: string
  /** Disable responsive controls */
  responsiveDisabled?: boolean
}

// =============================================================================
// Tree Types
// =============================================================================

/**
 * Tree leaf node (story)
 */
export interface ServerTreeLeaf {
  /** Display title */
  title: string
  /** Index in story files array */
  index: number
}

/**
 * Tree folder node
 */
export interface ServerTreeFolder {
  /** Display title */
  title: string
  /** Child nodes */
  children: ServerTreeNode[]
}

/**
 * Tree group node
 */
export interface ServerTreeGroup {
  /** Indicates this is a group */
  group: true
  /** Group identifier */
  id: string
  /** Display title */
  title: string
  /** Child nodes */
  children: ServerTreeNode[]
}

/**
 * Any tree node type
 */
export type ServerTreeNode = ServerTreeGroup | ServerTreeFolder | ServerTreeLeaf

/**
 * Complete server tree
 */
export type ServerTree = ServerTreeNode[]

// =============================================================================
// Component Analysis Types
// =============================================================================

/**
 * Analyzed component prop for story
 */
export interface StoryAnalyzedProp {
  /** Prop name */
  name: string
  /** Inferred or declared type */
  type: string
  /** Whether the prop is required */
  required: boolean
  /** Default value if any */
  default?: any
  /** Description from JSDoc */
  description?: string
  /** Options for enum/select types */
  options?: any[]
}

/**
 * Analyzed component slot
 */
export interface AnalyzedSlot {
  /** Slot name ('default' for main slot) */
  name: string
  /** Description from comments */
  description?: string
}

/**
 * Directive usage in a component
 */
export interface DirectiveUsage {
  /** Directive name (e.g., 'if', 'foreach', 'component') */
  name: string
  /** Number of times used */
  count: number
}

/**
 * Analyzed component metadata
 */
export interface AnalyzedComponent {
  /** Component name */
  name: string
  /** File path */
  path: string
  /** Component description */
  description?: string
  /** Analyzed props */
  props: StoryAnalyzedProp[]
  /** Analyzed slots */
  slots: AnalyzedSlot[]
  /** Component dependencies (other components used) */
  dependencies: string[]
  /** CSS classes used (for Crosswind) */
  cssClasses: string[]
  /** Directives used in the component */
  directives?: DirectiveUsage[]
  /** Category/group */
  category?: string
  /** Tags for filtering */
  tags?: string[]
}

// =============================================================================
// Control Types
// =============================================================================

/**
 * Control type for prop editing
 */
export type ControlType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'radio'
  | 'color'
  | 'date'
  | 'json'
  | 'textarea'
  | 'slider'
  | 'buttongroup'

/**
 * Control configuration
 */
export interface ControlConfig {
  /** Control type */
  type: ControlType
  /** Display title */
  title?: string
  /** Options for select/radio */
  options?: { value: any, label: string }[] | string[] | Record<string, string>
  /** Min value for number/slider */
  min?: number
  /** Max value for number/slider */
  max?: number
  /** Step for number/slider */
  step?: number
}

// =============================================================================
// Context Types
// =============================================================================

/**
 * Story context for server operations
 */
export interface StoryContext {
  /** Root directory */
  root: string
  /** Resolved configuration */
  config: ResolvedStoryConfig
  /** Discovered story files */
  storyFiles: ServerStoryFile[]
  /** Built tree structure */
  tree?: ServerTree
  /** Mode (dev or build) */
  mode: 'dev' | 'build'
}

/**
 * Resolved story configuration with all defaults applied
 */
export interface ResolvedStoryConfig {
  enabled: boolean
  outDir: string
  storyMatch: string[]
  storyIgnored: string[]
  tree: Required<StoryTreeConfig>
  theme: StoryThemeConfig
  responsivePresets: ResponsivePreset[]
  backgroundPresets: BackgroundPreset[]
  autoApplyContrastColor: boolean
  setupFile?: string
  port: number
}
