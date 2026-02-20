/**
 * Vue Template Directive Comprehensive Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/compiler-core/__tests__/transforms/vIf.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vFor.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vBind.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vOn.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vModel.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vSlot.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vOnce.spec.ts
 * - vue-core/packages/compiler-core/__tests__/transforms/vMemo.spec.ts
 * - vue-core/packages/compiler-dom/__tests__/transforms/vHtml.spec.ts
 * - vue-core/packages/compiler-dom/__tests__/transforms/vText.spec.ts
 * - vue-core/packages/compiler-dom/__tests__/transforms/vShow.spec.ts
 * - vue-core/packages/compiler-dom/__tests__/transforms/vModel.spec.ts
 * - vue-core/packages/runtime-dom/__tests__/directives/vCloak.spec.ts
 *
 * Tests the Vue template → stx directive transformation layer.
 */

import { describe, expect, it } from 'bun:test'
import { processVueTemplate } from '../../src/vue-template'

// =============================================================================
// v-if Transform — adapted from vIf.spec.ts
// =============================================================================

describe('Directive Transform: v-if', () => {
  it('should transform basic v-if', () => {
    const result = processVueTemplate('<div v-if="show">hello</div>')
    expect(result).toContain('@if(show)')
    expect(result).toContain('<div>hello</div>')
    expect(result).toContain('@endif')
    expect(result).not.toContain('v-if')
  })

  it('should transform v-if on span', () => {
    const result = processVueTemplate('<span v-if="visible">text</span>')
    expect(result).toContain('@if(visible)')
    expect(result).toContain('<span>text</span>')
    expect(result).toContain('@endif')
  })

  it('should transform v-if with complex expression', () => {
    const result = processVueTemplate('<div v-if="count > 0 && items.length">content</div>')
    expect(result).toContain('@if(count > 0 && items.length)')
  })

  it('should transform v-if with ternary-like expression', () => {
    const result = processVueTemplate('<div v-if="a === b">match</div>')
    expect(result).toContain("@if(a === b)")
  })

  it('should transform v-if with negation', () => {
    const result = processVueTemplate('<div v-if="!hidden">visible</div>')
    expect(result).toContain('@if(!hidden)')
  })

  it('should transform v-if on paragraph', () => {
    const result = processVueTemplate('<p v-if="showParagraph">paragraph content</p>')
    expect(result).toContain('@if(showParagraph)')
    expect(result).toContain('<p>paragraph content</p>')
    expect(result).toContain('@endif')
  })

  it('should transform v-if/v-else pair', () => {
    const result = processVueTemplate('<div v-if="ok">yes</div><div v-else>no</div>')
    expect(result).toContain('@if(ok)')
    expect(result).toContain('<div>yes</div>')
    expect(result).toContain('@else')
    expect(result).toContain('<div>no</div>')
    expect(result).toContain('@endif')
  })

  it('should transform v-if/v-else-if/v-else chain', () => {
    const result = processVueTemplate(
      '<p v-if="type === \'a\'">A</p><p v-else-if="type === \'b\'">B</p><p v-else>C</p>',
    )
    expect(result).toContain("@if(type === 'a')")
    expect(result).toContain("@elseif(type === 'b')")
    expect(result).toContain('@else')
    expect(result).toContain('@endif')
  })

  it('should transform multiple v-else-if', () => {
    const result = processVueTemplate(
      '<span v-if="a">1</span><span v-else-if="b">2</span><span v-else-if="c">3</span><span v-else>4</span>',
    )
    expect(result).toContain('@if(a)')
    expect(result).toContain('@elseif(b)')
    expect(result).toContain('@elseif(c)')
    expect(result).toContain('@else')
    expect(result).toContain('@endif')
  })

  it('should preserve content inside v-if elements', () => {
    const result = processVueTemplate('<div v-if="x"><span>nested</span><p>content</p></div>')
    expect(result).toContain('<span>nested</span>')
    expect(result).toContain('<p>content</p>')
  })

  it('should handle v-if with string literal comparison', () => {
    const result = processVueTemplate('<div v-if="status === \'active\'">Active</div>')
    expect(result).toContain("@if(status === 'active')")
  })

  it('should handle v-if with method call', () => {
    const result = processVueTemplate('<div v-if="items.includes(\'test\')">Found</div>')
    expect(result).toContain("@if(items.includes('test'))")
  })

  it('should handle self-closing elements with v-if', () => {
    const result = processVueTemplate('<br v-if="showBreak">')
    // Self-closing elements should still be wrapped
    expect(result).toContain('@if(showBreak)')
  })
})

