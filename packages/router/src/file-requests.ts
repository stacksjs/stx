/**
 * Which request paths ask for a FILE rather than a page.
 *
 * An app whose routes start at the root has a dynamic page answering every
 * one-segment path: `resources/views/[username].stx` renders a profile at
 * `/chris`. Without a rule, it also answers `/favicon.ico`,
 * `/apple-touch-icon.png`, `/robots.txt` on a site without one, and every
 * `/wp-login.php` a scanner tries - each a full page render (often one that
 * queries the database for a user called `favicon.ico`) shipped back as 80KB
 * of HTML a browser expected to be an image.
 *
 * The rule: when the LAST segment of a request path ends in a known file
 * extension, a dynamic page segment (`[param]`, `[[param]]`) never captures
 * it. The request falls through to `publicDir`, and when nothing is there it
 * gets a plain `404 Not Found` instead of a page.
 *
 * Why a list of known extensions rather than "anything after a dot":
 *
 *   - Identifiers carry dots. A username `john.doe`, a repository `three.js`
 *     or `user.github.io`, a version `/docs/v1.2` or `/releases/1.0.0` are
 *     all pages. Only an extension that names a file format nobody would use
 *     as a name counts, and TLD-shaped ones (`.io`, `.dev`, `.sh`, `.me`,
 *     `.app`, `.ai`) are deliberately absent.
 *   - Page extensions stay routable: `.html`/`.htm` (the explicit spelling of
 *     a page), and `.md`/`.stx` (a docs page addressed by its source name).
 *   - Extensions are matched all-lowercase or all-uppercase (`.png`, `.PNG`),
 *     which is how files are actually named, and keeps the guard expressible
 *     in a case-sensitive route regex.
 *
 * Catch-alls (`[...path]`) are exempt on purpose. A catch-all is how an app
 * says "the rest of the URL is mine, dots and all": a code browser serving
 * `/owner/repo/tree/main/src/index.ts`, a docs site addressing `guide.md`.
 * They still never shadow a file that really exists under `publicDir` (the
 * serve path checks the disk first). That exemption is also the escape hatch:
 * a segment that must accept file-shaped names (`[owner]/[repository]` for a
 * repository called `three.js`) can be written as a catch-all.
 *
 * @module file-requests
 */

/**
 * File extensions that mark a request as a file, never a page. Lowercase; see
 * {@link isFileRequestPath} for how case is handled.
 */
export const FILE_REQUEST_EXTENSIONS: readonly string[] = Object.freeze([
  // Images and icons
  'ico', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'tif', 'tiff', 'heic',
  // Scripts, styles and the files a browser fetches alongside a page
  'css', 'js', 'mjs', 'cjs', 'map', 'wasm', 'webmanifest', 'json', 'xml', 'txt', 'rss', 'atom',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // Audio and video
  'mp3', 'mp4', 'm4a', 'm4v', 'mov', 'webm', 'ogg', 'ogv', 'oga', 'wav', 'flac', 'avi', 'mkv',
  // Documents
  'pdf', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt',
  // Archives
  'zip', 'gz', 'tgz', 'tar', 'rar', '7z', 'bz2', 'xz',
  // What scanners probe for: server scripts, config, dumps and backups
  'php', 'phtml', 'asp', 'aspx', 'jsp', 'cgi', 'env', 'ini', 'yml', 'yaml', 'toml', 'sql', 'bak', 'old', 'swp', 'log', 'conf', 'cfg',
  // Installers and binaries
  'exe', 'dmg', 'pkg', 'apk', 'ipa', 'msi', 'iso', 'bin', 'dll',
])

const alternation = FILE_REQUEST_EXTENSIONS
  .flatMap(ext => ext === ext.toUpperCase() ? [ext] : [ext, ext.toUpperCase()])
  .join('|')

const FILE_SEGMENT = new RegExp(`\\.(?:${alternation})$`)

/**
 * Regex source for a lookahead that refuses a final path segment naming a
 * file. Placed in front of a dynamic segment's capture group, so the route
 * regex itself - the one the server matches with and ships to the client
 * router as an owned route - carries the rule. Non-capturing: group indices
 * are unchanged.
 */
export const FILE_SEGMENT_GUARD = `(?![^/]*\\.(?:${alternation})$)`

/**
 * Does this request path ask for a file? True when its last segment ends in
 * one of {@link FILE_REQUEST_EXTENSIONS} (all-lowercase or all-uppercase).
 * Query strings and fragments are ignored; `/` and extensionless paths are
 * never files.
 */
export function isFileRequestPath(pathname: string): boolean {
  let path = pathname
  const cut = path.search(/[?#]/)
  if (cut !== -1)
    path = path.slice(0, cut)
  const last = path.slice(path.lastIndexOf('/') + 1)
  return last.length > 0 && FILE_SEGMENT.test(last)
}
