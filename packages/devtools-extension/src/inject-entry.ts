/**
 * Page-world entry — bundled to `inject.js`, injected by the content script.
 * Boots the bridge so the panel can reach `window.__stxDevtools`.
 */
import { installDevtoolsBridge } from './inject'

installDevtoolsBridge()