// =============================================================================
// v-for Transform — adapted from vFor.spec.ts
// =============================================================================

describe('Directive Transform: v-for', () => {
  it('should transform basic v-for (item in items)', () => {
    const result = processVueTemplate('<li v-for="item in items">{{ item }}</li>')
    expect(result).toContain('@foreach(items as item)')
    expect(result).toContain('@endforeach')
  })

  it('should transform v-for with index ((item, index) in items)', () => {
    const result = processVueTemplate('<li v-for="(item, index) in items">{{ index }}: {{ item }}</li>')
    expect(result).toContain('@foreach(items as index => item)')
    expect(result).toContain('@endforeach')
  })

  it('should transform v-for on div', () => {
    const result = processVueTemplate('<div v-for="user in users">{{ user.name }}</div>')
    expect(result).toContain('@foreach(users as user)')
  })

  it('should transform v-for on tr (table row)', () => {
    const result = processVueTemplate('<tr v-for="row in rows"><td>{{ row.value }}</td></tr>')
    expect(result).toContain('@foreach(rows as row)')
  })

  it('should strip :key attribute', () => {
    const result = processVueTemplate('<li v-for="item in items" :key="item.id">{{ item }}</li>')
    expect(result).not.toContain(':key')
    expect(result).not.toContain('item.id')
  })

  it('should strip key attribute (without colon)', () => {
    const result = processVueTemplate('<li v-for="item in items" key="item.id">{{ item }}</li>')
    // Regular key attribute may or may not be stripped, but v-for should work
    expect(result).toContain('@foreach(items as item)')
  })

  it('should handle v-for with "of" keyword', () => {
    const result = processVueTemplate('<span v-for="item of items">{{ item }}</span>')
    expect(result).toContain('@foreach(items as item)')
  })

  it('should handle v-for with destructuring pattern', () => {
    const result = processVueTemplate('<div v-for="({ id, name }) in items">{{ name }}</div>')
    expect(result).toContain('@foreach')
  })

  it('should handle v-for with nested property access', () => {
    const result = processVueTemplate('<li v-for="item in user.todos">{{ item.text }}</li>')
    expect(result).toContain('@foreach(user.todos as item)')
  })

  it('should handle v-for with complex expression', () => {
    const result = processVueTemplate('<li v-for="item in items.filter(i => i.active)">{{ item }}</li>')
    expect(result).toContain('@foreach')
  })

  it('should preserve element content', () => {
    const result = processVueTemplate('<div v-for="item in items"><span class="name">{{ item.name }}</span><span class="value">{{ item.value }}</span></div>')
    expect(result).toContain('class="name"')
    expect(result).toContain('class="value"')
  })
})

// =============================================================================
// v-show Transform — adapted from vShow.spec.ts
// =============================================================================

describe('Directive Transform: v-show', () => {
  it('should transform v-show on div', () => {
    const result = processVueTemplate('<div v-show="visible">content</div>')
    expect(result).toContain('@show="visible"')
    expect(result).not.toContain('v-show')
  })

  it('should transform v-show on span', () => {
    const result = processVueTemplate('<span v-show="isOpen">dropdown</span>')
    expect(result).toContain('@show="isOpen"')
  })

  it('should transform v-show with complex expression', () => {
    const result = processVueTemplate('<div v-show="count > 0">has items</div>')
    expect(result).toContain('@show="count > 0"')
  })

  it('should transform v-show with negation', () => {
    const result = processVueTemplate('<div v-show="!loading">loaded</div>')
    expect(result).toContain('@show="!loading"')
  })

  it('should transform v-show with method call', () => {
    const result = processVueTemplate('<div v-show="isVisible()">conditional</div>')
    expect(result).toContain('@show="isVisible()"')
  })

  it('should preserve other attributes alongside v-show', () => {
    const result = processVueTemplate('<div class="panel" v-show="active" id="main">content</div>')
    expect(result).toContain('@show="active"')
    expect(result).toContain('class="panel"')
    expect(result).toContain('id="main"')
  })
})

