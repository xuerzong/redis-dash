import { create } from 'zustand'
import { getConnections } from '../commands/api/connections'

interface AppStoreState {
  init: boolean
  connections: any[]
  connectionsLoading: boolean
}

const appStore = create<AppStoreState>(() => ({
  init: false,
  connections: [],
  connectionsLoading: true,
}))

export const queryConnections = async () => {
  appStore.setState({ connectionsLoading: true })
  return getConnections()
    .then((res) => {
      changeConnections(res)
    })
    .finally(() => {
      appStore.setState({ connectionsLoading: false })
    })
}

export const changeConnections = (
  connections: AppStoreState['connections']
) => {
  appStore.setState({ connections })
}

export { appStore as useAppStore }
