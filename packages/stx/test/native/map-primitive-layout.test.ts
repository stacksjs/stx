import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileScreenSource } from '../../src/native/compiler/render-screen'

describe('native Map component layout',()=>{
  it('preserves authored map dimensions, clipping and route overlay children through the real STX component',async()=>{
    const source='<Map class="h-[320px] w-full rounded-[12px] overflow-hidden" testID="record-map"><MapPolyline geometry="[37,-119,37.01,-119.01]" strokeColor="#24724b" /></Map>'
    const {document}=await compileScreenSource(source,path.join(import.meta.dir,'MapLayout.stx'))
    expect(document.root.type).toBe('Map')
    expect(document.root.style).toMatchObject({height:320,width:'100%',borderRadius:12,overflow:'hidden'})
    expect(document.root.props.testID).toBe('record-map')
    expect(document.root.children).toHaveLength(1)
    const child=document.root.children[0]
    expect(typeof child).toBe('object')
    if(typeof child==='object')expect(child).toMatchObject({type:'MapPolyline',props:{geometry:[37,-119,37.01,-119.01]}})
  })
})