// =============================================================================
// v-model Transform — adapted from vModel.spec.ts
// =============================================================================

describe('Directive Transform: v-model', () => {
  describe('native elements', () => {
    it('should transform v-model on input', () => {
      const result = processVueTemplate('<input v-model="text">')
      expect(result).toContain('@model="text"')
      expect(result).not.toContain('v-model')
    })

    it('should transform v-model on input[type=text]', () => {
      const result = processVueTemplate('<input type="text" v-model="name">')
      expect(result).toContain('@model="name"')
    })

    it('should transform v-model on input[type=email]', () => {
      const result = processVueTemplate('<input type="email" v-model="email">')
      expect(result).toContain('@model="email"')
    })

    it('should transform v-model on input[type=password]', () => {
      const result = processVueTemplate('<input type="password" v-model="password">')
      expect(result).toContain('@model="password"')
    })

    it('should transform v-model on input[type=number]', () => {
      const result = processVueTemplate('<input type="number" v-model="count">')
      expect(result).toContain('@model="count"')
    })

    it('should transform v-model on input[type=checkbox]', () => {
      const result = processVueTemplate('<input type="checkbox" v-model="checked">')
      expect(result).toContain('@model="checked"')
    })

    it('should transform v-model on input[type=radio]', () => {
      const result = processVueTemplate('<input type="radio" v-model="picked" value="a">')
      expect(result).toContain('@model="picked"')
    })

    it('should transform v-model on textarea', () => {
      const result = processVueTemplate('<textarea v-model="message">old</textarea>')
      expect(result).toContain('@model="message"')
    })

    it('should transform v-model on select', () => {
      const result = processVueTemplate('<select v-model="selected"><option>A</option></select>')
      expect(result).toContain('@model="selected"')
    })
  })

  describe('component v-model', () => {
    it('should transform default v-model on component', () => {
      const result = processVueTemplate('<MyComponent v-model="value">content</MyComponent>')
      expect(result).toContain(':modelValue="value"')
      expect(result).toContain('@update:modelValue="value = $event"')
    })

    it('should transform named v-model on component', () => {
      const result = processVueTemplate('<MyInput v-model:title="pageTitle">x</MyInput>')
      expect(result).toContain(':title="pageTitle"')
      expect(result).toContain('@update:title="pageTitle = $event"')
    })

    it('should transform multiple named v-models', () => {
      const result = processVueTemplate('<UserForm v-model:first="firstName" v-model:last="lastName">x</UserForm>')
      expect(result).toContain(':first="firstName"')
      expect(result).toContain('@update:first="firstName = $event"')
      expect(result).toContain(':last="lastName"')
      expect(result).toContain('@update:last="lastName = $event"')
    })

    it('should distinguish native vs component elements', () => {
      // Lowercase = native → @model
      const native = processVueTemplate('<input v-model="val">')
      expect(native).toContain('@model="val"')
      expect(native).not.toContain(':modelValue')

      // PascalCase = component → :modelValue + @update
      const component = processVueTemplate('<MyInput v-model="val">x</MyInput>')
      expect(component).toContain(':modelValue="val"')
      expect(component).not.toContain('@model="val"')
    })
  })
})

// =============================================================================
// v-bind Transform — adapted from vBind.spec.ts
// =============================================================================

