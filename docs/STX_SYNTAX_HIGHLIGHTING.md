# STX Syntax Highlighting Guide

This document describes the STX template syntax for implementing syntax highlighting in editors and tools like `ts-syntax-highlighter`.

## File Structure

STX files (`.stx`) are Single File Components (SFC) similar to Vue, containing three main sections:

```html
<script>
// Server-side JavaScript/TypeScript
</script>

<template>
  <!-- HTML template with STX directives -->
</template>

<style>
/* CSS styles */
</style>
```

## Token Categories

### 1. SFC Block Tags

**Scope:** `meta.tag.block.stx`

```html
<script>        <!-- keyword.control.stx -->
<script client> <!-- keyword.control.stx + entity.other.attribute-name -->
</script>       <!-- keyword.control.stx -->

<template>      <!-- keyword.control.stx -->
</template>     <!-- keyword.control.stx -->

<style>         <!-- keyword.control.stx -->
<style scoped>  <!-- keyword.control.stx + entity.other.attribute-name -->
</style>        <!-- keyword.control.stx -->
```

### 2. Directives

**Scope:** `keyword.control.directive.stx`

#### Block Directives (with @end)
```html
@if (condition)           <!-- keyword.control.directive.stx -->
@elseif (condition)       <!-- keyword.control.directive.stx -->
@else                     <!-- keyword.control.directive.stx -->
@endif                    <!-- keyword.control.directive.stx -->

@foreach (items as item)  <!-- keyword.control.directive.stx -->
@endforeach               <!-- keyword.control.directive.stx -->

@for (i = 0; i < 10; i++) <!-- keyword.control.directive.stx -->
@endfor                   <!-- keyword.control.directive.stx -->

@while (condition)        <!-- keyword.control.directive.stx -->
@endwhile                 <!-- keyword.control.directive.stx -->

@switch (value)           <!-- keyword.control.directive.stx -->
@case (1)                 <!-- keyword.control.directive.stx -->
@default                  <!-- keyword.control.directive.stx -->
@endswitch                <!-- keyword.control.directive.stx -->

@auth                     <!-- keyword.control.directive.stx -->
@endauth                  <!-- keyword.control.directive.stx -->

@guest                    <!-- keyword.control.directive.stx -->
@endguest                 <!-- keyword.control.directive.stx -->

@section ('name')         <!-- keyword.control.directive.stx -->
@endsection               <!-- keyword.control.directive.stx -->

@push ('stack')           <!-- keyword.control.directive.stx -->
@endpush                  <!-- keyword.control.directive.stx -->

@once                     <!-- keyword.control.directive.stx -->
@endonce                  <!-- keyword.control.directive.stx -->
```

#### Inline Directives
```html
@include ('partial')              <!-- keyword.control.directive.stx -->
@layout ('layouts/default')       <!-- keyword.control.directive.stx -->
@extends ('layouts/base')         <!-- keyword.control.directive.stx -->
@yield ('content')                <!-- keyword.control.directive.stx -->
@component ('name', { props })    <!-- keyword.control.directive.stx -->
@stack ('scripts')                <!-- keyword.control.directive.stx -->
@csrf                             <!-- keyword.control.directive.stx -->
@method ('PUT')                   <!-- keyword.control.directive.stx -->
@json (data)                      <!-- keyword.control.directive.stx -->
@translate ('key')                <!-- keyword.control.directive.stx -->
```

### 3. Expressions

#### Escaped Output (HTML-safe)
**Scope:** `meta.embedded.expression.stx`

```html
{{ variable }}                    <!-- punctuation.definition.expression -->
{{ user.name }}                   <!-- variable.other.stx -->
{{ count + 1 }}                   <!-- variable + operator -->
{{ isActive ? 'yes' : 'no' }}     <!-- ternary expression -->
```

#### Raw/Unescaped Output
**Scope:** `meta.embedded.expression.raw.stx`

