# Listbox Component

A custom select component for choosing one or multiple values from a list.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
const people = [
  { id: 1, name: 'Wade Cooper' },
  { id: 2, name: 'Arlene Mccoy' },
  { id: 3, name: 'Devon Webb' }
]

let selected = people[0]

function handleChange(person) {
  selected = person
}
</script>

<Listbox :value="selected" :onChange="handleChange">
  <ListboxLabel>Assign to</ListboxLabel>

  <ListboxButton>{{ selected.name }}</ListboxButton>

  <ListboxOptions>
    @foreach(person in people)
      <ListboxOption :value="person" :currentValue="selected" :onChange="handleChange">
        {{ person.name }}
      </ListboxOption>
    @endforeach
  </ListboxOptions>
</Listbox>
```

## Props

### Listbox
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Currently selected value(s) |
| `onChange` | `(value: any) => void` | - | Change handler |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### ListboxButton
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'button'` | HTML element to render |
| `disabled` | `boolean` | `false` | Disable the button |

### ListboxOptions
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'ul'` | HTML element to render |
| `static` | `boolean` | `false` | Keep visible regardless of state |

### ListboxOption
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Option value |
| `disabled` | `boolean` | `false` | Disable the option |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'li'` | HTML element to render |
| `currentValue` | `any` | - | Current selected value(s) |
| `onChange` | `(value: any) => void` | - | Change handler |

### ListboxLabel
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'label'` | HTML element to render |

## Examples

### Multiple Selection

```stx
<script server>
let selectedPeople = [people[0], people[1]]

function handleChange(person) {
  if (selectedPeople.includes(person)) {
    selectedPeople = selectedPeople.filter(p => p !== person)
  } else {
    selectedPeople = [...selectedPeople, person]
  }
}
</script>

<Listbox :value="selectedPeople" :onChange="handleChange" multiple>
  <!-- ... -->
</Listbox>
```

### With Avatars

```stx
<ListboxOption :value="person">
  <div class="flex items-center">
    <img src="{{ person.avatar }}" alt="" class="h-6 w-6 rounded-full mr-2" />
    {{ person.name }}
  </div>
</ListboxOption>
```

### Disabled Option

```stx
<ListboxOption :value="person" disabled>
  {{ person.name }} (unavailable)
</ListboxOption>
```

## Features

- Single or multiple selection
- Keyboard navigation
- Search/filter support
- Dark mode support
- Accessible (WAI-ARIA)
- Disabled state
- Active state on hover
- Check icon for selected items
- Customizable styling
