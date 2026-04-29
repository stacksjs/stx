/**
 * File-association controls (LaunchServices on macOS).
 *
 * Apps register themselves as the default handler for a content type
 * — e.g. "open `.myext` files in MyApp" or "myapp:// URLs go here."
 *
 * The system attaches our bundle id to the named UTI. `getDefault`
 * returns the current handler so apps can decide whether to prompt
 * "make us the default?" — Apple's HIG says you only ask once per
 * launch, but they don't enforce it.
 */

import { hasBridge } from './_bridge'

export interface FileAssociationsAPI {
  /** Bundle id of the current default handler for the given UTI, or null. */
  getDefault: (uti: string) => Promise<string | null>
  /** Register the bundle id as the default handler for the given UTI. */
  setDefault: (uti: string, bundleId: string) => Promise<boolean>
}

export const fileAssociations: FileAssociationsAPI = {
  async getDefault(uti) {
    if (!uti) throw new Error('fileAssociations.getDefault: uti is required')
    if (!hasBridge('fileAssociations')) return null
    const v = await window.craft!.fileAssociations.getDefault(uti)
    return v ? String(v) : null
  },
  async setDefault(uti, bundleId) {
    if (!uti || !bundleId) throw new Error('fileAssociations.setDefault: uti and bundleId are required')
    if (!hasBridge('fileAssociations')) return false
    return await window.craft!.fileAssociations.setDefault(uti, bundleId)
  },
}
