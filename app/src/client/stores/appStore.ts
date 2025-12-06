import { create } from 'zustand'
import api from '@xuerzong/redis-studio-invoke/api'

interface AppStoreState {
  connections: any[]
  connectionsLoading: boolean
  connectionsCollapsed: boolean
}

const appStore = create<AppStoreState>(() => ({
  connections: [],
  connectionsLoading: true,
  connectionsCollapsed: false,
}))

export const queryConnections = async () => {
  appStore.setState({ connectionsLoading: true })
  return api
    .getConnections()
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

export const changeConnectionsCollapsed = (connectionsCollapsed: boolean) => {
  appStore.setState({ connectionsCollapsed })
}

export { appStore as useAppStore }
