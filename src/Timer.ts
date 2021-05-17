import EventHub from './EventHub'

export default class Timer extends EventHub {
  private readonly tasks = new Map()

  // issues: https://github.com/typescript-eslint/typescript-eslint/issues/3387
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  setup = (func: Function, wait: number, delay: number): Promise<number> => {
    const timer = new Promise<number>((resolve, reject) => {
      const timing: FrameRequestCallback = () => {
        const state = this.tasks.get(timer)
        try {
          const endTime = Date.now()
          cancelAnimationFrame(requestID)
          if (endTime - state.startDelay < delay) {
            if (endTime - state.startTime >= wait) {
              func(endTime)
              this.tasks.set(timer, { ...state, startTime: endTime })
            }
            requestID = requestAnimationFrame(timing)
          } else {
            resolve(endTime)
          }
        } catch (error) {
          reject(error)
        }
      }
      let requestID = requestAnimationFrame(timing)
    })
    this.tasks.set(timer, {
      pause: false,
      startDelay: Date.now(),
      startTime: Date.now(),
      wait,
      delay
    })
    return timer
  }

  pause = async (timer: Promise<number>): Promise<number> => {
    const state = this.tasks.get(timer)
    console.log(state)
    this.tasks.set(timer, { pause: true, ...state })
    return Date.now()
  }

  resume = async (): Promise<number> => {
    return 1
  }

  clear = async (timer: Promise<number>): Promise<number> => {
    return 1
  }
}
