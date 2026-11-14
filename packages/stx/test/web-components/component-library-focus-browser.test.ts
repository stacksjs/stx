import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

test('reactive native elements preserve input focus without applying text selection to unsupported controls', async () => {
  const root = createTempDir('stx-input-focus-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined, browser: WebView | undefined
  try {
    const input = join(root,'source'), output = join(root,'dist')
    await Bun.write(join(input,'InputProbe.stx'), `<script component type="application/json">
{"tag":"native-input-probe","shadowDOM":"open","properties":{"pending":{"type":"boolean","default":true},"title":{"type":"string","default":"Bound title"},"count":{"type":"number","default":0},"score":{"type":"number","default":1},"mode":{"type":"string","default":"text"}}}
</script>
<script client>
function choose(event: Event) { if(event.target instanceof HTMLInputElement) this.score=Number(event.target.value) }
</script>
<template>
<button id="pending" :disabled="this.pending" :aria-label="this.title">Pending</button><button id="bare-pending" :disabled="pending">Bare pending</button><fieldset><legend>Score</legend>@if(this.score===1)<input name="score" type="radio" value="1" checked @change="choose">@else<input name="score" type="radio" value="1" @change="choose">@endif@if(this.score===2)<input name="score" type="radio" value="2" checked @change="choose">@else<input name="score" type="radio" value="2" @change="choose">@endif</fieldset>
<input id="checkbox" type="checkbox"><input id="number" type="number" value="12"><input id="email" type="email" value="test@example.test"><input id="date" type="date" value="2026-11-14">
<input id="text" type="text" value="abcdef"><textarea id="textarea">abcdef</textarea>@if(this.mode==='text')<input id="switch" type="text" value="abcdef">@else<input id="switch" type="email" value="abcdef">@endif<output>{{ this.count }}</output>
</template>`)
    const compiled=await buildComponentLibrary({inputDir:input,outputDir:output,prefix:'native',bundle:false,minify:true})
    const emitted=new Map<string,string>()
    for(const file of compiled.files)if(file.endsWith('.js'))emitted.set('/'+relative(output,file).split(sep).join('/'),file)
    fixture=createBrowserFixture({
      createServer:()=>Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){
        const path=new URL(request.url).pathname
        if(path==='/')return new Response('<!doctype html><link rel="icon" href="/favicon.ico"><script>window.proofErrors=[];addEventListener("error",event=>proofErrors.push(event.message));addEventListener("unhandledrejection",event=>proofErrors.push(String(event.reason)))</script><script type="module" src="/index.js"></script><native-input-probe></native-input-probe>',{headers:{'Content-Type':'text/html'}})
        if(path==='/favicon.ico')return new Response(null,{status:204})
        const file=emitted.get(path)
        if(!file)return new Response('Not found',{status:404})
        return new Response(Bun.file(file),{headers:{'Content-Type':'text/javascript'}})
      }}),
      createView:()=>browser=new WebView({headless:true,backend:{type:'chrome',url:false}}),
    })
    expect((await fetch(new URL('/favicon.ico',fixture.url))).status).toBe(204)
    expect((await fetch(new URL('/missing.js',fixture.url))).status).toBe(404)
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`!!document.querySelector('native-input-probe')?.shadowRoot?.querySelector('input[name=score][value="1"]')`, value=>value===true)).toBe(true)
    expect(await fixture.view.evaluate(`JSON.stringify([...document.querySelector('native-input-probe').shadowRoot.querySelectorAll('button')].map(button=>button.disabled))`)).toBe('[true,true]')
    expect(await fixture.view.evaluate(`document.querySelector('native-input-probe').shadowRoot.querySelector('#pending').getAttribute('aria-label')`)).toBe('Bound title')
    await fixture.view.evaluate(`document.querySelector('native-input-probe').pending=false`)
    expect(await fixture.waitFor(`JSON.stringify([...document.querySelector('native-input-probe').shadowRoot.querySelectorAll('button')].map(button=>button.disabled))`, value=>value==='[false,false]')).toBe('[false,false]')
    await fixture.view.evaluate(`document.querySelector('native-input-probe').shadowRoot.querySelector('input[name=score][value="1"]').focus()`)
    await browser!.press('ArrowRight')
    expect(await fixture.waitFor(`document.querySelector('native-input-probe').score`, value=>value===2)).toBe(2)
    expect(await fixture.view.evaluate(`JSON.stringify(proofErrors)`)).toBe('[]')
    expect(await fixture.view.evaluate(`document.querySelector('native-input-probe').shadowRoot.activeElement?.value`)).toBe('2')
    const unsupported=await fixture.view.evaluate<string>(`(async()=>{
      const element=document.querySelector('native-input-probe'),results=[];
      for(const selector of ['input[name=score][value="2"]','#checkbox','#number','#email','#date']){
        element.shadowRoot.querySelector(selector).focus();element.count++;
        await new Promise(resolve=>setTimeout(resolve,0));
        results.push({selector,focused:element.shadowRoot.activeElement===element.shadowRoot.querySelector(selector),count:Number(element.shadowRoot.querySelector('output').textContent)});
      }
      return JSON.stringify(results);
    })()`)
    expect(JSON.parse(unsupported)).toEqual(['input[name=score][value="2"]','#checkbox','#number','#email','#date'].map((selector,index)=>({selector,focused:true,count:index+1})))
    const text=await fixture.view.evaluate<string>(`(async()=>{
      const element=document.querySelector('native-input-probe'),results=[];
      for(const id of ['text','textarea']){
        const field=element.shadowRoot.querySelector('#'+id);field.focus();field.setSelectionRange(2,5,'backward');element.count++;
        await new Promise(resolve=>setTimeout(resolve,0));
        const next=element.shadowRoot.querySelector('#'+id);
        results.push({id,focused:element.shadowRoot.activeElement?.id,start:next.selectionStart,end:next.selectionEnd,direction:next.selectionDirection});
      }
      const field=element.shadowRoot.querySelector('#switch');field.focus();field.setSelectionRange(1,3);element.mode='email';
      await new Promise(resolve=>setTimeout(resolve,0));
      return JSON.stringify({results,changed:{id:element.shadowRoot.activeElement?.id,type:element.shadowRoot.querySelector('#switch').type}});
    })()`)
    expect(JSON.parse(text)).toEqual({results:['text','textarea'].map(id=>({id,focused:id,start:2,end:5,direction:'backward'})),changed:{id:'switch',type:'email'}})
    expect(await fixture.view.evaluate(`JSON.stringify(proofErrors)`)).toBe('[]')
    expect(await fixture.view.evaluate(`document.querySelector('native-input-probe').shadowRoot.querySelector('input[name=score][value="2"]').checked`)).toBe(true)
  }
  finally {fixture?.close();rmSync(root,{recursive:true,force:true})}
},30_000)
