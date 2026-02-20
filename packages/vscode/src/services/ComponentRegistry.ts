import * as vscode from 'vscode'
import * as path from 'node:path'
import { PropsTypeExtractor } from './PropsTypeExtractor'
import type { PropDetail } from './PropsTypeExtractor'

/**
 * Information about a registered component
 */
export interface ComponentInfo {
  /** Component name (e.g., "Button", "Card") */
  name: string
  /** Absolute file path to the .stx file */
  filePath: string
  /** TypeScript type literal for props (e.g., "{ title: string; count?: number }") */
  propsType: string | null
  /** Individual prop details for IntelliSense */
  propDetails: PropDetail[]
  /** File modification time for cache invalidation */
  lastModified: number
}

/**
 * Singleton registry that tracks all .stx components in the workspace.
 * Provides prop type information for IntelliSense features.
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry | null = null

  /** Map of component name (lowercase) to ComponentInfo */
  private componentsByName = new Map<string, ComponentInfo>()

  /** Map of file path to ComponentInfo */
  private componentsByPath = new Map<string, ComponentInfo>()

  /** File system watcher for .stx files */
  private fileWatcher: vscode.FileSystemWatcher | null = null

  /** Event emitter for component changes */
  private _onComponentChanged = new vscode.EventEmitter<ComponentInfo>()
  public readonly onComponentChanged = this._onComponentChanged.event

  /** Props type extractor instance */
  private extractor = new PropsTypeExtractor()

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry()
    }
    return ComponentRegistry.instance
  }

  /**
   * Reset the singleton (for testing)
   */
  public static resetInstance(): void {
    if (ComponentRegistry.instance) {
      ComponentRegistry.instance.dispose()
      ComponentRegistry.instance = null
    }
  }

  /**
   * Scan the workspace for all .stx component files
   */
  public async scanWorkspace(): Promise<void> {
    const stxFiles = await vscode.workspace.findFiles('**/*.stx', '**/node_modules/**')

    for (const file of stxFiles) {
      await this.registerComponent(file.fsPath)
    }

    console.log(`[ComponentRegistry] Scanned ${this.componentsByName.size} components`)
  }

  /**
   * Register a component from a file path
   */
  public async registerComponent(filePath: string): Promise<ComponentInfo | null> {
    try {
      const uri = vscode.Uri.file(filePath)
      const stat = await vscode.workspace.fs.stat(uri)
      const content = await vscode.workspace.fs.readFile(uri)
      const text = Buffer.from(content).toString('utf-8')

      // Extract component name from file path
      const name = this.extractComponentName(filePath)

      // Extract props type from the component
      const extracted = this.extractor.extractPropsType(text)

      const info: ComponentInfo = {
        name,
        filePath,
        propsType: extracted.typeAnnotation,
        propDetails: extracted.propDetails,
        lastModified: stat.mtime,
      }

      // Store by both name and path for flexible lookup
      this.componentsByName.set(name.toLowerCase(), info)
      this.componentsByPath.set(filePath, info)

      // Also store by various name formats (PascalCase, kebab-case)
      const pascalName = this.toPascalCase(name)
      const kebabName = this.toKebabCase(name)
      if (pascalName.toLowerCase() !== name.toLowerCase()) {
        this.componentsByName.set(pascalName.toLowerCase(), info)
      }
      if (kebabName.toLowerCase() !== name.toLowerCase()) {
        this.componentsByName.set(kebabName.toLowerCase(), info)
      }

      this._onComponentChanged.fire(info)

      return info
    }
    catch (error) {
      console.error(`[ComponentRegistry] Failed to register component: ${filePath}`, error)
      return null
    }
  }

  /**
   * Unregister a component by file path
   */
  public unregisterComponent(filePath: string): void {
    const info = this.componentsByPath.get(filePath)
    if (info) {
      this.componentsByName.delete(info.name.toLowerCase())
      this.componentsByPath.delete(filePath)

      // Also remove alternate name formats
      const pascalName = this.toPascalCase(info.name)
      const kebabName = this.toKebabCase(info.name)
      this.componentsByName.delete(pascalName.toLowerCase())
      this.componentsByName.delete(kebabName.toLowerCase())
    }
  }

  /**
   * Get component info by name
   */
  public getComponent(name: string): ComponentInfo | undefined {
    return this.componentsByName.get(name.toLowerCase())
  }

  /**
   * Get component info by file path
   */
  public getComponentByPath(filePath: string): ComponentInfo | undefined {
    return this.componentsByPath.get(filePath)
  }

  /**
   * Get all registered components
   */
  public getAllComponents(): ComponentInfo[] {
    // Use componentsByPath to avoid duplicates from name aliases
    return Array.from(this.componentsByPath.values())
  }

  /**
   * Watch the workspace for .stx file changes
   */
  public watchWorkspace(context: vscode.ExtensionContext): void {
    this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.stx')

    this.fileWatcher.onDidCreate(async (uri) => {
      await this.registerComponent(uri.fsPath)
    })

    this.fileWatcher.onDidChange(async (uri) => {
      await this.registerComponent(uri.fsPath)
    })

    this.fileWatcher.onDidDelete((uri) => {
      this.unregisterComponent(uri.fsPath)
    })

    context.subscriptions.push(this.fileWatcher)
  }

  /**
   * Extract component name from file path
   * e.g., "/path/to/Button.stx" -> "Button"
   */
  private extractComponentName(filePath: string): string {
    const basename = path.basename(filePath, '.stx')
    return this.toPascalCase(basename)
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * Convert PascalCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      .toLowerCase()
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.fileWatcher?.dispose()
    this._onComponentChanged.dispose()
    this.componentsByName.clear()
    this.componentsByPath.clear()
  }
}
