/**
 * The macos theme's secondary text, measured against its own pane.
 *
 * Section headings and row counts used AppKit's secondary label colour,
 * `#3c3c43` at 60%. Over the pane, `#f2f2f4` at 90% on a white page, that is
 * 3.31:1, under the 4.5:1 WCAG AA asks of 11px and 13px text. The disclosure
 * chevrons were fainter still at 45% and 55%, under the 3:1 floor for a
 * graphic that carries state (stacksjs/stacks#3030).
 *
 * The page under the pane is white in light mode and neutral-950 in dark mode,
 * the backgrounds the Stacks dashboard draws the sidebar over.
 */
import { describe, expect, it } from 'bun:test'
import { sidebarThemes } from '../src/ui/sidebar/themes'
import { luminance } from './utils/wcag-contrast'

const macos = sidebarThemes.macos

const PAGE = { light: [255, 255, 255], dark: [10, 10, 10] }

/** WCAG 2.1: 4.5:1 for text under 18.66px bold, 3:1 for state-bearing graphics. */
const NORMAL_TEXT = 4.5
const GRAPHIC = 3

type Rgb = number[]

/** `text-[#3c3c43]/60` (or its `dark:` twin) -> the colour and its alpha. */
function arbitrary(classes: string, utility: 'text' | 'bg', mode: 'light' | 'dark'): { rgb: Rgb, alpha: number } {
  const prefix = mode === 'dark' ? 'dark:' : '(?<![\\w:])'
  const match = new RegExp(`${prefix}${utility}-\\[#([0-9a-f]{6})\\]\\/(\\d+)`, 'i').exec(classes)
  if (!match)
    throw new Error(`no ${mode} ${utility} colour in: ${classes}`)
  const n = Number.parseInt(match[1], 16)
  return { rgb: [n >> 16 & 255, n >> 8 & 255, n & 255], alpha: Number(match[2]) / 100 }
}

function over(top: Rgb, alpha: number, under: Rgb): Rgb {
  return top.map((channel, i) => channel * alpha + under[i] * (1 - alpha))
}

function hex(rgb: Rgb): string {
  return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

function contrastOnPane(classes: string, mode: 'light' | 'dark'): number {
  const pane = arbitrary(macos.pane, 'bg', mode)
  const background = over(pane.rgb, pane.alpha, PAGE[mode])
  const ink = arbitrary(classes, 'text', mode)
  const lf = luminance(hex(over(ink.rgb, ink.alpha, background)))
  const lb = luminance(hex(background))
  return (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
}

describe('macos sidebar secondary text is readable on its pane', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`section headings reach 4.5:1 in ${mode} mode`, () => {
      expect(contrastOnPane(macos.sectionHeader, mode)).toBeGreaterThanOrEqual(NORMAL_TEXT)
    })

    it(`row counts reach 4.5:1 in ${mode} mode`, () => {
      expect(contrastOnPane(macos.item.count, mode)).toBeGreaterThanOrEqual(NORMAL_TEXT)
    })

    it(`disclosure chevrons reach 3:1 in ${mode} mode`, () => {
      expect(contrastOnPane(macos.sectionChevron, mode)).toBeGreaterThanOrEqual(GRAPHIC)
      expect(contrastOnPane(macos.item.chevron, mode)).toBeGreaterThanOrEqual(GRAPHIC)
    })
  }
})
