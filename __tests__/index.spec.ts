import { test, describe, expect, beforeEach, vi, afterEach } from 'vitest'
import Timer from '../src'
import { sleep } from './utils'

describe('Test timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  describe('Test methods', () => {
    let timer: Timer
    beforeEach(() => {
      timer = new Timer(vi.fn())
    })

    test('Status should work properly', async () => {
      timer.start()
      expect(timer.status).toBe('running')
      timer.pause()
      expect(timer.status).toBe('paused')
      timer.start()
      expect(timer.status).toBe('running')
      timer.pause()
      expect(timer.status).toBe('paused')
      timer.stop()
      expect(timer.status).toBe('stopped')
    })
  })
  describe('Test on event', () => {
    test('should emit start event', async () => {
      const timer = new Timer(() => 'foobar', {
        interval: 50
      })
      const callback = vi.fn()
      timer.on('start', callback)
      timer.start()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit pause event', async () => {
      const timer = new Timer(() => 'foobar', {
        interval: 50
      })
      const callback = vi.fn()
      timer.on('pause', callback)
      timer.start()
      timer.pause()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit stop event', async () => {
      const timer = new Timer(() => 'foobar', {
        interval: 50
      })
      const callback = vi.fn()
      timer.on('stop', callback)
      timer.start()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit end event', async () => {
      const timer = new Timer(() => 'foobar', {
        interval: 1000,
        limit: 1
      })
      const callback = vi.fn()
      timer.on('end', callback)
      timer.start()
      await vi.advanceTimersByTimeAsync(2000)
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit tick event', async () => {
      const timer = new Timer(() => 'foobar', {
        interval: 1000
      })
      const callback = vi.fn()
      timer.on('tick', callback)
      timer.start()
      await vi.advanceTimersByTimeAsync(2000)
      timer.stop()
      expect(callback).toHaveBeenCalledWith('foobar')
    })
    test('should emit error event', async () => {
      const timer = new Timer(
        () => {
          throw new Error('foobar')
        },
        {
          limit: 1
        }
      )
      const callback = vi.fn()
      timer.on('error', callback)
      timer.start()
      await vi.advanceTimersByTimeAsync(1000)
      timer.stop()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: 'foobar' }))
    })
  })

  describe('Test off event', () => {
    let timer: Timer
    beforeEach(() => {
      timer = new Timer(() => 'foobar', {
        limit: 3,
        interval: 50
      })
    })

    test('should not emit start event after off', async () => {
      const callback = vi.fn()
      timer.on('start', callback)
      timer.off('start')
      timer.start()
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })

    test('should not emit pause event after off', async () => {
      const callback = vi.fn()
      timer.on('pause', callback)
      timer.off('pause')
      timer.start()
      timer.pause()
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })

    test('should not emit stop event after off', async () => {
      const callback = vi.fn()
      timer.on('stop', callback)
      timer.off('stop')
      timer.start()
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })

    test('should not emit end event after off', async () => {
      const callback = vi.fn()
      timer.on('end', callback)
      timer.off('end')
      timer.start()
      await vi.advanceTimersByTimeAsync(200)
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })

    test('should not emit tick event after off', async () => {
      const callback = vi.fn()
      timer.on('tick', callback)
      timer.off('tick')
      timer.start()
      await vi.advanceTimersByTimeAsync(100)
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })

    test('should not emit error event after off', async () => {
      const callback = vi.fn()
      const timer = new Timer(() => {
        throw new Error()
      })
      timer.on('error', callback)
      timer.off('error')
      timer.start()
      await vi.advanceTimersByTimeAsync(200)
      timer.stop()
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Test sync callback', () => {
    test('should call callback 3 times', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(100)
      expect(callback).toHaveBeenCalledTimes(3)
    })
    test('should call callback 2 times and stop', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3,
        interval: 100
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(250)
      timer.stop()
      expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should call callback 3 times and stop', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3,
        interval: 100
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(350)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should call callback 2 times and pause', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3,
        interval: 100
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(250)
      timer.pause()
      expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should call callback 2 times and restart', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 5,
        interval: 100
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(150)
      // interval 100 < vi.advanceTimersByTimeAsync 150 = +1 times
      expect(callback).toHaveBeenCalledTimes(1)
      // last = 50
      timer.pause()
      await vi.advanceTimersByTimeAsync(100)
      // lat = 50
      expect(callback).toHaveBeenCalledTimes(1)
      // inherit last 50
      timer.start()
      await vi.advanceTimersByTimeAsync(75)
      timer.stop()
      // interval < (last 50 + vi.advanceTimersByTimeAsync 75)= +1 times
      expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should call callback immediately', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        interval: 100,
        immediate: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(50)
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Test async callback', () => {
    test('should call async callback 3 times', async () => {
      const callback = vi.fn()
      const promise = async () => {
        await sleep(0)
        callback()
      }
      const timer = new Timer(promise, {
        limit: 3,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(100)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should call async callback 1 times and stop', async () => {
      const callback = vi.fn()
      const promise = async () => {
        await sleep(100)
        callback()
      }
      const timer = new Timer(promise, {
        limit: 3,
        interval: 100,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(250)
      timer.stop()
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should call async callback 3 times and stop', async () => {
      const callback = vi.fn()
      const promise = async () => {
        await sleep(100)
        callback()
      }
      const timer = new Timer(promise, {
        limit: 3,
        interval: 100,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(650)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should call async callback 2 times and pause', async () => {
      const callback = vi.fn()
      const promise = async () => {
        await sleep(100)
        callback()
      }
      const timer = new Timer(promise, {
        limit: 3,
        interval: 100,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(250)
      timer.pause()
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should call async callback 2 times and restart', async () => {
      const callback = vi.fn()
      const promise = async () => {
        await sleep(100)
        callback()
      }
      const timer = new Timer(promise, {
        limit: 5,
        // interval = interval 100 + promise 100 = 200
        interval: 100
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(150)
      // interval 200 > vi.advanceTimersByTimeAsync 150 = +0 times
      expect(callback).toHaveBeenCalledTimes(0)
      // Time is paused, but promise continues
      timer.pause()
      await vi.advanceTimersByTimeAsync(100)
      // interval 200 < (vi.advanceTimersByTimeAsync 150 + vi.advanceTimersByTimeAsync 100) = +1 times
      // last = 50
      expect(callback).toHaveBeenCalledTimes(1)
      // inherit last 50
      timer.start()
      await vi.advanceTimersByTimeAsync(180)
      timer.stop()
      // interval 200 < (last 50 + vi.advanceTimersByTimeAsync 180) = +1 times
      expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should call async callback immediately', async () => {
      const callback = vi.fn()
      const promise = async () => {
        Promise.resolve(callback())
      }
      const timer = new Timer(promise, {
        interval: 100,
        immediate: true,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(50)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should call async callback includeAsyncTime', async () => {
      const callback = vi.fn()
      const promise = async () => {
        Promise.resolve(callback())
      }
      const timer = new Timer(promise, {
        interval: 100,
        immediate: false,
        includeAsyncTime: true
      })
      timer.start()
      await vi.advanceTimersByTimeAsync(50)
      expect(callback).toHaveBeenCalledTimes(0)
    })
  })
  describe('Test use timer in Callback', () => {
    test('should emit stop event', async () => {
      const callback = vi.fn()
      const timer = new Timer(
        (_, timer: Timer) => {
          timer.stop()
        },
        { limit: 1 }
      )
      timer.on('stop', callback)

      timer.start()
      await vi.advanceTimersByTimeAsync(100)
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
