# Combobox Component

A searchable select component that combines an input with a listbox.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export const people = [
  { id: 1, name: 'Wade Cooper' },
  { id: 2, name: 'Arlene Mccoy' },
  { id: 3, name: 'Devon Webb' }
]

export let selected = people[0]
export let query = ''

export const filtered = query === ''
  ? people
  : people.filter(person =>
      person.name.toLowerCase().includes(query.toLowerCase())
    )

export function handleChange(person) {
  selected = person
  query = ''
}

export function handleQueryChange(value) {
  query = value
}
</script>

@component('Combobox', { value: selected, onChange: handleChange })
  <div class="relative mt-1">
    @component('ComboboxInput', {
      displayValue: selected.name,
      onChange: handleQueryChange,
      placeholder: 'Search people...'
    })

    @component('ComboboxButton')

    @component('ComboboxOptions')
      @if(filtered.length === 0 && query !== '')
        <div class="relative cursor-default select-none py-2 px-4 text-neutral-700 dark:text-neutral-300">
          Nothing found.
        </div>
      @else
        @foreach(person in filtered)
          @component('ComboboxOption', {
            value: person,
            currentValue: selected,
            onChange: handleChange
          })
            {{ person.name }}
          @endcomponent
        @endforeach
      @endif
    @endcomponent
  </div>
@endcomponent
```

## Props

### Combobox
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Currently selected value |
| `onChange` | `(value: any) => void` | - | Change handler |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### ComboboxInput
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `displayValue` | `any` | - | Value to display in input |
| `onChange` | `(value: string) => void` | - | Input change handler |
| `className` | `string` | `''` | Additional CSS classes |
| `placeholder` | `string` | `''` | Input placeholder |
| `disabled` | `boolean` | `false` | Disable the input |

### ComboboxButton
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'button'` | HTML element to render |

### ComboboxOptions
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'ul'` | HTML element to render |
| `static` | `boolean` | `false` | Keep visible regardless of state |

### ComboboxOption
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Option value |
| `disabled` | `boolean` | `false` | Disable the option |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'li'` | HTML element to render |
| `currentValue` | `any` | - | Current selected value |
| `onChange` | `(value: any) => void` | - | Change handler |

## Examples

### With Empty State

```stx
@component('ComboboxOptions')
  @if(filtered.length === 0)
    <div class="py-2 px-4 text-neutral-500 dark:text-neutral-400">
      No results found for "{{ query }}"
    </div>
  @else
    @foreach(item in filtered)
      @component('ComboboxOption', { value: item })
        {{ item.name }}
      @endcomponent
    @endforeach
  @endif
@endcomponent
```

### With Avatars

```stx
@component('ComboboxOption', { value: person })
  <div class="flex items-center gap-2">
    <img src="{{ person.avatar }}" alt="" class="h-6 w-6 rounded-full" />
    <span>{{ person.name }}</span>
  </div>
@endcomponent
```

## Features

- Searchable/filterable
- Keyboard navigation
- Empty state support
- Dark mode support
- Accessible (WAI-ARIA)
- Disabled state
- Active state on hover
- Check icon for selected item
- Customizable styling
