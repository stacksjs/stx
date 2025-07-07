import type { Rule } from '@unocss/core'

export const rules: Rule[] = [
  // Custom rules for STX components
  ['stx-component', { display: 'block' }],
  ['stx-island', { display: 'block', isolation: 'isolate' }],
  ['stx-section', { display: 'block', margin: '1rem 0' }],
  ['stx-layout', { display: 'grid', gap: '1rem' }],

  // Utility rules
  ['stx-hidden', { display: 'none' }],
  ['stx-visible', { display: 'block' }],
  ['stx-flex', { display: 'flex' }],
  ['stx-grid', { display: 'grid' }],

  // Spacing rules
  [/^stx-p-(\d+)$/, ([, d]) => ({ padding: `${d}rem` })],
  [/^stx-m-(\d+)$/, ([, d]) => ({ margin: `${d}rem` })],
  [/^stx-gap-(\d+)$/, ([, d]) => ({ gap: `${d}rem` })],

  // Typography rules
  [/^stx-text-(\d+)$/, ([, s]) => ({ 'font-size': `${s}rem` })],
  [/^stx-font-(\d+)$/, ([, w]) => ({ 'font-weight': w })],
  [/^stx-leading-(\d+)$/, ([, h]) => ({ 'line-height': h })],

  // Color rules
  [/^stx-text-(primary|secondary|success|warning|error|info)$/, ([, c]) => ({ color: `var(--stx-${c})` })],
  [/^stx-bg-(primary|secondary|success|warning|error|info)$/, ([, c]) => ({ 'background-color': `var(--stx-${c})` })],

  // Border rules
  [/^stx-border-(\d+)$/, ([, w]) => ({ 'border-width': `${w}px` })],
  [/^stx-rounded-(\d+)$/, ([, r]) => ({ 'border-radius': `${r}px` })],

  // Shadow rules
  [/^stx-shadow-(\d+)$/, ([, s]) => ({ 'box-shadow': `0 ${s}px ${s * 2}px rgba(0,0,0,0.1)` })],
]
