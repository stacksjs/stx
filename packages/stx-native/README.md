![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# stx-native

Compile STX templates to native iOS/Android UI.

## Usage

```bash
stx-native compile ./src/Screen.stx --format bundle --output ./screen.js
```

The bundle is currently used by Craft's experimental WebView-free iOS renderer (`craft ios init MyApp --renderer native`, then `craft ios build --native-bundle ./screen.js`). The package is private for now; from a local stx checkout, run `bun packages/stx-native/src/cli/index.ts` in place of the `stx-native` executable.

To bundle multiple screens, add named routes to `stx-native.config.json`:

```json
{
  "initialScreen": "home",
  "screens": {
    "home": "src/screens/Home.stx",
    "details": "src/screens/Details.stx"
  }
}
```

Run `stx-native compile --format bundle --output ./screen.js` without an input file. The single-file command above remains unchanged for projects without `screens`. Each screen's `<script>` gets its own JavaScriptCore context when opened by a navigation-capable Craft host. Use `craft.navigation.push('details', { id: 7 })`, `craft.navigation.replace('home')`, or `craft.navigation.back()` in a screen script; the destination reads `craft.route.name` and `craft.route.params`. Unknown screen names and non-object parameters fail before a navigation message is sent.

Inside a native screen's `<script>`, the JavaScriptCore bridge exposes `craft.device.getInfo()`, `craft.clipboard.write(text)`, `craft.clipboard.read()`, `craft.haptic(style)`, and high-level `craft.haptics.impact(style)`, `.notification(type)`, and `.selection()`. Calls return promises. Rejections retain a `code` such as `CAPABILITY_DISABLED` or `INVALID_ARGUMENT`; the high-level haptics helpers intentionally treat `CAPABILITY_DISABLED` as a no-op, matching Craft's web bridge. The generated app must enable haptics and clipboard in its Craft config before those capabilities perform work.

## Documentation

- [Full Documentation](https://stx.sh)

## License

MIT

<!-- Badges -->
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
