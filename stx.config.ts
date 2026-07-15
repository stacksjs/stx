// Repo-root dev config so examples can be previewed straight from the
// checkout, e.g.:
//   bun packages/stx/bin/cli.ts dev packages/components/examples/sidebar-mail.stx
// Component tags (<Sidebar>, <SidebarHeader>, …) resolve against the
// component library source. Icon utility classes (i-f7-*) resolve against
// @iconify-json/* packages in the root node_modules.
export default {
  componentsDir: 'packages/components/src/ui/sidebar',
}
