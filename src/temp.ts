import * as temp from 'temp'
temp.track()

const exitEvents = ['exit', 'SIGINT', 'SIGTERM']
exitEvents.forEach((e) => {
  process.on(e, () => {
    temp.cleanupSync()
  })
})
