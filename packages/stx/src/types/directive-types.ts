/**
 * Directive Types - Discriminated Unions for all directive types
 */

/**
 * Base directive type with common properties
 */
interface BaseDirective {
  /** The directive type for discriminated union */
  readonly kind: string
  /** Raw matched string from template */
  raw: string
  /** Start position in template */
  start: number
  /** End position in template */
  end: number
}

/**
 * Conditional directive (@if, @elseif, @else, @unless, @isset, @empty)
 */
export interface ConditionalDirective extends BaseDirective {
  kind: 'conditional'
  /** Specific conditional type */
  type: 'if' | 'elseif' | 'else' | 'endif' | 'unless' | 'endunless' | 'isset' | 'endisset' | 'empty' | 'endempty'
  /** Condition expression (undefined for @else, @endif, etc.) */
  condition?: string
  /** Content inside the directive block */
  content?: string
}

/**
 * Loop directive (@foreach, @for, @while, @forelse)
 */
export interface LoopDirective extends BaseDirective {
  kind: 'loop'
  /** Specific loop type */
  type: 'foreach' | 'endforeach' | 'for' | 'endfor' | 'while' | 'endwhile' | 'forelse' | 'empty' | 'endforelse'
  /** Loop expression (e.g., "items as item" or "let i = 0; i < 10; i++") */
  expression?: string
  /** Item variable name (for foreach) */
  itemVar?: string
  /** Array expression (for foreach) */
  arrayExpr?: string
  /** Content inside the loop */
  content?: string
  /** Empty content (for forelse) */
  emptyContent?: string
}

/**
 * Include directive (@include, @includeIf, @includeWhen, @includeUnless, @includeFirst)
 */
export interface IncludeDirective extends BaseDirective {
  kind: 'include'
  /** Specific include type */
  type: 'include' | 'includeIf' | 'includeWhen' | 'includeUnless' | 'includeFirst' | 'partial' | 'once'
  /** Path to the included template */
  path?: string
  /** Array of paths (for includeFirst) */
  paths?: string[]
  /** Condition expression (for includeWhen/includeUnless) */
  condition?: string
  /** Local variables to pass to included template */
  variables?: Record<string, unknown>
}

/**
 * Layout directive (@layout, @extends, @section, @yield, @parent)
 */
export interface LayoutDirective extends BaseDirective {
  kind: 'layout'
  /** Specific layout type */
  type: 'layout' | 'extends' | 'section' | 'endsection' | 'yield' | 'parent' | 'show'
  /** Layout or section name */
  name?: string
  /** Default content (for yield) */
  defaultContent?: string
  /** Section content */
  content?: string
}

/**
 * Component directive (@component, x-component)
 */
export interface ComponentDirective extends BaseDirective {
  kind: 'component'
  /** Specific component type */
  type: 'component' | 'endcomponent' | 'slot' | 'endslot'
  /** Component name */
  name?: string
  /** Component props */
  props?: Record<string, unknown>
  /** Slot name (for named slots) */
  slotName?: string
  /** Slot content */
  content?: string
}

/**
 * Auth directive (@auth, @guest, @can, @cannot)
 */
export interface AuthDirective extends BaseDirective {
  kind: 'auth'
  /** Specific auth type */
  type: 'auth' | 'endauth' | 'guest' | 'endguest' | 'can' | 'endcan' | 'cannot' | 'endcannot' | 'role' | 'endrole'
  /** Guard name (optional) */
  guard?: string
  /** Ability/permission name (for can/cannot) */
  ability?: string
  /** Additional arguments for permission check */
  arguments?: unknown[]
  /** Content inside the auth block */
  content?: string
}

/**
 * Form directive (@csrf, @method, @error, @old)
 */
export interface FormDirective extends BaseDirective {
  kind: 'form'
  /** Specific form type */
  type: 'csrf' | 'method' | 'error' | 'enderror' | 'old'
  /** HTTP method (for @method) */
  method?: 'PUT' | 'PATCH' | 'DELETE'
  /** Field name (for @error, @old) */
  field?: string
  /** Content inside error block */
  content?: string
}

/**
 * Stack directive (@push, @prepend, @stack)
 */
export interface StackDirective extends BaseDirective {
  kind: 'stack'
  /** Specific stack type */
  type: 'push' | 'endpush' | 'prepend' | 'endprepend' | 'stack'
  /** Stack name */
  name: string
  /** Content to push/prepend */
  content?: string
}

/**
 * Expression directive ({{ }}, {!! !!})
 */
export interface ExpressionDirective extends BaseDirective {
  kind: 'expression'
  /** Expression type */
  type: 'escaped' | 'raw'
  /** The expression to evaluate */
  expression: string
  /** Applied filters */
  filters?: Array<{
    name: string
    args?: unknown[]
  }>
}

/**
 * Switch directive (@switch, @case, @default)
 */
export interface SwitchDirective extends BaseDirective {
  kind: 'switch'
  /** Specific switch type */
  type: 'switch' | 'case' | 'default' | 'break' | 'endswitch'
  /** Switch expression */
  expression?: string
  /** Case value */
  caseValue?: unknown
  /** Content */
  content?: string
}