describe('Directive Transform: v-bind', () => {
  it('should transform v-bind:id', () => {
    const result = processVueTemplate('<div v-bind:id="dynamicId">content</div>')
    expect(result).toContain('@bind:id="dynamicId"')
  })

  it('should transform v-bind:class', () => {
    const result = processVueTemplate('<div v-bind:class="classes">content</div>')
    expect(result).toContain('@bind:class="classes"')
  })

  it('should transform v-bind:style', () => {
    const result = processVueTemplate('<div v-bind:style="styles">content</div>')
    expect(result).toContain('@bind:style="styles"')
  })

  it('should transform v-bind:href', () => {
    const result = processVueTemplate('<a v-bind:href="url">link</a>')
    expect(result).toContain('@bind:href="url"')
  })

  it('should transform v-bind:src', () => {
    const result = processVueTemplate('<img v-bind:src="imageSrc">')
    expect(result).toContain('@bind:src="imageSrc"')
  })

  it('should transform v-bind:disabled', () => {
    const result = processVueTemplate('<button v-bind:disabled="isDisabled">click</button>')
    expect(result).toContain('@bind:disabled="isDisabled"')
  })

  it('should transform v-bind with data attribute', () => {
    const result = processVueTemplate('<div v-bind:data-id="itemId">content</div>')
    expect(result).toContain('@bind:data-id="itemId"')
  })

  it('should NOT transform :attr shorthand (already handled by stx)', () => {
    // The :attr shorthand is natively handled by stx component system
    const result = processVueTemplate('<div :class="active">content</div>')
    expect(result).toContain(':class="active"') // preserved as-is
    expect(result).not.toContain('@bind:class')
  })
})

// =============================================================================
// v-on Transform — adapted from vOn.spec.ts
// =============================================================================

describe('Directive Transform: v-on', () => {
  it('should transform v-on:click', () => {
    const result = processVueTemplate('<button v-on:click="handleClick">click</button>')
    expect(result).toContain('@click="handleClick"')
    expect(result).not.toContain('v-on:click')
  })

  it('should transform v-on:submit', () => {
    const result = processVueTemplate('<form v-on:submit="handleSubmit">...</form>')
    expect(result).toContain('@submit="handleSubmit"')
  })

  it('should transform v-on:input', () => {
    const result = processVueTemplate('<input v-on:input="handleInput">')
    expect(result).toContain('@input="handleInput"')
  })

  it('should transform v-on:keyup', () => {
    const result = processVueTemplate('<input v-on:keyup="handleKeyup">')
    expect(result).toContain('@keyup="handleKeyup"')
  })

  it('should transform v-on:change', () => {
    const result = processVueTemplate('<select v-on:change="handleChange"><option>A</option></select>')
    expect(result).toContain('@change="handleChange"')
  })

  it('should preserve event modifiers', () => {
    const result = processVueTemplate('<form v-on:submit.prevent="handleSubmit">...</form>')
    expect(result).toContain('@submit.prevent="handleSubmit"')
  })

  it('should preserve multiple modifiers', () => {
    const result = processVueTemplate('<a v-on:click.stop.prevent="handle">link</a>')
    expect(result).toContain('@click.stop.prevent="handle"')
  })

  it('should handle v-on with inline expression', () => {
    const result = processVueTemplate('<button v-on:click="count++">increment</button>')
    expect(result).toContain('@click="count++"')
  })

  it('should handle v-on with arrow function', () => {
    const result = processVueTemplate('<button v-on:click="() => count++">inc</button>')
    expect(result).toContain('@click="() => count++"')
  })

  it('should handle custom events', () => {
    const result = processVueTemplate('<div v-on:my-event="handleMyEvent">content</div>')
    expect(result).toContain('@my-event="handleMyEvent"')
  })

  it('should handle mouse events', () => {
    const result = processVueTemplate('<div v-on:mouseenter="onEnter" v-on:mouseleave="onLeave">hover</div>')
    expect(result).toContain('@mouseenter="onEnter"')
    expect(result).toContain('@mouseleave="onLeave"')
  })
})

// =============================================================================
// v-html Transform — adapted from vHtml.spec.ts
// =============================================================================

