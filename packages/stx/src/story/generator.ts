/**
 * STX Story - Auto story generator
 * Generates stories for components without explicit .story.stx files
 */

import type { AnalyzedComponent, ControlConfig, ControlType, ServerStory, ServerVariant, StoryAnalyzedProp } from './types'

/**
 * Generate a story from analyzed component metadata
 */
export function generateAutoStory(component: AnalyzedComponent): ServerStory {
  const id = generateId(component.name)
  const variants = generateVariants(component)

  return {
    id,
    title: component.name,
    variants,
    layout: { type: 'single' },
  }
}

/**
 * Generate variants for a component
 */
function generateVariants(component: AnalyzedComponent): ServerVariant[] {
  const variants: ServerVariant[] = []

  // Default variant with all props at default values
  const defaultState: Record<string, any> = {}
  for (const prop of component.props) {
    if (prop.default !== undefined) {
      defaultState[prop.name] = prop.default
    }
  }

  variants.push({
    id: 'default',
    title: 'Default',
    state: defaultState,
  })

  // Generate variants for boolean props
  for (const prop of component.props) {
    if (prop.type === 'boolean' && prop.default === false) {
      const state = { ...defaultState, [prop.name]: true }
      variants.push({
        id: `with-${prop.name}`,
        title: `With ${formatPropName(prop.name)}`,
        state,
      })
    }
  }

  // Generate variants for enum props
  for (const prop of component.props) {
    if (prop.options && prop.options.length > 0) {
      for (const option of prop.options) {
        if (option !== prop.default) {
          const state = { ...defaultState, [prop.name]: option }
          variants.push({
            id: `${prop.name}-${String(option).toLowerCase()}`,
            title: `${formatPropName(prop.name)}: ${option}`,
            state,
          })
        }
      }
    }
  }

  return variants
}

/**
 * Infer control configuration from a prop
 */
export function inferControl(prop: StoryAnalyzedProp): ControlConfig {
  const type = inferControlType(prop)

  const config: ControlConfig = { type }

  // Add options for select/radio
  if (prop.options && prop.options.length > 0) {
    config.options = prop.options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt,
    )
  }

  // Add title
  config.title = formatPropName(prop.name)

  return config
}

/**
 * Infer control type from prop type
 */
function inferControlType(prop: StoryAnalyzedProp): ControlType {
  const type = prop.type.toLowerCase()

  // Check for enum/options first
  if (prop.options && prop.options.length > 0) {
    return prop.options.length <= 4 ? 'radio' : 'select'
  }

  // Check type string
  if (type === 'boolean' || type === 'bool') {
    return 'boolean'
  }

  if (type === 'number' || type === 'int' || type === 'float') {
    return 'number'
  }

  if (type === 'string' || type === 'text') {
    // Check if it looks like a color
    if (prop.name.toLowerCase().includes('color')) {
      return 'color'
    }
    // Check if it's a long text field
    if (prop.name.toLowerCase().includes('description')
      || prop.name.toLowerCase().includes('content')
      || prop.name.toLowerCase().includes('text')) {
      return 'textarea'
    }
    return 'text'
  }

  if (type === 'array' || type === 'object' || type.startsWith('{') || type.startsWith('[')) {
    return 'json'
  }

  if (type === 'date') {
    return 'date'
  }

  // Default to text
  return 'text'
}

/**
 * Generate controls for all props
 */
export function generateControls(props: StoryAnalyzedProp[]): ControlConfig[] {
  return props.map(inferControl)
}

/**
 * Generate story source code from component and state
 */
export function generateStorySource(
  componentName: string,
  state: Record<string, any>,
): string {
  const props = Object.entries(state)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      if (typeof value === 'boolean') {
        return value ? key : ''
      }
      return `:${key}="${JSON.stringify(value)}"`
    })
    .filter(Boolean)
    .join(' ')

  return `<${componentName} ${props} />`
}

/**
 * Format a prop name for display
 */
function formatPropName(name: string): string {
  return name
    // Insert space before capitals
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

/**
 * Generate a URL-safe ID
 */
function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate a complete story file content
 */
export function generateStoryFileContent(component: AnalyzedComponent): string {
  const story = generateAutoStory(component)
  const controls = generateControls(component.props)

  // Build props for initState
  const initStateProps = component.props
    .map((prop) => {
      const defaultVal = prop.default !== undefined
        ? JSON.stringify(prop.default)
        : getDefaultForType(prop.type)
      return `    ${prop.name}: ${defaultVal}`
    })
    .join(',\n')

  // Build control components
  const controlComponents = controls
    .map((ctrl, i) => {
      const prop = component.props[i]
      const controlTag = getControlTag(ctrl.type)
      return `      <${controlTag} v-model="state.${prop.name}" title="${ctrl.title}" />`
    })
    .join('\n')

  return `<!-- Auto-generated story for ${component.name} -->
<script>
import ${component.name} from './${component.name}.stx'

function initState() {
  return {
${initStateProps}
  }
}
</script>

<Story title="${component.name}">
  <Variant title="Playground" :init-state="initState">
    <template #default="{ state }">
      <${component.name} v-bind="state" />
    </template>

    <template #controls="{ state }">
${controlComponents}
    </template>
  </Variant>

${story.variants.slice(1).map(v => `  <Variant title="${v.title}">
    <${component.name} ${formatStateAsProps(v.state || {})} />
  </Variant>`).join('\n\n')}
</Story>
`
}

/**
 * Get default value for a type
 */
function getDefaultForType(type: string): string {
  const t = type.toLowerCase()
  if (t === 'boolean')
    return 'false'
  if (t === 'number')
    return '0'
  if (t === 'array')
    return '[]'
  if (t === 'object')
    return '{}'
  return '\'\''
}

/**
 * Get control tag name for a control type
 */
function getControlTag(type: ControlType): string {
  const tags: Record<ControlType, string> = {
    text: 'StxText',
    number: 'StxNumber',
    boolean: 'StxCheckbox',
    select: 'StxSelect',
    radio: 'StxRadio',
    color: 'StxColorSelect',
    json: 'StxJson',
    date: 'StxText',
    textarea: 'StxTextarea',
    slider: 'StxSlider',
  }
  return tags[type] || 'StxText'
}

/**
 * Format state object as prop attributes
 */
function formatStateAsProps(state: Record<string, any>): string {
  return Object.entries(state)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      if (typeof value === 'boolean') {
        return value ? key : `:${key}="false"`
      }
      return `:${key}="${JSON.stringify(value)}"`
    })
    .join(' ')
}
