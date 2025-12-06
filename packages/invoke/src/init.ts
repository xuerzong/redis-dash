import { initWebsocket } from './browser/websocket'

declare global {
  interface Window {
    __TAURI__: any
  }
}

export const isTauri = () => {
  return Boolean(window.__TAURI__)
}

if (isTauri()) {
  // do nothing
} else {
  initWebsocket()
}
