import EventHub from '@resreq/event-hub'

type TimerCallback = (time: number, timer: Timer) => any | Promise<any>

export interface TimerListener {
  start: (time: number) => void
  pause: (time: number) => void
  stop: (time: number) => void
  end: (time: number) => void
  error: (error: Error) => void
  tick: (data: any) => void
}

export interface TimerAdapter {
  setTimer: (callback: () => void) => number
  cancelTimer: (timerId: number) => void
}

export interface TimerOptions {
  limit?: number
  interval?: number
  immediate?: boolean
  includeAsyncTime?: boolean
  adapter?: TimerAdapter
}

export type TimerEvent = 'start' | 'pause' | 'stop' | 'end' | 'tick' | 'error'

export type TimerStatus = 'running' | 'paused' | 'stopped'

export default class Timer {
  private startTime: number
  private pausedTime: number
  private readonly callback: TimerCallback
  private readonly immediate: boolean
  private timerId: number | null
  private limit: number
  private readonly initLimit: number
  private readonly interval: number
  private readonly includeAsyncTime: boolean
  public status: TimerStatus
  private readonly eventHub: EventHub
  private readonly adapter: TimerAdapter

  constructor(callback: TimerCallback, options?: TimerOptions) {
    this.startTime = 0
    this.pausedTime = 0
    this.callback = callback
    this.timerId = null
    this.initLimit = this.limit = options?.limit ?? Infinity
    this.interval = options?.interval ?? 0
    this.includeAsyncTime = options?.includeAsyncTime ?? false
    this.immediate = options?.immediate ?? false
    this.on = this.on.bind(this)
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.pause = this.pause.bind(this)
    this.tick = this.tick.bind(this)
    this.status = 'stopped'
    this.eventHub = new EventHub()
    this.adapter = options?.adapter ?? {
      setTimer: globalThis.setTimeout.bind(globalThis),
      cancelTimer: globalThis.clearTimeout.bind(globalThis)
    }
  }

  on<T extends keyof TimerListener>(event: T, listener: TimerListener[T]) {
    this.eventHub.on(event, listener)
  }

  off<T extends keyof TimerListener>(event?: T | T[], listener?: TimerListener[T]) {
    this.eventHub.off(event, listener)
  }

  start() {
    if (this.status === 'stopped' || this.status === 'paused') {
      if (this.limit > 0) {
        this.status = 'running'
        this.eventHub.emit('start', Date.now())
        this.startTime = Date.now() - this.pausedTime
        this.timerId = this.adapter.setTimer(() => {
          this.tick(Date.now(), this.immediate)
        })
      }
    }
  }

  stop() {
    if (this.status === 'running' || this.status === 'paused') {
      this.status = 'stopped'
      this.eventHub.emit('stop', Date.now())
      this.pausedTime = 0
      this.limit === 0 && this.eventHub.emit('end', Date.now())
      this.adapter.cancelTimer(this.timerId!)
      this.limit = this.initLimit
      this.timerId = null
    }
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused'
      this.eventHub.emit('pause', Date.now())
      this.adapter.cancelTimer(this.timerId!)
      this.timerId = null
      this.pausedTime = Date.now() - this.startTime
    }
  }

  private async tick(currentTime: number, immediate?: boolean) {
    if (this.status === 'running') {
      const elapsedTime = currentTime - this.startTime
      if (this.limit > 0) {
        if (immediate ?? elapsedTime >= this.interval) {
          try {
            if (this.includeAsyncTime) {
              const data = await this.callback(Date.now(), this)
              this.eventHub.emit('tick', data)
            } else {
              const data = this.callback(Date.now(), this)
              this.eventHub.emit('tick', data)
            }
          } catch (error) {
            this.eventHub.emit('error', error)
          } finally {
            this.limit--
            this.startTime = Date.now()
          }
        }
        this.timerId && this.adapter.cancelTimer(this.timerId)
        this.timerId = this.adapter.setTimer(() => {
          this.tick(Date.now())
        })
      } else {
        this.stop()
      }
    }
  }
}
