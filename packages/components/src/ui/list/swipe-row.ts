export interface SwipeRowAction {
  id: string
  label: string
  destructive?: boolean
  accessibilityLabel?: string
  testID?: string
}

export interface SwipeRowProps {
  actions: SwipeRowAction[]
  actionsLabel?: string
  className?: string
  disabled?: boolean
  testID?: string
}

// Native screens have separate script contexts. One open row per context also
// keeps browser lists from leaving several action trays open at the same time.
let dismissOpenRow: (() => void) | undefined

export function openSwipeRow(dismiss: () => void): void {
  if (dismissOpenRow === dismiss) return
  dismissOpenRow?.()
  dismissOpenRow = dismiss
}

export function closeSwipeRow(dismiss: () => void): void {
  if (dismissOpenRow === dismiss) dismissOpenRow = undefined
}
