# Template Syntax

stx uses an intuitive template syntax that extends HTML with additional features. This guide covers all the template syntax features available in stx.

## Basic Syntax

### Text Interpolation

Use double curly braces for text interpolation:

```html
<div>&#123;&#123; message &#125;&#125;</div>
```

### Attributes

Bind attributes using the `:` shorthand:

```html
<button :disabled="isLoading">Submit</button>
```

### Raw HTML

Use `&#123;&#123;&#123; &#125;&#125;&#125;` for raw HTML interpolation (use with caution):

```html
<div>&#123;&#123;&#123; rawHtml &#125;&#125;&#125;</div>
```

## Directives

### Conditional Rendering

```html
<div @if="condition">Shown if true</div>
<div @else-if="otherCondition">Alternative</div>
<div @else>Fallback</div>
```

### List Rendering

```html
<ul>
  <li @each="item in items" :key="item.id">
    &#123;&#123; item.name &#125;&#125;
  </li>
</ul>
```

### Event Handling

```html
<button @click="handleClick">Click me</button>
<form @submit.prevent="handleSubmit">...</form>
```

### Two-way Binding

```html
<input @model="searchText">
```

## Advanced Features

### Dynamic Components

```html
<component :is="componentName"></component>
```

### Slots

```html
<template #default>Default content</template>
<template #named>Named slot content</template>
```

### Custom Directives

```html
<div @custom-directive="value"></div>
```

## Best Practices

1. Always use key attributes with `@each` directives
2. Prefer `@if` over `@show` for conditional rendering
3. Use computed properties for complex template expressions
4. Keep template expressions simple and readable

## TypeScript Support

stx templates fully support TypeScript, providing type checking for:

- Component props
- Event handlers
- Template expressions
- Directive arguments

## Related Topics

- [Component API](/api/component)
- [Directives Guide](/guide/directives)
- [TypeScript Integration](/api/typescript)