```html
{!! rawHtml !!}                   <!-- punctuation.definition.expression.raw -->
{!! content !!}                   <!-- variable.other.stx -->
```

### 4. Component Tags

#### PascalCase Components
**Scope:** `entity.name.tag.component.stx`

```html
<Card>                            <!-- entity.name.tag.component -->
<UserProfile>                     <!-- entity.name.tag.component -->
<MyCustomComponent>               <!-- entity.name.tag.component -->
</Card>                           <!-- entity.name.tag.component -->
```

#### kebab-case Components
**Scope:** `entity.name.tag.component.stx`

```html
<user-card>                       <!-- entity.name.tag.component -->
<nav-menu>                        <!-- entity.name.tag.component -->
<side-panel>                      <!-- entity.name.tag.component -->
</user-card>                      <!-- entity.name.tag.component -->
```

### 5. Prop Bindings

#### Vue-style Binding (`:prop`)
**Scope:** `entity.other.attribute-name.binding.stx`

```html
<Card :title="userName">          <!-- :title = binding attribute -->
<Card :count="items.length">      <!-- expression value -->
<Card :active="isActive">         <!-- boolean binding -->
```

The `:` prefix should be highlighted as `punctuation.definition.binding.stx`
The attribute name should be `entity.other.attribute-name.stx`
The value should be `meta.embedded.expression.stx`

#### Mustache Binding in Attributes
**Scope:** `meta.embedded.expression.stx`

```html
<Card title="{{ userName }}">     <!-- {{ }} inside attribute -->
<div class="{{ dynamicClass }}">  <!-- expression in class -->
```

### 6. Event Bindings

**Scope:** `entity.other.attribute-name.event.stx`

```html
<button @click="handleClick">           <!-- @click = event -->
<form @submit.prevent="handleSubmit">   <!-- with modifier -->
<input @keydown.enter="send">           <!-- key modifier -->
<div @mouseover="hover">                <!-- mouse event -->
```

The `@` prefix: `punctuation.definition.event.stx`
The event name: `entity.other.attribute-name.event.stx`
The modifier (`.prevent`, `.enter`): `keyword.modifier.event.stx`

### 7. Slot Element

**Scope:** `entity.name.tag.slot.stx`

```html
<slot />                          <!-- self-closing slot -->
<slot></slot>                     <!-- empty slot -->
<slot>Default content</slot>      <!-- slot with fallback -->
```

### 8. Comments

#### HTML Comments
**Scope:** `comment.block.html`

```html
<!-- This is a comment -->
```

#### STX Comments (stripped from output)
**Scope:** `comment.block.stx`

```html
{{-- This comment won't appear in HTML --}}
```

## Embedded Languages

### JavaScript/TypeScript in `<script>`

The content inside `<script>` tags should use JavaScript/TypeScript grammar:

```html
<script>
const userName = 'John'           // JavaScript highlighting
const items = [1, 2, 3]
function greet(name) {
  return `Hello, ${name}!`
}
</script>
```

### CSS in `<style>`

The content inside `<style>` tags should use CSS grammar:

```html
<style>
.card {                           /* CSS highlighting */
  padding: 16px;
  border-radius: 8px;
}
.card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>
```

### Expressions in Template

Expressions inside `{{ }}` and `{!! !!}` should use JavaScript highlighting:

```html
{{ user.name.toUpperCase() }}     <!-- JS method call -->
{{ items.filter(i => i.active) }} <!-- arrow function -->
{{ count ?? 0 }}                  <!-- nullish coalescing -->
```

## Color Recommendations

| Token Type | Suggested Color | Example |
|------------|-----------------|---------|
| Directives (`@if`, `@foreach`) | Purple/Magenta | `#C678DD` |
| Expression delimiters (`{{`, `}}`) | Orange | `#D19A66` |
| Component tags | Green | `#98C379` |
| Binding prefix (`:`) | Cyan | `#56B6C2` |
| Event prefix (`@`) | Yellow | `#E5C07B` |
| Slot tag | Blue | `#61AFEF` |
| Comments | Gray | `#5C6370` |

