// gitlint.config.ts
export default {
  verbose: true,
  rules: {
    'conventional-commits': 2,
    'header-max-length': [2, { maxLength: 72 }],
    'body-max-line-length': [2, { maxLength: 100 }],
    'body-leading-blank': 2,
    'no-trailing-whitespace': 2,
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': 2,
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': 2,
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvements
        'test', // Adding missing tests or correcting existing tests
        'chore', // Changes to the build process or auxiliary tools
        'ci', // Changes to CI configuration files and scripts
        'build', // Changes that affect the build system or external dependencies
        'revert', // Revert to a commit
      ],
    ],
  },
  ignores: [
    '^Merge branch',
    '^Merge pull request',
    '^chore\\(release\\): bump version',
    '^Initial commit',
  ],
} as const
