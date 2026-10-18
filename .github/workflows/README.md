# GitHub Actions

[CI](./ci.yml) runs on main pushes, pull requests and manual dispatches. Pantry
provisions the pinned Bun and Git tools, and Bun installs the committed lockfile
with `--frozen-lockfile`. Separate jobs run Pickier lint and formatting checks,
TypeScript checks, and the package build. The test job installs the actual
publishable archives into an isolated consumer before running the full package
and example suites, component coverage and component integration tests.

The commit publication job depends on those checks. It publishes commit packages
only for pushes to main; a manual branch CI run does not publish them.

[Releaser](./release.yml) runs for version tags and manual dispatches. Its source
gate runs lint, formatting, the release preflight and the package/example suites.
The preflight builds packages, checks declarations and exports, verifies an
installed archive consumer, and checks performance budgets. Publication registers
STX's runtime dependencies before STX, then publishes the remaining core packages.
Icon collections run afterward in a separate job, so an icon registry failure
does not block the core release.

[Buddy Bot](./buddy-bot.yml) maintains dependency update pull requests and its
dashboard. It also handles requested rebases and scheduled branch cleanup.

[VS Code Extension](./vscode-extension.yml) tests and publishes the editor
extension independently from the npm release. It can be dispatched again without
republishing the core packages.