## Grammar Patterns (TextMate/VS Code)

### Directive Pattern
```json
{
  "name": "keyword.control.directive.stx",
  "match": "@(if|elseif|else|endif|foreach|endforeach|for|endfor|while|endwhile|switch|case|default|endswitch|auth|endauth|guest|endguest|section|endsection|include|layout|extends|yield|component|stack|push|endpush|once|endonce|csrf|method|json|translate)\\b"
}
```

### Expression Pattern
```json
{
  "name": "meta.embedded.expression.stx",
  "begin": "\\{\\{(?!--)",
  "end": "\\}\\}",
  "beginCaptures": {
    "0": { "name": "punctuation.definition.expression.begin.stx" }
  },
  "endCaptures": {
    "0": { "name": "punctuation.definition.expression.end.stx" }
  },
  "patterns": [
    { "include": "source.js" }
  ]
}
```

### Raw Expression Pattern
```json
{
  "name": "meta.embedded.expression.raw.stx",
  "begin": "\\{!!",
  "end": "!!\\}",
  "beginCaptures": {
    "0": { "name": "punctuation.definition.expression.raw.begin.stx" }
  },
  "endCaptures": {
    "0": { "name": "punctuation.definition.expression.raw.end.stx" }
  },
  "patterns": [
    { "include": "source.js" }
  ]
}
```

### Component Tag Pattern
```json
{
  "name": "entity.name.tag.component.stx",
  "match": "</?([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9]*-[a-z0-9-]*)"
}
```

### Binding Attribute Pattern
```json
{
  "name": "meta.attribute.binding.stx",
  "match": "(:)([a-zA-Z][a-zA-Z0-9-]*)\\s*=\\s*\"([^\"]+)\"",
  "captures": {
    "1": { "name": "punctuation.definition.binding.stx" },
    "2": { "name": "entity.other.attribute-name.stx" },
    "3": { "name": "meta.embedded.expression.stx" }
  }
}
```

### Event Attribute Pattern
```json
{
  "name": "meta.attribute.event.stx",
  "match": "(@)([a-zA-Z][a-zA-Z0-9]*)(\\.\\w+)?\\s*=\\s*\"([^\"]+)\"",
  "captures": {
    "1": { "name": "punctuation.definition.event.stx" },
    "2": { "name": "entity.other.attribute-name.event.stx" },
    "3": { "name": "keyword.modifier.event.stx" },
    "4": { "name": "meta.embedded.expression.stx" }
  }
}
```

## Complete Example

```html
<script>
const user = { name: 'John', role: 'Admin' }
const items = ['Apple', 'Banana', 'Cherry']
const isLoggedIn = true

function formatName(name) {
  return name.toUpperCase()
}
</script>

<template>
  <div class="container">
    <!-- User greeting -->
    @if (isLoggedIn)
      <Card :title="formatName(user.name)">
        <h1>Welcome, {{ user.name }}!</h1>
        <p>Role: {{ user.role }}</p>

        <ul>
          @foreach (items as item)
            <li>{{ item }}</li>
          @endforeach
        </ul>

        <Button @click="logout" :disabled="loading">
          <slot />
        </Button>
      </Card>
    @else
      <p>Please log in</p>
    @endif

    {{-- This comment won't be in output --}}

    @include('partials/footer')
  </div>
</template>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.container h1 {
  color: #333;
  font-size: 2rem;
}
</style>
```

## Priority Order

When tokenizing, apply patterns in this order:

1. Comments (`{{-- --}}` and `<!-- -->`)
2. SFC block tags (`<script>`, `<template>`, `<style>`)
3. Raw expressions (`{!! !!}`)
4. Escaped expressions (`{{ }}`)
5. Directives (`@directive`)
6. Component tags (PascalCase and kebab-case)
7. Binding attributes (`:prop`)
8. Event attributes (`@event`)
9. Slot elements (`<slot />`)
10. Standard HTML tags and attributes
