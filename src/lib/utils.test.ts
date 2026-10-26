import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('合并条件类名并忽略空值', () => {
    expect(
      cn('flex', false, null, undefined, { hidden: false, 'items-center': true }),
    ).toBe('flex items-center')
  })

  it('同一 Tailwind 属性发生冲突时保留后面的值', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('分别处理默认状态和悬停状态的类名冲突', () => {
    expect(cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')).toBe(
      'hover:bg-red-600 bg-blue-500',
    )
  })
})
