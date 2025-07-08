// gitlint.config.js
module.exports = {
    verbose: true,
    rules: {
      'conventional-commits': 2,
      'header-max-length': [2, { maxLength: 72 }],
      'body-max-line-length': [2, { maxLength: 100 }],
      'body-leading-blank': 2,
      'no-trailing-whitespace': 1
    },
    ignores: [
      '^Merge branch',
      '^Merge pull request'
    ]
  }