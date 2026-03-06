import { describe, expect, test } from 'bun:test'
import { filePathToRoutePath } from '../src'

describe('filePathToRoutePath', () => {
  test('converts simple file path', () => {
    expect(filePathToRoutePath('posts.ts')).toBe('/api/posts')
  })

  test('converts nested file path', () => {
    expect(filePathToRoutePath('posts/comments.ts')).toBe('/api/posts/comments')
  })

  test('converts dynamic param [id]', () => {
    expect(filePathToRoutePath('posts/[id].ts')).toBe('/api/posts/:id')
  })

  test('converts nested dynamic params', () => {
    expect(filePathToRoutePath('posts/[id]/comments.ts')).toBe('/api/posts/:id/comments')
  })

  test('converts multiple dynamic params', () => {
    expect(filePathToRoutePath('posts/[postId]/comments/[commentId].ts'))
      .toBe('/api/posts/:postId/comments/:commentId')
  })

  test('handles index files', () => {
    expect(filePathToRoutePath('posts/index.ts')).toBe('/api/posts')
  })

  test('handles .js extension', () => {
    expect(filePathToRoutePath('users.js')).toBe('/api/users')
  })

  test('uses custom prefix', () => {
    expect(filePathToRoutePath('posts.ts', '/v1')).toBe('/v1/posts')
  })

  test('handles empty prefix', () => {
    expect(filePathToRoutePath('posts.ts', '')).toBe('/posts')
  })
})
