/**
 * Keys to command names.
 *
 * A binding is written the way it is said: `Mod-Shift-Enter`. `Mod` is Command
 * on a Mac and Control everywhere else, resolved when the keymap is built, so
 * one table serves both and neither shows up in the other's shortcuts.
 *
 * The map answers with a name rather than a function. The editor core owns
 * some commands (indent, undo) and the view owns others (run, complete), and
 * neither should have to import the other to be bound to a key.
 */

/** The part of a keyboard event a binding is decided on. */
export interface KeyLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}

export type Keymap = Readonly<Record<string, string>>

export const defaultKeymap: Keymap = {
  'Enter': 'insertNewlineAndIndent',
  'Tab': 'indentMore',
  'Shift-Tab': 'indentLess',
  'Backspace': 'deleteBackward',
  'Mod-/': 'toggleLineComment',
  'Mod-z': 'undo',
  'Mod-Shift-z': 'redo',
  'Mod-y': 'redo',
  'Mod-Enter': 'run',
  'Mod-Shift-Enter': 'runSelection',
  'Ctrl-Space': 'triggerCompletion',
  'Mod-i': 'showHover',
  'Mod-Shift-Space': 'triggerSignature',
}

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const

/** Whether this is a platform where the command key is Command. */
export function isApplePlatform(platform?: string): boolean {
  const source = platform
  ?? (typeof navigator === 'undefined' ? '' : (navigator.platform || navigator.userAgent || ''))

  return /Mac|iP(?:hone|ad|od)/i.test(source)
}

function normalizeKey(key: string): string {
  if (key === ' ' || key === 'Spacebar')
    return 'Space'

  // A letter is the same binding whether or not Shift made it a capital.
  return key.length === 1 ? key.toLowerCase() : key
}

/** `Mod-Shift-z` and `shift-mod-Z` as the one canonical spelling. */
export function normalizeBinding(binding: string, apple: boolean): string {
  const parts = binding.split('-')
  // A binding for the minus key ends in an empty part: `Mod--`.
  const key = parts[parts.length - 1] === '' ? '-' : parts[parts.length - 1]!
  const modifiers = new Set<string>()

  for (const part of parts.slice(0, parts[parts.length - 1] === '' ? -2 : -1)) {
    const name = part.toLowerCase()
    if (name === 'mod')
      modifiers.add(apple ? 'Meta' : 'Ctrl')
    else if (name === 'ctrl' || name === 'control')
      modifiers.add('Ctrl')
    else if (name === 'alt' || name === 'option')
      modifiers.add('Alt')
    else if (name === 'shift')
      modifiers.add('Shift')
    else if (name === 'meta' || name === 'cmd' || name === 'command')
      modifiers.add('Meta')
  }

  return [...MODIFIER_ORDER.filter(name => modifiers.has(name)), normalizeKey(key)].join('-')
}

/** The canonical name of a key press. */
export function keyName(event: KeyLike): string {
  const modifiers: string[] = []
  if (event.ctrlKey)
    modifiers.push('Ctrl')
  if (event.altKey)
    modifiers.push('Alt')
  if (event.shiftKey)
    modifiers.push('Shift')
  if (event.metaKey)
    modifiers.push('Meta')

  return [...modifiers, normalizeKey(event.key)].join('-')
}

export interface ResolvedKeymap {
  /** The command a key press is bound to, if any. */
  lookup: (event: KeyLike) => string | undefined
  /** Every binding, canonical key name to command name. */
  bindings: ReadonlyMap<string, string>
}

/**
 * Build a keymap for one platform.
 *
 * Later maps win, and binding a key to an empty string unbinds it - which is
 * how a host takes Tab back for focus, or gives `Mod-Enter` to something else.
 */
export function createKeymap(maps: readonly Keymap[] = [defaultKeymap], apple: boolean = isApplePlatform()): ResolvedKeymap {
  const bindings = new Map<string, string>()

  for (const map of maps) {
    for (const [binding, command] of Object.entries(map)) {
      const name = normalizeBinding(binding, apple)
      if (command === '')
        bindings.delete(name)
      else
        bindings.set(name, command)
    }
  }

  return {
    bindings,
    lookup: event => bindings.get(keyName(event)),
  }
}
