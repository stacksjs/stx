import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { processServerBindings } from '../../src/server-bindings'

describe('native structured picker props',()=>{
  it('preserves computed item records through the full native component pipeline',async()=>{
    const source=`<Picker :items="['Hike','Walk'].map(value => ({value,label:value}))" :value="'Hike'" />`
    const {document}=await compileScreenSource(source,path.join(import.meta.dir,'PickerItems.stx'))
    expect(document.root.type).toBe('Picker')
    expect(document.root.props.items).toEqual([{value:'Hike',label:'Hike'},{value:'Walk',label:'Walk'}])
    expect(document.root.props.value).toBe('Hike')
  })
  it('retains numeric selection values and escaped labels as typed data',async()=>{
    const source=`<Picker :items="rows.map((label,index) => ({value:index,label}))" :selectedValue="0" />`
    const {document}=await compileScreenSource(source,path.join(import.meta.dir,'EscapedPickerItems.stx'),{context:{rows:['Rock & "wood" <path>']}})
    expect(document.root.props.items).toEqual([{value:0,label:'Rock & "wood" <path>'}])
    expect(document.root.props.selectedValue).toBe(0)
  })
  it('keeps ordinary DOM attributes string-valued, including native-looking text inside a quoted value',()=>{
    const source='<div title="data-native" :data-items="values"></div>'
    expect(processServerBindings(source,{values:[{value:'Hike',label:'Hike'}]})).toBe('<div title="data-native" data-items="[object Object]"></div>')
  })
  it('does not treat an attribute suffix as a native host marker', () => {
    const source = '<div x-data-native="Picker" :data-items="values"></div>'
    expect(processServerBindings(source, { values: [{ value: 'Hike' }] })).toBe('<div x-data-native="Picker" data-items="[object Object]"></div>')
  })
})
