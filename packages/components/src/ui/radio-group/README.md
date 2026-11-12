# Radio Group Component

A set of checkable buttons (radio buttons) where only one can be checked at a time.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let selected = 'option1'

function handleChange(value) {
  selected = value
}
</script>

<RadioGroup :value="selected" :onChange="handleChange">
  <RadioGroupLabel>Choose an option</RadioGroupLabel>

  <RadioGroupOption value="option1" :currentValue="selected" :onChange="handleChange">
    Option 1
  </RadioGroupOption>

  <RadioGroupOption value="option2" :currentValue="selected" :onChange="handleChange">
    Option 2
  </RadioGroupOption>
</RadioGroup>
```

## Props

### RadioGroup
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Currently selected value |
| `onChange` | `(value: any) => void` | - | Change handler |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### RadioGroupLabel
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'label'` | HTML element to render |

### RadioGroupOption
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | - | Option value |
| `disabled` | `boolean` | `false` | Disable the option |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |
| `currentValue` | `any` | - | Current selected value |
| `onChange` | `(value: any) => void` | - | Change handler |

### RadioGroupDescription
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'span'` | HTML element to render |

## Examples

### Server Plans

```stx
<script server>
const plans = [
  { name: 'Startup', ram: '12GB', cpus: '6 CPUs', disk: '160 GB SSD' },
  { name: 'Business', ram: '16GB', cpus: '8 CPUs', disk: '512 GB SSD' },
  { name: 'Enterprise', ram: '32GB', cpus: '12 CPUs', disk: '1024 GB SSD' }
]

let selected = plans[0]

function handleChange(plan) {
  selected = plan
}
</script>

<RadioGroup :value="selected" :onChange="handleChange">
  <RadioGroupLabel className="sr-only">Server size</RadioGroupLabel>

  <div class="space-y-2">
    @foreach(plan in plans)
      <RadioGroupOption
        :value="plan"
        :currentValue="selected"
        :onChange="handleChange"
      >
        <div class="w-full flex items-center justify-between">
          <div class="flex items-center">
            <div class="text-sm">
              <RadioGroupLabel className="font-medium">
                {{ plan.name }}
              </RadioGroupLabel>

              <RadioGroupDescription>
                {{ plan.ram }}/{{ plan.cpus }} · {{ plan.disk }}
              </RadioGroupDescription>
            </div>
          </div>

          @if(selected === plan)
            <svg class="h-6 w-6 shrink-0 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#fff" fill-opacity="0.2" />
              <path d="M7 13l3 3 7-7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          @endif
        </div>
      </RadioGroupOption>
    @endforeach
  </div>
</RadioGroup>
```

### With Disabled Option

```stx
<RadioGroupOption value="disabled" disabled>
  This option is disabled
</RadioGroupOption>
```

## Features

- Single selection from multiple options
- Keyboard navigation
- Focus management
- Dark mode support
- Accessible (WAI-ARIA)
- Disabled state support
- Active state on focus
- Customizable styling

## Mac look

`variant="mac"` draws the radio buttons a Mac draws: a 15px circle beside each label, sunk when off and the accent around a white dot when on, 22px from one row to the next. Set it on the group, and on each `RadioGroupOption` written as a child (an option does not learn its look from the group).

```html
<RadioGroup variant="mac" value="auto" :options="[{ value: 'auto', label: 'Automatically' }, { value: 'always', label: 'Always' }]" />

<RadioGroup variant="mac" value="page">
  <RadioGroupOption variant="mac" value="page">Jump to the next page</RadioGroupOption>
  <RadioGroupOption variant="mac" value="spot">Jump to the spot that's clicked</RadioGroupOption>
</RadioGroup>
```

Roles, values, `@change` and the keys (Space or Enter chooses the focused option) are unchanged. `RadioGroupLabel` and `RadioGroupDescription` have no Mac look; under it an option's words are plain text.

Colours and type come from the `--stx-mac-*` custom properties (`src/utils/mac-theme.ts`), light and dark, so an app re-themes it by setting a variable. A window that is not the key window (`data-stx-window-active="false"` on an ancestor, or Craft's `data-craft-window-active`) draws it without colour. The inactive fill is `--stx-mac-radio-inactive`.
