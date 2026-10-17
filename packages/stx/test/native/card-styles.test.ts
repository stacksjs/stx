import { describe, expect, test } from 'bun:test'
import { compileClassStyles, compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'

describe('native floating card utilities', () => {
  test('preserves negative margins on the correct edges', () => {
    expect(compileHeadwindToStyle('-mx-4 -mt-3 mb-2')).toEqual({marginHorizontal:-16,marginTop:-12,marginBottom:8})
    expect(compileHeadwindToStyle('-m-[6px]')).toEqual({margin:-6})
    const result=compileClassStyles('-mx-auto -p-2')
    expect(result.unknown).toEqual(['-mx-auto','-p-2'])
    expect(result.style).toEqual({})
  })
  test('sends card shadows to both hosts rather than dropping the class', () => {
    const result=compileClassStyles('rounded-3xl shadow-lg dark:shadow-none')
    expect(result.unknown).toEqual([])
    expect(result.style).toMatchObject({borderRadius:24,shadowOpacity:0.18,shadowRadius:10,shadowOffset:{width:0,height:6},elevation:8})
    expect(result.dark).toMatchObject({shadowOpacity:0,shadowRadius:0,elevation:0})
  })
  test('can remove a shadow after another utility has set one', () => {
    expect(compileHeadwindToStyle('shadow-xl shadow-none')).toMatchObject({shadowOpacity:0,shadowRadius:0,shadowOffset:{width:0,height:0},elevation:0})
  })
})
