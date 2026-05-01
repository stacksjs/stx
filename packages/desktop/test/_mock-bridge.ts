/**
 * Internal re-export of the public test-utils. Test files were written
 * against this path before `src/test-utils.ts` was promoted to a public
 * surface; keeping this thin shim avoids touching every test while
 * exercising the same code path that consumers will use.
 */

export type { CapturedCall, MockBridgeHandle } from '../src/test-utils'
export { findCall, installMockBridge } from '../src/test-utils'
