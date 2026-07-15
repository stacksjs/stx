/**
 * stx plugin shim for @stacksjs/components.
 *
 * Register in a project's stx config to make every library component
 * (<Sidebar>, <Button>, <Dialog>, …) resolvable by tag name — component
 * resolution walks subdirectories, so the grouped `src/ui/<name>/` layout
 * works as-is:
 *
 * ```ts
 * // stx.config.ts / config/ui.ts
 * export default {
 *   plugins: ['@stacksjs/components/stx-plugin'],
 * }
 * ```
 */
export default {
  name: '@stacksjs/components',
  components: './src/ui',
}
