/**
 * StxAccordion Builtin Component
 *
 * Renders a collapsible accordion. Items are parsed from slot content
 * as `<StxAccordionItem>` elements.
 *
 * Usage:
 *   <StxAccordion type="single">
 *     <StxAccordionItem title="What is stx?" open>
 *       <p>A modern templating engine.</p>
 *     </StxAccordionItem>
 *     <StxAccordionItem title="How fast?">
 *       <p>Very fast.</p>
 *     </StxAccordionItem>
 *   </StxAccordion>
 *
 * Props:
 *   - type — 'single' | 'multiple' (default: 'multiple')
 *
 * Item props (parsed from slot):
 *   - title (required) — header text
 *   - open — initially expanded
 *
 * @module builtins/accordion
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

interface ParsedItem {
  title: string
  open: boolean
  content: string
}

function parseItems(slotContent: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const regex = /<StxAccordionItem\s([^>]*?)>([\s\S]*?)<\/StxAccordionItem>/gi
  let match = regex.exec(slotContent)
  while (match) {
    const attrs = match[1]
    const content = match[2]

    const titleMatch = attrs.match(/title=["']([^"']+)["']/)
    const open = /\bopen\b/.test(attrs)

    if (titleMatch) {
      items.push({
        title: titleMatch[1],
        open,
        content: content.trim(),
      })
    }

    match = regex.exec(slotContent)
  }
  return items
}

const CHEVRON_SVG = '<svg style="width:1.25rem;height:1.25rem;transition:transform 0.2s ease;flex-shrink:0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>'

export const StxAccordionBuiltin: BuiltinComponentDef = {
  name: 'StxAccordion',
  aliases: ['stx-accordion'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const items = parseItems(slotContent)
    if (items.length === 0) {
      return '<!-- StxAccordion: no StxAccordionItem children found -->'
    }

    const type = resolveProp(props, 'type') || 'multiple'
    const uid = `stx-acc-${Math.random().toString(36).slice(2, 8)}`

    const headerStyle = 'display:flex;align-items:center;justify-content:space-between;width:100%;padding:0.875rem 1rem;font-size:0.9375rem;font-weight:500;cursor:pointer;border:none;background:none;text-align:left;color:var(--stx-acc-text,#111827);transition:background 0.15s;outline:none'
    const contentWrapStyle = 'overflow:hidden;transition:max-height 0.25s ease'

    const rendered = items.map((item, i) => {
      const itemId = `${uid}-item-${i}`
      const isOpen = item.open
      const chevronRotate = isOpen ? 'transform:rotate(180deg)' : ''
      const borderTop = i > 0 ? 'border-top:1px solid var(--stx-acc-border,#e5e7eb);' : ''

      return `<div data-stx-acc-item style="${borderTop}">
  <h3 style="margin:0">
    <button id="${itemId}-header" aria-expanded="${isOpen}" aria-controls="${itemId}-panel" data-stx-acc-trigger style="${headerStyle}">
      <span>${item.title}</span>
      <span data-stx-acc-chevron style="${chevronRotate}">${CHEVRON_SVG}</span>
    </button>
  </h3>
  <div id="${itemId}-panel" role="region" aria-labelledby="${itemId}-header" data-stx-acc-panel style="${contentWrapStyle};max-height:${isOpen ? 'none' : '0'}">
    <div style="padding:0 1rem 1rem">${item.content}</div>
  </div>
</div>`
    }).join('\n  ')

    return `<div data-stx-accordion="${uid}" data-type="${type}" style="border:1px solid var(--stx-acc-border,#e5e7eb);border-radius:0.5rem;overflow:hidden;background:var(--stx-acc-bg,#fff)">
  ${rendered}
</div>
<style>
@media(prefers-color-scheme:dark){[data-stx-accordion]{--stx-acc-bg:#1f2937;--stx-acc-text:#f3f4f6;--stx-acc-border:#374151;--stx-acc-hover:#283548}}
[data-stx-accordion] [data-stx-acc-trigger]:hover{background:var(--stx-acc-hover,#f9fafb)}
[data-stx-accordion] [data-stx-acc-trigger]:focus-visible{outline:2px solid var(--stx-acc-focus,#3b82f6);outline-offset:-2px}
</style>
<script>
(function(){
  var root=document.querySelector('[data-stx-accordion="${uid}"]');
  if(!root)return;
  var type=${JSON.stringify(type)};
  var triggers=Array.from(root.querySelectorAll('[data-stx-acc-trigger]'));

  function setOpen(trigger,open){
    var panel=document.getElementById(trigger.getAttribute('aria-controls'));
    var chevron=trigger.querySelector('[data-stx-acc-chevron]');
    trigger.setAttribute('aria-expanded',String(open));
    if(open){
      panel.style.maxHeight=panel.scrollHeight+'px';
      if(chevron)chevron.style.transform='rotate(180deg)';
      setTimeout(function(){panel.style.maxHeight='none'},260);
    }else{
      panel.style.maxHeight=panel.scrollHeight+'px';
      panel.offsetHeight;
      panel.style.maxHeight='0';
      if(chevron)chevron.style.transform='';
    }
  }

  function toggle(trigger){
    var isOpen=trigger.getAttribute('aria-expanded')==='true';
    if(type==='single'&&!isOpen){
      triggers.forEach(function(t){
        if(t!==trigger&&t.getAttribute('aria-expanded')==='true'){
          setOpen(t,false);
        }
      });
    }
    setOpen(trigger,!isOpen);
  }

  root.addEventListener('click',function(e){
    var trigger=e.target.closest('[data-stx-acc-trigger]');
    if(trigger)toggle(trigger);
  });

  root.addEventListener('keydown',function(e){
    var trigger=e.target.closest('[data-stx-acc-trigger]');
    if(!trigger)return;
    var idx=triggers.indexOf(trigger);
    var next=-1;
    if(e.key==='ArrowDown'){next=(idx+1)%triggers.length}
    else if(e.key==='ArrowUp'){next=(idx-1+triggers.length)%triggers.length}
    else if(e.key==='Home'){next=0}
    else if(e.key==='End'){next=triggers.length-1}
    if(next!==-1){e.preventDefault();triggers[next].focus()}
  });

  triggers.forEach(function(t){
    if(t.getAttribute('aria-expanded')==='true'){
      var panel=document.getElementById(t.getAttribute('aria-controls'));
      if(panel)panel.style.maxHeight='none';
    }
  });
})();
</script>`
  },
}