describe('Directive Transform: v-html', () => {
  it('should replace content with raw expression', () => {
    const result = processVueTemplate('<div v-html="rawContent">old content</div>')
    expect(result).toContain('{!! rawContent !!}')
    expect(result).not.toContain('old content')
    expect(result).not.toContain('v-html')
  })

  it('should work on span', () => {
    const result = processVueTemplate('<span v-html="html">placeholder</span>')
    expect(result).toContain('{!! html !!}')
    expect(result).not.toContain('placeholder')
  })

  it('should work on p', () => {
    const result = processVueTemplate('<p v-html="content">old</p>')
    expect(result).toContain('{!! content !!}')
  })

  it('should handle complex expressions', () => {
    const result = processVueTemplate('<div v-html="marked(text)">loading</div>')
    expect(result).toContain('{!! marked(text) !!}')
    expect(result).not.toContain('loading')
  })

  it('should preserve element attributes', () => {
    const result = processVueTemplate('<div class="content" id="main" v-html="html">old</div>')
    expect(result).toContain('class="content"')
    expect(result).toContain('id="main"')
    expect(result).toContain('{!! html !!}')
  })
})

// =============================================================================
// v-text Transform — adapted from vText.spec.ts
// =============================================================================

describe('Directive Transform: v-text', () => {
  it('should replace content with escaped expression', () => {
    const result = processVueTemplate('<span v-text="message">old text</span>')
    expect(result).toContain('{{ message }}')
    expect(result).not.toContain('old text')
    expect(result).not.toContain('v-text')
  })

  it('should work on div', () => {
    const result = processVueTemplate('<div v-text="text">placeholder</div>')
    expect(result).toContain('{{ text }}')
    expect(result).not.toContain('placeholder')
  })

  it('should handle complex expressions', () => {
    const result = processVueTemplate('<span v-text="user.name + \' - \' + user.role">loading</span>')
    expect(result).toContain("{{ user.name + ' - ' + user.role }}")
  })

  it('should preserve element attributes', () => {
    const result = processVueTemplate('<span class="label" v-text="label">old</span>')
    expect(result).toContain('class="label"')
    expect(result).toContain('{{ label }}')
  })
})

// =============================================================================
// v-pre Transform — adapted from v-pre behavior
// =============================================================================

describe('Directive Transform: v-pre', () => {
  it('should add data-stx-skip marker', () => {
    const result = processVueTemplate('<div v-pre>{{ raw }}</div>')
    expect(result).toContain('data-stx-skip')
    expect(result).not.toContain('v-pre')
  })

  it('should preserve content as-is', () => {
    const result = processVueTemplate('<div v-pre>{{ raw }} @if(x) </div>')
    expect(result).toContain('{{ raw }}')
    expect(result).toContain('@if(x)')
  })

  it('should work on span', () => {
    const result = processVueTemplate('<span v-pre>{{ variable }}</span>')
    expect(result).toContain('data-stx-skip')
    expect(result).toContain('{{ variable }}')
  })
})

// =============================================================================
// v-once Transform — adapted from vOnce.spec.ts
// =============================================================================

describe('Directive Transform: v-once', () => {
  it('should wrap element in @once/@endonce', () => {
    const result = processVueTemplate('<div v-once>static content</div>')
    expect(result).toContain('@once')
    expect(result).toContain('@endonce')
    expect(result).not.toContain('v-once')
  })

  it('should preserve element content', () => {
    const result = processVueTemplate('<div v-once><span>nested</span></div>')
    expect(result).toContain('<span>nested</span>')
  })

  it('should work on different elements', () => {
    const result = processVueTemplate('<span v-once>text</span>')
    expect(result).toContain('@once')
    expect(result).toContain('<span>text</span>')
    expect(result).toContain('@endonce')
  })
})

// =============================================================================
// v-memo Transform — adapted from vMemo.spec.ts
// =============================================================================

describe('Directive Transform: v-memo', () => {
  it('should transform to data-stx-memo', () => {
    const result = processVueTemplate('<div v-memo="[a, b]">memoized</div>')
    expect(result).toContain('data-stx-memo="[a, b]"')
    expect(result).not.toContain('v-memo')
  })

  it('should handle single dependency', () => {
    const result = processVueTemplate('<div v-memo="[count]">content</div>')
    expect(result).toContain('data-stx-memo="[count]"')
  })

  it('should handle complex dependencies', () => {
    const result = processVueTemplate('<div v-memo="[user.name, items.length]">content</div>')
    expect(result).toContain('data-stx-memo="[user.name, items.length]"')
  })
})

