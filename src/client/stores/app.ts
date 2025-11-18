import { type EventKey } from '@/constants/event'
import { create } from 'zustand'

interface AppStoreState {
  init: boolean
  connections: any[]
}

const appStore = create<AppStoreState>(() => ({
  init: false,
  connections: [],
}))

export const dispatchAppStore = (key: EventKey, payload: any) => {
  appStore.setState({ [key]: payload })
}

export const changeConnections = (
  connections: AppStoreState['connections']
) => {
  appStore.setState({ connections })
}

export { appStore as useAppStore }
