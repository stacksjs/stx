export interface IconProps {
  /**
   * Icon name
   */
  name?: string
  /**
   * Icon size (width and height)
   * @default "1em"
   */
  size?: string | number
  /**
   * Icon width
   */
  width?: string | number
  /**
   * Icon height
   */
  height?: string | number
  /**
   * Icon color
   * @default "currentColor"
   */
  color?: string
  /**
   * Horizontal flip
   */
  hFlip?: boolean
  /**
   * Vertical flip
   */
  vFlip?: boolean
  /**
   * Rotation in degrees
   */
  rotate?: 0 | 90 | 180 | 270 | 1 | 2 | 3
  /**
   * Additional CSS classes
   */
  class?: string
  /**
   * Additional inline styles
   */
  style?: string
}

export interface IconData {
  /**
   * Icon body (SVG path data)
   */
  body: string
  /**
   * Icon width (default: 24)
   */
  width?: number
  /**
   * Icon height (default: 24)
   */
  height?: number
  /**
   * Icon viewBox
   */
  viewBox?: string
  /**
   * Whether the icon uses currentColor
   */
  currentColor?: boolean
}

/**
 * Generate SVG string from icon data
 */
export function renderIcon(iconData: IconData, props: IconProps = {}): string {
  const {
    size,
    width: propWidth,
    height: propHeight,
    color = 'currentColor',
    hFlip = false,
    vFlip = false,
    rotate = 0,
    class: className = '',
    style: customStyle = '',
  } = props

  const width = propWidth || size || iconData.width || 24
  const height = propHeight || size || iconData.height || 24
  const viewBox = iconData.viewBox || `0 0 ${iconData.width || 24} ${iconData.height || 24}`

  // Build transform
  const transforms: string[] = []
  if (hFlip)
    transforms.push('scaleX(-1)')
  if (vFlip)
    transforms.push('scaleY(-1)')
  if (rotate) {
    const deg = typeof rotate === 'number' && rotate < 4 ? rotate * 90 : rotate
    transforms.push(`rotate(${deg}deg)`)
  }

  const transform = transforms.length > 0 ? transforms.join(' ') : ''
  const transformStyle = transform ? `transform: ${transform};` : ''

  // Build style
  const styles: string[] = []
  if (transformStyle)
    styles.push(transformStyle)
  if (customStyle)
    styles.push(customStyle)

  const style = styles.length > 0 ? ` style="${styles.join(' ')}"` : ''
  const classAttr = className ? ` class="${className}"` : ''

  // Replace currentColor in body if color is specified
  let body = iconData.body
  if (color && color !== 'currentColor') {
    body = body.replace(/currentColor/g, color)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"${classAttr}${style}>${body}</svg>`
}

/**
 * Generate icon component CSS
 */
export function generateIconCSS(prefix: string): string {
  return `
.icon-${prefix} {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

.icon-${prefix} svg {
  width: 100%;
  height: 100%;
}
`.trim()
}

export { type IconData as Icon }
