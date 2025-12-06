import { isTauri } from './init'
import * as broswerApi from './browser/api'
import * as tauriApi from './tauri/api'
import { API } from './types'

let api: API = broswerApi

if (isTauri()) {
  api = tauriApi
}

export default api
