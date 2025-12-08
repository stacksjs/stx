/**
 * STX Story - Tree builder
 * Builds the navigation tree from story files
 */

import type {
  ResolvedStoryConfig,
  ServerStoryFile,
  ServerTree,
  ServerTreeFolder,
  ServerTreeGroup,
  ServerTreeLeaf,
  ServerTreeNode,
  StoryTreeFile,
} from '../types'

/**
 * Create tree path from a story file
 */
export function createTreePath(
  config: ResolvedStoryConfig,
  file: ServerStoryFile,
): string[] {
  const treeFile: StoryTreeFile = file.treeFile || {
    title: file.fileName,
    path: file.relativePath,
  }

  if (config.tree.file === 'title') {
    // Use title, split by /
    return treeFile.title.split('/')
  }

  if (config.tree.file === 'path') {
    // Use file path
    const pathParts = file.relativePath.split('/').slice(0, -1)
    return [...pathParts, treeFile.title]
  }

  // Custom function
  if (typeof config.tree.file === 'function') {
    return config.tree.file(treeFile)
  }

  return [treeFile.title]
}

/**
 * Build the navigation tree from story files
 */
export function buildTree(
  config: ResolvedStoryConfig,
  files: ServerStoryFile[],
): ServerTree {
  // First, assign tree paths to all files
  for (const file of files) {
    file.treePath = createTreePath(config, file)
  }

  // Create groups
  const groups: Array<{
    groupConfig?: { id: string, title: string, include?: (file: StoryTreeFile) => boolean }
    treeObject: Record<string, any>
  }> = (config.tree.groups || []).map(g => ({
    groupConfig: { id: g.id || g.title, title: g.title, include: g.include },
    treeObject: {},
  }))

  // Default group for ungrouped items
  const defaultGroup = { treeObject: {} }
  groups.push(defaultGroup)

  // Assign files to groups
  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    const group = getGroup(file, groups, defaultGroup)
    setPath(file.treePath!, index, group.treeObject)
  }

  // Get sort function
  const sortFn = config.tree.order === 'asc'
    ? (a: string, b: string) => a.localeCompare(b)
    : config.tree.order

  // Build final tree
  const result: ServerTree = []

  for (const group of groups) {
    if (group === defaultGroup) {
      result.push(...buildTreeFromObject(group.treeObject, sortFn))
    }
    else if (group.groupConfig && Object.keys(group.treeObject).length > 0) {
      result.push({
        group: true,
        id: group.groupConfig.id,
        title: group.groupConfig.title,
        children: buildTreeFromObject(group.treeObject, sortFn),
      } as ServerTreeGroup)
    }
  }

  return result
}

/**
 * Get the group a file belongs to
 */
function getGroup(
  file: ServerStoryFile,
  groups: Array<{ groupConfig?: { include?: (file: StoryTreeFile) => boolean }, treeObject: Record<string, any> }>,
  defaultGroup: { treeObject: Record<string, any> },
): { treeObject: Record<string, any> } {
  const treeFile = file.treeFile || { title: file.fileName, path: file.relativePath }

  for (const group of groups) {
    if (group.groupConfig?.include && group.groupConfig.include(treeFile)) {
      return group
    }
  }

  return defaultGroup
}

/**
 * Set a value at a path in the tree object
 */
function setPath(path: string[], value: number, tree: Record<string, any>): void {
  let current = tree

  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const isLast = i === path.length - 1

    if (isLast) {
      // Handle duplicate keys
      if (current[key] !== undefined) {
        let copyNumber = 1
        while (current[`${key}-${copyNumber}`] !== undefined) {
          copyNumber++
        }
        current[`${key}-${copyNumber}`] = value
      }
      else {
        current[key] = value
      }
    }
    else {
      // Create intermediate object if needed
      if (current[key] === undefined) {
        current[key] = {}
      }
      else if (typeof current[key] === 'number') {
        // Convert leaf to folder
        const leafValue = current[key]
        current[key] = { '': leafValue }
      }
      current = current[key]
    }
  }
}

/**
 * Build tree nodes from object structure
 */
function buildTreeFromObject(
  obj: Record<string, any>,
  sortFn: (a: string, b: string) => number,
): ServerTreeNode[] {
  const nodes: ServerTreeNode[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number') {
      // Leaf node
      nodes.push({
        title: key,
        index: value,
      } as ServerTreeLeaf)
    }
    else {
      // Folder node
      nodes.push({
        title: key,
        children: buildTreeFromObject(value, sortFn),
      } as ServerTreeFolder)
    }
  }

  // Sort nodes
  nodes.sort((a, b) => sortFn(a.title, b.title))

  return nodes
}

/**
 * Flatten tree to get all leaf indices in order
 */
export function flattenTree(tree: ServerTree): number[] {
  const indices: number[] = []

  function walk(nodes: ServerTreeNode[]): void {
    for (const node of nodes) {
      if ('index' in node) {
        indices.push(node.index)
      }
      else if ('children' in node) {
        walk(node.children)
      }
    }
  }

  walk(tree)
  return indices
}

/**
 * Find a story in the tree by index
 */
export function findStoryInTree(
  tree: ServerTree,
  index: number,
): { path: string[], node: ServerTreeLeaf } | null {
  function walk(nodes: ServerTreeNode[], currentPath: string[]): { path: string[], node: ServerTreeLeaf } | null {
    for (const node of nodes) {
      if ('index' in node && node.index === index) {
        return { path: [...currentPath, node.title], node }
      }
      else if ('children' in node) {
        const result = walk(node.children, [...currentPath, node.title])
        if (result)
          return result
      }
    }
    return null
  }

  return walk(tree, [])
}
