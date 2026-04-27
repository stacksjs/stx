/**
 * StxTabs Builtin Component
 *
 * Renders an accessible tabbed interface. Tab children are parsed from
 * slot content as `<StxTab>` elements.
 *
 * Usage:
 *   <StxTabs default="general" variant="underline">
 *     <StxTab id="general" label="General">
 *       <p>General settings content</p>
 *     </StxTab>
 *     <StxTab id="security" label="Security">
 *       <p>Security settings content</p>
 *     </StxTab>
 *   </StxTabs>
 *
 * Props:
 *   - default — id of the initially active tab
 *   - variant — 'underline' | 'pills' | 'bordered' (default: 'underline')
 *
 * Tab props (parsed from slot):
 *   - id (required) — unique tab identifier
 *   - label (required) — button text
 *   - disabled — disables the tab
 *
 * @module builtins/tabs
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

interface ParsedTab {
  id: string
  label: string
  disabled: boolean
  content: string
}

function parseTabs(slotContent: string): ParsedTab[] {
  const tabs: ParsedTab[] = []
  const regex = /<StxTab\s([^>]*?)>([\s\S]*?)<\/StxTab>/gi
  let match = regex.exec(slotContent)
  while (match) {
    const attrs = match[1]
    const content = match[2]

    const idMatch = attrs.match(/id=["']([^"']+)["']/)
    const labelMatch = attrs.match(/label=["']([^"']+)["']/)
    const disabled = /\bdisabled\b/.test(attrs)

    if (idMatch && labelMatch) {
      tabs.push({
        id: idMatch[1],
        label: labelMatch[1],
        disabled,
        content: content.trim(),
      })
    }

    match = regex.exec(slotContent)
  }
  return tabs
}

function variantStyles(variant: string): { tabList: string, activeTab: string, inactiveTab: string, disabledTab: string } {
  switch (variant) {
    case 'pills':
      return {
        tabList: 'display:flex;gap:0.5rem;padding:0.25rem;border-radius:0.5rem;background:var(--stx-tabs-list-bg,#f3f4f6)',
        activeTab: 'background:var(--stx-tabs-active-bg,#fff);color:var(--stx-tabs-active-text,#111827);border-radius:0.375rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);font-weight:600',
        inactiveTab: 'background:transparent;color:var(--stx-tabs-text,#6b7280);border-radius:0.375rem',
        disabledTab: 'opacity:0.4;cursor:not-allowed',
      }
    case 'bordered':
      return {
        tabList: 'display:flex;border:1px solid var(--stx-tabs-border,#e5e7eb);border-radius:0.5rem;overflow:hidden',
        activeTab: 'background:var(--stx-tabs-active-bg,#fff);color:var(--stx-tabs-active-text,#111827);font-weight:600;border-right:1px solid var(--stx-tabs-border,#e5e7eb)',
        inactiveTab: 'background:var(--stx-tabs-list-bg,#f9fafb);color:var(--stx-tabs-text,#6b7280);border-right:1px solid var(--stx-tabs-border,#e5e7eb)',
        disabledTab: 'opacity:0.4;cursor:not-allowed',
      }
    default: // underline
      return {
        tabList: 'display:flex;border-bottom:2px solid var(--stx-tabs-border,#e5e7eb)',
        activeTab: 'color:var(--stx-tabs-active-text,#111827);border-bottom:2px solid var(--stx-tabs-active-border,#3b82f6);margin-bottom:-2px;font-weight:600',
        inactiveTab: 'color:var(--stx-tabs-text,#6b7280);border-bottom:2px solid transparent;margin-bottom:-2px',
        disabledTab: 'opacity:0.4;cursor:not-allowed',
      }
  }
}

export const StxTabsBuiltin: BuiltinComponentDef = {
  name: 'StxTabs',
  aliases: ['stx-tabs'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const tabs = parseTabs(slotContent)
    if (tabs.length === 0) {
      return '<!-- StxTabs: no StxTab children found -->'
    }

    const defaultTab = resolveProp(props, 'default') || tabs[0].id
    const variant = resolveProp(props, 'variant') || 'underline'
    const styles = variantStyles(variant)
    const uid = `stx-tabs-${Math.random().toString(36).slice(2, 8)}`

    const buttonBase = 'padding:0.625rem 1rem;font-size:0.875rem;line-height:1.25rem;cursor:pointer;border:none;background:none;transition:color 0.15s,border-color 0.15s,background 0.15s;white-space:nowrap;outline:none'

    const tabButtons = tabs.map((tab) => {
      const isActive = tab.id === defaultTab
      const activeStyle = isActive ? styles.activeTab : styles.inactiveTab
      const disabledStyle = tab.disabled ? styles.disabledTab : ''
      const disabledAttr = tab.disabled ? ' disabled aria-disabled="true" tabindex="-1"' : ` tabindex="${isActive ? '0' : '-1'}"`
      return `<button role="tab" id="${uid}-tab-${tab.id}" aria-selected="${isActive}" aria-controls="${uid}-panel-${tab.id}" data-stx-tab="${tab.id}" style="${buttonBase};${activeStyle};${disabledStyle}"${disabledAttr}>${tab.label}</button>`
    }).join('\n    ')

    const tabPanels = tabs.map((tab) => {
      const isActive = tab.id === defaultTab
      return `<div role="tabpanel" id="${uid}-panel-${tab.id}" aria-labelledby="${uid}-tab-${tab.id}" data-stx-tab-panel="${tab.id}" style="padding:1rem;${isActive ? '' : 'display:none'}"${isActive ? '' : ' hidden'}>${tab.content}</div>`
    }).join('\n  ')

    return `<div data-stx-tabs="${uid}" data-variant="${variant}">
  <div role="tablist" aria-label="Tabs" style="${styles.tabList}">
    ${tabButtons}
  </div>
  ${tabPanels}
</div>
<style>
@media(prefers-color-scheme:dark){[data-stx-tabs]{--stx-tabs-border:#374151;--stx-tabs-list-bg:#1f2937;--stx-tabs-text:#9ca3af;--stx-tabs-active-text:#f9fafb;--stx-tabs-active-bg:#374151;--stx-tabs-active-border:#60a5fa}}
[data-stx-tabs] [role="tab"]:focus-visible{outline:2px solid var(--stx-tabs-active-border,#3b82f6);outline-offset:-2px;border-radius:2px}
[data-stx-tabs] [role="tab"]:hover:not(:disabled){color:var(--stx-tabs-active-text,#111827)}
</style>
<script>
(function(){
  var root=document.querySelector('[data-stx-tabs="${uid}"]');
  if(!root)return;
  var variant=${JSON.stringify(variant)};
  var styles=${JSON.stringify(styles)};
  var tabList=root.querySelector('[role="tablist"]');
  var tabs=Array.from(tabList.querySelectorAll('[role="tab"]'));
  var panels=Array.from(root.querySelectorAll('[role="tabpanel"]'));

  function activate(id){
    tabs.forEach(function(btn){
      var active=btn.getAttribute('data-stx-tab')===id;
      btn.setAttribute('aria-selected',String(active));
      btn.setAttribute('tabindex',active?'0':'-1');
      var base='${buttonBase.replace(/'/g, "\\'")}';
      var extra=active?styles.activeTab:styles.inactiveTab;
      if(btn.disabled)extra+=';'+styles.disabledTab;
      btn.style.cssText=base+';'+extra;
    });
    panels.forEach(function(p){
      var active=p.getAttribute('data-stx-tab-panel')===id;
      if(active){p.style.display='';p.removeAttribute('hidden')}
      else{p.style.display='none';p.setAttribute('hidden','')}
    });
  }

  tabList.addEventListener('click',function(e){
    var btn=e.target.closest('[role="tab"]');
    if(!btn||btn.disabled)return;
    activate(btn.getAttribute('data-stx-tab'));
    btn.focus();
  });

  tabList.addEventListener('keydown',function(e){
    var btn=e.target.closest('[role="tab"]');
    if(!btn)return;
    var enabledTabs=tabs.filter(function(t){return !t.disabled});
    var idx=enabledTabs.indexOf(btn);
    if(idx===-1)return;
    var next=-1;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){
      next=(idx+1)%enabledTabs.length;
    }else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){
      next=(idx-1+enabledTabs.length)%enabledTabs.length;
    }else if(e.key==='Home'){
      next=0;
    }else if(e.key==='End'){
      next=enabledTabs.length-1;
    }
    if(next!==-1){
      e.preventDefault();
      var t=enabledTabs[next];
      activate(t.getAttribute('data-stx-tab'));
      t.focus();
    }
  });
})();
</script>`
  },
}
