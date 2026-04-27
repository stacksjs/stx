/**
 * StxCard Builtin Component
 *
 * Renders a card container with configurable variant, padding, border
 * radius, and optional hover effect.
 *
 * Usage:
 *   <StxCard>
 *     <p>Simple card with body content</p>
 *   </StxCard>
 *
 *   <StxCard variant="outline" hoverable>
 *     <h3>Card Title</h3>
 *     <p>Card content</p>
 *   </StxCard>
 *
 * Props:
 *   - variant — 'elevated' | 'outline' | 'filled' | 'ghost' (default: 'elevated')
 *   - hoverable — adds hover shadow/lift effect (boolean attribute)
 *   - padding — 'none' | 'sm' | 'md' | 'lg' (default: 'md')
 *   - radius — 'none' | 'sm' | 'md' | 'lg' (default: 'md')
 *
 * @module builtins/card
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function hasBooleanProp(props: ResolvedProps, key: string): boolean {
  if (props.static[key] === true) return true
  if (props.static[key] === '' || props.static[key] === 'true') return true
  if (props.serverDynamic[key] !== undefined) return !!props.serverDynamic[key]
  return false
}

const PADDING_MAP: Record<string, string> = {
  none: '0',
  sm: '0.75rem',
  md: '1.25rem',
  lg: '2rem',
}

const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1rem',
}

let cardCounter = 0

export const StxCardBuiltin: BuiltinComponentDef = {
  name: 'StxCard',
  aliases: ['stx-card'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const variant = resolveProp(props, 'variant') || 'elevated'
    const hoverable = hasBooleanProp(props, 'hoverable')
    const padding = resolveProp(props, 'padding') || 'md'
    const radius = resolveProp(props, 'radius') || 'md'

    const pad = PADDING_MAP[padding] || PADDING_MAP.md
    const rad = RADIUS_MAP[radius] || RADIUS_MAP.md

    const cardId = `stx-card-${++cardCounter}`

    // Variant-specific styles
    let variantStyle: string
    let darkVarStyle: string

    switch (variant) {
      case 'outline':
        variantStyle = 'background:transparent;border:1px solid #e5e7eb'
        darkVarStyle = `#${cardId}{background:transparent!important;border-color:#374151!important}`
        break
      case 'filled':
        variantStyle = 'background:#f3f4f6;border:none'
        darkVarStyle = `#${cardId}{background:#1f2937!important}`
        break
      case 'ghost':
        variantStyle = 'background:transparent;border:none;box-shadow:none'
        darkVarStyle = ''
        break
      default:
        // elevated
        variantStyle = 'background:#ffffff;border:none;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06)'
        darkVarStyle = `#${cardId}{background:#1f2937!important;box-shadow:0 1px 3px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2)!important}`
        break
    }

    const hoverClass = hoverable ? ' stx-card-hoverable' : ''

    const darkStyles = darkVarStyle
      ? `@media(prefers-color-scheme:dark){.stx-card{color:#f3f4f6}${darkVarStyle}}`
      : '@media(prefers-color-scheme:dark){.stx-card{color:#f3f4f6}}'

    return `<div id="${cardId}" class="stx-card${hoverClass}" data-stx-card-variant="${variant}" style="${variantStyle};border-radius:${rad};padding:${pad};color:inherit;transition:box-shadow 0.2s ease,transform 0.2s ease">
  ${slotContent}
</div>
<style>
.stx-card-hoverable:hover{box-shadow:0 10px 25px rgba(0,0,0,0.1),0 4px 10px rgba(0,0,0,0.05)!important;transform:translateY(-2px)}
@media(prefers-color-scheme:dark){.stx-card-hoverable:hover{box-shadow:0 10px 25px rgba(0,0,0,0.3),0 4px 10px rgba(0,0,0,0.15)!important}}
${darkStyles}
</style>`
  },
}
