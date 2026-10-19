export { default as ErrorState } from './ErrorState.stx'

/**
 * Something did not load, said where the content would have been, with a way
 * to try again. Announced as an alert on the web and on a phone.
 */
export interface ErrorStateProps {
  title?: string
  message?: string
  /** The button's words. Empty for an error nothing can retry. */
  retryLabel?: string
  /** What the button says while the retry runs. */
  busyLabel?: string
  /** A retry is running: the button is disabled. */
  busy?: boolean
  /** Names the alert; its button is `<testID>-retry`. */
  testID?: string
  className?: string
  onRetry?: () => void
}
