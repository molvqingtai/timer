# Timer

[![version](https://img.shields.io/github/v/release/molvqingtai/timer)](https://www.npmjs.com/package/@resreq/timer) [![workflow](https://github.com/molvqingtai/timer/actions/workflows/ci.yml/badge.svg)](https://github.com/molvqingtai/timer/actions) [![download](https://img.shields.io/npm/dt/@resreq/timer)](https://www.npmjs.com/package/@resreq/timer) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

⏰ Short and sweet timer

## Install

```shell
npm install @resreq/timer
```

## Usage

```typescript
import Timer from '@resreq/timer'

const log = (time: number) => console.log('time:', time)

const timer = new Timer(log, {
  interval: 1000,
  immediate: true
})

timer.on('start', (time) => {
  console.log('start:', time)
})
timer.on('pause', (time) => {
  console.log('pause:', time)
})
timer.on('stop', (time) => {
  console.log('stop:', time)
})

timer.start()

setTimeout(() => timer.pause(), 1000)
setTimeout(() => timer.start(), 2000)
setTimeout(() => timer.stop(), 3000)

// => start: 1712160512855
// => time: 1712160512858
// => pause: 1712160513855
// => start: 1712160514855
// => time: 1712160514855
// => stop: 1712160515855
```

**Adapter**

`setTimeout` is used by default, and custom adapters are supported, such as `requestAnimationFrame`, `cancelIdleCallback`, etc...

```typescript
const timer = new Timer(log, {
  adapter: {
    setTimer: globalThis.requestAnimationFrame.bind(globalThis),
    cancelTimer: globalThis.cancelAnimationFrame.bind(globalThis)
  }
})
```

## LICENSE

This project is licensed under the MIT License - see the [LICENSE](https://github.com/molvqingtai/timer/blob/main/LICENSE) file for details.
