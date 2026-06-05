/**
 * DevTools page entry — registers the "Stacks" panel in the browser's devtools.
 */
// eslint-disable-next-line ts/no-explicit-any
declare const chrome: any

chrome.devtools.panels.create('Stacks', '', 'panel.html')
