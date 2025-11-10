# Select Component

A styled native select dropdown with support for labels, validation, and dark mode.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Basic Select

```stx
<script>
export const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

export const selected = 'option1'

export const handleChange = (value) => {
  console.log('Selected:', value)
  selected = value
}
</script>

@component('Select', {
  value: selected,
  onChange: handleChange,
  options: options,
  placeholder: 'Choose an option'
})
@endcomponent
```

### With Label and Helper Text

```stx
@component('Select', {
  label: 'Country',
  helperText: 'Select your country of residence',
  value: country,
  onChange: (val) => country = val,
  options: countries,
  required: true
})
@endcomponent
```

### With Error State

```stx
@component('Select', {
  label: 'Category',
  value: category,
  onChange: (val) => category = val,
  options: categories,
  error: true,
  helperText: 'Please select a valid category',
  required: true
})
@endcomponent
```

### Different Sizes

```stx
<!-- Small -->
@component('Select', {
  size: 'sm',
  options: options
})
@endcomponent

<!-- Medium (default) -->
@component('Select', {
  size: 'md',
  options: options
})
@endcomponent

<!-- Large -->
@component('Select', {
  size: 'lg',
  options: options
})
@endcomponent
```

### Disabled State

```stx
@component('Select', {
  disabled: true,
  value: 'locked',
  options: options
})
@endcomponent
```

### With Disabled Options

```stx
<script>
export const options = [
  { value: '1', label: 'Available Option' },
  { value: '2', label: 'Disabled Option', disabled: true },
  { value: '3', label: 'Another Available' },
]
</script>

@component('Select', {
  options: options
})
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| number` | `''` | Selected value |
| `onChange` | `function` | - | Callback when selection changes |
| `options` | `SelectOption[]` | `[]` | Array of options |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `error` | `boolean` | `false` | Show error state |
| `label` | `string` | `''` | Label text |
| `helperText` | `string` | `''` | Helper/error text below select |
| `required` | `boolean` | `false` | Mark as required |
| `className` | `string` | `''` | Additional CSS classes |

## SelectOption Interface

```typescript
interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}
```

## Features

- **Native select** - Uses native `<select>` element for best UX
- **3 sizes** - Small, medium, and large
- **Dark mode** - Full dark mode support
- **Validation states** - Error and required states
- **Disabled options** - Individual options can be disabled
- **Labels and helpers** - Support for labels and helper text
- **Accessible** - Proper ARIA attributes and labels
- **Keyboard navigation** - Full keyboard support
- **Modern ES modules** - Clean export syntax
- **Headwind styling** - Utility-first CSS classes

## Accessibility

- Proper `label` associations with `for` attribute
- `aria-invalid` for error states
- `aria-describedby` for helper text
- Required field indicator
- Disabled state properly communicated
- Keyboard navigable

## Example: Form Select

```stx
<script>
export const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
]

export let selectedCountry = ''
export let hasError = false

export const handleCountryChange = (value) => {
  selectedCountry = value
  hasError = !value
}
</script>

<form>
  @component('Select', {
    label: 'Country',
    value: selectedCountry,
    onChange: handleCountryChange,
    options: countries,
    placeholder: 'Select your country',
    required: true,
    error: hasError,
    helperText: hasError ? 'Country is required' : 'Choose your country'
  })
  @endcomponent
</form>
```
