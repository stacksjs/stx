// Simple declaration to allow importing .stx files
declare module '*.stx'

// Declaration to allow importing .md files with frontmatter
declare module '*.md' {
  // Content is the HTML rendered from markdown
  const content: string
  // Data is the parsed frontmatter
  const data: Record<string, any>

  // Default export is the content
  export default content
  // Named export for frontmatter data
  export { data }
}
