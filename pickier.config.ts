// Repo-level pickier config.
// Downgrades `pickier/no-unused-vars` to 'warn' — pickier's current analyzer
// reports false positives on params used in `let x = param` idiom (e.g.
// `template: string` + `let output = template`). Kept as warn so real unused
// vars still surface for review.
export default {
  pluginRules: {
    'pickier/no-unused-vars': 'warn',
  },
}
