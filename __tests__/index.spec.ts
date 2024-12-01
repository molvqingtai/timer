import { test, describe, expect, beforeEach, vi } from 'vitest'
import Timer from '../src'
import { sleep } from './utils'

describe('Test timer', () => {
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
  describe('Test event', () => {
    let timer: Timer
    beforeEach(() => {
      timer = new Timer(() => 'foobar', {
        limit: 3,
        interval: 50
      })
    })
    test('should emit start event', async () => {
      const callback = vi.fn()
      timer.on('start', callback)
      timer.start()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit pause event', async () => {
      const callback = vi.fn()
      timer.on('pause', callback)
      timer.start()
      timer.pause()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit stop event', async () => {
      const callback = vi.fn()
      timer.on('stop', callback)
      timer.start()
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit end event', async () => {
      const callback = vi.fn()
      timer.on('end', callback)
      timer.start()
      await sleep(200)
      timer.stop()
      expect(callback).toHaveBeenCalled()
    })
    test('should emit tick event', async () => {
      const callback = vi.fn()
      timer.on('tick', callback)
      timer.start()
      await sleep(100)
      timer.stop()
      expect(callback).toHaveBeenCalledWith('foobar')
    })
    test('should emit error event', async () => {
      const callback = vi.fn()
      const timer = new Timer(
        () => {
          throw new Error('foobar')
        },
        {
          limit: 1
        }
      )
      timer.on('error', callback)
      timer.start()
      await sleep(100)
      timer.stop()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: 'foobar' }))
    })
  })

  describe('Test sync callback', () => {
    test('should call callback 3 times', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3
      })
      timer.start()
      await sleep(100)
      expect(callback).toHaveBeenCalledTimes(3)
    })
    test('should call callback 2 times and stop', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3,
        interval: 100
      })
      timer.start()
      await sleep(250)
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
      await sleep(350)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should call callback 2 times and pause', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        limit: 3,
        interval: 100
      })
      timer.start()
      await sleep(250)
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
      await sleep(150)
      // interval 100 < sleep 150 = +1 times
      expect(callback).toHaveBeenCalledTimes(1)
      // last = 50
      timer.pause()
      await sleep(100)
      // lat = 50
      expect(callback).toHaveBeenCalledTimes(1)
      // inherit last 50
      timer.start()
      await sleep(75)
      timer.stop()
      // interval < (last 50 + sleep 75)= +1 times
      expect(callback).toHaveBeenCalledTimes(2)
    })

    test('should call callback immediately', async () => {
      const callback = vi.fn()
      const timer = new Timer(callback, {
        interval: 100,
        immediate: true
      })
      timer.start()
      await sleep(50)
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
      await sleep(100)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should call async callback 2 times and stop', async () => {
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
      await sleep(250)
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
      await sleep(650)
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
      await sleep(250)
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
      await sleep(150)
      // interval 200 > sleep 150 = +0 times
      expect(callback).toHaveBeenCalledTimes(0)
      // Time is paused, but promise continues
      timer.pause()
      await sleep(100)
      // interval 200 < (sleep 150 + sleep 100) = +1 times
      // last = 50
      expect(callback).toHaveBeenCalledTimes(1)
      // inherit last 50
      timer.start()
      await sleep(180)
      timer.stop()
      // interval 200 < (last 50 + sleep 180) = +1 times
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
      await sleep(50)
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
      await sleep(50)
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
      await sleep(100)
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
