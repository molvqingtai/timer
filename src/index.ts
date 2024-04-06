import EventHub from '@resreq/event-hub'

type TimerCallback = (timer: number) => any | Promise<any>

export interface TimerListener {
  start: (time: number) => void
  pause: (time: number) => void
  stop: (time: number) => void
  end: (time: number) => void
  error: (error: Error) => void
  tick: (data: any) => void
}

export interface TimerOptions {
  limit?: number
  delay?: number
  immediate?: boolean
  includeAsyncTime?: boolean
}

export type TimerEvent = 'start' | 'pause' | 'stop' | 'end' | 'tick' | 'error'

export type TimerStatus = 'started' | 'paused' | 'stopped'

export default class Timer {
  private startTime: number
  private pausedTime: number
  private readonly callback: TimerCallback
  private readonly immediate: boolean
  private requestId: number | null
  private limit: number
  private readonly initLimit: number
  private readonly delay: number
  private readonly includeAsyncTime: boolean
  public status: TimerStatus
  private readonly eventHub: EventHub

  constructor(callback: TimerCallback, options?: TimerOptions) {
    this.startTime = 0
    this.pausedTime = 0
    this.callback = callback
    this.requestId = null
    this.initLimit = this.limit = options?.limit ?? Infinity
    this.delay = options?.delay ?? 0
    this.includeAsyncTime = options?.includeAsyncTime ?? false
    this.immediate = options?.immediate ?? false
    this.on = this.on.bind(this)
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.pause = this.pause.bind(this)
    this.tick = this.tick.bind(this)
    this.status = 'stopped'
    this.eventHub = new EventHub()
  }

  on<T extends keyof TimerListener>(event: T, listener: TimerListener[T]) {
    this.eventHub.on(event, listener)
  }

  async start() {
    if (this.status === 'stopped' || this.status === 'paused') {
      if (this.limit > 0) {
        this.status = 'started'
        this.eventHub.emit('start', Date.now())
        this.startTime = performance.now() - this.pausedTime
        this.requestId = requestAnimationFrame((time) => {
          this.tick(time, this.immediate)
        })
      }
    }
  }

  stop() {
    if (this.status === 'started' || this.status === 'paused') {
      this.status = 'stopped'
      this.eventHub.emit('stop', Date.now())
      this.limit === 0 && this.eventHub.emit('end', Date.now())
      cancelAnimationFrame(this.requestId!)
      this.limit = this.initLimit
      this.requestId = null
    }
  }

  pause() {
    if (this.status === 'started') {
      this.status = 'paused'
      this.eventHub.emit('pause', Date.now())
      cancelAnimationFrame(this.requestId!)
      this.requestId = null
      this.pausedTime = performance.now() - this.startTime
    }
  }

  private async tick(currentTime: number, immediate?: boolean) {
    const elapsedTime = currentTime - this.startTime
    if (this.limit > 0) {
      try {
        if (immediate ?? elapsedTime >= this.delay) {
          this.limit--
          if (this.includeAsyncTime) {
            const data = await this.callback(Date.now())
            this.eventHub.emit('tick', data)
          } else {
            const data = this.callback(Date.now())
            this.eventHub.emit('tick', data)
          }
          this.startTime = performance.now()
        }
      } catch (error) {
        this.startTime = performance.now()
        this.eventHub.emit('error', error)
      } finally {
        this.requestId && cancelAnimationFrame(this.requestId)
        this.requestId = requestAnimationFrame(this.tick)
      }
    } else {
      this.stop()
      this.eventHub.emit('end', Date.now())
    }
  }
}
