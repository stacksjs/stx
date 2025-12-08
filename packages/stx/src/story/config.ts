/**
 * STX Story - Configuration handling
 */

import type {
  BackgroundPreset,
  ResolvedStoryConfig,
  ResponsivePreset,
  StoryConfig,
  StoryTreeConfig,
} from './types'

/**
 * Default responsive presets
 */
export const defaultResponsivePresets: ResponsivePreset[] = [
  { label: 'Mobile (Small)', width: 320, height: 568 },
  { label: 'Mobile (Medium)', width: 375, height: 667 },
  { label: 'Mobile (Large)', width: 414, height: 896 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Laptop', width: 1024 },
  { label: 'Desktop', width: 1280 },
  { label: 'Desktop (Large)', width: 1920 },
]

/**
 * Default background presets
 */
export const defaultBackgroundPresets: BackgroundPreset[] = [
  { label: 'Transparent', color: 'transparent', contrastColor: '#333' },
  { label: 'White', color: '#ffffff', contrastColor: '#333' },
  { label: 'Light Gray', color: '#f5f5f5', contrastColor: '#333' },
  { label: 'Dark Gray', color: '#333333', contrastColor: '#fff' },
  { label: 'Black', color: '#000000', contrastColor: '#fff' },
]

/**
 * Default tree configuration
 */
export const defaultTreeConfig: Required<StoryTreeConfig> = {
  file: 'title',
  order: 'asc',
  groups: [],
}

/**
 * Default story configuration
 */
export const defaultStoryConfig: StoryConfig = {
  enabled: true,
  outDir: '.stx/dist/story',
  storyMatch: ['**/*.story.stx'],
  storyIgnored: ['**/node_modules/**', '**/dist/**', '**/.stx/**'],
  tree: defaultTreeConfig,
  theme: {
    title: 'STX Components',
    defaultColorScheme: 'auto',
    darkClass: 'dark',
  },
  responsivePresets: defaultResponsivePresets,
  backgroundPresets: defaultBackgroundPresets,
  autoApplyContrastColor: false,
  port: 6006,
}

/**
 * Resolve story configuration with defaults
 */
export function resolveStoryConfig(config?: StoryConfig): ResolvedStoryConfig {
  const merged = {
    ...defaultStoryConfig,
    ...config,
  }

  return {
    enabled: merged.enabled ?? true,
    outDir: merged.outDir ?? '.stx/dist/story',
    storyMatch: merged.storyMatch ?? ['**/*.story.stx'],
    storyIgnored: merged.storyIgnored ?? ['**/node_modules/**', '**/dist/**', '**/.stx/**'],
    tree: {
      ...defaultTreeConfig,
      ...merged.tree,
    },
    theme: {
      title: 'STX Components',
      defaultColorScheme: 'auto',
      darkClass: 'dark',
      ...merged.theme,
    },
    responsivePresets: merged.responsivePresets ?? defaultResponsivePresets,
    backgroundPresets: merged.backgroundPresets ?? defaultBackgroundPresets,
    autoApplyContrastColor: merged.autoApplyContrastColor ?? false,
    setupFile: merged.setupFile,
    port: merged.port ?? 6006,
  }
}

/**
 * Get the default story configuration
 * Useful for extending defaults in user config
 */
export function getDefaultStoryConfig(): StoryConfig {
  return { ...defaultStoryConfig }
}
