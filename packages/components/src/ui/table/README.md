# Table Component

Responsive table component with sorting and styling options.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Table')
  @component('TableHead')
    @component('TableRow')
      @component('TableHeader') Name @endcomponent
      @component('TableHeader') Email @endcomponent
      @component('TableHeader') Role @endcomponent
    @endcomponent
  @endcomponent

  @component('TableBody')
    @component('TableRow')
      @component('TableCell') John Doe @endcomponent
      @component('TableCell') john@example.com @endcomponent
      @component('TableCell') Admin @endcomponent
    @endcomponent
  @endcomponent
@endcomponent
```

## Features

- Responsive design
- Sortable columns
- Striped rows
- Hover effects
- Dark mode support