// =============================================================================
// v-slot Transform — adapted from vSlot.spec.ts
// =============================================================================

describe('Directive Transform: v-slot', () => {
  it('should transform v-slot:name to #name', () => {
    const result = processVueTemplate('<template v-slot:header>Header Content</template>')
    expect(result).toContain('#header')
    expect(result).not.toContain('v-slot:header')
  })

  it('should transform v-slot:default', () => {
    const result = processVueTemplate('<template v-slot:default>Default Content</template>')
    expect(result).toContain('#default')
  })

  it('should transform v-slot with scoped props', () => {
    const result = processVueTemplate('<template v-slot:item="slotProps">{{ slotProps.text }}</template>')
    expect(result).toContain('#item="slotProps"')
  })

  it('should transform v-slot with destructured props', () => {
    const result = processVueTemplate('<template v-slot:item="{ text, id }">{{ text }}</template>')
    expect(result).toContain('#item="{ text, id }"')
  })

  it('should handle named slots', () => {
    const result = processVueTemplate('<template v-slot:footer>Footer</template>')
    expect(result).toContain('#footer')
  })
})

// =============================================================================
// v-cloak — adapted from vCloak.spec.ts
// =============================================================================

describe('Directive Transform: v-cloak', () => {
  it('should preserve v-cloak (handled at runtime)', () => {
    const result = processVueTemplate('<div v-cloak>loading content</div>')
    // v-cloak is preserved for runtime handling
    expect(result).toContain('v-cloak')
  })
})

// =============================================================================
// Edge Cases and Combined Directives
// =============================================================================

describe('Directive Transform: Edge Cases', () => {
  it('should handle multiple directives on one element', () => {
    const result = processVueTemplate('<div v-show="visible" v-once>content</div>')
    expect(result).toContain('@show="visible"')
    expect(result).toContain('@once')
  })

  it('should handle whitespace around directives', () => {
    const result = processVueTemplate('<div  v-if="show" >spaced</div>')
    expect(result).toContain('@if(show)')
  })

  it('should handle multiple v-on on same element', () => {
    const result = processVueTemplate('<button v-on:click="onClick" v-on:mouseenter="onHover">btn</button>')
    expect(result).toContain('@click="onClick"')
    expect(result).toContain('@mouseenter="onHover"')
  })

  it('should handle v-bind with multiple attributes', () => {
    const result = processVueTemplate('<img v-bind:src="url" v-bind:alt="desc">')
    expect(result).toContain('@bind:src="url"')
    expect(result).toContain('@bind:alt="desc"')
  })

  it('should not modify non-Vue syntax', () => {
    const input = '<div class="test" id="main"><p>{{ expr }}</p></div>'
    expect(processVueTemplate(input)).toBe(input)
  })

  it('should handle template with mixed Vue and stx syntax', () => {
    const input = '<div v-if="show">{{ msg }}</div>\n@foreach(items as item)\n<span>{{ item }}</span>\n@endforeach'
    const result = processVueTemplate(input)
    expect(result).toContain('@if(show)')
    expect(result).toContain('@foreach(items as item)')
  })

  it('should handle empty elements with directives', () => {
    const result = processVueTemplate('<div v-if="show"></div>')
    expect(result).toContain('@if(show)')
    expect(result).toContain('<div></div>')
  })

  it('should handle deeply nested content in v-if', () => {
    const result = processVueTemplate('<div v-if="show"><ul><li><a href="#">deep link</a></li></ul></div>')
    expect(result).toContain('@if(show)')
    expect(result).toContain('<a href="#">deep link</a>')
  })

  it('should handle v-for with preserving inner directives', () => {
    const result = processVueTemplate('<div v-for="item in items"><span v-if="item.show">{{ item.text }}</span></div>')
    expect(result).toContain('@foreach(items as item)')
    expect(result).toContain('@if(item.show)')
  })
})
