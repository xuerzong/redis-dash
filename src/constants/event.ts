export const Events = {
  init: 'init',
  sendCommand: 'sendCommand',
  sendRequest: 'sendRequest',
} as const

export type EventKey = keyof typeof Events
