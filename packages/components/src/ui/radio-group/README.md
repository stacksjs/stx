# Radio Group Component

A set of checkable buttons (radio buttons) where only one can be checked at a time.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let selected = 'option1'

export function handleChange(value) {
  selected = value
}
</script>

@component('RadioGroup', { value: selected, onChange: handleChange })
  @component('RadioGroupLabel')
    Choose an option
  @endcomponent

  @component('RadioGroupOption', { value: 'option1', currentValue: selected, onChange: handleChange })
    Option 1
  @endcomponent

  @component('RadioGroupOption', { value: 'option2', currentValue: selected, onChange: handleChange })
    Option 2
  @endcomponent
@endcomponent
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
<script>
export const plans = [
  { name: 'Startup', ram: '12GB', cpus: '6 CPUs', disk: '160 GB SSD' },
  { name: 'Business', ram: '16GB', cpus: '8 CPUs', disk: '512 GB SSD' },
  { name: 'Enterprise', ram: '32GB', cpus: '12 CPUs', disk: '1024 GB SSD' }
]

export let selected = plans[0]

export function handleChange(plan) {
  selected = plan
}
</script>

@component('RadioGroup', { value: selected, onChange: handleChange })
  @component('RadioGroupLabel', { className: 'sr-only' })
    Server size
  @endcomponent

  <div class="space-y-2">
    @foreach(plan in plans)
      @component('RadioGroupOption', {
        value: plan,
        currentValue: selected,
        onChange: handleChange
      })
        <div class="w-full flex items-center justify-between">
          <div class="flex items-center">
            <div class="text-sm">
              @component('RadioGroupLabel', {
                className: 'font-medium'
              })
                {{ plan.name }}
              @endcomponent

              @component('RadioGroupDescription')
                {{ plan.ram }}/{{ plan.cpus }} · {{ plan.disk }}
              @endcomponent
            </div>
          </div>

          @if(selected === plan)
            <svg class="h-6 w-6 shrink-0 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#fff" fill-opacity="0.2" />
              <path d="M7 13l3 3 7-7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          @endif
        </div>
      @endcomponent
    @endforeach
  </div>
@endcomponent
```

### With Disabled Option

```stx
@component('RadioGroupOption', { value: 'disabled', disabled: true })
  This option is disabled
@endcomponent
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
