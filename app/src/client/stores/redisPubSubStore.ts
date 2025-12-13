import { create } from 'zustand'

type PubSubMessage = {
  time: string
  channel: string
  message: string
}

interface RedisPubSubStoreState {
  messages: PubSubMessage[]
}

const store = create<RedisPubSubStoreState>(() => ({
  messages: [],
}))

export const addRedisPubSubMessage = (message: PubSubMessage) => {
  store.setState((pre) => ({ messages: [message, ...pre.messages] }))
}

export const useRedisPubSubStore = store
