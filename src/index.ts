// export const setup = (func: Function, wait: number, delay: number): any => {
//   return new Promise((resolve, reject) => {
//     const startTime = performance.now()
//     let endDelay = startTime
//     const timer = (endTime: number): any => {
//       cancelAnimationFrame(requestID)
//       if (endTime - endDelay > delay) {
//         if (endTime - startTime >= wait) {
//           func()
//           endDelay = endTime
//         } else {
//           requestID = requestAnimationFrame(timer)
//         }
//       } else {
//         resolve(endTime)
//       }
//     }
//     let requestID = requestAnimationFrame(timer)
//   })
// }

// export const pause = (timer: Promise<number>) => {}
// export const clear = (timer: Promise<number>) => {}

class Timer {
  private readonly tasks = new Map()

  // issues: https://github.com/typescript-eslint/typescript-eslint/issues/3387
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  setup = (func: Function, wait: number, delay: number): Promise<number> => {
    const timer = new Promise<number>((resolve, reject) => {
      const timing: FrameRequestCallback = () => {
        try {
          const status = this.tasks.get(timer)
          const endTime = Date.now()
          cancelAnimationFrame(requestID)
          if (endTime - status.startDelay < delay) {
            if (endTime - status.startTime >= wait) {
              func(endTime)
              this.tasks.set(timer, { ...status, startTime: endTime })
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
    const status = this.tasks.get(timer)
    console.log(status)
    this.tasks.set(timer, { pause: true, ...status })
    return Date.now()
  }

  async resume(): Promise<number> {
    return 1
  }

  async clear(): Promise<number> {
    return 1
  }
}

export const { setup, clear, pause, resume } = new Timer()
export default Timer
