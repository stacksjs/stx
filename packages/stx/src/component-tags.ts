export const htmlTags = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  // `component` is not an HTML element, but it IS stx's dynamic-component tag.
  // Without it here the static scan resolves <component :is> to a file named
  // component.stx and emits an error string containing absolute server paths
  // (#1817). The dynamic pass owns this tag; anything it leaves behind is not
  // ours to guess at.
  'component',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
  // SVG elements
  'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse',
  'text', 'tspan', 'textPath',
  'g', 'defs', 'use', 'symbol', 'image',
  'clipPath', 'mask', 'pattern', 'marker',
  'linearGradient', 'radialGradient', 'stop',
  'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDropShadow', 'feFlood', 'feGaussianBlur',
  'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting',
  'feTile', 'feTurbulence', 'foreignObject',
  'animate', 'animateMotion', 'animateTransform', 'set', 'mpath',
  'desc', 'metadata', 'switch', 'view',
])

/**
 * Whether `tagName` certainly reaches the page as the element it names, by the
 * three passes of `processComponents` below. A component tag is replaced by
 * the component's markup, and attributes stamped on the tag do not survive it.
 * A kebab-case tag is a component when a file of that name exists, which this
 * cannot know, so it never counts as certain.
 */
export function rendersAsElement(tagName: string): boolean {
  if (tagName.includes('-') || tagName === 'component')
    return false
  if (/^[A-Z]/.test(tagName))
    return !/[a-z]/.test(tagName) && [...htmlTags].some(tag => tag.toLowerCase() === tagName.toLowerCase())
  // Lowercase words outside the set are components. A camelCase name such as
  // clipPath matches none of the three patterns, so it stays an element.
  return htmlTags.has(tagName) || /[A-Z]/.test(tagName)
}
