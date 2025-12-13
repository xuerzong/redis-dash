import { isTauri } from '@tauri-apps/api/core'
import { initWebsocket } from './browser/websocket'

if (isTauri()) {
  // do nothing
} else {
  initWebsocket()
}
