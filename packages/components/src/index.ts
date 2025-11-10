// Export composables
export * from './composables'

// Export utilities
export * from './utils/highlighter'

// Export shared components (these will be imported as .stx files)
export { default as CodeBlock } from './components/CodeBlock.stx'
export { default as Hero } from './components/Hero.stx'
export { default as Footer } from './components/Footer.stx'
export { default as Installation } from './components/Installation.stx'

// Export UI components
export * from './ui/button'
export * from './ui/switch'

// Types
export interface ComponentProps {
  className?: string
  [key: string]: any
}

export interface CodeBlockProps extends ComponentProps {
  code: string
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  lineNumbers?: boolean
  copyable?: boolean
}

export interface HeroProps extends ComponentProps {
  title?: string
  description?: string
  githubUrl?: string
}

export interface FooterProps extends ComponentProps {
  author?: string
  authorUrl?: string
  project?: string
  projectUrl?: string
  twitterUrl?: string
  sponsorUrl?: string
  coffeeUrl?: string
}

export interface InstallationProps extends ComponentProps {
  packageName?: string
}
