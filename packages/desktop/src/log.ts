/**
 * Unified system log (`os_log` on macOS).
 *
 * Apps call `log.{debug,info,warn,error}(message)` and entries land
 * in Console.app, `log show`, and any aggregator the user has wired
 * up (e.g. log-shipper daemons, MDM agents).
 *
 * Outside a Craft window, falls through to the equivalent
 * `console.*` call so library code can call `log.info()` from web
 * builds without branching.
 */

import { hasBridge } from './_bridge'

export interface LogAPI {
  debug: (message: string) => Promise<void>
  info:  (message: string) => Promise<void>
  warn:  (message: string) => Promise<void>
  error: (message: string) => Promise<void>
}

export const log: LogAPI = {
  async debug(m) { if (hasBridge('log')) await window.craft!.log.debug(m); else console.debug(m) },
  async info(m)  { if (hasBridge('log')) await window.craft!.log.info(m);  else console.info(m) },
  async warn(m)  { if (hasBridge('log')) await window.craft!.log.warn(m);  else console.warn(m) },
  async error(m) { if (hasBridge('log')) await window.craft!.log.error(m); else console.error(m) },
}