/**
 * SEO directive (@meta, @seo, @og, @twitter, @jsonld)
 */
export interface SeoDirective extends BaseDirective {
  kind: 'seo'
  /** Specific SEO type */
  type: 'meta' | 'seo' | 'og' | 'twitter' | 'jsonld' | 'canonical' | 'robots'
  /** Meta name or property */
  name?: string
  /** Meta content */
  metaContent?: string
  /** SEO configuration object */
  config?: Record<string, unknown>
}

/**
 * Accessibility directive (@a11y, @screenReader, @ariaDescribe)
 */
export interface A11yDirective extends BaseDirective {
  kind: 'a11y'
  /** Specific a11y type */
  type: 'screenReader' | 'srOnly' | 'ariaDescribe' | 'a11y'
  /** Screen reader text content */
  text?: string
  /** Target element selector (for ariaDescribe) */
  target?: string
  /** Description ID */
  descriptionId?: string
}

/**
 * JavaScript/TypeScript execution directive (@js, @ts)
 */
export interface ScriptDirective extends BaseDirective {
  kind: 'script'
  /** Script type */
  type: 'js' | 'ts'
  /** Script code to execute */
  code: string
}

/**
 * Environment directive (@env, @production, @development)
 */
export interface EnvDirective extends BaseDirective {
  kind: 'env'
  /** Specific env type */
  type: 'env' | 'endenv' | 'production' | 'endproduction' | 'development' | 'enddevelopment'
  /** Environment names to match */
  environments?: string[]
  /** Content */
  content?: string
}

/**
 * i18n directive (@translate, @t, @lang)
 */
export interface I18nDirective extends BaseDirective {
  kind: 'i18n'
  /** Specific i18n type */
  type: 'translate' | 't' | 'lang' | 'endlang' | 'choice'
  /** Translation key */
  key?: string
  /** Replacement parameters */
  params?: Record<string, unknown>
  /** Count for pluralization */
  count?: number
  /** Locale override */
  locale?: string
  /** Content (for lang blocks) */
  content?: string
}

/**
 * Custom directive (user-defined)
 */
export interface UserCustomDirective extends BaseDirective {
  kind: 'custom'
  /** Directive name */
  name: string
  /** Parameters passed to the directive */
  params: string[]
  /** Content inside the directive (if hasEndTag) */
  content?: string
}

/**
 * Union type of all directive types (discriminated union)
 *
 * Use the `kind` property to narrow the type:
 *
 * @example
 * ```typescript
 * function processDirective(directive: Directive) {
 *   switch (directive.kind) {
 *     case 'conditional':
 *       // TypeScript knows directive is ConditionalDirective here
 *       if (directive.type === 'if') {
 *         console.log(directive.condition)
 *       }
 *       break
 *     case 'loop':
 *       // TypeScript knows directive is LoopDirective here
 *       console.log(directive.expression)
 *       break
 *     // ... other cases
 *   }
 * }
 * ```
 */
export type Directive =
  | ConditionalDirective
  | LoopDirective
  | IncludeDirective
  | LayoutDirective
  | ComponentDirective
  | AuthDirective
  | FormDirective
  | StackDirective
  | ExpressionDirective
  | SwitchDirective
  | SeoDirective
  | A11yDirective
  | ScriptDirective
  | EnvDirective
  | I18nDirective
  | UserCustomDirective

/**
 * Type guard to check if a directive is a specific kind
 */
export function isDirectiveKind<K extends Directive['kind']>(
  directive: Directive,
  kind: K,
): directive is Extract<Directive, { kind: K }> {
  return directive.kind === kind
}

/**
 * Helper type to extract directive by kind
 */
export type DirectiveOfKind<K extends Directive['kind']> = Extract<Directive, { kind: K }>

/**
 * Custom directive handler function
 */
export type CustomDirectiveHandler = (
  content: string,
  params: string[],
  context: Record<string, unknown>,
  filePath: string
) => string | Promise<string>

/**
 * Custom directive definition
 */
export interface CustomDirective {
  /** The name of the directive without the @ symbol (e.g., 'uppercase') */
  name: string
  /** Handler function for the directive */
  handler: CustomDirectiveHandler
  /** Whether the directive has a closing tag (e.g., @directive...@enddirective) */
  hasEndTag?: boolean
  /** Optional description for documentation */
  description?: string
}

/**
 * Middleware handler function
 */
export type MiddlewareHandler = (
  template: string,
  context: Record<string, unknown>,
  filePath: string,
  options: import('./config-types').StxOptions
) => string | Promise<string>

/**
 * Middleware definition
 */
export interface Middleware {
  /** Unique name for the middleware */
  name: string
  /** Handler function for the middleware */
  handler: MiddlewareHandler
  /** When to run this middleware (before or after directive processing) */
  timing: 'before' | 'after'
  /** Optional description for documentation */
  description?: string
}
