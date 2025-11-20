import { create } from 'zustand'
import { getConnections } from '../commands/api/connections'

interface AppStoreState {
  init: boolean
  connections: any[]
}

const appStore = create<AppStoreState>(() => ({
  init: false,
  connections: [],
}))

export const queryConnections = async () => {
  return getConnections().then((res) => {
    changeConnections(res)
  })
}

export const changeConnections = (
  connections: AppStoreState['connections']
) => {
  appStore.setState({ connections })
}

export { appStore as useAppStore }
