import { afterEach, describe, expect, it, vi } from 'vitest'
import { FxError } from '@/ports/fx'
import {
  createFrankfurterProvider,
  FX_ENDPOINT,
  FX_TIMEOUT_MS,
} from './frankfurter'

const now = () => Date.parse('2026-10-27T10:00:00Z')
const data = { base: 'HKD', quote: 'CNY', date: '2026-10-26', rate: 0.8501236 }
const signal = () => new AbortController().signal

afterEach(() => vi.useRealTimers())
describe('fixed public FX adapter', () => {
  it('makes only a fixed request, omitting credentials, referrers, redirects and browser caching', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(data)))
    await expect(
      createFrankfurterProvider(request, now).latest(signal()),
    ).resolves.toMatchObject({ hkdToCnyPpm: 850124 })
    expect(request).toHaveBeenCalledExactlyOnceWith(
      FX_ENDPOINT,
      expect.objectContaining({
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        cache: 'no-store',
      }),
    )
    const options = request.mock.calls[0][1]!
    expect(options.body).toBeUndefined()
    expect(options.headers).toBeUndefined()
  })
  it('distinguishes HTTP, network and invalid JSON failures', async () => {
    for (const [response, code] of [
      [
        new Response('private error must not be surfaced', { status: 503 }),
        'http',
      ],
      [new Response('not-json'), 'invalid-response'],
    ] as const) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(response)
      await expect(
        createFrankfurterProvider(request, now).latest(signal()),
      ).rejects.toMatchObject({ code })
    }
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('raw connection failure'))
    await expect(
      createFrankfurterProvider(request, now).latest(signal()),
    ).rejects.toMatchObject({ code: 'network' })
  })
  it('aborts at the timeout and does not keep the request timer alive afterwards', async () => {
    vi.useFakeTimers()
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options!.signal!.addEventListener(
              'abort',
              () => reject(new Error('aborted')),
              { once: true },
            ),
          ),
      )
    const result = createFrankfurterProvider(request, now).latest(signal())
    const checked = expect(result).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(FX_TIMEOUT_MS)
    await checked
    expect(vi.getTimerCount()).toBe(0)
  })
  it('does not fetch an already aborted request and rejects late results from cancelled requests', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(data)))
    const active = new AbortController()
    active.abort()
    await expect(
      createFrankfurterProvider(request, now).latest(active.signal),
    ).rejects.toEqual(new FxError('aborted'))
    expect(request).not.toHaveBeenCalled()
    const later = new AbortController()
    const late = vi.fn<typeof fetch>().mockImplementation(async () => {
      later.abort()
      return new Response(JSON.stringify(data))
    })
    await expect(
      createFrankfurterProvider(late, now).latest(later.signal),
    ).rejects.toMatchObject({ code: 'aborted' })
  })
})
