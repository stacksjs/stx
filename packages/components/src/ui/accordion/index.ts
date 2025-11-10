export { default as Accordion } from './Accordion.stx'

export interface AccordionItem {
  title: string
  content: string
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: number[]
  onChange?: (openItems: number[]) => void
  className?: string
}
