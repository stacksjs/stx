export { default as Accordion } from './Accordion.stx'
export { default as AccordionItem } from './AccordionItem.stx'

/**
 * Legacy prop API — pass `items` as an array of `{ title, content }` where
 * `content` is a HTML string. Kept for backward compatibility; prefer the
 * slot API below for any accordion whose content needs to be a component tree.
 *
 * See stacksjs/stx#1703.
 */
export interface AccordionLegacyItem {
  title: string
  content: string
}

export type AccordionItemDefinition = AccordionLegacyItem

export interface AccordionProps {
  /** Legacy: array of item definitions with string content. */
  items?: AccordionItemDefinition[]
  allowMultiple?: boolean
  defaultOpen?: number[]
  onChange?: (openItems: number[]) => void
  className?: string
}

/**
 * Slot API — wrap each section's content in `<AccordionItem title="…">`.
 * Each `<AccordionItem>` renders its own header + content panel; the parent
 * `<Accordion>` attaches click handlers and toggles the content visibility.
 *
 * @example
 * ```html
 * <Accordion allowMultiple>
 *   <AccordionItem title="Profile">
 *     <ProfileEditor :user="user()" />
 *   </AccordionItem>
 *   <AccordionItem title="Zones">
 *     <ZonesEditor />
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export interface AccordionItemProps {
  title: string
  className?: string
}
