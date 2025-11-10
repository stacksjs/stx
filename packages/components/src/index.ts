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
export * from './ui/accordion'
export * from './ui/auth'
export * from './ui/audio'
export * from './ui/avatar'
export * from './ui/badge'
export * from './ui/breadcrumb'
export * from './ui/button'
export * from './ui/card'
export * from './ui/checkbox'
export * from './ui/drawer'
export * from './ui/image'
export * from './ui/input'
export * from './ui/payment'
export * from './ui/radio'
export * from './ui/select'
export * from './ui/skeleton'
export * from './ui/spinner'
export * from './ui/storage'
export * from './ui/switch'
export * from './ui/textarea'
export * from './ui/video'
export * from './ui/dropdown'
export * from './ui/dialog'
export * from './ui/radio-group'
export * from './ui/popover'
export * from './ui/listbox'
export * from './ui/combobox'
export * from './ui/notification'
export * from './ui/pagination'
export * from './ui/progress'
export * from './ui/stepper'
export * from './ui/transition'
export * from './ui/table'
export * from './ui/tabs'
export * from './ui/command-palette'
export * from './ui/tooltip'

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
