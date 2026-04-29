# Table Component

Responsive table component with sorting and styling options.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
      <TableHeader>Email</TableHeader>
      <TableHeader>Role</TableHeader>
    </TableRow>
  </TableHead>

  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Features

- Responsive design
- Sortable columns
- Striped rows
- Hover effects
- Dark mode support
