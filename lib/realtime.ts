import { EventEmitter } from 'events'

type RealtimeEmitter = EventEmitter & { __tjuRealtime?: boolean }

declare global {
  // eslint-disable-next-line no-var
  var __tjuRealtimeEmitter: RealtimeEmitter | undefined
}

const emitter: RealtimeEmitter = global.__tjuRealtimeEmitter || Object.assign(new EventEmitter(), { __tjuRealtime: true })

if (!global.__tjuRealtimeEmitter) {
  global.__tjuRealtimeEmitter = emitter
}

export function notifyUpdate() {
  emitter.emit('update', Date.now())
}

export function getRealtimeEmitter() {
  return emitter
}
