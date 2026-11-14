import { hasTopLevelAwait } from './client-parameter-bindings'
/** Ask the compiler parser whether a valid, import-free body needs async scope. */
export function requiresAsyncBody(code: string): boolean {
  const parser = new Bun.Transpiler({ loader: 'js' })
  if (hasTopLevelAwait(code)) {
    parser.transformSync(`(async function(){\n${code}\n})()`);
    return true
  }
  try { parser.transformSync(`(function(){\n${code}\n})()`); return false }
  catch {
    // Only accept the async alternative when it parses; malformed source must
    // still fail rather than being relabelled as an asynchronous module.
    parser.transformSync(`(async function(){\n${code}\n})()`)
    return true
  }
}
