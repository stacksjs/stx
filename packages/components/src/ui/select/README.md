# Select Component

A styled native select dropdown with support for labels, validation, and dark mode.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Basic Select

```stx
<script client>
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]
const selected = state('option1')
</script>

<Select v-model:value="selected" :options="options" placeholder="Choose an option" />
```

`v-model:value` keeps the page's signal in step both ways, with `.number` when
the values are numbers. `@change` is still emitted with the chosen value, for
code that listens for it.

### Options from client data

`options` is live on the client, so a list that arrives with the page's data
renders, and re-renders when the list changes. A value bound before its option
exists is selected once the option arrives.

```stx
<script client>
const rooms = state([])
const room = state(null)
onMount(async () => rooms.set(await (await fetch('/api/rooms')).json()))
</script>

<Select label="Room" v-model:value="room" :options="rooms()" />
```

A static list (known when the page renders) is also served in the HTML, with
the chosen option `selected`, so first paint is right and the form posts
correctly with JavaScript off.

An option may be a `{ value, label, disabled }` object or a bare string or
number, which is its own value and label: `:options="['S', 'M', 'L']"`.

### Options as children

For a list the page draws itself, pass `<option>` children. `placeholder=""`
drops the placeholder option.

```stx
<Select label="Athlete" v-model:value="athlete" placeholder="">
  <option :for="a in athletes()" :value="a.id">{{ a.name }}</option>
</Select>
```

### With Label and Helper Text

```stx
<Select
  label="Country"
  helperText="Select your country of residence"
  v-model:value="country"
  :options="countries"
  required
/>
```

### With Error State

```stx
<Select
  label="Category"
  v-model:value="category"
  :options="categories"
  error
  helperText="Please select a valid category"
  required
/>
```

### Different Sizes

```stx
<!-- Small -->
<Select size="sm" :options="options" />

<!-- Medium (default) -->
<Select size="md" :options="options" />

<!-- Large -->
<Select size="lg" :options="options" />
```

### Disabled State

```stx
<Select disabled value="locked" :options="options" />
```

### With Disabled Options

```stx
<script server>
const options = [
  { value: '1', label: 'Available Option' },
  { value: '2', label: 'Disabled Option', disabled: true },
  { value: '3', label: 'Another Available' },
]
</script>

<Select :options="options" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| number` | `''` | Selected value; two-way with `v-model:value` |
| `options` | `Array<SelectOption \| string \| number>` | `[]` | Options; static or bound from client data |
| `placeholder` | `string` | `'Select an option'` | Placeholder option; `''` renders none |
| `disabled` | `boolean` | `false` | Disable the select |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size; `md` reads the `--stx-control-*` density tokens |
| `error` | `boolean` | `false` | Show error state |
| `label` | `string` | `''` | Label text |
| `helperText` | `string` | `''` | Helper/error text below select |
| `required` | `boolean` | `false` | Mark as required |
| `name` | `string` | `''` | Form field name |
| `className` | `string` | `''` | Additional CSS classes |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:value` | the new value | A choice is made (drives `v-model:value`) |
| `change` | the new value | A choice is made |

## Slots

| Slot | Description |
|------|-------------|
| default | `<option>` children, rendered after any `options` |

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
<script server>
const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
]

let selectedCountry = ''
let hasError = false

const handleCountryChange = (value) => {
  selectedCountry = value
  hasError = !value
}
</script>

<form>
  <Select
    label="Country"
    :value="selectedCountry"
    :onChange="handleCountryChange"
    :options="countries"
    placeholder="Select your country"
    required
    :error="hasError"
    :helperText="hasError ? 'Country is required' : 'Choose your country'"
  />
</form>
```
