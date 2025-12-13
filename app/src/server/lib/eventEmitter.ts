import EventEmitter from 'node:events'
import { __DEV__ } from '../utils/env'

declare global {
  var eventEmitter: EventEmitter
}

const createEventEmitter = () => {
  return new EventEmitter()
}

const eventEmitter = global.eventEmitter || createEventEmitter()

if (__DEV__) {
  global.eventEmitter = eventEmitter
}

export default eventEmitter
