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
  private readonly tasks = new Set()
  setup = async (func: Function, wait: number, delay: number): Promise<number> => {
    const timer = new Promise<number>((resolve, reject) => {
      const startDelay = Date.now()
      let startTime = startDelay
      const task: FrameRequestCallback = () => {
        try {
          const endTime = Date.now()
          cancelAnimationFrame(requestID)
          if (endTime - startDelay < delay) {
            if (endTime - startTime >= wait) {
              func(endTime)
              startTime = endTime
            }
            requestID = requestAnimationFrame(task)
          } else {
            resolve(endTime)
          }
        } catch (error) {
          reject(error)
        }
      }
      let requestID = requestAnimationFrame(task)
    })
    this.tasks.add(timer)
    return timer
  }

  async pause(): Promise<number> {
    return 1
  }

  async clear(): Promise<number> {
    return 1
  }
}

export const { setup, pause, clear } = new Timer()
export default Timer
